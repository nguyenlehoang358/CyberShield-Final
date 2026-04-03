package com.myweb.controller;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.myweb.config.AIRateLimiter;
import com.myweb.dto.LabChatRequest;
import com.myweb.service.ChatHistoryService;
import com.myweb.service.OllamaLabMentorService;
import com.myweb.service.RAGService;

import dev.langchain4j.model.chat.ChatLanguageModel;
import jakarta.servlet.http.HttpServletRequest;

/**
 * AI Chat Controller — Phase 5: hardened with rate limiting, input validation,
 * comprehensive health checks.
 */
@RestController
@RequestMapping("/api/ai")
public class AIChatController {

    private static final Logger log = LoggerFactory.getLogger(AIChatController.class);
    private static final int MAX_MESSAGE_LENGTH = 2000;
    private static final int MAX_SESSION_ID_LENGTH = 100;

    private final RAGService ragService;
    private final ChatHistoryService chatHistoryService;
    private final AIRateLimiter rateLimiter;
    private final ChatLanguageModel chatModel;
    private final OllamaLabMentorService ollamaLabMentorService;

    @Value("${app.ai.ollama.model:qwen2.5:0.5b}")
    private String ollamaModel;

    public AIChatController(RAGService ragService,
            ChatHistoryService chatHistoryService,
            AIRateLimiter rateLimiter,
            ChatLanguageModel chatModel,
            OllamaLabMentorService ollamaLabMentorService) {
        this.ragService = ragService;
        this.chatHistoryService = chatHistoryService;
        this.rateLimiter = rateLimiter;
        this.chatModel = chatModel;
        this.ollamaLabMentorService = ollamaLabMentorService;
    }

    /**
     * POST /api/ai/chat
     */
    @PostMapping("/chat")
    public ResponseEntity<?> chat(@RequestBody Map<String, String> request,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);

        if (!rateLimiter.isAllowed(clientIp)) {
            return ResponseEntity.status(429).body(Map.of(
                    "error", "Quá nhiều yêu cầu. Vui lòng thử lại sau.",
                    "retryAfter", rateLimiter.getResetSeconds(clientIp),
                    "status", 429));
        }

        String userMessage = request.get("message");
        String sessionId = request.get("sessionId");

        if (userMessage == null || userMessage.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(
                    Map.of("error", "Message cannot be empty", "status", 400));
        }

        userMessage = sanitizeInput(userMessage.trim());
        if (userMessage.length() > MAX_MESSAGE_LENGTH) {
            userMessage = userMessage.substring(0, MAX_MESSAGE_LENGTH);
        }

        Map<String, Object> result = ragService.chat(userMessage, sessionId);
        result.put("rateLimitRemaining", rateLimiter.getRemaining(clientIp));

        if (result.containsKey("error")) {
            return ResponseEntity.status(503).body(result);
        }

        return ResponseEntity.ok(result);
    }

    @GetMapping("/status")
    public ResponseEntity<?> status() {
        try {
            Map<String, Object> stats = ragService.getStats();
            stats.put("status", "OK");
            return ResponseEntity.ok(stats);
        } catch (Exception e) {
            return ResponseEntity.status(503).body(Map.of("status", "DEGRADED", "error", e.getMessage()));
        }
    }

    @GetMapping("/health")
    public ResponseEntity<?> health() {
        Map<String, Object> health = new LinkedHashMap<>();
        health.put("timestamp", System.currentTimeMillis());
        try {
            Map<String, Object> stats = ragService.getStats();
            health.put("rag", Map.of("status", "UP", "totalDocuments", stats.get("totalDocuments")));
        } catch (Exception e) {
            health.put("rag", Map.of("status", "DOWN", "error", e.getMessage()));
        }
        return ResponseEntity.ok(health);
    }

    @PostMapping("/clear")
    public ResponseEntity<?> clearHistory(@RequestParam String sessionId) {
        if (sessionId == null || sessionId.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "sessionId is required"));
        }
        chatHistoryService.clearHistory(sessionId);
        return ResponseEntity.ok(Map.of("message", "History cleared", "sessionId", sessionId));
    }

    /**
     * POST /api/ai/lab-mentor
     * Use local Ollama AI as a Lab Mentor.
     */
    @PostMapping("/lab-mentor")
    public ResponseEntity<?> labMentor(@RequestBody LabChatRequest request,
            HttpServletRequest httpRequest) {
        String clientIp = getClientIp(httpRequest);

        if (!rateLimiter.isAllowed(clientIp)) {
            return ResponseEntity.status(429)
                    .body(Map.of("error", "Quá nhiều yêu cầu. Vui lòng thử lại sau.", "status", 429));
        }

        if (request.message() == null || request.message().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Message cannot be empty", "status", 400));
        }

        // Gọi Ollama Mentor Service
        Map<String, Object> aiResponse = ollamaLabMentorService.generateMentorResponse(request);

        // Merge with metadata
        Map<String, Object> finalResponse = new java.util.HashMap<>(aiResponse);
        finalResponse.put("model", ollamaModel);

        return ResponseEntity.ok(finalResponse);
    }

    private String sanitizeInput(String input) {
        if (input == null)
            return "";
        return input.replace("<script>", "").replace("</script>", "").replace("javascript:", "").trim();
    }

    private String getClientIp(HttpServletRequest request) {
        String xff = request.getHeader("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            return xff.split(",")[0].trim();
        }
        return request.getRemoteAddr();
    }
}
