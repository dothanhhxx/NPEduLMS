// backend/controllers/studentController.js
const db = require('../config/db');

// --- NGUYỆT TIÊM: Lấy TẤT CẢ học viên để Admin chọn ghi danh (Dùng cho US6) ---
exports.getAllStudents = async (req, res) => {
    try {
        // Query lấy thông tin từ bảng users kết hợp bảng students
        const [rows] = await db.execute(
            `SELECT s.id, u.full_name, u.email, s.phone 
             FROM students s
             JOIN users u ON s.user_id = u.id`
        );

        res.status(200).json(rows); 
        
    } catch (error) {
        console.error("Lỗi lấy danh sách toàn bộ học viên:", error);
        res.status(500).json({ message: "Lỗi máy chủ khi truy vấn danh sách học viên." });
    }
};

exports.getStudentsByClass = async (req, res) => {
    const { classId } = req.params; 

    try {
        // Task 3.2: Truy xuất dữ liệu (Đã sửa lại đúng tên bảng và cột theo SQL)
        const [rows] = await db.execute(
            `SELECT u.id, u.full_name, u.email, s.phone 
             FROM users u
             JOIN students s ON u.id = s.user_id
             JOIN enrollments e ON s.id = e.student_id
             WHERE e.class_id = ?`, 
            [classId]
        );

        // Task 3.3: Xử lý hiển thị
        if (rows.length === 0) {
            return res.status(404).json({ message: "Lớp này chưa có học viên nào ghi danh." });
        }

        res.status(200).json(rows); 
        
    } catch (error) {
        // Log lỗi chi tiết ra terminal để dễ debug
        console.error("Lỗi Database:", error);
        res.status(500).json({ message: "Lỗi kết nối hoặc truy vấn cơ sở dữ liệu." });
    }
};