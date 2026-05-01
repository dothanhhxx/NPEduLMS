const db = require('../config/db');

// Lấy danh sách tất cả lớp học (Kèm số học sinh đã ghi danh)
exports.getAllClasses = async (req, res) => {
    try {
        const userId = req.user.userId;
        const role = req.user.role || req.user.roleId; // Nguyệt tiêm: Chấp nhận cả roleId bằng số
        let query = '';
        let params = [];

        if (role === 'Student' || role === 5) { // 5 là ID học sinh của Nguyệt
            query = `
                SELECT c.id, c.class_code, c.class_name, c.status, c.max_students, c.start_date, c.session_time, c.created_at, 
                       c.branch_id, c.teacher_id, c.course_id,
                       b.branch_name, u.full_name AS teacher_name, co.course_name,
                       (SELECT COUNT(*) FROM enrollments e2 WHERE e2.class_id = c.id) AS student_count
                FROM classes c
                JOIN branches b ON c.branch_id = b.id
                JOIN teachers t ON c.teacher_id = t.id
                JOIN users u ON t.user_id = u.id
                LEFT JOIN courses co ON c.course_id = co.id
                JOIN enrollments e ON c.id = e.class_id
                JOIN students s ON e.student_id = s.id
                WHERE s.user_id = ?
            `;
            params = [userId];
        } else if (role === 'Teacher' || role === 4) { // 4 là ID giáo viên của Nguyệt
            query = `
                SELECT c.id, c.class_code, c.class_name, c.status, c.max_students, c.start_date, c.session_time, c.created_at, 
                       c.branch_id, c.teacher_id, c.course_id,
                       b.branch_name, u.full_name AS teacher_name, co.course_name,
                       (SELECT COUNT(*) FROM enrollments e2 WHERE e2.class_id = c.id) AS student_count
                FROM classes c
                JOIN branches b ON c.branch_id = b.id
                JOIN teachers t ON c.teacher_id = t.id
                JOIN users u ON t.user_id = u.id
                LEFT JOIN courses co ON c.course_id = co.id
                WHERE t.user_id = ?
            `;
            params = [userId];
        } else {
            // Admin: xem tất cả
            query = `
                SELECT c.id, c.class_code, c.class_name, c.status, c.max_students, c.start_date, c.session_time, c.created_at, 
                       c.branch_id, c.teacher_id, c.course_id,
                       b.branch_name, u.full_name AS teacher_name, co.course_name,
                       (SELECT COUNT(*) FROM enrollments e2 WHERE e2.class_id = c.id) AS student_count
                FROM classes c
                JOIN branches b ON c.branch_id = b.id
                JOIN teachers t ON c.teacher_id = t.id
                JOIN users u ON t.user_id = u.id
                LEFT JOIN courses co ON c.course_id = co.id
            `;
        }

        const [classes] = await db.query(query, params);

        if (classes.length > 0) {
            const classIds = classes.map(c => c.id);
            const [enrollments] = await db.query('SELECT class_id, student_id FROM enrollments WHERE class_id IN (?)', [classIds]);
            
            const enrollmentsByClass = {};
            enrollments.forEach(e => {
                if (!enrollmentsByClass[e.class_id]) {
                    enrollmentsByClass[e.class_id] = [];
                }
                enrollmentsByClass[e.class_id].push(e.student_id);
            });
            
            classes.forEach(c => {
                c.enrolled_student_ids = enrollmentsByClass[c.id] || [];
            });
        }

        res.status(200).json({ status: 'Success', data: classes });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'Error', message: 'Lỗi lấy danh sách lớp' });
    }
};

