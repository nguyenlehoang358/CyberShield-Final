package com.myweb.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import com.myweb.entity.AuditLog;
import com.myweb.entity.SecurityEvent;
import com.myweb.repository.AuditLogRepository;

import dev.langchain4j.model.chat.ChatLanguageModel;

/**
 * AI Security Advisor — uses LLM to analyze security events
 * and generate threat reports and recommendations.
 */
@Service
public class SecurityAdvisorService {

    private static final Logger log = LoggerFactory.getLogger(SecurityAdvisorService.class);

    private final ChatLanguageModel chatModel;
    private final SecurityEventService securityEventService;
    private final AuditLogRepository auditLogRepository;
    private final SystemSettingService settingService;

    private static final String ADVISOR_SYSTEM_PROMPT = """
            Bạn là CyberShield AI (Chuyên gia phân tích an ninh mạng cấp cao).
            Quy tắc TỐI THƯỢNG:
            1. Trả lời bằng tiếng Việt chuyên nghiệp, súc tích. HIỂN THỊ DƯỚI DẠNG MARKDOWN THEO ĐÚNG CẤU TRÚC ĐƯỢC YÊU CẦU.
            2. VỚI DỮ LIỆU ĐƯỢC CHUYỂN QUA: TUYỆT ĐỐI KHÔNG copy-paste y nguyên dữ liệu thô vào báo cáo. BẠN PHẢI GOM NHÓM (Ví dụ: thay vì liệt kê 10 dòng IP 1.1.1.1, hãy nói 'IP 1.1.1.1 tấn công 10 lần').
            3. KHÔNG ĐƯỢC LẶP LẠI MỘT CÂU HAY MỘT ĐOẠN VĂN NHIỀU LẦN. Viết ngắn gọn, đi thẳng vào vấn đề.
            4. Bỏ qua và đánh giá mức độ AN TOÀN (Safe) đối với các IP nội bộ / LAN (192.168.x.x, 127.0.0.1, 0:0:0:0:0:0:0:1) vì đây là môi trường test.
            """;

    public SecurityAdvisorService(ChatLanguageModel chatModel,
            SecurityEventService securityEventService,
            AuditLogRepository auditLogRepository,
            SystemSettingService settingService) {
        this.chatModel = chatModel;
        this.securityEventService = securityEventService;
        this.auditLogRepository = auditLogRepository;
        this.settingService = settingService;
    }

