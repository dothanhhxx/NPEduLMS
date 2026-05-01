import React, { useState, useEffect } from 'react';
import { Search, Plus, Eye, Trash2, X, Users, BookOpen, Filter, ChevronLeft, ChevronRight, Loader, UserPlus } from 'lucide-react';
import { classAPI } from '../../api';
import { toast } from 'react-toastify';

const StatusBadge = ({ status }) => {
    const map = {
        active: { label: 'Đang mở', bg: '#d1fae5', color: '#065f46' },
        upcoming: { label: 'Sắp khai giảng', bg: '#dbeafe', color: '#1e40af' },
        closed: { label: 'Đã đóng', bg: '#fee2e2', color: '#991b1b' },
    };
    const s = map[status] || map.active;
    return (
        <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
            {s.label}
        </span>
    );
};

const AdminClasses = ({ authUser, classes: propClasses, onRefresh, setView }) => {
    const [search, setSearch] = useState('');
    const [classes, setClasses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedClass, setSelectedClass] = useState(null);
    const [showAssignModal, setShowAssignModal] = useState(false);
    const [assignData, setAssignData] = useState({ class_id: '', teacher_id: '' });
    const [teachers, setTeachers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [courses, setCourses] = useState([]);
    const [formData, setFormData] = useState({
        class_code: '',
        class_name: '',
        course_id: '',
        branch_id: '',
        teacher_id: '',
        start_date: '',
        session_time: '',
        status: 'active',
        max_students: 25
    });

    // Lấy dữ liệu lớp học từ API khi component mount
    useEffect(() => {
        fetchClasses();
    }, []);

    const fetchClasses = async () => {
        try {
            setLoading(true);
            const res = await classAPI.getAll();
            setClasses(res.data.data || []);
        } catch (error) {
            console.error('Lỗi lấy danh sách lớp:', error);
            toast.error('Không thể tải danh sách lớp học');
        } finally {
            setLoading(false);
        }
    };

    // Tải dữ liệu dropdown
    const fetchDropdownData = async () => {
        const [teacherRes, branchRes, courseRes] = await Promise.all([
            classAPI.getTeachers(),
            classAPI.getBranches(),
            classAPI.getCourses()
        ]);
        setTeachers(teacherRes.data.data || []);
        setBranches(branchRes.data.data || []);
        setCourses(courseRes.data.data || []);
    };

    // Mở modal tạo lớp
    const openCreateModal = async () => {
        try {
            await fetchDropdownData();
            setIsEditing(false);
            setFormData({ 
                class_code: '', 
                class_name: '', 
                course_id: '', 
                branch_id: '', 
                teacher_id: '', 
                start_date: new Date().toISOString().split('T')[0], 
                session_time: '', 
                status: 'active', 
                max_students: 25 
            });
            setShowModal(true);
        } catch (error) {
            console.error('Lỗi tải dropdown:', error);
            toast.error('Không thể tải dữ liệu');
        }
    };

    // Mở modal Phân công GV
    const openAssignModal = async () => {
        try {
            await fetchDropdownData();
            setAssignData({ class_id: '', teacher_id: '' });
            setShowAssignModal(true);
        } catch (error) {
            console.error('Lỗi tải dropdown:', error);
            toast.error('Không thể tải dữ liệu');
        }
    };

    // Xử lý Phân công GV
    const handleAssignTeacher = async (e) => {
        e.preventDefault();

        // Kiểm tra xem lớp học đã có giáo viên chưa trước khi ghi đè (DF001)
        const selectedCls = classes.find(c => c.id == assignData.class_id);
        if (selectedCls && selectedCls.teacher_name) {
            const confirmMsg = `Lớp học này hiện đang được phân công cho giáo viên ${selectedCls.teacher_name}. Bạn có chắc chắn muốn thay đổi giáo viên không?`;
            if (!window.confirm(confirmMsg)) {
                return;
            }
        }

        try {
            await classAPI.assignTeacher(assignData.class_id, { teacher_id: assignData.teacher_id });
            toast.success('Phân công giáo viên thành công!');
            setShowAssignModal(false);
            fetchClasses();
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Lỗi phân công GV:', error);
            toast.error(error.response?.data?.message || 'Không thể phân công giáo viên');
        }
    };

    // Mở modal sửa lớp
    const openEditModal = async (cls) => {
        try {
            await fetchDropdownData();
            setIsEditing(true);
            setSelectedClass(cls);
            // Format date for input type date
            const dateStr = cls.start_date ? new Date(cls.start_date).toISOString().split('T')[0] : '';
            setFormData({
                class_code: cls.class_code || '',
                class_name: cls.class_name,
                course_id: cls.course_id || '',
                branch_id: cls.branch_id,
                teacher_id: cls.teacher_id,
                start_date: dateStr,
                session_time: cls.session_time || '',
                status: cls.status,
                max_students: cls.max_students
            });
            setShowModal(true);
        } catch (error) {
            console.error('Lỗi tải dropdown:', error);
            toast.error('Không thể tải dữ liệu');
        }
    };

    // Xử lý Lưu (Tạo hoặc Cập nhật)
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation: Tên lớp (không khoảng trắng trống, không chứa ký tự đặc biệt ngoài cho phép)
        const trimmedName = formData.class_name.trim();
        if (trimmedName.length === 0) {
            toast.error('Tên lớp không được để trống!');
            return;
        }
        const nameRegex = /^[\p{L}\p{N}\s\-_+&()]+$/u;
        if (!nameRegex.test(trimmedName)) {
            toast.error('Tên lớp chỉ được chứa chữ, số, khoảng trắng và ký tự -_+&()');
            return;
        }

        try {
            const submitData = { ...formData, class_name: trimmedName };
            if (isEditing) {
                await classAPI.update(selectedClass.id, submitData);
                toast.success('Cập nhật thành công!');
            } else {
                await classAPI.create(submitData);
                toast.success('Lưu thành công!');
            }
            setShowModal(false);
            fetchClasses();
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Lỗi lưu lớp:', error);
            const msg = error.response?.data?.message || (isEditing ? 'Không thể cập nhật lớp học' : 'Không thể tạo lớp học');
            toast.error(msg);
        }
    };

    // Mở modal xóa
    const openConfirmDelete = (cls) => {
        setSelectedClass(cls);
        setShowDeleteModal(true);
    };

    // Thực hiện xóa lớp
    const handleDeleteClass = async () => {
        try {
            await classAPI.delete(selectedClass.id);
            toast.success('Đã xóa lớp thành công');
            setShowDeleteModal(false);
            fetchClasses();
            if (onRefresh) onRefresh();
        } catch (error) {
            console.error('Lỗi xóa lớp:', error);
            toast.error('Không thể xóa lớp học');
        }
    };

    // Lọc tìm kiếm
    const filtered = classes.filter(c =>
        c.class_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.class_code?.toLowerCase().includes(search.toLowerCase()) ||
        c.teacher_name?.toLowerCase().includes(search.toLowerCase()) ||
        c.course_name?.toLowerCase().includes(search.toLowerCase())
    );

    // Tính toán summary cards
    const totalClasses = classes.length;
    const activeClasses = classes.filter(c => c.status === 'active').length;
    const totalStudents = classes.reduce((sum, c) => sum + (c.student_count || 0), 0);

    if (loading) {
        return (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px', gap: '8px', color: 'var(--text-muted)' }}>
                <Loader size={20} className="spin" /> Đang tải dữ liệu lớp học...
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Summary cards - Dữ liệu thật từ DB */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '10px', background: '#d1fae5', borderRadius: '8px' }}>
                        <BookOpen size={20} color="#1C513E" />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalClasses}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tổng lớp học</div>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '10px', background: '#dbeafe', borderRadius: '8px' }}>
                        <BookOpen size={20} color="#1e40af" />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{activeClasses}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Đang hoạt động</div>
                    </div>
                </div>
                <div className="card" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ padding: '10px', background: '#fef3c7', borderRadius: '8px' }}>
                        <Users size={20} color="#92400e" />
                    </div>
                    <div>
                        <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{totalStudents}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tổng học viên</div>
                    </div>
                </div>
            </div>

            {/* Search + Add */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                        className="input"
                        style={{ paddingLeft: '2.25rem' }}
                        placeholder="Tìm kiếm lớp học, giáo viên, khóa học..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
                { (authUser?.role?.toLowerCase() === 'admin' || authUser?.roleId === 1) && (
                    <>
                        <button className="btn" style={{ gap: '6px', whiteSpace: 'nowrap', background: '#f59e0b', color: 'white', border: 'none' }} onClick={openAssignModal}>
                            <Users size={16} /> Phân công GV
                        </button>
                        <button className="btn btn-primary" style={{ gap: '6px', whiteSpace: 'nowrap' }} onClick={openCreateModal}>
                            <Plus size={16} /> Tạo lớp học mới
                        </button>
                    </>
                )}
            </div>

            {/* Table */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <table className="user-table">
                    <thead>
                        <tr>
                            <th>LỚP HỌC</th>
                            <th>KHÓA HỌC</th>
                            <th>GIÁO VIÊN</th>
                            <th>LỊCH HỌC</th>
                            <th>HỌC VIÊN</th>
                            <th>TRẠNG THÁI</th>
                            <th style={{ width: 120 }}>THAO TÁC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.map(cls => (
                            <tr key={cls.id}>
                                <td>
                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', overflowWrap: 'anywhere' }}>{cls.class_name}</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Mã: {cls.class_code || '---'}</div>
                                </td>
                                <td style={{ fontSize: '0.875rem' }}>{cls.course_name}</td>
                                <td style={{ fontSize: '0.875rem' }}>{cls.teacher_name}</td>
                                <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                                    <div>{cls.session_time}</div>
                                    <div style={{ fontSize: '0.75rem' }}>Từ: {cls.start_date ? new Date(cls.start_date).toLocaleDateString('vi-VN') : '---'}</div>
                                </td>
                                <td>
                                    <div style={{ fontSize: '0.875rem' }}>{cls.student_count || 0}/{cls.max_students || 25}</div>
                                    <div style={{ height: 4, background: '#e5e7eb', borderRadius: 2, marginTop: 4, width: 80 }}>
                                        <div style={{ height: '100%', background: '#1C513E', borderRadius: 2, width: `${((cls.student_count || 0) / (cls.max_students || 25)) * 100}%` }} />
                                    </div>
                                </td>
                                <td><StatusBadge status={cls.status || 'active'} /></td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                        {/* 1. NÚT GHI DANH CỦA NGUYỆT */}
                                        <button 
                                            onClick={() => setView('enrollment', cls.id)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '4px' }}
                                            title="Ghi danh học viên"
                                        >
                                            <UserPlus size={16} /> 
                                        </button>
                                        <button
                                            onClick={() => openEditModal(cls)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--primary)', padding: '4px' }}
                                            title="Sửa lớp"
                                            className="edit-button-test"
                                        >
                                            <BookOpen size={16} />
                                        </button>
                                        <button
                                            onClick={() => openConfirmDelete(cls)}
                                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', padding: '4px' }}
                                            title="Xóa lớp"
                                            className="delete-button-test"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                        {filtered.length === 0 && (
                            <tr>
                                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                                    Không tìm thấy lớp học phù hợp.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderTop: '1px solid var(--border)' }}>
                    <span style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        Đang hiển thị {filtered.length} / {classes.length} lớp học
                    </span>
                </div>
            </div>

            {/* Modal tạo/sửa lớp */}
            {showModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="card" style={{ width: '550px', maxWidth: '95vw', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>{isEditing ? 'Cập nhật thông tin lớp' : 'Tạo lớp học mới'}</h3>
                            <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '0.875rem' }}>Mã lớp *</label>
                                    <input
                                        className="input"
                                        placeholder="VD: ENG101"
                                        value={formData.class_code}
                                        onChange={e => setFormData({ ...formData, class_code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '') })}
                                        pattern="^[A-Z0-9]{3,20}$"
                                        title="Chỉ chứa 3-20 chữ cái in hoa và số, không khoảng trắng"
                                        required
                                    />
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '0.875rem' }}>Tên lớp hiển thị *</label>
                                    <input
                                        className="input"
                                        placeholder="VD: IELTS Intensive 7.0"
                                        value={formData.class_name}
                                        onChange={e => setFormData({ ...formData, class_name: e.target.value })}
                                        minLength={5}
                                        maxLength={100}
                                        title="Tên lớp phải từ 5 đến 100 ký tự"
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '0.875rem' }}>Khóa học *</label>
                                    <select
                                        className="input"
                                        value={formData.course_id}
                                        onChange={e => setFormData({ ...formData, course_id: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Chọn khóa học --</option>
                                        {courses.map(c => (
                                            <option key={c.id} value={c.id}>{c.course_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '0.875rem' }}>Giáo viên *</label>
                                    <select
                                        className="input"
                                        value={formData.teacher_id}
                                        onChange={e => setFormData({ ...formData, teacher_id: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Chọn giáo viên --</option>
                                        {teachers.map(t => (
                                            <option key={t.id} value={t.id}>{t.full_name} ({t.specialized_subject})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '0.875rem' }}>Chi nhánh *</label>
                                    <select
                                        className="input"
                                        value={formData.branch_id}
                                        onChange={e => setFormData({ ...formData, branch_id: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Chọn chi nhánh --</option>
                                        {branches.map(b => (
                                            <option key={b.id} value={b.id}>{b.branch_name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '0.875rem' }}>Ngày bắt đầu *</label>
                                    <input
                                        className="input"
                                        type="date"
                                        value={formData.start_date}
                                        min={(() => {
                                            const d = new Date();
                                            d.setDate(d.getDate() - 30);
                                            return d.toISOString().split('T')[0];
                                        })()}
                                        max={(() => {
                                            const d = new Date();
                                            d.setFullYear(d.getFullYear() + 2);
                                            return d.toISOString().split('T')[0];
                                        })()}
                                        onChange={e => {
                                            const newDate = e.target.value;
                                            let updatedData = { ...formData, start_date: newDate };
                                            
                                            // Tự động gợi ý trạng thái "Sắp khai giảng" nếu ngày bắt đầu ở tương lai
                                            if (!isEditing && newDate > new Date().toISOString().split('T')[0]) {
                                                updatedData.status = 'upcoming';
                                            }
                                            setFormData(updatedData);
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '0.875rem' }}>Ca học *</label>
                                    <select
                                        className="input"
                                        value={formData.session_time}
                                        onChange={e => setFormData({ ...formData, session_time: e.target.value })}
                                        required
                                    >
                                        <option value="">-- Chọn ca học --</option>
                                        <option value="Sáng (08:00 - 11:00)">Sáng (08:00 - 11:00)</option>
                                        <option value="Chiều (14:00 - 17:00)">Chiều (14:00 - 17:00)</option>
                                        <option value="Tối 1 (18:00 - 20:00)">Tối 1 (18:00 - 20:00)</option>
                                        <option value="Tối 2 (20:00 - 22:00)">Tối 2 (20:00 - 22:00)</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '0.875rem' }}>Sĩ số tối đa</label>
                                    <input
                                        className="input"
                                        type="number"
                                        min="1"
                                        max="30"
                                        value={formData.max_students}
                                        onChange={e => {
                                            const val = e.target.value;
                                            setFormData({ ...formData, max_students: val === '' ? '' : parseInt(val) });
                                        }}
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '0.875rem' }}>Trạng thái</label>
                                <select
                                    className="input"
                                    value={formData.status}
                                    onChange={e => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="active">Đang mở</option>
                                    <option value="upcoming">Sắp khai giảng</option>
                                    <option value="closed">Đã đóng</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="button" className="btn" onClick={() => setShowModal(false)}
                                    style={{ border: '1px solid var(--border)', background: 'white', color: 'var(--text-main)' }}>
                                    Hủy
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Lưu
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}


            {/* Modal xác nhận xóa */}
            {showDeleteModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="card" style={{ width: '400px', maxWidth: '90vw', padding: '2rem', textAlign: 'center' }}>
                        <div style={{ color: '#ef4444', marginBottom: '1rem' }}>
                            <Trash2 size={48} />
                        </div>
                        <h3>Xác nhận xóa</h3>
                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                            Bạn có chắc chắn muốn xóa lớp <strong>{selectedClass?.class_name}</strong>?
                            Hành động này không thể hoàn tác.
                        </p>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                            <button className="btn" onClick={() => setShowDeleteModal(false)}
                                style={{ border: '1px solid var(--border)', background: 'white', color: 'var(--text-main)' }}>
                                Hủy
                            </button>
                            <button className="btn" onClick={handleDeleteClass}
                                style={{ background: '#ef4444', color: 'white' }}>
                                Xác nhận xóa
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Phân công GV */}
            {showAssignModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 1000
                }}>
                    <div className="card" style={{ width: '450px', maxWidth: '95vw', padding: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: 0 }}>Phân công Giáo viên</h3>
                            <button onClick={() => setShowAssignModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAssignTeacher} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '0.875rem' }}>Chọn lớp *</label>
                                <select
                                    className="input"
                                    value={assignData.class_id}
                                    onChange={e => setAssignData({ ...assignData, class_id: e.target.value })}
                                    required
                                >
                                    <option value="">-- Chọn lớp học --</option>
                                    {classes.filter(c => c.status !== 'closed').map(c => (
                                        <option key={c.id} value={c.id}>{c.class_name} ({c.class_code || '---'}) - Dạy: {c.teacher_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', marginBottom: '4px', fontWeight: 600, fontSize: '0.875rem' }}>Chọn giáo viên *</label>
                                <select
                                    className="input"
                                    value={assignData.teacher_id}
                                    onChange={e => setAssignData({ ...assignData, teacher_id: e.target.value })}
                                    required
                                >
                                    <option value="">-- Chọn giáo viên --</option>
                                    {teachers.map(t => (
                                        <option key={t.id} value={t.id}>{t.full_name} ({t.specialized_subject})</option>
                                    ))}
                                </select>
                            </div>

                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '1rem' }}>
                                <button type="button" className="btn" onClick={() => setShowAssignModal(false)}
                                    style={{ border: '1px solid var(--border)', background: 'white', color: 'var(--text-main)' }}>
                                    Hủy
                                </button>
                                <button type="submit" className="btn" style={{ background: '#f59e0b', color: 'white', border: 'none' }}>
                                    Phân công
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};


export default AdminClasses;
