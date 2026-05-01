require('dotenv').config();
const mysql = require('mysql2/promise');

async function run() {
    try {
        const db = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME
        });

        console.log('Connected to DB. Adding dummy classes...');

        const [branches] = await db.query('SELECT id FROM branches LIMIT 1');
        let branchId = branches.length ? branches[0].id : null;
        if (!branchId) {
            const [res] = await db.query("INSERT INTO branches (branch_name, address) VALUES ('Default Branch', 'Hanoi')");
            branchId = res.insertId;
            console.log('Created branch:', branchId);
        }

        const [teachers] = await db.query('SELECT id FROM teachers LIMIT 1');
        let teacherId = teachers.length ? teachers[0].id : null;
        if (!teacherId) {
            const [userRes] = await db.query("INSERT INTO users (email, password_hash, full_name, role_id) VALUES ('teacher2@np.edu', 'hash', 'Dummy Teacher', 4)");
            const [tRes] = await db.query("INSERT INTO teachers (user_id, specialized_subject) VALUES (?, 'IELTS')", [userRes.insertId]);
            teacherId = tRes.insertId;
            console.log('Created teacher:', teacherId);
        }

        // Add 3 dummy classes
        await db.query(`INSERT INTO classes (class_name, branch_id, teacher_id, status) VALUES 
            ('IELTS Masterclass 7.0', ?, ?, 'active'),
            ('TOEIC Intensive 800+', ?, ?, 'active'),
            ('English Communication Basics', ?, ?, 'active')
        `, [branchId, teacherId, branchId, teacherId, branchId, teacherId]);

        console.log('Dummy classes added successfully!');
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
