const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
require('dotenv').config();

async function seedDB() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'np_education'
    });

    try {
        console.log('Starting seed process...');
        
        // Ensure roles exist
        const [roles] = await connection.query('SELECT * FROM roles');
        let teacherRole = roles.find(r => r.role_name === 'Teacher');
        let studentRole = roles.find(r => r.role_name === 'Student');

        if (!teacherRole || !studentRole) {
            await connection.query("INSERT IGNORE INTO roles (role_name) VALUES ('Admin'), ('Academic Staff'), ('Customer Service'), ('Teacher'), ('Student')");
            const [newRoles] = await connection.query('SELECT * FROM roles');
            teacherRole = newRoles.find(r => r.role_name === 'Teacher');
            studentRole = newRoles.find(r => r.role_name === 'Student');
        }

        const defaultPassword = 'password123';
        const hashedPassword = await bcrypt.hash(defaultPassword, 10);

        // Create 1 Branch if none exist
        const [branches] = await connection.query('SELECT * FROM branches');
        let branchId;
        if (branches.length === 0) {
            const [branchResult] = await connection.query("INSERT INTO branches (branch_name, address) VALUES ('Chi nhánh Cơ sở 1', '123 Đường Học Tập')");
            branchId = branchResult.insertId;
        } else {
            branchId = branches[0].id;
        }

        // Create 10 Teachers
        console.log('Creating 10 teachers...');
        const teacherIds = [];
        for (let i = 1; i <= 10; i++) {
            const email = `teacher${Date.now()}_${i}@np.edu.vn`;
            const [userResult] = await connection.query(
                'INSERT INTO users (email, password_hash, full_name, role_id) VALUES (?, ?, ?, ?)',
                [email, hashedPassword, `Giáo viên ${i}`, teacherRole.id]
            );
            const userId = userResult.insertId;
            const [teacherResult] = await connection.query(
                'INSERT INTO teachers (user_id, specialized_subject) VALUES (?, ?)',
                [userId, 'Tiếng Anh']
            );
            teacherIds.push(teacherResult.insertId);
        }

        // Create 100 Students
        console.log('Creating 100 students...');
        const studentIds = [];
        for (let i = 1; i <= 100; i++) {
            const email = `student${Date.now()}_${i}@np.edu.vn`;
            const phone = `09${Math.floor(10000000 + Math.random() * 90000000)}`;
            const [userResult] = await connection.query(
                'INSERT INTO users (email, password_hash, full_name, role_id) VALUES (?, ?, ?, ?)',
                [email, hashedPassword, `Học sinh ${i}`, studentRole.id]
            );
            const userId = userResult.insertId;
            const [studentResult] = await connection.query(
                'INSERT INTO students (user_id, phone) VALUES (?, ?)',
                [userId, phone]
            );
            studentIds.push(studentResult.insertId);
        }

        // Create 5 Classes
        console.log('Creating 5 classes...');
        const classIds = [];
        for (let i = 1; i <= 5; i++) {
            const RandomTeacherId = teacherIds[Math.floor(Math.random() * teacherIds.length)];
            const [classResult] = await connection.query(
                "INSERT INTO classes (class_name, branch_id, teacher_id, status, max_students) VALUES (?, ?, ?, 'active', 25)",
                [`Lớp Tiếng Anh IELTS ${i}`, branchId, RandomTeacherId]
            );
            classIds.push(classResult.insertId);
        }

        // Enroll students into classes (20 students per class)
        console.log('Enrolling students...');
        for (let i = 0; i < studentIds.length; i++) {
            const studentId = studentIds[i];
            const classId = classIds[i % 5]; // distribute evenly
            await connection.query(
                'INSERT INTO enrollments (student_id, class_id, enroll_date) VALUES (?, ?, ?)',
                [studentId, classId, new Date()]
            );
        }

        console.log('Database seeded successfully!');
    } catch (error) {
        console.error('Error seeding DB:', error);
    } finally {
        await connection.end();
    }
}

seedDB();
