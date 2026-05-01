import React, { useState } from 'react';
import { authAPI } from '../api';
import { toast } from 'react-toastify';
import { Eye, EyeOff } from 'lucide-react';
import AuthLayout from './auth/AuthLayout';

const Login = ({ setAuthUser, onForgotPassword }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        if (!email.trim() || !password.trim()) {
            setError('Vui lòng nhập đầy đủ email và mật khẩu.');
            return;
        }

        setLoading(true);
        try {
            const response = await authAPI.login({ email, password });
            const { token, user } = response.data;

            // Lưu token và thông tin user vào localStorage
            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            toast.success(`Đăng nhập thành công, chào ${user.name || user.fullName}!`);
            setAuthUser(user);
        } catch (error) {
            const msg = error.response?.data?.message || 'Đăng nhập thất bại. Kiểm tra lại thông tin!';
            setError(msg);
            toast.error(msg);
            console.error('Login Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout>
            <div className="auth-form-container">
                <h1 className="auth-title">ĐĂNG NHẬP</h1>

                <form onSubmit={handleLogin} noValidate>
                    {error && <div className="auth-error">{error}</div>}

                    <div className="auth-field">
                        <label htmlFor="auth-email">Email</label>
                        <div className="auth-input-wrapper">
                            <input
                                id="auth-email"
                                className="auth-input"
                                type="email"
                                placeholder="Nhập email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                autoComplete="email"
                            />
                        </div>
                    </div>

                    <div className="auth-field">
                        <label htmlFor="auth-password">Mật Khẩu</label>
                        <div className="auth-input-wrapper">
                            <input
                                id="auth-password"
                                className="auth-input has-toggle"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Nhập mật khẩu"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                autoComplete="current-password"
                            />
                            <button
                                type="button"
                                className="auth-toggle-btn"
                                onClick={() => setShowPassword((v) => !v)}
                                aria-label={showPassword ? 'ẩn mật khẩu' : 'Hiện mật khẩu'}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="auth-forgot">
                        <button type="button" onClick={onForgotPassword}>
                            Quên mật khẩu?
                        </button>
                    </div>

                    <button
                        type="submit"
                        className="auth-btn-primary"
                        disabled={loading}
                    >
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </button>
                </form>
            </div>
        </AuthLayout>
    );
};

export default Login;
