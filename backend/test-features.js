require('dotenv').config();
const db = require('./config/db');

async function testPhase4() {
    console.log("=== BẮT ĐẦU TEST PHASE 4: TÀI LIỆU & LỊCH HỌC ===");

    try {
        const ts = Date.now();
        const adminEmail = `admin_features_${ts}@np.edu.vn`;
        const studentEmail = `student_features_${ts}@np.edu.vn`;

        // 1. Tạo 2 Account (Admin, Student)
        await fetch('http://localhost:5000/api/users/register', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: adminEmail, password: '123', full_name: 'Admin FS', role_name: 'Admin' })
        });
        await fetch('http://localhost:5000/api/users/register', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: studentEmail, password: '123', full_name: 'Student FS', role_name: 'Student' })
        });

        const [students] = await db.query(`SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.email = ?`, [studentEmail]);
        const studentId = students[0].id;

        // 2. Admin đăng nhập
        const adminLogin = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: adminEmail, password: '123' })
        });
        const adminToken = (await adminLogin.json()).token;

        // 3. Đảm bảo nhánh và giáo viên tồn tại để tạo lớp
        await db.query("INSERT IGNORE INTO branches (id, branch_name) VALUES (1, 'CS1')");
        const [teachers] = await db.query("SELECT id FROM teachers LIMIT 1"); // Giả sử đã có từ bài test trước
        const teacherId = teachers.length > 0 ? teachers[0].id : 1;

        // 4. Admin Tạo Lớp Học
        const classRes = await fetch('http://localhost:5000/api/classes', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
            body: JSON.stringify({ class_name: `Lớp Test Tính năng ${ts}`, branch_id: 1, teacher_id: teacherId })
        });
        const classId = (await classRes.json()).data.classId;

        console.log(`\n[Feature] Đã tạo Lớp Học Mới: ID = ${classId}`);

        // 5. Thêm Buổi Học (Schedules)
        await fetch('http://localhost:5000/api/schedules', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
            body: JSON.stringify({ class_id: classId, session_date: '2026-03-15', start_time: '18:00', end_time: '20:00' })
        });
        console.log("[Feature] Đã nhét 1 buổi học vào Thời Khóa Biểu (Ngày 15/03) !");

        // 6. Tải Tài liệu lên (Materials)
        await fetch('http://localhost:5000/api/materials', {
            method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${adminToken}` },
            body: JSON.stringify({ class_id: classId, title: 'Slide Bài 1: Nhập môn', file_url: 'https://docs.np.edu.vn/slide1.pdf' })
        });
        console.log("[Feature] Đã Upload Tài liệu: Slide Bài 1 !");

        // 7. Học sinh Đăng nhập & Check Quyền
        console.log("\n[Feature] 👉 Học Sinh Đăng nhập để test quyền xem...");
        const stuLogin = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: studentEmail, password: '123' })
        });
        const stuToken = (await stuLogin.json()).token;

        // 7.1 Thử tải lịch học khi CHƯA ghi danh (Sẽ rỗng)
        const emptySched = await fetch('http://localhost:5000/api/schedules', { headers: { 'Authorization': `Bearer ${stuToken}` } });
        console.log("-> Lịch học khi CHƯA GI DANH:", (await emptySched.json()).data.length, "buổi học.");

        // 7.2 Thử xem tài liệu khi CHƯA ghi danh (Sẽ báo lỗi 403)
        const emptyMat = await fetch(`http://localhost:5000/api/materials/classes/${classId}`, { headers: { 'Authorization': `Bearer ${stuToken}` } });
        console.log("-> Xem Tài liệu khi CHƯA GI DANH:", await emptyMat.json());

        // 8. ĐÓNG TIỀN GHI DANH
        await db.query("INSERT INTO enrollments (student_id, class_id, enroll_date) VALUES (?, ?, CURDATE())", [studentId, classId]);
        console.log("\n[Feature] 💰 Học Sinh Đã đóng tiền Ghi Danh vào lớp !");

        // 9. Check lại quyền hạn sau khi ghi danh
        const fulSched = await fetch('http://localhost:5000/api/schedules', { headers: { 'Authorization': `Bearer ${stuToken}` } });
        console.log("-> Lịch học SAU KHI GHI DANH:", (await fulSched.json()).data[0]);

        const fullMat = await fetch(`http://localhost:5000/api/materials/classes/${classId}`, { headers: { 'Authorization': `Bearer ${stuToken}` } });
        console.log("-> Xem Tài liệu SAU KHI GHI DANH:", (await fullMat.json()).data[0].title, "-", (await fullMat.json()).data[0].file_url);

    } catch (err) {
        console.error("❌ Lỗi Test:", err.message);
    } finally {
        process.exit();
    }
}

testPhase4();
