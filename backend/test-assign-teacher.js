const classController = require('./controllers/classController');
const db = require('./config/db');

async function runTest() {
    try {
        console.log("=== Bắt đầu Test US5: Assign Teacher ===");

        // Tìm một giáo viên
        const [teachers] = await db.query('SELECT id FROM teachers LIMIT 2');
        if (teachers.length < 2) {
            console.log("Không đủ giáo viên để test. Dừng test.");
            process.exit(1);
        }
        const teacher1 = teachers[0].id;
        const teacher2 = teachers[1].id;

        // Tạo 2 lớp học (cùng ngày bắt đầu và cùng ca học)
        // Lấy dữ liệu cơ sở: branch_id, course_id
        const [branches] = await db.query('SELECT id FROM branches LIMIT 1');
        const [courses] = await db.query('SELECT id FROM courses LIMIT 1');
        const branch_id = branches.length > 0 ? branches[0].id : 1;
        const course_id = courses.length > 0 ? courses[0].id : 1;

        const start_date = '2026-10-10';
        const session_time = 'Chiều (14:00 - 17:00)';

        // Xóa các lớp giả trước đó nếu có
        await db.query('DELETE FROM classes WHERE class_code IN ("TEST1", "TEST2")');

        // Tạo lớp 1
        const [res1] = await db.query(
            'INSERT INTO classes (class_code, class_name, course_id, branch_id, teacher_id, start_date, session_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['TEST1', 'Lớp Test 1', course_id, branch_id, teacher1, start_date, session_time, 'active']
        );
        const class1Id = res1.insertId;

        // Tạo lớp 2 (Tạm phân cho teacher2)
        const [res2] = await db.query(
            'INSERT INTO classes (class_code, class_name, course_id, branch_id, teacher_id, start_date, session_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['TEST2', 'Lớp Test 2', course_id, branch_id, teacher2, start_date, session_time, 'active']
        );
        const class2Id = res2.insertId;

        console.log(`Đã tạo: Lớp TEST1 (ID ${class1Id}, GV ${teacher1}), Lớp TEST2 (ID ${class2Id}, GV ${teacher2})`);
        console.log(`Cả 2 lớp đều học vào ngày ${start_date}, ca ${session_time}`);

        // Bây giờ test Assign Teacher: Thử gán teacher1 (đang dạy TEST1) sang dạy lớp TEST2. Chắc chắn sẽ xung đột!
        console.log("\n--- TEST CASE 1: Xung đột lịch (Trùng lịch dạy) ---");
        const req1 = { body: { teacher_id: teacher1 }, params: { id: class2Id } };
        let resData1 = null;
        let statusCode1 = null;
        const res1Obj = {
            status: function(code) { statusCode1 = code; return this; },
            json: function(data) { resData1 = data; console.log(`[Response] Status: ${statusCode1}, Data:`, data); }
        };
        await classController.assignTeacher(req1, res1Obj);
        
        if (statusCode1 === 400 && resData1.message.includes('trùng')) {
            console.log("✅ TEST CASE 1 PASSED: Hệ thống đã chặn thành công việc giáo viên dạy 2 lớp cùng giờ!");
        } else {
            console.log("❌ TEST CASE 1 FAILED");
        }

        // Test Assign Teacher: Gán teacher2 (đang dạy TEST2) tiếp tục dạy lớp TEST2 (Không thay đổi gì)
        console.log("\n--- TEST CASE 2: Chọn lại giáo viên đang dạy hiện tại ---");
        const req2 = { body: { teacher_id: teacher2 }, params: { id: class2Id } };
        let resData2 = null;
        let statusCode2 = null;
        const res2Obj = {
            status: function(code) { statusCode2 = code; return this; },
            json: function(data) { resData2 = data; console.log(`[Response] Status: ${statusCode2}, Data:`, data); }
        };
        await classController.assignTeacher(req2, res2Obj);
        if (statusCode2 === 400 && resData2.message.includes('đã được phân công')) {
            console.log("✅ TEST CASE 2 PASSED: Bắt lỗi chọn lại chính giáo viên đó!");
        } else {
            console.log("❌ TEST CASE 2 FAILED");
        }


        // Tạo một lớp 3 với giờ khác, rồi gán teacher1 vào lớp 3
        console.log("\n--- TEST CASE 3: Phân công giáo viên hợp lệ (Khác giờ) ---");
        const session_time_new = 'Sáng (08:00 - 11:00)';
        const [res3] = await db.query(
            'INSERT INTO classes (class_code, class_name, course_id, branch_id, teacher_id, start_date, session_time, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            ['TEST3', 'Lớp Test 3', course_id, branch_id, teacher2, start_date, session_time_new, 'active']
        );
        const class3Id = res3.insertId;

        // Thử gán teacher1 (đang dạy chiều) sang dạy TEST3 (Môn Sáng) -> Hợp lệ
        const req3 = { body: { teacher_id: teacher1 }, params: { id: class3Id } };
        let resData3 = null;
        let statusCode3 = null;
        const res3Obj = {
            status: function(code) { statusCode3 = code; return this; },
            json: function(data) { resData3 = data; console.log(`[Response] Status: ${statusCode3}, Data:`, data); }
        };
        await classController.assignTeacher(req3, res3Obj);

        if (statusCode3 === 200 && resData3.message.includes('thành công')) {
            console.log("✅ TEST CASE 3 PASSED: Phân công thành công!");
            
            // Verification in DB
            const [checkDB] = await db.query('SELECT teacher_id FROM classes WHERE id = ?', [class3Id]);
            if(checkDB[0].teacher_id == teacher1) {
                console.log("✅ Cập nhật DB thành công.");
            }
        } else {
            console.log("❌ TEST CASE 3 FAILED");
        }

        // Clean up
        await db.query('DELETE FROM classes WHERE class_code IN ("TEST1", "TEST2", "TEST3")');
        console.log("\n=== Hoàn thành Test. Đã dọn dẹp dữ liệu DB ===");
        process.exit(0);

    } catch (error) {
        console.error("Test có lỗi:", error);
        process.exit(1);
    }
}

runTest();
