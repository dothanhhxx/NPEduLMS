const db = require('./config/db');
async function check() {
    try {
        const [rows] = await db.query('DESCRIBE classes');
        console.log("classes table schema:");
        console.table(rows);
        
        // Also let's check what getAllClasses fails with
        const query = `
            SELECT c.id, c.class_name, c.status, c.max_students, c.created_at, 
                   b.branch_name, u.full_name AS teacher_name,
                   (SELECT COUNT(*) FROM enrollments e2 WHERE e2.class_id = c.id) AS student_count
            FROM classes c
            JOIN branches b ON c.branch_id = b.id
            JOIN teachers t ON c.teacher_id = t.id
            JOIN users u ON t.user_id = u.id
        `;
        try {
            await db.query(query);
            console.log("Query successful");
        } catch(e) {
            console.log("Query failed:", e.message);
        }
    } catch(e) {
        console.log("Error:", e);
    }
    process.exit();
}
check();
