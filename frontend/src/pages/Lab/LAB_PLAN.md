# 🔬 CYBERSECURITY LAB — Kế hoạch xây dựng chi tiết

## MỤC TIÊU
Xây dựng phần **Lab** trên website MyWeb, cho phép người dùng **tương tác trực tiếp** với các mô hình 
bảo mật phổ biến trong Cybersecurity. Mỗi Lab là một **mô-đun độc lập**, có:
- 📖 Lý thuyết (Theory panel)
- 🎮 Mô phỏng tương tác (Interactive simulation)
- 📊 Kết quả trực quan (Visual output)
- ⚠️ Bài học rút ra (Takeaway)

---

## KIẾN TRÚC TỔNG THỂ

```
Lab (Hub Page)                         ← Trang chính: Grid chọn Lab
├── /lab             → LabHub.jsx      ← Hub page với cards cho từng module
├── /lab/encryption  → LabLayout.jsx   ← Layout chung (sidebar theory + main sim)
│   └── EncryptionLab.jsx              ← Module 1: Mã hóa
├── /lab/hashing     → LabLayout.jsx
│   └── HashingLab.jsx                 ← Module 2: Hashing
├── /lab/firewall    → LabLayout.jsx
│   └── FirewallLab.jsx                ← Module 3: Firewall
├── /lab/xss         → LabLayout.jsx
│   └── XSSLab.jsx                     ← Module 4: XSS
├── /lab/sqli        → LabLayout.jsx
│   └── SQLInjectionLab.jsx            ← Module 5: SQL Injection
├── /lab/password    → LabLayout.jsx
│   └── PasswordLab.jsx                ← Module 6: Password Security
├── /lab/https       → LabLayout.jsx
│   └── HTTPSLab.jsx                   ← Module 7: HTTPS/TLS Handshake
└── /lab/jwt         → LabLayout.jsx
    └── JWTLab.jsx                     ← Module 8: JWT Token
```

### Nguyên tắc phân tách
| Nguyên tắc | Giải thích |
|------------|-----------|
| **Mỗi Lab = 1 file riêng** | Tránh xung đột state, dễ maintain |
| **Layout chung** | `LabLayout.jsx` cung cấp sidebar + main area chung |
| **CSS riêng** | `lab.css` chứa tất cả styles cho Lab, tách biệt khỏi `index.css` |
| **State cô lập** | Mỗi Lab tự quản lý state nội bộ (useState/useReducer) |
| **Không phụ thuộc backend** | Tất cả mô phỏng chạy 100% phía client (JavaScript) |
| **I18n ready** | Tất cả text sẽ thêm vào `LanguageContext.jsx` |

---

## 8 MÔ-ĐUN MÔ PHỎNG CHI TIẾT

---

### MODULE 1: 🔐 Encryption Lab (Mã hóa / Giải mã)

**Lý thuyết cần trình bày:**
- Symmetric vs Asymmetric Encryption
- Caesar Cipher (cổ điển) — dịch chuyển ký tự
- AES (Advanced Encryption Standard) — block cipher, key 128/192/256 bit
- RSA — public/private key pair, số nguyên tố lớn
- So sánh: tốc độ, bảo mật, use case

**Mô phỏng tương tác:**
```
┌─────────────────────────────────────────────┐
│  [Tab: Caesar] [Tab: AES] [Tab: RSA]        │
│                                              │
│  📝 Input Text: [___________________]        │
│  🔑 Key/Shift:  [___________]                │
│                                              │
│  [🔒 Encrypt]  [🔓 Decrypt]                  │
│                                              │
│  📤 Output: KHOOR ZRUOG                      │
│                                              │
│  ┌─ Visual Process ────────────────────┐     │
│  │  H → (+3) → K                       │     │
│  │  E → (+3) → H                       │     │
│  │  L → (+3) → O     ← Animated!       │     │
│  │  ...                                 │     │
│  └──────────────────────────────────────┘     │
└─────────────────────────────────────────────┘
```

