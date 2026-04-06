package com.myweb.config;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.myweb.service.SystemSettingService;

import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.chat.ChatLanguageModel;
import dev.langchain4j.model.embedding.EmbeddingModel;
import dev.langchain4j.model.ollama.OllamaChatModel;
import dev.langchain4j.model.output.Response;

/**
 * AI / LLM Configuration
 *
 * Configures:
 * - Ollama Chat Model (local LLM for AI Assistant + Security Advisor)
 * - MOCK Embedding Model (To save memory on Render Free)
 */
@Configuration
public class AIConfig {

    private static final Logger log = LoggerFactory.getLogger(AIConfig.class);

    private final SystemSettingService settingService;

    public AIConfig(SystemSettingService settingService) {
        this.settingService = settingService;
    }

    /**
     * MOCK Chat Model — Prevents blocking backend threads when Ollama is offline.
     * All primary AI functions (Mentor, SOC, Chat) now use OllamaLabMentorService (HF Cloud).
     */
    @Bean
    public ChatLanguageModel chatLanguageModel() {
        log.info("🤖 AI Config: Using CLOUD-FIRST Mock Model (Ensures zero-hang on local).");

        return new ChatLanguageModel() {
            @Override
            public String generate(String message) {
                return "CyberShield Cloud AI is active (Qwen 2.5 via HF). Local Ollama is bypassed for stability.";
            }

            @Override
            public dev.langchain4j.model.output.Response<dev.langchain4j.data.message.AiMessage> generate(java.util.List<dev.langchain4j.data.message.ChatMessage> messages) {
                return dev.langchain4j.model.output.Response.from(dev.langchain4j.data.message.AiMessage.from("CyberShield Cloud AI ready."));
            }
        };
    }

    /**
     * MOCK Embedding Model
     * Trả về vector ảo để tiết kiệm RAM, giúp deploy lên Render thành công.
     */
    @Bean
    public EmbeddingModel embeddingModel() {
        System.out.println("⚠️ MOCK EMBEDDING MODEL IS RUNNING (To save memory on Render Free) ⚠️");

        return new EmbeddingModel() {
            @Override
            public Response<List<Embedding>> embedAll(List<TextSegment> textSegments) {
                // Trả về các vector ảo (0.0) để đánh lừa Spring Boot
                List<Embedding> mockEmbeddings = new ArrayList<>();
                for (int i = 0; i < textSegments.size(); i++) {
                    mockEmbeddings.add(new Embedding(new float[] { 0.0f, 0.0f }));
                }
                return Response.from(mockEmbeddings);
            }
        };
    }
}