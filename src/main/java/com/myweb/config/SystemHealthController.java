package com.myweb.config;

import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import dev.langchain4j.model.chat.ChatLanguageModel;

/**
 * Health check endpoint for Phase 1 infrastructure.
 * Verifies: PostgreSQL + pgvector, Redis, Ollama/LLM
 *
 * GET /api/public/system-health
 */
@RestController
@RequestMapping("/api/public")
public class SystemHealthController {

    private static final Logger log = LoggerFactory.getLogger(SystemHealthController.class);

    private final JdbcTemplate jdbcTemplate;
    private final StringRedisTemplate redisTemplate;
    private final ChatLanguageModel chatModel;

    @Value("${app.ai.ollama.base-url}")
    private String ollamaBaseUrl;

    @Value("${app.ai.ollama.model}")
    private String ollamaModel;

    public SystemHealthController(JdbcTemplate jdbcTemplate,
            StringRedisTemplate redisTemplate,
            ChatLanguageModel chatModel) {
        this.jdbcTemplate = jdbcTemplate;
        this.redisTemplate = redisTemplate;
        this.chatModel = chatModel;
    }

    @GetMapping("/system-health")
    public Map<String, Object> systemHealth() {
        Map<String, Object> health = new HashMap<>();
        health.put("timestamp", System.currentTimeMillis());

        // 1. PostgreSQL check
        try {
            String version = jdbcTemplate.queryForObject("SELECT version()", String.class);
            health.put("postgresql", Map.of("status", "UP", "version", version));
        } catch (Exception e) {
            health.put("postgresql", Map.of("status", "DOWN", "error", e.getMessage()));
        }

        // 2. pgvector check
        try {
            String vectorVersion = jdbcTemplate.queryForObject(
                    "SELECT extversion FROM pg_extension WHERE extname = 'vector'", String.class);
            health.put("pgvector", Map.of("status", "UP", "version", vectorVersion));
        } catch (Exception e) {
            health.put("pgvector", Map.of("status", "DOWN", "error", "Extension not installed"));
        }

        // 3. Redis check
        try {
            String pong = redisTemplate.getConnectionFactory().getConnection().ping();
            health.put("redis", Map.of("status", "UP", "ping", pong));
        } catch (Exception e) {
            health.put("redis", Map.of("status", "DOWN", "error", e.getMessage()));
        }

        // 4. Ollama/LLM check
        try {
            String response = chatModel.generate("Say OK");
            health.put("ollama", Map.of(
                    "status", "UP",
                    "model", ollamaModel,
                    "baseUrl", ollamaBaseUrl,
                    "testResponse", response.substring(0, Math.min(response.length(), 50))));
        } catch (Exception e) {
            health.put("ollama", Map.of(
                    "status", "DOWN",
                    "model", ollamaModel,
                    "baseUrl", ollamaBaseUrl,
                    "error",
                    e.getMessage() != null ? e.getMessage().substring(0, Math.min(e.getMessage().length(), 200))
                            : "Unknown error"));
        }

        // Overall status
        boolean allUp = health.values().stream()
                .filter(v -> v instanceof Map)
                .allMatch(v -> "UP".equals(((Map<?, ?>) v).get("status")));
        health.put("overall", allUp ? "ALL_SERVICES_UP" : "DEGRADED");

        return health;
    }
}
