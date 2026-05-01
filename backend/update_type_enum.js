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

        console.log('Connected to DB. Updating ENUM for learning_materials table...');

        await db.query(`
            ALTER TABLE learning_materials 
            MODIFY COLUMN type ENUM('PDF', 'Video', 'Slide', 'Word') NOT NULL;
        `);
        console.log('learning_materials ENUM updated successfully.');
        process.exit(0);
    } catch(e) {
        console.error('Error:', e);
        process.exit(1);
    }
}
run();
