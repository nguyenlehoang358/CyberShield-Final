package com.myweb.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.myweb.entity.BlockedIpHistory;
import com.myweb.entity.LoginAttempt;
import com.myweb.repository.BlockedIpHistoryRepository;
import com.myweb.service.BruteForceProtectionService;
import com.myweb.service.LoginAttemptService;
import com.myweb.service.SocAiChatService;

/**
 * Admin Security Dashboard API.
 * All endpoints require ROLE_ADMIN.
 *
 * Endpoints:
 * GET /api/admin/security/stats → Security statistics
 * GET /api/admin/security/blocked-ips → List blocked IPs
 * POST /api/admin/security/block-ip → Manually block an IP
 * DELETE /api/admin/security/unblock/{ip} → Unblock an IP
 * GET /api/admin/security/login-attempts → Login attempt log
 * GET /api/admin/security/login-attempts/search → Search attempts
 */
@RestController
@RequestMapping("/api/admin/security")
@PreAuthorize("hasRole('ADMIN')")
public class AdminSecurityController {

    private static final Logger log = LoggerFactory.getLogger(AdminSecurityController.class);

    private final BruteForceProtectionService bruteForceService;
    private final LoginAttemptService loginAttemptService;
    private final BlockedIpHistoryRepository blockedIpRepo;
    private final SocAiChatService socAiChatService;

    public AdminSecurityController(BruteForceProtectionService bruteForceService,
            LoginAttemptService loginAttemptService,
            BlockedIpHistoryRepository blockedIpRepo,
            SocAiChatService socAiChatService) {
        this.bruteForceService = bruteForceService;
        this.loginAttemptService = loginAttemptService;
        this.blockedIpRepo = blockedIpRepo;
        this.socAiChatService = socAiChatService;
    }

    /**
     * GET /api/admin/security/stats
     * Security overview statistics for the dashboard.
     */
    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getSecurityStats() {
        Map<String, Object> stats = new LinkedHashMap<>();

        // Login attempt analytics
        stats.putAll(loginAttemptService.getSecurityStats());

        // Currently blocked IPs count
        List<Map<String, Object>> blockedIPs = bruteForceService.getBlockedIPsDetails();
        stats.put("blockedIPsCount", blockedIPs.size());

        // Redis status
        stats.put("redisAvailable", bruteForceService.isRedisAvailable());

        return ResponseEntity.ok(stats);
    }

    /**
     * GET /api/admin/security/blocked-ips
     * Return the permanent block history including AI auto-blocks.
     */
    @GetMapping("/blocked-ips")
    public ResponseEntity<Map<String, Object>> getBlockedIPs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Page<BlockedIpHistory> histories = blockedIpRepo.findAllByOrderByCreatedAtDesc(
                org.springframework.data.domain.PageRequest.of(page, size));

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", histories.getContent());
        response.put("totalElements", histories.getTotalElements());
        response.put("totalPages", histories.getTotalPages());
        response.put("currentPage", histories.getNumber());
        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/admin/security/block-ip
     * Manually block an IP for specified duration.
     * Body: { "ip": "1.2.3.4", "durationMinutes": 60 }
     */
    @PostMapping("/block-ip")
    public ResponseEntity<Map<String, String>> blockIP(@RequestBody Map<String, Object> body) {
        String ip = (String) body.get("ip");
        int duration = body.containsKey("durationMinutes")
                ? ((Number) body.get("durationMinutes")).intValue()
                : 60;

        if (ip == null || ip.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "IP is required"));
        }

        bruteForceService.blockIP(ip, duration, "MANUAL_ADMIN");
        log.info("🔒 Admin manually blocked IP: {} for {} minutes", ip, duration);
        return ResponseEntity.ok(Map.of(
                "message", "IP " + ip + " blocked for " + duration + " minutes",
                "ip", ip));
    }

    /**
     * DELETE /api/admin/security/unblock/{ip}
     * Unblock a specific IP.
     */
    @DeleteMapping("/unblock/{ip}")
    public ResponseEntity<Map<String, String>> unblockIP(@PathVariable String ip) {
        bruteForceService.unblockIP(ip);
        log.info("🔓 Admin unblocked IP: {}", ip);
        return ResponseEntity.ok(Map.of(
                "message", "IP " + ip + " has been unblocked",
                "ip", ip));
    }

    /**
     * GET /api/admin/security/login-attempts?page=0&size=20
     * Paginated list of all login attempts.
     */
    @GetMapping("/login-attempts")
    public ResponseEntity<Map<String, Object>> getLoginAttempts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<LoginAttempt> attempts = loginAttemptService.getRecentAttempts(page, size);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", attempts.getContent());
        response.put("totalElements", attempts.getTotalElements());
        response.put("totalPages", attempts.getTotalPages());
        response.put("currentPage", attempts.getNumber());
        response.put("size", attempts.getSize());

        return ResponseEntity.ok(response);
    }

    /**
     * GET /api/admin/security/login-attempts/search?q=query&page=0&size=20
     * Search login attempts by IP or username.
     */
    @GetMapping("/login-attempts/search")
    public ResponseEntity<Map<String, Object>> searchLoginAttempts(
            @RequestParam("q") String query,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {

        Page<LoginAttempt> attempts = loginAttemptService.search(query, page, size);

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", attempts.getContent());
        response.put("totalElements", attempts.getTotalElements());
        response.put("totalPages", attempts.getTotalPages());
        response.put("currentPage", attempts.getNumber());
        response.put("query", query);

        return ResponseEntity.ok(response);
    }

    /**
     * POST /api/admin/security/ai-chat
     * SOC AI Assistant — Admin issues commands or queries for security analysis.
     * Body: { "command": "Phân tích các IP truy cập" }
     */
    @PostMapping("/ai-chat")
    public ResponseEntity<?> socAiChat(@RequestBody Map<String, String> body) {
        String command = body.get("command");
        if (command == null || command.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Command is required"));
        }
        log.info("🤖 SOC AI Chat from Admin: {}", command.substring(0, Math.min(command.length(), 80)));

        Map<String, Object> result = socAiChatService.processCommand(command);
        return ResponseEntity.ok(result);
    }
}
