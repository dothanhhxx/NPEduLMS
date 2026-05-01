import { connectDB, sequelize } from '../config/db.js';
import User from '../models/User.js';

const seedUsers = async () => {
    await connectDB();
{ force: true }

    console.log('🌱 Bắt đầu seed dữ liệu tài khoản...');

    const users = [
        {
            full_name: 'Quản trị viên NP',
            email: 'admin@np.edu.vn',
            password: '123456',
            role: 'admin',
            assigned_class_id: null
        },
        {
            full_name: 'Thầy Mike',
            email: 'teacher_mike@np.edu.vn',
            password: '123456',
            role: 'teacher',
            assigned_class_id: null
        },
        {
            full_name: 'Học viên An',
            email: 'student_an@np.edu.vn',
            password: '123456',
            role: 'student',
            assigned_class_id: null
        }
    ];

    for (const userData of users) {
        const existing = await User.findOne({ where: { email: userData.email } });
        if (existing) {
            console.log(`⚠️  Tài khoản ${userData.email} đã tồn tại, bỏ qua.`);
        } else {
            await User.create(userData);
            console.log(`✅ Đã tạo tài khoản: ${userData.email} (role: ${userData.role})`);
        }
    }

    console.log('\n🎉 Seed hoàn tất! Danh sách tài khoản:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👑 ADMIN    | admin@np.edu.vn          | 123456');
    console.log('👨‍🏫 TEACHER  | teacher_mike@np.edu.vn   | 123456');
    console.log('👦 STUDENT  | student_an@np.edu.vn     | 123456');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    process.exit(0);
};

seedUsers().catch((err) => {
    console.error('❌ Lỗi seed:', err);
    process.exit(1);
});
