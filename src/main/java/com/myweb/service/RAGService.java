package com.myweb.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import dev.langchain4j.model.chat.ChatLanguageModel;

/**
 * RAG (Retrieval-Augmented Generation) Service.
 *
 * Pipeline:
 * 1. User sends a question
 * 2. Retrieve relevant document chunks from pgvector (DocumentService)
 * 3. Optionally load conversation history (ChatHistoryService)
 * 4. Build an augmented prompt: System Prompt + Context + History + User
 * Question
 * 5. Send to the LLM (Ollama) and return the response
 *
 * This service orchestrates the full RAG flow.
 */
@Service
public class RAGService {

    private static final Logger log = LoggerFactory.getLogger(RAGService.class);

    private final ChatLanguageModel chatModel;
    private final DocumentService documentService;
    private final ChatHistoryService chatHistoryService;

    @Value("${app.ai.system-prompt}")
    private String systemPrompt;

    public RAGService(ChatLanguageModel chatModel,
            DocumentService documentService,
            ChatHistoryService chatHistoryService) {
        this.chatModel = chatModel;
        this.documentService = documentService;
        this.chatHistoryService = chatHistoryService;
    }

    /**
     * Process a user question through the full RAG pipeline.
     *
     * @param userMessage The user's question
     * @param sessionId   Session ID for conversation context
     * @return Map with: response, sources, model info
     */
    public Map<String, Object> chat(String userMessage, String sessionId) {
        long startTime = System.currentTimeMillis();
        Map<String, Object> result = new LinkedHashMap<>();

        try {
            // ═══ Step 1: Retrieve relevant documents ═══
            List<Map<String, Object>> relevantDocs = documentService.searchSimilar(userMessage);
            String documentContext = buildDocumentContext(relevantDocs);

            // ═══ Step 2: Load conversation history ═══
            String historyContext = "";
            if (sessionId != null && !sessionId.isBlank()) {
                historyContext = chatHistoryService.buildHistoryContext(sessionId);
            }

            // ═══ Step 3: Build augmented prompt ═══
            String fullPrompt = buildRAGPrompt(systemPrompt, documentContext, historyContext, userMessage);

            log.info("🧠 RAG Pipeline: {} docs found, history={}, prompt={}chars",
                    relevantDocs.size(),
                    !historyContext.isEmpty(),
                    fullPrompt.length());

            // ═══ Step 4: Call LLM ═══
            String aiResponse = chatModel.generate(fullPrompt);

            // ═══ Step 5: Save to history ═══
            if (sessionId != null && !sessionId.isBlank()) {
                chatHistoryService.saveMessage(sessionId, null, "user", userMessage);
                chatHistoryService.saveMessage(sessionId, null, "assistant", aiResponse);
            }

            long elapsed = System.currentTimeMillis() - startTime;

            // ═══ Step 6: Build response ═══
            result.put("response", aiResponse);
            result.put("sessionId", sessionId != null ? sessionId : "");
            result.put("model", "ollama-rag");
            result.put("ragEnabled", true);
            result.put("sourcesCount", relevantDocs.size());
            result.put("responseTimeMs", elapsed);

            // Include source references for UI
            if (!relevantDocs.isEmpty()) {
                result.put("sources", relevantDocs.stream().map(doc -> {
                    Map<String, Object> source = new LinkedHashMap<>();
                    source.put("title", doc.get("title"));
                    source.put("category", doc.get("category"));
                    source.put("docType", doc.get("doc_type"));
                    source.put("similarity", String.format("%.2f", ((Number) doc.get("similarity")).doubleValue()));
                    return source;
                }).collect(Collectors.toList()));
            }

            log.info("✅ RAG response generated in {}ms ({}chars)", elapsed, aiResponse.length());

        } catch (Exception e) {
            log.error("❌ RAG pipeline error: {}", e.getMessage());

            // Fallback: try direct LLM call without RAG
            try {
                String fallbackPrompt = systemPrompt + "\n\nUser: " + userMessage + "\n\nAssistant:";
                String fallbackResponse = chatModel.generate(fallbackPrompt);

                result.put("response", fallbackResponse);
                result.put("ragEnabled", false);
                result.put("model", "ollama-direct");
                result.put("fallback", true);
                result.put("sessionId", sessionId != null ? sessionId : "");

                log.info("⚡ Fallback (direct LLM) response generated");
            } catch (Exception e2) {
                log.error("❌ Direct LLM also failed: {}", e2.getMessage());
                result.put("response", buildOfflineResponse(userMessage));
                result.put("ragEnabled", false);
                result.put("model", "offline");
                result.put("error", "AI service unavailable: " + e.getMessage());
                result.put("sessionId", sessionId != null ? sessionId : "");
            }
        }

        return result;
    }

    /**
     * Build the augmented RAG prompt combining all context sources.
     */
    private String buildRAGPrompt(String sysPrompt, String docContext, String history, String userMessage) {
        StringBuilder prompt = new StringBuilder();

        // System instructions
        prompt.append(sysPrompt).append("\n\n");

        // Document context (if available)
        if (!docContext.isBlank()) {
            prompt.append("=== Tài liệu tham khảo (sử dụng thông tin này để trả lời) ===\n");
            prompt.append(docContext).append("\n\n");
            prompt.append("Hãy ưu tiên sử dụng thông tin trong tài liệu tham khảo để trả lời.\n");
            prompt.append("Nếu tài liệu không liên quan đến câu hỏi, trả lời dựa trên kiến thức chung.\n\n");
        }

        // Conversation history (if available)
        if (!history.isBlank()) {
            prompt.append(history).append("\n");
        }

        // Current question
        prompt.append("User: ").append(userMessage).append("\n\nAssistant:");

        return prompt.toString();
    }

    /**
     * Build document context string from retrieved documents.
     */
    private String buildDocumentContext(List<Map<String, Object>> docs) {
        if (docs.isEmpty())
            return "";

        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < docs.size(); i++) {
            Map<String, Object> doc = docs.get(i);
            sb.append("[Tài liệu ").append(i + 1).append("]\n");
            sb.append("Tiêu đề: ").append(doc.get("title")).append("\n");
            sb.append("Loại: ").append(doc.get("doc_type")).append(" | ");
            sb.append("Danh mục: ").append(doc.get("category")).append("\n");
            sb.append("Nội dung: ").append(doc.get("content")).append("\n\n");
        }
        return sb.toString();
    }

    /**
     * Build a helpful offline response when LLM is unavailable.
     */
    private String buildOfflineResponse(String userMessage) {
        return "Xin lỗi, AI Assistant đang tạm thời không khả dụng. 🔌\n\n"
                + "Để kích hoạt AI, vui lòng:\n"
                + "1. Khởi động Ollama: `docker-compose up ollama`\n"
                + "2. Tải model: `ollama pull llama3`\n"
                + "3. Thử lại câu hỏi của bạn\n\n"
                + "Nếu cần hỗ trợ gấp, vui lòng liên hệ quản trị viên Lab.";
    }

    /**
     * Get RAG pipeline statistics for admin dashboard.
     */
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalDocuments", documentService.getDocumentCount());
        stats.put("totalSessions", chatHistoryService.getSessionCount());
        stats.put("totalMessages", chatHistoryService.getMessageCount());
        stats.put("documentStats", documentService.getDocumentStats());
        return stats;
    }
}
