import jwt from 'jsonwebtoken';
import User from '../models/User.js';

const JWT_SECRET = process.env.JWT_SECRET || 'npeducation_secret_key_2024';

export const protect = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['password'] }
            });

            if (!req.user) {
                return res.status(401).json({ message: 'Token không hợp lệ, người dùng không tồn tại.' });
            }

            next();
        } catch (error) {
            return res.status(401).json({ message: 'Không được phép, token thất bại.' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Không được phép, không có token.' });
    }
};

export const authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Vai trò '${req.user.role}' không có quyền thực hiện hành động này.`
            });
        }
        next();
    };
};