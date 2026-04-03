package com.myweb.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.myweb.entity.LoginAttempt;
import com.myweb.repository.LoginAttemptRepository;

/**
 * Service for logging login attempts to PostgreSQL and providing
 * security analytics for the admin dashboard.
 */
@Service
public class LoginAttemptService {

    private static final Logger log = LoggerFactory.getLogger(LoginAttemptService.class);

    private final LoginAttemptRepository repository;

    public LoginAttemptService(LoginAttemptRepository repository) {
        this.repository = repository;
    }

    /**
     * Log a successful login attempt (async to not slow down login flow).
     */
    @Async
    public void logSuccess(String ip, String username, String userAgent) {
        try {
            repository.save(LoginAttempt.success(ip, username, userAgent));
            log.debug("✅ Login success logged: {} / {}", username, ip);
        } catch (Exception e) {
            log.error("Failed to log login success: {}", e.getMessage());
        }
    }

    /**
     * Log a failed login attempt (async).
     */
    @Async
    public void logFailure(String ip, String username, String reason, String userAgent) {
        try {
            repository.save(LoginAttempt.failure(ip, username, reason, userAgent));
            log.debug("❌ Login failure logged: {} / {} — {}", username, ip, reason);
        } catch (Exception e) {
            log.error("Failed to log login failure: {}", e.getMessage());
        }
    }

    /**
     * Get paginated list of all login attempts (newest first).
     */
    public Page<LoginAttempt> getRecentAttempts(int page, int size) {
        return repository.findAllByOrderByCreatedAtDesc(PageRequest.of(page, size));
    }

    /**
     * Search login attempts by IP or username.
     */
    public Page<LoginAttempt> search(String query, int page, int size) {
        return repository.searchByIpOrUsername(query, PageRequest.of(page, size));
    }

    /**
     * Get security statistics for admin dashboard.
     * Uses ALL-TIME data from PostgreSQL (no time filtering).
     */
    public Map<String, Object> getSecurityStats() {
        Map<String, Object> stats = new LinkedHashMap<>();

        // Total counts (all-time from PostgreSQL)
        long totalFailures = repository.countTotalFailuresAllTime();
        long totalSuccesses = repository.countTotalSuccessesAllTime();
        stats.put("totalFailures", totalFailures);
        stats.put("totalSuccesses", totalSuccesses);
        stats.put("totalAttempts", totalFailures + totalSuccesses);

        // Keep 24h/1h stats for real-time alert indicators (kept for backward compat)
        Instant last24h = Instant.now().minus(24, ChronoUnit.HOURS);
        Instant last1h = Instant.now().minus(1, ChronoUnit.HOURS);
        stats.put("failures24h", repository.countTotalFailuresSince(last24h));
        stats.put("successes24h", repository.countTotalSuccessesSince(last24h));
        stats.put("failures1h", repository.countTotalFailuresSince(last1h));

        // Top attacking IPs (ALL-TIME)
        List<Object[]> topIPs = repository.findTopAttackingIPsAllTime(PageRequest.of(0, 10));
        stats.put("topAttackingIPs", topIPs.stream().map(row -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("ip", row[0]);
            entry.put("count", row[1]);
            return entry;
        }).collect(Collectors.toList()));

        // Top targeted users (ALL-TIME)
        List<Object[]> topUsers = repository.findTopTargetedUsersAllTime(PageRequest.of(0, 10));
        stats.put("topTargetedUsers", topUsers.stream().map(row -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("username", row[0]);
            entry.put("count", row[1]);
            return entry;
        }).collect(Collectors.toList()));

        return stats;
    }
}
