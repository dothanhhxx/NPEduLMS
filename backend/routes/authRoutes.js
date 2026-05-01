const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Đăng nhập
router.post('/login', authController.login);

// Quên mật khẩu
router.post('/forgot-password', authController.forgotPassword);

// Đăng ký (Tạo tài khoản mới) - Map với /api/users
router.post('/register', authController.register);

// Đặt lại mật khẩu từ email
router.post('/reset-password', authController.resetPassword);

// Lấy danh sách tất cả người dùng (Admin)
router.get('/all', verifyToken, authController.getAllUsers);

// Thay đổi mật khẩu (yêu cầu đăng nhập)
router.post('/change-password', verifyToken, authController.changePassword);

module.exports = router;