**Kỹ thuật triển khai:**
- Caesar: Simple char code shift (`charCodeAt` + offset) 
- AES: Sử dụng Web Crypto API (`crypto.subtle.encrypt/decrypt`)
- RSA: Web Crypto API hoặc thư viện nhỏ `node-forge`
- Animation: Hiệu ứng từng ký tự được mã hóa (step-by-step reveal)

**File:** `src/pages/Lab/EncryptionLab.jsx`

---

### MODULE 2: #️⃣ Hashing Lab (Băm dữ liệu)

**Lý thuyết cần trình bày:**
- Hash function là gì? (one-way, deterministic, fixed-length output)
- MD5 — 128-bit, đã bị phá (collision attacks)
- SHA-256 — 256-bit, an toàn, dùng trong blockchain
- Bcrypt — password hashing với salt + cost factor
- Rainbow Table Attack & tại sao cần salt
- Avalanche Effect — thay đổi 1 bit input → thay đổi ~50% output

**Mô phỏng tương tác:**
```
┌──────────────────────────────────────────────┐
│  📝 Input Text: [Hello World_________]        │
│                                               │
│  ┌─ Hash Results (real-time) ──────────┐      │
│  │ MD5:    b10a8db164e075415...          │      │
│  │ SHA-1:  0a4d55a8d778e5022...          │      │
│  │ SHA-256: a591a6d40bf42040...          │      │
│  │ SHA-512: 309ecc489c12d6eb...          │      │
│  └───────────────────────────────────────┘      │
│                                               │
│  🔬 Avalanche Demo:                           │
│  "Hello World"  → a591a6d4...                  │
│  "Hello World!" → 7f83b165... (65% changed!)   │
│  [Visual diff highlighting]                    │
│                                               │
│  ⚔️ Collision Demo:                            │
│  Try to find two inputs with same hash!        │
│  [Input A] [Input B] → Match? ❌               │
└──────────────────────────────────────────────┘
```

**Kỹ thuật triển khai:**
- `crypto.subtle.digest('SHA-256', data)` cho SHA family
- Thư viện nhỏ `js-md5` hoặc tự implement MD5
- Visual diff: So sánh từng hex character, highlight khác biệt
- Real-time: Hash tính lại mỗi khi user gõ (`onChange`)

**File:** `src/pages/Lab/HashingLab.jsx`

---

### MODULE 3: 🧱 Firewall Simulator (Tường lửa)

**Lý thuyết cần trình bày:**
- Firewall là gì? (network filter, packet inspection)
- Packet Filtering — lọc theo IP, Port, Protocol
- Stateful Inspection — theo dõi trạng thái connection
- Application Firewall (WAF) — lọc theo nội dung HTTP
- Firewall Rules: ALLOW / DENY / DROP
- Rule ordering matters! (first-match wins)

**Mô phỏng tương tác:**
```
┌─────────────────────────────────────────────────────┐
│  ┌─ Firewall Rules ─────────────────────────────┐    │
│  │ # │ Action │ Protocol │ Src IP    │ Dst Port │    │
│  │ 1 │ ALLOW  │ TCP      │ 10.0.*   │ 80       │    │
│  │ 2 │ DENY   │ TCP      │ *        │ 22       │    │
│  │ 3 │ ALLOW  │ UDP      │ *        │ 53       │    │
│  │ 4 │ DENY   │ *        │ Evil IP  │ *        │    │
│  │ [+ Add Rule]  [↑↓ Reorder]                   │    │
│  └───────────────────────────────────────────────┘    │
│                                                      │
│  ┌─ Network Traffic (animated) ──────────────────┐   │
│  │  🌐 → [packet] → 🧱 FIREWALL → ✅/❌ → 🖥️     │   │
│  │                                                │   │
│  │  Live packets:                                 │   │
│  │  ● TCP 192.168.1.5:443   [ALLOWED ✅]          │   │
│  │  ● TCP 10.0.0.1:22       [BLOCKED ❌]          │   │
│  │  ● UDP 8.8.8.8:53        [ALLOWED ✅]          │   │
│  │  ● TCP 185.13.37.1:80    [DROPPED 🚫]         │   │
│  └────────────────────────────────────────────────┘   │
│                                                      │
│  [▶ Start Traffic] [⏸ Pause] [🔄 Reset]              │
└──────────────────────────────────────────────────────┘
```

