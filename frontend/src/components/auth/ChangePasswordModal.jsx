import React, { useState } from 'react';
import { toast } from 'react-toastify';
import { authAPI } from '../../api';
import { Eye, EyeOff } from 'lucide-react';

const ChangePasswordModal = ({ isOpen, onClose }) => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!oldPassword || !newPassword || !confirmPassword) {
            setError('Vui lòng điền đầy đủ các trường.');
            return;
        }

        if (newPassword.length < 6) {
            setError('Mật khẩu mới phải từ 6 ký tự trở lên.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }

        setLoading(true);
        try {
            const res = await authAPI.changePassword({ oldPassword, newPassword });
            toast.success(res.data?.message || 'Đổi mật khẩu thành công!');
            onClose(); // Đóng modal
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');
        } catch (err) {
            console.error('Lỗi chi tiết từ API:', err.response || err);
            // Lấy chính xác error message gửi từ backend
            const msg = err.response?.data?.message || err.message || 'Lỗi kết nối máy chủ.';
            setError(msg);
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const toggleIconStyle = {
        position: 'absolute',
        right: '12px',
        top: '50%',
        transform: 'translateY(-50%)',
        cursor: 'pointer',
        color: '#94a3b8',
        backgroundColor: 'transparent',
        border: 'none',
        display: 'flex',
        alignItems: 'center',
        padding: 0
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '400px' }}>
                <div className="modal-header">
                    <h2>Đổi mật khẩu</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>
                
                <form onSubmit={handleSubmit} className="modal-form">
                    {error && <div className="auth-error" style={{ marginBottom: 16, color: 'var(--danger-color)', fontSize: '0.9rem', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '8px' }}>{error}</div>}
                    
                    <div className="form-group" style={{ position: 'relative' }}>
                        <label>Mật khẩu hiện tại</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showOld ? "text" : "password"}
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                placeholder="Nhập mật khẩu hiện tại"
                                style={{ paddingRight: '40px' }}
                            />
                            <button type="button" onClick={() => setShowOld(!showOld)} style={toggleIconStyle}>
                                {showOld ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>
                    
                    <div className="form-group" style={{ position: 'relative' }}>
                        <label>Mật khẩu mới</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showNew ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Nhập mật khẩu mới"
                                style={{ paddingRight: '40px' }}
                            />
                            <button type="button" onClick={() => setShowNew(!showNew)} style={toggleIconStyle}>
                                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="form-group" style={{ position: 'relative' }}>
                        <label>Xác nhận mật khẩu mới</label>
                        <div style={{ position: 'relative' }}>
                            <input
                                type={showConfirm ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Nhập lại mật khẩu mới"
                                style={{ paddingRight: '40px' }}
                            />
                            <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={toggleIconStyle}>
                                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose} disabled={loading}>Hủy</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Đang lưu...' : 'Lưu mật khẩu'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
