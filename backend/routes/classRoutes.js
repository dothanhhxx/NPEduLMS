const express = require('express');
const classController = require('../controllers/classController');
const materialController = require('../controllers/materialController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

const router = express.Router();

// Tất cả các route bên dưới đều yêu cầu đăng nhập
router.use(verifyToken);

// --- 1. CÁC ROUTE LẤY DỮ LIỆU DROPDOWN (Main mới thêm) ---
router.get('/teachers', verifyRole(['Admin', 1]), classController.getTeachers);
router.get('/branches', verifyRole(['Admin', 1]), classController.getBranches);
router.get('/courses', verifyRole(['Admin', 1]), classController.getCourses);

// --- 2. CÁC ROUTE DANH SÁCH & TÀI LIỆU ---
// Cho phép cả Admin(1), Teacher(4), Student(5) truy cập tùy theo logic trong Controller
router.get('/', verifyRole(['Admin', 'Teacher', 'Student', 1, 4, 5]), classController.getAllClasses);
router.get('/:id/materials', materialController.getClassMaterials);
router.get('/:id', classController.getClassById);

// --- 3. CÁC THAO TÁC QUẢN TRỊ (Chỉ Admin [1] được làm) ---
router.post('/', verifyRole(['Admin', 1]), classController.createClass);
router.put('/:id', verifyRole(['Admin', 1]), classController.updateClass);
router.put('/:id/assign-teacher', verifyRole(['Admin', 1]), classController.assignTeacher);
router.delete('/:id', verifyRole(['Admin', 1]), classController.deleteClass);

// --- 4. NGUYỆT TIÊM: TÍNH NĂNG GHI DANH US6 ---
router.post('/:id/enroll', verifyRole(['Admin', 1]), classController.enrollStudent);

// --- 5. LẤY DANH SÁCH HỌC SINH TRONG LỚP ---
router.get('/:id/students', verifyRole(['Admin', 'Teacher', 1, 4]), classController.getClassStudents);

module.exports = router;