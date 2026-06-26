# 🔐 Hướng Dẫn Tính Năng Quên Mật Khẩu

## 📋 Tổng Quan

Ứng dụng giờ đã hỗ trợ đầy đủ tính năng quên mật khẩu mà **không cần đăng nhập**. Người dùng có 3 cách để quản lý mật khẩu:

1. **Quên mật khẩu** (Forgot Password) - Đặt lại mật khẩu bằng email
2. **Xác minh token** (Verify Reset Token) - Kiểm tra token hợp lệ
3. **Đổi mật khẩu** (Change Password) - Đổi mật khẩu khi đã đăng nhập

---

## 🔧 Cập Nhật Database

Chạy lệnh SQL để tạo bảng `password_reset_tokens`:

```bash
mysql -u root -p quiz_app < database.sql
```

Hoặc chạy SQL trực tiếp:

```sql
CREATE TABLE password_reset_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL,
    expires_at DATETIME NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    used_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token),
    INDEX idx_user_expires (user_id, expires_at),
    INDEX idx_email (email)
) ENGINE=InnoDB;
```

---

## 📡 API Endpoints

### 1️⃣ **Quên Mật Khẩu (Yêu cầu reset)**

**Endpoint:** `POST /api/auth/forgot-password`

**Mô tả:** Gửi yêu cầu reset mật khẩu. Hệ thống sẽ kiểm tra email và tạo token reset.

**Body (JSON):**
```json
{
    "email": "user@example.com"
}
```

**Response (200 OK):**
```json
{
    "message": "Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu",
    "debugToken": "abc123..." // Chỉ dùng để test, xóa khi deploy
}
```

**Lỗi (400):**
```json
{
    "error": "Email không hợp lệ"
}
```

**Test cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

---

### 2️⃣ **Xác Minh Token Reset**

**Endpoint:** `POST /api/auth/verify-reset-token`

**Mô tả:** Kiểm tra token có hợp lệ không và chưa hết hạn.

**Body (JSON):**
```json
{
    "token": "abc123..."
}
```

**Response (200 OK):**
```json
{
    "message": "Token hợp lệ",
    "email": "user@example.com"
}
```

**Lỗi (400):**
```json
{
    "error": "Token không hợp lệ hoặc đã hết hạn"
}
```

**Test cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/verify-reset-token \
  -H "Content-Type: application/json" \
  -d '{"token": "abc123..."}'
```

---

### 3️⃣ **Đặt Lại Mật Khẩu (Reset Password)**

**Endpoint:** `POST /api/auth/reset-password`

**Mô tả:** Đặt mật khẩu mới bằng token reset. Người dùng không cần đăng nhập.

**Body (JSON):**
```json
{
    "token": "abc123...",
    "password": "newPassword123",
    "passwordConfirm": "newPassword123"
}
```

**Response (200 OK):**
```json
{
    "message": "Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại với mật khẩu mới."
}
```

**Lỗi (400):**
```json
{
    "error": "Mật khẩu xác nhận không khớp"
}
```

**Test cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "abc123...",
    "password": "newPassword123",
    "passwordConfirm": "newPassword123"
  }'
```

---

### 4️⃣ **Đổi Mật Khẩu (Change Password) - Cần Đăng Nhập**

**Endpoint:** `POST /api/auth/change-password`

**Mô tả:** Đổi mật khẩu khi đã đăng nhập. Yêu cầu mật khẩu hiện tại.

**Headers:**
```
Authorization: Bearer <token>
```

**Body (JSON):**
```json
{
    "currentPassword": "oldPassword123",
    "newPassword": "newPassword123",
    "passwordConfirm": "newPassword123"
}
```

**Response (200 OK):**
```json
{
    "message": "Đổi mật khẩu thành công!"
}
```

**Lỗi (401):**
```json
{
    "error": "Mật khẩu hiện tại không đúng"
}
```

**Test cURL:**
```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "currentPassword": "oldPassword123",
    "newPassword": "newPassword123",
    "passwordConfirm": "newPassword123"
  }'
```

