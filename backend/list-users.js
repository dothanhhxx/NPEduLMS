const mysql = require('mysql2/promise');
require('dotenv').config();

async function listUsers() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [rows] = await db.query(`
            SELECT u.id, u.email, u.full_name, r.role_name 
            FROM users u 
            JOIN roles r ON u.role_id = r.id
            ORDER BY u.id ASC
        `);
        console.log(JSON.stringify(rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await db.end();
    }
}

listUsers();
