package com.myweb.config;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicLong;

import org.springframework.stereotype.Component;

/**
 * Simple in-memory rate limiter for AI chat endpoints.
 * Limits requests per IP to prevent abuse of costly LLM calls.
 *
 * Default: 20 requests per minute per IP.
 * Configurable via constructor.
 */
@Component
public class AIRateLimiter {

    private static final int MAX_REQUESTS = 20;
    private static final long WINDOW_MS = 60_000; // 1 minute
    private static final int CLEANUP_THRESHOLD = 1000;

    private final Map<String, TokenBucket> buckets = new ConcurrentHashMap<>();

    /**
     * Check if a request from the given IP is allowed.
     * 
     * @return true if the request is allowed
     */
    public boolean isAllowed(String clientIp) {
        cleanupIfNeeded();
        TokenBucket bucket = buckets.computeIfAbsent(clientIp, k -> new TokenBucket());
        return bucket.tryConsume();
    }

    /**
     * Get remaining requests for the given IP.
     */
    public int getRemaining(String clientIp) {
        TokenBucket bucket = buckets.get(clientIp);
        if (bucket == null)
            return MAX_REQUESTS;
        return bucket.getRemaining();
    }

    /**
     * Get time until the rate limit resets (seconds).
     */
    public long getResetSeconds(String clientIp) {
        TokenBucket bucket = buckets.get(clientIp);
        if (bucket == null)
            return 0;
        return bucket.getResetSeconds();
    }

    /**
     * Cleanup old entries to prevent memory leak.
     */
    private void cleanupIfNeeded() {
        if (buckets.size() > CLEANUP_THRESHOLD) {
            long now = System.currentTimeMillis();
            buckets.entrySet().removeIf(e -> now - e.getValue().windowStart.get() > WINDOW_MS * 2);
        }
    }

    /**
     * Simple token bucket per client.
     */
    private static class TokenBucket {
        private final AtomicInteger count = new AtomicInteger(0);
        private final AtomicLong windowStart = new AtomicLong(System.currentTimeMillis());

        boolean tryConsume() {
            long now = System.currentTimeMillis();
            long start = windowStart.get();

            // Reset window if expired
            if (now - start > WINDOW_MS) {
                windowStart.set(now);
                count.set(1);
                return true;
            }

            // Check limit
            return count.incrementAndGet() <= MAX_REQUESTS;
        }

        int getRemaining() {
            long now = System.currentTimeMillis();
            if (now - windowStart.get() > WINDOW_MS)
                return MAX_REQUESTS;
            return Math.max(0, MAX_REQUESTS - count.get());
        }

        long getResetSeconds() {
            long elapsed = System.currentTimeMillis() - windowStart.get();
            if (elapsed >= WINDOW_MS)
                return 0;
            return (WINDOW_MS - elapsed) / 1000;
        }
    }
}
