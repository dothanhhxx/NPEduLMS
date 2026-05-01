const express = require('express');
const router = express.Router();
const learningMaterialController = require('../controllers/learningMaterialController');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');
const upload = require('../config/multer');

// Lấy tất cả tài liệu (không lọc lớp)
router.get('/', verifyToken, learningMaterialController.getAllMaterials);

// Lấy tài liệu theo class_id
router.get('/class/:classId', verifyToken, learningMaterialController.getMaterialsByClass);

// CRUD dành cho Admin và Teacher
router.post('/class/:classId', verifyToken, verifyRole(['Admin', 'Teacher']), upload.single('file'), learningMaterialController.createMaterial);
router.put('/:id', verifyToken, verifyRole(['Admin', 'Teacher']), upload.single('file'), learningMaterialController.updateMaterial);
router.delete('/:id', verifyToken, verifyRole(['Admin', 'Teacher']), learningMaterialController.deleteMaterial);

module.exports = router;
