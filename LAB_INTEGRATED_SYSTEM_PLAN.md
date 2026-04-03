# 🏗️ KẾ HOẠCH HỆ THỐNG TÍCH HỢP PHÒNG LAB
## AI Assistant · AI Security Advisor · Brute Force Protection

> **Ngày lập:** 24/02/2026  
> **Stack hiện tại:** Spring Boot 3.2.5 (Java 17) + React (Vite) + PostgreSQL 15 + Docker  
> **Tác giả:** AI Solutions Architect & Security Systems Engineer

---

## 📋 MỤC LỤC

1. [Tổng quan kiến trúc](#1-tổng-quan-kiến-trúc)
2. [Trụ cột 1: AI Assistant](#2-trụ-cột-1-ai-assistant)
3. [Trụ cột 2: AI Security Advisor](#3-trụ-cột-2-ai-security-advisor)
4. [Trụ cột 3: Brute Force Protection](#4-trụ-cột-3-brute-force-protection)
5. [Công nghệ & Thư viện](#5-công-nghệ--thư-viện)
6. [Kiến trúc kết nối](#6-kiến-trúc-kết-nối)
7. [Roadmap triển khai](#7-roadmap-triển-khai)
8. [Cơ sở dữ liệu bổ sung](#8-cơ-sở-dữ-liệu-bổ-sung)

---

## 1. TỔNG QUAN KIẾN TRÚC

```
┌──────────────────────────────────────────────────────────────────┐
│                        FRONTEND (React/Vite)                     │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │  AI Chatbot   │  │ Security Dashboard│  │ Admin BF Monitor │  │
│  │  Widget (UI)  │  │  (Advisor Panel)  │  │  (Block/Unblock) │  │
│  └──────┬───────┘  └───────┬──────────┘  └────────┬──────────┘  │
└─────────┼──────────────────┼──────────────────────┼──────────────┘
          │ REST/WebSocket   │ REST                  │ REST
┌─────────▼──────────────────▼──────────────────────▼──────────────┐
│                  SPRING BOOT BACKEND (API Gateway)                │
│  ┌──────────────┐  ┌──────────────────┐  ┌───────────────────┐  │
│  │ ChatController│  │SecurityAdvisor   │  │BruteForceFilter   │  │
│  │              │  │Controller        │  │+ IPBlockService   │  │
│  └──────┬───────┘  └───────┬──────────┘  └────────┬──────────┘  │
│         │                  │                       │             │
│  ┌──────▼───────┐  ┌───────▼──────────┐  ┌────────▼──────────┐  │
│  │ ChatService   │  │SecurityAnalyzer  │  │BruteForceDetector │  │
│  │ (LangChain4j) │  │Service           │  │Service            │  │
│  └──────┬───────┘  └───────┬──────────┘  └────────┬──────────┘  │
└─────────┼──────────────────┼──────────────────────┼──────────────┘
          │                  │                       │
┌─────────▼──────────────────▼──────────────────────▼──────────────┐
│           DATA & EXTERNAL SERVICES LAYER                         │
│  ┌────────────┐ ┌────────────┐ ┌──────────┐ ┌────────────────┐  │
│  │ PostgreSQL  │ │ Redis      │ │ Ollama/  │ │ Suricata Logs  │  │
│  │ (Main DB)   │ │ (Cache+BF) │ │ OpenAI   │ │ (IDS Alerts)   │  │
│  └────────────┘ └────────────┘ └──────────┘ └────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

---

## 2. TRỤ CỘT 1: AI ASSISTANT (Trợ lý Ảo)

### 2.1 Mục tiêu
| Đối tượng | Chức năng |
|-----------|-----------|
| **User** | FAQ, hướng dẫn thiết bị/phần mềm, tra cứu tài liệu |
| **Admin** | Tra cứu log, thống kê nhanh, quản lý thiết bị |

### 2.2 Kiến trúc Chatbot

```
User Input ──► Intent Classifier ──► RAG Pipeline ──► LLM ──► Response
                                        │
                                 ┌──────▼──────┐
                                 │ Vector Store │ (pgvector / ChromaDB)
                                 │ FAQ Docs     │
                                 │ Lab Manuals  │
                                 └─────────────┘
```

### 2.3 Thành phần kỹ thuật

| Component | Công nghệ | Mô tả |
|-----------|-----------|-------|
| LLM Engine | **LangChain4j** + Ollama (Llama3/Mistral) hoặc OpenAI API | Xử lý ngôn ngữ tự nhiên |
| Vector Store | **pgvector** (extension PostgreSQL) | Lưu embedding tài liệu LAB |
| Embedding Model | `all-MiniLM-L6-v2` (local) hoặc `text-embedding-3-small` (OpenAI) | Chuyển text → vector |
| Chat UI | React Widget (WebSocket) | Giao diện hội thoại real-time |
| Knowledge Base | Markdown/PDF files | Tài liệu LAB, FAQ, hướng dẫn |

### 2.4 Luồng xử lý

```
1. User gửi câu hỏi qua Chat Widget
2. Backend nhận qua WebSocket → ChatController
3. ChatService:
   a. Embed câu hỏi → vector
   b. Tìm kiếm tài liệu liên quan trong pgvector (Top-K similarity)
   c. Xây dựng prompt = System Prompt + Context Documents + User Question
   d. Gửi prompt đến LLM (Ollama local hoặc OpenAI)
   e. Trả response về qua WebSocket
4. Lưu conversation history vào PostgreSQL
```

### 2.5 Backend Files cần tạo

```
src/main/java/com/myweb/
├── ai/
│   ├── ChatController.java          # REST + WebSocket endpoints
│   ├── ChatService.java             # Business logic + LangChain4j
│   ├── DocumentIngestionService.java # Nạp tài liệu vào vector store
│   ├── EmbeddingService.java        # Text → Vector embedding
│   └── dto/
│       ├── ChatRequest.java
│       └── ChatResponse.java
├── entity/
│   ├── ChatConversation.java        # Lưu lịch sử hội thoại
│   └── LabDocument.java             # Metadata tài liệu LAB
└── repository/
    ├── ChatConversationRepository.java
    └── LabDocumentRepository.java
```

### 2.6 Frontend Files cần tạo

```
frontend/src/
├── components/
│   └── AIChatWidget/
│       ├── AIChatWidget.jsx         # Floating chatbot widget
│       └── AIChatWidget.css
├── pages/
│   └── AIAssistant/
│       ├── AIAssistant.jsx          # Full-page chat interface
│       └── AIAssistant.css
```

---

## 3. TRỤ CỘT 2: AI SECURITY ADVISOR

### 3.1 Mục tiêu

| Đối tượng | Chức năng |
|-----------|-----------|
| **User** | Nhận diện rủi ro bảo mật cơ bản, khuyến nghị |
| **Admin** | Phân tích cảnh báo IDS, dashboard giám sát |

### 3.2 Kiến trúc

```
┌─────────────────────────────────────────────┐
│            Security Data Sources            │
│  ┌───────────┐ ┌──────────┐ ┌────────────┐ │
│  │Suricata   │ │App Logs  │ │Auth Events │ │
│  │IDS Alerts │ │(Actuator)│ │(Login/Fail)│ │
│  └─────┬─────┘ └────┬─────┘ └─────┬──────┘ │
└────────┼────────────┼──────────────┼────────┘
         └────────────┼──────────────┘
                ┌─────▼─────┐
                │ Log       │  ← Filebeat/Logstash (thu thập)
                │ Aggregator│
                └─────┬─────┘
                ┌─────▼──────────────┐
                │ SecurityAnalyzer   │
                │ Service            │
                │ ┌────────────────┐ │
                │ │ Rule Engine    │ │  ← Luật phân tích tĩnh
                │ │ (Severity,     │ │
                │ │  Pattern Match)│ │
                │ └────────────────┘ │
                │ ┌────────────────┐ │
                │ │ AI Analyzer    │ │  ← LLM phân tích ngữ cảnh
                │ │ (LangChain4j)  │ │
                │ └────────────────┘ │
                └─────┬──────────────┘
                ┌─────▼─────┐
                │ Dashboard │  ← React Admin Panel
                └───────────┘
```

### 3.3 Thành phần kỹ thuật

| Component | Công nghệ | Mô tả |
|-----------|-----------|-------|
| IDS Engine | **Suricata** (Docker container) | Phân tích traffic mạng |
| Log Collection | **Filebeat** → PostgreSQL/Elasticsearch | Thu thập log |
| Rule Engine | Java (Custom) | Pattern matching, severity scoring |
| AI Analyzer | **LangChain4j** + LLM | Phân tích ngữ cảnh cảnh báo |
| Dashboard | React + Chart.js/Recharts | Biểu đồ, bảng cảnh báo |

### 3.4 Backend Files cần tạo

```
src/main/java/com/myweb/
├── security/advisor/
│   ├── SecurityAdvisorController.java  # API endpoints
│   ├── SecurityAnalyzerService.java    # Core analysis logic
│   ├── AlertRuleEngine.java            # Static rule matching
│   ├── ThreatClassifier.java           # AI-based classification
│   ├── LogIngestionService.java        # Import logs from IDS
│   └── dto/
│       ├── SecurityAlert.java
│       ├── ThreatAnalysis.java
│       └── RiskAssessment.java
├── entity/
│   ├── SecurityEvent.java              # Sự kiện bảo mật
│   └── AlertHistory.java              # Lịch sử cảnh báo
```

### 3.5 Chức năng cho User vs Admin

**User-facing (Security Check):**
- Kiểm tra password strength
- Scan URL/domain reputation
- Kiểm tra email trong breach databases
- Khuyến nghị bảo mật cá nhân

**Admin-facing (Security Dashboard):**
- Real-time alert feed từ Suricata
- Severity classification (Critical/High/Medium/Low)
- AI phân tích & tóm tắt cảnh báo
- Trend charts (attacks/day, top attack types)
- Export report PDF

---

## 4. TRỤ CỘT 3: BRUTE FORCE PROTECTION

### 4.1 Hiện trạng
Hệ thống **đã có** `RateLimitFilter.java` với:
- Token Bucket per IP (10 auth req/min, 100 API req/min)
- Trả 429 khi vượt ngưỡng

**Cần nâng cấp** thành hệ thống phòng vệ đa tầng:

### 4.2 Kiến trúc 3 tầng

```
TẦNG 1: Rate Limiting (Hiện có - Nâng cấp)
├── Sliding Window Counter (thay Token Bucket)
├── Adaptive thresholds per endpoint
└── Redis-backed (persistent across restarts)

TẦNG 2: Brute Force Detector (Mới)
├── Login Failure Tracker (per IP + per Account)
├── Progressive Lockout: 5 fails → 1min, 10 → 5min, 20 → 1h
├── CAPTCHA trigger sau 3 fails
└── Account lockout notification (email)

TẦNG 3: AI Behavior Analyzer (Mới)
├── Pattern Detection: credential stuffing, password spraying
├── Geo-anomaly: login từ location bất thường
├── Time-anomaly: login ngoài giờ bình thường
└── Auto IP block + Admin alert
```

### 4.3 Thành phần kỹ thuật

| Component | Công nghệ | Mô tả |
|-----------|-----------|-------|
| Cache/Counter | **Redis** (Docker) | Sliding window, IP block list |
| IP Blocking | Spring Filter + **iptables** (Linux) | Multi-layer blocking |
| CAPTCHA | **hCaptcha** / Google reCAPTCHA v3 | Bot detection |
| Notification | Spring Mail / WebSocket | Realtime admin alert |
| AI Analyzer | Scikit-learn (Python microservice) hoặc Java ML | Anomaly detection |
| GeoIP | **MaxMind GeoLite2** | IP → Location |

### 4.4 Backend Files cần tạo/sửa

```
src/main/java/com/myweb/
├── config/
│   ├── RateLimitFilter.java            # ← NÂNG CẤP (Redis-backed)
│   ├── RedisConfig.java                # ← MỚI
│   └── BruteForceFilter.java           # ← MỚI (trước JwtAuthFilter)
├── security/bruteforce/
│   ├── BruteForceDetectorService.java  # Core detection logic
│   ├── IPBlockService.java             # Manage blocked IPs
│   ├── LoginAttemptService.java        # Track login failures
│   ├── BehaviorAnalyzer.java           # AI pattern detection
│   ├── GeoIPService.java              # IP geolocation
│   └── dto/
│       ├── BlockedIP.java
│       ├── LoginAttempt.java
│       └── BehaviorScore.java
├── entity/
│   ├── BlockedIPEntity.java
│   └── LoginAttemptEntity.java
```

### 4.5 Luồng xử lý Brute Force

```
Request → BruteForceFilter
            │
            ├─► Check IP in Redis blocklist → BLOCKED? → 403 Forbidden
            │
            ├─► RateLimitFilter (Sliding Window) → EXCEEDED? → 429
            │
            ├─► Login Attempt → FAILED?
            │       │
            │       ├─► Increment failure count (Redis)
            │       ├─► failures >= 3? → Require CAPTCHA
            │       ├─► failures >= 5? → Temp block 1min
            │       ├─► failures >= 10? → Temp block 5min
            │       ├─► failures >= 20? → Block 1h + Alert Admin
            │       └─► AI Analyzer:
            │               ├─► Credential stuffing pattern? → Block + Alert
            │               ├─► Password spraying? → Block range + Alert
            │               └─► Geo-anomaly? → Require 2FA
            │
            └─► SUCCESS → Reset failure count
```

---

## 5. CÔNG NGHỆ & THƯ VIỆN

### 5.1 Backend (Java/Spring Boot)

| Thư viện | Version | Mục đích | Maven Dependency |
|----------|---------|----------|------------------|
| **LangChain4j** | 0.35.0 | AI/LLM integration | `dev.langchain4j:langchain4j-spring-boot-starter` |
| **LangChain4j Ollama** | 0.35.0 | Local LLM | `dev.langchain4j:langchain4j-ollama` |
| **pgvector-java** | 0.1.4 | Vector similarity search | `com.pgvector:pgvector` |
| **Spring Data Redis** | (managed) | Cache, rate limiting | `spring-boot-starter-data-redis` |
| **Spring WebSocket** | (managed) | Real-time chat | `spring-boot-starter-websocket` |
| **Spring Mail** | (managed) | Alert notifications | `spring-boot-starter-mail` |
| **MaxMind GeoIP2** | 4.2.0 | IP geolocation | `com.maxmind.geoip2:geoip2` |
| **Apache Tika** | 2.9.1 | PDF/Doc parsing | `org.apache.tika:tika-core` |

### 5.2 Frontend (React)

| Thư viện | Mục đích |
|----------|----------|
| `@stomp/stompjs` + `sockjs-client` | WebSocket chat |
| `recharts` / `chart.js` | Security dashboard charts |
| `react-markdown` | Render Chatbot responses |
| `react-syntax-highlighter` | Code blocks in chat |

### 5.3 Infrastructure (Docker)

| Service | Image | Port | Mục đích |
|---------|-------|------|----------|
| **Redis** | `redis:7-alpine` | 6379 | Cache + BF counters |
| **Ollama** | `ollama/ollama:latest` | 11434 | Local LLM server |
| **Suricata** | `jasonish/suricata:latest` | - | Network IDS |
| **Elasticsearch** | `elasticsearch:8.12.0` | 9200 | Log storage (optional) |

---

## 6. KIẾN TRÚC KẾT NỐI

### 6.1 Docker Compose mở rộng

```yaml
# Thêm vào docker-compose.yml hiện tại
services:
  # ... (db, backend, frontend, pgadmin giữ nguyên)

  redis:
    image: redis:7-alpine
    container_name: myweb-redis
    ports: ["6379:6379"]
    volumes: [redis_data:/data]
    command: redis-server --appendonly yes

  ollama:
    image: ollama/ollama:latest
    container_name: myweb-ollama
    ports: ["11434:11434"]
    volumes: [ollama_data:/root/.ollama]
    # GPU passthrough (nếu có):
    # deploy:
    #   resources:
    #     reservations:
    #       devices:
    #         - capabilities: [gpu]

  suricata:
    image: jasonish/suricata:latest
    container_name: myweb-suricata
    network_mode: host
    cap_add: [NET_ADMIN, SYS_NICE]
    volumes:
      - ./suricata/rules:/etc/suricata/rules
      - suricata_logs:/var/log/suricata

volumes:
  db_data:
  redis_data:
  ollama_data:
  suricata_logs:
```

### 6.2 Sơ đồ kết nối giữa các service

```
Internet ──► [Nginx Reverse Proxy] ──► Frontend (:3000)
                    │
                    ├──► Backend (:8443)
                    │       ├──► PostgreSQL (:5432) + pgvector
                    │       ├──► Redis (:6379)
                    │       ├──► Ollama (:11434)
                    │       └──► Suricata logs (volume mount)
                    │
                    └──► PgAdmin (:8080)
```

### 6.3 API Endpoints mới

```
# AI Assistant
POST   /api/ai/chat                    # Gửi tin nhắn chatbot
GET    /api/ai/conversations           # Lịch sử hội thoại
POST   /api/ai/documents/upload        # Upload tài liệu LAB (Admin)
GET    /api/ai/documents               # Danh sách tài liệu

# AI Security Advisor
GET    /api/security/alerts            # Danh sách cảnh báo
GET    /api/security/alerts/:id/analyze # AI phân tích cảnh báo
GET    /api/security/dashboard         # Thống kê tổng quan
POST   /api/security/scan-url          # Kiểm tra URL (User)
POST   /api/security/check-password    # Kiểm tra password (User)

# Brute Force Protection
GET    /api/admin/blocked-ips          # Danh sách IP bị chặn
POST   /api/admin/blocked-ips/:ip/unblock  # Mở chặn IP
GET    /api/admin/login-attempts       # Lịch sử đăng nhập thất bại
GET    /api/admin/bf-stats             # Thống kê brute force
```

---

## 7. ROADMAP TRIỂN KHAI

### Phase 1: Foundation (Tuần 1-2) 🔵
> **Mục tiêu:** Hạ tầng cơ bản

| Task | Chi tiết | Ưu tiên |
|------|----------|---------|
| Redis setup | Docker container + Spring Data Redis config | P0 |
| Upgrade RateLimitFilter | Chuyển sang Redis-backed sliding window | P0 |
| Ollama setup | Docker container + pull model Llama3/Mistral | P0 |
| pgvector extension | Cài đặt extension cho PostgreSQL | P0 |
| WebSocket config | Spring WebSocket + STOMP config | P1 |

### Phase 2: Brute Force Protection (Tuần 2-3) 🟡
> **Mục tiêu:** Hoàn thiện hệ thống phòng vệ

| Task | Chi tiết | Ưu tiên |
|------|----------|---------|
| BruteForceFilter | Filter chain trước JwtAuthFilter | P0 |
| LoginAttemptService | Track failures per IP + per account (Redis) | P0 |
| IPBlockService | Block/unblock IP, auto-expire | P0 |
| Progressive lockout | 3→CAPTCHA, 5→1min, 10→5min, 20→1h | P1 |
| Admin UI (Blocked IPs) | React page: bảng IP, unblock button | P1 |
| GeoIP integration | MaxMind GeoLite2 cho geo-anomaly | P2 |

### Phase 3: AI Assistant (Tuần 3-5) 🟢
> **Mục tiêu:** Chatbot hoạt động

| Task | Chi tiết | Ưu tiên |
|------|----------|---------|
| LangChain4j integration | Maven deps + OllamaService config | P0 |
| DocumentIngestion | Upload + parse PDF/MD → embedding → pgvector | P0 |
| ChatService (RAG) | Retrieve context + generate response | P0 |
| Chat Widget UI | Floating widget góc phải, WebSocket | P0 |
| FAQ seeding | Nạp FAQ có sẵn vào vector store | P1 |
| Conversation history | Lưu + hiển thị lịch sử chat | P1 |
| Admin chat mode | Cho phép admin tra cứu log/thống kê qua chat | P2 |

### Phase 4: AI Security Advisor (Tuần 5-7) 🔴
> **Mục tiêu:** Dashboard giám sát bảo mật

| Task | Chi tiết | Ưu tiên |
|------|----------|---------|
| Suricata setup | Docker + basic rules | P0 |
| LogIngestionService | Đọc Suricata eve.json → SecurityEvent entities | P0 |
| AlertRuleEngine | Classify theo severity, pattern matching | P0 |
| Security Dashboard UI | Charts, alert table, filters | P0 |
| AI Alert Analysis | LLM phân tích & tóm tắt cảnh báo | P1 |
| User security tools | Password check, URL scan | P1 |
| BehaviorAnalyzer | ML anomaly detection cho brute force | P2 |

### Phase 5: Integration & Polish (Tuần 7-8) 🟣
> **Mục tiêu:** Tích hợp, testing, tối ưu

| Task | Chi tiết | Ưu tiên |
|------|----------|---------|
| Cross-pillar integration | BF alerts → Security Dashboard | P0 |
| AI Advisor ↔ Chatbot | Chatbot trả lời câu hỏi security | P1 |
| Performance tuning | Redis caching, connection pooling | P1 |
| Security audit | Penetration testing, OWASP checklist | P0 |
| Documentation | API docs (Swagger), user guides | P1 |
| Monitoring | Prometheus + Grafana (optional) | P2 |

---

## 8. CƠ SỞ DỮ LIỆU BỔ SUNG

### 8.1 Database Schema mới (PostgreSQL)

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- AI Assistant tables
CREATE TABLE lab_documents (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    doc_type VARCHAR(50),           -- FAQ, MANUAL, GUIDE
    embedding vector(384),           -- all-MiniLM-L6-v2 dimension
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE chat_conversations (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES users(id),
    role VARCHAR(20),                -- USER, ASSISTANT
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Security tables
CREATE TABLE security_events (
    id BIGSERIAL PRIMARY KEY,
    source VARCHAR(50),              -- SURICATA, APP_LOG, AUTH
    severity VARCHAR(20),            -- CRITICAL, HIGH, MEDIUM, LOW
    event_type VARCHAR(100),
    source_ip VARCHAR(45),
    description TEXT,
    raw_data JSONB,
    ai_analysis TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Brute Force tables
CREATE TABLE blocked_ips (
    id BIGSERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    reason VARCHAR(500),
    blocked_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP,
    is_permanent BOOLEAN DEFAULT FALSE,
    blocked_by VARCHAR(50)           -- AUTO, ADMIN
);

CREATE TABLE login_attempts (
    id BIGSERIAL PRIMARY KEY,
    ip_address VARCHAR(45),
    username VARCHAR(255),
    success BOOLEAN,
    failure_reason VARCHAR(200),
    user_agent TEXT,
    geo_country VARCHAR(100),
    geo_city VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_lab_docs_embedding ON lab_documents
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_created ON security_events(created_at);
CREATE INDEX idx_blocked_ips_address ON blocked_ips(ip_address);
CREATE INDEX idx_blocked_ips_expires ON blocked_ips(expires_at);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_created ON login_attempts(created_at);
```

### 8.2 Redis Key Structure

```
# Brute Force
bf:login_failures:{ip}          → Counter (TTL: 1h)
bf:login_failures:{username}    → Counter (TTL: 1h)
bf:blocked:{ip}                 → "1" (TTL: dynamic)
bf:captcha_required:{ip}        → "1" (TTL: 5min)

# Rate Limiting
rl:auth:{ip}:{window}           → Counter (TTL: 60s)
rl:api:{ip}:{window}            → Counter (TTL: 60s)

# AI Chat
chat:session:{sessionId}        → JSON conversation context (TTL: 30min)
```

---

## 📌 GHI CHÚ QUAN TRỌNG

1. **LLM Selection:** Ưu tiên **Ollama + Llama3** (chạy local, miễn phí, bảo mật). Fallback sang OpenAI API nếu cần chất lượng cao hơn.

2. **Tương thích:** Toàn bộ thiết kế tương thích với stack hiện tại (Spring Boot 3.2.5, PostgreSQL 15, Docker Compose).

3. **Bảo mật:** Mọi API mới đều được bảo vệ bởi JWT + RBAC hiện có. Admin endpoints yêu cầu `ROLE_ADMIN`.

4. **Scalability:** Redis cho phép scale horizontal. Ollama có thể chạy trên GPU server riêng.

5. **Phương án thay thế:**
   - Không có GPU → Dùng OpenAI API thay Ollama
   - Không cần Suricata → Chỉ phân tích application logs
   - Đơn giản hóa → Bỏ Phase 4 AI Analyzer, giữ rule-based