**Kỹ thuật triển khai:**
- Traffic generator: `setInterval` tạo random packets
- Rule engine: Duyệt rules theo thứ tự, first-match
- Animation: Packet di chuyển từ trái → firewall → phải (CSS animation)
- Drag-and-drop để reorder rules
- Statistics: Bao nhiêu packets allowed/denied/dropped

**File:** `src/pages/Lab/FirewallLab.jsx`

---

### MODULE 4: 💉 XSS Lab (Cross-Site Scripting)

**Lý thuyết cần trình bày:**
- XSS là gì? (inject JavaScript vào trang web)
- 3 loại XSS:
  - **Reflected XSS** — payload trong URL
  - **Stored XSS** — payload lưu trong DB (comment, profile)
  - **DOM-based XSS** — JavaScript xử lý input không an toàn
- Tại sao XSS nguy hiểm? (cookie theft, session hijacking, keylogging)
- Phòng chống: Escaping, Content Security Policy, HttpOnly cookies

**Mô phỏng tương tác:**
```
┌──────────────────────────────────────────────────┐
│  [Mode: Vulnerable ⚠️] [Mode: Protected 🛡️]      │
│                                                   │
│  📝 Comment Box:                                  │
│  [Type your comment... <script>alert(1)</script>] │
│  [Submit Comment]                                 │
│                                                   │
│  ┌─ Preview (iframe sandbox) ──────────────────┐  │
│  │  Comments:                                   │  │
│  │  • Nice article! ✅                          │  │
│  │  • ⚠️ SCRIPT EXECUTED! (in vulnerable mode)  │  │
│  │  • &lt;script&gt;alert(1)&lt;/script&gt; (in protected)│  │
│  └──────────────────────────────────────────────┘  │
│                                                   │
│  ┌─ Source Code View ────────────────────────────┐ │
│  │  // Vulnerable:                               │ │
│  │  element.innerHTML = userInput; // ❌          │ │
│  │                                               │ │
│  │  // Protected:                                │ │
│  │  element.textContent = userInput; // ✅        │ │
│  └───────────────────────────────────────────────┘ │
│                                                   │
│  📊 Attack Log: [logs attempts and results]        │
└──────────────────────────────────────────────────┘
```

**Kỹ thuật triển khai:**
- **Vulnerable mode**: `dangerouslySetInnerHTML` (controlled, sandboxed iframe)
- **Protected mode**: React's default escaping (`textContent`)
- **Sandboxed iframe**: Cách ly hoàn toàn XSS demo khỏi app chính
  ```html
  <iframe sandbox="allow-scripts" srcdoc="..."></iframe>
  ```
- Attack log: Ghi lại các payload thử và kết quả
- Sample payloads cho user thử: `<img onerror>`, `<svg onload>`, etc.

**⚠️ AN TOÀN**: Luôn dùng sandbox iframe, KHÔNG bao giờ thực thi user code trong DOM chính

**File:** `src/pages/Lab/XSSLab.jsx`

---

### MODULE 5: 🗃️ SQL Injection Lab

**Lý thuyết cần trình bày:**
- SQL Injection là gì? (inject SQL query qua user input)
- Các loại SQLi:
  - **Classic SQLi** — `' OR '1'='1`
  - **Union-based** — `UNION SELECT`
  - **Blind SQLi** — Boolean-based / Time-based
- Hậu quả: Leak data, bypass auth, xóa database
- Phòng chống: Prepared Statements, Parameterized Queries, ORM