// --- NGUYỆT TIÊM: GHI DANH HỌC VIÊN (Chống trùng & Transaction) ---
exports.enrollStudent = async (req, res) => {
    const connection = await db.getConnection(); 
    try {
        const classId = req.params.id;
        const { student_ids } = req.body; 

        if (!student_ids || !Array.isArray(student_ids) || student_ids.length === 0) {
            return res.status(400).json({ status: 'Error', message: 'Vui lòng chọn ít nhất một học viên.' });
        }

        await connection.beginTransaction(); 
        const enrollDate = new Date();
        let addedCount = 0;
        let duplicateCount = 0;

        for (const studentId of student_ids) {
            const numericStudentId = Number(studentId); 
            const [existing] = await connection.query(
                'SELECT id FROM enrollments WHERE student_id = ? AND class_id = ?', 
                [numericStudentId, classId]
            );
            
            if (existing.length > 0) {
                duplicateCount++;
                continue; 
            }

            await connection.query(
                'INSERT INTO enrollments (student_id, class_id, enroll_date) VALUES (?, ?, ?)',
                [numericStudentId, classId, enrollDate]
            );
            addedCount++;
        }

        if (addedCount === 0 && duplicateCount > 0) {
            await connection.rollback();
            return res.status(400).json({ 
                status: 'Error', 
                message: student_ids.length === 1 
                    ? 'Học viên này đã có trong danh sách lớp rồi!' 
                    : 'Tất cả học viên được chọn đều đã có trong lớp.' 
            });
        }

        await connection.commit(); 
        let finalMessage = `Đã thêm thành công ${addedCount} học viên.`;
        if (duplicateCount > 0) finalMessage += ` (Bỏ qua ${duplicateCount} bạn đã trùng)`;
        res.status(201).json({ status: 'Success', message: finalMessage }); 

    } catch (error) {
        if (connection) await connection.rollback();
        console.error("Lỗi API Ghi danh của Nguyệt:", error);
        res.status(500).json({ status: 'Error', message: 'Lỗi hệ thống khi ghi danh.' });
    } finally {
        if (connection) connection.release(); 
    }
};

// Lấy 1 lớp theo ID
exports.getClassById = async (req, res) => {
    try {
        const [result] = await db.query(`
            SELECT c.*, b.branch_name, u.full_name AS teacher_name, co.course_name,
                   (SELECT COUNT(*) FROM enrollments e WHERE e.class_id = c.id) AS student_count
            FROM classes c
            JOIN branches b ON c.branch_id = b.id
            JOIN teachers t ON c.teacher_id = t.id
            JOIN users u ON t.user_id = u.id
            LEFT JOIN courses co ON c.course_id = co.id
            WHERE c.id = ?
        `, [req.params.id]);
        if (result.length === 0) return res.status(404).json({ status: 'Error', message: 'Không tìm thấy lớp' });
        res.status(200).json({ status: 'Success', data: result[0] });
    } catch (error) {
        res.status(500).json({ status: 'Error', message: 'Lỗi lấy chi tiết lớp' });
    }
};

