const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const bearerToken = authHeader ? authHeader.split(' ')[1] : null;
    const token = bearerToken || req.query.token;

    if (!token) {
        return res.status(403).json({ status: 'Error', message: 'Không tìm thấy token xác thực' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
        req.user = decoded;
        return next();
    } catch (error) {
        return res.status(401).json({ status: 'Error', message: 'Token hết hạn hoặc không đúng' });
    }
};

const verifyRole = (roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({ status: 'Error', message: 'Bạn không có quyền truy cập tính năng này' });
        }

        // 1. Kiểm tra theo kiểu chữ của nhóm (VD: 'Admin' -> 'admin')
        const userRole = (req.user.role || '').toLowerCase();
        const allowedRoles = roles.map(r => typeof r === 'string' ? r.toLowerCase() : r);
        
        const hasRoleByName = allowedRoles.includes(userRole);

        // 2. Kiểm tra theo kiểu số của Nguyệt (VD: 1)
        const hasRoleById = roles.includes(req.user.roleId);

        // Nguyệt tiêm: Chỉ cần khớp 1 trong 2 là cho qua luôn!
        if (hasRoleByName || hasRoleById) {
            return next();
        }

        // Nếu không khớp cái nào mới báo lỗi
        return res.status(403).json({ status: 'Error', message: 'Bạn không có quyền truy cập tính năng này' });
    };
};

module.exports = {
    verifyToken,
    verifyRole
};
