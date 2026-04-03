package com.myweb.service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.myweb.dto.AuthResponse;
import com.myweb.dto.LoginRequest;
import com.myweb.dto.RegisterRequest;
import com.myweb.entity.ERole;
import com.myweb.entity.Role;
import com.myweb.entity.User;
import com.myweb.repository.RoleRepository;
import com.myweb.repository.UserRepository;
import com.myweb.security.JwtUtil;

@Service
public class AuthService {

        private final UserRepository userRepository;
        private final RoleRepository roleRepository;
        private final PasswordEncoder passwordEncoder;
        private final JwtUtil jwtUtil;
        private final AuthenticationManager authenticationManager;
        private final MfaService mfaService;
        private final AiSecurityService aiSecurityService;

        // Store verification codes for password reset (email -> {code, expiry})
        private final ConcurrentHashMap<String, VerificationEntry> resetCodes = new ConcurrentHashMap<>();

        private record VerificationEntry(String code, Instant expiry) {
        }

        public AuthService(UserRepository userRepository, RoleRepository roleRepository,
                        PasswordEncoder passwordEncoder,
                        JwtUtil jwtUtil, AuthenticationManager authenticationManager, MfaService mfaService,
                        AiSecurityService aiSecurityService) {
                this.userRepository = userRepository;
                this.roleRepository = roleRepository;
                this.passwordEncoder = passwordEncoder;
                this.jwtUtil = jwtUtil;
                this.authenticationManager = authenticationManager;
                this.mfaService = mfaService;
                this.aiSecurityService = aiSecurityService;
        }

        public AuthResponse login(LoginRequest request) {
                // 1. AI Output Encoding / Input Analysis Threat Check
                // if (aiSecurityService.isPayloadMalicious(request.email())
                // || aiSecurityService.isPayloadMalicious(request.password())) {
                // throw new IllegalArgumentException("AI Defense Blocked: Malicious Payload
                // Detected (SQLi/XSS)");
                // }

                // 2. Behavioral Anomaly Detection
                int currentHour = java.time.LocalTime.now().getHour();
                if (aiSecurityService.isLoginAnomalous(currentHour, 0, 500)) {
                        // Normally we'd grab actual consecutive failures from the DB and duration from
                        // frontend telemetry.
                        throw new IllegalArgumentException("AI Defense Blocked: Suspicious Login Behavior Detected");
                }

                Authentication authentication = authenticationManager.authenticate(
                                new UsernamePasswordAuthenticationToken(request.email(), request.password()));

                org.springframework.security.core.userdetails.User userDetails = (org.springframework.security.core.userdetails.User) authentication
                                .getPrincipal();

                User user = userRepository.findByUsername(userDetails.getUsername())
                                .orElseGet(() -> userRepository.findByEmail(userDetails.getUsername())
                                                .orElseThrow(() -> new RuntimeException("User not found")));

                if (Boolean.TRUE.equals(user.isMfaEnabled())) {
                        // Return temp token or flag. Using valid JWT with "ROLE_PRE_AUTH"
                        String tempToken = jwtUtil.generateToken(user.getUsername(), user.getEmail(), "ROLE_PRE_AUTH");
                        return new AuthResponse(tempToken, user.getUsername(), user.getEmail(),
                                        List.of("ROLE_PRE_AUTH"), true, true, "MFA Required");
                }

                String rolesString = userDetails.getAuthorities().stream()
                                .map(GrantedAuthority::getAuthority)
                                .collect(Collectors.joining(","));

                String token = jwtUtil.generateToken(user.getUsername(), user.getEmail(), rolesString);

                return new AuthResponse(token, user.getUsername(), user.getEmail(),
                                userDetails.getAuthorities().stream().map(GrantedAuthority::getAuthority)
                                                .collect(Collectors.toList()),
                                Boolean.TRUE.equals(user.isMfaEnabled()), false, "Đăng nhập thành công");
        }

        public AuthResponse verifyMfaAndLogin(String username, int code) {
                User user = userRepository.findByUsername(username)
                                .orElseGet(() -> userRepository.findByEmail(username)
                                                .orElseThrow(() -> new RuntimeException("User not found")));

                if (!Boolean.TRUE.equals(user.isMfaEnabled())) {
                        throw new IllegalArgumentException("MFA not enabled for user");
                }

                if (mfaService.verify(user.getMfaSecret(), code)) {
                        String rolesString = user.getRoles().stream()
                                        .map(r -> r.getName().name())
                                        .collect(Collectors.joining(","));

                        String token = jwtUtil.generateToken(user.getUsername(), user.getEmail(), rolesString);
                        return new AuthResponse(
                                        token,
                                        user.getUsername(),
                                        user.getEmail(),
                                        user.getRoles().stream().map(r -> r.getName().name())
                                                        .collect(Collectors.toList()),
                                        true, false, "MFA Verified");
                } else {
                        throw new IllegalArgumentException("Invalid MFA Code");
                }
        }

