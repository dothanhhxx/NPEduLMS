const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendanceController');
const authMiddleware = require('../middleware/authMiddleware');

// Get attendance for a class session on a specific date (Teacher / Admin)
router.get('/class/:classId', authMiddleware.verifyToken, attendanceController.getAttendanceByDate);

// Save or Update Attendance (Teacher / Admin)
router.post('/', authMiddleware.verifyToken, attendanceController.saveAttendance);

// Get student's personal attendance history (Student)
router.get('/student', authMiddleware.verifyToken, authMiddleware.isStudent, attendanceController.getStudentAttendance);

module.exports = router;
