const mysql = require('mysql2/promise');

const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'np_education',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
};

// Hỗ trợ kết nối SSL cho các Cloud DB như TiDB, Aiven, PlanetScale...
if (process.env.DB_SSL === 'true') {
    dbConfig.ssl = {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
    };
}

const pool = mysql.createPool(dbConfig);
// --- NGUYỆT TIÊM: ĐOẠN KIỂM TRA LỖI KẾT NỐI ---
(async () => {
    try {
        const connection = await pool.getConnection();
        console.log('[DATABASE] Kết nối MySQL thành công!');
        connection.release();
    } catch (err) {
        console.error('[DATABASE] LỖI KẾT NỐI:');
        console.error('- Mã lỗi:', err.code);
        console.error('- Chi tiết:', err.message);
    }
})();
// ----------------------------------------------
module.exports = pool;
