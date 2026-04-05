package com.myweb.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.myweb.entity.BlockedIpHistory;
import com.myweb.entity.LoginAttempt;
import com.myweb.repository.BlockedIpHistoryRepository;
import com.myweb.repository.LoginAttemptRepository;

/**
 * SOC AI Chat Service — Security Operations Center Assistant.
 *
 * Handles two types of Admin commands:
 * 1. QUERY: "Phân tích IP", "Thống kê đăng nhập"... → queries DB, sends to
 * Ollama
 * 2. ACTION: "Chặn IP 192.168.1.1" → extracts IP, blocks via Redis+PostgreSQL
 */
@Service
public class SocAiChatService {

    private static final Logger log = LoggerFactory.getLogger(SocAiChatService.class);

    // Regex to detect "block IP" commands in Vietnamese or English
    private static final Pattern BLOCK_IP_PATTERN = Pattern.compile(
            "(?:ch[aặ]n|block|kh[oó]a|ban)\\s+(?:ip\\s+)?([0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3})",
            Pattern.CASE_INSENSITIVE);

    private final OllamaLabMentorService ollamaLabMentorService;
    private final LoginAttemptRepository loginAttemptRepo;
    private final BlockedIpHistoryRepository blockedIpRepo;
    private final BruteForceProtectionService bruteForceService;

    public SocAiChatService(OllamaLabMentorService ollamaLabMentorService,
            LoginAttemptRepository loginAttemptRepo,
            BlockedIpHistoryRepository blockedIpRepo,
            BruteForceProtectionService bruteForceService) {
        this.ollamaLabMentorService = ollamaLabMentorService;
        this.loginAttemptRepo = loginAttemptRepo;
        this.blockedIpRepo = blockedIpRepo;
        this.bruteForceService = bruteForceService;
    }

    /**
     * Process an Admin's SOC command.
     * Returns a structured response with the AI's analysis or action result.
     */
    public Map<String, Object> processCommand(String command) {
        Map<String, Object> result = new LinkedHashMap<>();
        long startTime = System.currentTimeMillis();

        try {
            // ═══ CASE 2: Action Command — Block IP ═══
            Matcher blockMatcher = BLOCK_IP_PATTERN.matcher(command);
            if (blockMatcher.find()) {
                String targetIp = blockMatcher.group(1);
                return executeBlockIp(targetIp, result);
            }

            // ═══ CASE 1: Query Command — Analyze with AI ═══
            return executeAiAnalysis(command, result, startTime);

        } catch (Exception e) {
            log.error("SOC AI Chat error: {}", e.getMessage());
            result.put("type", "error");
            result.put("response", "❌ Lỗi hệ thống SOC: " + e.getMessage());
            return result;
        }
    }

    /**
     * CASE 2: Extract IP and block it via Redis + PostgreSQL.
     */
    private Map<String, Object> executeBlockIp(String targetIp, Map<String, Object> result) {
        log.info("🔒 SOC AI: Admin issued block command for IP: {}", targetIp);

        // Block for 24 hours via existing service (writes to Redis + PostgreSQL)
        bruteForceService.blockIP(targetIp, 1440, "SOC_AI_ADMIN_BLOCK");

        result.put("type", "action");
        result.put("action", "BLOCK_IP");
        result.put("targetIp", targetIp);
        result.put("response", String.format(
                "✅ **Đã chặn IP thành công!**\n\n"
                        + "🔒 **IP:** `%s`\n"
                        + "⏱️ **Thời gian:** 24 giờ (1440 phút)\n"
                        + "📝 **Lý do:** SOC AI Admin Block\n"
                        + "💾 **Lưu trữ:** Redis (real-time) + PostgreSQL (permanent)\n\n"
                        + "IP đã bị đưa vào danh sách đen. Mọi request từ IP này sẽ bị từ chối 403.",
                targetIp));
        return result;
    }

    /**
     * CASE 1: Query DB for context, build prompt, send to Ollama.
     */
    private Map<String, Object> executeAiAnalysis(String command, Map<String, Object> result, long startTime) {
        // Step 1: Gather security context from PostgreSQL
        String securityContext = buildSecurityContext();

        // Step 2: Build the SOC-specific prompt
        String prompt = buildSocPrompt(securityContext, command);

        log.info("🧠 SOC AI: Sending analysis request to Cloud AI (prompt={}chars)", prompt.length());

        // Step 3: Call AI via the centralized service (HF Cloud/Qwen 2.5-7B)
        Map<String, Object> aiResult = ollamaLabMentorService.callAI(prompt);
        String aiResponse = (String) aiResult.get("reply");

        long elapsed = System.currentTimeMillis() - startTime;

        result.put("type", "analysis");
        result.put("response", aiResponse);
        result.put("responseTimeMs", elapsed);
        result.put("model", "Cloud AI - Qwen 2.5-7B");
        return result;
    }

