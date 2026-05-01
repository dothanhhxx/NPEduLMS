const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

// Lấy danh sách tất cả người dùng (Admin)
exports.getAllUsers = async (req, res) => {
    try {
        const [users] = await db.query(`
            SELECT u.id, u.email, u.full_name, r.role_name,
                   CASE 
                       WHEN r.role_name = 'Student' THEN s.phone
                       ELSE NULL
                   END as phone,
                   u.created_at,
                   s.id as student_id
            FROM users u
            JOIN roles r ON u.role_id = r.id
            LEFT JOIN students s ON u.id = s.user_id
            ORDER BY u.created_at DESC
        `);

        // Lấy thông tin ghi danh cho tất cả học viên
        const [enrollments] = await db.query(`
            SELECT e.student_id, c.id as class_id, c.class_name
            FROM enrollments e
            JOIN classes c ON e.class_id = c.id
        `);

        // Tạo map: student_id -> [{class_id, class_name}]
        const enrollmentMap = {};
        enrollments.forEach(e => {
            if (!enrollmentMap[e.student_id]) enrollmentMap[e.student_id] = [];
            enrollmentMap[e.student_id].push({ class_id: e.class_id, class_name: e.class_name });
        });

        const getInitials = (name) => {
            if (!name) return '?';
            const parts = name.trim().split(' ');
            if (parts.length >= 2) {
                return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
            }
            return parts[0][0].toUpperCase();
        };

        const formatted = users.map(u => ({
            id: `UID-${u.id}`,
            dbId: u.id,
            name: u.full_name,
            email: u.email,
            phone: u.phone || '--',
            role: u.role_name === 'Student' ? 'Học viên' : u.role_name === 'Teacher' ? 'Giáo viên' : 'Nhân viên',
            roleName: u.role_name,
            enrolledClasses: u.student_id ? (enrollmentMap[u.student_id] || []) : [],
            status: 'active',
            initials: getInitials(u.full_name),
        }));

        res.status(200).json({ status: 'Success', data: formatted });
    } catch (error) {
        console.error('Get All Users Error:', error);
        res.status(500).json({ status: 'Error', message: 'Lỗi server, không thể lấy danh sách người dùng' });
    }
};

// Hàm Đăng ký (Tạo tài khoản)
exports.register = async (req, res) => {
    try {
        const { email, password, full_name, role_name, phone } = req.body;

        // 1. Validate: Kiểm tra các trường bắt buộc
        if (!email || !password || !full_name || !role_name || !phone) {
            return res.status(400).json({ status: 'Error', message: 'Vui lòng điền đủ email, password, full_name, role_name, phone' });
        }

        if (full_name.trim().length > 200) {
            return res.status(400).json({ status: 'Error', message: 'Vui lòng kiểm tra lại họ và tên' });
        }

        // 2. Validate format email (chặn dấu phy, ký tự lạ)
        const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ status: 'Error', message: 'Email không hợp lệ' });
        }

        // 3. Kiểm tra email đã tồn tại chưa
        const [existingUsers] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUsers.length > 0) {
            return res.status(400).json({ status: 'Error', message: 'Email này đã được sử dụng' });
        }

        // 4. Lấy role_id từ role_name (VD: 'Student', 'Teacher', 'Admin')
        const [roles] = await db.query('SELECT id FROM roles WHERE role_name = ?', [role_name]);
        if (roles.length === 0) {
            return res.status(400).json({ status: 'Error', message: 'Role không hợp lệ' });
        }
        const role_id = roles[0].id;

        // 5. Mã hóa mật khẩu với bcrypt
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 6. Lưu vào bảng users
        const [userResult] = await db.query(
            'INSERT INTO users (email, password_hash, full_name, role_id) VALUES (?, ?, ?, ?)',
            [email, hashedPassword, full_name, role_id]
        );
        const userId = userResult.insertId;

        // 7. Chèn thêm vào bảng tương ứng tuỳ theo Role (Student / Teacher)
        if (role_name === 'Student') {
            await db.query('INSERT INTO students (user_id, phone) VALUES (?, ?)', [userId, phone || null]);
        } else if (role_name === 'Teacher') {
            // Teacher có thể update specialized_subject sau
            await db.query('INSERT INTO teachers (user_id) VALUES (?)', [userId]);
        }

        res.status(201).json({
            status: 'Success',
            message: 'Tạo tài khoản thành công',
            data: { userId, email, full_name, role_name }
        });

    } catch (error) {
        console.error('Register Error:', error);
        res.status(500).json({ status: 'Error', message: 'Lỗi server, không thể tạo tài khoản' });
    }
};

