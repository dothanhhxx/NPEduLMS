-- Khởi tạo Database NP_Education
CREATE DATABASE IF NOT EXISTS np_education DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE np_education;

-- 1. Bảng Phân quyền
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE
);


-- 2. Bảng Người dùng chung
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE RESTRICT
);

-- 3. Bảng Học sinh (Mở rộng từ users)
CREATE TABLE IF NOT EXISTS students (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    phone VARCHAR(20),
    parent_phone VARCHAR(20),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 4. Bảng Giáo viên (Mở rộng từ users)
CREATE TABLE IF NOT EXISTS teachers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL UNIQUE,
    specialized_subject VARCHAR(100),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Bảng Chi nhánh Trung tâm
CREATE TABLE IF NOT EXISTS branches (
    id INT AUTO_INCREMENT PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL,
    address VARCHAR(255)
);

-- 5.1 Bảng Khóa học (Mới - US7)
CREATE TABLE IF NOT EXISTS courses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- 6. Bảng Lớp học (Cập nhật - US7)
CREATE TABLE IF NOT EXISTS classes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_code VARCHAR(50) UNIQUE NOT NULL,
    class_name VARCHAR(100) NOT NULL,
    course_id INT,
    branch_id INT NOT NULL,
    teacher_id INT NOT NULL,
    start_date DATE NOT NULL,
    session_time VARCHAR(100) NOT NULL,
    status ENUM('active', 'upcoming', 'closed') DEFAULT 'active',
    max_students INT DEFAULT 25,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE RESTRICT,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

-- 7. Bảng Ghi danh (Học sinh - Lớp học)
CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    enroll_date DATE NOT NULL,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
    UNIQUE KEY (student_id, class_id) -- Một học sinh không thể vào cùng 1 lớp 2 lần
);

-- 8. Bảng Thời khóa biểu (Các buổi học)
CREATE TABLE IF NOT EXISTS class_sessions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room VARCHAR(100) DEFAULT 'Phòng học 1',
    status ENUM('Scheduled', 'Completed', 'Cancelled') DEFAULT 'Scheduled',
    session_type ENUM('Theory', 'Practice', 'Test') DEFAULT 'Theory',
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- 9. Bảng Tài liệu bài giảng
CREATE TABLE IF NOT EXISTS materials (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- Thêm dữ liệu mẫu cho materials
INSERT INTO materials (class_id, title, file_url) VALUES 
(1, 'Bài 1: Giới thiệu về ReactJS', 'https://example.com/videos/react-intro.mp4'),
(1, 'Tài liệu đọc Bài 1 (React Core)', 'https://example.com/pdf/react-core.pdf'),
(1, 'Slide thuyết trình State & Props', 'https://example.com/slides/state-props.pdf');


-- 10. Bảng Điểm danh
CREATE TABLE IF NOT EXISTS attendance (
    id INT AUTO_INCREMENT PRIMARY KEY,
    session_id INT NOT NULL,
    student_id INT NOT NULL,
    status ENUM('Present', 'Absent', 'Late') NOT NULL,
    FOREIGN KEY (session_id) REFERENCES class_sessions(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY (session_id, student_id) -- 1 học sinh chỉ có 1 status điểm danh / 1 buổi
);

-- 11. Bảng Bài tập
CREATE TABLE IF NOT EXISTS homework (
    id INT AUTO_INCREMENT PRIMARY KEY,
    class_id INT NOT NULL,
    title VARCHAR(255) NOT NULL,
    description VARCHAR(255) NOT NULL DEFAULT '',
    start_date DATE NOT NULL DEFAULT (CURRENT_DATE),
    due_date DATE NOT NULL,
    due_time TIME NOT NULL DEFAULT '23:59:59',
    attachment_url VARCHAR(500) NOT NULL DEFAULT '',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- 12. Bảng Nộp bài tập
CREATE TABLE IF NOT EXISTS submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    homework_id INT NOT NULL,
    student_id INT NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    score FLOAT DEFAULT NULL,
    submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (homework_id) REFERENCES homework(id) ON DELETE CASCADE,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    UNIQUE KEY (homework_id, student_id) -- Mỗi bài tập học sinh nộp 1 lần (hoặc có thể update url)
);

-- 13. Bảng Tiến độ / Đánh giá
CREATE TABLE IF NOT EXISTS progress_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    class_id INT NOT NULL,
    feedback TEXT,
    recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
);

-- Chèn dữ liệu mồi (Seed Data) cho Roles để chuẩn bị khởi tạo user
INSERT INTO roles (role_name) VALUES 
('Admin'), 
('Academic Staff'), 
('Customer Service'), 
('Teacher'), 
('Student');

-- 15. Chèn dữ liệu mẫu cho Khóa học
INSERT INTO courses (course_name, description) VALUES 
('IELTS Foundation', 'Cơ bản về IELTS'), 
('IELTS Intensive', 'Luyện thi IELTS chuyên sâu'), 
('General English', 'Tiếng Anh tổng quát');