    /**
     * Query PostgreSQL for recent login attempts and blocked IPs
     * to inject as context into the AI prompt.
     */
    private String buildSecurityContext() {
        StringBuilder ctx = new StringBuilder();

        // Recent login attempts (reduced to 15 to save LLM context window/speed up
        // local model)
        List<LoginAttempt> recentAttempts = loginAttemptRepo
                .findAllByOrderByCreatedAtDesc(PageRequest.of(0, 15))
                .getContent();

        ctx.append("=== DỮ LIỆU ĐĂNG NHẬP GẦN ĐÂY (15 bản ghi mới nhất) ===\n");
        if (recentAttempts.isEmpty()) {
            ctx.append("Chưa có dữ liệu đăng nhập.\n\n");
        } else {
            long failCount = recentAttempts.stream().filter(a -> !Boolean.TRUE.equals(a.getSuccess())).count();
            long successCount = recentAttempts.stream().filter(a -> Boolean.TRUE.equals(a.getSuccess())).count();
            ctx.append(String.format("Tổng: %d | Thành công: %d | Thất bại: %d\n",
                    recentAttempts.size(), successCount, failCount));

            ctx.append("Chi tiết:\n");
            for (LoginAttempt a : recentAttempts) {
                ctx.append(String.format("  [%s] IP=%s, User=%s, %s%s\n",
                        a.getCreatedAt(),
                        a.getIpAddress(),
                        a.getUsername() != null ? a.getUsername() : "N/A",
                        Boolean.TRUE.equals(a.getSuccess()) ? "✅ Thành công" : "❌ Thất bại",
                        a.getFailureReason() != null ? " (" + a.getFailureReason() + ")" : ""));
            }
            ctx.append("\n");
        }

        // Top attacking IPs (ALL-TIME) - limited to Top 5
        List<Object[]> topIPs = loginAttemptRepo.findTopAttackingIPsAllTime(PageRequest.of(0, 5));
        ctx.append("=== TOP 5 IP TẤN CÔNG (TOÀN BỘ) ===\n");
        if (topIPs.isEmpty()) {
            ctx.append("Không có IP tấn công.\n\n");
        } else {
            for (Object[] row : topIPs) {
                ctx.append(String.format("  IP=%s → %s lần thất bại\n", row[0], row[1]));
            }
            ctx.append("\n");
        }

        // Recent blocked IPs - scaled down to 5
        List<BlockedIpHistory> blockedHistory = blockedIpRepo
                .findAllByOrderByCreatedAtDesc(PageRequest.of(0, 5))
                .getContent();

        ctx.append("=== LỊCH SỬ IP BỊ CHẶN (5 bản ghi mới nhất) ===\n");
        if (blockedHistory.isEmpty()) {
            ctx.append("Chưa có IP nào bị chặn.\n\n");
        } else {
            for (BlockedIpHistory b : blockedHistory) {
                ctx.append(String.format("  [%s] IP=%s, Lý do=%s\n",
                        b.getCreatedAt(), b.getIpAddress(), b.getReason()));
            }
            ctx.append("\n");
        }

        // Aggregated stats (ALL-TIME)
        long totalFailures = loginAttemptRepo.countTotalFailuresAllTime();
        long totalSuccesses = loginAttemptRepo.countTotalSuccessesAllTime();
        ctx.append(String.format("=== THỐNG KÊ TỔNG ===\nThất bại: %d | Thành công: %d\n\n", totalFailures,
                totalSuccesses));

        return ctx.toString();
    }

    /**
     * Build the SOC-specific system prompt with injected security data.
     */
    private String buildSocPrompt(String securityContext, String adminCommand) {
        return "Bạn là SOC AI Assistant (Security Operations Center) của hệ thống CyberShield.\n"
                + "Vai trò: Phân tích log bảo mật, đánh giá rủi ro IP, dự đoán tấn công.\n\n"
                + "QUY TẮC:\n"
                + "1. Phân tích DỮ LIỆU THỰC bên dưới để trả lời câu hỏi Admin.\n"
                + "2. Đánh giá mức độ rủi ro: 🟢 Thấp | 🟡 Trung bình | 🔴 Cao | ⛔ Nghiêm trọng\n"
                + "3. Đề xuất hành động cụ thể (chặn IP, giám sát thêm, bỏ qua).\n"
                + "4. BẮT BUỘC TRẢ LỜI NGẮN GỌN TRONG TỐI ĐA 3-4 CÂU. Không giải thích dông dài.\n"
                + "5. Trả về format tối giản nhất, không lặp lại nguyên văn dữ kiện.\n\n"
                + securityContext
                + "=== LỆNH CỦA ADMIN ===\n"
                + adminCommand + "\n\n"
                + "Phân tích và trả lời:";
    }
}