---

## 🧪 Hướng Dẫn Test

### Bước 1: Đăng Ký Tài Khoản

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'
```

### Bước 2: Quên Mật Khẩu - Yêu Cầu Reset

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
```

**Kết quả:** Sẽ nhận được token (trong phản hồi `debugToken` hoặc logs server)

### Bước 3: Xác Minh Token

```bash
curl -X POST http://localhost:3000/api/auth/verify-reset-token \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_TOKEN_HERE"}'
```

### Bước 4: Đặt Lại Mật Khẩu

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_TOKEN_HERE",
    "password": "newPassword456",
    "passwordConfirm": "newPassword456"
  }'
```

### Bước 5: Đăng Nhập Với Mật Khẩu Mới

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "newPassword456"
  }'
```

### Bước 6: Đổi Mật Khẩu (Khi Đã Đăng Nhập)

```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "currentPassword": "newPassword456",
    "newPassword": "anotherPassword789",
    "passwordConfirm": "anotherPassword789"
  }'
```

---

## 🛡️ Tính Năng Bảo Mật

✅ **Token hết hạn:** Token reset chỉ hợp lệ trong 1 giờ
✅ **Token một lần:** Token chỉ có thể sử dụng một lần, sau đó bị đánh dấu `is_used = TRUE`
✅ **Hash token:** Token được hash bằng SHA256 trước khi lưu vào database
✅ **Kiểm tra email:** Hệ thống không tiết lộ email có tồn tại hay không (để tránh brute force)
✅ **Xác minh mật khẩu:** Mật khẩu hiện tại phải đúng khi đổi mật khẩu

---

## 📧 Cấu Hình Email (Tùy Chọn)

Hiện tại, token reset được in ra console để test. Để triển khai thực tế, bạn cần:

1. Cài đặt package email (ví dụ: `nodemailer`, `sendgrid`)
2. Cấu hình credentials email
3. Thêm code gửi email vào function `forgot-password`

**Ví dụ với Nodemailer:**

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

// Trong forgot-password endpoint
const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;
await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Đặt lại mật khẩu',
    html: `<p>Nhấp vào liên kết dưới đây để đặt lại mật khẩu:</p>
           <a href="${resetLink}">${resetLink}</a>
           <p>Liên kết này sẽ hết hạn trong 1 giờ.</p>`
});
```

---

## 🐛 Troubleshooting

| Lỗi | Nguyên Nhân | Giải Pháp |
|-----|-----------|---------|
| "Token không hợp lệ hoặc đã hết hạn" | Token ��ã hết 1 giờ hoặc đã dùng | Yêu cầu token mới |
| "Mật khẩu xác nhận không khớp" | Mật khẩu và confirm không giống | Nhập lại cùng mật khẩu |
| "Mật khẩu hiện tại không đúng" | Mật khẩu cũ sai khi đổi mật khẩu | Nhập đúng mật khẩu cũ |
| Email không tìm thấy | Email chưa đăng ký | Kiểm tra lại email |

---

## 📝 Ghi Chú

- **debugToken** trong response của `/forgot-password` chỉ dùng để test. Xóa nó trước khi deploy lên production.
- Cần cấu hình email service thực tế để gửi link reset cho người dùng.
- Token reset được mã hóa SHA256 khi lưu vào database để tăng bảo mật.

---

## ✨ Tóm Tắt Quy Trình

```
Người Dùng Quên Mật Khẩu
    ↓
POST /api/auth/forgot-password (email)
    ↓
Hệ Thống Tạo Token & Gửi Email
    ↓
Người Dùng Nhấp Liên Kết Trong Email
    ↓
POST /api/auth/verify-reset-token (kiểm tra token)
    ↓
POST /api/auth/reset-password (đặt mật khẩu mới)
    ↓
✅ Mật Khẩu Được Cập Nhật
    ↓
Người Dùng Đăng Nhập Với Mật Khẩu Mới
```