// Hàm Đăng nhập
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ status: 'Error', message: 'Vui lòng cung cấp email và password' });
        }

        // 1. Tìm user theo email, lấy kèm tên Role bằng cách JOIN bảng roles
        const [users] = await db.query(`
            SELECT u.id, u.email, u.password_hash, u.full_name, u.role_id, r.role_name 
            FROM users u
            JOIN roles r ON u.role_id = r.id
            WHERE u.email = ?
        `, [email]);

        if (users.length === 0) {
            return res.status(401).json({ status: 'Error', message: 'Tài khoản hoặc mật khẩu không đúng' });
        }

        const user = users[0];

        // 2. So sánh mật khẩu bằng bcrypt
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ status: 'Error', message: 'Tài khoản hoặc mật khẩu không đúng' });
        }

        // 3. Tạo JWT Token bảo mật
        const payload = {
            userId: user.id,
            email: user.email,
            role: user.role_name,
            roleId: user.role_id, // Nguyệt thêm
            fullName: user.full_name
        };

        const token = jwt.sign(payload, process.env.JWT_SECRET || 'fallback_secret_key', { expiresIn: '24h' });

        res.status(200).json({
            status: 'Success',
            message: 'Đăng nhập thành công',
            token: token,
            user: payload
        });

    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ status: 'Error', message: 'Lỗi server, không thể đăng nhập' });
    }
};


// Hàm Thay đổi Mật khẩu (Chủ động)
exports.changePassword = async (req, res) => {
    try {
        const userId = req.user.userId;
        const { oldPassword, newPassword } = req.body;

        if (!oldPassword || !newPassword) {
            return res.status(400).json({ status: 'Error', message: 'Vui lòng cung cấp mật khẩu cũ và mới' });
        }

        const pwdRegex = /^(?=.*[A-Z])(?=.*\d).{8,20}$/;
        if (!pwdRegex.test(newPassword)) {
            return res.status(400).json({ status: 'Error', message: 'Mật khẩu phải từ 8-20 ký tự, có ít nhất 1 chữ hoa và 1 chữ số.' });
        }

        const [users] = await db.query('SELECT password_hash FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            return res.status(404).json({ status: 'Error', message: 'Tài khoản không tồn tại' });
        }
        
        const user = users[0];
        const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ status: 'Error', message: 'Mật khẩu hiện tại không đúng' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);

        res.status(200).json({ status: 'Success', message: 'Đổi mật khẩu thành công!' });

    } catch (error) {
        console.error('Change Password Error:', error);
        res.status(500).json({ status: 'Error', message: 'Lỗi server, không thể đổi mật khẩu' });
    }
};

// Hàm Quên mật khẩu
exports.forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ status: 'Error', message: 'Vui lòng cung cấp email' });
        }

        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
        if (users.length === 0) {
            return res.status(404).json({ status: 'Error', message: 'Email chưa được đăng ký trong hệ thống' });
        }

        const user = users[0];

        // Tạo JWT Token giả định để đặt lại mật khẩu
        const resetToken = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET || 'fallback_secret_key',
            { expiresIn: '15m' }
        );

        const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;

        // Cấu hình Nodemailer
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'NP Education - Khôi phục mật khẩu',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                    <h2 style="color: #2e7d32; text-align: center;">NP Education</h2>
                    <h3>Chào ${user.full_name},</h3>
                    <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn trên hệ thống NP Education.</p>
                    <p>Vui lòng click vào nút bên dưới để tiến hành đổi mật khẩu. Link có hiệu lực trong vòng 15 phút.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetUrl}" style="background-color: #4caf50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 16px;">Khôi phục mật khẩu</a>
                    </div>
                    <p style="color: #666; font-size: 14px;">Nếu bạn không thực hiện yêu cầu này, xin vui lòng bỏ qua email này.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="text-align: center; color: #888; font-size: 12px;">© 2026 NP Education. All rights reserved.</p>
                </div>
            `
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ status: 'Success', message: 'Đã gửi hướng dẫn khôi phục mật khẩu vào email của bạn!' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ status: 'Error', message: 'Lỗi cấu hình gửi email. Vui lòng thử lại sau.' });
    }
};

// Hàm Đặt lại mật khẩu (từ link email)
exports.resetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;
        if (!token || !newPassword) {
            return res.status(400).json({ status: 'Error', message: 'Vui lòng cung cấp token và mật khẩu mới' });
        }

        const pwdRegex = /^(?=.*[A-Z])(?=.*\d).{8,20}$/;
        if (!pwdRegex.test(newPassword)) {
            return res.status(400).json({ status: 'Error', message: 'Mật khẩu phải từ 8-20 ký tự, có ít nhất 1 chữ hoa và 1 chữ số.' });
        }

        // Decode và Verify token
        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        } catch (err) {
            return res.status(401).json({ status: 'Error', message: 'Link khôi phục đã hết hạn hoặc không hợp lệ' });
        }

        const userId = decoded.userId;

        // Mã hóa mật khẩu mới
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Lưu vào cơ sở dữ liệu
        await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [hashedPassword, userId]);

        res.status(200).json({ status: 'Success', message: 'Đặt lại mật khẩu thành công!' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ status: 'Error', message: 'Lỗi server, không thể đặt lại mật khẩu' });
    }
};
