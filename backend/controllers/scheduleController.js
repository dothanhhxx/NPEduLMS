const db = require('../config/db');

// Lấy thời khóa biểu (Dựa trên Role của người gọi)
exports.getSchedules = async (req, res) => {
    try {
        const userId = req.user.userId;
        const role = req.user.role || req.user.roleId; // 'Admin', 'Teacher', 'Student' or roleId

        let query = '';
        let params = [];

        if (role === 'Admin' || role === 1 || role === 2 || role === 3) {
            // Admin xem được tất cả lịch
            query = `
                SELECT cs.id AS session_id, c.class_name, b.branch_name, 
                       cs.session_date, cs.start_time, cs.end_time,
                       cs.room, cs.status AS session_status, cs.session_type,
                       u.full_name AS teacher_name
                FROM class_sessions cs
                JOIN classes c ON cs.class_id = c.id
                JOIN branches b ON c.branch_id = b.id
                JOIN teachers t ON c.teacher_id = t.id
                JOIN users u ON t.user_id = u.id
                ORDER BY cs.session_date DESC, cs.start_time ASC
            `;
        } else if (role === 'Teacher' || role === 4 || req.user.roleId === 4) {
            // Teacher chỉ xem lịch các lớp mình được phân công
            query = `
                SELECT cs.id AS session_id, c.class_name, b.branch_name, 
                       cs.session_date, cs.start_time, cs.end_time,
                       cs.room, cs.status AS session_status, cs.session_type,
                       u.full_name AS teacher_name
                FROM class_sessions cs
                JOIN classes c ON cs.class_id = c.id
                JOIN branches b ON c.branch_id = b.id
                JOIN teachers t ON c.teacher_id = t.id
                JOIN users u ON t.user_id = u.id
                WHERE t.user_id = ?
                ORDER BY cs.session_date DESC, cs.start_time ASC
            `;
            params = [userId];
        } else if (role === 'Student' || role === 5) {
            // Student chỉ xem lịch các lớp mình đã đóng tiền ghi danh (enrollments)
            query = `
                SELECT cs.id AS session_id, c.class_name, b.branch_name, 
                       cs.session_date, cs.start_time, cs.end_time,
                       cs.room, cs.status AS session_status, cs.session_type,
                       u.full_name AS teacher_name
                FROM class_sessions cs
                JOIN classes c ON cs.class_id = c.id
                JOIN branches b ON c.branch_id = b.id
                JOIN teachers t ON c.teacher_id = t.id
                JOIN users u ON t.user_id = u.id
                JOIN enrollments e ON c.id = e.class_id
                JOIN students s ON e.student_id = s.id
                WHERE s.user_id = ?
                ORDER BY cs.session_date DESC, cs.start_time ASC
            `;
            params = [userId];
        }

        const [schedules] = await db.query(query, params);
        res.status(200).json({ status: 'Success', data: schedules });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'Error', message: 'Lỗi lấy thời khóa biểu' });
    }
};

// Admin tạo buổi học mới
exports.createSession = async (req, res) => {
    try {
        const { class_id, session_date, start_time, end_time, room, session_type } = req.body;
        if (!class_id || !session_date || !start_time || !end_time) {
            return res.status(400).json({ status: 'Error', message: 'Thiếu thông tin buổi học' });
        }

        const [result] = await db.query(
            'INSERT INTO class_sessions (class_id, session_date, start_time, end_time, room, session_type) VALUES (?, ?, ?, ?, ?, ?)',
            [class_id, session_date, start_time, end_time, room || 'Phòng học 1', session_type || 'Theory']
        );
        res.status(201).json({ status: 'Success', message: 'Đã thêm buổi học vào TKB', data: { sessionId: result.insertId } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'Error', message: 'Lỗi tạo lịch học' });
    }
};

// Admin cập nhật buổi học
exports.updateSession = async (req, res) => {
    try {
        const { session_date, start_time, end_time, room, status, session_type } = req.body;
        await db.query(
            'UPDATE class_sessions SET session_date=?, start_time=?, end_time=?, room=?, status=?, session_type=? WHERE id=?',
            [session_date, start_time, end_time, room, status, session_type || 'Theory', req.params.id]
        );
        res.status(200).json({ status: 'Success', message: 'Cập nhật buổi học thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'Error', message: 'Lỗi cập nhật buổi học' });
    }
};

// Admin xóa buổi học
exports.deleteSession = async (req, res) => {
    try {
        await db.query('DELETE FROM class_sessions WHERE id = ?', [req.params.id]);
        res.status(200).json({ status: 'Success', message: 'Xóa buổi học thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'Error', message: 'Lỗi xóa buổi học' });
    }
};
