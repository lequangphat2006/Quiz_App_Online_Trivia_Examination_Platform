# 📚 Quiz App - Online Trivia Examination Platform

A web-based quiz application that allows users to take tests by grade and difficulty level, track scores, and view exam history.

## ✨ Features

### 👤 User Authentication
- ✅ User Registration with validation
- ✅ Secure Login with JWT tokens
- ✅ **Forgot Password** (No login required)
- ✅ **Reset Password** (Email verification)
- ✅ **Change Password** (When logged in)
- ✅ User Profile management
- ✅ Login history tracking

### 📝 Quiz Features
- Multiple choice questions with 4 options
- Questions organized by grade level (10, 11, 12)
- Difficulty levels: nhận biết, thông hiểu, vận dụng, vận dụng cao
- Instant score feedback
- Detailed explanations for answers
- Exam history tracking
- Performance statistics

### 📊 User Statistics
- Total exams taken
- Average score
- Highest and lowest scores
- Ranking level (yếu, trung bình, khá, tốt)
- Last exam date

---

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Markup
- **CSS3** - Styling
- **JavaScript (ES6+)** - Interactivity

### Backend
- **Node.js** - Runtime
- **Express.js** - Web framework
- **MySQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation

### Security Features
- 🔒 Password hashing with bcryptjs
- 🔐 JWT token-based authentication
- 🛡️ Rate limiting on login attempts
- 🔑 Secure password reset with token expiration
- 📝 Input validation and sanitization
- 🌐 CORS protection
- 🎯 Helmet.js for secure headers

---

## 📦 Installation

### Prerequisites
- Node.js >= 14
- MySQL >= 5.7
- npm or yarn

### Backend Setup

1. **Clone the repository**
```bash
git clone https://github.com/lequangphat2006/Quiz_App_Online_Trivia_Examination_Platform.git
cd Quiz_App_Online_Trivia_Examination_Platform
```

2. **Setup Database**
```bash
# Create database and tables
mysql -u root -p < database.sql

# Or use MySQL Workbench/GUI to run database.sql
```

3. **Install Backend Dependencies**
```bash
cd backend
npm install
```

4. **Configure Environment**
```bash
# Copy .env.example to .env
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

5. **Start Backend Server**
```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

Server will run on `http://localhost:3000`

### Frontend Setup

The frontend is already served by the Express backend from the `/frontend` directory.

---

## 🔐 Password Management Features

### 1. Forgot Password (Không cần đăng nhập)
**Endpoint:** `POST /api/auth/forgot-password`

```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

**Response:**
```json
{
    "message": "Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu",
    "debugToken": "abc123..." // Chỉ dùng để test
}
```

### 2. Verify Reset Token
**Endpoint:** `POST /api/auth/verify-reset-token`

```bash
curl -X POST http://localhost:3000/api/auth/verify-reset-token \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_TOKEN_HERE"}'
```

### 3. Reset Password (Không cần đăng nhập)
**Endpoint:** `POST /api/auth/reset-password`

```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_TOKEN_HERE",
    "password": "newPassword123",
    "passwordConfirm": "newPassword123"
  }'
```

### 4. Change Password (Cần đăng nhập)
**Endpoint:** `POST /api/auth/change-password`

```bash
curl -X POST http://localhost:3000/api/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "currentPassword": "oldPassword123",
    "newPassword": "newPassword123",
    "passwordConfirm": "newPassword123"
  }'
```

📖 **Xem chi tiết:** [FORGOT_PASSWORD_GUIDE.md](./FORGOT_PASSWORD_GUIDE.md)

---

## 📚 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/profile` - Lấy thông tin hồ sơ (yêu cầu token)
- `POST /api/auth/forgot-password` - Quên mật khẩu
- `POST /api/auth/verify-reset-token` - Xác minh token reset
- `POST /api/auth/reset-password` - Đặt lại mật khẩu
- `POST /api/auth/change-password` - Đổi mật khẩu (yêu cầu token)

### Questions
- `GET /api/questions` - Lấy danh sách câu hỏi
- `GET /api/questions/:id` - Lấy chi tiết câu hỏi
- `POST /api/questions` - Thêm câu hỏi (Admin)
- `PUT /api/questions/:id` - Cập nhật câu hỏi (Admin)
- `DELETE /api/questions/:id` - Xóa câu hỏi (Admin)

### Exams
- `POST /api/exam/start` - Bắt đầu bài thi
- `POST /api/exam/submit` - Nộp bài thi
- `GET /api/exam/history` - Xem lịch sử thi

