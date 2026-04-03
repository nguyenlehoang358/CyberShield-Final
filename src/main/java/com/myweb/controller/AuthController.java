package com.myweb.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.myweb.dto.AuthResponse;
import com.myweb.dto.ForgotPasswordRequest;
import com.myweb.dto.LoginRequest;
import com.myweb.dto.MfaVerificationRequest;
import com.myweb.dto.RegisterRequest;
import com.myweb.dto.ResetPasswordRequest;
import com.myweb.entity.User;
import com.myweb.service.AuthService;
import com.myweb.service.BruteForceProtectionService;
import com.myweb.service.LoginAttemptService;
import com.myweb.service.SecurityEventService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final AuthService authService;
    private final BruteForceProtectionService bruteForceService;
    private final LoginAttemptService loginAttemptService;
    private final SecurityEventService securityEventService;

    public AuthController(AuthService authService,
            BruteForceProtectionService bruteForceService,
            LoginAttemptService loginAttemptService,
            SecurityEventService securityEventService) {
        this.authService = authService;
        this.bruteForceService = bruteForceService;
        this.loginAttemptService = loginAttemptService;
        this.securityEventService = securityEventService;
    }

    @GetMapping("/me")
    public ResponseEntity<Map<String, Object>> me(Authentication auth) {
        if (auth == null || !auth.isAuthenticated()) {
            return ResponseEntity.status(401).build();
        }
        User user = authService.getUser(auth.getName());
        java.util.HashMap<String, Object> response = new java.util.HashMap<>();
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("roles", user.getRoles().stream().map(r -> r.getName().name()).toList());
        response.put("mfaEnabled", Boolean.TRUE.equals(user.isMfaEnabled()));
        response.put("oauthProvider", user.getOauthProvider());
        response.put("oauthEmail", user.getOauthEmail());
        response.put("hasPassword", user.getPassword() != null && !user.getPassword().isEmpty());
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest,
            HttpServletResponse httpResponse) {
        String clientIp = getClientIp(httpRequest);
        String userAgent = httpRequest.getHeader("User-Agent");
        String email = request.email();

        // 1. Check if IP is blocked
        if (bruteForceService.isBlocked(clientIp)) {
            long ttl = bruteForceService.getRemainingBlockTTL(clientIp);
            log.warn("🚫 Blocked IP attempted login: {} → {}", clientIp, email);
            loginAttemptService.logFailure(clientIp, email, "IP_BLOCKED", userAgent);
            securityEventService.logBruteForce(clientIp, "Blocked IP " + clientIp + " attempted login as " + email);
            return ResponseEntity.status(403).body(Map.of(
                    "error", "IP đã bị khóa tạm thời do quá nhiều lần đăng nhập thất bại.",
                    "blocked", true,
                    "remainingSeconds", ttl,
                    "status", 403));
        }

        // 2. Check if CAPTCHA is required (add header for frontend)
        if (bruteForceService.isCaptchaRequired(clientIp)) {
            httpResponse.setHeader("X-Captcha-Required", "true");
        }

        try {
            // 3. Attempt login
            AuthResponse response = authService.login(request);

            if (!response.mfaRequired() && response.token() != null) {
                org.springframework.http.ResponseCookie cookie = org.springframework.http.ResponseCookie
                        .from("jwt", response.token())
                        .httpOnly(true).secure(true).path("/").sameSite("None").maxAge(86400).build();
                httpResponse.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString());
            }

            // 4. Login success → reset counters
            try {
                bruteForceService.recordSuccess(clientIp, email);
                loginAttemptService.logSuccess(clientIp, email, userAgent);
                log.info("✅ Login success: {} from IP {}", email, clientIp);
            } catch (Exception logEx) {
                log.error("⚠️ Failed to log success: {}", logEx.getMessage());
            }

            return ResponseEntity.ok(response);

        } catch (BadCredentialsException e) {
            // 5. Wrong password → record failure with progressive lockout
            long failures = bruteForceService.recordFailure(clientIp, email);
            loginAttemptService.logFailure(clientIp, email, "BAD_CREDENTIALS", userAgent);
            log.warn("❌ Login failed ({}x): {} from IP {}", failures, email, clientIp);

            // Build informative error response
            boolean nowBlocked = bruteForceService.isBlocked(clientIp);
            boolean captchaRequired = bruteForceService.isCaptchaRequired(clientIp);

            if (nowBlocked) {
                long ttl = bruteForceService.getRemainingBlockTTL(clientIp);
                securityEventService.logIpBlocked(clientIp,
                        "Auto-blocked after " + failures + " failures for " + email);
                return ResponseEntity.status(403).body(Map.of(
                        "error",
                        "Tài khoản bị khóa tạm thời do quá nhiều lần thử. Vui lòng chờ " + formatDuration(ttl) + ".",
                        "blocked", true,
                        "remainingSeconds", ttl,
                        "failureCount", failures,
                        "status", 403));
            }

            return ResponseEntity.status(401).body(Map.of(
                    "error", "Email hoặc mật khẩu không đúng.",
                    "blocked", false,
                    "captchaRequired", captchaRequired,
                    "failureCount", failures,
                    "attemptsRemaining", Math.max(0, bruteForceService.getMaxAttempts() - failures),
                    "status", 401));

        } catch (IllegalArgumentException e) {
            if (e.getMessage() != null && e.getMessage().contains("AI Defense Blocked")) {
                log.error("🛑 AI Defense Blocked login from IP: {} - {}", clientIp, e.getMessage());
                bruteForceService.blockIP(clientIp, 1440, "AI_AUTO_BLOCKED"); // 24 hours block
                securityEventService.logIpBlocked(clientIp, "AI SOAR Defense: " + e.getMessage());
                loginAttemptService.logFailure(clientIp, email, "AI_AUTO_BLOCKED", userAgent);
                return ResponseEntity.status(403).body(Map.of(
                        "error", "Quyền truy cập bị từ chối bởi hệ thống bảo vệ AI.",
                        "blocked", true,
                        "status", 403));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            // Generic error (not brute force related)
            loginAttemptService.logFailure(clientIp, email, "ERROR: " + e.getMessage(), userAgent);
            securityEventService.logAuthFailure(clientIp, email, e.getMessage());
            log.error("⚠️ Login error for {}: {}", email, e.getMessage());
            return ResponseEntity.status(401).body(Map.of(
                    "error", e.getMessage(),
                    "status", 401));
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest, HttpServletResponse httpResponse) {
        String clientIp = getClientIp(httpRequest);

        // Block registration from blocked IPs too
        if (bruteForceService.isBlocked(clientIp)) {
            return ResponseEntity.status(403).body(Map.of(
                    "error", "IP bị khóa tạm thời. Vui lòng thử lại sau.",
                    "blocked", true,
                    "status", 403));
        }

        try {
            AuthResponse response = authService.register(request);
            if (response.token() != null) {
                org.springframework.http.ResponseCookie cookie = org.springframework.http.ResponseCookie
                        .from("jwt", response.token())
                        .httpOnly(true).secure(true).path("/").sameSite("None").maxAge(86400).build();
                httpResponse.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString());
            }
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            if (e.getMessage() != null && e.getMessage().contains("AI Defense Blocked")) {
                log.error("🛑 AI Defense Blocked registration from IP: {} - {}", clientIp, e.getMessage());
                bruteForceService.blockIP(clientIp, 1440, "AI_AUTO_BLOCKED"); // Block for 24 hours
                securityEventService.logIpBlocked(clientIp, "AI SOAR Defense: " + e.getMessage());
                return ResponseEntity.status(403).body(Map.of(
                        "error", "Đăng ký bị từ chối bởi hệ thống bảo vệ AI.",
                        "blocked", true,
                        "status", 403));
            }
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<?> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        try {
            Map<String, Object> result = authService.forgotPassword(request.email());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        try {
            Map<String, String> result = authService.resetPassword(
                    request.email(), request.newPassword(), request.verificationCode());
            return ResponseEntity.ok(result);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/mfa/setup")
    public ResponseEntity<Map<String, String>> setupMfa(Authentication auth) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).build();
        String qrUrl = authService.generateMfaQr(auth.getName());
        return ResponseEntity.ok(Map.of("qrCodeUrl", qrUrl));
    }

    @PostMapping("/mfa/enable")
    public ResponseEntity<String> enableMfa(Authentication auth, @RequestBody Map<String, Integer> body) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).build();
        if (!body.containsKey("code"))
            return ResponseEntity.badRequest().body("Code is required");

        authService.enableMfa(auth.getName(), body.get("code"));
        return ResponseEntity.ok("MFA Enabled");
    }

    @PostMapping("/mfa/verify")
    public ResponseEntity<AuthResponse> verifyMfa(Authentication auth,
            @Valid @RequestBody MfaVerificationRequest request,
            HttpServletResponse httpResponse) {
        if (auth == null || !auth.isAuthenticated())
            return ResponseEntity.status(401).build();

        AuthResponse response = authService.verifyMfaAndLogin(auth.getName(), request.code());
        if (response.token() != null) {
            org.springframework.http.ResponseCookie cookie = org.springframework.http.ResponseCookie
                    .from("jwt", response.token())
                    .httpOnly(true).secure(true).path("/").sameSite("None").maxAge(86400).build();
            httpResponse.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString());
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(HttpServletResponse httpResponse) {
        org.springframework.http.ResponseCookie cookie = org.springframework.http.ResponseCookie.from("jwt", "")
                .httpOnly(true).secure(true).path("/").sameSite("None").maxAge(0).build();
        httpResponse.addHeader(org.springframework.http.HttpHeaders.SET_COOKIE, cookie.toString());
        return ResponseEntity.ok(Map.of("message", "Logged out successfully"));
    }

    // ── Helpers ──

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    private String formatDuration(long seconds) {
        if (seconds >= 3600)
            return (seconds / 3600) + " giờ";
        if (seconds >= 60)
            return (seconds / 60) + " phút";
        return seconds + " giây";
    }
}