// Tạo lớp học mới (Chỉ Admin)
exports.createClass = async (req, res) => {
    try {
        const { class_code, class_name, course_id, branch_id, teacher_id, start_date, session_time, status, max_students } = req.body;
        
        // Validation cơ bản
        if (!class_code || !class_name || !course_id || !branch_id || !teacher_id || !start_date || !session_time) {
            return res.status(400).json({ status: 'Error', message: 'Vui lòng điền đầy đủ các trường bắt buộc' });
        }

        // Validation chuyên sâu
        const codeRegex = /^[A-Z0-9]{3,20}$/;
        if (!codeRegex.test(class_code)) {
            return res.status(400).json({ status: 'Error', message: 'Mã lớp không hợp lệ (3-20 ký tự in hoa/số)' });
        }
        
        // Trim và Validate tên lớp
        const trimmedClassName = class_name.trim();
        if (trimmedClassName.length < 5 || trimmedClassName.length > 100) {
            return res.status(400).json({ status: 'Error', message: 'Tên lớp phải từ 5 đến 100 ký tự' });
        }
        const nameRegex = /^[\p{L}\p{N}\s\-_+&()]+$/u;
        if (!nameRegex.test(trimmedClassName)) {
            return res.status(400).json({ status: 'Error', message: 'Tên lớp không hợp lệ (chỉ chứa chữ, số, khoảng trắng và ký tự -_+&())' });
        }

        const maxSt = parseInt(max_students, 10) || 25;
        if (maxSt < 1 || maxSt > 30) {
            return res.status(400).json({ status: 'Error', message: 'Sĩ số tối đa từ 1 đến 30' });
        }

        // Ngày bắt đầu: trong vòng 30 ngày qua và không quá 2 năm tới
        const startDateObj = new Date(start_date);
        const todayObj = new Date();
        const pastLimit = new Date();
        pastLimit.setDate(todayObj.getDate() - 30);
        const futureLimit = new Date();
        futureLimit.setFullYear(todayObj.getFullYear() + 2);
        
        if (startDateObj < pastLimit) {
            return res.status(400).json({ status: 'Error', message: 'Ngày bắt đầu không được quá 30 ngày trong quá khứ' });
        }
        if (startDateObj > futureLimit) {
            return res.status(400).json({ status: 'Error', message: 'Ngày bắt đầu không được vượt quá 2 năm trong tương lai' });
        }

        // Kiểm tra trùng Mã lớp
        const [existingCode] = await db.query('SELECT id FROM classes WHERE class_code = ?', [class_code]);
        if (existingCode.length > 0) {
            return res.status(400).json({ status: 'Error', message: 'Mã lớp đã tồn tại trong hệ thống' });
        }

        // Kiểm tra xung đột lịch giáo viên (Cùng ca học, lớp chưa đóng)
        const [conflict] = await db.query(
            "SELECT id FROM classes WHERE teacher_id = ? AND session_time = ? AND status != 'closed'",
            [teacher_id, session_time]
        );
        if (conflict.length > 0) {
            return res.status(400).json({ status: 'Error', message: 'Giáo viên đã có lịch dạy vào ca này' });
        }

        const [result] = await db.query(
            'INSERT INTO classes (class_code, class_name, course_id, branch_id, teacher_id, start_date, session_time, status, max_students) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [class_code, trimmedClassName, course_id, branch_id, teacher_id, start_date, session_time, status || 'active', maxSt]
        );

        // DF003: Tự động khởi tạo schedule 12 tuần liên tiếp cho lớp mới
        const newClassId = result.insertId;
        const timeMatch = session_time.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
        let start_time = '08:00:00';
        let end_time = '10:00:00';
        if (timeMatch) {
            start_time = timeMatch[1] + ':00';
            end_time = timeMatch[2] + ':00';
        }
        
        for (let i = 0; i < 12; i++) {
            const d = new Date(start_date);
            d.setDate(d.getDate() + (i * 7));
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const dateStr = `${yyyy}-${mm}-${dd}`;
            await db.query(
                'INSERT INTO class_sessions (class_id, session_date, start_time, end_time, room, session_type) VALUES (?, ?, ?, ?, ?, ?)',
                [newClassId, dateStr, start_time, end_time, 'Phòng học 1', 'Theory']
            );
        }

        res.status(201).json({ status: 'Success', message: 'Tạo lớp thành công', data: { classId: newClassId } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'Error', message: 'Lỗi tạo lớp học' });
    }
};

