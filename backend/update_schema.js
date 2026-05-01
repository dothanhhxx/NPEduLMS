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

        console.log('Connected to DB. Fixing schema...');

        // 1. Create courses table if not exists
        await db.query(`
            CREATE TABLE IF NOT EXISTS courses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_name VARCHAR(255) NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        console.log('Checked courses table.');

        // 2. Add missing fields to classes table
        try {
            await db.query(`ALTER TABLE classes ADD COLUMN class_code VARCHAR(50)`);
            console.log('Added class_code to classes');
        } catch(e) { if(e.code !== 'ER_DUP_FIELDNAME') throw e; }

        try {
            await db.query(`ALTER TABLE classes ADD COLUMN course_id INT`);
            console.log('Added course_id to classes');
        } catch(e) { if(e.code !== 'ER_DUP_FIELDNAME') throw e; }

        try {
            await db.query(`ALTER TABLE classes ADD COLUMN start_date DATE`);
            console.log('Added start_date to classes');
        } catch(e) { if(e.code !== 'ER_DUP_FIELDNAME') throw e; }

        try {
            await db.query(`ALTER TABLE classes ADD COLUMN session_time VARCHAR(100)`);
            console.log('Added session_time to classes');
        } catch(e) { if(e.code !== 'ER_DUP_FIELDNAME') throw e; }

        // 3. Add missing session_type to class_sessions
        try {
            await db.query(`ALTER TABLE class_sessions ADD COLUMN session_type VARCHAR(50) DEFAULT 'Theory'`);
            console.log('Added session_type to class_sessions');
        } catch(e) { if(e.code !== 'ER_DUP_FIELDNAME') throw e; }

        console.log('Database schema successfully synchronized!');
        process.exit(0);
    } catch(e) {
        console.error(e);
        process.exit(1);
    }
}
run();
