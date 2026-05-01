const db = require('./backend/config/db.js');
const bcrypt = require('bcrypt');

async function seedTeacher() {
    try {
        const email = 'hoap7766@gmail.com';
        const password = '123456';
        
        // Find role
        const [roles] = await db.query('SELECT id FROM roles WHERE role_name = "Teacher"');
        const role_id = roles[0].id;

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(password, salt);

        // Insert User
        const [userResult] = await db.query(
            'INSERT IGNORE INTO users (email, password_hash, full_name, role_id) VALUES (?, ?, ?, ?)',
            [email, hash, 'Hoa Pham', role_id]
        );

        if (userResult.insertId) {
            // Insert Teacher
            await db.query('INSERT IGNORE INTO teachers (user_id) VALUES (?)', [userResult.insertId]);
            console.log('Successfully added Teacher account: ' + email);
        } else {
            console.log('Account ' + email + ' already exists in database.');
        }

    } catch (e) {
        console.error('Error inserting test teacher:', e);
    } finally {
        process.exit(0);
    }
}

seedTeacher();
