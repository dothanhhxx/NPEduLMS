const express = require('express');
const router = express.Router();
const progressController = require('../controllers/progressController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

// GET /api/progress/me — Tiến độ học tập của học sinh đang đăng nhập
router.get('/me', verifyRole(['Student', 5]), progressController.getMyProgress);

module.exports = router;
