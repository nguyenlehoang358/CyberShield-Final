package com.myweb.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

/**
 * Chat History Service — stores and retrieves conversation context.
 *
 * Stores conversations in PostgreSQL (chat_conversations table)
 * so the AI can maintain context across messages within a session.
 *
 * Each message has: sessionId, userId (optional), role (user/assistant),
 * message text.
 */
@Service
public class ChatHistoryService {

    private static final Logger log = LoggerFactory.getLogger(ChatHistoryService.class);
    private static final int MAX_HISTORY_MESSAGES = 10; // Last N messages for context

    private final JdbcTemplate jdbcTemplate;

    public ChatHistoryService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    /**
     * Save a message to chat history (async to not block response).
     */
    @Async
    public void saveMessage(String sessionId, Long userId, String role, String message) {
        try {
            jdbcTemplate.update(
                    "INSERT INTO chat_conversations (session_id, user_id, role, message) VALUES (?, ?, ?, ?)",
                    sessionId, userId, role, message);
        } catch (Exception e) {
            log.error("Failed to save chat message: {}", e.getMessage());
        }
    }

    /**
     * Get the last N messages for a session (for conversation context).
     * Returns messages in chronological order.
     */
    public List<Map<String, Object>> getRecentHistory(String sessionId, int limit) {
        try {
            String sql = """
                    SELECT role, message, created_at
                    FROM chat_conversations
                    WHERE session_id = ?
                    ORDER BY created_at DESC
                    LIMIT ?
                    """;
            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, sessionId, limit);

            // Reverse to chronological order
            List<Map<String, Object>> reversed = new ArrayList<>(results);
            java.util.Collections.reverse(reversed);
            return reversed;
        } catch (Exception e) {
            log.error("Failed to get chat history: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Get last N messages with default limit.
     */
    public List<Map<String, Object>> getRecentHistory(String sessionId) {
        return getRecentHistory(sessionId, MAX_HISTORY_MESSAGES);
    }

    /**
     * Build conversation context string from history for the LLM prompt.
     * Format:
     * User: ...
     * Assistant: ...
     * User: ...
     */
    public String buildHistoryContext(String sessionId) {
        List<Map<String, Object>> history = getRecentHistory(sessionId);
        if (history.isEmpty())
            return "";

        StringBuilder sb = new StringBuilder();
        sb.append("=== Lịch sử hội thoại gần đây ===\n");
        for (Map<String, Object> msg : history) {
            String role = (String) msg.get("role");
            String message = (String) msg.get("message");
            // Truncate long messages in history context
            if (message.length() > 300) {
                message = message.substring(0, 300) + "...";
            }
            sb.append(role.equals("user") ? "User: " : "Assistant: ");
            sb.append(message).append("\n");
        }
        return sb.toString();
    }

    /**
     * Get total conversations count (unique sessions).
     */
    public long getSessionCount() {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(DISTINCT session_id) FROM chat_conversations", Long.class);
        return count != null ? count : 0;
    }

    /**
     * Get total message count.
     */
    public long getMessageCount() {
        Long count = jdbcTemplate.queryForObject(
                "SELECT COUNT(*) FROM chat_conversations", Long.class);
        return count != null ? count : 0;
    }

    /**
     * Clear history for a session.
     */
    public void clearHistory(String sessionId) {
        jdbcTemplate.update("DELETE FROM chat_conversations WHERE session_id = ?", sessionId);
        log.info("🧹 Chat history cleared for session: {}", sessionId);
    }
}
