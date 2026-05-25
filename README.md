# 🎓 Quiz App - Online Trivia Examination Platform

A full-stack web-based quiz application that allows users to take tests by grade and difficulty level, track scores, view exam history, and manage questions (admin).

## ✨ Features

- User authentication (login/register)
- Take quizzes by grade (10, 11, 12) and difficulty level (nhận biết, vận dụng, vận dụng cao)
- Automatic scoring and answer explanation
- Exam history tracking
- User statistics (average score, highest score, rank)
- Admin panel for managing questions
- Login logs for security

## 🛠️ Tech Stack

| Category | Technologies |
|----------|--------------|
| Backend | Node.js, Express |
| Database | MySQL |
| Frontend | HTML, CSS, JavaScript |
| Authentication | JWT (JSON Web Token) |
| Environment | dotenv |

## 📁 Project Structure

```
Quiz_App_Online_Trivia_Examination_Platform/
├── backend/
│   ├── config/
│   │   └── database.js       # Database connection
│   ├── middleware/
│   │   └── auth.js           # JWT authentication middleware
│   ├── routes/
│   │   ├── admin.js          # Admin routes (manage questions)
│   │   ├── auth.js           # Login/register routes
│   │   ├── exam.js           # Take exam, submit answers
│   │   └── questions.js      # Fetch questions by grade/level
│   ├── server.js             # Main entry point
│   └── package.json
├── frontend/
│   └── index.html            # Main frontend interface
├── database.sql              # Database schema + sample data
└── .gitignore
```
## 🚀 Installation Guide

### Prerequisites

- Node.js (>= 14.x) - [Download](https://nodejs.org/)
- MySQL (>= 5.7) - [Download](https://www.mysql.com/downloads/)

### Step 1: Clone the repository
bash
git clone https://github.com/lequangphat2006/Quiz_App_Online_Trivia_Examination_Platform.git
cd Quiz_App_Online_Trivia_Examination_Platform
Step 2: Install backend dependencies
bash

cd backend
npm install

Step 3: Set up the database
bash

mysql -u root -p < database.sql

Alternatively, import database.sql using phpMyAdmin or MySQL Workbench.

Step 4: Configure environment variables

Create a .env file inside the backend folder:
bash

cd backend
touch .env

Add the following to .env:
env

DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=quiz_app
PORT=3000
JWT_SECRET=your_secret_key_here

Replace your_mysql_password with your actual MySQL password.

Step 5: Run the application
bash

npm start
# or for development with auto-restart:
npm run dev

Step 6: Access the app

Open your browser and go to: http://localhost:3000
🧪 Default Test Accounts
Role	Username	Password
Admin	admin	admin123
Regular User	user01	123456

  If these accounts don't exist, register a new account and manually set role = 'admin' in the database.

📊 Sample Questions Included

The database.sql file includes sample questions for:

  Grade 12: Physics (harmonic motion), Math (functions)

  Grade 11: Physics (free fall), Literature (Truyện Kiều)

  Grade 10: Chemistry (H₂O), Math (linear equations)

🔧 Troubleshooting
Error: ER_NOT_SUPPORTED_AUTH_MODE (MySQL 8+)
sql

ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'your_password';
FLUSH PRIVILEGES;

Error: Port 3000 already in use

Change the PORT in .env to another number (e.g., PORT=3001).
📄 License

MIT
👤 Author

Lê Quang Phát

  GitHub: lequangphat2006
