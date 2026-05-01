const db = require('../config/db');
const path = require('path');
const fs = require('fs');
const upload = require('../config/multer');

// GET /api/homework — Lấy danh sách bài tập của TẤT CẢ lớp (cho option "Tất cả")
exports.getAllHomework = async (req, res) => {
    try {
        const userId = req.user.userId;
        const role = req.user.role;

        let query = '';
        let params = [];

        if (role === 'Student') {
            const [stuRows] = await db.query('SELECT id FROM students WHERE user_id = ?', [userId]);
            const studentId = stuRows.length > 0 ? stuRows[0].id : null;

            query = `
                SELECT 
                    h.id, h.title, h.due_date, h.created_at, h.class_id,
                    s.id AS submission_id, s.file_url AS submission_file, 
                    s.submitted_at, s.score,
                    c.class_name
                FROM homework h
                JOIN enrollments e ON h.class_id = e.class_id
                JOIN classes c ON h.class_id = c.id
                LEFT JOIN submissions s ON s.homework_id = h.id AND s.student_id = ?
                WHERE e.student_id = ?
                ORDER BY h.due_date DESC
            `;
            params = [studentId, studentId];
        } else if (role === 'Teacher') {
            query = `
                SELECT 
                    h.id, h.title, h.due_date, h.created_at, h.class_id,
                    NULL AS submission_id, NULL AS submission_file, 
                    NULL AS submitted_at, NULL AS score,
                    c.class_name
                FROM homework h
                JOIN classes c ON h.class_id = c.id
                JOIN teachers t ON c.teacher_id = t.id
                WHERE t.user_id = ?
                ORDER BY h.due_date DESC
            `;
            params = [userId];
        } else {
            // Admin gets everything
            query = `
                SELECT 
                    h.id, h.title, h.due_date, h.created_at, h.class_id,
                    NULL AS submission_id, NULL AS submission_file, 
                    NULL AS submitted_at, NULL AS score,
                    c.class_name
                FROM homework h
                JOIN classes c ON h.class_id = c.id
                ORDER BY h.due_date DESC
            `;
        }

        const [rows] = await db.query(query, params);
        const now = new Date();

        const homeworkList = rows.map(hw => {
            const dueDate = new Date(hw.due_date);
            const hasSubmission = !!hw.submission_id;

            let status;
            if (hasSubmission) {
                status = 'Đã nộp';
            } else if (dueDate >= new Date(now.toDateString())) {
                status = 'Chưa nộp';
            } else {
                status = 'Quá hạn';
            }

            let submissionLabel = null;
            if (hasSubmission && hw.submitted_at) {
                const submittedAt = new Date(hw.submitted_at);
                const deadlineEnd = new Date(dueDate);
                deadlineEnd.setHours(23, 59, 59, 999);
                submissionLabel = submittedAt <= deadlineEnd ? 'Đúng hạn' : 'Nộp muộn';
            }

            return {
                id: hw.id,
                title: hw.title,
                class_id: hw.class_id,
                class_name: hw.class_name,
                due_date: hw.due_date,
                created_at: hw.created_at,
                status,
                submission_id: hw.submission_id,
                submission_file: hw.submission_file,
                submitted_at: hw.submitted_at,
                score: hw.score,
                submission_label: submissionLabel
            };
        });

        res.json({ status: 'OK', data: homeworkList });
    } catch (error) {
        console.error('getAllHomework error:', error);
        res.status(500).json({ status: 'Error', message: 'Lỗi server khi lấy tất cả bài tập' });
    }
};

