const classController = require('./controllers/classController');
const db = require('./config/db');

async function testSecurity() {
    try {
        console.log("=== Bắt đầu Test Bảo mật (RBAC): Teacher Xem lớp ===");

        // Lấy 1 class và 1 teacher KHÔNG PHẢI là chủ nhiệm của class đó
        const [classes] = await db.query('SELECT id, teacher_id FROM classes LIMIT 1');
        if (classes.length === 0) {
            console.log("Không có lớp nào để test");
            process.exit(1);
        }
        
        const testClass = classes[0];
        
        const [otherTeachers] = await db.query('SELECT user_id FROM teachers WHERE id != ? LIMIT 1', [testClass.teacher_id]);
        if (otherTeachers.length === 0) {
            console.log("Không tìm thấy giáo viên nào khác để test (cần ít nhất 2 giáo viên).");
            process.exit(1);
        }

        const maliciousTeacherUserId = otherTeachers[0].user_id;

        console.log(`Đang thử dùng Giáo viên (UserID: ${maliciousTeacherUserId}) để truy cập danh sách lớp (ClassID: ${testClass.id}) mà họ KHÔNG dạy...`);

        // Gỉa lập JWT Token Payload
        const mockReq = { 
            params: { id: testClass.id },
            user: { userId: maliciousTeacherUserId, role: 'Teacher' }
        };

        let resData = null;
        let statusCode = null;
        const mockRes = {
            status: function(code) { statusCode = code; return this; },
            json: function(data) { resData = data; console.log(`[Response] Status: ${statusCode}, Data:`, data); }
        };

        await classController.getClassStudents(mockReq, mockRes);

        if (statusCode === 403) {
            console.log("✅ TEST PASSED: Hệ thống đã chặn thành công việc giáo viên xem danh sách học sinh của lớp học khác!");
        } else {
            console.log("❌ TEST FAILED: Giáo viên đã xem lén được danh sách của lớp khác =)");
        }

        process.exit(0);
    } catch (error) {
        console.error("Test Error:", error);
        process.exit(1);
    }
}

testSecurity();
