import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Key, MoreVertical, Mail, Phone, Calendar, ChevronLeft, ChevronRight, X, User, EyeOff, RefreshCw, Filter, Loader2 } from 'lucide-react';
import { authAPI, userAPI, classAPI } from '../../api';
import { toast } from 'react-toastify';

const sampleStudents = [
    {
        id: 'STU-2023-001',
        name: 'Nguyễn Văn A',
        email: 'nva.student@npedu.com',
        phone: '090 123 4567',
        role: 'Học viên',
        status: 'active',
        initials: 'NA',
    },
    {
        id: 'STU-2023-045',
        name: 'Trần Thị B',
        email: 'ttb.student@npedu.com',
        phone: '091 987 6543',
        role: 'Học viên',
        status: 'active',
        initials: 'TB',
    },
    {
        id: 'STU-2022-112',
        name: 'Lê Minh',
        email: 'lm.student@npedu.com',
        phone: '098 765 4321',
        role: 'Học viên',
        status: 'blocked',
        initials: 'LM',
    },
];

const sampleTeachers = [
    {
        id: 'TCH-2021-001',
        name: 'Phạm Thị Lan',
        email: 'ptl.teacher@npedu.com',
        phone: '093 111 2222',
        role: 'Giáo viên',
        status: 'active',
        initials: 'PL',
    },
    {
        id: 'TCH-2020-008',
        name: 'Đặng Văn Hùng',
        email: 'dvh.teacher@npedu.com',
        phone: '096 333 4444',
        role: 'Giáo viên',
        status: 'active',
        initials: 'DH',
    },
];

const sampleStaff = [
    {
        id: 'STF-2022-001',
        name: 'Hoàng Thị Mai',
        email: 'htm.staff@npedu.com',
        phone: '092 555 6666',
        role: 'Nhân viên',
        grade: 'Phòng Hành chính',
        status: 'active',
        initials: 'HM',
    },
];

const StatusBadge = ({ status }) => (
    <span className={status === 'active' ? 'badge-active' : 'badge-blocked'}>
        {status === 'active' ? 'Đang hoạt động' : 'Đã khóa'}
    </span>
);

