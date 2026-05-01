import React, { useState } from 'react';
import { toast } from 'react-toastify';
import AuthLayout from './AuthLayout';
import { authAPI } from '../../api';

const ForgotPassword = ({ onBack, onEmailSent }) => {
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim()) {
            setError('Vui lòng nhập địa chỉ email.');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email.trim())) {
            setError('Địa chỉ email không hợp lệ.');
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.forgotPassword({ email: email.trim() });
            toast.success(response.data.message || 'Đã gửi hướng dẫn đặt lại mật khẩu!');
            onEmailSent(email.trim());
        } catch (error) {
            console.error('Forgot Password API Error:', error);
            
            let msg = 'Có lỗi xảy ra khi xử lý yêu cầu.';
            if (error.response) {
                // The request was made and the server responded with a status code
                // that falls out of the range of 2xx
                const serverMsg = error.response.data?.message || error.response.statusText;
                msg = `Lỗi ${error.response.status}: ${serverMsg}`;
            } else if (error.request) {
                // The request was made but no response was received
                msg = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra mạng.';
            } else {
                // Something happened in setting up the request that triggered an Error
                msg = `Lỗi: ${error.message}`;
            }
            
            setError(msg);
            // Hiển thị chi tiết lỗi lên toast
            toast.error(msg, { autoClose: 5000 });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="auth-form-container">
                <h1 className="auth-title">QUÊN MẬT KHẨU?</h1>
                <p className="auth-subtitle">
                    Điền email gắn với tài khoản của bạn để nhận đường dẫn thay đổi mật khẩu.
                </p>

                <form onSubmit={handleSubmit} noValidate>
                    {error && <div className="auth-error">{error}</div>}

                    <div className="auth-field">
                        <label htmlFor="forgot-email">Email</label>
                        <div className="auth-input-wrapper">
                            <input
                                id="forgot-email"
                                className="auth-input"
                                type="email"
                                placeholder="Nhập email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        className="auth-btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Đang gửi...' : 'Tiếp tục'}
                    </button>
                </form>

                <div className="auth-back-link">
                    <button type="button" onClick={onBack}>
                        Quay lại đăng nhập
                    </button>
                </div>
            </div>
        </AuthLayout>
    );
};

export default ForgotPassword;
