package com.myweb.service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import com.myweb.entity.SecurityEvent;
import com.myweb.entity.SecurityEvent.Severity;
import com.myweb.repository.SecurityEventRepository;

/**
 * Security Event Service — logs, queries, and analyzes security events.
 * Works with SecurityAdvisorService for AI-powered threat analysis.
 */
@Service
public class SecurityEventService {

    private static final Logger log = LoggerFactory.getLogger(SecurityEventService.class);
    private static final long STATS_CACHE_TTL_MS = 30_000; // 30 seconds

    private final SecurityEventRepository repository;
    private final NotificationService notificationService;

    // Simple in-memory cache for dashboard stats
    private volatile Map<String, Object> cachedStats;
    private volatile long cacheTimestamp;

    public SecurityEventService(SecurityEventRepository repository, NotificationService notificationService) {
        this.repository = repository;
        this.notificationService = notificationService;
    }

    // ═══════════════════════════════════════════════
    // EVENT LOGGING (async to not block main flow)
    // ═══════════════════════════════════════════════

    @Async
    public void logBruteForce(String ip, String details) {
        SecurityEvent event = SecurityEvent.bruteForce(ip, details);
        repository.save(event);
        log.warn("SECURITY EVENT [BRUTE_FORCE] IP={} - {}", ip, details);
        notificationService.sendSecurityAlert(event);
    }

    @Async
    public void logRateLimit(String ip, String details) {
        SecurityEvent event = SecurityEvent.rateLimit(ip, details);
        repository.save(event);
        log.warn("SECURITY EVENT [RATE_LIMIT] IP={} - {}", ip, details);
        notificationService.sendSecurityAlert(event);
    }

    @Async
    public void logAuthFailure(String ip, String username, String reason) {
        SecurityEvent event = SecurityEvent.authFailure(ip, username, reason);
        repository.save(event);
        notificationService.sendSecurityAlert(event);
    }

    @Async
    public void logIpBlocked(String ip, String reason) {
        SecurityEvent event = SecurityEvent.ipBlocked(ip, reason);
        repository.save(event);
        log.warn("SECURITY EVENT [IP_BLOCKED] IP={} - {}", ip, reason);
        notificationService.sendSecurityAlert(event);
    }

    @Async
    public void logSuspicious(String ip, String description, Severity severity) {
        SecurityEvent event = SecurityEvent.suspiciousActivity(ip, description, severity);
        repository.save(event);
        log.warn("SECURITY EVENT [SUSPICIOUS] IP={} severity={} - {}", ip, severity, description);
        notificationService.sendSecurityAlert(event);
    }

    // ═══════════════════════════════════════════════
    // QUERIES
    // ═══════════════════════════════════════════════

    public List<SecurityEvent> getRecentEvents(int limit) {
        return repository.findTop50ByOrderByCreatedAtDesc()
                .stream().limit(limit).collect(Collectors.toList());
    }

    public List<SecurityEvent> getUnresolvedEvents() {
        return repository.findByResolvedFalseOrderByCreatedAtDesc();
    }

    public List<SecurityEvent> getCriticalUnresolved() {
        return repository.findCriticalUnresolved();
    }

    public List<SecurityEvent> getEventsSince(Instant since) {
        return repository.findByCreatedAtAfterOrderByCreatedAtDesc(since);
    }

    public List<SecurityEvent> getEventsForIp(String ip) {
        return repository.findBySourceIpOrderByCreatedAtDesc(ip);
    }

    public Page<SecurityEvent> searchEvents(String query, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return repository.findBySourceIpContainingOrDescriptionContainingIgnoreCase(query, query, pageable);
    }

    public void resolveEvent(Long id) {
        repository.findById(id).ifPresent(event -> {
            event.setResolved(true);
            repository.save(event);
            log.info("Security event {} resolved", id);
        });
    }

    public void updateAiAnalysis(Long id, String analysis) {
        repository.findById(id).ifPresent(event -> {
            event.setAiAnalysis(Map.of("analysis", analysis));
            repository.save(event);
        });
    }

    /**
     * Find a single event by ID (direct lookup, no full-table scan).
     */
    public SecurityEvent findById(Long id) {
        return repository.findById(id).orElse(null);
    }

    // ═══════════════════════════════════════════════
    // ANALYTICS (for dashboard)
    // ═══════════════════════════════════════════════

