const db = require('../config/db');

/**
 * GET /api/progress/me
 * Trả về tiến độ học tập của học sinh đang đăng nhập,
 * nhóm theo từng khóa học (course).
 */
exports.getMyProgress = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { period = 'month' } = req.query; // 'week', 'month', 'year'

        // 1. Lấy student_id
        const [stuRows] = await db.query(
            'SELECT id FROM students WHERE user_id = ?',
            [userId]
        );
        if (stuRows.length === 0) {
            return res.status(404).json({ status: 'Error', message: 'Không tìm thấy thông tin học sinh.' });
        }
        const studentId = stuRows[0].id;

        // 2. Lấy tất cả lớp học sinh đã đăng ký (kèm thông tin khóa học)
        const [enrolledClasses] = await db.query(`
            SELECT 
                c.id AS class_id,
                c.class_name,
                co.id AS course_id,
                co.course_name
            FROM enrollments e
            JOIN classes c ON e.class_id = c.id
            LEFT JOIN courses co ON c.course_id = co.id
            WHERE e.student_id = ?
        `, [studentId]);

        if (enrolledClasses.length === 0) {
            return res.json({ status: 'OK', data: [] });
        }

        // 3. Nhóm các lớp theo course_id (1 course có thể có nhiều lớp)
        const courseMap = {};
        for (const cls of enrolledClasses) {
            const key = cls.course_id || `no-course-${cls.class_id}`;
            if (!courseMap[key]) {
                courseMap[key] = {
                    courseId: key,
                    courseName: cls.course_name || cls.class_name,
                    classIds: []
                };
            }
            courseMap[key].classIds.push(cls.class_id);
        }

        const results = [];
        
        // Điều kiện lọc theo thời gian
        let dateFilterSession = "";
        let dateFilterHw = "";
        
        if (period === 'week') {
            dateFilterSession = "AND YEARWEEK(cs.session_date, 1) = YEARWEEK(CURDATE(), 1)";
            dateFilterHw = "AND YEARWEEK(h.due_date, 1) = YEARWEEK(CURDATE(), 1)";
        } else if (period === 'year') {
            dateFilterSession = "AND YEAR(cs.session_date) = YEAR(CURDATE())";
            dateFilterHw = "AND YEAR(h.due_date) = YEAR(CURDATE())";
        } else if (period === 'month') {
            dateFilterSession = "AND MONTH(cs.session_date) = MONTH(CURDATE()) AND YEAR(cs.session_date) = YEAR(CURDATE())";
            dateFilterHw = "AND MONTH(h.due_date) = MONTH(CURDATE()) AND YEAR(h.due_date) = YEAR(CURDATE())";
        }

        for (const courseData of Object.values(courseMap)) {
            const { courseId, courseName, classIds } = courseData;
            const placeholders = classIds.map(() => '?').join(',');

            // 4a. Tỷ lệ chuyên cần: số buổi Present / tổng buổi đã điểm danh
            const [attendRows] = await db.query(`
                SELECT 
                    COUNT(*) AS total_sessions,
                    SUM(CASE WHEN a.status = 'Present' THEN 1 ELSE 0 END) AS present_count
                FROM class_sessions cs
                JOIN attendance a ON a.session_id = cs.id AND a.student_id = ?
                WHERE cs.class_id IN (${placeholders}) ${dateFilterSession}
            `, [studentId, ...classIds]);

            const totalSessions = parseInt(attendRows[0]?.total_sessions) || 0;
            const presentCount = parseInt(attendRows[0]?.present_count) || 0;
            const attendanceRate = totalSessions > 0
                ? Math.round((presentCount / totalSessions) * 100)
                : 0;

            // 4b. Điểm trung bình: avg(score) từ submissions có score != null
            const [scoreRows] = await db.query(`
                SELECT AVG(s.score) AS avg_score
                FROM submissions s
                JOIN homework h ON s.homework_id = h.id
                WHERE s.student_id = ?
                  AND h.class_id IN (${placeholders})
                  AND s.score IS NOT NULL
                  ${dateFilterHw}
            `, [studentId, ...classIds]);

            const avgScore = scoreRows[0]?.avg_score !== null && scoreRows[0]?.avg_score !== undefined
                ? parseFloat(parseFloat(scoreRows[0].avg_score).toFixed(1))
                : null;

            // 4c. Bài tập: tổng bài / đã nộp
            const [hwRows] = await db.query(`
                SELECT COUNT(*) AS total
                FROM homework h
                WHERE h.class_id IN (${placeholders}) ${dateFilterHw}
            `, [...classIds]);

            const [submittedRows] = await db.query(`
                SELECT COUNT(DISTINCT s.homework_id) AS submitted
                FROM submissions s
                JOIN homework h ON s.homework_id = h.id
                WHERE s.student_id = ?
                  AND h.class_id IN (${placeholders})
                  ${dateFilterHw}
            `, [studentId, ...classIds]);

            const totalAssignments = parseInt(hwRows[0]?.total) || 0;
            const completedAssignments = parseInt(submittedRows[0]?.submitted) || 0;

            // 4d. Tag từ tên khóa học
            let tag = 'Khác';
            if (courseName) {
                const upper = courseName.toUpperCase();
                if (upper.includes('IELTS')) tag = 'IELTS';
                else if (upper.includes('TOEIC')) tag = 'TOEIC';
                else if (upper.includes('TOEFL')) tag = 'TOEFL';
                else if (upper.includes('GIAO TIẾP') || upper.includes('GIAO TIEP')) tag = 'Giao tiếp';
                else if (upper.includes('GRAMMAR') || upper.includes('NGỮ PHÁP')) tag = 'Ngữ pháp';
            }

            const hasData = totalSessions > 0 || totalAssignments > 0;

            results.push({
                courseId,
                courseName,
                tag,
                attendanceRate,
                averageScore: avgScore,
                completedAssignments,
                totalAssignments,
                hasData
            });
        }

        res.json({ status: 'OK', data: results });
    } catch (error) {
        console.error('getMyProgress error:', error);
        res.status(500).json({ status: 'Error', message: 'Lỗi server khi lấy tiến độ học tập.' });
    }
};
