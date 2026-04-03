export const blogPosts = [
    {
        id: 'security-101',
        title: 'Nhập môn An toàn thông tin: Bắt đầu từ đâu?',
        desc: 'Hướng dẫn lộ trình học cybersecurity cho người mới bắt đầu. Các chứng chỉ cần thiết và kỹ năng nền tảng.',
        author: 'Admin',
        date: '2024-02-15',
        tags: ['Beginner', 'Career'],
        content: `
# Nhập môn An toàn thông tin

An toàn thông tin (Cybersecurity) là lĩnh vực bảo vệ hệ thống, mạng và chương trình khỏi các cuộc tấn công kỹ thuật số.

## Lộ trình cơ bản

1. **Networking**: Hiểu về TCP/IP, OSI Model, DNS, HTTP/HTTPS.
2. **Operating Systems**: Thành thạo Linux (Kali, Ubuntu) và Windows internals.
3. **Coding**: Python, Bash scripting, JavaScript (cho web security).
4. **Tools**: Nmap, Burp Suite, Wireshark, Metasploit.

## Chứng chỉ gợi ý

- **CompTIA Security+**: Kiến thức nền tảng.
- **CEH (Certified Ethical Hacker)**: Kỹ thuật tấn công/phòng thủ.
- **OSCP (Offensive Security Certified Professional)**: Thực hành penetration testing (rất khó & uy tín).

## Tài nguyên học tập

- [TryHackMe](https://tryhackme.com)
- [HackTheBox](https://hackthebox.com)
- [OWASP Top 10](https://owasp.org)
        `
    },
    {
        id: 'owasp-top-10',
        title: 'Phân tích OWASP Top 10 (2024 Edition)',
        desc: 'Chi tiết về 10 lỗ hổng bảo mật web phổ biến nhất hiện nay và cách phòng chống.',
        author: 'Security Team',
        date: '2024-02-10',
        tags: ['Web Security', 'OWASP'],
        content: `
# OWASP Top 10 - Web Application Security Risks

1. **A01: Broken Access Control**
   - Người dùng truy cập được dữ liệu của người khác hoặc thực hiện hành động admin.
   - *Fix:* Phân quyền chặt chẽ (RBAC), deny by default.

2. **A02: Cryptographic Failures**
   - Dữ liệu nhạy cảm (passwords, PII) không được mã hóa hoặc dùng thuật toán yếu.
   - *Fix:* Dùng TLS 1.3, Argon2/Bcrypt cho password.

3. **A03: Injection**
   - SQL Injection, Command Injection.
   - *Fix:* Dùng Prepared Statements, Parameterized Queries.

4. **A04: Insecure Design**
   - Lỗi logic thiết kế ngay từ đầu.
   - *Fix:* Threat modeling, secure design patterns.

... (còn tiếp)
        `
    },
    {
        id: 'docker-security',
        title: 'Best Practices cho Docker Security',
        desc: 'Cách build container an toàn, giảm thiểu bề mặt tấn công trong môi trường DevOps.',
        author: 'DevOps Lead',
        date: '2024-01-28',
        tags: ['Docker', 'DevSecOps'],
        content: `
# Docker Security Best Practices

1. **Don't run as Root**
   Luôn tạo user riêng trong Dockerfile:
   \`\`\`dockerfile
   RUN addgroup -S appgroup && adduser -S appuser -G appgroup
   USER appuser
   \`\`\`

2. **Use Minimal Base Images**
   Dùng \`alpine\` hoặc \`distroless\` để giảm kích thước và vulnerabilities.

3. **Scan Images regularly**
   Dùng tools như Trivy, Clair để scan image trước khi deploy.

4. **Limit Resources**
   Set CPU/Memory limits để tránh DoS attack từ bên trong container.
        `
    }
]