    /**
     * Get comprehensive security statistics for the dashboard.
     * Uses ALL-TIME data from PostgreSQL (no time filtering for display).
     */
    public Map<String, Object> getDashboardStats() {
        // Check cache first
        if (cachedStats != null && (System.currentTimeMillis() - cacheTimestamp) < STATS_CACHE_TTL_MS) {
            return cachedStats;
        }

        Map<String, Object> stats = new LinkedHashMap<>();

        // Total counts (all-time)
        long totalEvents = repository.count();
        stats.put("totalEvents", totalEvents);
        stats.put("unresolvedCount", repository.countByResolvedFalse());
        stats.put("criticalCount", repository.countBySeverity(Severity.CRITICAL));
        stats.put("highCount", repository.countBySeverity(Severity.HIGH));

        // Severity distribution (ALL-TIME)
        List<Object[]> severityCounts = repository.countBySeverityAllTime();
        Map<String, Long> severityMap = new LinkedHashMap<>();
        for (Object[] row : severityCounts) {
            severityMap.put(row[0].toString(), (Long) row[1]);
        }
        stats.put("severityDistribution", severityMap);

        // Event type distribution (ALL-TIME)
        List<Object[]> typeCounts = repository.countByEventTypeAllTime();
        Map<String, Long> typeMap = new LinkedHashMap<>();
        for (Object[] row : typeCounts) {
            typeMap.put((String) row[0], (Long) row[1]);
        }
        stats.put("eventTypes", typeMap);

        // Top attacking IPs (ALL-TIME)
        List<Object[]> topIPs = repository.topAttackingIPsAllTime(PageRequest.of(0, 10));
        List<Map<String, Object>> ipList = topIPs.stream().map(row -> {
            Map<String, Object> ip = new LinkedHashMap<>();
            ip.put("ip", row[0]);
            ip.put("count", row[1]);
            return ip;
        }).collect(Collectors.toList());
        stats.put("topAttackingIPs", ipList);

        // Keep 1h events for real-time risk score
        Instant last1h = Instant.now().minus(1, ChronoUnit.HOURS);
        long eventsLastHour = repository.findByCreatedAtAfterOrderByCreatedAtDesc(last1h).size();
        stats.put("eventsLastHour", eventsLastHour);
        stats.put("events24h", totalEvents); // now shows all events

        // Risk score (computed from all-time severity + recent frequency)
        stats.put("riskScore", calculateRiskScore(severityMap, eventsLastHour));

        // Cache the result
        cachedStats = stats;
        cacheTimestamp = System.currentTimeMillis();

        return stats;
    }

    /**
     * Calculate an overall risk score (0-100) based on recent events.
     */
    private int calculateRiskScore(Map<String, Long> severityMap, long eventsLastHour) {
        int score = 0;

        // Weight by severity
        score += severityMap.getOrDefault("CRITICAL", 0L) * 25;
        score += severityMap.getOrDefault("HIGH", 0L) * 10;
        score += severityMap.getOrDefault("MEDIUM", 0L) * 3;
        score += severityMap.getOrDefault("LOW", 0L) * 1;

        // Event frequency boost
        if (eventsLastHour > 50)
            score += 20;
        else if (eventsLastHour > 20)
            score += 10;
        else if (eventsLastHour > 10)
            score += 5;

        return Math.min(score, 100);
    }

    /**
     * Build a text summary of recent security events for AI analysis.
     */
    public String buildEventSummaryForAI() {
        Instant last24h = Instant.now().minus(24, ChronoUnit.HOURS);
        List<SecurityEvent> events = repository.findByCreatedAtAfterOrderByCreatedAtDesc(last24h);

        if (events.isEmpty()) {
            return "Không có sự kiện bảo mật nào trong 24 giờ qua.";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("=== BÁO CÁO SỰ KIỆN BẢO MẬT 24 GIỜ QUA ===\n");
        sb.append("Tổng số sự kiện: ").append(events.size()).append("\n\n");

        // Count by severity
        Map<Severity, Long> severityCounts = events.stream()
                .collect(Collectors.groupingBy(SecurityEvent::getSeverity, Collectors.counting()));
        sb.append("Phân bổ mức độ:\n");
        severityCounts.forEach((sev, cnt) -> sb.append("  - ").append(sev).append(": ").append(cnt).append("\n"));
        sb.append("\n");

        // Count by type
        Map<String, Long> typeCounts = events.stream()
                .collect(Collectors.groupingBy(SecurityEvent::getEventType, Collectors.counting()));
        sb.append("Loại sự kiện:\n");
        typeCounts.forEach((type, cnt) -> sb.append("  - ").append(type).append(": ").append(cnt).append("\n"));
        sb.append("\n");

        // Top IPs
        Map<String, Long> ipCounts = events.stream()
                .filter(e -> e.getSourceIp() != null)
                .collect(Collectors.groupingBy(SecurityEvent::getSourceIp, Collectors.counting()));
        sb.append("Top IP nguồn:\n");
        ipCounts.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .forEach(entry -> sb.append("  - ").append(entry.getKey()).append(": ").append(entry.getValue())
                        .append(" events\n"));
        sb.append("\n");

        // Recent critical/high events (last 10)
        sb.append("Sự kiện nghiêm trọng gần đây:\n");
        events.stream()
                .filter(e -> e.getSeverity() == Severity.HIGH || e.getSeverity() == Severity.CRITICAL)
                .limit(10)
                .forEach(e -> sb.append("  [").append(e.getSeverity()).append("] ")
                        .append(e.getEventType()).append(" | IP: ").append(e.getSourceIp())
                        .append(" | ").append(e.getDescription()).append("\n"));

        return sb.toString();
    }

    /**
     * Auto resolve minor events (LOW, SAFE) as configured by AI settings.
     */
    public void autoResolveMinorEvents() {
        List<SecurityEvent> events = repository.findAll(Sort.by(Sort.Direction.DESC, "createdAt"))
                .stream()
                .filter(e -> !Boolean.TRUE.equals(e.getResolved()) && e.getSeverity() == Severity.LOW)
                .collect(Collectors.toList());

        if (!events.isEmpty()) {
            for (SecurityEvent event : events) {
                event.setResolved(true);
                event.setResolvedAt(Instant.now());
                event.setResolutionNotes("Auto-resolved by CyberShield AI (Minor threshold matched).");
            }
            repository.saveAll(events);
            log.info("🤖 AI Advisor auto-resolved {} minor security events.", events.size());

            // Invalidate cache
            cachedStats = null;
        }
    }
}
