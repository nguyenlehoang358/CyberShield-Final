# MyWeb - Spring Boot + PostgreSQL

## Yêu cầu
- Java 17+
- Maven 3.6+
- Docker & Docker Compose

## Chạy dự án

### 1. Khởi động PostgreSQL và pgAdmin
```bash
docker-compose up -d
```

### 2. Chạy Spring Boot
```bash
mvn spring-boot:run
```

Ứng dụng chạy tại: **http://localhost:8081**

**Lưu ý:** Nếu port 8081 đã được sử dụng, dừng process cũ hoặc chạy với port khác:
```bash
# PowerShell - tìm và dừng process dùng port 8081
$proc = Get-NetTCPConnection -LocalPort 8081 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($proc) { Stop-Process -Id $proc -Force }

# Hoặc chạy với port khác
mvn spring-boot:run "-Dspring-boot.run.arguments=--server.port=8082"
```

## Frontend & Đăng nhập

- **Trang chủ:** http://localhost:8083/
- **Đăng nhập/Đăng ký:** http://localhost:8083/login.html
- **Dashboard (Admin):** http://localhost:8083/dashboard.html

**Tài khoản Admin:** `admin@admin.com` / `admin123`

### API Auth
| Method | Endpoint | Mô tả |
|--------|----------|-------|
| POST | /api/auth/login | Đăng nhập (email, password) → JWT |
| POST | /api/auth/register | Đăng ký (username, email, password) |
| GET | /api/auth/me | Lấy thông tin user (cần Bearer token) |

### Đăng nhập Social (OAuth2)
Để bật đăng nhập Google, Facebook, GitHub, LinkedIn, thêm cấu hình vào `application.yml` (xem file để biết cấu trúc). Cần tạo app tại mỗi provider để lấy client-id và client-secret.

## Kiểm tra nền móng

### Health check
```bash
curl http://localhost:8081/actuator/health
```

## Cổng dịch vụ
| Dịch vụ | Cổng |
|---------|------|
| Spring Boot API | 8081 |
| pgAdmin | 8080 |
| PostgreSQL | 5432 |
