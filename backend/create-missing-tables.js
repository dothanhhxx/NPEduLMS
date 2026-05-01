require('dotenv').config();
const pool = require('./config/db');

const tables = [
    {
        name: 'progress_records',
        sql: `
            CREATE TABLE IF NOT EXISTS progress_records (
                id INT AUTO_INCREMENT PRIMARY KEY,
                student_id INT NOT NULL,
                class_id INT NOT NULL,
                feedback TEXT,
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
            );
        `
    },
    {
        name: 'materials',
        sql: `
            CREATE TABLE IF NOT EXISTS materials (
                id INT AUTO_INCREMENT PRIMARY KEY,
                class_id INT NOT NULL,
                title VARCHAR(255) NOT NULL,
                file_url VARCHAR(500) NOT NULL,
                uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE
            );
        `
    },
    {
        name: 'homework',
        sql: `
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
        `
    },
    {
        name: 'submissions',
        sql: `
            CREATE TABLE IF NOT EXISTS submissions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                homework_id INT NOT NULL,
                student_id INT NOT NULL,
                file_url VARCHAR(500) NOT NULL,
                score FLOAT DEFAULT NULL,
                submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (homework_id) REFERENCES homework(id) ON DELETE CASCADE,
                FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
                UNIQUE KEY (homework_id, student_id)
            );
        `
    }
];

async function createMissingTables() {
    console.log('=== TẠO CÁC BẢNG CÒN THIẾU TRÊN TIDB CLOUD ===');
    try {
        for (const table of tables) {
            try {
                await pool.query(table.sql);
                console.log(`[OK] Bảng '${table.name}' đã sẵn sàng.`);
            } catch (err) {
                console.error(`[LỖI] Bảng '${table.name}':`, err.message);
            }
        }
        console.log('\n=== HOÀN TẤT! Hãy chạy: node seed-data.js --force ===');
    } catch (err) {
        console.error('Lỗi kết nối:', err.message);
    } finally {
        pool.end();
    }
}

createMissingTables();
