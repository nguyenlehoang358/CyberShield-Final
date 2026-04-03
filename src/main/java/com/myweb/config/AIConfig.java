package com.myweb.config;

import java.time.Duration;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.myweb.service.SystemSettingService;

import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.embedding.onnx.allminilml6v2.AllMiniLmL6V2EmbeddingModel;
import dev.langchain4j.model.ollama.OllamaChatModel;

/**
 * AI / LLM Configuration
 *
 * Configures:
 * - Ollama Chat Model (local LLM for AI Assistant + Security Advisor)
 * - Embedding Model (all-MiniLM-L6-v2, runs locally via ONNX)
 *
 * Ollama is expected to run at http://localhost:11434
 * (or via Docker at http://ollama:11434)
 */
@Configuration
public class AIConfig {

    private static final Logger log = LoggerFactory.getLogger(AIConfig.class);

    private final SystemSettingService settingService;

    public AIConfig(SystemSettingService settingService) {
        this.settingService = settingService;
    }

    /**
     * Ollama Chat Model — connects to local Ollama server.
     * Used by AI Assistant (chatbot) and Security Advisor.
     *
     * If Ollama is not running, this bean will still be created
     * but calls will fail gracefully at the service layer.
     */
    @Bean
    public ChatLanguageModel chatLanguageModel() {
        String ollamaBaseUrl = settingService.getSettingValue("ai.ollama_url", "http://localhost:11434");
        String ollamaModel = settingService.getSettingValue("ai.ollama_model", "llama3.2");

        int maxTokens = 1000;
        int timeoutSeconds = 60;

        log.info("🤖 Configuring Ollama Chat Model: {} at {}", ollamaModel, ollamaBaseUrl);

        return OllamaChatModel.builder()
                .baseUrl(ollamaBaseUrl)
                .modelName(ollamaModel)
                .temperature(0.0)
                .numPredict(maxTokens)
                .timeout(Duration.ofSeconds(timeoutSeconds))
                .build();
    }

    /**
     * Local Embedding Model — all-MiniLM-L6-v2 (ONNX).
     * Runs entirely in-process, no external dependencies.
     * Output dimension: 384
     *
     * Used for:
     * - Converting user questions to vectors
     * - Converting LAB documents to vectors for similarity search
     */
    @Bean
    public EmbeddingModel embeddingModel() {
        log.info("📐 Initializing local embedding model: all-MiniLM-L6-v2 (384 dimensions)");
        return new AllMiniLmL6V2EmbeddingModel();
    }
}