exports.updateClass = async (req, res) => {
    try {
        const { class_code, class_name, course_id, branch_id, teacher_id, start_date, session_time, status, max_students } = req.body;
        const classId = req.params.id;

        // Validation chuyên sâu
        const codeRegex = /^[A-Z0-9]{3,20}$/;
        if (!codeRegex.test(class_code)) {
            return res.status(400).json({ status: 'Error', message: 'Mã lớp không hợp lệ (3-20 ký tự in hoa/số)' });
        }
        
        // Trim và Validate tên lớp
        const trimmedClassName = class_name.trim();
        if (trimmedClassName.length < 5 || trimmedClassName.length > 100) {
            return res.status(400).json({ status: 'Error', message: 'Tên lớp phải từ 5 đến 100 ký tự' });
        }
        const nameRegex = /^[\p{L}\p{N}\s\-_+&()]+$/u;
        if (!nameRegex.test(trimmedClassName)) {
            return res.status(400).json({ status: 'Error', message: 'Tên lớp không hợp lệ (chỉ chứa chữ, số, khoảng trắng và ký tự -_+&())' });
        }

        const maxSt = parseInt(max_students, 10) || 25;
        if (maxSt < 1 || maxSt > 30) {
            return res.status(400).json({ status: 'Error', message: 'Sĩ số tối đa từ 1 đến 30' });
        }

        // Ngày bắt đầu: trong vòng 30 ngày qua và không quá 2 năm tới
        const startDateObj = new Date(start_date);
        const todayObj = new Date();
        const pastLimit = new Date();
        pastLimit.setDate(todayObj.getDate() - 30);
        const futureLimit = new Date();
        futureLimit.setFullYear(todayObj.getFullYear() + 2);
        
        if (startDateObj < pastLimit) {
            return res.status(400).json({ status: 'Error', message: 'Ngày bắt đầu không được quá 30 ngày trong quá khứ' });
        }
        if (startDateObj > futureLimit) {
            return res.status(400).json({ status: 'Error', message: 'Ngày bắt đầu không được vượt quá 2 năm trong tương lai' });
        }

        // Kiểm tra trùng Mã lớp (ngoại trừ lớp hiện tại)
        const [existingCode] = await db.query('SELECT id FROM classes WHERE class_code = ? AND id != ?', [class_code, classId]);
        if (existingCode.length > 0) {
            return res.status(400).json({ status: 'Error', message: 'Mã lớp đã tồn tại trong hệ thống' });
        }

        // Kiểm tra xung đột lịch GV (khác lớp hiện tại, cùng ca học, chưa đóng)
        const [conflict] = await db.query(
            "SELECT id FROM classes WHERE teacher_id = ? AND session_time = ? AND id != ? AND status != 'closed'",
            [teacher_id, session_time, classId]
        );
        if (conflict.length > 0) {
            return res.status(400).json({ status: 'Error', message: 'Giáo viên đã có lịch dạy vào ca này' });
        }

        await db.query(
            'UPDATE classes SET class_code = ?, class_name = ?, course_id = ?, branch_id = ?, teacher_id = ?, start_date = ?, session_time = ?, status = ?, max_students = ? WHERE id = ?',
            [class_code, trimmedClassName, course_id, branch_id, teacher_id, start_date, session_time, status, maxSt, classId]
        );
        res.status(200).json({ status: 'Success', message: 'Cập nhật thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'Error', message: 'Lỗi cập nhật lớp' });
    }
};

// Xóa lớp học
exports.deleteClass = async (req, res) => {
    try {
        await db.query('DELETE FROM classes WHERE id = ?', [req.params.id]);
        res.status(200).json({ status: 'Success', message: 'Xóa lớp thành công' });
    } catch (error) {
        res.status(500).json({ status: 'Error', message: 'Lỗi xóa lớp' });
    }
};

// Lấy danh sách Học sinh CỦA MỘT LỚP
exports.getClassStudents = async (req, res) => {
    try {
        const classId = req.params.id;
        const userId = req.user.userId;
        const role = req.user.role;

        // Kiểm tra quyền: Giáo viên chỉ được xem học sinh của lớp mình chủ nhiệm
        if (role === 'Teacher') {
            const [classInfo] = await db.query(`
                SELECT c.id 
                FROM classes c
                JOIN teachers t ON c.teacher_id = t.id
                WHERE c.id = ? AND t.user_id = ?
            `, [classId, userId]);

            if (classInfo.length === 0) {
                return res.status(403).json({ status: 'Error', message: 'Bạn không có quyền xem học sinh của lớp này do không được phân công giảng dạy.' });
            }
        }

        // Join Enrollments với Students với Users để lấy full info học sinh
        const [students] = await db.query(`
            SELECT u.id AS user_id, s.id AS student_id, u.full_name, u.email, s.phone, e.enroll_date
            FROM enrollments e
            JOIN students s ON e.student_id = s.id
            JOIN users u ON s.user_id = u.id
            WHERE e.class_id = ?
        `, [classId]);

        res.status(200).json({ status: 'Success', data: students });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'Error', message: 'Lỗi kéo danh sách học sinh' });
    }
};

// Lấy danh sách giáo viên (Dùng cho dropdown tạo lớp)
exports.getTeachers = async (req, res) => {
    try {
        const [teachers] = await db.query(`
            SELECT t.id, u.full_name, t.specialized_subject
            FROM teachers t
            JOIN users u ON t.user_id = u.id
            ORDER BY u.full_name ASC
        `);
        res.status(200).json({ status: 'Success', data: teachers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'Error', message: 'Lỗi lấy danh sách giáo viên' });
    }
};

