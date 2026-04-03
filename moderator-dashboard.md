# PLAN: Moderator Dashboard - Quản lý Contact Messages

> **Type:** WEB | **Agent:** backend-specialist + frontend-specialist  
> **Created:** 2026-03-22

---

## Overview

Xây dựng dashboard riêng cho role **MODERATOR**, cho phép xem và quản lý tất cả các tin nhắn từ form **Contact** của người dùng.

**Hiện trạng:**
- `ContactMessage` entity đã tồn tại với các trường: `id`, `name`, `email`, `subject`, `message`, `createdAt`, `status` (UNREAD/READ/REPLIED)
- `ContactController` chỉ có `POST /api/contact` (public) — **chưa có GET endpoint**
- `ContactMessageRepository` đã có `countByStatus()` helper
- `ROLE_MODERATOR` đã định nghĩa trong RBAC_DESIGN.md

---

## Success Criteria

- [ ] MODERATOR có thể đăng nhập và thấy sidebar/link tới Moderator Dashboard
- [ ] Dashboard hiển thị stats: Tổng tin nhắn / Chưa đọc / Đã trả lời
- [ ] Có thể filter messages theo status (ALL / UNREAD / READ / REPLIED)
- [ ] Click vào message → xem nội dung đầy đủ
- [ ] Có thể đổi status của message (UNREAD → READ → REPLIED)
- [ ] ADMIN cũng có thể truy cập dashboard này
- [ ] USER thường KHÔNG thể truy cập (403)

---

## Tech Stack

| Layer | Technology | Ghi chú |
|-------|------------|---------|
| Backend | Spring Boot + Spring Security | Thêm endpoint, cấu hình role |
| Frontend | React + Vite | Functional components + hooks |
| API Client | Axios (via `api` context) | include `ngrok-skip-browser-warning` header |
| Styling | Vanilla CSS | Theo pattern của `SolutionManager.jsx` |

---

## File Structure

```
src/
├── main/java/com/myweb/
│   └── controller/
│       └── ContactController.java          [MODIFY] Thêm GET + PATCH endpoints
│
frontend/src/
├── pages/
│   └── Moderator/
│       ├── ModeratorDashboard.jsx          [NEW]
│       └── moderator.css                   [NEW]
├── components/
│   └── ProtectedModeratorRoute.jsx         [NEW] (hoặc dùng lại ProtectedRoute hiện có)
└── App.jsx                                 [MODIFY] Thêm route /moderator
```

---

## Task Breakdown

### 🔴 PHASE 1 — BACKEND (database-architect → backend-specialist)

#### T1.1 — Thêm GET endpoint lấy danh sách messages
- **Agent:** `backend-specialist`
- **Skill:** `api-patterns`
- **File:** `ContactController.java`
- **INPUT:** `ContactMessageRepository` có sẵn
- **OUTPUT:** `GET /api/contact` trả về `List<ContactMessage>`, yêu cầu auth
- **VERIFY:** `curl -H "Authorization: Bearer <token>" http://localhost:8080/api/contact` trả về JSON list

```java
@GetMapping
@PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
public ResponseEntity<List<ContactMessage>> getAllMessages() {
    return ResponseEntity.ok(contactMessageRepository.findAll(Sort.by("createdAt").descending()));
}
```

#### T1.2 — Thêm PATCH endpoint cập nhật status
- **Agent:** `backend-specialist`
- **File:** `ContactController.java`
- **INPUT:** `{id}` path param + `{status}` request body
- **OUTPUT:** `PATCH /api/contact/{id}/status` cập nhật và trả về message đã update
- **VERIFY:** `curl -X PATCH .../api/contact/1/status -d '{"status":"READ"}'` → status thay đổi trong DB

```java
@PatchMapping("/{id}/status")
@PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR')")
public ResponseEntity<ContactMessage> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> body) {
    ContactMessage msg = contactMessageRepository.findById(id).orElseThrow();
    msg.setStatus(ContactMessage.Status.valueOf(body.get("status")));
    return ResponseEntity.ok(contactMessageRepository.save(msg));
}
```

#### T1.3 — Cấu hình Spring Security
- **Agent:** `security-auditor`
- **File:** `SecurityConfig.java` (hoặc tương đương)
- **OUTPUT:** Các endpoint `/api/contact` GET/PATCH chỉ cho phép MODERATOR + ADMIN
- **VERIFY:** Request không có token → 401. Token USER → 403. Token MODERATOR → 200.

---

### 🔵 PHASE 2 — FRONTEND ROUTING (frontend-specialist)

#### T2.1 — Thêm route `/moderator`
- **File:** `App.jsx`
- **OUTPUT:** Route được thêm, lazy-load `ModeratorDashboard`
- **VERIFY:** Truy cập `/moderator` trong browser → render đúng component

#### T2.2 — Auth Guard cho MODERATOR
- **OUTPUT:** Users không có ROLE_MODERATOR hoặc ROLE_ADMIN bị redirect về `/` hoặc `/unauthorized`
- **VERIFY:** Đăng nhập USER thường → vào `/moderator` → bị chặn

---

### 🟢 PHASE 3 — FRONTEND UI (frontend-specialist)

#### T3.1 — Stats Cards
- **File:** `ModeratorDashboard.jsx`
- **OUTPUT:** 3 cards: Tổng / Chưa đọc (badge đỏ) / Đã trả lời
- **VERIFY:** Numbers đúng với data từ API

#### T3.2 — Messages Table với Filter
- **OUTPUT:** Bảng có cột: Người gửi / Email / Chủ đề / Thời gian / Status / Action
- Filter buttons: ALL | UNREAD | READ | REPLIED
- Status badge màu khác nhau (đỏ=UNREAD, vàng=READ, xanh=REPLIED)
- **VERIFY:** Click filter → bảng cập nhật đúng

#### T3.3 — Detail Modal + Update Status
- **OUTPUT:** Click row → modal hiển thị đầy đủ nội dung message
- Có select/button để đổi status → gọi PATCH API → cập nhật realtime
- **VERIFY:** Đổi status → refresh → status đã thay đổi trong DB

#### T3.4 — Styling (`moderator.css`)
- Theo dark theme của project, không dùng màu tím/violet
- **VERIFY:** UX audit không có lỗi

---

## Phase X: Verification Checklist

```bash
# P0: Security - chỉ MODERATOR/ADMIN được truy cập
curl -X GET http://localhost:8080/api/contact                              # → 401
curl -H "Authorization: Bearer <user_token>" .../api/contact              # → 403
curl -H "Authorization: Bearer <moderator_token>" .../api/contact         # → 200

# P1: UX Audit
python .agent/skills/frontend-design/scripts/ux_audit.py .

# P2: Build test
cd frontend && npm run build
```

### Manual Verification Steps
1. Đăng nhập với tài khoản MODERATOR
2. Vào `/moderator` → thấy dashboard với stats
3. Gửi contact form từ trang Contact
4. F5 dashboard → message mới xuất hiện với status UNREAD
5. Click message → xem detail → đổi sang READ → xác nhận
6. Đăng nhập USER thường → truy cập `/moderator` → bị chặn/redirect

---

*Plan created by project-planner agent — 2026-03-22*