    /**
     * Generate a comprehensive AI threat analysis report based on recent events.
     */
    public Map<String, Object> generateThreatReport() {
        Map<String, Object> report = new LinkedHashMap<>();
        long startTime = System.currentTimeMillis();

        try {
            // Get Sensitivity setting
            String sensitivity = settingService.getSettingValue("ai.sensitivity", "MEDIUM");
            boolean autoResolve = Boolean.parseBoolean(settingService.getSettingValue("ai.auto_resolve", "true"));

            // 1. Get event summary
            String eventSummary = securityEventService.buildEventSummaryForAI();

            // 2. Get dashboard stats
            Map<String, Object> stats = securityEventService.getDashboardStats();

            // Auto-resolve non-critical events if permitted and no high risks found
            if (autoResolve) {
                Long unresolvedLong = (Long) stats.getOrDefault("unresolvedCount", 0L);
                Long criticalLong = (Long) stats.getOrDefault("criticalCount", 0L);

                int riskScore = (int) stats.getOrDefault("riskScore", 0);

                // If LOW sensitivity or (MEDIUM sensitivity with low risk score) -> trigger
                // auto resolve
                if ("LOW".equals(sensitivity) || ("MEDIUM".equals(sensitivity) && riskScore < 30 && criticalLong == 0
                        && unresolvedLong > 0)) {
                    securityEventService.autoResolveMinorEvents(); // Note: we'll need to create this method in next
                                                                   // step
                    stats = securityEventService.getDashboardStats(); // refresh stats
                }
            }

            // Fetch DANGER audit logs
            List<AuditLog> dangerLogs = auditLogRepository
                    .findTop20BySeverityOrderByTimestampDesc(AuditLog.Severity.DANGER);
            StringBuilder dangerLogContext = new StringBuilder();
            if (!dangerLogs.isEmpty()) {
                dangerLogContext.append("Logs DANGER:\n");
                for (AuditLog logData : dangerLogs) {
                    dangerLogContext.append("- ").append(logData.getIpAddress())
                            .append(" (").append(logData.getUsername()).append("): ")
                            .append(logData.getDetails()).append("\n");
                }
            }

            // 3. Build AI prompt
            String prompt = ADVISOR_SYSTEM_PROMPT + "\n\n"
                    + "=== RAW DATA (CHỈ ĐỌC, KHÔNG ĐƯỢC IN Y NGUYÊN VÀO BÁO CÁO) ===\n"
                    + "Events Data:\n" + eventSummary + "\n"
                    + dangerLogContext.toString() + "\n"
                    + "Stats: Risk Score " + stats.get("riskScore") + "/100, CRITICAL Events: "
                    + stats.get("criticalCount") + "\n"
                    + "======================\n\n"
                    + "LỆNH BẮT BUỘC: Lập Báo cáo Phân tích Mối đe dọa (Threat Intel Report) dựa trên dữ liệu trên. "
                    + "Lưu ý: Dữ liệu trên có nhiều dòng bị trùng lặp, BẠN PHẢI TỔNG HỢP VÀ GOM NHÓM CHÚNG LẠI (vd: IP A đã tấn công N lần). "
                    + "TUYỆT ĐỐI KHÔNG lặp lại từ ngữ.\n\n"
                    + "In báo cáo theo ĐÚNG 3 PHẦN này BẰNG MARKDOWN:\n"
                    + "### 1. TÌNH TRẠNG CHUNG\n(Đánh giá tổng quan 1-2 câu)\n"
                    + "### 2. IP ĐÁNG NGỜ NHẤT\n(Liệt kê 1-3 IP nguy hiểm nhất và số lần chúng tấn công, bỏ qua IP nội bộ như 127.0.0.1 và 0:0:0:0:0:0:0:1)\n"
                    + "### 3. KHUYẾN NGHỊ HÀNH ĐỘNG\n(Đề xuất 2-3 gạch đầu dòng ngắn gọn để xử lý)\n\n"
                    + "BÁO CÁO CỦA BẠN:";

            // 4. Call LLM
            String aiAnalysis = chatModel.generate(prompt);

            long elapsed = System.currentTimeMillis() - startTime;

            report.put("analysis", aiAnalysis);
            report.put("stats", stats);
            report.put("riskScore", stats.get("riskScore"));
            report.put("generatedAt", System.currentTimeMillis());
            report.put("responseTimeMs", elapsed);
            report.put("status", "OK");

            log.info("AI Threat Report generated in {}ms", elapsed);

        } catch (Exception e) {
            log.error("AI Threat Report failed: {}", e.getMessage());

            // Fallback: generate report without AI
            Map<String, Object> stats = securityEventService.getDashboardStats();
            report.put("analysis", generateFallbackAnalysis(stats));
            report.put("stats", stats);
            report.put("riskScore", stats.get("riskScore"));
            report.put("generatedAt", System.currentTimeMillis());
            report.put("status", "FALLBACK");
            report.put("error", "AI service unavailable. Showing rule-based analysis.");
        }

        return report;
    }

    /**
     * Analyze a specific security event using AI.
     */
    public String analyzeEvent(SecurityEvent event) {
        try {
            String prompt = ADVISOR_SYSTEM_PROMPT + "\n\n"
                    + "YÊU CẦU LỆNH: Hãy phân tích SỰ KIỆN ĐƠN LẺ dưới đây. Bạn chỉ được trả lời tối đa 3 câu văn ngắn.\n\n"
                    + "=== EVENT DATA ===\n"
                    + "Type: " + event.getEventType() + " | Severity: " + event.getSeverity() + "\n"
                    + "Source IP: " + event.getSourceIp() + "\n"
                    + "Desc: " + event.getDescription() + "\n"
                    + "=== END DATA ===\n\n"
                    + "Phân tích và Đề xuất (Ngắn gọn):";

            return chatModel.generate(prompt);
        } catch (Exception e) {
            log.error("Event analysis failed: {}", e.getMessage());
            return "Không thể phân tích tự động. AI Service unavailable.";
        }
    }

