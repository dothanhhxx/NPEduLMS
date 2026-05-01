const express = require('express');
const router = express.Router();
const homeworkController = require('../controllers/homeworkController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

// GET /api/homework — Lấy danh sách bài tập của tất cả lớp
router.get('/', verifyToken, homeworkController.getAllHomework);

// GET /api/homework/classes/:classId — Lấy danh sách bài tập theo lớp
router.get('/classes/:classId', verifyToken, homeworkController.getHomeworkByClass);

// POST /api/homework/classes/:classId - Tạo bài tập (chỉ Teacher)
router.post('/classes/:classId', verifyToken, verifyRole(['Teacher']), homeworkController.createHomework);

// GET /api/homework/:homeworkId — Lấy chi tiết 1 bài tập (cần đặt SAU /classes/:classId)
router.get('/:homeworkId', verifyToken, homeworkController.getHomeworkById);

// PUT /api/homework/:homeworkId — Sửa bài tập (chỉ Teacher)
router.put('/:homeworkId', verifyToken, verifyRole(['Teacher']), homeworkController.updateHomework);

// POST /api/homework/:homeworkId/submit — Nộp bài (chỉ Student)
router.post('/:homeworkId/submit', verifyToken, verifyRole(['Student']), homeworkController.submitHomework);

// PUT /api/homework/:homeworkId/grade/:submissionId — Chấm điểm (chỉ Teacher)
router.put('/:homeworkId/grade/:submissionId', verifyToken, verifyRole(['Teacher']), homeworkController.gradeSubmission);

module.exports = router;