**Mô phỏng tương tác:**
```
┌────────────────────────────────────────────────────┐
│  [Mode: Vulnerable ⚠️] [Mode: Protected 🛡️]        │
│                                                     │
│  🔐 Login Form:                                    │
│  Username: [admin'--____________]                   │
│  Password: [anything_____________]                  │
│  [Login]                                            │
│                                                     │
│  ┌─ Query Generated ──────────────────────────────┐ │
│  │ Vulnerable:                                     │ │
│  │ SELECT * FROM users                             │ │
│  │ WHERE user='admin'--' AND pass='anything'       │ │
│  │ ↑ Comment operator makes rest ignored!          │ │
│  │                                                 │ │
│  │ Protected:                                      │ │
│  │ SELECT * FROM users                             │ │
│  │ WHERE user=? AND pass=?                         │ │
│  │ params: ['admin\'--', 'anything']               │ │
│  └─────────────────────────────────────────────────┘ │
│                                                     │
│  ┌─ Fake Database ────────────────────────────────┐ │
│  │ users table:                                    │ │
│  │ id │ username │ password  │ role                 │ │
│  │  1 │ admin    │ ********  │ ADMIN                │ │
│  │  2 │ user1    │ ********  │ USER                 │ │
│  │  3 │ user2    │ ********  │ USER                 │ │
│  └─────────────────────────────────────────────────┘ │
│                                                     │
│  Result: ✅ Login success as ADMIN! (vulnerable)     │
│  Result: ❌ Login failed (protected)                 │
│                                                     │
│  📝 Sample Payloads:                                │
│  • ' OR '1'='1                                      │
│  • admin'--                                         │
│  • ' UNION SELECT * FROM users--                    │
└────────────────────────────────────────────────────┘
```

**Kỹ thuật triển khai:**
- Fake in-memory database (JavaScript object/array)
- SQL parser đơn giản (regex-based về demo)
- **Vulnerable mode**: String concatenation xây query
- **Protected mode**: Parameterized (tách input khỏi query)
- Syntax highlighting cho SQL queries (color-coded)
- Visual: Highlight đoạn query bị inject

**File:** `src/pages/Lab/SQLInjectionLab.jsx`

---

### MODULE 6: 🔑 Password Security Lab

**Lý thuyết cần trình bày:**
- Tại sao password yếu nguy hiểm?
- Brute force attack — thử tất cả combinations
- Dictionary attack — wordlist phổ biến
- Password entropy — đo lường độ mạnh (bits)
- Quy tắc mật khẩu mạnh: Dài, phức tạp, unique
- Password Manager & 2FA

**Mô phỏng tương tác:**
```
┌────────────────────────────────────────────────────┐
│  📝 Enter Password: [MyP@ssw0rd!_____]             │
│                                                     │
│  ┌─ Strength Analysis ─────────────────────────┐    │
│  │ ████████████░░░░░░░░ 68% - GOOD               │    │
│  │                                               │    │
│  │ ✅ Length: 11 characters (good)                │    │
│  │ ✅ Uppercase: Yes                             │    │
│  │ ✅ Lowercase: Yes                             │    │
│  │ ✅ Numbers: Yes                               │    │
│  │ ✅ Special chars: Yes (@, !)                   │    │
│  │ ⚠️ Common pattern: "P@ssw0rd" detected!       │    │
│  │                                               │    │
│  │ Entropy: 52 bits                              │    │
│  └───────────────────────────────────────────────┘    │
│                                                     │
│  ┌─ Brute Force Simulation ────────────────────┐    │
│  │ Crack time estimates:                         │    │
│  │ • Online (10/s):      ▓▓▓ 14 years            │    │
│  │ • Offline (10B/s):    ▓ 0.5 seconds ⚠️        │    │
│  │ • With GPU (100B/s):  instantly! ❌            │    │
│  │                                               │    │
│  │ [▶ Simulate Brute Force Attack]               │    │
│  │ Trying: aaaa → aaab → aaac → ... → MyP@...   │    │
│  │ Attempts: 1,423,502 — Speed: 50,000/s         │    │
│  └───────────────────────────────────────────────┘    │
│                                                     │
│  🎲 [Generate Strong Password]                      │
│  → Kq$7!mX2pR@nL9 (128 bits entropy)               │
└────────────────────────────────────────────────────┘
```

