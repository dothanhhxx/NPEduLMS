const db = require('../config/db');
const path = require('path');

// Detect file type from extension
const detectType = (filename = '') => {
    const ext = path.extname(filename).toLowerCase().replace('.', '');
    if (['mp4', 'avi', 'mkv', 'mov', 'webm'].includes(ext)) return 'Video';
    if (['ppt', 'pptx'].includes(ext)) return 'Slide';
    if (['doc', 'docx'].includes(ext)) return 'Word';
    return 'PDF';
};

const checkClassPermission = async (req, classId) => {
    if (req.user.role === 'Admin') return true;

    if (req.user.role === 'Teacher') {
        const [classes] = await db.query(
            `SELECT c.id FROM classes c 
             JOIN teachers t ON c.teacher_id = t.id 
             WHERE c.id = ? AND t.user_id = ?`,
            [classId, req.user.userId]
        );
        return classes.length > 0;
    }

    if (req.user.role === 'Student') {
        const [enrollments] = await db.query(
            `SELECT e.id FROM enrollments e 
             JOIN students s ON e.student_id = s.id 
             WHERE e.class_id = ? AND s.user_id = ?`,
            [classId, req.user.userId]
        );
        return enrollments.length > 0;
    }

    return false;
};

// Get all materials (no class filter)
exports.getAllMaterials = async (req, res) => {
    try {
        const role = req.user.role;
        const userId = req.user.userId;
        let query = 'SELECT m.* FROM learning_materials m';
        let params = [];

        if (role === 'Teacher') {
            query += `
                JOIN classes c ON m.class_id = c.id
                JOIN teachers t ON c.teacher_id = t.id
                WHERE t.user_id = ?
            `;
            params.push(userId);
        } else if (role === 'Student') {
            query += `
                JOIN enrollments e ON m.class_id = e.class_id
                JOIN students s ON e.student_id = s.id
                WHERE s.user_id = ?
            `;
            params.push(userId);
        }
        
        query += ' ORDER BY m.created_at DESC';

        const [materials] = await db.query(query, params);
        res.status(200).json(materials);
    } catch (error) {
        console.error('Error fetching all materials:', error);
        res.status(500).json({ message: 'Internal server error while fetching materials.' });
    }
};

exports.getMaterialsByClass = async (req, res) => {
    try {
        const { classId } = req.params;

        if (!classId) {
            return res.status(400).json({ message: 'Class ID is required' });
        }

        const hasAccess = await checkClassPermission(req, classId);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Bạn không có quyền truy cập tài liệu của lớp học này.' });
        }

        const [materials] = await db.query(
            'SELECT * FROM learning_materials WHERE class_id = ? ORDER BY created_at DESC',
            [classId]
        );

        if (materials.length === 0) {
            return res.status(404).json({ message: 'No learning material available.' });
        }

        res.status(200).json(materials);
    } catch (error) {
        console.error('Error fetching materials:', error);
        res.status(500).json({ message: 'Internal server error while fetching materials.' });
    }
};

