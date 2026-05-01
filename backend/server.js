require('dotenv').config();
const express = require('express');
const cors = require('cors');
const db = require('./config/db');
const runMigrations = require('./config/migration');
const path = require('path');

// Tự động kiểm tra và đồng bộ hóa cấu trúc bảng cho các client/team members
runMigrations();

const authRoutes = require('./routes/authRoutes');
const classRoutes = require('./routes/classRoutes');
const scheduleRoutes = require('./routes/scheduleRoutes');
const materialRoutes = require('./routes/materialRoutes');
const learningMaterialRoutes = require('./routes/learningMaterialRoutes');
const studentRoutes = require('./routes/studentRoutes');
const homeworkRoutes = require('./routes/homeworkRoutes');
const progressRoutes = require('./routes/progressRoutes');

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploaded files as static with cross-origin headers
app.use('/uploads', (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    // DF002: Cho phép xem file PDF trực tiếp trên trình duyệt (inline preview)
    if (req.path.toLowerCase().endsWith('.pdf')) {
        res.setHeader('Content-Disposition', 'inline');
        res.setHeader('Content-Type', 'application/pdf');
    }
    next();
}, express.static(path.join(__dirname, 'uploads')));

app.use('/api/auth', authRoutes);
app.use('/api/users', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/materials', materialRoutes);
app.use('/api/learning-materials', learningMaterialRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/homework', homeworkRoutes);
app.use('/api/progress', progressRoutes);

app.get('/api/health', (req, res) => {
    res.status(200).json({
        status: 'OK',
        message: 'NP Education API is running.'
    });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
