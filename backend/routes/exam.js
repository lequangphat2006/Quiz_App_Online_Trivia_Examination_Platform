const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database');
const router = express.Router();

router.get('/history', authenticateToken, async (req, res) => {
    try {
        const [history] = await pool.query('SELECT * FROM exam_history WHERE user_id = ? ORDER BY exam_date DESC LIMIT 30', [req.user.id]);
        res.json({ history });
    } catch (error) { res.status(500).json({ error: 'Lỗi server' }); }
});

router.get('/statistics', authenticateToken, async (req, res) => {
    try {
        const [stats] = await pool.query('SELECT * FROM user_statistics WHERE user_id = ?', [req.user.id]);
        res.json({ statistics: stats[0] || { total_exams: 0, avg_score: 0, highest_score: 0, lowest_score: 0, rank_level: 'yếu' } });
    } catch (error) { res.status(500).json({ error: 'Lỗi server' }); }
});

router.get('/login-logs', authenticateToken, async (req, res) => {
    try {
        const [logs] = await pool.query('SELECT login_time, ip_address, user_agent, status FROM login_logs WHERE user_id = ? ORDER BY login_time DESC LIMIT 50', [req.user.id]);
        res.json({ logs });
    } catch (error) { res.status(500).json({ error: 'Lỗi server' }); }
});

module.exports = router;