### Admin
- `GET /api/admin/users` - Danh sách người dùng (Admin)
- `GET /api/admin/stats` - Thống kê (Admin)

---

## 🗄️ Database Schema

### Users Table
```sql
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(30) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    full_name VARCHAR(100) NOT NULL,
    avatar VARCHAR(10) DEFAULT '👤',
    role ENUM('user', 'admin') DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### Password Reset Tokens Table
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
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### Other Tables
- `questions` - Câu hỏi trắc nghiệm
- `exam_history` - Lịch sử bài thi
- `login_logs` - Logs đăng nhập
- `user_statistics` - Thống kê người dùng

---

## 🧪 Testing

### Test Scenario: Forgot Password Flow

```bash
# 1. Register a new user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "password123",
    "fullName": "Test User"
  }'

# 2. Request password reset
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'
# Copy the debugToken from response

# 3. Verify token
curl -X POST http://localhost:3000/api/auth/verify-reset-token \
  -H "Content-Type: application/json" \
  -d '{"token": "YOUR_TOKEN_HERE"}'

# 4. Reset password
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "token": "YOUR_TOKEN_HERE",
    "password": "newPassword456",
    "passwordConfirm": "newPassword456"
  }'

# 5. Login with new password
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "newPassword456"
  }'
```

---

## 🔒 Security Considerations

✅ **Passwords** - Hashed with bcryptjs (10 salt rounds)
✅ **Tokens** - Reset tokens hashed with SHA256 before storage
✅ **Expiration** - Reset tokens expire after 1 hour
✅ **Single Use** - Reset tokens can only be used once
✅ **Rate Limiting** - Login attempts limited to 10/15min
✅ **Input Validation** - All inputs validated with express-validator
✅ **CORS** - Only localhost:3000 allowed by default
✅ **Headers** - Protected with Helmet.js

### Important Notes
- Change `JWT_SECRET` in production to a strong random string
- Never commit `.env` file (it's in .gitignore)
- Implement real email service for password reset in production
- Remove `debugToken` from API responses in production

---

## 📂 Project Structure

```
Quiz_App_Online_Trivia_Examination_Platform/
├── backend/
│   ├── routes/
│   │   ├── auth.js          # Authentication routes (Login, Register, Forgot Password)
│   │   ├── questions.js     # Question management
│   │   ├── exam.js          # Exam endpoints
│   │   └── admin.js         # Admin routes
│   ├── middleware/
│   │   └── auth.js          # JWT authentication middleware
│   ├── config/
│   │   └── database.js      # MySQL connection pool
│   ├── server.js            # Express app setup
│   ├── package.json         # Dependencies
│   └── .env.example         # Environment configuration example
├── frontend/
│   ├── index.html
│   ├── css/
│   ├── js/
│   └── assets/
├── database.sql             # Database schema
├── FORGOT_PASSWORD_GUIDE.md # Detailed password reset guide
└── README.md
```

---

## 🚀 Deployment

### Development
```bash
cd backend
npm run dev
```

### Production
```bash
# Set NODE_ENV to production
export NODE_ENV=production

# Install dependencies
npm install --production

# Start server
npm start
```

### With PM2 (Recommended)
```bash
npm install -g pm2
pm2 start server.js --name "quiz-app"
pm2 save
pm2 startup
```

---

## 🐛 Troubleshooting

### Database Connection Failed
- Check MySQL is running: `mysql -u root -p`
- Verify DB credentials in `.env`
- Ensure database created: `mysql -u root -p < database.sql`

### Port Already in Use
```bash
# Change PORT in .env or kill process
lsof -i :3000
kill -9 <PID>
```

### JWT Token Invalid
- Check `JWT_SECRET` matches on frontend and backend
- Ensure token isn't expired
- Verify token format: `Bearer <token>`

### Password Reset Not Working
- Token may be expired (1 hour limit)
- Token can only be used once
- Check email in database matches request

---

## 📝 Environment Variables

Copy `.env.example` to `.env` and configure:

```
PORT=3000                           # Server port
NODE_ENV=development                # Environment
DB_HOST=localhost                   # MySQL host
DB_USER=root                        # MySQL user
DB_PASSWORD=                        # MySQL password
DB_NAME=quiz_app                    # Database name
JWT_SECRET=your_secret_key          # JWT signing key
JWT_EXPIRE=24h                      # Token expiration time
```

---

## 📄 License

This project is open source and available under the MIT License.

---

## 👨‍💻 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📧 Support

For issues and questions, please create an issue on GitHub.

---

**Happy Quizzing! 🎉**
