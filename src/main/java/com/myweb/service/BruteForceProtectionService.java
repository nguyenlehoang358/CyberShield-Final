package com.myweb.service;

import java.time.Instant;
import java.time.Duration;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.myweb.entity.BlockedIpHistory;
import com.myweb.entity.LoginAttempt;
import com.myweb.repository.BlockedIpHistoryRepository;
import com.myweb.repository.LoginAttemptRepository;

/**
 * Brute Force Protection Service — Database-backed (PostgreSQL) tracking.
 * Optimized for Render/Vercel environments without Redis.
 */
@Service
public class BruteForceProtectionService {

    private static final Logger log = LoggerFactory.getLogger(BruteForceProtectionService.class);

    private final SecurityEventService securityEventService;
    private final BlockedIpHistoryRepository blockedIpRepo;
    private final LoginAttemptRepository loginAttemptRepo;
    private final com.myweb.service.SystemSettingService settingService;

    public BruteForceProtectionService(
            @Lazy SecurityEventService securityEventService,
            BlockedIpHistoryRepository blockedIpRepo,
            LoginAttemptRepository loginAttemptRepo,
            com.myweb.service.SystemSettingService settingService) {
        this.securityEventService = securityEventService;
        this.blockedIpRepo = blockedIpRepo;
        this.loginAttemptRepo = loginAttemptRepo;
        this.settingService = settingService;
        log.info("🛡️ BruteForceProtectionService initialized with Database (PostgreSQL) backend.");
    }

    public int getMaxAttempts() {
        return Integer.parseInt(settingService.getSettingValue("defense.auto_ban_threshold", "5"));
    }

    public int getCaptchaThreshold() {
        return Integer.parseInt(settingService.getSettingValue("defense.captcha_threshold", "3"));
    }

    public int getLockDurationMinutes() {
        return Integer.parseInt(settingService.getSettingValue("defense.block_duration_minutes", "60"));
    }

    /**
     * Check if an IP is currently blocked by checking Database history and time.
     */
    public boolean isBlocked(String ip) {
        if (isWhitelisted(ip))
            return false;

        Optional<BlockedIpHistory> latestBlock = blockedIpRepo.findTopByIpAddressOrderByCreatedAtDesc(ip);
        if (latestBlock.isPresent()) {
            BlockedIpHistory block = latestBlock.get();
            // Nếu lý do chứa "_UNBLOCKED" thì coi như đã được gỡ
            if (block.getReason().contains("_UNBLOCKED"))
                return false;

            // Tính toán thời gian hết hạn (Mặc định 1 giờ nếu không xác định được)
            Instant expiry = block.getCreatedAt().plus(Duration.ofMinutes(getLockDurationMinutes()));
            return Instant.now().isBefore(expiry);
        }
        return false;
    }

    /**
     * Check if CAPTCHA should be required (based on 3+ failures in last 10 mins).
     */
    public boolean isCaptchaRequired(String ip) {
        long failures = loginAttemptRepo.countByIpAddressAndStatusAndCreatedAtAfter(
                ip, LoginAttempt.Status.FAILURE, Instant.now().minus(Duration.ofMinutes(10)));
        return failures >= getCaptchaThreshold();
    }

    /**
     * Record a failed login attempt. Returns count in last 1 hour.
     */
    @Transactional
    public long recordFailure(String ip, String email) {
        if (isWhitelisted(ip))
            return 0;

        // Đếm số lần thất bại trong 1 giờ qua từ bảng LoginAttempt
        long failures = loginAttemptRepo.countByIpAddressAndStatusAndCreatedAtAfter(
                ip, LoginAttempt.Status.FAILURE, Instant.now().minus(Duration.ofHours(1)));

        int max = getMaxAttempts();

        if (failures >= max * 10) { // Ví dụ 50 lần -> Chặn 24h
            blockIP(ip, 1440, "BRUTE_FORCE_CRITICAL");
            securityEventService.logIpBlocked(ip, "Critical Brute Force: " + failures + " attempts.");
        } else if (failures >= max) { // 5 lần -> Chặn theo cấu hình (60p)
            blockIP(ip, getLockDurationMinutes(), "REPEATED_LOGIN_FAILURE");
            securityEventService.logBruteForce(ip, "IP blocked after " + failures + " failures.");
        }

        return failures;
    }

    public void recordSuccess(String ip, String email) {
        // Database-backed: Không cần reset thủ công vì we query by time window.
        log.debug("Login success for IP: {}", ip);
    }

    public void blockIP(String ip, long durationMinutes, String reason) {
        blockedIpRepo.save(new BlockedIpHistory(ip, reason));
        log.warn("🚨 IP BLOCKED: {} for {} min. Reason: {}", ip, durationMinutes, reason);
    }

    @Transactional
    public void unblockIP(String ip) {
        List<BlockedIpHistory> history = blockedIpRepo.findByIpAddress(ip);
        for (BlockedIpHistory h : history) {
            if (!h.getReason().contains("_UNBLOCKED")) {
                h.setReason(h.getReason() + "_UNBLOCKED");
            }
        }
        blockedIpRepo.saveAll(history);
        log.info("🔓 IP UNBLOCKED: {}", ip);
    }

    public long getFailureCount(String ip) {
        return loginAttemptRepo.countByIpAddressAndStatusAndCreatedAtAfter(
                ip, LoginAttempt.Status.FAILURE, Instant.now().minus(Duration.ofHours(1)));
    }

    private boolean isWhitelisted(String ip) {
        if (ip == null)
            return false;
        if (ip.startsWith("127.") || ip.equals("0:0:0:0:0:0:0:1") || ip.equals("::1"))
            return true;

        String whitelists = settingService.getSettingValue("defense.ip_whitelist", "");
        for (String wip : whitelists.split(",")) {
            if (wip.trim().equals(ip))
                return true;
        }
        return false;
    }

    public void emergencyUnblockAll() {
        blockedIpRepo.deleteAll();
        log.info("🔥 EMERGENCY: All IP blocks cleared from Database.");
    }

    public List<Map<String, Object>> getBlockedIPsDetails() {
        List<Map<String, Object>> result = new ArrayList<>();
        // Lấy danh sách IP bị chặn (Distinct)
        List<String> blockedIps = blockedIpRepo.findAll().stream()
                .map(BlockedIpHistory::getIpAddress)
                .distinct().toList();

        for (String ip : blockedIps) {
            if (isBlocked(ip)) {
                Map<String, Object> entry = new HashMap<>();
                entry.put("ip", ip);
                entry.put("remainingSeconds", getRemainingBlockTTL(ip));
                entry.put("failureCount", getFailureCount(ip));
                entry.put("reason", "Brute Force Protection");
                result.add(entry);
            }
        }
        return result;
    }

    public long getRemainingBlockTTL(String ip) {
        Optional<BlockedIpHistory> block = blockedIpRepo.findTopByIpAddressOrderByCreatedAtDesc(ip);
        if (block.isPresent() && !block.get().getReason().contains("_UNBLOCKED")) {
            Instant expiry = block.get().getCreatedAt().plus(Duration.ofMinutes(getLockDurationMinutes()));
            long seconds = Duration.between(Instant.now(), expiry).getSeconds();
            return seconds > 0 ? seconds : 0;
        }
        return 0;
    }

    public boolean isRedisAvailable() {
        return false; // Always false now as we use DB
    }
}
