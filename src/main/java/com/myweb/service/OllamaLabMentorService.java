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

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.core.type.TypeReference;

@Service
public class OllamaLabMentorService {

    @Value("${app.ai.gemini.api-key}")
    private String geminiApiKey;

    @Value("${app.ai.ollama.base-url:http://127.0.0.1:11434}")
    private String ollamaBaseUrl;

    @Value("${app.ai.ollama.model:qwen2.5:0.5b}")
    private String ollamaModel;

    private static final String GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=";

    private final RestTemplate restTemplate;
    private final ObjectMapper mapper;

    public OllamaLabMentorService() {
        this.restTemplate = new RestTemplate();
        this.mapper = new ObjectMapper();
    }

    /**
     * 🤖 PHẦN 1: CHAT VỚI OLLAMA (Đã tái cấu trúc)
     * Trả về text thuần túy từ model nội bộ.
     */
    public Map<String, Object> generateMentorResponse(LabChatRequest request) {
        String systemPrompt = "Bạn là CyberShield Lab Mentor. Hãy hướng dẫn ngắn gọn, không giải thích dài dòng. Trả lời bằng Markdown. Ngữ cảnh: "
                + (request.labContext() != null ? request.labContext() : "Trống");

        String fullPrompt = systemPrompt + "\n\nCâu hỏi học viên: " + request.message();

        Map<String, Object> requestBody = new HashMap<>();
        requestBody.put("model", ollamaModel);
        requestBody.put("prompt", fullPrompt);
        requestBody.put("stream", false); // Không dùng stream để nhận trọn bộ text

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            // Gọi Ollama local
            JsonNode response = restTemplate.postForObject(ollamaBaseUrl + "/api/generate", entity, JsonNode.class);

            if (response != null && response.has("response")) {
                String replyText = response.get("response").asText();
                return Map.of("reply", replyText);
            }
            return Map.of("reply", "🤖 Ollama Mentor: Không nhận được phản hồi từ model nội bộ.");
        } catch (Exception e) {
            System.err.println("Ollama Connection Error: " + e.getMessage());
            return Map.of("reply",
                    "⚠️ Không thể kết nối với Ollama. Hãy đảm bảo Ollama đang chạy tại " + ollamaBaseUrl);
        }
    }

    /**
     * 🤖 PHẦN 2: GỢI Ý PAYLOAD (GIỮ NGUYÊN GEMINI)
     * Tuyệt đối không thay đổi logic này theo yêu cầu.
     */
    @Cacheable(value = "labSuggestions", key = "#labType + '_' + (#userInput != null ? #userInput : '')")
    public List<String> generateAutoSuggestPayloads(String labType, String userInput) {
        if (geminiApiKey == null || geminiApiKey.isEmpty() || geminiApiKey.contains("your_gemini_api_key_here")) {
            return fallbackPayloads(labType);
        }

        String systemPrompt = """
                Bạn là AI chuyên tạo payload an ninh mạng nâng cao.
                Dựa trên loại bài Lab: '%s' và những gì người dùng đang nhập: '%s'.
                Hãy sinh ra ĐÚNG 3 đoạn payload NÂNG CAO và PHÙ HỢP nhất.
                YÊU CẦU BẮT BUỘC: Trả về DUY NHẤT một mảng JSON array chứa 3 chuỗi. KHÔNG dùng markdown wrap.
                """.formatted(labType, userInput != null ? userInput : "Trống");

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of("parts", List.of(Map.of("text", systemPrompt)))),
                "generationConfig", Map.of("temperature", 0.3, "maxOutputTokens", 200));

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> result = restTemplate.postForObject(GEMINI_URL + geminiApiKey, entity, Map.class);

            if (result != null && result.containsKey("candidates")) {
                @SuppressWarnings("unchecked")
                List<Map<String, Object>> candidates = (List<Map<String, Object>>) result.get("candidates");
                if (candidates != null && !candidates.isEmpty()) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> content = (Map<String, Object>) candidates.get(0).get("content");
                    if (content != null && content.containsKey("parts")) {
                        @SuppressWarnings("unchecked")
                        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
                        if (parts != null && !parts.isEmpty()) {
                            String rawJson = (String) parts.get(0).get("text");
                            // Cleanup JSON
                            rawJson = rawJson.replaceAll("(?s)^```json\\s*", "")
                                    .replaceAll("(?s)^```\\s*", "")
                                    .replaceAll("(?s)```\\s*$", "")
                                    .trim();

                            int firstBracket = rawJson.indexOf("[");
                            int lastBracket = rawJson.lastIndexOf("]");
                            if (firstBracket >= 0 && lastBracket > firstBracket) {
                                rawJson = rawJson.substring(firstBracket, lastBracket + 1);
                            }

                            return mapper.readValue(rawJson, new TypeReference<List<String>>() {
                            });
                        }
                    }
                }
            }
            return fallbackPayloads(labType);
        } catch (Exception e) {
            System.err.println("Gemini Auto-Suggest Error: " + e.getMessage());
            return fallbackPayloads(labType);
        }
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
