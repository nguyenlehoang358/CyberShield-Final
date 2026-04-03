package com.myweb.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.Map;

/**
 * Endpoint chẩn đoán lỗi AI - Giúp Admin kiểm tra cấu hình Gemini
 */
@RestController
@RequestMapping("/api/debug/ai")
public class AIDebugController {

    @Value("${app.ai.gemini.api-key:MISSING}")
    private String geminiKey;

    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/list-models")
    public ResponseEntity<Map<String, Object>> listModels() {
        Map<String, Object> debugInfo = new HashMap<>();
        String url = "https://generativelanguage.googleapis.com/v1beta/models?key=" + geminiKey;
        try {
            ResponseEntity<String> response = restTemplate.getForEntity(url, String.class);
            debugInfo.put("status", "SUCCESS");
            debugInfo.put("body", response.getBody());
        } catch (org.springframework.web.client.RestClientException e) {
            debugInfo.put("status", "ERROR");
            debugInfo.put("message", e.getMessage());
        }
        return ResponseEntity.ok(debugInfo);
    }

    @GetMapping("/test-gemini")
    public ResponseEntity<Map<String, Object>> testGemini() {
        Map<String, Object> debugInfo = new HashMap<>();
        debugInfo.put("configured_key_prefix", geminiKey.length() > 6 ? geminiKey.substring(0, 6) + "..." : "EMPTY");
        
        String url = "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=" + geminiKey;
        
        Map<String, Object> body = Map.of(
            "contents", new Object[]{
                Map.of("parts", new Object[]{
                    Map.of("text", "AI connection test.")
                })
            }
        );

        try {
            debugInfo.put("url_contacted", "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash");
            ResponseEntity<String> response = restTemplate.postForEntity(url, body, String.class);
            debugInfo.put("status", "SUCCESS");
            debugInfo.put("response_code", response.getStatusCode().toString());
        } catch (org.springframework.web.client.HttpClientErrorException e) {
            debugInfo.put("status", "FAILED");
            debugInfo.put("error_code", e.getStatusCode().toString());
            debugInfo.put("error_body", e.getResponseBodyAsString());
        } catch (Exception e) {
            debugInfo.put("status", "ERROR");
            debugInfo.put("message", e.getMessage());
        }

        return ResponseEntity.ok(debugInfo);
    }
}
