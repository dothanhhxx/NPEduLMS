require('dotenv').config();
const db = require('./config/db');

async function testPhase3() {
    console.log("=== BẮT ĐẦU TEST PHASE 3: MASTER DATA API ===");

    try {
        const ts = Date.now();
        const adminEmail = `admin_${ts}@np.edu.vn`;
        const teacherEmail = `teacher_${ts}@np.edu.vn`;
        const studentEmail = `student_${ts}@np.edu.vn`;

        // 1. Seed Branch (Tạo đại một chi nhánh để có branch_id)
        await db.query("INSERT IGNORE INTO branches (id, branch_name, address) VALUES (1, 'Cơ sở Quận 1', '123 Nguyễn Huệ')");
        console.log("[Seed] Đã đảm bảo tồn tại Chi nhánh (Branch ID: 1)");

        // 2. Tạo 3 Account (Admin, Teacher, Student) qua API
        await fetch('http://localhost:5000/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: adminEmail, password: '123', full_name: 'Admin Test', role_name: 'Admin' })
        });
        await fetch('http://localhost:5000/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: teacherEmail, password: '123', full_name: 'Teacher Test', role_name: 'Teacher' })
        });
        await fetch('http://localhost:5000/api/users/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: studentEmail, password: '123', full_name: 'Student Test', role_name: 'Student', phone: '0909' })
        });

        // 3. Truy vấn Database để lấy được ID trực tiếp của Giáo Viên và Học sinh
        const [teachers] = await db.query(`SELECT t.id FROM teachers t JOIN users u ON t.user_id = u.id WHERE u.email = ?`, [teacherEmail]);
        const teacherId = teachers[0].id;

        const [students] = await db.query(`SELECT s.id FROM students s JOIN users u ON s.user_id = u.id WHERE u.email = ?`, [studentEmail]);
        const studentId = students[0].id;

        console.log(`[Seed] Đã khởi tạo thành công Teacher (ID: ${teacherId}) và Student (ID: ${studentId})`);

        // 4. Đăng nhập với quyền Admin để lấy Token bảo mật
        console.log("\n[Auth] Admin đăng nhập để lấy JWT Token...");
        const loginRes = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: adminEmail, password: '123' })
        });
        const loginData = await loginRes.json();
        const adminToken = loginData.token;
        console.log("-> ✅ Admin Token:", adminToken.substring(0, 30) + '...');

        // 5. API POST /api/classes (Tạo Lớp Học)
        console.log("\n[API] Bắt đầu gọi POST /api/classes (Tạo Lớp Học Mới)...");
        const createClassRes = await fetch('http://localhost:5000/api/classes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ class_name: `Lớp IELTS Cấp tốc ${ts}`, branch_id: 1, teacher_id: teacherId })
        });
        const classData = await createClassRes.json();
        console.log("-> Kết quả trả về:", classData);
        const classId = classData.data ? classData.data.classId : null;

        if (classId) {
            // 6. API Nhưng thiếu quyền (Dùng Token Student để tạo lớp xem có bị cấm không)
            console.log("\n[Security] Thử thách: Đăng nhập bằng Student rồi đòi xóa lớp...");
            const stuLoginRes = await fetch('http://localhost:5000/api/auth/login', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: studentEmail, password: '123' })
            });
            const stuData = await stuLoginRes.json();
            const badReqRes = await fetch(`http://localhost:5000/api/classes/${classId}`, {
                method: 'DELETE', headers: { 'Authorization': `Bearer ${stuData.token}` }
            });
            const badResData = await badReqRes.json();
            console.log("-> Kết quả mưu đồ học sinh:", badResData);

            // 7. Ghi danh sinh viên vào lớp qua Database (Giả lập chức năng Enrol)
            await db.query("INSERT IGNORE INTO enrollments (student_id, class_id, enroll_date) VALUES (?, ?, CURDATE())", [studentId, classId]);
            console.log(`\n[Seed] Đã giả lập Hành động Học sinh (${studentId}) đóng tiền vào Lớp (${classId}) thành công.`);

            // 8. Lấy toàn bộ danh sách lớp học
            console.log("\n[API] Quét thông tin qua GET /api/classes...");
            const getClassesRes = await fetch('http://localhost:5000/api/classes', {
                method: 'GET', headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            const allClasses = await getClassesRes.json();
            console.log("-> Danh sách Lớp: Dữ liệu lấy về cực dài nên chỉ show ra thông báo:");
            console.table(allClasses.data);

            // 9. Lấy danh sách Học sinh có trong lớp đó
            console.log(`\n[API] Danh sách Sĩ số lớp (ID = ${classId}) qua GET /api/classes/${classId}/students`);
            const getStudentsRes = await fetch(`http://localhost:5000/api/classes/${classId}/students`, {
                method: 'GET', headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            const classStudents = await getStudentsRes.json();
            console.log("-> Danh sách Học sinh:");
            console.table(classStudents.data);
        }

    } catch (err) {
        console.error("❌ Lỗi Test:", err.message);
    } finally {
        process.exit();
    }
}

testPhase3();
