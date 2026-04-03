package com.myweb.config;

import java.io.IOException;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.myweb.service.BruteForceProtectionService;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Brute Force Filter — First line of defense.
 * Runs BEFORE RateLimitFilter and JwtAuthFilter.
 *
 * Checks if the client IP is in the Redis blocklist.
 * If blocked, immediately returns 403 Forbidden.
 */
@Component
@Order(1) // Run first
public class BruteForceFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(BruteForceFilter.class);

    private final BruteForceProtectionService bruteForceService;
    private final ObjectMapper objectMapper;

    public BruteForceFilter(BruteForceProtectionService bruteForceService, ObjectMapper objectMapper) {
        this.bruteForceService = bruteForceService;
        this.objectMapper = objectMapper;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String clientIp = getClientIp(httpRequest);
        String path = httpRequest.getRequestURI();

        // Only check blocking for API endpoints
        if (path.startsWith("/api/")) {
            if (bruteForceService.isBlocked(clientIp)) {
                log.warn("🚫 Blocked IP attempted access: {} → {}", clientIp, path);
                httpResponse.setStatus(HttpServletResponse.SC_FORBIDDEN);
                httpResponse.setContentType("application/json;charset=UTF-8");
                httpResponse.getWriter().write(objectMapper.writeValueAsString(
                        Map.of(
                                "error", "Your IP has been temporarily blocked due to suspicious activity.",
                                "status", 403,
                                "blocked", true)));
                return;
            }

            // Signal if CAPTCHA is required (frontend will check this header)
            if (path.startsWith("/api/auth/login") && bruteForceService.isCaptchaRequired(clientIp)) {
                httpResponse.setHeader("X-Captcha-Required", "true");
            }
        }

        chain.doFilter(request, response);
    }

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
}
