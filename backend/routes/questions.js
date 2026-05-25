const express = require('express');
const { query, body, validationResult } = require('express-validator');
const { authenticateToken } = require('../middleware/auth');
const pool = require('../config/database');
const router = express.Router();

const ALLOWED_GRADES = ['10', '11', '12'];
const ALLOWED_LEVELS = ['nhận biết', 'vận dụng', 'vận dụng cao'];

// Get questions
router.get('/', authenticateToken, [
    query('grade').isIn(ALLOWED_GRADES),
    query('level').isIn(ALLOWED_LEVELS),
    query('limit').optional().isInt({ min: 1, max: 50 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    try {
        const { grade, level, limit } = req.query;
        const questionLimit = limit ? parseInt(limit) : 10;

        const [questions] = await pool.query(
            'SELECT id, question, option_a, option_b, option_c, option_d FROM questions WHERE grade = ? AND level = ? ORDER BY RAND() LIMIT ?',
            [grade, level, questionLimit]
        );

        if (questions.length === 0) return res.status(404).json({ error: 'Chưa có câu hỏi cho mục này.' });

        const sanitized = questions.map(q => ({
            id: q.id,
            question: q.question,
            options: [q.option_a, q.option_b, q.option_c, q.option_d]
        }));

        res.json({ grade: `Lớp ${grade}`, level, total: sanitized.length, questions: sanitized });
    } catch (error) {
        res.status(500).json({ error: 'Lỗi server' });
    }
});

// Submit exam
router.post('/submit', authenticateToken, [
    body('grade').isIn(ALLOWED_GRADES),
    body('level').isIn(ALLOWED_LEVELS),
    body('answers').isArray(),
    body('timeTaken').optional().isInt({ min: 0 })
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

    try {
        const { grade, level, answers, timeTaken } = req.body;
        const questionIds = answers.map(a => a.questionId);
        
        const [correctAnswers] = await pool.query(
            'SELECT id, correct_answer, question, option_a, option_b, option_c, option_d, explanation FROM questions WHERE id IN (?)',
            [questionIds]
        );

        let correctCount = 0;
        const results = [];

        answers.forEach(answer => {
            const question = correctAnswers.find(q => q.id === answer.questionId);
            if (question) {
                const isCorrect = question.correct_answer === answer.selectedAnswer;
                if (isCorrect) correctCount++;
                results.push({
                    questionId: question.id,
                    question: question.question,
                    userAnswer: answer.selectedAnswer,
                    correctAnswer: question.correct_answer,
                    isCorrect,
                    explain: question.explanation || '',
                    options: [question.option_a, question.option_b, question.option_c, question.option_d]
                });
            }
        });

        const totalQuestions = results.length;
        const wrongCount = totalQuestions - correctCount;
        const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

        await pool.query(
            'INSERT INTO exam_history (user_id, grade, level, score, correct_count, wrong_count, total_questions, time_taken, exam_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())',
            [req.user.id, `Lớp ${grade}`, level, score, correctCount, wrongCount, totalQuestions, timeTaken || 0]
        );

        await updateUserStatistics(req.user.id);

        res.json({ score, correctCount, wrongCount, totalQuestions, grade: `Lớp ${grade}`, level, results, timeTaken: timeTaken || 0 });
    } catch (error) {
        console.error('Submit error:', error);
        res.status(500).json({ error: 'Lỗi server' });
    }
});

async function updateUserStatistics(userId) {
    try {
        const [stats] = await pool.query(
            'SELECT COUNT(*) as total, AVG(score) as avg_s, MAX(score) as max_s, MIN(score) as min_s, MAX(exam_date) as last_date FROM exam_history WHERE user_id = ?',
            [userId]
        );
        const { total, avg_s, max_s, min_s, last_date } = stats[0];
        let rank = 'yếu';
        if (avg_s >= 80) rank = 'tốt';
        else if (avg_s >= 65) rank = 'khá';
        else if (avg_s >= 50) rank = 'trung bình';

        await pool.query(
            'INSERT INTO user_statistics (user_id, total_exams, avg_score, highest_score, lowest_score, rank_level, last_exam_date) VALUES (?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE total_exams=?, avg_score=?, highest_score=?, lowest_score=?, rank_level=?, last_exam_date=?',
            [userId, total, avg_s, max_s, min_s, rank, last_date, total, avg_s, max_s, min_s, rank, last_date]
        );
    } catch (error) {
        console.error('Update stats error:', error);
    }
}

module.exports = router;