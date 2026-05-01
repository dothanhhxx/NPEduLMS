import React, { useState, useMemo } from 'react';
import { Search, Plus, Trash2, Filter, GraduationCap, ChevronLeft, Users, Eye, Key, MoreVertical } from 'lucide-react';
import { toast } from 'react-toastify';
import { classAPI } from '../api';
import Table from './common/Table';
import Pagination from './common/Pagination';

const Students = ({ students, classes, onAddStudent, onDeleteStudent }) => {
    // viewMode: 'classes' | 'list'
    const [selectedClass, setSelectedClass] = useState(null);
    const [selectedClassName, setSelectedClassName] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newStudent, setNewStudent] = useState({ name: '', age: '', phone: '' });
    const [searchTerm, setSearchTerm] = useState('');
    const [classStudents, setClassStudents] = useState([]);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const ROWS_PER_PAGE = 8;

    // classes is now passed via props from App.jsx so we don't need predefinedClasses logic

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validation
        if (!newStudent.name.trim()) {
            toast.error('Vui lòng nhập tên học viên!');
            return;
        }

        const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
        if (!newStudent.phone || !phoneRegex.test(newStudent.phone)) {
            toast.error('Số điện thoại không hợp lệ (VN)');
            return;
        }

        if (newStudent.age && (newStudent.age < 5 || newStudent.age > 100)) {
            toast.warning('Tuổi học viên có vẻ không đúng?');
        }

        // If adding from a specific class view, auto-fill
        const studentToAdd = {
            ...newStudent,
            class_id: selectedClass !== 'All' ? selectedClass : ''
        };

        onAddStudent(studentToAdd);
        toast.success(`Đã thêm học viên: ${newStudent.name}`);
        setNewStudent({ name: '', age: '', phone: '' });
        setIsAdding(false);
    };

    const handleSelectClass = async (classData) => {
        setSelectedClass(classData.id);
        setSelectedClassName(classData.class_name);
        try {
            const res = await classAPI.getStudents(classData.id);
            setClassStudents(res.data.data);
        } catch (error) {
            console.error("Error fetching students for class:", error);
            toast.error("Lỗi lấy danh sách học viên lớp này");
        }
    };

    const filteredStudents = classStudents.filter(s => {
        const matchesSearch = s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.phone?.includes(searchTerm);
        return matchesSearch;
    });

    // Reset pagination when search changes
    useMemo(() => setCurrentPage(1), [searchTerm]);

    const totalPages = Math.ceil(filteredStudents.length / ROWS_PER_PAGE);
    const paginatedStudents = filteredStudents.slice((currentPage - 1) * ROWS_PER_PAGE, currentPage * ROWS_PER_PAGE);

    const columns = [
        {
            header: 'Họ tên học viên',
            accessor: 'full_name',
            render: (row) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600', color: 'var(--text-main)' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary-dark)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.875rem' }}>
                        {row.full_name ? row.full_name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    {row.full_name}
                </div>
            )
        },
        {
            header: 'Số điện thoại',
            accessor: 'phone',
            render: (row) => row.phone || '-'
        },
        {
            header: 'Email liên hệ',
            accessor: 'email',
            render: (row) => row.email || '-'
        },
        {
            header: 'Trạng thái',
            accessor: 'status',
            render: () => (
                <span style={{ padding: '4px 12px', borderRadius: '99px', fontSize: '0.75rem', fontWeight: '600', background: 'var(--primary-light)', color: 'var(--primary-dark)' }}>
                    Đang học
                </span>
            )
        },
        {
            header: 'Thao tác',
            align: 'right',
            render: (row) => (
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                    <button className="icon-btn" title="Xem chi tiết" style={{ padding: '6px', background: 'var(--background)', borderRadius: '6px' }}>
                        <Eye size={16} />
                    </button>
                    <button className="icon-btn" title="Đổi mật khẩu" style={{ padding: '6px', background: 'var(--background)', borderRadius: '6px' }}>
                        <Key size={16} />
                    </button>
                    <button className="icon-btn" title="Phân quyền & Tùy chọn" style={{ padding: '6px', background: 'var(--background)', borderRadius: '6px' }}>
                        <MoreVertical size={16} />
                    </button>
                    <button
                        onClick={() => {
                            if (window.confirm('Khóa học viên ' + row.full_name + '?')) {
                                toast.info('API xoá học viên khỏi lớp chưa có');
                            }
                        }}
                        className="icon-btn" title="Khóa" style={{ padding: '6px', background: '#fef2f2', color: 'var(--accent)', borderRadius: '6px' }}>
                        <Trash2 size={16} />
                    </button>
                </div>
            )
        }
    ];

    // 1. CLASS SELECTION VIEW
    if (!selectedClass) {
        return (
            <div style={{ padding: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                    <div>
                        <h1>Danh sách Lớp học</h1>
                        <p style={{ color: 'var(--text-muted)' }}>Chọn lớp để xem danh sách học viên.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 'var(--space-lg)' }}>
                    {classes.map(cls => (
                        <div
                            key={cls.id}
                            onClick={() => handleSelectClass(cls)}
                            className="card"
                            style={{
                                cursor: 'pointer',
                                transition: 'transform 0.2s',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center',
                                gap: 'var(--space-md)',
                                borderTop: '4px solid var(--primary)'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                        >
                            <div style={{ padding: 'var(--space-md)', borderRadius: '50%', background: 'var(--primary-light)', color: 'var(--primary)' }}>
                                <GraduationCap size={32} />
                            </div>
                            <div>
                                <h3 style={{ fontSize: '1.25rem' }}>{cls.class_name}</h3>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // 2. STUDENT LIST VIEW
    return (
        <div style={{ padding: 'var(--space-lg)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <button
                        onClick={() => setSelectedClass(null)}
                        className="btn"
                        style={{ padding: 'var(--space-sm)', color: 'var(--text-muted)' }}
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <GraduationCap size={24} color="var(--text-muted)" />
                            {selectedClassName}
                        </h1>
                        <p style={{ color: 'var(--text-muted)' }}>Danh sách học viên lớp {selectedClassName}</p>
                    </div>
                </div>
                <button className="btn btn-primary" onClick={() => setIsAdding(!isAdding)}>
                    <Plus size={20} style={{ marginRight: 'var(--space-sm)' }} />
                    Thêm học viên
                </button>
            </div>

            {isAdding && (
                <div className="card" style={{ marginBottom: 'var(--space-lg)', borderLeft: '4px solid var(--primary)' }}>
                    <h3>Thêm học viên vào lớp {selectedClassName}</h3>
                    <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                        <input
                            className="input"
                            placeholder="Họ và tên"
                            value={newStudent.name}
                            onChange={e => setNewStudent({ ...newStudent, name: e.target.value })}
                        />
                        <input
                            className="input"
                            placeholder="Tuổi"
                            type="number"
                            value={newStudent.age}
                            onChange={e => setNewStudent({ ...newStudent, age: e.target.value })}
                        />
                        <input
                            className="input"
                            placeholder="Số điện thoại"
                            value={newStudent.phone}
                            onChange={e => setNewStudent({ ...newStudent, phone: e.target.value })}
                        />
                        <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                            <button type="submit" className="btn btn-primary">Lưu</button>
                            <button type="button" className="btn" onClick={() => setIsAdding(false)} style={{ border: '1px solid var(--border)' }}>Hủy</button>
                        </div>
                    </form> // Form Submit cần viết lại tương tác API tạo Enrollments sau
                </div>
            )}

            <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
                <div style={{ padding: 'var(--space-lg)', borderBottom: '1px solid var(--border)', display: 'flex', gap: 'var(--space-md)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', background: 'var(--background)', padding: '0.75rem 1.25rem', borderRadius: '99px', flex: 1 }}>
                        <Search size={20} color="var(--text-muted)" style={{ marginRight: '8px' }} />
                        <input
                            style={{ border: 'none', background: 'transparent', outline: 'none', width: '100%', fontSize: '0.95rem' }}
                            placeholder={`Tìm theo tên, email hoặc SĐT trong lớp ${selectedClassName}...`}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button className="btn" style={{ border: '1px solid var(--border)', background: 'var(--surface)', color: 'var(--text-main)', borderRadius: '99px', padding: '0.5rem 1.25rem' }}>
                        <Filter size={18} style={{ marginRight: '8px' }} />
                        Lọc theo trạng thái
                    </button>
                </div>

                <Table 
                    columns={columns} 
                    data={paginatedStudents} 
                    emptyMessage="Không tìm thấy học viên nào" 
                    EmptyIcon={Users} 
                />
                
                <Pagination 
                    currentPage={currentPage} 
                    totalPages={totalPages} 
                    onPageChange={setCurrentPage} 
                />
            </div>
        </div>
    );
};

export default Students;
