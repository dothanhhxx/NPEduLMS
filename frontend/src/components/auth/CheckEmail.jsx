import React from 'react';
import AuthLayout from './AuthLayout';

const CheckEmail = ({ email, onBack }) => {
    return (
        <AuthLayout>
            <div className="auth-form-container">
                <h1 className="auth-title">KIỂM TRA EMAIL CỦA BẠN</h1>
                <p className="auth-subtitle">
                    Chúng tôi đã gửi hướng dẫn thay đổi mật khẩu đến địa chỉ email:
                </p>

                <div className="auth-email-display">{email}</div>

                <p className="auth-subtitle">
                    Vui lòng kiểm tra hộp thư đến (hoặc hòm thư rác).
                </p>

                <button
                    type="button"
                    className="auth-btn-outline"
                    onClick={onBack}
                >
                    Quay lại đăng nhập
                </button>
            </div>
        </AuthLayout>
    );
};

export default CheckEmail;