        public AuthResponse register(RegisterRequest request) {
                // Intercept with AI Microservice before hitting Database mappings
                if (aiSecurityService.isPayloadMalicious(request.username())
                                // || aiSecurityService.isPayloadMalicious(request.email())
                                || (request.phoneNumber() != null
                                                && aiSecurityService.isPayloadMalicious(request.phoneNumber()))) {
                        throw new IllegalArgumentException(
                                        "AI Defense Blocked: Malicious Payload Detected in Registration");
                }

                if (userRepository.existsByEmail(request.email())) {
                        throw new IllegalArgumentException("Email đã được sử dụng");
                }
                if (userRepository.existsByUsername(request.username())) {
                        throw new IllegalArgumentException("Username đã được sử dụng");
                }

                User user = new User();
                user.setUsername(request.username());
                user.setEmail(request.email());
                user.setPassword(passwordEncoder.encode(request.password()));
                if (request.phoneNumber() != null && !request.phoneNumber().isBlank()) {
                        user.setPhoneNumber(request.phoneNumber());
                }

                Role userRole = roleRepository.findByName(ERole.ROLE_USER)
                                .orElseGet(() -> roleRepository.save(new Role(ERole.ROLE_USER)));
                user.addRole(userRole);

                user = userRepository.save(user);

                String rolesString = "ROLE_USER";
                String token = jwtUtil.generateToken(user.getUsername(), user.getEmail(), rolesString);

                return new AuthResponse(token, user.getUsername(), user.getEmail(),
                                List.of("ROLE_USER"), false, false, "Đăng ký thành công");
        }

        /**
         * Forgot password logic:
         * - If user registered via OAuth (Google, Facebook, etc.): generate a 6-digit
         * code
         * and "send" it to the email (simulated - stored in memory)
         * - If user registered manually (no oauthProvider): just confirm email exists
         * and allow direct password reset
         */
        public Map<String, Object> forgotPassword(String email) {
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new IllegalArgumentException("Email không tồn tại trong hệ thống"));

                boolean isOAuthUser = user.getOauthProvider() != null && !user.getOauthProvider().isEmpty();

                if (isOAuthUser) {
                        // Generate 6-digit verification code
                        String code = String.format("%06d", new Random().nextInt(999999));
                        resetCodes.put(email, new VerificationEntry(code, Instant.now().plusSeconds(600))); // 10 min
                                                                                                            // expiry

                        // In production, send email here. For demo, we log + return indicator
                        System.out.println("=== RESET CODE for " + email + ": " + code + " ===");

                        return Map.of(
                                        "requiresCode", true,
                                        "provider", user.getOauthProvider(),
                                        "message", "Mã xác thực đã được gửi về email " + email,
                                        "hint", code // For demo only - remove in production
                        );
                } else {
                        // Manual account - no verification code needed, just allow reset
                        return Map.of(
                                        "requiresCode", false,
                                        "provider", "local",
                                        "message", "Email đã được xác nhận. Vui lòng nhập mật khẩu mới.");
                }
        }

        /**
         * Reset password:
         * - For OAuth users: verify the code first
         * - For manual users: directly reset password
         */
        public Map<String, String> resetPassword(String email, String newPassword, String verificationCode) {
                User user = userRepository.findByEmail(email)
                                .orElseThrow(() -> new IllegalArgumentException("Email không tồn tại trong hệ thống"));

                boolean isOAuthUser = user.getOauthProvider() != null && !user.getOauthProvider().isEmpty();

                if (isOAuthUser) {
                        // Verify the code
                        VerificationEntry entry = resetCodes.get(email);
                        if (entry == null) {
                                throw new IllegalArgumentException("Chưa yêu cầu mã xác thực. Vui lòng thử lại.");
                        }
                        if (Instant.now().isAfter(entry.expiry())) {
                                resetCodes.remove(email);
                                throw new IllegalArgumentException("Mã xác thực đã hết hạn. Vui lòng yêu cầu mã mới.");
                        }
                        if (!entry.code().equals(verificationCode)) {
                                throw new IllegalArgumentException("Mã xác thực không đúng.");
                        }
                        // Code verified, remove it
                        resetCodes.remove(email);
                }

                // Reset password - old password is deleted and replaced with new one
                user.setPassword(passwordEncoder.encode(newPassword));
                user.setUpdatedAt(Instant.now());
                userRepository.save(user);

                return Map.of("message", "Mật khẩu đã được đặt lại thành công!");
        }

        public String generateMfaQr(String username) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                // Always generate new secret for setup
                String secret = mfaService.generateSecret();
                user.setMfaSecret(secret);
                userRepository.save(user); // Save secret but not enabled yet? Or maybe store in cache?
                // For simplicity, save to DB but only enable after verify.
                // But here we rely on isMfaEnabled flag.

                return mfaService.getQrCodeUrl(secret, user.getEmail());
        }

        public void enableMfa(String username, int code) {
                User user = userRepository.findByUsername(username)
                                .orElseThrow(() -> new RuntimeException("User not found"));

                if (mfaService.verify(user.getMfaSecret(), code)) {
                        user.setMfaEnabled(true);
                        userRepository.save(user);
                } else {
                        throw new IllegalArgumentException("Invalid Code");
                }
        }

        public User getUser(String username) {
                return userRepository.findByUsername(username)
                                .orElseGet(() -> userRepository.findByEmail(username)
                                                .orElseThrow(() -> new RuntimeException("User not found")));
        }
}
