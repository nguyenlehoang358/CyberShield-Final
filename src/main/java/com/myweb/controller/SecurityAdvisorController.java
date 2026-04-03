package com.myweb.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.myweb.entity.SecurityEvent;
import com.myweb.service.SecurityAdvisorService;
import com.myweb.service.SecurityEventService;

/**
 * Security Advisor Controller — Admin API for AI-powered security analysis.
 *
 * Endpoints:
 * GET /api/admin/advisor/dashboard → Dashboard stats + risk score
 * GET /api/admin/advisor/report → AI threat analysis report
 * GET /api/admin/advisor/events → Recent security events
 * GET /api/admin/advisor/events/search → Search events
 * GET /api/admin/advisor/analyze-ip/{ip} → AI analysis of specific IP
 * POST /api/admin/advisor/analyze-event → AI analysis of specific event
 * POST /api/admin/advisor/resolve/{id} → Mark event as resolved
 * POST /api/admin/advisor/log-event → Manually log a security event
 */
@RestController
@RequestMapping("/api/admin/advisor")
@PreAuthorize("hasRole('ADMIN')")
public class SecurityAdvisorController {

    private final SecurityEventService eventService;
    private final SecurityAdvisorService advisorService;

    public SecurityAdvisorController(SecurityEventService eventService,
            SecurityAdvisorService advisorService) {
        this.eventService = eventService;
        this.advisorService = advisorService;
    }

    /**
     * GET /api/admin/advisor/dashboard
     * Dashboard overview: stats, risk score, severity distribution.
     */
    @GetMapping("/dashboard")
    public ResponseEntity<?> getDashboard() {
        return ResponseEntity.ok(eventService.getDashboardStats());
    }

    /**
     * GET /api/admin/advisor/report
     * Generate AI threat analysis report.
     */
    @GetMapping("/report")
    public ResponseEntity<?> getThreatReport() {
        return ResponseEntity.ok(advisorService.generateThreatReport());
    }

    /**
     * POST /api/admin/advisor/insight
     * AI insight for chart data.
     */
    @PostMapping("/insight")
    public ResponseEntity<?> getChartInsight(@RequestBody Map<String, Object> chartData) {
        return ResponseEntity.ok(advisorService.generatePieChartInsight(chartData));
    }

    /**
     * GET /api/admin/advisor/events?limit=50
     * Get recent security events.
     */
    @GetMapping("/events")
    public ResponseEntity<?> getRecentEvents(
            @RequestParam(defaultValue = "50") int limit) {
        List<SecurityEvent> events = eventService.getRecentEvents(limit);
        return ResponseEntity.ok(events.stream().map(this::eventToMap).collect(Collectors.toList()));
    }

    /**
     * GET /api/admin/advisor/events/unresolved
     * Get unresolved security events.
     */
    @GetMapping("/events/unresolved")
    public ResponseEntity<?> getUnresolvedEvents() {
        List<SecurityEvent> events = eventService.getUnresolvedEvents();
        return ResponseEntity.ok(events.stream().map(this::eventToMap).collect(Collectors.toList()));
    }

    /**
     * GET /api/admin/advisor/events/critical
     * Get critical unresolved events.
     */
    @GetMapping("/events/critical")
    public ResponseEntity<?> getCriticalEvents() {
        List<SecurityEvent> events = eventService.getCriticalUnresolved();
        return ResponseEntity.ok(events.stream().map(this::eventToMap).collect(Collectors.toList()));
    }

    /**
     * GET /api/admin/advisor/events/search?q=...&page=0&size=20
     * Search security events.
     */
    @GetMapping("/events/search")
    public ResponseEntity<?> searchEvents(
            @RequestParam String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        // ═══ Input Validation ═══
        if (q == null || q.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Search query is required"));
        }
        if (q.length() > 200) {
            return ResponseEntity.badRequest().body(Map.of("error", "Search query too long (max 200 chars)"));
        }
        size = Math.min(size, 100); // Cap page size
        page = Math.max(page, 0);

        Page<SecurityEvent> result = eventService.searchEvents(q.trim(), page, size);
        Map<String, Object> response = new LinkedHashMap<>();
        response.put("events", result.getContent().stream().map(this::eventToMap).collect(Collectors.toList()));
        response.put("totalElements", result.getTotalElements());
        response.put("totalPages", result.getTotalPages());
        response.put("currentPage", result.getNumber());
        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/admin/advisor/analyze-ip/{ip}
     * AI analysis of a specific IP address.
     */
    @GetMapping("/analyze-ip/{ip}")
    public ResponseEntity<?> analyzeIP(@PathVariable String ip) {
        // ═══ IP Validation ═══
        if (ip == null || !ip.matches("^[0-9a-fA-F.:]+$") || ip.length() > 45) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid IP address format"));
        }
        return ResponseEntity.ok(advisorService.analyzeIP(ip));
    }

    /**
     * POST /api/admin/advisor/analyze-event
     * AI analysis of a specific event by ID.
     * Body: { "eventId": 123 }
     */
    @PostMapping("/analyze-event")
    public ResponseEntity<?> analyzeEvent(@RequestBody Map<String, Long> body) {
        Long eventId = body.get("eventId");
        if (eventId == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "eventId is required"));
        }

        SecurityEvent event = eventService.findById(eventId);
        if (event == null) {
            return ResponseEntity.notFound().build();
        }

        String analysis = advisorService.analyzeEvent(event);
        eventService.updateAiAnalysis(eventId, analysis);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("eventId", eventId);
        result.put("analysis", analysis);
        return ResponseEntity.ok(result);
    }

    /**
     * POST /api/admin/advisor/resolve/{id}
     * Mark a security event as resolved.
     */
    @PostMapping("/resolve/{id}")
    public ResponseEntity<?> resolveEvent(@PathVariable Long id) {
        eventService.resolveEvent(id);
        return ResponseEntity.ok(Map.of("message", "Event resolved", "id", id));
    }

    /**
     * POST /api/admin/advisor/log-event
     * Manually log a security event.
     * Body: { "sourceIp": "...", "eventType": "...", "description": "...",
     * "severity": "HIGH" }
     */
    @PostMapping("/log-event")
    public ResponseEntity<?> logEvent(@RequestBody Map<String, String> body) {
        String ip = body.getOrDefault("sourceIp", "manual");
        String desc = body.getOrDefault("description", "Manual event");
        String severityStr = body.getOrDefault("severity", "MEDIUM");

        SecurityEvent.Severity severity;
        try {
            severity = SecurityEvent.Severity.valueOf(severityStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            severity = SecurityEvent.Severity.MEDIUM;
        }

        eventService.logSuspicious(ip, desc, severity);
        return ResponseEntity.ok(Map.of("message", "Event logged", "severity", severity.name()));
    }

    /**
     * Convert SecurityEvent to Map for JSON response.
     */
    private Map<String, Object> eventToMap(SecurityEvent e) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", e.getId());
        map.put("source", e.getSource());
        map.put("severity", e.getSeverity());
        map.put("eventType", e.getEventType());
        map.put("sourceIp", e.getSourceIp());
        map.put("description", e.getDescription());
        map.put("aiAnalysis", e.getAiAnalysis());
        map.put("resolved", e.getResolved());
        map.put("createdAt", e.getCreatedAt());
        return map;
    }
}