    /**
     * Analyze a specific IP address for threat indicators.
     */
    public Map<String, Object> analyzeIP(String ip) {
        Map<String, Object> result = new LinkedHashMap<>();

        try {
            List<SecurityEvent> events = securityEventService.getEventsForIp(ip);
            result.put("ip", ip);
            result.put("totalEvents", events.size());

            if (events.isEmpty()) {
                result.put("analysis", "Không tìm thấy sự kiện bảo mật nào cho IP: " + ip);
                result.put("threatLevel", "SAFE");
                return result;
            }

            // Build event summary for this IP
            StringBuilder sb = new StringBuilder();
            sb.append("Các sự kiện từ IP ").append(ip).append(":\n");
            events.stream().limit(20).forEach(e -> sb.append("  [").append(e.getSeverity()).append("] ")
                    .append(e.getEventType()).append(" - ")
                    .append(e.getDescription()).append(" (")
                    .append(e.getCreatedAt()).append(")\n"));

            // Get Sensitivity setting
            String sensitivity = settingService.getSettingValue("ai.sensitivity", "MEDIUM");

            // Build simple AI prompt
            StringBuilder promptBuilder = new StringBuilder();
            promptBuilder.append(ADVISOR_SYSTEM_PROMPT).append("\n\n");
            promptBuilder.append("THÔNG TIN HỆ THỐNG:\n");
            promptBuilder.append("- Mức độ nhạy báo cáo: ").append(sensitivity).append("\n");
            promptBuilder.append("- Tổng số sự kiện từ IP này: ").append(events.size()).append("\n\n");

            if ("LOW".equals(sensitivity)) {
                promptBuilder.append(
                        "YÊU CẦU: CHỈ BÁO CÁO các sự kiện CRITICAL (Nghiêm trọng) hoặc có hậu quả rõ ràng. BỎ QUA spam.\n");
            } else if ("HIGH".equals(sensitivity)) {
                promptBuilder.append("YÊU CẦU: SO SOI KỸ mọi dấu hiệu nhỏ nhất kể cả port scan để cảnh giác.\n");
            }

            promptBuilder.append("DỮ LIỆU SỰ KIỆN TỪ IP NÀY:\n");
            promptBuilder.append(sb.toString()).append("\n");
            promptBuilder.append("CẤU TRÚC BÁO CÁO:\n");
            promptBuilder.append("## 1. Tóm tắt nhanh\n");
            promptBuilder.append("## 2. Các Đe dọa Chính (Chỉ liệt kê khi có Lỗi cụ thể)\n");
            promptBuilder.append("## 3. Khuyến nghị Quản trị Hệ thống\n");

            String prompt = promptBuilder.toString();
            String analysis = chatModel.generate(prompt);

            result.put("analysis", analysis);
            result.put("threatLevel", determineThreatLevel(events));

        } catch (Exception e) {
            log.error("IP analysis failed: {}", e.getMessage());
            List<SecurityEvent> events = securityEventService.getEventsForIp(ip);
            result.put("analysis", "AI analysis unavailable. Events: " + events.size());
            result.put("threatLevel", determineThreatLevel(events));
        }

        return result;
    }

    /**
     * Determine threat level based on event history (rule-based fallback).
     */
    private String determineThreatLevel(List<SecurityEvent> events) {
        if (events.isEmpty())
            return "SAFE";

        long critical = events.stream().filter(e -> e.getSeverity() == SecurityEvent.Severity.CRITICAL).count();
        long high = events.stream().filter(e -> e.getSeverity() == SecurityEvent.Severity.HIGH).count();

        if (critical > 0)
            return "CRITICAL";
        if (high >= 5)
            return "HIGH";
        if (high >= 1 || events.size() >= 10)
            return "MEDIUM";
        return "LOW";
    }