// GET /api/homework/classes/:classId — Lấy danh sách bài tập theo lớp
exports.getHomeworkByClass = async (req, res) => {
    try {
        const { classId } = req.params;
        const userId = req.user.userId;
        const role = req.user.role;

        // --- Kiểm tra quyền truy cập lớp ---
        if (role === 'Teacher') {
            const [classes] = await db.query(
                `SELECT c.id FROM classes c 
                 JOIN teachers t ON c.teacher_id = t.id 
                 WHERE c.id = ? AND t.user_id = ?`,
                [classId, userId]
            );
            if (classes.length === 0) {
                return res.status(403).json({ status: 'Error', message: 'Bạn không có quyền xem bài tập của lớp học này.' });
            }
        } else if (role === 'Student') {
            const [enrollments] = await db.query(
                `SELECT e.id FROM enrollments e 
                 JOIN students s ON e.student_id = s.id 
                 WHERE e.class_id = ? AND s.user_id = ?`,
                [classId, userId]
            );
            if (enrollments.length === 0) {
                return res.status(403).json({ status: 'Error', message: 'Bạn không thuộc lớp học này.' });
            }
        }

        // Lấy student_id nếu là Student
        let studentId = null;
        if (role === 'Student') {
            const [stuRows] = await db.query('SELECT id FROM students WHERE user_id = ?', [userId]);
            if (stuRows.length > 0) studentId = stuRows[0].id;
        }

        // Lấy danh sách homework + LEFT JOIN submissions của student hiện tại
        const [rows] = await db.query(`
            SELECT 
                h.id, h.title, h.due_date, h.created_at,
                s.id AS submission_id, s.file_url AS submission_file, 
                s.submitted_at, s.score
            FROM homework h
            LEFT JOIN submissions s ON s.homework_id = h.id AND s.student_id = ?
            WHERE h.class_id = ?
            ORDER BY h.due_date DESC
        `, [studentId, classId]);

        const now = new Date();

        const homeworkList = rows.map(hw => {
            const dueDate = new Date(hw.due_date);
            const hasSubmission = !!hw.submission_id;

            // Tính status realtime
            let status;
            if (hasSubmission) {
                status = 'Đã nộp';
            } else if (dueDate >= new Date(now.toDateString())) {
                status = 'Chưa nộp';
            } else {
                status = 'Quá hạn';
            }

            // Tính submission label
            let submissionLabel = null;
            if (hasSubmission && hw.submitted_at) {
                const submittedAt = new Date(hw.submitted_at);
                const deadlineEnd = new Date(dueDate);
                deadlineEnd.setHours(23, 59, 59, 999);
                submissionLabel = submittedAt <= deadlineEnd ? 'Đúng hạn' : 'Nộp muộn';
            }

            return {
                id: hw.id,
                title: hw.title,
                due_date: hw.due_date,
                created_at: hw.created_at,
                status,
                submission_id: hw.submission_id,
                submission_file: hw.submission_file,
                submitted_at: hw.submitted_at,
                score: hw.score,
                submission_label: submissionLabel
            };
        });

        res.json({ status: 'OK', data: homeworkList });
    } catch (error) {
        console.error('getHomeworkByClass error:', error);
        res.status(500).json({ status: 'Error', message: 'Lỗi server khi lấy danh sách bài tập' });
    }
};

