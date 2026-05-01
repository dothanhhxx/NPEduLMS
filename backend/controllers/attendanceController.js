const db = require('../config/db');

// Lấy thông tin điểm danh của 1 lớp trong 1 ngày cụ thể
exports.getAttendanceByDate = async (req, res) => {
    try {
        const { classId } = req.params;
        const { date } = req.query; // YYYY-MM-DD

        if (!classId || !date) {
            return res.status(400).json({ status: 'Error', message: 'Thiếu classId hoặc date' });
        }

        // 1. Tìm class_session tương ứng
        const [sessions] = await db.query(
            'SELECT id FROM class_sessions WHERE class_id = ? AND session_date = ?',
            [classId, date]
        );

        if (sessions.length === 0) {
            return res.status(404).json({ status: 'NotFound', message: 'Không có lịch học cho lớp này vào ngày đã chọn' });
        }

        const sessionId = sessions[0].id;

        // 2. Lấy dữ liệu điểm danh đã lưu cho session này
        const [attendanceRecords] = await db.query(
            'SELECT student_id, status, note FROM attendance WHERE session_id = ?',
            [sessionId]
        );

        res.status(200).json({
            status: 'Success',
            data: {
                sessionId,
                records: attendanceRecords
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'Error', message: 'Lỗi lấy dữ liệu điểm danh' });
    }
};

// Cập nhật điểm danh (Upsert)
exports.saveAttendance = async (req, res) => {
    try {
        const { sessionId, records } = req.body;
        // records: [{ student_id: 1, status: 'Present', note: '...' }, ...]

        if (!sessionId || !Array.isArray(records)) {
            return res.status(400).json({ status: 'Error', message: 'Dữ liệu không hợp lệ' });
        }

        // Với mỗi record, upsert vào db
        for (const record of records) {
            const { student_id, status, note } = record;
            
            // Map FE status to DB enum: 'present' -> 'Present', 'absent' -> 'Absent', 'late' -> 'Late'
            const dbStatus = status.charAt(0).toUpperCase() + status.slice(1);
            
            await db.query(`
                INSERT INTO attendance (session_id, student_id, status, note)
                VALUES (?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE status = VALUES(status), note = VALUES(note), marked_at = CURRENT_TIMESTAMP
            `, [sessionId, student_id, dbStatus, note || null]);
        }

        // Cập nhật trạng thái buổi học thành Completed nếu cần thiết
        await db.query(`UPDATE class_sessions SET status = 'Completed' WHERE id = ?`, [sessionId]);

        res.status(200).json({ status: 'Success', message: 'Lưu điểm danh thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'Error', message: 'Lỗi lưu điểm danh' });
    }
};

// Sinh viên xem bảng điểm danh của mình
exports.getStudentAttendance = async (req, res) => {
    try {
        // req.user được gán từ middleware xác thực
        const studentUserId = req.user.userId;

        // Lấy student_id từ user_id
        const [students] = await db.query('SELECT id FROM students WHERE user_id = ?', [studentUserId]);
        if (students.length === 0) {
            return res.status(404).json({ status: 'Error', message: 'Không tìm thấy thông tin học viên' });
        }
        const studentId = students[0].id;

        // Lấy lịch sử 
        const query = `
            SELECT 
                a.id AS attendance_id,
                a.status,
                a.note,
                a.marked_at,
                cs.session_date,
                cs.start_time,
                cs.end_time,
                c.class_name,
                c.id AS class_id
            FROM attendance a
            JOIN class_sessions cs ON a.session_id = cs.id
            JOIN classes c ON cs.class_id = c.id
            WHERE a.student_id = ?
            ORDER BY cs.session_date DESC, cs.start_time DESC
        `;

        const [history] = await db.query(query, [studentId]);
        
        res.status(200).json({ status: 'Success', data: history });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'Error', message: 'Lỗi lấy lịch sử điểm danh' });
    }
};
