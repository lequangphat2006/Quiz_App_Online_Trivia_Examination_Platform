const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database');
const router = express.Router();

router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const [[{ totalUsers }]] = await pool.query('SELECT COUNT(*) as totalUsers FROM users');
        const [[{ totalExams }]] = await pool.query('SELECT COUNT(*) as totalExams FROM exam_history');
        const [[{ avgScore }]] = await pool.query('SELECT AVG(score) as avgScore FROM exam_history');
        const [[{ loginToday }]] = await pool.query("SELECT COUNT(*) as loginToday FROM login_logs WHERE DATE(login_time) = CURDATE() AND status = 'success'");
        
        const [rankDist] = await pool.query('SELECT rank_level, COUNT(*) as count FROM user_statistics GROUP BY rank_level');
        const [gradeDist] = await pool.query('SELECT grade, COUNT(*) as count FROM exam_history GROUP BY grade');
        const [levelDist] = await pool.query('SELECT level, COUNT(*) as count FROM exam_history GROUP BY level');
        const [topUsers] = await pool.query(
            `SELECT u.username, u.full_name, s.avg_score, s.total_exams, s.rank_level 
             FROM user_statistics s JOIN users u ON s.user_id = u.id 
             WHERE s.total_exams > 0 ORDER BY s.avg_score DESC LIMIT 10`
        );

        res.json({ totalUsers, totalExams, avgScore: Math.round(avgScore || 0), loginToday, rankDist, gradeDist, levelDist, topUsers });
    } catch (error) { res.status(500).json({ error: 'Lỗi server' }); }
});

module.exports = router;