// POST /api/homework/classes/:classId — Tạo bài tập mới (Chỉ Teacher)
exports.createHomework = [
    upload.single('file'),
    async (req, res) => {
        try {
            const { classId } = req.params;
            const { title, description, start_date, start_time, due_date, due_time } = req.body;
            const userId = req.user.userId;

            // Kiểm tra field bắt buộc
            if (!title || !description || !start_date || !due_date || !due_time || !req.file) {
                return res.status(400).json({ status: 'Error', message: 'Vui lòng điền đầy đủ các trường thông tin bắt buộc.' });
            }

            // Kiểm tra Title / Description max 200
            if (title.length > 200 || description.length > 200) {
                return res.status(400).json({ status: 'Error', message: 'Tiêu đề hoặc mô tả không được vượt quá 200 ký tự.' });
            }

            // Kiểm tra giáo viên có quyền ở lớp này không
            const [classes] = await db.query(
                `SELECT c.id FROM classes c 
                 JOIN teachers t ON c.teacher_id = t.id 
                 WHERE c.id = ? AND t.user_id = ?`,
                [classId, userId]
            );

            if (classes.length === 0) {
                return res.status(403).json({ status: 'Error', message: 'Bạn không có quyền tạo bài tập cho lớp học này.' });
            }

            // Kiểm tra thời gian: start < due
            const resolvedStartTime = start_time || '00:00';
            const startDatetime = new Date(`${start_date}T${resolvedStartTime}`);
            const dueDatetime = new Date(`${due_date}T${due_time}`);
            if (dueDatetime <= startDatetime) {
                return res.status(400).json({ status: 'Error', message: 'Hạn nộp phải sau thời gian bắt đầu.' });
            }

            // Dung lượng tệp (Multer cấu hình default limit nhưng cần tự check thêm hoặc dựa vào err của multer)
            if (req.file.size > 100 * 1024 * 1024) {
                return res.status(400).json({ status: 'Error', message: 'Dung lượng tệp đính kèm vượt quá 100MB.' });
            }

            const attachment_url = `/uploads/${req.file.filename}`;

            // Lưu vào DB
            await db.query(
                `INSERT INTO homework (class_id, title, description, start_date, start_time, due_date, due_time, attachment_url) 
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [classId, title.trim(), description.trim(), start_date, resolvedStartTime, due_date, due_time, attachment_url]
            );

            res.status(201).json({ status: 'Success', message: 'Tạo bài tập thành công.' });
        } catch (error) {
            console.error('createHomework error:', error);
            res.status(500).json({ status: 'Error', message: 'Lỗi server khi tạo bài tập' });
        }
    }
];

// PUT /api/homework/:homeworkId - Cập nhật bài tập (Chỉ Teacher)
exports.updateHomework = [
    upload.single('file'),
    async (req, res) => {
        try {
            const { homeworkId } = req.params;
            const { title, description, start_date, start_time, due_date, due_time } = req.body;
            const userId = req.user.userId;

            // Kiểm tra field bắt buộc
            if (!title || !description || !start_date || !due_date || !due_time) {
                return res.status(400).json({ status: 'Error', message: 'Vui lòng điền đầy đủ các trường thông tin bắt buộc.' });
            }

            // Kiểm tra Title / Description max 200
            if (title.length > 200 || description.length > 200) {
                return res.status(400).json({ status: 'Error', message: 'Tiêu đề hoặc mô tả không được vượt quá 200 ký tự.' });
            }

            // Kiểm tra bài tập tồn tại và quyền của giáo viên
            const [hwRows] = await db.query(
                `SELECT h.*, c.teacher_id 
                 FROM homework h
                 JOIN classes c ON h.class_id = c.id
                 JOIN teachers t ON c.teacher_id = t.id
                 WHERE h.id = ? AND t.user_id = ?`,
                [homeworkId, userId]
            );

            if (hwRows.length === 0) {
                return res.status(403).json({ status: 'Error', message: 'Không tìm thấy bài tập hoặc bạn không có quyền sửa.' });
            }

            const getDueDateTime = (hwDate, hwTime) => {
                if (!hwDate) return null;
                const dDateStr = new Date(hwDate).toISOString().split('T')[0];
                const dTimeStr = hwTime || '23:59:59';
                return new Date(`${dDateStr}T${dTimeStr}`);
            };

            const oldDueDateTime = getDueDateTime(hwRows[0].due_date, hwRows[0].due_time);
            if (oldDueDateTime && oldDueDateTime < new Date()) {
                return res.status(400).json({ status: 'Error', message: 'Không thể sửa bài tập đã quá hạn nộp.' });
            }

            // Kiểm tra thời gian mới: start < due
            const resolvedStartTime = start_time || '00:00';
            const newStartDatetime = new Date(`${start_date}T${resolvedStartTime}`);
            const newDueDatetime = new Date(`${due_date}T${due_time}`);
            if (newDueDatetime <= newStartDatetime) {
                return res.status(400).json({ status: 'Error', message: 'Hạn nộp phải sau thời gian bắt đầu.' });
            }

            let attachment_url = hwRows[0].attachment_url;
            if (req.file) {
                if (req.file.size > 100 * 1024 * 1024) {
                    return res.status(400).json({ status: 'Error', message: 'Dung lượng tệp đính kèm vượt quá 100MB.' });
                }
                attachment_url = `/uploads/${req.file.filename}`;
            }

            // Cập nhật DB
            await db.query(
                `UPDATE homework 
                 SET title = ?, description = ?, start_date = ?, start_time = ?, due_date = ?, due_time = ?, attachment_url = ?
                 WHERE id = ?`,
                [title.trim(), description.trim(), start_date, resolvedStartTime, due_date, due_time, attachment_url, homeworkId]
            );

            res.status(200).json({ status: 'Success', message: 'Cập nhật bài tập thành công.' });
        } catch (error) {
            console.error('updateHomework error:', error);
            res.status(500).json({ status: 'Error', message: 'Lỗi server khi cập nhật bài tập' });
        }
    }
];

// POST /api/homework/:homeworkId/submit — Nộp bài
exports.submitHomework = [
    (req, res, next) => {
        upload.submissionUpload.single('file')(req, res, (err) => {
            if (err) {
                if (err.code === 'LIMIT_FILE_SIZE') {
                    return res.status(400).json({ status: 'Error', message: 'Dung lượng tệp vượt quá giới hạn cho phép (Tối đa 100MB).' });
                }
                return res.status(400).json({ status: 'Error', message: err.message || 'Tệp tải lên không đúng định dạng.' });
            }
            next();
        });
    },
    async (req, res) => {
        try {
            const { homeworkId } = req.params;
            const userId = req.user.userId;

            if (!req.file) {
                return res.status(400).json({ status: 'Error', message: 'Vui lòng tải lên tệp.' });
            }

            // Lấy student_id
            const [stuRows] = await db.query('SELECT id FROM students WHERE user_id = ?', [userId]);
            if (stuRows.length === 0) {
                return res.status(403).json({ status: 'Error', message: 'Không tìm thấy thông tin học sinh' });
            }
            const studentId = stuRows[0].id;

            // Kiểm tra homework tồn tại
            const [hwRows] = await db.query('SELECT id, class_id, due_date, due_time FROM homework WHERE id = ?', [homeworkId]);
            if (hwRows.length === 0) {
                return res.status(404).json({ status: 'Error', message: 'Không tìm thấy bài tập' });
            }
            const homework = hwRows[0];

            // Kiểm tra student có enrolled trong class không
            const [enrollRows] = await db.query(
                'SELECT id FROM enrollments WHERE student_id = ? AND class_id = ?',
                [studentId, homework.class_id]
            );
            if (enrollRows.length === 0) {
                return res.status(403).json({ status: 'Error', message: 'Bạn không thuộc lớp học này' });
            }

            // Tính submission label dựa trên due_date + due_time chính xác
            const submittedAt = new Date();
            const dueDateStr = new Date(homework.due_date).toISOString().split('T')[0];
            const dueTimeStr = homework.due_time || '23:59:59';
            const deadlineDateTime = new Date(`${dueDateStr}T${dueTimeStr}`);
            const submissionLabel = submittedAt <= deadlineDateTime ? 'Đúng hạn' : 'Nộp muộn';

            const fileUrl = `/uploads/${req.file.filename}`;

            // INSERT hoặc UPDATE nếu đã nộp trước đó
            const [existing] = await db.query(
                'SELECT id FROM submissions WHERE homework_id = ? AND student_id = ?',
                [homeworkId, studentId]
            );

            if (existing.length > 0) {
                await db.query(
                    'UPDATE submissions SET file_url = ?, submitted_at = NOW() WHERE homework_id = ? AND student_id = ?',
                    [fileUrl, homeworkId, studentId]
                );
            } else {
                await db.query(
                    'INSERT INTO submissions (homework_id, student_id, file_url, submitted_at) VALUES (?, ?, ?, NOW())',
                    [homeworkId, studentId, fileUrl]
                );
            }

            res.json({
                status: 'OK',
                message: `Nộp bài thành công — ${submissionLabel}`,
                data: { submission_label: submissionLabel, file_url: fileUrl }
            });
        } catch (error) {
            console.error('submitHomework error:', error);
            res.status(500).json({ status: 'Error', message: 'Lỗi server khi nộp bài' });
        }
    }
];

// GET /api/homework/:homeworkId — Lấy chi tiết 1 bài tập
exports.getHomeworkById = async (req, res) => {
    try {
        const { homeworkId } = req.params;
        const userId = req.user.userId;
        const role = req.user.role;

        let studentId = null;
        if (role === 'Student') {
            const [stuRows] = await db.query('SELECT id FROM students WHERE user_id = ?', [userId]);
            if (stuRows.length > 0) studentId = stuRows[0].id;
        }

        // Lấy thông tin bài tập + thông tin lớp học
        const [hwRows] = await db.query(`
            SELECT h.*, c.class_name, c.course_id,
                   co.course_name
            FROM homework h
            JOIN classes c ON h.class_id = c.id
            LEFT JOIN courses co ON c.course_id = co.id
            WHERE h.id = ?
        `, [homeworkId]);

        if (hwRows.length === 0) {
            return res.status(404).json({ status: 'Error', message: 'Không tìm thấy bài tập' });
        }
        const hw = hwRows[0];

        // Lấy submission của student (nếu có)
        let submission = null;
        if (studentId) {
            const [subRows] = await db.query(`
                SELECT id, file_url, score, feedback, submitted_at
                FROM submissions
                WHERE homework_id = ? AND student_id = ?
            `, [homeworkId, studentId]);
            if (subRows.length > 0) submission = subRows[0];
        }

        // Lấy danh sách submissions (dành cho teacher)
        let submissionsList = [];
        if (role === 'Teacher') {
            const [allSubs] = await db.query(`
                SELECT s.id, s.file_url, s.score, s.feedback, s.submitted_at,
                       u.full_name as student_name
                FROM submissions s
                JOIN students st ON s.student_id = st.id
                JOIN users u ON st.user_id = u.id
                WHERE s.homework_id = ?
                ORDER BY s.submitted_at ASC
            `, [homeworkId]);
            submissionsList = allSubs;
        }

        res.json({
            status: 'OK',
            data: {
                ...hw,
                submission,
                submissionsList
            }
        });
    } catch (error) {
        console.error('getHomeworkById error:', error);
        res.status(500).json({ status: 'Error', message: 'Lỗi server' });
    }
};

// PUT /api/homework/:homeworkId/grade/:submissionId — Chấm điểm + nhận xét (Chỉ Teacher)
exports.gradeSubmission = async (req, res) => {
    try {
        const { homeworkId, submissionId } = req.params;
        const { score, feedback } = req.body;
        const userId = req.user.userId;

        if (score === undefined || score === null) {
            return res.status(400).json({ status: 'Error', message: 'Vui lòng nhập điểm số' });
        }
        if (parseFloat(score) < 0 || parseFloat(score) > 10) {
            return res.status(400).json({ status: 'Error', message: 'Điểm phải từ 0 đến 10' });
        }

        // Kiểm tra giáo viên có quyền với bài tập này
        const [hwCheck] = await db.query(`
            SELECT h.id FROM homework h
            JOIN classes c ON h.class_id = c.id
            JOIN teachers t ON c.teacher_id = t.id
            WHERE h.id = ? AND t.user_id = ?
        `, [homeworkId, userId]);

        if (hwCheck.length === 0) {
            return res.status(403).json({ status: 'Error', message: 'Bạn không có quyền chấm bài tập này' });
        }

        await db.query(
            'UPDATE submissions SET score = ?, feedback = ? WHERE id = ? AND homework_id = ?',
            [parseFloat(score), feedback || null, submissionId, homeworkId]
        );

        res.json({ status: 'OK', message: 'Chấm điểm thành công' });
    } catch (error) {
        console.error('gradeSubmission error:', error);
        res.status(500).json({ status: 'Error', message: 'Lỗi server khi chấm điểm' });
    }
};
