require('dotenv').config();
const db = require('./config/db');
const bcrypt = require('bcrypt');
const runMigrations = require('./config/migration');

async function seedDummyData() {
    console.log("=== BẮT ĐẦU ĐỔ DỮ LIỆU MỒI (DUMMY DATA) ===");

    try {
        const isForce = process.argv.includes('--force');

        if (!isForce) {
            console.log("-> [CẢNH BÁO] Vui lòng dùng 'node seed-data.js --force' để chạy script này vì nó sẽ xóa toàn bộ dữ liệu cũ.");
            return;
        }
        
        console.log("-> Đang chạy DB Migrations trước khi seed...");
        await runMigrations();

        // 1. Dọn Dẹp Dữ Liệu Cũ
        console.log("-> Đang dọn dẹp dữ liệu cũ để nạp mới...");
        await db.query("SET FOREIGN_KEY_CHECKS = 0;");
        await db.query("TRUNCATE TABLE progress_records;");
        await db.query("TRUNCATE TABLE submissions;");
        await db.query("TRUNCATE TABLE homework;");
        await db.query("TRUNCATE TABLE attendance;");
        await db.query("TRUNCATE TABLE learning_materials;");
        await db.query("TRUNCATE TABLE materials;");
        await db.query("TRUNCATE TABLE class_sessions;");
        await db.query("TRUNCATE TABLE enrollments;");
        await db.query("TRUNCATE TABLE classes;");
        await db.query("TRUNCATE TABLE courses;");
        await db.query("TRUNCATE TABLE students;");
        await db.query("TRUNCATE TABLE teachers;");
        await db.query("TRUNCATE TABLE users;");
        await db.query("TRUNCATE TABLE branches;");
        await db.query("SET FOREIGN_KEY_CHECKS = 1;");

        // 2. Tạo Branches
        console.log("-> Đang tạo Cơ sở...");
        await db.query(`
            INSERT INTO branches (id, branch_name, address) VALUES 
            (1, 'Cơ sở 28N7A',  'Số 28N7A, P. Nguyễn Thị Thập, Nhân Chính, Thanh Xuân, Hà Nội'),
            (2, 'Cơ sở 27N7A',  'Số 27N7A, P. Nguyễn Thị Thập, Nhân Chính, Thanh Xuân, Hà Nội'),
            (3, 'Cơ sở 25N7A', 'Số 25 N7A, P. Nguyễn Thị Thập, Nhân Chính, Thanh Xuân, Hà Nội'),
            (4, 'Cơ sở Hà Đông', 'BT số 3, Dãy 16A7, Làng Việt Kiều Châu Âu, P. Hà Đông, HN'),
            (5, 'Cơ sở Cầu Giấy', 'Tầng 3, 29T2 P. Hoàng Đạo Thúy, Trung Hoà, Cầu Giấy, Hà Nội')
        `);

        // 2.1 Tạo Courses
        console.log("-> Đang tạo Khóa học (Courses)...");
        await db.query(`
            INSERT INTO courses (id, course_name, description) VALUES 
            (1, 'IELTS Foundation', 'Khóa học nền tảng IELTS 5.0 - 6.0'),
            (2, 'IELTS Intensive', 'Khóa học luyện thi IELTS chuyên sâu 7.0+'),
            (3, 'TOEIC 600+', 'Luyện thi TOEIC cấp tốc 600+'),
            (4, 'TOEIC Speaking & Writing', 'Luyện kỹ năng Nói và Viết TOEIC'),
            (5, 'Giao Tiếp Cơ Bản', 'Tiếng Anh giao tiếp cơ bản A2'),
            (6, 'Ngữ Pháp Tiếng Anh', 'Ngữ pháp tiếng Anh tổng quát B1-B2')
        `);

        const salt = await bcrypt.genSalt(10);
        const hashPass = await bcrypt.hash("123456", salt);

        // 3. Tạo Users (Admin, Teachers, Students)
        console.log("-> Đang tạo Users...");
        
        // Admin
        await db.query("INSERT INTO users (id, email, password_hash, full_name, role_id) VALUES (1, 'admin@np.edu.vn', ?, 'Admin NP Education', 1)", [hashPass]);

        // Teachers
        await db.query("INSERT INTO users (id, email, password_hash, full_name, role_id) VALUES (2, 'teacher_lan@np.edu.vn', ?, 'Cô Lan English', 4)", [hashPass]);
        await db.query("INSERT INTO users (id, email, password_hash, full_name, role_id) VALUES (3, 'teacher_mike@np.edu.vn', ?, 'Thầy Mike IELTS', 4)", [hashPass]);
        await db.query("INSERT INTO users (id, email, password_hash, full_name, role_id) VALUES (4, 'teacher_hoa@np.edu.vn', ?, 'Cô Hoa Speaking', 4)", [hashPass]);
        await db.query("INSERT INTO users (id, email, password_hash, full_name, role_id) VALUES (5, 'teacher_david@np.edu.vn', ?, 'Thầy David Grammar', 4)", [hashPass]);
        await db.query("INSERT INTO users (id, email, password_hash, full_name, role_id) VALUES (6, 'teacher_thuy@np.edu.vn', ?, 'Cô Thùy Writing', 4)", [hashPass]);

        await db.query(`
            INSERT INTO teachers (user_id, specialized_subject) VALUES 
            (2, 'TOEIC Listening & Reading'),
            (3, 'IELTS Academic'),
            (4, 'Giao Tiếp & Phát Âm'),
            (5, 'Ngữ Pháp Nâng Cao'),
            (6, 'IELTS Writing & Reading')
        `);

        const [teachers] = await db.query("SELECT id FROM teachers ORDER BY id ASC");
        const [tLan, tMike, tHoa, tDavid, tThuy] = teachers.map(t => t.id);

        // Students
        await db.query(`
            INSERT INTO users (id, email, password_hash, full_name, role_id) VALUES 
            (7,  'student_an@np.edu.vn',    ?, 'Nguyễn Văn An',    5),
            (8,  'student_binh@np.edu.vn',  ?, 'Trần Thị Bình',    5),
            (9,  'student_cam@np.edu.vn',   ?, 'Lê Hoàng Cầm',     5),
            (10, 'student_dung@np.edu.vn',  ?, 'Phạm Minh Dũng',   5),
            (11, 'student_em@np.edu.vn',    ?, 'Võ Thị Hồng Em',   5),
            (12, 'student_phuc@np.edu.vn',  ?, 'Hoàng Gia Phúc',   5),
            (13, 'student_giang@np.edu.vn', ?, 'Đặng Thùy Giang',  5),
            (14, 'student_hieu@np.edu.vn',  ?, 'Bùi Trung Hiếu',   5),
            (15, 'student_khoa@np.edu.vn',  ?, 'Trương Đăng Khoa', 5),
            (16, 'student_linh@np.edu.vn',  ?, 'Mai Ngọc Linh',    5)
        `, Array(10).fill(hashPass));

        await db.query(`
            INSERT INTO students (user_id, phone, parent_phone) VALUES 
            (7,  '0901111111', '0901111112'),
            (8,  '0902222221', '0902222222'),
            (9,  '0903333331', '0903333332'),
            (10, '0904444441', '0904444442'),
            (11, '0905555551', '0905555552'),
            (12, '0906666661', '0906666662'),
            (13, '0907777771', '0907777772'),
            (14, '0908888881', '0908888882'),
            (15, '0909999991', '0909999992'),
            (16, '0900000001', '0900000002')
        `);

        const [students] = await db.query("SELECT id FROM students ORDER BY id ASC");
        const [sAn, sBinh, sCam, sDung, sEm, sPhuc, sGiang, sHieu, sKhoa, sLinh] = students.map(s => s.id);

        // 4. Tạo Classes (Có course_id)
        console.log("-> Đang tạo Lớp Học...");
        await db.query(`
            INSERT INTO classes (id, class_code, class_name, course_id, branch_id, teacher_id, start_date, session_time) VALUES 
            (1, 'IELTS-INT-70', 'IELTS Intensive 7.0', 2, 1, ${tMike}, DATE_SUB(CURDATE(), INTERVAL 30 DAY), 'T2, T4, T6 18:00-20:00'),
            (2, 'TOEIC-CT-600', 'TOEIC Cấp Tốc 600+', 3, 2, ${tLan}, DATE_SUB(CURDATE(), INTERVAL 30 DAY), 'T3, T5 19:00-21:00'),
            (3, 'GT-CB-A2', 'Giao Tiếp Cơ Bản A2', 5, 3, ${tHoa}, DATE_SUB(CURDATE(), INTERVAL 15 DAY), 'T7, CN 08:00-10:00'),
            (4, 'GRAM-B1B2', 'Grammar Master B1-B2', 6, 1, ${tDavid}, DATE_SUB(CURDATE(), INTERVAL 20 DAY), 'T2, T4 14:00-16:00'),
            (5, 'IELTS-WR-12', 'IELTS Writing Task 1 & 2', 2, 4, ${tThuy}, DATE_SUB(CURDATE(), INTERVAL 10 DAY), 'T3, T5 14:00-16:30'),
            (6, 'TOEIC-SW', 'TOEIC Speaking & Writing', 4, 2, ${tLan}, DATE_SUB(CURDATE(), INTERVAL 12 DAY), 'T6 19:00-21:00'),
            (7, 'IPA-PA', 'Phát Âm Chuẩn IPA', 5, 3, ${tHoa}, DATE_SUB(CURDATE(), INTERVAL 7 DAY), 'T7 14:00-16:00'),
            (8, 'IELTS-FD-56', 'IELTS Foundation 5.0-6.0', 1, 4, ${tMike}, DATE_SUB(CURDATE(), INTERVAL 14 DAY), 'T2, T4 09:00-11:00')
        `);
        const c1 = 1, c2 = 2, c3 = 3, c4 = 4, c5 = 5, c6 = 6, c7 = 7, c8 = 8;

        // 5. Enrollments
        console.log("-> Đang ghi danh học sinh...");
        await db.query(`
            INSERT INTO enrollments (student_id, class_id, enroll_date) VALUES 
            (${sAn}, ${c1}, DATE_SUB(CURDATE(), INTERVAL 30 DAY)), (${sBinh}, ${c1}, DATE_SUB(CURDATE(), INTERVAL 28 DAY)), (${sCam}, ${c1}, DATE_SUB(CURDATE(), INTERVAL 25 DAY)), (${sDung}, ${c1}, DATE_SUB(CURDATE(), INTERVAL 20 DAY)),
            (${sBinh}, ${c2}, DATE_SUB(CURDATE(), INTERVAL 30 DAY)), (${sCam}, ${c2}, DATE_SUB(CURDATE(), INTERVAL 27 DAY)), (${sEm}, ${c2}, DATE_SUB(CURDATE(), INTERVAL 26 DAY)), (${sPhuc}, ${c2}, DATE_SUB(CURDATE(), INTERVAL 22 DAY)), (${sGiang}, ${c2}, DATE_SUB(CURDATE(), INTERVAL 18 DAY)),
            (${sDung}, ${c3}, DATE_SUB(CURDATE(), INTERVAL 15 DAY)), (${sEm}, ${c3}, DATE_SUB(CURDATE(), INTERVAL 14 DAY)), (${sHieu}, ${c3}, DATE_SUB(CURDATE(), INTERVAL 12 DAY)),
            (${sAn}, ${c4}, DATE_SUB(CURDATE(), INTERVAL 20 DAY)), (${sPhuc}, ${c4}, DATE_SUB(CURDATE(), INTERVAL 18 DAY)), (${sKhoa}, ${c4}, DATE_SUB(CURDATE(), INTERVAL 17 DAY)), (${sLinh}, ${c4}, DATE_SUB(CURDATE(), INTERVAL 15 DAY)),
            (${sGiang}, ${c5}, DATE_SUB(CURDATE(), INTERVAL 10 DAY)), (${sHieu}, ${c5}, DATE_SUB(CURDATE(), INTERVAL 9 DAY)), (${sKhoa}, ${c5}, DATE_SUB(CURDATE(), INTERVAL 8 DAY)),
            (${sLinh}, ${c6}, DATE_SUB(CURDATE(), INTERVAL 12 DAY)), (${sAn}, ${c6}, DATE_SUB(CURDATE(), INTERVAL 10 DAY)), (${sDung}, ${c6}, DATE_SUB(CURDATE(), INTERVAL 8 DAY)),
            (${sEm}, ${c7}, DATE_SUB(CURDATE(), INTERVAL 7 DAY)), (${sBinh}, ${c7}, DATE_SUB(CURDATE(), INTERVAL 6 DAY)), (${sPhuc}, ${c7}, DATE_SUB(CURDATE(), INTERVAL 5 DAY)), (${sLinh}, ${c7}, DATE_SUB(CURDATE(), INTERVAL 4 DAY)),
            (${sKhoa}, ${c8}, DATE_SUB(CURDATE(), INTERVAL 14 DAY)), (${sHieu}, ${c8}, DATE_SUB(CURDATE(), INTERVAL 12 DAY)), (${sCam}, ${c8}, DATE_SUB(CURDATE(), INTERVAL 10 DAY)), (${sGiang}, ${c8}, DATE_SUB(CURDATE(), INTERVAL 8 DAY))
        `);

        // 6. Class Sessions
        console.log("-> Đang tạo lịch học...");
        await db.query(`
            INSERT INTO class_sessions (class_id, session_date, start_time, end_time) VALUES 
            -- Lớp c1: Có buổi học trong tuần này
            (${c1}, DATE_ADD(DATE(NOW() - INTERVAL WEEKDAY(NOW()) DAY), INTERVAL 0 DAY), '18:00:00', '20:00:00'), 
            (${c1}, DATE_ADD(DATE(NOW() - INTERVAL WEEKDAY(NOW()) DAY), INTERVAL 1 DAY), '18:00:00', '20:00:00'),
            
            -- Lớp c2: Có buổi học trong tháng này (ngày 2 của tháng)
            (${c2}, CONCAT(YEAR(CURDATE()), '-', LPAD(MONTH(CURDATE()), 2, '0'), '-02'), '19:00:00', '21:00:00'),
            (${c2}, CONCAT(YEAR(CURDATE()), '-', LPAD(MONTH(CURDATE()), 2, '0'), '-03'), '19:00:00', '21:00:00'),
            
            -- Lớp c3: Có buổi học trong năm nay (tháng 1)
            (${c3}, CONCAT(YEAR(CURDATE()), '-01-10'), '08:00:00', '10:00:00'),
            (${c3}, CONCAT(YEAR(CURDATE()), '-01-12'), '08:00:00', '10:00:00'),
            
            -- Lớp c4: Trải đều
            (${c4}, DATE_ADD(DATE(NOW() - INTERVAL WEEKDAY(NOW()) DAY), INTERVAL 2 DAY), '14:00:00', '16:00:00'),
            (${c4}, CONCAT(YEAR(CURDATE()), '-', LPAD(MONTH(CURDATE()), 2, '0'), '-04'), '14:00:00', '16:00:00'),
            (${c4}, CONCAT(YEAR(CURDATE()), '-01-15'), '14:00:00', '16:00:00')
        `);

        const [sessions] = await db.query("SELECT id, class_id FROM class_sessions ORDER BY id ASC");

        // 7. Attendance
        console.log("-> Đang tạo điểm danh...");
        const attendanceValues = [];
        // Cố định status để dễ test thay vì random (hoặc random tỉ lệ cao Present)
        for (const sess of sessions) {
            let sids = [];
            if (sess.class_id === c1) sids = [sAn, sBinh, sCam, sDung];
            if (sess.class_id === c2) sids = [sBinh, sCam, sEm, sPhuc, sGiang];
            if (sess.class_id === c3) sids = [sDung, sEm, sHieu];
            if (sess.class_id === c4) sids = [sAn, sPhuc, sKhoa, sLinh];
            
            for (const sid of sids) {
                // Giả lập vắng mặt một số buổi
                const status = (sid === sBinh && sess.class_id === c2) ? 'Absent' : 'Present';
                attendanceValues.push(`(${sess.id}, ${sid}, '${status}')`);
            }
        }
        if (attendanceValues.length > 0) {
            await db.query(`INSERT INTO attendance (session_id, student_id, status) VALUES ${attendanceValues.join(', ')}`);
        }

        // 8. Homework (Thêm bài tập ở các khoảng thời gian khác nhau)
        console.log("-> Đang tạo bài tập...");
        await db.query(`
            INSERT INTO homework (id, class_id, title, description, start_date, start_time, due_date, due_time, attachment_url) VALUES 
            -- Tuần này
            (1, ${c1}, 'IELTS Reading - Week Test', 'Test tuần này', DATE_ADD(DATE(NOW() - INTERVAL WEEKDAY(NOW()) DAY), INTERVAL 0 DAY), '08:00:00', DATE_ADD(DATE(NOW() - INTERVAL WEEKDAY(NOW()) DAY), INTERVAL 3 DAY), '23:59:00', 'https://docs.np.edu.vn/sample-hw.pdf'),
            (2, ${c4}, 'Grammar - Week Test', 'Test ngữ pháp', DATE_ADD(DATE(NOW() - INTERVAL WEEKDAY(NOW()) DAY), INTERVAL 1 DAY), '09:00:00', DATE_ADD(DATE(NOW() - INTERVAL WEEKDAY(NOW()) DAY), INTERVAL 4 DAY), '23:59:00', ''),
            
            -- Tháng này (hạn nộp vào ngày 5 của tháng)
            (3, ${c2}, 'TOEIC Part 5 - Month Test', 'Bài tập tháng', CONCAT(YEAR(CURDATE()), '-', LPAD(MONTH(CURDATE()), 2, '0'), '-01'), '14:00:00', CONCAT(YEAR(CURDATE()), '-', LPAD(MONTH(CURDATE()), 2, '0'), '-05'), '23:59:00', ''),
            (4, ${c4}, 'Listening - Month Test', 'Luyện nghe tháng', CONCAT(YEAR(CURDATE()), '-', LPAD(MONTH(CURDATE()), 2, '0'), '-02'), '08:00:00', CONCAT(YEAR(CURDATE()), '-', LPAD(MONTH(CURDATE()), 2, '0'), '-06'), '23:59:00', ''),
            
            -- Năm nay (hạn nộp vào tháng 1)
            (5, ${c3}, 'Writing - Year Test', 'Bài viết đầu năm', CONCAT(YEAR(CURDATE()), '-01-05'), '10:00:00', CONCAT(YEAR(CURDATE()), '-01-10'), '23:59:00', ''),
            (6, ${c4}, 'Speaking - Year Test', 'Ghi âm đầu năm', CONCAT(YEAR(CURDATE()), '-01-12'), '15:00:00', CONCAT(YEAR(CURDATE()), '-01-18'), '20:00:00', '')
        `);

        // 9. Submissions (Phân bố điểm để thấy sự khác biệt)
        console.log("-> Đang tạo bài nộp...");
        await db.query(`
            INSERT INTO submissions (homework_id, student_id, file_url, score, feedback, submitted_at) VALUES 
            -- Bài tuần này
            (1, ${sAn}, 'https://submit.np.edu.vn/an_hw1.pdf', 9.0, 'Xuất sắc!', DATE_ADD(DATE(NOW() - INTERVAL WEEKDAY(NOW()) DAY), INTERVAL 2 DAY)),
            (1, ${sBinh}, 'https://submit.np.edu.vn/binh_hw1.pdf', 5.5, 'Cần cố gắng', DATE_ADD(DATE(NOW() - INTERVAL WEEKDAY(NOW()) DAY), INTERVAL 2 DAY)),
            (2, ${sAn}, 'https://submit.np.edu.vn/an_hw2.pdf', 8.5, 'Rất tốt', DATE_ADD(DATE(NOW() - INTERVAL WEEKDAY(NOW()) DAY), INTERVAL 3 DAY)),
            
            -- Bài tháng này
            (3, ${sBinh}, 'https://submit.np.edu.vn/binh_hw3.pdf', 7.0, 'Khá tốt.', CONCAT(YEAR(CURDATE()), '-', LPAD(MONTH(CURDATE()), 2, '0'), '-04')),
            (3, ${sEm}, 'https://submit.np.edu.vn/em_hw3.pdf', 8.0, 'Nắm vững kiến thức.', CONCAT(YEAR(CURDATE()), '-', LPAD(MONTH(CURDATE()), 2, '0'), '-04')),
            (4, ${sAn}, 'https://submit.np.edu.vn/an_hw4.pdf', 6.0, 'Nghe còn yếu.', CONCAT(YEAR(CURDATE()), '-', LPAD(MONTH(CURDATE()), 2, '0'), '-05')),
            
            -- Bài năm nay
            (5, ${sDung}, 'https://submit.np.edu.vn/dung_hw5.pdf', 6.5, 'Bài viết khá.', CONCAT(YEAR(CURDATE()), '-01-08')),
            (6, ${sAn}, 'https://submit.np.edu.vn/an_hw6.pdf', 9.5, 'Phát âm cực tốt.', CONCAT(YEAR(CURDATE()), '-01-15'))
        `);

        // 10. Learning Materials
        console.log("-> Đang tạo tài liệu học tập...");
        await db.query(`
            INSERT INTO learning_materials (class_id, name, type, url, description) VALUES 
            (${c1}, 'Sách IELTS Cambridge 17 PDF', 'PDF', 'https://docs.np.edu.vn/cam17.pdf', 'Giáo trình gốc'),
            (${c1}, 'Chiến thuật làm Reading', 'Video', 'https://youtu.be/sample1', 'Hướng dẫn xử lý bài khó'),
            (${c2}, 'Từ vựng TOEIC Mới Nhất', 'PDF', 'https://docs.np.edu.vn/toeic.pdf', 'Từ vựng trọng tâm')
        `);

        console.log("\n✅ ĐÃ HOÀN TẤT SEED DATA! FULL DỮ LIỆU MẪU CHO TẤT CẢ CÁC BẢNG 🎉");
        console.log(`
📊 Tổng kết dữ liệu:
   - 6 Courses, 8 Classes
   - 1 Admin, 5 Teachers, 10 Students
   - 6 Homework (có start_time/due_time)
   - 6 Submissions (có điểm, feedback, submitted_at)
   - Đã xử lý đầy đủ cấu trúc mới.

👉 Tài khoản Test (Password: 123456):
   - Admin: admin@np.edu.vn
   - Teacher: teacher_mike@np.edu.vn
   - Student: student_an@np.edu.vn
        `);

    } catch (err) {
        console.error("❌ Lỗi nhồi dữ liệu mồi:", err.message);
    } finally {
        process.exit();
    }
}

seedDummyData();