exports.createMaterial = async (req, res) => {
    try {
        const { classId } = req.params;
        
        const hasAccess = await checkClassPermission(req, classId);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Bạn không có quyền thêm tài liệu cho lớp học này.' });
        }

        const { name, description } = req.body;
        let url = req.body.url || '';
        let type = 'PDF';

        if (req.file) {
            url = `http://localhost:5000/uploads/${req.file.filename}`;
            type = detectType(req.file.originalname);

            if (type === 'Slide' || type === 'Word') {
                const inputPath = path.join(__dirname, '../uploads', req.file.filename);
                const pdfFilename = req.file.filename + '.pdf';
                const outputPath = path.join(__dirname, '../uploads', pdfFilename);
                const { convertToPdf } = require('../utils/convertPPT');
                const success = await convertToPdf(inputPath, outputPath);
                if (!success) {
                    return res.status(400).json({ message: 'Lỗi Server: Chưa cài đặt LibreOffice trên máy chạy Backend để chuyển đổi Word/PPT sang PDF.' });
                }
            }
        }

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Vui lòng nhập tên tài liệu.' });
        }
        if (name.trim().length > 200) {
            return res.status(400).json({ message: 'Tên tài liệu không được vượt quá 200 kí tự!' });
        }
        if (!url) {
            return res.status(400).json({ message: 'Vui lòng chọn tệp tải lên.' });
        }

        const [existingNameCheck] = await db.query('SELECT id FROM learning_materials WHERE class_id = ? AND name = ?', [classId, name.trim()]);
        if (existingNameCheck.length > 0) {
            return res.status(400).json({ message: 'Tên tài liệu đã tồn tại trong lớp học này. Vui lòng chọn tên khác.' });
        }

        const [result] = await db.query(
            'INSERT INTO learning_materials (class_id, name, type, url, description) VALUES (?, ?, ?, ?, ?)',
            [classId, name.trim(), type, url, description || '']
        );

        res.status(201).json({ message: 'Material created successfully', id: result.insertId });
    } catch (error) {
        console.error('Error creating material:', error);
        res.status(500).json({ message: 'Internal server error while creating material.' });
    }
};

exports.updateMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, description } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Vui lòng nhập tên tài liệu.' });
        }
        if (name.trim().length > 200) {
            return res.status(400).json({ message: 'Tên tài liệu không được vượt quá 200 kí tự!' });
        }

        // Fetch existing material to preserve type/url if no new file
        const [existing] = await db.query('SELECT * FROM learning_materials WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Material not found.' });
        }

        const classId = existing[0].class_id;
        
        const hasAccess = await checkClassPermission(req, classId);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Bạn không có quyền sửa tài liệu của lớp học này.' });
        }
        const [existingNameCheck] = await db.query('SELECT id FROM learning_materials WHERE class_id = ? AND name = ? AND id != ?', [classId, name.trim(), id]);
        if (existingNameCheck.length > 0) {
            return res.status(400).json({ message: 'Tên tài liệu đã tồn tại trong lớp học này. Vui lòng chọn tên khác.' });
        }

        let url = existing[0].url;
        let type = existing[0].type;

        // If new file uploaded, use it
        if (req.file) {
            url = `http://localhost:5000/uploads/${req.file.filename}`;
            type = detectType(req.file.originalname);

            if (type === 'Slide' || type === 'Word') {
                const inputPath = path.join(__dirname, '../uploads', req.file.filename);
                const pdfFilename = req.file.filename + '.pdf';
                const outputPath = path.join(__dirname, '../uploads', pdfFilename);
                const { convertToPdf } = require('../utils/convertPPT');
                const success = await convertToPdf(inputPath, outputPath);
                if (!success) {
                    return res.status(400).json({ message: 'Lỗi Server: Chưa cài đặt LibreOffice trên máy chạy Backend để chuyển đổi Word/PPT sang PDF.' });
                }
            }
        }

        const [result] = await db.query(
            'UPDATE learning_materials SET name = ?, description = ?, type = ?, url = ? WHERE id = ?',
            [name.trim(), description || '', type, url, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Material not found.' });
        }

        res.status(200).json({ message: 'Material updated successfully' });
    } catch (error) {
        console.error('Error updating material:', error);
        res.status(500).json({ message: 'Internal server error while updating material.' });
    }
};

exports.deleteMaterial = async (req, res) => {
    try {
        const { id } = req.params;

        const [existing] = await db.query('SELECT class_id FROM learning_materials WHERE id = ?', [id]);
        if (existing.length === 0) {
            return res.status(404).json({ message: 'Material not found.' });
        }

        const classId = existing[0].class_id;
        const hasAccess = await checkClassPermission(req, classId);
        if (!hasAccess) {
            return res.status(403).json({ message: 'Bạn không có quyền xóa tài liệu của lớp học này.' });
        }

        const [result] = await db.query('DELETE FROM learning_materials WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Material not found.' });
        }

        res.status(200).json({ message: 'Material deleted successfully' });
    } catch (error) {
        console.error('Error deleting material:', error);
        res.status(500).json({ message: 'Internal server error while deleting material.' });
    }
};
