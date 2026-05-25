const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database');
const router = express.Router();

// Register
router.post('/register', [
    body('username').trim().isLength({ min: 3, max: 30 }),
    body('password').isLength({ min: 6 }),
    body('email').isEmail(),
    body('fullName').trim().isLength({ min: 2 })
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
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Login
router.post('/login', [
    body('username').trim().notEmpty(),
    body('password').notEmpty()
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
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        const [users] = await pool.query('SELECT id, username, full_name, email, avatar, role, created_at FROM users WHERE id = ?', [req.user.id]);
        if (users.length === 0) return res.status(404).json({ error: 'Không tìm thấy' });
        res.json({ user: users[0] });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi server' });
    }
});

module.exports = router;