// Lấy danh sách chi nhánh (Dùng cho dropdown tạo lớp)
exports.getBranches = async (req, res) => {
    try {
        const [branches] = await db.query('SELECT * FROM branches ORDER BY branch_name ASC');
        res.status(200).json({ status: 'Success', data: branches });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'Error', message: 'Lỗi lấy danh sách chi nhánh' });
    }
};

// Lấy danh sách khóa học
exports.getCourses = async (req, res) => {
    try {
        const [courses] = await db.query('SELECT * FROM courses ORDER BY course_name ASC');
        res.status(200).json({ status: 'Success', data: courses });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'Error', message: 'Lỗi lấy danh sách khóa học' });
    }
};

// Phân công giáo viên vào lớp (US5)
exports.assignTeacher = async (req, res) => {
    try {
        const { teacher_id } = req.body;
        const classId = req.params.id;

        if (!teacher_id) {
            return res.status(400).json({ status: 'Error', message: 'Vui lòng chọn một giáo viên chính cho lớp học' });
        }

        // Lấy thông tin lớp học hiện tại (để biết start_date và session_time)
        const [currentClass] = await db.query('SELECT teacher_id, start_date, session_time FROM classes WHERE id = ?', [classId]);
        
        if (currentClass.length === 0) {
            return res.status(404).json({ status: 'Error', message: 'Không tìm thấy lớp học' });
        }

        const { start_date, session_time } = currentClass[0];

        // Nếu giáo viên không đổi thì không cần làm gì
        if (currentClass[0].teacher_id == teacher_id) {
            return res.status(400).json({ status: 'Error', message: 'Giáo viên này đã được phân công vào lớp này' });
        }

        // Kiểm tra xung đột lịch với các lớp khác của cùng giáo viên đó
        // DF002: Bỏ start_date = ? để kiểm tra triệt để (Nếu cùng session_time là trùng)
        const [conflict] = await db.query(
            'SELECT id, class_name FROM classes WHERE teacher_id = ? AND session_time = ? AND id != ? AND status != "closed"',
            [teacher_id, session_time, classId]
        );

        if (conflict.length > 0) {
            // "Giáo viên này đã có lịch dạy trùng vào thời gian của lớp học. Vui lòng chọn giáo viên khác."
            return res.status(400).json({ status: 'Error', message: 'Giáo viên này đã có lịch dạy trùng vào thời gian của lớp học. Vui lòng chọn giáo viên khác.' });
        }

        // Cập nhật teacher_id cho lớp học
        await db.query('UPDATE classes SET teacher_id = ? WHERE id = ?', [teacher_id, classId]);

        // Nếu lớp học chưa có buổi học nào, generate 12 tuần lịch (dựa vào start_date)
        const [existingSessions] = await db.query('SELECT id FROM class_sessions WHERE class_id = ?', [classId]);
        if (existingSessions.length === 0) {
            const timeMatch = session_time.match(/(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})/);
            let start_time = '08:00:00';
            let end_time = '10:00:00';
            if (timeMatch) {
                start_time = timeMatch[1] + ':00';
                end_time = timeMatch[2] + ':00';
            }
            
            for (let i = 0; i < 12; i++) {
                const d = new Date(start_date);
                d.setDate(d.getDate() + (i * 7));
                const yyyy = d.getFullYear();
                const mm = String(d.getMonth() + 1).padStart(2, '0');
                const dd = String(d.getDate()).padStart(2, '0');
                const dateStr = `${yyyy}-${mm}-${dd}`;
                await db.query(
                    'INSERT INTO class_sessions (class_id, session_date, start_time, end_time, room, session_type) VALUES (?, ?, ?, ?, ?, ?)',
                    [classId, dateStr, start_time, end_time, 'Phòng học 1', 'Theory']
                );
            }
        }

        res.status(200).json({ status: 'Success', message: 'Giáo viên này đã được phân công vào lớp học thành công.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'Error', message: 'Lỗi phân công giáo viên' });
    }
};
