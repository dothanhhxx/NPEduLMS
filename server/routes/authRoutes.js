import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'npeducation_secret_key_2024';

const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/auth/login — Đăng nhập
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' });
    }

    try {
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
        }

        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({ message: 'Email hoặc mật khẩu không đúng.' });
        }

        res.json({
            success: true,
            token: generateToken(user.id),
            user: {
                id: user.id,
                full_name: user.full_name,
                email: user.email,
                role: user.role,
                assigned_class_id: user.assigned_class_id
            }
        });
    } catch (error) {
        console.error('Lỗi đăng nhập:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
});

// GET /api/auth/me — Lấy thông tin người dùng hiện tại
router.get('/me', protect, async (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user.id,
            full_name: req.user.full_name,
            email: req.user.email,
            role: req.user.role,
            assigned_class_id: req.user.assigned_class_id
        }
    });
});

export default router;