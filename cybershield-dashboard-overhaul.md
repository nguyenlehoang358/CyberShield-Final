# Kế Hoạch Tái Cấu Trúc Dashboard CyberShield (Overhaul Plan)

**Mục tiêu**: Thực hiện đại tu toàn bộ giao diện thành Dashboard bảo mật chuẩn Enterprise, mang phong cách Power BI hiện đại (Data-driven Brutalism & Neon Glow).

## 🚀 Giai Đoạn 1: Thiết lập "Khung xương" (Layout & Brand Colors)
**Mục tiêu**: Đổi màu nền toàn bộ dự án sang `#16214d` và sửa lỗi Sidebar.
- [x] **1.1. Cấu trúc lại Layout toàn cục**:
  - Thiết lập Sidebar dọc cố định bên trái, tối ưu tính năng ẩn hiện (Collapse).
- [x] **1.2. Áp dụng Color Theme**:
  - Background tổng thể: `#16214d` (Xanh tím đậm).
  - Background của các Card / Container: Trùng bộ theme Dark mode hoặc điều chỉnh tương thích.
  - Sửa lỗi màu chữ trắng cho toàn bộ các Text trên Dashboard để đảm bảo độ đọc (Readability).

## 📊 Giai Đoạn 2: Cải cách hiển thị dữ liệu (The Power BI Style)
**Mục tiêu**: Nâng cấp các biểu đồ và bảng dữ liệu.
- [x] **2.1. Nâng cấp Charts**:
  - Thay đổi biểu đồ cột hiện tại sang biểu đồ tròn (Pie/Donut Chart) với màu sắc rực rỡ từ Power BI.
  - Hiệu ứng màu Gradient: Hồng -> Tím (Critical/Nguy hiểm), Xanh dương -> Xanh lục (Safe/An toàn).
- [x] **2.2. Dual-Table Layout**:
  - Thiết kế lại bảng danh sách theo dạng 2 cột song song (Dual-Table Layout) để tận dụng không gian chiều ngang.

## 🧩 Giai Đoạn 3: Trực quan hóa tương tác (Interactive ERD & Insights)
**Mục tiêu**: Tích hợp Sơ đồ quan hệ Mini vào Dashboard chính.
- [x] **3.1. Sơ đồ cơ sở dữ liệu (ER Diagram)**:
  - Nhúng thẻ ER Diagram nhỏ vào một khu vực cạnh bảng dữ liệu (Mini View).
  - Code chức năng "Click to Zoom" (Lightbox effect) cho sơ đồ để xem toàn màn hình.
  - Đồng bộ màu sắc các bảng trong sơ đồ theo mã màu của Power BI.

---
> 🤖 AI NOTE: Hiện tại chúng ta sẽ tập trung vào Giai Đoạn 1 trước. Sau khi Phase 1 hoàn tất và Codebase ổn định, chúng ta sẽ chuyển sang Phase 2.
