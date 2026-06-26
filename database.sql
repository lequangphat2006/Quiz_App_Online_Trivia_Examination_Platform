CREATE DATABASE IF NOT EXISTS quiz_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE quiz_app;

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
) ENGINE=InnoDB;

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

CREATE TABLE questions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grade VARCHAR(20) NOT NULL,
    level VARCHAR(50) NOT NULL,
    subject VARCHAR(100) DEFAULT 'Chung',
    question TEXT NOT NULL,
    option_a VARCHAR(500) NOT NULL,
    option_b VARCHAR(500) NOT NULL,
    option_c VARCHAR(500) NOT NULL,
    option_d VARCHAR(500) NOT NULL,
    correct_answer TINYINT NOT NULL,
    explanation TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_grade_level (grade, level)
) ENGINE=InnoDB;

CREATE TABLE exam_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    grade VARCHAR(20) NOT NULL,
    level VARCHAR(50) NOT NULL,
    score INT NOT NULL,
    correct_count INT NOT NULL,
    wrong_count INT NOT NULL,
    total_questions INT NOT NULL,
    time_taken INT DEFAULT 0,
    exam_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_date (user_id, exam_date)
) ENGINE=InnoDB;

CREATE TABLE login_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    status ENUM('success', 'failed') DEFAULT 'success',
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_login (user_id, login_time)
) ENGINE=InnoDB;

CREATE TABLE user_statistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    total_exams INT DEFAULT 0,
    avg_score DECIMAL(5,2) DEFAULT 0.00,
    highest_score INT DEFAULT 0,
    lowest_score INT DEFAULT 0,
    rank_level ENUM('yếu', 'trung bình', 'khá', 'tốt') DEFAULT 'yếu',
    last_exam_date DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- Dữ liệu mẫu
INSERT INTO questions (grade, level, question, option_a, option_b, option_c, option_d, correct_answer, explanation) VALUES
('12', 'vận dụng', 'Một vật dao động điều hòa với phương trình x = 5cos(2πt + π/3) cm. Vận tốc của vật tại t = 0,5s là:', '-5π√3 cm/s', '5π cm/s', '-5π cm/s', '10π cm/s', 3, 'Tính đạo hàm phương trình: v = -10π sin(2πt + π/3)'),
('12', 'vận dụng', 'Cho hàm số y = x³ - 3x² + 2. Số điểm cực trị là:', '0', '1', '2', '3', 3, 'y'' = 3x² - 6x = 3x(x-2) = 0 → 2 cực trị'),
('12', 'vận dụng cao', 'Tìm m để PT x³ - 3x + m = 0 có 3 nghiệm phân biệt:', 'm < -2', '-2 < m < 2', 'm > 2', '|m| > 2', 2, 'f(x)=x³-3x, CĐ=2, CT=-2 → -2<m<2'),
('12', 'nhận biết', 'Đơn vị đo cường độ dòng điện là:', 'Vôn (V)', 'Ampe (A)', 'Oát (W)', 'Ôm (Ω)', 2, 'Ampe là đơn vị đo cường độ dòng điện'),
('11', 'vận dụng', 'Vật rơi tự do từ 20m, g=10m/s². Vận tốc chạm đất:', '10 m/s', '20 m/s', '30 m/s', '40 m/s', 2, 'v = √(2gh) = √400 = 20 m/s'),
('11', 'nhận biết', 'Truyện Kiều của tác giả nào?', 'Nguyễn Trãi', 'Nguyễn Du', 'Hồ Xuân Hương', 'Nguyễn Đình Chiểu', 2, 'Đại thi hào Nguyễn Du'),
('10', 'nhận biết', 'Công thức hóa học của nước là:', 'CO2', 'H2O', 'NaCl', 'O2', 2, 'Nước = 2H + O = H2O'),
('10', 'vận dụng', 'Giải PT: 2x + 5 = 13. x = ?', '3', '4', '5', '6', 2, '2x = 8 → x = 4');
