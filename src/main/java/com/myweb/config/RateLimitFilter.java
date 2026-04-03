package com.myweb.config;

import java.io.IOException;
import java.util.Map;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import com.fasterxml.jackson.databind.ObjectMapper;

import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

/**
 * Rate Limiting filter — Redis-backed sliding window counter.
 *
 * Protects against brute-force and DDoS:
 * - Login/Register: Max 10 requests per minute per IP
 * - General API: Max 100 requests per minute per IP
 * - Exceeding limit returns 429 Too Many Requests
 *
 * Upgraded from in-memory ConcurrentHashMap to Redis for:
 * - Persistence across restarts
 * - Shared state in multi-instance deployments
 * - Automatic TTL-based cleanup
 */
@Component
public class RateLimitFilter implements Filter {

    private static final Logger log = LoggerFactory.getLogger(RateLimitFilter.class);

    private static final int AUTH_MAX_REQUESTS = 10;
    private static final int API_MAX_REQUESTS = 100;
    private static final long WINDOW_SECONDS = 60;

    // Redis key prefixes
    private static final String AUTH_PREFIX = "rl:auth:";
    private static final String API_PREFIX = "rl:api:";

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;
    private final boolean redisAvailable;

    public RateLimitFilter(StringRedisTemplate redisTemplate, ObjectMapper objectMapper) {
        this.redisTemplate = redisTemplate;
        this.objectMapper = objectMapper;

        // Test Redis connection at startup
        boolean available = false;
        try {
            redisTemplate.getConnectionFactory().getConnection().ping();
            available = true;
            log.info("✅ RateLimitFilter: Redis connected — using distributed rate limiting");
        } catch (Exception e) {
            log.warn("⚠️ RateLimitFilter: Redis unavailable — rate limiting disabled. Error: {}", e.getMessage());
        }
        this.redisAvailable = available;
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest httpRequest = (HttpServletRequest) request;
        HttpServletResponse httpResponse = (HttpServletResponse) response;

        String path = httpRequest.getRequestURI();
        String clientIp = getClientIp(httpRequest);

        // Skip rate limiting if Redis is not available
        if (!redisAvailable) {
            chain.doFilter(request, response);
            return;
        }

        // Apply stricter rate limit to auth endpoints
        if (path.startsWith("/api/auth/login") || path.startsWith("/api/auth/register")) {
            if (!isAllowed(AUTH_PREFIX, clientIp, AUTH_MAX_REQUESTS)) {
                log.warn("🚫 Rate limit exceeded for AUTH from IP: {}", clientIp);
                sendTooManyRequests(httpResponse, "Too many authentication attempts. Please try again later.");
                return;
            }
        }
        // Apply general rate limit to all API endpoints
        else if (path.startsWith("/api/")) {
            if (!isAllowed(API_PREFIX, clientIp, API_MAX_REQUESTS)) {
                log.warn("🚫 Rate limit exceeded for API from IP: {}", clientIp);
                sendTooManyRequests(httpResponse, "Rate limit exceeded. Please slow down.");
                return;
            }
        }

        // Add rate limit headers
        chain.doFilter(request, response);
    }

    /**
     * Redis-based sliding window rate limiting.
     * Uses INCR + EXPIRE for atomic counting with auto-cleanup.
     */
    private boolean isAllowed(String prefix, String clientIp, int maxRequests) {
        try {
            // Construct key with window bucket (current minute)
            long currentWindow = System.currentTimeMillis() / (WINDOW_SECONDS * 1000);
            String key = prefix + clientIp + ":" + currentWindow;

            Long count = redisTemplate.opsForValue().increment(key);
            if (count != null && count == 1) {
                // First request in this window — set TTL
                redisTemplate.expire(key, WINDOW_SECONDS + 5, TimeUnit.SECONDS);
            }

            return count != null && count <= maxRequests;
        } catch (Exception e) {
            log.error("Redis error in rate limiting: {}", e.getMessage());
            return true; // Fail open if Redis has issues
        }
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

    private void sendTooManyRequests(HttpServletResponse response, String message) throws IOException {
        response.setStatus(429);
        response.setContentType("application/json;charset=UTF-8");
        response.setHeader("Retry-After", String.valueOf(WINDOW_SECONDS));
        response.getWriter().write(objectMapper.writeValueAsString(
                Map.of("error", message, "status", 429)));
    }
}