**Kỹ thuật triển khai:**
- Strength checker: Regex + entropy calculation
- Common password list (top 1000 passwords check)
- Brute force simulation: `requestAnimationFrame` + counter
- Crack time: Tính dựa trên character space ^ length / attempts_per_second
- Password generator: `crypto.getRandomValues`

**File:** `src/pages/Lab/PasswordLab.jsx`

---

### MODULE 7: 🔒 HTTPS/TLS Handshake Lab

**Lý thuyết cần trình bày:**
- HTTP vs HTTPS — tại sao cần mã hóa?
- TLS Handshake quy trình:
  1. Client Hello (supported ciphers)
  2. Server Hello (chosen cipher + certificate)
  3. Certificate Verification
  4. Key Exchange (Diffie-Hellman)
  5. Session Keys Generated
  6. Encrypted Communication
- Certificate Authority (CA) — chain of trust
- Man-in-the-Middle Attack — tại sao HTTPS ngăn chặn

**Mô phỏng tương tác:**
```
┌────────────────────────────────────────────────────────┐
│  ┌─ TLS Handshake Visualization ──────────────────────┐ │
│  │                                                     │ │
│  │  🖥️ Client                    🖧 Server              │ │
│  │    │                            │                    │ │
│  │    │───── Client Hello ────────→│  Step 1 ✅         │ │
│  │    │     (TLS 1.3, ciphers)     │                    │ │
│  │    │                            │                    │ │
│  │    │←─── Server Hello ──────────│  Step 2 ⏳         │ │
│  │    │     (certificate)          │                    │ │
│  │    │                            │                    │ │
│  │    │───── Key Exchange ────────→│  Step 3 ⏳         │ │
│  │    │     (Diffie-Hellman)       │                    │ │
│  │    │                            │                    │ │
│  │    │←══════ Encrypted ═════════→│  🔒 Secure!        │ │
│  │    │     (AES-256-GCM)          │                    │ │
│  │                                                     │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                         │
│  [▶ Play Step-by-Step] [⏩ Auto Play] [🔄 Reset]         │
│                                                         │
│  ┌─ Packet Inspector ──────────────────────────────┐     │
│  │ Current Step: Client Hello                       │     │
│  │ Protocol: TLS 1.3                                │     │
│  │ Cipher Suites: AES_256_GCM_SHA384, ...           │     │
│  │ Random: 0x7a3b9c... (32 bytes)                   │     │
│  └──────────────────────────────────────────────────┘     │
│                                                         │
│  ┌─ MITM Demo ─────────────────────────────────────┐     │
│  │ [Toggle: Insert attacker between client/server]   │     │
│  │ 🖥️ → 👹 Attacker → 🖧                             │     │
│  │ With HTTPS: Attacker sees ████████ (encrypted)    │     │
│  │ Without HTTPS: Attacker sees "password=123456" ⚠️ │     │
│  └──────────────────────────────────────────────────┘     │
└────────────────────────────────────────────────────────┘
```

**Kỹ thuật triển khai:**
- SVG/CSS animation cho handshake diagram (arrows animated)
- Step-by-step playback với `setTimeout` chain
- Packet inspector shows mock data cho mỗi step
- MITM demo: Toggle giữa encrypted/plaintext view
- Color coding: 🟢 secure, 🔴 insecure, 🟡 in-progress

**File:** `src/pages/Lab/HTTPSLab.jsx`

---

### MODULE 8: 🎫 JWT Token Lab

**Lý thuyết cần trình bày:**
- JWT là gì? (JSON Web Token — stateless authentication)
- Cấu trúc 3 phần: `header.payload.signature`
- Header: Algorithm (HS256, RS256)
- Payload: Claims (iss, sub, exp, iat, custom claims)
- Signature: HMAC-SHA256(header + payload, secret)
- Lỗ hổng phổ biến: Algorithm confusion, expired token, none algorithm

