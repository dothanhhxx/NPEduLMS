const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// --- TẤT CẢ ROUTE BÊN DƯỚI ĐỀU PHẢI ĐĂNG NHẬP ---
router.use(verifyToken);

// 1. NGUYỆT TIÊM: Lấy TẤT CẢ học sinh (Dùng cho bảng chọn Ghi danh US6)
// Cho phép cả Admin và Teacher (theo tên hoặc ID số 1, 4)
router.get('/', verifyRole(['Admin', 'Teacher', 1, 4]), studentController.getAllStudents);

// 2. Lấy học sinh theo từng lớp (Main đã có, Nguyệt tiêm thêm bảo mật)
router.get('/class/:classId', verifyRole(['Admin', 'Teacher', 1, 4]), studentController.getStudentsByClass);

module.exports = router;