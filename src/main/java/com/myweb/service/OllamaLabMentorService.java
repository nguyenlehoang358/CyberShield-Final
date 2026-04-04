package com.myweb.service;

import com.myweb.dto.LabChatRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.core.type.TypeReference;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class OllamaLabMentorService {

    private static final Logger log = LoggerFactory.getLogger(OllamaLabMentorService.class);

    // Đã xóa bỏ hoàn toàn Gemini API Key để tránh lỗi startup

    @Value("${app.ai.ollama.base-url:http://127.0.0.1:11434}")
    private String ollamaBaseUrl;

    @Value("${app.ai.ollama.model:qwen2.5:0.5b}")
    private String ollamaModel;

    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;

    public OllamaLabMentorService() {
        this.restTemplate = new RestTemplate();
        this.mapper = new ObjectMapper();
    }

    /**
     * 🤖 PHẦN 1: CHAT VỚI OLLAMA
     */
    public Map<String, Object> generateMentorResponse(LabChatRequest request) {
        String systemPrompt = "Bạn là CyberShield Lab Mentor. Hãy hướng dẫn ngắn gọn, không giải thích dài dòng. Trả lời bằng Markdown. Ngữ cảnh: "
                + (request.labContext() != null ? request.labContext() : "Trống");

        String fullPrompt = systemPrompt + "\n\nCâu hỏi học viên: " + request.message();

        return callOllama(fullPrompt);
    }

    /**
     * 🤖 PHẦN 2: GỢI Ý PAYLOAD (ĐÃ CHUYỂN SANG DÙNG OLLAMA)
     * Thay thế Gemini bằng Qwen để tránh lỗi thiếu API Key.
     */
    @Cacheable(value = "labSuggestions", key = "#labType + '_' + (#userInput != null ? #userInput : '')")
    public List<String> generateAutoSuggestPayloads(String labType, String userInput) {

        String systemPrompt = """
                Bạn là AI chuyên tạo payload an ninh mạng.
                Dựa trên loại bài Lab: '%s' và input: '%s'.
                Hãy sinh ra ĐÚNG 3 đoạn payload NÂNG CAO.
                Trả về DUY NHẤT một mảng JSON array chứa 3 chuỗi. Ví dụ: ["p1", "p2", "p3"].
                Không giải thích gì thêm.
                """.formatted(labType, userInput != null ? userInput : "Trống");

        try {
            Map<String, Object> response = callOllama(systemPrompt);
            String rawJson = (String) response.get("reply");

            // Làm sạch chuỗi để parse JSON
            rawJson = rawJson.replaceAll("(?s)^```json\\s*", "")
                    .replaceAll("(?s)^```\\s*", "")
                    .replaceAll("(?s)```\\s*$", "")
                    .trim();

            return mapper.readValue(rawJson, new TypeReference<List<String>>() {
            });
        } catch (Exception e) {
            System.err.println("Ollama Suggest Error: " + e.getMessage());
            return fallbackPayloads(labType);
        }
    }

    // Hàm dùng chung để gọi Ollama
    private Map<String, Object> callOllama(String prompt) {
        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", ollamaModel);
        requestBody.put("prompt", prompt);
        requestBody.put("stream", false);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        // THÊM: Bỏ qua trang cảnh báo của Ngrok để backend nhận JSON trực tiếp
        headers.set("ngrok-skip-browser-warning", "true");
        headers.set("bypass-tunnel-reminder", "true");

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            // Chuẩn hóa URL: Loại bỏ dấu gạch chéo ở cuối nết có
            String cleanBaseUrl = ollamaBaseUrl.trim();
            if (cleanBaseUrl.endsWith("/")) {
                cleanBaseUrl = cleanBaseUrl.substring(0, cleanBaseUrl.length() - 1);
            }
            String url = cleanBaseUrl + "/api/generate";

            log.info("🚀 AI Request to Ollama: {}", url);
            log.debug("Payload: {}", requestBody);

            JsonNode response = restTemplate.postForObject(url, entity, JsonNode.class);

            if (response != null && response.has("response")) {
                String reply = response.get("response").asText();
                log.info("✅ Ollama response received ({} chars)", reply.length());
                return Map.of("reply", reply);
            } else {
                log.error("🛑 Ollama returned null or invalid structure: {}", response);
                return Map.of("reply", "⚠️ Ollama không phản hồi nội dung.");
            }
        } catch (org.springframework.web.client.HttpClientErrorException hcee) {
            log.error("❌ HTTP Client Error ({}): {}", hcee.getStatusCode(), hcee.getResponseBodyAsString());
            return Map.of("reply", "⚠️ Lỗi Ngrok/Client: " + hcee.getMessage());
        } catch (Exception e) {
            log.error("💥 Ollama Global Error: {}", e.getMessage(), e);
            return Map.of("reply", "⚠️ Lỗi kết nối Ollama: " + e.getMessage());
        }
        return Map.of("reply", "🤖 Không có phản hồi");
    }

    private List<String> fallbackPayloads(String labType) {
        if ("sqli".equalsIgnoreCase(labType)) {
            return List.of("' OR 1=1 --", "' UNION SELECT null, user() --", "admin' #");
        } else if ("xss".equalsIgnoreCase(labType)) {
            return List.of("<script>alert('XSS')</script>", "<img src=x onerror=alert(1)>", "javascript:alert(1)");
        }
        return List.of("test_payload_1", "test_payload_2", "test_payload_3");
    }
}