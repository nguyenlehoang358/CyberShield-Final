package com.myweb.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import dev.langchain4j.data.embedding.Embedding;
import dev.langchain4j.data.segment.TextSegment;
import dev.langchain4j.model.embedding.EmbeddingModel;

/**
 * Document Service - manages LAB documents for RAG pipeline.
 *
 * Responsibilities:
 * 1. Store documents with vector embeddings in pgvector
 * 2. Split large documents into chunks for better retrieval
 * 3. Perform semantic similarity search for context retrieval
 * 4. CRUD operations for admin document management
 */
@Service
public class DocumentService {

    private static final Logger log = LoggerFactory.getLogger(DocumentService.class);
    private static final int CHUNK_SIZE = 500;
    private static final int CHUNK_OVERLAP = 50;

    private final JdbcTemplate jdbcTemplate;
    private final EmbeddingModel embeddingModel;

    @Value("${app.vector.dimension:384}")
    private int vectorDimension;

    @Value("${app.vector.similarity-threshold:0.7}")
    private double similarityThreshold;

    @Value("${app.vector.max-results:5}")
    private int maxResults;

    public DocumentService(JdbcTemplate jdbcTemplate, EmbeddingModel embeddingModel) {
        this.jdbcTemplate = jdbcTemplate;
        this.embeddingModel = embeddingModel;
    }

    /**
     * Ingest a document: split into chunks, embed each chunk, store in pgvector.
     */
    public int ingestDocument(String title, String content, String docType, String category) {
        log.info("Ingesting document: '{}' (type={}, category={})", title, docType, category);

        List<String> chunks = splitIntoChunks(content, CHUNK_SIZE, CHUNK_OVERLAP);
        log.info("   Split into {} chunks", chunks.size());

        int stored = 0;
        for (int i = 0; i < chunks.size(); i++) {
            String chunk = chunks.get(i);
            String chunkTitle = chunks.size() == 1 ? title : title + " [" + (i + 1) + "/" + chunks.size() + "]";

            try {
                Embedding embedding = embeddingModel.embed(TextSegment.from(chunk)).content();
                float[] vector = embedding.vector();
                String vectorStr = vectorToString(vector);
                jdbcTemplate.update(
                        "INSERT INTO lab_documents (title, content, doc_type, category, embedding) VALUES (?, ?, ?, ?, ?::vector)",
                        chunkTitle, chunk, docType, category, vectorStr);
                stored++;
            } catch (Exception e) {
                log.error("   Failed to embed chunk {}: {}", i, e.getMessage());
            }
        }

        log.info("Stored {} chunks for document '{}'", stored, title);
        return stored;
    }

    /**
     * Ingest a short FAQ-style entry (no chunking needed).
     */
    public void ingestFAQ(String question, String answer, String category) {
        String content = "Q: " + question + "\nA: " + answer;
        try {
            Embedding embedding = embeddingModel.embed(TextSegment.from(content)).content();
            String vectorStr = vectorToString(embedding.vector());
            jdbcTemplate.update(
                    "INSERT INTO lab_documents (title, content, doc_type, category, embedding) VALUES (?, ?, 'FAQ', ?, ?::vector)",
                    question, content, category, vectorStr);
            log.info("FAQ ingested: '{}'", question);
        } catch (Exception e) {
            log.error("Failed to ingest FAQ: {}", e.getMessage());
        }
    }

    /**
     * Find the most relevant document chunks for a query using cosine similarity.
     */
    public List<Map<String, Object>> searchSimilar(String query, int topK) {
        try {
            Embedding queryEmbedding = embeddingModel.embed(TextSegment.from(query)).content();
            String queryVector = vectorToString(queryEmbedding.vector());

            String sql = """
                    SELECT id, title, content, doc_type, category,
                           1 - (embedding <=> ?::vector) AS similarity
                    FROM lab_documents
                    WHERE embedding IS NOT NULL
                    ORDER BY embedding <=> ?::vector
                    LIMIT ?
                    """;

            List<Map<String, Object>> results = jdbcTemplate.queryForList(sql, queryVector, queryVector, topK);

            List<Map<String, Object>> filtered = new ArrayList<>();
            for (Map<String, Object> row : results) {
                double similarity = ((Number) row.get("similarity")).doubleValue();
                if (similarity >= similarityThreshold) {
                    filtered.add(row);
                }
            }

            log.debug("RAG search '{}...' found {} results (threshold={})",
                    query.substring(0, Math.min(query.length(), 40)),
                    filtered.size(), similarityThreshold);

            return filtered;
        } catch (Exception e) {
            log.error("Similarity search error: {}", e.getMessage());
            return List.of();
        }
    }

    /**
     * Search with default topK from config.
     */
    public List<Map<String, Object>> searchSimilar(String query) {
        return searchSimilar(query, maxResults);
    }

    /**
     * Get all documents (without embeddings).
     */
    public List<Map<String, Object>> getAllDocuments() {
        return jdbcTemplate.queryForList(
                "SELECT id, title, content, doc_type, category, created_at, updated_at FROM lab_documents ORDER BY created_at DESC");
    }

    /**
     * Get document count.
     */
    public long getDocumentCount() {
        Long count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM lab_documents", Long.class);
        return count != null ? count : 0;
    }

    /**
     * Delete a document by ID.
     */
    public void deleteDocument(Long id) {
        jdbcTemplate.update("DELETE FROM lab_documents WHERE id = ?", id);
        log.info("Document {} deleted", id);
    }

    /**
     * Get document statistics per category.
     */
    public List<Map<String, Object>> getDocumentStats() {
        return jdbcTemplate.queryForList(
                "SELECT category, doc_type, COUNT(*) as count FROM lab_documents GROUP BY category, doc_type ORDER BY count DESC");
    }

    /**
     * Split text into overlapping chunks for better context preservation.
     */
    private List<String> splitIntoChunks(String text, int chunkSize, int overlap) {
        List<String> chunks = new ArrayList<>();
        if (text == null || text.isBlank())
            return chunks;

        text = text.replaceAll("\\s+", " ").trim();

        if (text.length() <= chunkSize) {
            chunks.add(text);
            return chunks;
        }

        int start = 0;
        while (start < text.length()) {
            int end = Math.min(start + chunkSize, text.length());

            if (end < text.length()) {
                int sentenceBreak = findSentenceBreak(text, start + chunkSize / 2, end);
                if (sentenceBreak > start) {
                    end = sentenceBreak;
                }
            }

            chunks.add(text.substring(start, end).trim());
            start = end - overlap;

            if (start >= text.length() - overlap)
                break;
        }

        return chunks;
    }

    /**
     * Find the nearest sentence-ending character within range.
     */
    private int findSentenceBreak(String text, int from, int to) {
        for (int i = to; i >= from; i--) {
            char c = text.charAt(i);
            if (c == '.' || c == '!' || c == '?' || c == '\n') {
                return i + 1;
            }
        }
        for (int i = to; i >= from; i--) {
            if (text.charAt(i) == ' ')
                return i + 1;
        }
        return to;
    }

    /**
     * Convert float[] vector to PostgreSQL-compatible string: [0.1,0.2,...]
     */
    private String vectorToString(float[] vector) {
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < vector.length; i++) {
            if (i > 0)
                sb.append(",");
            sb.append(vector[i]);
        }
        sb.append("]");
        return sb.toString();
    }
}
