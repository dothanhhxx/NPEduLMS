const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const ADMIN_ROLE = 'Admin';
const TEACHER_ROLE = 'Teacher';
const STUDENT_ROLE = 'Student';

const isExternalUrl = (value = '') => /^https?:\/\//i.test(value);

const normalizeStoredPath = (value = '') => value.replace(/\\/g, '/').replace(/^\/+/, '');

const getAbsoluteFilePath = (fileUrl) => path.resolve(__dirname, '..', normalizeStoredPath(fileUrl));

const getFileExtension = (value = '') => path.extname(value).toLowerCase();

const getFileType = (material) => {
    const extension = getFileExtension(material.file_url || material.title || '');

    if (['.pdf'].includes(extension)) return 'pdf';
    if (['.doc', '.docx'].includes(extension)) return 'word';
    if (['.ppt', '.pptx'].includes(extension)) return 'presentation';
    if (['.xls', '.xlsx', '.csv'].includes(extension)) return 'spreadsheet';
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(extension)) return 'image';
    if (['.mp4', '.mov', '.avi'].includes(extension)) return 'video';
    if (['.mp3', '.wav'].includes(extension)) return 'audio';
    return 'file';
};

const formatMaterial = (material) => ({
    ...material,
    file_type: getFileType(material),
    is_external: isExternalUrl(material.file_url),
    view_url: `/api/materials/${material.id}/view`,
    download_url: `/api/materials/${material.id}/download`
});

const deleteUploadedFile = (filePath) => {
    if (filePath && fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
    }
};

const getClassById = async (classId) => {
    const [classes] = await db.query('SELECT id, teacher_id FROM classes WHERE id = ?', [classId]);
    return classes[0] || null;
};

const canAccessClass = async (user, classId) => {
    const foundClass = await getClassById(classId);

    if (!foundClass) {
        return { exists: false, allowed: false };
    }

    if (user.role === ADMIN_ROLE) {
        return { exists: true, allowed: true };
    }

    if (user.role === TEACHER_ROLE) {
        const [rows] = await db.query(
            `SELECT 1
             FROM classes c
             JOIN teachers t ON c.teacher_id = t.id
             WHERE c.id = ? AND t.user_id = ?`,
            [classId, user.userId]
        );

        return { exists: true, allowed: rows.length > 0 };
    }

    if (user.role === STUDENT_ROLE) {
        const [rows] = await db.query(
            `SELECT 1
             FROM enrollments e
             JOIN students s ON e.student_id = s.id
             WHERE e.class_id = ? AND s.user_id = ?`,
            [classId, user.userId]
        );

        return { exists: true, allowed: rows.length > 0 };
    }

    return { exists: true, allowed: false };
};

const ensureClassAccess = async (user, classId) => {
    const access = await canAccessClass(user, classId);

    if (!access.exists) {
        const error = new Error('Không tìm thấy lớp học');
        error.statusCode = 404;
        throw error;
    }

    if (!access.allowed) {
        const error = new Error('Bạn không có quyền truy cập tài liệu của lớp này');
        error.statusCode = 403;
        throw error;
    }
};

const getMaterialById = async (materialId) => {
    const [materials] = await db.query('SELECT * FROM materials WHERE id = ?', [materialId]);
    return materials[0] || null;
};

const getDownloadName = (material) => {
    const titleExtension = getFileExtension(material.title);
    const fileExtension = getFileExtension(material.file_url);

    if (titleExtension) {
        return material.title;
    }

    return `${material.title}${fileExtension}`;
};

const handleMaterialError = (res, error, fallbackMessage) => {
    console.error(error);

    return res.status(error.statusCode || 500).json({
        status: 'Error',
        message: error.message || fallbackMessage
    });
};

exports.createMaterial = async (req, res) => {
    try {
        const classId = Number(req.body.class_id || req.body.classId);
        const title = (req.body.title || req.file?.originalname || '').trim();
        const externalFileUrl = (req.body.file_url || '').trim();

        if (!classId || !title) {
            if (req.file) {
                deleteUploadedFile(req.file.path);
            }

            return res.status(400).json({
                status: 'Error',
                message: 'Vui lòng cung cấp class_id và title'
            });
        }

        if (!req.file && !externalFileUrl) {
            return res.status(400).json({
                status: 'Error',
                message: 'Vui lòng tải file lên hoặc cung cấp file_url'
            });
        }

        await ensureClassAccess(req.user, classId);

        const fileUrl = req.file ? `uploads/${req.file.filename}` : externalFileUrl;

        const [result] = await db.query(
            `INSERT INTO materials (class_id, title, file_url, uploaded_at)
             VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
            [classId, title, fileUrl]
        );

        const material = await getMaterialById(result.insertId);

        return res.status(201).json({
            status: 'Success',
            message: 'Tải tài liệu lên thành công',
            data: formatMaterial(material)
        });
    } catch (error) {
        if (req.file) {
            deleteUploadedFile(req.file.path);
        }

        return handleMaterialError(res, error, 'Lỗi tải lên tài liệu');
    }
};

exports.uploadMaterial = exports.createMaterial;

exports.getClassMaterials = async (req, res) => {
    try {
        const classId = Number(req.params.classId || req.params.id);

        if (!classId) {
            return res.status(400).json({
                status: 'Error',
                message: 'classId không hợp lệ'
            });
        }

        await ensureClassAccess(req.user, classId);

        const [materials] = await db.query(
            `SELECT id, class_id, title, file_url, uploaded_at
             FROM materials
             WHERE class_id = ?
             ORDER BY uploaded_at DESC, id DESC`,
            [classId]
        );

        return res.status(200).json({
            status: 'Success',
            data: materials.map(formatMaterial)
        });
    } catch (error) {
        return handleMaterialError(res, error, 'Lỗi lấy danh sách tài liệu');
    }
};

exports.viewMaterial = async (req, res) => {
    try {
        const materialId = Number(req.params.materialId);
        const material = await getMaterialById(materialId);

        if (!material) {
            return res.status(404).json({
                status: 'Error',
                message: 'Không tìm thấy tài liệu'
            });
        }

        await ensureClassAccess(req.user, material.class_id);

        if (isExternalUrl(material.file_url)) {
            return res.redirect(material.file_url);
        }

        const absolutePath = getAbsoluteFilePath(material.file_url);

        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({
                status: 'Error',
                message: 'Không tìm thấy file trên server'
            });
        }

        return res.sendFile(absolutePath);
    } catch (error) {
        return handleMaterialError(res, error, 'Lỗi xem tài liệu');
    }
};

exports.downloadMaterial = async (req, res) => {
    try {
        const materialId = Number(req.params.materialId);
        const material = await getMaterialById(materialId);

        if (!material) {
            return res.status(404).json({
                status: 'Error',
                message: 'Không tìm thấy tài liệu'
            });
        }

        await ensureClassAccess(req.user, material.class_id);

        if (isExternalUrl(material.file_url)) {
            return res.redirect(material.file_url);
        }

        const absolutePath = getAbsoluteFilePath(material.file_url);

        if (!fs.existsSync(absolutePath)) {
            return res.status(404).json({
                status: 'Error',
                message: 'Không tìm thấy file trên server'
            });
        }

        return res.download(absolutePath, getDownloadName(material));
    } catch (error) {
        return handleMaterialError(res, error, 'Lỗi tải tài liệu');
    }
};
