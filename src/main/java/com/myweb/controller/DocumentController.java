package com.myweb.controller;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.myweb.service.DocumentService;

/**
 * Document Management Controller — Admin API for LAB documents.
 *
 * All endpoints require ROLE_ADMIN.
 *
 * Endpoints:
 * GET /api/admin/documents → List all documents
 * GET /api/admin/documents/stats → Document statistics
 * POST /api/admin/documents/text → Upload text document
 * POST /api/admin/documents/faq → Add FAQ entry
 * POST /api/admin/documents/upload → Upload file (PDF/TXT)
 * POST /api/admin/documents/seed → Seed default FAQ data
 * DELETE /api/admin/documents/{id} → Delete document
 */
@RestController
@RequestMapping("/api/admin/documents")
@PreAuthorize("hasRole('ADMIN')")
public class DocumentController {

    private static final Logger log = LoggerFactory.getLogger(DocumentController.class);

    private final DocumentService documentService;

    public DocumentController(DocumentService documentService) {
        this.documentService = documentService;
    }

    /**
     * GET /api/admin/documents
     * List all documents (without embeddings).
     */
    @GetMapping
    public ResponseEntity<List<Map<String, Object>>> listDocuments() {
        return ResponseEntity.ok(documentService.getAllDocuments());
    }

