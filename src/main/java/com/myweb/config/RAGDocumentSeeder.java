package com.myweb.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import com.myweb.service.DocumentService;

/**
 * Seeds RAG knowledge base with LAB documentation on startup.
 * Only runs if no documents exist yet.
 *
 * This gives the AI Chatbot meaningful knowledge to answer questions
 * about the security lab, tools, and procedures.
 */
@Component
@Order(210) // Run after SecurityDataSeeder and DB init
public class RAGDocumentSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(RAGDocumentSeeder.class);

    private final DocumentService documentService;

    public RAGDocumentSeeder(DocumentService documentService) {
        this.documentService = documentService;
    }

    @Override
    public void run(String... args) {
        try {
            if (documentService.getDocumentCount() > 0) {
                log.info("📚 RAG documents already exist ({} docs) — skipping seed.",
                        documentService.getDocumentCount());
                return;
            }

            log.info("🌱 Seeding RAG knowledge base for AI Chatbot...");

            // ═══ LAB Equipment & Infrastructure ═══
            documentService.ingestDocument(
                    "Tổng quan phòng LAB bảo mật",
                    """
                            Phòng LAB An ninh mạng CyberShield được thành lập năm 2026, phục vụ nghiên cứu và đào tạo bảo mật.

                            THIẾT BỊ CHÍNH:
                            - 20 máy tính workstation Dell Precision (Intel i9, 64GB RAM, RTX 4070)
                            - 3 server Dell PowerEdge R750 (Xeon Gold, 256GB RAM, 4TB NVMe RAID)
                            - 2 Cisco ASA 5525-X Firewall
                            - 1 Palo Alto PA-3220 Next-Gen Firewall
                            - Switch Cisco Catalyst 9300 (Layer 3)
                            - Wireless AP Cisco Aironet 3800i
                            - 1 NAS Synology RS3621xs+ (96TB)

                            MẠNG:
                            - Bandwidth: 1Gbps internal, 100Mbps internet
                            - 3 VLAN: Management (10), Lab (20), Guest (30)
                            - VPN: WireGuard với MFA
                            - DNS: Pi-hole + Cloudflare DoH

                            QUY TRÌNH:
                            - Mở cửa: 8:00 - 22:00 (thứ 2-6), 9:00 - 17:00 (thứ 7)
                            - Đăng ký sử dụng qua hệ thống booking online
                            - Bắt buộc tuân thủ quy tắc sử dụng thiết bị
                            """,
                    "GUIDE", "infrastructure");

            // ═══ Security Tools ═══
            documentService.ingestDocument(
                    "Hướng dẫn sử dụng Wireshark",
                    """
                            WIRESHARK — Công cụ phân tích giao thức mạng

                            PHIÊN BẢN: 4.2.x (cài đặt sẵn trên tất cả workstation)
                            LICENSE: GNU GPLv2

                            CÁCH SỬ DỤNG CƠ BẢN:
                            1. Mở Wireshark → chọn network interface (thường là eth0 hoặc wlan0)
                            2. Click nút "Start Capturing" (biểu tượng vây cá mập xanh)
                            3. Thực hiện hành động mạng cần phân tích
                            4. Click "Stop" khi xong

                            FILTER HỮU ÍCH:
                            - http: Chỉ hiện gói HTTP
                            - tcp.port == 443: Lọc traffic HTTPS
                            - ip.addr == 192.168.1.1: Lọc theo IP
                            - dns: Chỉ hiện DNS queries
                            - tcp.flags.syn == 1: Phát hiện SYN scan
                            - http.request.method == POST: Chỉ hiện POST requests

                            BÀI LAB MẪU:
                            - Lab 1: Capture HTTP traffic và phân tích unencrypted passwords
                            - Lab 2: Phát hiện ARP spoofing
                            - Lab 3: Phân tích TLS handshake
                            - Lab 4: Detect port scanning với Wireshark filters

                            LƯU Ý: Chỉ capture traffic trên VLAN Lab (20). Nghiêm cấm capture trên Management VLAN.
                            """,
                    "GUIDE", "tools");

            documentService.ingestDocument(
                    "Hướng dẫn sử dụng Nmap",
                    """
                            NMAP — Network Mapper

                            PHIÊN BẢN: 7.94 (cài đặt sẵn)
                            DÙNG ĐỂ: Quét mạng, phát hiện host, dịch vụ, hệ điều hành

                            LỆNH CƠ BẢN:
                            - nmap -sn 192.168.20.0/24 → Ping scan toàn bộ mạng Lab
                            - nmap -sV target_ip → Quét version dịch vụ
                            - nmap -O target_ip → Phát hiện hệ điều hành
                            - nmap -sS target_ip → SYN stealth scan
                            - nmap -A target_ip → Aggressive scan (OS + version + script + traceroute)
                            - nmap --script vuln target_ip → Quét lỗ hổng NSE

                            BÀI LAB MẪU:
                            - Lab 1: Khám phá topology mạng Lab bằng nmap
                            - Lab 2: Phát hiện dịch vụ đang chạy trên các server
                            - Lab 3: So sánh SYN scan vs Connect scan
                            - Lab 4: Sử dụng NSE scripts để phát hiện CVE

                            QUAN TRỌNG: Chỉ được scan trong subnet 192.168.20.0/24 (VLAN Lab).
                            Nghiêm cấm scan ra internet hoặc các VLAN khác.
                            """,
                    "GUIDE", "tools");

            documentService.ingestDocument(
                    "Hướng dẫn sử dụng Metasploit Framework",
                    """
                            METASPLOIT FRAMEWORK — Nền tảng kiểm thử xâm nhập

                            PHIÊN BẢN: 6.3.x (Metasploit Community)
                            CÀI ĐẶT: Chỉ có trên 5 workstation chuyên dụng (WS-SEC-01 đến WS-SEC-05)

                            CÁC MODULE CHÍNH:
                            - Exploits: Khai thác lỗ hổng (3000+ modules)
                            - Payloads: Meterpreter, shell, VNC...
                            - Auxiliary: Scanner, fuzzer, sniffer
                            - Post: Thu thập thông tin sau khai thác

                            LỆNH CƠ BẢN:
                            msfconsole                    → Khởi động
                            search type:exploit cve:2024  → Tìm exploit theo CVE
                            use exploit/multi/handler     → Chọn module
                            set RHOSTS target_ip          → Set target
                            set PAYLOAD windows/meterpreter/reverse_tcp
                            exploit                       → Thực thi

                            QUY ĐỊNH:
                            - Chỉ sử dụng trên máy ảo mục tiêu (Metasploitable, DVWA, HackTheBox)
                            - PHẢI đăng ký trước với quản trị viên Lab
                            - Ghi log đầy đủ mọi hoạt động pentest
                            - Nghiêm cấm sử dụng real exploits trên hệ thống production
                            """,
                    "GUIDE", "tools");

            documentService.ingestDocument(
                    "Hướng dẫn sử dụng Burp Suite",
                    """
                            BURP SUITE — Web Application Security Testing

                            PHIÊN BẢN: Community Edition 2024.x
                            LICENSE: Free (Community) / Professional (trên WS-SEC-01/02)

                            TÍNH NĂNG CHÍNH:
                            - Proxy: Chặn và sửa đổi HTTP/HTTPS requests
                            - Scanner: Tự động quét lỗ hổng web (Pro only)
                            - Intruder: Brute force, fuzzing
                            - Repeater: Gửi lại request đã chỉnh sửa
                            - Decoder: Encode/decode Base64, URL, HTML...

                            THIẾT LẬP:
                            1. Cấu hình proxy browser: 127.0.0.1:8080
                            2. Import Burp CA certificate vào browser
                            3. Bật "Intercept is on" trong tab Proxy
                            4. Truy cập ứng dụng web mục tiêu

                            BÀI LAB:
                            - Lab 1: Intercept và modify login request
                            - Lab 2: Phát hiện SQL injection bằng Intruder
                            - Lab 3: JWT token tampering với Decoder
                            - Lab 4: CSRF bypass testing
                            """,
                    "GUIDE", "tools");

            // ═══ FAQ Documents ═══
            documentService.ingestFAQ(
                    "Làm sao để truy cập phòng LAB từ xa?",
                    "Sử dụng VPN WireGuard. Liên hệ quản trị viên để được cấp config file. Yêu cầu: cài WireGuard client, có tài khoản MFA được kích hoạt. Kết nối VPN sau đó truy cập qua SSH hoặc RDP.",
                    "faq");

            documentService.ingestFAQ(
                    "Cách reset mật khẩu workstation?",
                    "Liên hệ quản trị viên Lab qua email lab-admin@cybershield.vn hoặc Slack channel #lab-support. Để reset nhanh, sử dụng Linux live USB để mount ổ đĩa và chỉnh sửa /etc/shadow (Linux) hoặc sử dụng Windows PE (Windows).",
                    "faq");

            documentService.ingestFAQ(
                    "Phòng LAB có những máy ảo nào để thực hành?",
                    "Các máy ảo có sẵn: Metasploitable 2 & 3, DVWA (Damn Vulnerable Web Application), HackTheBox machines, Vulnhub VMs, OWASP WebGoat, Juice Shop. Tất cả chạy trên VMware ESXi cluster.",
                    "faq");

            documentService.ingestFAQ(
                    "Quy trình xử lý sự cố bảo mật trong LAB?",
                    "1. Ngắt kết nối thiết bị bị ảnh hưởng khỏi mạng. 2. Báo cáo ngay cho quản trị viên Lab. 3. Không xóa hoặc thay đổi  log files. 4. Ghi lại thời gian, triệu chứng, hành động đã thực hiện. 5. Chờ quản trị viên điều tra và xử lý.",
                    "faq");

            documentService.ingestFAQ(
                    "Wireshark display filter cho HTTP?",
                    "Sử dụng filter 'http' để hiện tất cả HTTP traffic. Filter nâng cao: 'http.request.method == GET', 'http.response.code == 200', 'http contains password'. Để lọc theo host: 'http.host == example.com'.",
                    "tools");

            documentService.ingestFAQ(
                    "Cách phát hiện tấn công brute force?",
                    "Dấu hiệu: Nhiều đăng nhập thất bại từ cùng IP trong thời gian ngắn. Tools: Fail2ban (auto-block), Wireshark filter 'http.request.method == POST && http.response.code == 401', hoặc kiểm tra log /var/log/auth.log. Hệ thống CyberShield tự động phát hiện và block sau 5 lần thất bại.",
                    "security");

            log.info("✅ RAG knowledge base seeded with {} documents.",
                    documentService.getDocumentCount());

        } catch (Exception e) {
            log.warn("⚠️ RAG document seeding skipped (embedding model may not be ready): {}",
                    e.getMessage());
        }
    }
}
