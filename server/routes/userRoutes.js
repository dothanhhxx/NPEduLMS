import express from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'npeducation_secret_key_2024';

const generateToken = (id) => {
    return jwt.sign({ id }, JWT_SECRET, { expiresIn: '7d' });
};

// POST /api/users/register — Đăng ký tài khoản mới (chỉ Admin)
router.post('/register', protect, authorize('admin'), async (req, res) => {
    const { full_name, email, password, role, assigned_class_id } = req.body;

    if (!full_name || !email || !password || !role) {
        return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
    }

    try {
        const existingUser = await User.findOne({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ message: 'Email này đã được sử dụng.' });
        }

        const user = await User.create({
            full_name,
            email,
            password,
            role,
            assigned_class_id: assigned_class_id || null
        });

        res.status(201).json({
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
        console.error('Lỗi đăng ký:', error);
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
});

// GET /api/users — Lấy danh sách tất cả người dùng (chỉ Admin)
router.get('/', protect, authorize('admin'), async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: { exclude: ['password'] }
        });
        res.json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
});

// DELETE /api/users/:id — Xóa người dùng (chỉ Admin)
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'Không tìm thấy người dùng.' });
        }
        await user.destroy();
        res.json({ success: true, message: 'Đã xóa người dùng.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi máy chủ.' });
    }
});

export default router;