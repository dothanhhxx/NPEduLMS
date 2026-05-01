require('dotenv').config();
const db = require('./config/db');

async function testConnection() {
    try {
        const [rows] = await db.query('SELECT * FROM roles;');
        console.log('Connected to Database successfully! Roles seeded:');
        console.table(rows);
        process.exit(0);
    } catch (err) {
        console.error('Database connection failed:', err.message);
        process.exit(1);
    }
}

testConnection();