**Mô phỏng tương tác:**
```
┌───────────────────────────────────────────────────────┐
│  ┌─ JWT Builder ──────────────────────────────────┐    │
│  │ Header (editable):                              │    │
│  │ { "alg": "HS256", "typ": "JWT" }                │    │
│  │                                                 │    │
│  │ Payload (editable):                             │    │
│  │ {                                               │    │
│  │   "sub": "user123",                             │    │
│  │   "name": "Nguyen Van An",                      │    │
│  │   "role": "admin",                              │    │
│  │   "exp": 1740000000                             │    │
│  │ }                                               │    │
│  │                                                 │    │
│  │ Secret Key: [my-secret-key______]                │    │
│  └─────────────────────────────────────────────────┘    │
│                                                        │
│  ┌─ Generated Token ──────────────────────────────┐    │
│  │ eyJhbGciOiJIUzI1NiJ9.                           │    │
│  │ eyJzdWIiOiJ1c2VyMTIzIiwia...                    │    │
│  │ .SflKxwRJSMeKKF2QT4fwpMeJ...                    │    │
│  │ ↑ header (red)  ↑ payload (purple)  ↑ sig (blue)│    │
│  └─────────────────────────────────────────────────┘    │
│                                                        │
│  ┌─ Token Decoder ───────────────────────────────┐     │
│  │ [Paste a JWT token here to decode...]           │     │
│  │                                                 │     │
│  │ ✅ Signature Valid                               │     │
│  │ ⚠️ Token expires in 2 hours                      │     │
│  │ 📋 Claims: sub, name, role, exp, iat             │     │
│  └─────────────────────────────────────────────────┘     │
│                                                        │
│  ┌─ Attack Demo ──────────────────────────────────┐    │
│  │ [Try: Change role to "admin" → Signature fails!] │    │
│  │ [Try: Set alg to "none" → ⚠️ Vulnerability!]     │    │
│  └─────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────┘
```

**Kỹ thuật triển khai:**
- Base64URL encode/decode (built-in `btoa`/`atob`)
- HMAC-SHA256: Web Crypto API (`crypto.subtle.sign`)
- Color-coded token parts (header=red, payload=purple, signature=blue)
- Real-time encode/decode khi edit JSON
- Attack demo: Tamper payload → signature mismatch → visual warning

**File:** `src/pages/Lab/JWTLab.jsx`

---

## CẤU TRÚC FILE

```
frontend/src/
├── pages/
│   └── Lab/
│       ├── LabHub.jsx              ← Trang chính với grid cards
│       ├── LabLayout.jsx           ← Layout chung (sidebar + main)
│       ├── EncryptionLab.jsx       ← Module 1
│       ├── HashingLab.jsx          ← Module 2
│       ├── FirewallLab.jsx         ← Module 3
│       ├── XSSLab.jsx              ← Module 4
│       ├── SQLInjectionLab.jsx     ← Module 5
│       ├── PasswordLab.jsx         ← Module 6
│       ├── HTTPSLab.jsx            ← Module 7
│       └── JWTLab.jsx              ← Module 8
├── styles/
│   └── lab.css                     ← CSS riêng cho toàn bộ Lab
├── components/
│   ├── SafeOutput.jsx              ← (đã có) Render an toàn
│   └── CodeBlock.jsx               ← Syntax highlight cho code demo
└── context/
    └── LanguageContext.jsx          ← Thêm translations cho Lab
```

## ROUTING (cập nhật App.jsx)