    /**
     * GET /api/admin/documents/stats
     * Document statistics per category.
     */
    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalDocuments", documentService.getDocumentCount());
        stats.put("categories", documentService.getDocumentStats());
        return ResponseEntity.ok(stats);
    }

    /**
     * POST /api/admin/documents/text
     * Ingest a text document (with chunking + embedding).
     * Body: { "title": "...", "content": "...", "docType": "MANUAL", "category":
     * "..." }
     */
    @PostMapping("/text")
    public ResponseEntity<?> ingestText(@RequestBody Map<String, String> body) {
        String title = body.get("title");
        String content = body.get("content");
        String docType = body.getOrDefault("docType", "MANUAL");
        String category = body.getOrDefault("category", "general");

        if (title == null || content == null || content.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Title and content are required"));
        }

        int chunks = documentService.ingestDocument(title, content, docType, category);
        log.info("📄 Document ingested: '{}' → {} chunks", title, chunks);

        return ResponseEntity.ok(Map.of(
                "message", "Document ingested successfully",
                "title", title,
                "chunks", chunks));
    }

    /**
     * POST /api/admin/documents/faq
     * Add an FAQ entry (short Q&A pair).
     * Body: { "question": "...", "answer": "...", "category": "..." }
     */
    @PostMapping("/faq")
    public ResponseEntity<?> addFAQ(@RequestBody Map<String, String> body) {
        String question = body.get("question");
        String answer = body.get("answer");
        String category = body.getOrDefault("category", "general");

        if (question == null || answer == null || answer.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Question and answer are required"));
        }

        documentService.ingestFAQ(question, answer, category);
        return ResponseEntity.ok(Map.of(
                "message", "FAQ ingested successfully",
                "question", question));
    }

    /**
     * POST /api/admin/documents/upload
     * Upload a file (TXT, MD supported — PDF can be added with Tika).
     */
    @PostMapping("/upload")
    public ResponseEntity<?> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "category", defaultValue = "uploaded") String category) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "File is empty"));
        }

        String filename = file.getOriginalFilename();
        String contentType = file.getContentType();
        log.info("📁 Uploading file: {} ({})", filename, contentType);

        try {
            String content;

            // Extract text content based on file type
            if (filename != null && (filename.endsWith(".txt") || filename.endsWith(".md"))) {
                content = new String(file.getBytes(), "UTF-8");
            } else if (filename != null && filename.endsWith(".csv")) {
                content = new String(file.getBytes(), "UTF-8");
            } else {
                // For PDF and others, try reading as text (Tika integration placeholder)
                try {
                    content = new String(file.getBytes(), "UTF-8");
                } catch (Exception e) {
                    return ResponseEntity.badRequest().body(Map.of(
                            "error", "Unsupported file format. Currently supported: .txt, .md, .csv"));
                }
            }

            if (content.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "File has no readable content"));
            }

            String docType = "FILE_UPLOAD";
            int chunks = documentService.ingestDocument(
                    filename != null ? filename : "uploaded_document",
                    content, docType, category);

            return ResponseEntity.ok(Map.of(
                    "message", "File ingested successfully",
                    "filename", filename != null ? filename : "unknown",
                    "chunks", chunks,
                    "contentLength", content.length()));

        } catch (Exception e) {
            log.error("❌ File upload error: {}", e.getMessage());
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Failed to process file: " + e.getMessage()));
        }
    }

    /**
     * POST /api/admin/documents/seed
     * Seed the knowledge base with default LAB FAQ data.
     */
    @PostMapping("/seed")
    public ResponseEntity<?> seedDefaultData() {
        log.info("🌱 Seeding default LAB knowledge base...");

        int count = 0;

        // ═══ Security Tools ═══
        documentService.ingestFAQ(
                "Wireshark là gì và cách sử dụng?",
                "Wireshark là công cụ phân tích giao thức mạng (packet sniffer). Trong phòng LAB, Wireshark được sử dụng để: 1) Bắt và phân tích gói tin mạng 2) Phát hiện tấn công mạng 3) Debug vấn đề kết nối. Cách sử dụng: Mở Wireshark → Chọn interface → Start capture → Dùng filter (tcp, http, dns). Lưu ý: Chỉ capture trên mạng LAB, không dùng trên mạng production.",
                "security-tools");
        count++;

        documentService.ingestFAQ(
                "Nmap là gì? Cách quét port với Nmap?",
                "Nmap (Network Mapper) là công cụ quét mạng và kiểm tra bảo mật. Các lệnh thường dùng: 1) nmap -sP 192.168.1.0/24 (quét host) 2) nmap -sS target (SYN scan) 3) nmap -sV target (phát hiện version) 4) nmap -A target (scan toàn diện). Trong LAB, Nmap được phép sử dụng trên các máy trong vùng DMZ. Không quét các máy production.",
                "security-tools");
        count++;

        documentService.ingestFAQ(
                "Metasploit là gì? Cách sử dụng trong LAB?",
                "Metasploit Framework là nền tảng kiểm thử xâm nhập (penetration testing). Trong LAB: 1) Chỉ dùng trên các máy CTF hoặc máy lab được chỉ định 2) Khởi động: msfconsole 3) Tìm exploit: search [keyword] 4) Chọn module: use [module] 5) Cấu hình: set RHOSTS target 6) Chạy: exploit. CẢNH BÁO: Tuyệt đối không sử dụng Metasploit để tấn công mạng thật.",
                "security-tools");
        count++;

        documentService.ingestFAQ(
                "Burp Suite dùng để làm gì?",
                "Burp Suite là công cụ kiểm thử bảo mật ứng dụng web. Các tính năng chính: 1) Proxy: Chặn và sửa đổi HTTP request/response 2) Scanner: Tự động tìm lỗ hổng (XSS, SQLi) 3) Intruder: Brute force và fuzzing 4) Repeater: Gửi lại request đã chỉnh sửa. Trong LAB, cấu hình proxy: 127.0.0.1:8080 trên trình duyệt Firefox.",
                "security-tools");
        count++;

        // ═══ Lab Procedures ═══
        documentService.ingestFAQ(
                "Quy trình xử lý sự cố bảo mật trong LAB?",
                "Quy trình Incident Response trong LAB: 1) PHÁT HIỆN: Giám sát Splunk/SIEM dashboard, kiểm tra cảnh báo 2) ĐÁNH GIÁ: Xác định mức độ nghiêm trọng (Low/Medium/High/Critical) 3) CÁCH LY: Ngắt kết nối máy bị ảnh hưởng khỏi mạng LAB 4) PHÂN TÍCH: Thu thập log, phân tích malware nếu có 5) KHẮC PHỤC: Patch, update, khôi phục từ backup 6) BÁO CÁO: Viết incident report và gửi team leader. Liên hệ: hotline LAB: extension 1234.",
                "procedures");
        count++;

        documentService.ingestFAQ(
                "Cách backup dữ liệu trong phòng LAB?",
                "Quy trình backup LAB: 1) Backup TỰ ĐỘNG: Chạy hàng ngày lúc 2:00 AM vào NAS server 2) Backup THỦ CÔNG: Chạy script /opt/lab/backup.sh khi cần 3) Lưu trữ: 7 bản backup gần nhất trên local, 30 ngày trên cloud 4) Volumes quan trọng cần backup: /opt/lab/configs, /opt/lab/ctf-data, database PostgreSQL 5) Kiểm tra: Restore test hàng tháng để đảm bảo backup hoạt động.",
                "procedures");
        count++;

        // ═══ Network ═══
        documentService.ingestFAQ(
                "Cấu trúc mạng trong phòng LAB như thế nào?",
                "Mạng LAB được chia thành: 1) VLAN 10 (Management): 10.10.10.0/24 - Máy quản trị, SIEM 2) VLAN 20 (Student): 10.10.20.0/24 - Máy học viên 3) VLAN 30 (CTF/DMZ): 10.10.30.0/24 - Máy challenge, vulnerable VMs 4) VLAN 40 (Server): 10.10.40.0/24 - Servers nội bộ. Firewall: pfSense tại gateway 10.10.x.1. DNS: 10.10.10.2. DHCP: 10.10.10.3.",
                "network");
        count++;

        documentService.ingestFAQ(
                "Làm thế nào để kết nối VPN vào mạng LAB?",
                "Kết nối VPN vào LAB: 1) Cài đặt OpenVPN client 2) Download file cấu hình .ovpn từ https://lab.internal/vpn 3) Import file vào OpenVPN 4) Đăng nhập bằng tài khoản LAB 5) Verify: ping 10.10.10.1 để kiểm tra kết nối. Lưu ý: VPN chỉ hoạt động từ 8:00-22:00 (giờ học). Ngoài giờ cần xin phép giảng viên.",
                "network");
        count++;

        // ═══ Equipment ═══
        documentService.ingestFAQ(
                "Danh sách thiết bị có trong phòng LAB?",
                "Thiết bị phòng LAB bảo mật: 1) 30x Desktop PC (i7, 16GB RAM, SSD 512GB) chạy Ubuntu/Kali Linux 2) 2x Server Dell PowerEdge R740 (Xeon, 64GB RAM) 3) 1x pfSense Firewall (Netgate 5100) 4) 2x Switch Cisco Catalyst 2960 (managed, VLAN support) 5) 1x NAS Synology DS920+ (backup) 6) 1x Wireless AP (cho lab wireless security) 7) Raspberry Pi 4 x5 (IoT lab).",
                "equipment");
        count++;

        documentService.ingestFAQ(
                "Phần mềm nào được cài sẵn trên máy LAB?",
                "Phần mềm cài đặt sẵn: [Hệ điều hành] Kali Linux 2024.1 (dual boot Windows 11) [Công cụ bảo mật] Wireshark, Nmap, Metasploit, Burp Suite Community, John the Ripper, Hashcat, Hydra, SQLmap, Gobuster [IDE/Editor] VS Code, Vim, Sublime Text [Mạng] OpenVPN, Netcat, tcpdump [Ảo hóa] VirtualBox 7, Docker Desktop [Browser] Firefox (cấu hình proxy), Chrome [Khác] Python 3.12, Git, cURL, Postman.",
                "equipment");
        count++;

        log.info("✅ Seeded {} FAQ entries into knowledge base", count);
        return ResponseEntity.ok(Map.of(
                "message", "Knowledge base seeded successfully",
                "entriesCount", count));
    }

    /**
     * DELETE /api/admin/documents/{id}
     * Delete a specific document.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDocument(@PathVariable Long id) {
        documentService.deleteDocument(id);
        return ResponseEntity.ok(Map.of("message", "Document deleted", "id", id));
    }
}
