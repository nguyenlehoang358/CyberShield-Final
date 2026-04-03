package com.myweb.security;

import java.io.IOException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
public class IpBlacklistFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(IpBlacklistFilter.class);
    private static final String BLOCKED_KEY = "bf:blocked:";

    private final StringRedisTemplate redisTemplate;
    // Inject the service as a lazy bean if possible to avoid circular dep, or just
    // use ApplicationContext
    private final org.springframework.context.ApplicationContext applicationContext;

    public IpBlacklistFilter(StringRedisTemplate redisTemplate,
            org.springframework.context.ApplicationContext applicationContext) {
        this.redisTemplate = redisTemplate;
        this.applicationContext = applicationContext;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {

        String clientIp = getClientIp(request);

        // ALWAYS allow local/whitelist IPs (Emergency fallback for Admin testing)
        if (clientIp != null && (clientIp.startsWith("192.168.") || clientIp.startsWith("127.")
                || clientIp.equals("0:0:0:0:0:0:0:1") || clientIp.equals("::1"))) {
            filterChain.doFilter(request, response);
            return;
        }

        // SEED IPS URL
        if (request.getRequestURI().contains("/api/public/seed-ips")) {
            try {
                com.myweb.repository.BlockedIpHistoryRepository repo = applicationContext
                        .getBean(com.myweb.repository.BlockedIpHistoryRepository.class);
                com.myweb.service.BruteForceProtectionService bfService = applicationContext
                        .getBean(com.myweb.service.BruteForceProtectionService.class);

                // Seed 50 IPs
                java.util.List<com.myweb.entity.BlockedIpHistory> list = new java.util.ArrayList<>();
                for (int i = 1; i <= 50; i++) {
                    String ip = "155.60.2" + (i % 10) + "." + i;
                    // Chặn trên DB
                    com.myweb.entity.BlockedIpHistory b = new com.myweb.entity.BlockedIpHistory();
                    b.setIpAddress(ip);
                    b.setReason(i % 5 == 0 ? "MANUAL_ADMIN" : "AI_AUTO_BLOCKED");
                    b.setCreatedAt(java.time.Instant.now().minus(java.time.Duration.ofMinutes(i * 15)));
                    list.add(b);
                    // Chặn trên Redis luôn
                    bfService.blockIP(ip, 60, b.getReason());
                }
                repo.saveAll(list);

                response.setContentType("application/json;charset=UTF-8");
                response.getWriter()
                        .write("{\"success\": true, \"message\": \"Seed 50 IPs thành công. Hãy kiểm tra Dashboard!\"}");
                return;
            } catch (Exception e) {
                log.error("Seed failed", e);
            }
        }

        // SEED EVENTS URL (For Security Advisor)
        if (request.getRequestURI().contains("/api/public/seed-events")) {
            try {
                com.myweb.repository.SecurityEventRepository eventRepo = applicationContext
                        .getBean(com.myweb.repository.SecurityEventRepository.class);

                java.util.List<com.myweb.entity.SecurityEvent> events = new java.util.ArrayList<>();
                java.time.Instant now = java.time.Instant.now();
                String[] ips = { "192.168.1.100", "45.33.32.156", "203.0.113.42", "185.220.101.55" };

                for (int i = 0; i < 50; i++) {
                    com.myweb.entity.SecurityEvent e = new com.myweb.entity.SecurityEvent();
                    e.setSource(i % 3 == 0 ? com.myweb.entity.SecurityEvent.Source.BRUTE_FORCE
                            : com.myweb.entity.SecurityEvent.Source.SYSTEM);
                    e.setSeverity(i % 10 == 0 ? com.myweb.entity.SecurityEvent.Severity.CRITICAL
                            : (i % 5 == 0 ? com.myweb.entity.SecurityEvent.Severity.HIGH
                                    : com.myweb.entity.SecurityEvent.Severity.MEDIUM));
                    e.setEventType(i % 3 == 0 ? "BRUTE_FORCE_DETECTED" : "SUSPICIOUS_ACTIVITY");
                    e.setSourceIp(ips[i % ips.length]);
                    e.setDescription("Test security event #" + i + ": Suspicious payload detected.");
                    e.setCreatedAt(now.minus(java.time.Duration.ofMinutes(i * 20)));
                    e.setResolved(i % 4 == 0);
                    events.add(e);
                }
                eventRepo.saveAll(events);

                response.setContentType("application/json;charset=UTF-8");
                response.getWriter()
                        .write("{\"success\": true, \"message\": \"Seed 50 Events thành công. Hãy kiểm tra Security Advisor Tab!\"}");
                return;
            } catch (Exception e) {
                log.error("Seed events failed", e);
            }
        }

        // FIX USERS: Assign ROLE_USER + fix NULL created_at
        if (request.getRequestURI().contains("/api/public/fix-users")) {
            try {
                org.springframework.jdbc.core.JdbcTemplate jdbc = applicationContext
                        .getBean(org.springframework.jdbc.core.JdbcTemplate.class);

                // 1. Tìm role_id của ROLE_USER
                Integer roleUserId = jdbc.queryForObject(
                        "SELECT id FROM roles WHERE name = 'ROLE_USER'", Integer.class);

                int rolesAdded = 0;
                if (roleUserId != null) {
                    // 2. Gán ROLE_USER cho tất cả user chưa có bất kỳ role nào
                    rolesAdded = jdbc.update(
                            "INSERT INTO user_roles (user_id, role_id) " +
                                    "SELECT u.id, ? FROM users u " +
                                    "WHERE NOT EXISTS (SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id)",
                            roleUserId);
                }

                // 3. Fix created_at NULL → NOW()
                int datesFixed = jdbc.update(
                        "UPDATE users SET created_at = NOW() WHERE created_at IS NULL");

                // 4. Fix updated_at NULL → NOW()
                int updatedFixed = jdbc.update(
                        "UPDATE users SET updated_at = NOW() WHERE updated_at IS NULL");

                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write(
                        "{\"success\": true, \"rolesAdded\": " + rolesAdded
                                + ", \"datesFixed\": " + datesFixed
                                + ", \"updatedAtFixed\": " + updatedFixed
                                + ", \"message\": \"Đã gán ROLE_USER và sửa Invalid Date thành công!\"}");
                return;
            } catch (Exception e) {
                log.error("Fix users failed", e);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write("{\"success\": false, \"error\": \"" + e.getMessage() + "\"}");
                return;
            }
        }
        // EMERGENCY UNBLOCK ALL URL
        if (request.getRequestURI().contains("/api/public/emergency-unblock")) {
            try {
                com.myweb.service.BruteForceProtectionService bfService = applicationContext
                        .getBean(com.myweb.service.BruteForceProtectionService.class);
                bfService.emergencyUnblockAll(); // This wipes Redis and Database blocks
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write(
                        "{\"success\": true, \"message\": \"Đã bỏ chặn toàn bộ IP trên Database và hệ thống Redis thành công. Bạn có thể đăng nhập lại ngay!\"}");
                return;
            } catch (Exception e) {
                log.error("Emergency unblock failed via API", e);
            }
        }

        try {
            com.myweb.service.SystemSettingService settingService = applicationContext
                    .getBean(com.myweb.service.SystemSettingService.class);
            if (settingService.isMaintenanceMode()) {
                String uri = request.getRequestURI();
                if (!uri.startsWith("/api/auth") && !uri.startsWith("/api/admin")) {
                    response.setStatus(HttpServletResponse.SC_SERVICE_UNAVAILABLE);
                    response.setContentType("application/json;charset=UTF-8");
                    response.getWriter().write(
                            "{\"error\": \"Hệ thống đang bảo trì do nâng cấp bảo mật. Vui lòng quay lại sau.\", \"status\": 503}");
                    return;
                }
            }
        } catch (Exception e) {
            log.warn("Failed to check maintenance mode: {}", e.getMessage());
        }

        try {
            // Check if IP exists in Redis Blacklist
            if (Boolean.TRUE.equals(redisTemplate.hasKey(BLOCKED_KEY + clientIp))) {
                log.warn("🚨 SOAR Defense: Blocked IP {} attempted to access {}", clientIp, request.getRequestURI());

                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                response.setContentType("application/json;charset=UTF-8");
                response.getWriter().write(
                        "{\"error\": \"Quyền truy cập bị từ chối: IP của bạn đã bị khóa do vi phạm bảo mật.\", \"status\": 403}");
                return; // Abort request
            }
        } catch (Exception e) {
            log.error("Redis check failed in IpBlacklistFilter: {}", e.getMessage());
            // Fail open to avoid blocking valid traffic if Redis crashes
        }

        filterChain.doFilter(request, response);
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
