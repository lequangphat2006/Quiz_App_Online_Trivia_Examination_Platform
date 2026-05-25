const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const examRoutes = require('./routes/exam');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: ['http://localhost:3000', 'http://127.0.0.1:3000'], credentials: true }));

app.use('/api/', rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));
app.use('/api/auth/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 10, message: { error: 'Quá nhiều lần thử.' } }));

app.use(express.json({ limit: '10kb' }));
app.use(express.static(path.join(__dirname, '../frontend')));

app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/admin', adminRoutes);

app.get('*', (req, res) => res.sendFile(path.join(__dirname, '../frontend/index.html')));

app.use((err, req, res, next) => { console.error(err.stack); res.status(500).json({ error: 'Lỗi server' }); });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));