const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database');
const router = express.Router();

// ============ REGISTER ============
router.post('/register', [
    body('username').trim().isLength({ min: 3, max: 30 }).withMessage('Tên đăng nhập phải từ 3-30 ký tự'),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải ít nhất 6 ký tự'),
    body('email').isEmail().withMessage('Email không hợp lệ'),
    body('fullName').trim().isLength({ min: 2 }).withMessage('Tên đầy đủ phải ít nhất 2 ký tự')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    try {
        const { username, password, email, fullName } = req.body;
        const [existing] = await pool.query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existing.length > 0) return res.status(400).json({ error: 'Tên đăng nhập hoặc email đã tồn tại' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await pool.query(
            'INSERT INTO users (username, password, email, full_name) VALUES (?, ?, ?, ?)',
            [username, hashedPassword, email, fullName]
        );
        await pool.query('INSERT INTO user_statistics (user_id) VALUES (?)', [result.insertId]);
        res.status(201).json({ message: 'Đăng ký thành công!' });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ============ LOGIN ============
router.post('/login', [
    body('username').trim().notEmpty().withMessage('Vui lòng nhập tên đăng nhập'),
    body('password').notEmpty().withMessage('Vui lòng nhập mật khẩu')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    try {
        const { username, password } = req.body;
        const [users] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
        
        if (users.length === 0) {
            await pool.query('INSERT INTO login_logs (user_id, ip_address, user_agent, status) VALUES (0, ?, ?, ?)', [req.ip, req.headers['user-agent'] || '', 'failed']);
            return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        const user = users[0];
        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
            await pool.query('INSERT INTO login_logs (user_id, ip_address, user_agent, status) VALUES (?, ?, ?, ?)', [user.id, req.ip, req.headers['user-agent'] || '', 'failed']);
            return res.status(401).json({ error: 'Tên đăng nhập hoặc mật khẩu không đúng' });
        }

        await pool.query('INSERT INTO login_logs (user_id, ip_address, user_agent, status) VALUES (?, ?, ?, ?)', [user.id, req.ip, req.headers['user-agent'] || '', 'success']);

        const token = jwt.sign({ id: user.id, username: user.username, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '24h' });

        res.json({
            token,
            user: { id: user.id, username: user.username, fullName: user.full_name, email: user.email, role: user.role, avatar: user.avatar }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ============ GET PROFILE ============
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, username, full_name, email, avatar, role, created_at FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        res.json({ user: users[0] });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ============ FORGOT PASSWORD ============
// Bước 1: Gửi yêu cầu reset mật khẩu (không cần đăng nhập)
router.post('/forgot-password', [
    body('email').isEmail().withMessage('Email không hợp lệ')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    try {
        const { email } = req.body;

        // Kiểm tra email có tồn tại không
        const [users] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            // Để an toàn, không tiết lộ email có tồn tại hay không
            return res.status(200).json({ 
                message: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu' 
            });
        }

        const user = users[0];

        // Xóa token cũ chưa sử dụng
        await pool.query('DELETE FROM password_reset_tokens WHERE user_id = ? AND is_used = FALSE', [user.id]);

        // Tạo token reset (64 ký tự hex)
        const resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

        // Lưu token vào database (hết hạn sau 1 giờ)
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 giờ
        await pool.query(
            'INSERT INTO password_reset_tokens (user_id, email, token, expires_at) VALUES (?, ?, ?, ?)',
            [user.id, email, hashedToken, expiresAt]
        );

        // TODO: Gửi email chứa token reset (bạn cần cấu h��nh email service)
        // Cách sử dụng token: http://localhost:3000/reset-password?token=resetToken
        console.log(`🔑 Reset token cho ${email}: ${resetToken}`);

        res.status(200).json({ 
            message: 'Nếu email tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu',
            // TODO: Xóa dòng này khi triển khai email thực tế
            debugToken: resetToken // Chỉ dùng để test, xóa khi deploy
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ============ VERIFY RESET TOKEN ============
// Kiểm tra token có hợp lệ không (không cần đăng nhập)
router.post('/verify-reset-token', [
    body('token').notEmpty().withMessage('Token không được để trống')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    try {
        const { token } = req.body;
        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        const [tokens] = await pool.query(
            'SELECT * FROM password_reset_tokens WHERE token = ? AND is_used = FALSE AND expires_at > NOW()',
            [hashedToken]
        );

        if (tokens.length === 0) {
            return res.status(400).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
        }

        const resetToken = tokens[0];
        res.status(200).json({ 
            message: 'Token hợp lệ',
            email: resetToken.email
        });
    } catch (error) {
        console.error('Verify token error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ============ RESET PASSWORD ============
// Bước 2: Đặt mật khẩu mới (không cần đăng nhập, chỉ cần token)
router.post('/reset-password', [
    body('token').notEmpty().withMessage('Token không được để trống'),
    body('password').isLength({ min: 6 }).withMessage('Mật khẩu phải ít nhất 6 ký tự'),
    body('passwordConfirm').notEmpty().withMessage('Vui lòng xác nhận mật khẩu')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    try {
        const { token, password, passwordConfirm } = req.body;

        // Kiểm tra mật khẩu và xác nhận khớp
        if (password !== passwordConfirm) {
            return res.status(400).json({ error: 'Mật khẩu xác nhận không khớp' });
        }

        const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

        // Kiểm tra token
        const [tokens] = await pool.query(
            'SELECT * FROM password_reset_tokens WHERE token = ? AND is_used = FALSE AND expires_at > NOW()',
            [hashedToken]
        );

        if (tokens.length === 0) {
            return res.status(400).json({ error: 'Token không hợp lệ hoặc đã hết hạn' });
        }

        const resetToken = tokens[0];
        const userId = resetToken.user_id;

        // Hash mật khẩu mới
        const hashedPassword = await bcrypt.hash(password, 10);

        // Cập nhật mật khẩu người dùng
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        // Đánh dấu token đã được sử dụng
        await pool.query(
            'UPDATE password_reset_tokens SET is_used = TRUE, used_at = NOW() WHERE id = ?',
            [resetToken.id]
        );

        res.status(200).json({ 
            message: 'Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại với mật khẩu mới.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// ============ CHANGE PASSWORD (Cần đăng nhập) ============
// Cho người dùng đã đăng nhập muốn đổi mật khẩu
router.post('/change-password', authenticateToken, [
    body('currentPassword').notEmpty().withMessage('Vui lòng nhập mật khẩu hiện tại'),
    body('newPassword').isLength({ min: 6 }).withMessage('Mật khẩu mới phải ít nhất 6 ký tự'),
    body('passwordConfirm').notEmpty().withMessage('Vui lòng xác nhận mật khẩu mới')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    try {
        const { currentPassword, newPassword, passwordConfirm } = req.body;
        const userId = req.user.id;

        // Kiểm tra mật khẩu mới và xác nhận khớp
        if (newPassword !== passwordConfirm) {
            return res.status(400).json({ error: 'Mật khẩu xác nhận không khớp' });
        }

        // Lấy mật khẩu hiện tại
        const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy người dùng' });
        }

        // Kiểm tra mật khẩu hiện tại
        const isValid = await bcrypt.compare(currentPassword, users[0].password);
        if (!isValid) {
            return res.status(401).json({ error: 'Mật khẩu hiện tại không đúng' });
        }

        // Hash mật khẩu mới
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Cập nhật mật khẩu
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.status(200).json({ 
            message: 'Đổi mật khẩu thành công!'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

module.exports = router;
