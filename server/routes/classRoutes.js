import express from 'express';
import Class from '../models/Class.js';
import Student from '../models/Student.js';
const router = express.Router();

// GET all classes
// server/routes/classRoutes.js
router.get('/', async (req, res) => {
    try {
        console.log("--- Đang lấy danh sách lớp kèm học sinh ---");
        const classes = await Class.findAll({
            include: [{
                model: Student,
                as: 'students', 
                attributes: ['id'],
                through: { attributes: [] } 
            }]
        });

        const formatted = classes.map(cls => {
            const item = cls.get({ plain: true });
            // Ép buộc phải có mảng này gửi về Frontend
            return {
                ...item,
                enrolled_student_ids: item.students ? item.students.map(s => s.id) : []
            };
        });

        res.json({ status: 'Success', data: formatted });
    } catch (err) {
        console.error("Lỗi Backend:", err.message);
        res.status(500).json({ message: err.message });
    }
});
// POST new class
// POST: Ghi danh học viên vào lớp (Fix lỗi 400)
router.post('/:id/enroll', async (req, res) => {
    try {
        const classId = req.params.id;
        const { student_ids } = req.body;

        const targetClass = await Class.findByPk(classId);
        if (!targetClass) return res.status(404).json({ message: 'Không tìm thấy lớp học' });

        // Logic Sequelize để thêm quan hệ vào bảng Enrollments
        await targetClass.addStudents(student_ids);

        res.json({ status: 'Success', message: 'Ghi danh thành công!' });
    } catch (err) {
        res.status(400).json({ message: 'Dữ liệu không hợp lệ: ' + err.message });
    }
});

export default router;

// POST: Xử lý ghi danh học viên vào lớp
router.post('/:id/enroll', async (req, res) => {
    try {
        const { student_ids } = req.body;
        const targetClass = await Class.findByPk(req.params.id);
        
        if (!targetClass) return res.status(404).json({ message: 'Không tìm thấy lớp!' });

        // Dùng phương thức addStudents của Sequelize (yêu cầu đã khai báo Association)
        await targetClass.addStudents(student_ids);

        res.json({ status: 'Success', message: 'Ghi danh thành công!' });
    } catch (err) {
        res.status(400).json({ message: 'Lỗi: ' + err.message });
    }
});
