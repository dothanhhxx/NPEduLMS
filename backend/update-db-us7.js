const mysql = require('mysql2/promise');
require('dotenv').config();

async function update() {
    console.log('Connecting to database...');
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        console.log('Creating courses table...');
        await db.query(`
            CREATE TABLE IF NOT EXISTS courses (
                id INT AUTO_INCREMENT PRIMARY KEY,
                course_name VARCHAR(100) NOT NULL UNIQUE,
                description TEXT
            )
        `);

        console.log('Adding columns to classes table...');
        // Using multiple queries for safety
        const columns = [
            { name: 'class_code', type: 'VARCHAR(50) UNIQUE', after: 'id' },
            { name: 'course_id', type: 'INT', after: 'class_code' },
            { name: 'start_date', type: 'DATE', after: 'teacher_id' },
            { name: 'session_time', type: 'VARCHAR(100)', after: 'start_date' }
        ];

        for (const col of columns) {
            try {
                await db.query(`ALTER TABLE classes ADD COLUMN ${col.name} ${col.type} AFTER ${col.after}`);
                console.log(`Added column ${col.name}`);
            } catch (err) {
                if (err.code === 'ER_DUP_COLUMN_NAME') {
                    console.log(`Column ${col.name} already exists`);
                } else {
                    throw err;
                }
            }
        }

        console.log('Adding foreign key constraint...');
        try {
            await db.query(`ALTER TABLE classes ADD CONSTRAINT fk_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL`);
        } catch (err) {
            console.log('Foreign key might already exist or failed:', err.message);
        }

        console.log('Seeding courses...');
        await db.query(`
            INSERT IGNORE INTO courses (course_name, description) VALUES 
            ("IELTS Foundation", "Cơ bản về IELTS"), 
            ("IELTS Intensive", "Luyện thi IELTS chuyên sâu"), 
            ("General English", "Tiếng Anh tổng quát")
        `);

        console.log("Database updated successfully");
    } catch (error) {
        console.error("Error updating database:", error);
    } finally {
        await db.end();
    }
}

update();
