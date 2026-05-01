const express = require('express');
const materialController = require('../controllers/materialController');
const upload = require('../config/multer');
const { verifyToken, verifyRole } = require('../middleware/authMiddleware');

const router = express.Router();

const handleUpload = (req, res, next) => {
    upload.single('file')(req, res, (error) => {
        if (error) {
            return res.status(400).json({
                status: 'Error',
                message: error.message
            });
        }

        return next();
    });
};

router.use(verifyToken);

router.get('/classes/:classId', materialController.getClassMaterials);
router.get('/view/:materialId', materialController.viewMaterial);
router.get('/download/:materialId', materialController.downloadMaterial);
router.get('/:materialId/view', materialController.viewMaterial);
router.get('/:materialId/download', materialController.downloadMaterial);

router.post('/', verifyRole(['Admin', 'Teacher']), handleUpload, materialController.createMaterial);
router.post('/upload', verifyRole(['Admin', 'Teacher']), handleUpload, materialController.createMaterial);

module.exports = router;