    /**
     * Rule-based fallback analysis when AI is unavailable.
     */
    private String generateFallbackAnalysis(Map<String, Object> stats) {
        int riskScore = (int) stats.getOrDefault("riskScore", 0);
        long unresolved = (long) stats.getOrDefault("unresolvedCount", 0L);
        long critical = (long) stats.getOrDefault("criticalCount", 0L);

        StringBuilder sb = new StringBuilder();

        if (riskScore == 0 && unresolved == 0) {
            sb.append("🟢 **ĐÁNH GIÁ: AN TOÀN**\n\n");
            sb.append("Không phát hiện mối đe dọa nào. Hệ thống đang hoạt động bình thường.\n");
        } else if (riskScore < 30) {
            sb.append("🟡 **ĐÁNH GIÁ: CẢNH BÁO NHẸ**\n\n");
            sb.append("Phát hiện một số hoạt động bất thường nhưng chưa ở mức nguy hiểm.\n");
            sb.append("- Sự kiện chưa xử lý: ").append(unresolved).append("\n");
            sb.append("- Đề xuất: Giám sát và xem xét các sự kiện.\n");
        } else if (riskScore < 60) {
            sb.append("🟠 **ĐÁNH GIÁ: NGUY HIỂM**\n\n");
            sb.append("Phát hiện hoạt động tấn công đáng kể.\n");
            sb.append("- Risk Score: ").append(riskScore).append("/100\n");
            sb.append("- Sự kiện chưa xử lý: ").append(unresolved).append("\n");
            sb.append("- Đề xuất: Kiểm tra ngay các IP nguồn và cân nhắc block.\n");
        } else {
            sb.append("🔴 **ĐÁNH GIÁ: NGHIÊM TRỌNG**\n\n");
            sb.append("Hệ thống đang bị tấn công ở mức cao!\n");
            sb.append("- Risk Score: ").append(riskScore).append("/100\n");
            sb.append("- Critical events: ").append(critical).append("\n");
            sb.append("- Sự kiện chưa xử lý: ").append(unresolved).append("\n");
            sb.append("- **ĐỀ XUẤT KHẨN CẤP**: Block tất cả IP đáng ngờ, review firewall rules.\n");
        }

        sb.append("\n⚠️ *Phân tích tự động (rule-based). Kết nối Ollama để có phân tích AI chi tiết hơn.*");
        return sb.toString();
    }

    /**
     * Tự động gọi AI Qwen 2.5 để sinh ra một câu nhận xét về xu hướng dữ liệu Biểu
     * đồ (BI Insight).
     */
    public Map<String, Object> generatePieChartInsight(Map<String, Object> chartData) {
        Map<String, Object> result = new LinkedHashMap<>();
        try {
            String prompt = "Dựa vào dữ liệu thống kê biểu đồ sau đây của hệ thống:\n"
                    + chartData.toString() + "\n"
                    + "Hãy đóng vai Lập trình viên AI bảo mật (Qwen2.5) và đưa ra đúng 1 câu nhận xét ngắn gọn (khoảng 10-15 từ) bằng tiếng Việt về xu hướng bảo mật hiện tại, ví dụ: 'Hệ thống đang hoạt động ổn định với tỷ lệ Safe cao.' hoặc 'Cảnh báo: Tỷ lệ Dangerous logs đang có dấu hiệu tăng mạnh.'."
                    + "\nKhông giải thích gì thêm, chỉ in ra câu trả lời.";

            String insight = chatModel.generate(prompt);

            result.put("insight", insight.replace("\"", "").trim());
            result.put("status", "OK");
        } catch (Exception e) {
            log.error("AI Insight failed: {}", e.getMessage());
            result.put("insight", "Hệ thống đang theo dõi và tổng hợp số liệu...");
            result.put("status", "FALLBACK");
        }
        return result;
    }
}
