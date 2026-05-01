import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout from './AuthLayout';
import { authAPI } from '../../api';

const ResetPassword = ({ onSuccess }) => {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!newPassword.trim() || !confirmPassword.trim()) {
            setError('Vui lòng nhập đầy đủ thông tin.');
            return;
        }

        const pwdRegex = /^(?=.*[A-Z])(?=.*\d).{8,20}$/;
        if (!pwdRegex.test(newPassword)) {
            setError('Mật khẩu phải từ 8-20 ký tự, có ít nhất 1 chữ hoa và 1 chữ số.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        setLoading(true);
        try {
            const token = new URLSearchParams(window.location.search).get('token');
            if (!token) {
                setError('Token không hợp lệ hoặc đã hết hạn.');
                setLoading(false);
                return;
            }

            await authAPI.resetPassword({ token, newPassword });
            toast.success('Đặt lại mật khẩu thành công! Vui lòng đăng nhập lại.');
            window.history.replaceState(null, '', '/');
            onSuccess();
        } catch (err) {
            setError(err.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="auth-form-container">
                <h1 className="auth-title">ĐẶT LẠI MẬT KHẨU</h1>

                <form onSubmit={handleSubmit} noValidate>
                    {error && <div className="auth-error">{error}</div>}

                    <div className="auth-field">
                        <label htmlFor="reset-new">Mật khẩu mới</label>
                        <div className="auth-input-wrapper">
                            <input
                                id="reset-new"
                                className="auth-input has-toggle"
                                type={showNew ? 'text' : 'password'}
                                placeholder="Nhập mật khẩu"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className="auth-toggle-btn"
                                onClick={() => setShowNew((v) => !v)}
                                aria-label={showNew ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                            >
                                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="auth-field">
                        <label htmlFor="reset-confirm">Xác nhận mật khẩu</label>
                        <div className="auth-input-wrapper">
                            <input
                                id="reset-confirm"
                                className="auth-input has-toggle"
                                type={showConfirm ? 'text' : 'password'}
                                placeholder="Nhập lại mật khẩu"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                autoComplete="new-password"
                            />
                            <button
                                type="button"
                                className="auth-toggle-btn"
                                onClick={() => setShowConfirm((v) => !v)}
                                aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                            >
                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="auth-btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Đang xử lý...' : 'Xác nhận'}
                    </button>
                </form>
            </div>
        </AuthLayout>
    );
};

export default ResetPassword;