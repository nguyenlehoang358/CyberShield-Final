package com.myweb.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

/**
 * Initializes pgvector extension and vector tables on application startup.
 *
 * Creates:
 * - pgvector extension (if not exists)
 * - lab_documents table with vector column for RAG similarity search
 * - security_events table for IDS alerts
 * - blocked_ips and login_attempts tables for brute force protection
 *
 * This runs AFTER JPA schema update (ddl-auto: update).
 */
@Component
@Order(1)
public class VectorStoreInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(VectorStoreInitializer.class);

    private final JdbcTemplate jdbcTemplate;

    public VectorStoreInitializer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    public void run(String... args) {
        try {
            // 1. Enable pgvector extension
            jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS vector");
            log.info("✅ pgvector extension enabled");

            // 2. Create lab_documents table (for AI Assistant RAG)
            jdbcTemplate.execute("""
                        CREATE TABLE IF NOT EXISTS lab_documents (
                            id BIGSERIAL PRIMARY KEY,
                            title VARCHAR(500) NOT NULL,
                            content TEXT,
                            doc_type VARCHAR(50) DEFAULT 'FAQ',
                            category VARCHAR(100),
                            embedding vector(384),
                            created_at TIMESTAMP DEFAULT NOW(),
                            updated_at TIMESTAMP DEFAULT NOW()
                        )
                    """);
            log.info("✅ lab_documents table ready");

            // 3. Create vector similarity index (IVFFlat)
            jdbcTemplate.execute("""
                        DO $$
                        BEGIN
                            IF NOT EXISTS (
                                SELECT 1 FROM pg_indexes WHERE indexname = 'idx_lab_docs_embedding'
                            ) THEN
                                CREATE INDEX idx_lab_docs_embedding ON lab_documents
                                    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
                            END IF;
                        END
                        $$
                    """);
            log.info("✅ Vector similarity index ready");

            // 4. Create security_events table (for AI Security Advisor)
            jdbcTemplate.execute("""
                        CREATE TABLE IF NOT EXISTS security_events (
                            id BIGSERIAL PRIMARY KEY,
                            source VARCHAR(50) DEFAULT 'APP_LOG',
                            severity VARCHAR(20) DEFAULT 'LOW',
                            event_type VARCHAR(100),
                            source_ip VARCHAR(45),
                            description TEXT,
                            raw_data JSONB,
                            ai_analysis TEXT,
                            resolved BOOLEAN DEFAULT FALSE,
                            created_at TIMESTAMP DEFAULT NOW()
                        )
                    """);
            log.info("✅ security_events table ready");

            // 5. Create blocked_ips table (for Brute Force Protection)
            jdbcTemplate.execute("""
                        CREATE TABLE IF NOT EXISTS blocked_ips (
                            id BIGSERIAL PRIMARY KEY,
                            ip_address VARCHAR(45) NOT NULL,
                            reason VARCHAR(500),
                            blocked_at TIMESTAMP DEFAULT NOW(),
                            expires_at TIMESTAMP,
                            is_permanent BOOLEAN DEFAULT FALSE,
                            blocked_by VARCHAR(50) DEFAULT 'AUTO'
                        )
                    """);
            log.info("✅ blocked_ips table ready");

            // 6. Create login_attempts table
            jdbcTemplate.execute("""
                        CREATE TABLE IF NOT EXISTS login_attempts (
                            id BIGSERIAL PRIMARY KEY,
                            ip_address VARCHAR(45),
                            username VARCHAR(255),
                            success BOOLEAN,
                            failure_reason VARCHAR(200),
                            user_agent TEXT,
                            geo_country VARCHAR(100),
                            geo_city VARCHAR(100),
                            created_at TIMESTAMP DEFAULT NOW()
                        )
                    """);
            log.info("✅ login_attempts table ready");

            // 7. Create chat_conversations table (AI Assistant history)
            jdbcTemplate.execute("""
                        CREATE TABLE IF NOT EXISTS chat_conversations (
                            id BIGSERIAL PRIMARY KEY,
                            session_id VARCHAR(100) NOT NULL,
                            user_id BIGINT,
                            role VARCHAR(20) NOT NULL,
                            message TEXT NOT NULL,
                            created_at TIMESTAMP DEFAULT NOW()
                        )
                    """);
            log.info("✅ chat_conversations table ready");

            // 8. Create helpful indexes
            jdbcTemplate.execute(
                    """
                                DO $$
                                BEGIN
                                    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_security_events_severity') THEN
                                        CREATE INDEX idx_security_events_severity ON security_events(severity);
                                    END IF;
                                    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_security_events_created') THEN
                                        CREATE INDEX idx_security_events_created ON security_events(created_at DESC);
                                    END IF;
                                    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_blocked_ips_address') THEN
                                        CREATE INDEX idx_blocked_ips_address ON blocked_ips(ip_address);
                                    END IF;
                                    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_login_attempts_ip') THEN
                                        CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address);
                                    END IF;
                                    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_login_attempts_created') THEN
                                        CREATE INDEX idx_login_attempts_created ON login_attempts(created_at DESC);
                                    END IF;
                                    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_chat_session') THEN
                                        CREATE INDEX idx_chat_session ON chat_conversations(session_id);
                                    END IF;
                                    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_security_events_source_ip') THEN
                                        CREATE INDEX idx_security_events_source_ip ON security_events(source_ip);
                                    END IF;
                                    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_security_events_type') THEN
                                        CREATE INDEX idx_security_events_type ON security_events(event_type);
                                    END IF;
                                    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_security_events_resolved') THEN
                                        CREATE INDEX idx_security_events_resolved ON security_events(resolved, severity);
                                    END IF;
                                END
                                $$
                            """);
            log.info("✅ All indexes created");

            log.info("══════════════════════════════════════════");
            log.info("  🏗️  Phase 1 Database Initialization OK  ");
            log.info("══════════════════════════════════════════");

        } catch (Exception e) {
            log.error("❌ Vector store initialization failed: {}", e.getMessage());
            log.error("   Make sure PostgreSQL has pgvector extension installed.");
            log.error("   Docker: use image 'pgvector/pgvector:pg15'");
            log.error("   Manual: CREATE EXTENSION vector;");
        }
    }
}