const AddUserModal = ({ onClose, onSuccess }) => {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({ role: '', name: '', dob: '', email: '', phone: '', password: '' });

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

    const generatePassword = () => {
        const upper = 'ABCDEFGHJKMNPQRSTUVWXYZ';
        const lower = 'abcdefghjkmnpqrstuvwxyz';
        const digits = '23456789';
        const all = upper + lower + digits;
        // Đảm bảo luôn có ít nhất 1 chữ hoa và 1 chữ số
        let pwd = [
            upper[Math.floor(Math.random() * upper.length)],
            digits[Math.floor(Math.random() * digits.length)]
        ];
        for (let i = 2; i < 10; i++) pwd.push(all[Math.floor(Math.random() * all.length)]);
        // Shuffle
        for (let i = pwd.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [pwd[i], pwd[j]] = [pwd[j], pwd[i]];
        }
        setForm(f => ({ ...f, password: pwd.join('') }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Tách thông báo lỗi riêng cho từng trường bắt buộc
        if (!form.role) { toast.error("Vui lòng chọn vai trò!"); return; }
        if (!form.name.trim()) { toast.error("Vui lòng nhập họ và tên!"); return; }
        if (!form.email.trim()) { toast.error("Vui lòng nhập email!"); return; }
        if (!form.phone.trim()) { toast.error("Vui lòng nhập số điện thoại!"); return; }
        if (!form.password) { toast.error("Vui lòng nhập hoặc tạo mật khẩu!"); return; }

        // Validate Tên
        if (form.name.trim().length < 2) {
            toast.error("Họ và tên phải có ít nhất 2 ký tự!");
            return;
        }
        if (form.name.trim().length > 200) {
            toast.error("Vui lòng kiểm tra lại họ và tên");
            return;
        }

        // Validate Email
        const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(form.email)) {
            toast.error("Định dạng email không hợp lệ!");
            return;
        }

        // Validate Ngày sinh (bắt buộc)
        if (!form.dob) {
            toast.error("Vui lòng nhập ngày sinh!");
            return;
        }
        {
            const selectedDate = new Date(form.dob);
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            if (selectedDate >= today) {
                toast.error("Ngày sinh không được là ngày hiện tại hoặc tương lai!");
                return;
            }

            const ageYear = today.getFullYear() - selectedDate.getFullYear();
            if (ageYear > 100) {
                toast.error("Ngày sinh không hợp lệ!");
                return;
            }
            
            if (form.role === 'student' && ageYear < 5) {
                toast.error("Tuổi học viên phải từ 5 tuổi trở lên!");
                return;
            }
            if ((form.role === 'teacher' || form.role === 'staff') && ageYear < 18) {
                toast.error("Giáo viên và Nhân viên phải từ 18 tuổi trở lên!");
                return;
            }
        }

        // Validate Phone format
        const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
        if (!phoneRegex.test(form.phone)) {
            toast.error("Số điện thoại không hợp lệ (định dạng VN)!");
            return;
        }

        // Validate Password complexity
        const pwdRegex = /^(?=.*[A-Z])(?=.*\d).{8,20}$/;
        if (!pwdRegex.test(form.password)) {
            toast.error("Mật khẩu phải từ 8-20 ký tự, có ít nhất 1 chữ hoa và 1 chữ số.");
            return;
        }

        const roleMap = {
            student: 'Student',
            teacher: 'Teacher',
            staff: 'Admin'
        };

        setLoading(true);
        try {
            const res = await authAPI.register({
                email: form.email,
                password: form.password,
                full_name: form.name,
                role_name: roleMap[form.role],
                phone: form.phone
            });
            
            toast.success(res.data?.message || "Thêm người dùng thành công!");
            
            const newUser = {
                id: `UID-${new Date().getTime().toString().slice(-4)}`,
                name: form.name,
                email: form.email,
                phone: form.phone || '--',
                role: form.role === 'student' ? 'Học viên' : form.role === 'teacher' ? 'Giáo viên' : 'Nhân viên',
                grade: 'Mới tạo',
                status: 'active',
                initials: form.name.split(' ').pop().charAt(0).toUpperCase()
            };

            onSuccess(form.role, newUser);
            onClose();
        } catch (error) {
            console.error('Lỗi khi thêm User:', error);
            const msg = error.response?.data?.message || 'Lỗi kết nối máy chủ.';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-box" onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <User size={22} color="#1C513E" />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '2px' }}>Thêm người dùng mới</h3>
                            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Điền thông tin thành viên mới vào hệ thống</p>
                        </div>
                    </div>
                    <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }}>
                        <X size={20} />
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '6px' }}>Vai trò</label>
                        <select name="role" value={form.role} onChange={handleChange} className="input" style={{ appearance: 'auto' }}>
                            <option value="">Chọn vai trò</option>
                            <option value="student">Học viên</option>
                            <option value="teacher">Giáo viên</option>
                            <option value="staff">Nhân viên</option>
                        </select>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '6px' }}>Họ và Tên</label>
                        <input name="name" value={form.name} onChange={handleChange} className="input" placeholder="Nhập họ và tên đầy đủ" maxLength={200} />
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '6px' }}>Ngày sinh</label>
                        <div style={{ position: 'relative' }}>
                            <input name="dob" type="date" value={form.dob} onChange={handleChange} className="input" style={{ paddingRight: '2.5rem' }} />
                            <Calendar size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '6px' }}>Email đăng nhập</label>
                        <div style={{ position: 'relative' }}>
                            <input name="email" type="email" value={form.email} onChange={handleChange} className="input" placeholder="example@npe.edu.vn" style={{ paddingRight: '2.5rem' }} />
                            <Mail size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        </div>
                    </div>

                    <div>
                        <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 500, marginBottom: '6px' }}>Số điện thoại</label>
                        <div style={{ position: 'relative' }}>
                            <input name="phone" value={form.phone} onChange={handleChange} className="input" placeholder="090 1234 567" style={{ paddingRight: '2.5rem' }} />
                            <Phone size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                        </div>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ fontSize: '0.875rem', fontWeight: 500 }}>Mật khẩu</label>
                            <button type="button" onClick={generatePassword} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1C513E', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 500 }}>
                                <RefreshCw size={13} /> Tạo ngẫu nhiên
                            </button>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <input
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                value={form.password}
                                onChange={handleChange}
                                className="input"
                                placeholder="••••••••"
                                maxLength={20}
                                style={{ paddingRight: '2.5rem' }}
                            />
                            <button type="button" onClick={() => setShowPassword(v => !v)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '5px' }}>
                            Mật khẩu cần ít nhất 8 ký tự, bao gồm chữ hoa và chữ số.
                        </p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginTop: '1.5rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={onClose} disabled={loading} className="btn" style={{ border: '1px solid var(--border)', background: 'white', color: 'var(--text-main)', padding: '0.6rem 1.5rem' }}>
                        Hủy
                    </button>
                    <button type="button" onClick={handleSubmit} disabled={loading} className="btn btn-primary" style={{ padding: '0.6rem 1.5rem', gap: '6px' }}>
                        {loading ? 'Đang lưu...' : '💾 Lưu'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const AdminUsers = ({ authUser }) => {
    const [activeTab, setActiveTab] = useState('students');
    const [search, setSearch] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const [students, setStudents] = useState([]);
    const [teachers, setTeachers] = useState([]);
    const [staff, setStaff] = useState([]);
    const [classList, setClassList] = useState([]);

    // Fetch real users from database on mount
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                setLoadingUsers(true);
                const [userRes, classRes] = await Promise.all([
                    userAPI.getAll(),
                    classAPI.getAll()
                ]);
                const allUsers = userRes.data?.data || [];
                setStudents(allUsers.filter(u => (u.roleName?.toLowerCase() === 'student' || u.roleId === 5)));
                setTeachers(allUsers.filter(u => (u.roleName?.toLowerCase() === 'teacher' || u.roleId === 4)));
                setStaff(allUsers.filter(u => (u.roleName?.toLowerCase() === 'admin' || u.roleId === 1)));
                setClassList(classRes.data?.data || []);
            } catch (error) {
                console.error('Lỗi khi tải danh sách người dùng:', error);
                toast.error('Không thể tải danh sách người dùng từ máy chủ.');
            } finally {
                setLoadingUsers(false);
            }
        };
        fetchUsers();
    }, []);

    const tabsData = [
        { id: 'students', label: 'Học viên', data: students },
        { id: 'teachers', label: 'Giáo viên', data: teachers },
        { id: 'staff', label: 'Nhân viên', data: staff },
    ];

    const currentTab = tabsData.find(t => t.id === activeTab);
    const filtered = currentTab.data.filter(u => {
        const matchesSearch = 
            u.name.toLowerCase().includes(search.toLowerCase()) ||
            u.email.toLowerCase().includes(search.toLowerCase()) ||
            u.id.toLowerCase().includes(search.toLowerCase());
        
        // Lọc theo lớp học (chỉ áp dụng cho tab Học viên)
        if (activeTab === 'students' && classFilter) {
            const matchesClass = (u.enrolledClasses || []).some(
                ec => String(ec.class_id) === classFilter
            );
            return matchesSearch && matchesClass;
        }
        
        return matchesSearch;
    });

    const handleAddSuccess = (roleKey, newUser) => {
        const tabMap = { student: 'students', teacher: 'teachers', staff: 'staff' };
        if (roleKey === 'student') setStudents(prev => [newUser, ...prev]);
        else if (roleKey === 'teacher') setTeachers(prev => [newUser, ...prev]);
        else if (roleKey === 'staff') setStaff(prev => [newUser, ...prev]);
        setActiveTab(tabMap[roleKey] || activeTab);
    };

    // Reset pagination when filter changes
    useEffect(() => {
        setCurrentPage(1);
    }, [search, classFilter, activeTab]);

    const totalPages = Math.ceil(filtered.length / itemsPerPage) || 1;
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = filtered.slice(startIndex, startIndex + itemsPerPage);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div className="tab-nav">
                {tabsData.map(tab => (
                    <button
                        key={tab.id}
                        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                        <span style={{
                            marginLeft: '8px',
                            padding: '1px 8px',
                            borderRadius: '999px',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                            background: activeTab === tab.id ? '#1C513E' : '#e5e7eb',
                            color: activeTab === tab.id ? 'white' : 'var(--text-muted)',
                        }}>
                            {tab.data.length}
                        </span>
                    </button>
                ))}
            </div>

            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        className="input"
                        style={{ paddingLeft: '2.25rem' }}
                        placeholder="Tìm kiếm theo tên, email, hoặc ID..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                {activeTab === 'students' && (
                    <select 
                        className="input" 
                        style={{ width: 'auto', minWidth: '160px', appearance: 'auto' }}
                        value={classFilter}
                        onChange={e => setClassFilter(e.target.value)}
                    >
                        <option value="">Lớp học: Tất cả</option>
                        {classList.map(cls => (
                            <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                        ))}
                    </select>
                )}
                <button className="btn" style={{ border: '1px solid var(--border)', background: 'white', color: 'var(--text-main)', gap: '6px' }}>
                    <Filter size={15} /> Bộ lọc khác
                </button>
                <button className="btn btn-primary" style={{ gap: '6px', whiteSpace: 'nowrap' }} onClick={() => setShowModal(true)}>
                    <Plus size={16} /> Thêm người dùng mới
                </button>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="user-table">
                    <thead>
                        <tr>
                            <th>HỌ TÊN</th>
                            <th>LIÊN HỆ</th>
                            <th>VAI TRÒ</th>
                            <th>TRẠNG THÁI</th>
                            <th style={{ width: 100 }}></th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map(user => (
                            <tr key={user.id}>
                                <td>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: 38, height: 38, borderRadius: '50%',
                                            background: '#d1fae5', color: '#1C513E',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: 700, fontSize: '0.85rem', flexShrink: 0
                                        }}>
                                            {user.initials}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{user.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.id}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '0.875rem' }}>{user.email}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.phone}</div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '0.875rem', fontWeight: 500 }}>{user.role}</div>
                                </td>
                                <td>
                                    <StatusBadge status={user.status} />
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }} title="Xem chi tiết">
                                            <Eye size={16} />
                                        </button>
                                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }} title="Đặt lại mật khẩu">
                                            <Key size={16} />
                                        </button>
                                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px' }} title="Thêm tùy chọn">
                                            <MoreVertical size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    Không tìm thấy kết quả phù hợp.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Đang hiển thị {filtered.length === 0 ? 0 : startIndex + 1} đến {Math.min(startIndex + itemsPerPage, filtered.length)} trong tổng số {filtered.length} kết quả
                    </span>
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <button 
                                className="btn" 
                                style={{ padding: '4px 8px', border: '1px solid var(--border)', background: 'white', opacity: currentPage === 1 ? 0.5 : 1 }}
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            
                            {/* Render up to 5 page numbers around current page */}
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(n => n === 1 || n === totalPages || Math.abs(n - currentPage) <= 1)
                                .map((n, i, arr) => (
                                    <React.Fragment key={n}>
                                        {i > 0 && n - arr[i - 1] > 1 && (
                                            <span style={{ padding: '0 4px', color: 'var(--text-muted)' }}>...</span>
                                        )}
                                        <button 
                                            className="btn" 
                                            onClick={() => setCurrentPage(n)}
                                            style={{ 
                                                padding: '4px 12px', 
                                                border: '1px solid var(--border)', 
                                                background: n === currentPage ? '#1C513E' : 'white', 
                                                color: n === currentPage ? 'white' : 'var(--text-main)', 
                                                minWidth: 36 
                                            }}
                                        >
                                            {n}
                                        </button>
                                    </React.Fragment>
                                ))}
                            
                            <button 
                                className="btn" 
                                style={{ padding: '4px 8px', border: '1px solid var(--border)', background: 'white', opacity: currentPage === totalPages ? 0.5 : 1 }}
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showModal && <AddUserModal onClose={() => setShowModal(false)} onSuccess={handleAddSuccess} />}
        </div>
    );
};

export default AdminUsers;