```jsx
// Trong App.jsx
import LabHub from './pages/Lab/LabHub'
import LabLayout from './pages/Lab/LabLayout'
import EncryptionLab from './pages/Lab/EncryptionLab'
import HashingLab from './pages/Lab/HashingLab'
// ... import các lab khác

<Route path="/lab" element={<LabHub />} />
<Route path="/lab" element={<LabLayout />}>
    <Route path="encryption" element={<EncryptionLab />} />
    <Route path="hashing" element={<HashingLab />} />
    <Route path="firewall" element={<FirewallLab />} />
    <Route path="xss" element={<XSSLab />} />
    <Route path="sqli" element={<SQLInjectionLab />} />
    <Route path="password" element={<PasswordLab />} />
    <Route path="https" element={<HTTPSLab />} />
    <Route path="jwt" element={<JWTLab />} />
</Route>
```

---

## THỨ TỰ XÂY DỰNG (ĐỀ XUẤT)

| Giai đoạn | Công việc | Thời gian ước tính |
|-----------|-----------|-------------------|
| **Phase 1** | `LabHub.jsx` + `LabLayout.jsx` + `lab.css` + routing | Nền tảng |
| **Phase 2** | `EncryptionLab.jsx` — Caesar + AES visual | Module đầu tiên |
| **Phase 3** | `HashingLab.jsx` — Real-time hash + avalanche | Đơn giản, ấn tượng |
| **Phase 4** | `PasswordLab.jsx` — Strength + brute force sim | Dễ tương tác |
| **Phase 5** | `JWTLab.jsx` — Encode/decode/tamper | Liên quan đến app |
| **Phase 6** | `FirewallLab.jsx` — Rules + traffic animation | Animation phức tạp |
| **Phase 7** | `XSSLab.jsx` — Sandboxed demo | Cần cẩn thận bảo mật |
| **Phase 8** | `SQLInjectionLab.jsx` — Fake DB + query viz | SQL parser logic |
| **Phase 9** | `HTTPSLab.jsx` — TLS handshake animation | Animation phức tạp nhất |

---

## DESIGN GUIDELINES

### Color scheme cho Lab
```css
--lab-bg: #0d1117;           /* Dark background */
--lab-surface: #161b22;       /* Card background */
--lab-border: #30363d;        /* Borders */
--lab-accent-green: #3fb950;  /* Secure/Safe */
--lab-accent-red: #f85149;    /* Vulnerable/Danger */
--lab-accent-yellow: #d29922; /* Warning */
--lab-accent-blue: #58a6ff;   /* Info/Neutral */
--lab-accent-purple: #bc8cff; /* Crypto/Hash */
--lab-text: #c9d1d9;          /* Main text */
--lab-text-dim: #8b949e;      /* Secondary text */
```

### Mỗi Lab Card trên LabHub
- Icon đặc trưng
- Title + mô tả ngắn
- Difficulty badge (Beginner / Intermediate / Advanced)
- Animated border gradient on hover
- Click → navigate to `/lab/{slug}`

### LabLayout sidebar
- Collapsible theory panel (trái)
- Main simulation area (phải)
- Breadcrumb navigation
- Progress indicator

---

## YÊU CẦU AN TOÀN

1. **XSS Lab**: PHẢI dùng `<iframe sandbox>` — KHÔNG BAO GIỜ render user HTML trực tiếp
2. **SQL Lab**: Fake database — KHÔNG kết nối database thật
3. **Encryption Lab**: KHÔNG gửi key/plaintext lên server — tất cả client-side
4. **JWT Lab**: Demo secret key — KHÔNG dùng secret thật của app
5. **No network calls**: Tất cả mô phỏng chạy offline trong browser

---

## KẾT LUẬN

Kiến trúc này đảm bảo:
- ✅ **Modular**: Mỗi Lab là component độc lập, không xung đột
- ✅ **Scalable**: Dễ dàng thêm Lab mới (tạo file mới + thêm route)
- ✅ **Safe**: Sandboxed demos, không có rủi ro bảo mật thực
- ✅ **Educational**: Kết hợp lý thuyết + thực hành tương tác
- ✅ **Beautiful**: Dark theme riêng cho Lab, animation nổi bật
- ✅ **I18n**: Hỗ trợ đa ngôn ngữ (VI/EN)

**Bước tiếp theo**: Bắt đầu Phase 1 — xây dựng LabHub + LabLayout + lab.css
