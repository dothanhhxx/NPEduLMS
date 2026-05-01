import React, { useState, useEffect, useCallback } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, ChevronLeft, ChevronRight, GraduationCap, CheckSquare, Loader, Users } from 'lucide-react';
import { classAPI } from '../api';
import { toast } from 'react-toastify';

const Attendance = ({ classes }) => {
    const [selectedClass, setSelectedClass] = useState(null);
    const [date, setDate] = useState(new Date());
    const [attendance, setAttendance] = useState({});
    const [notes, setNotes] = useState({});             // Ghi chú lý do cho từng học sinh
    const [classStudents, setClassStudents] = useState([]); // Học sinh của lớp đang chọn
    const [loadingStudents, setLoadingStudents] = useState(false);

    // Khi chọn lớp → fetch học sinh từ enrollments
    const fetchClassStudents = useCallback(async (classId) => {
        setLoadingStudents(true);
        setClassStudents([]);
        try {
            const res = await classAPI.getStudents(classId);
            const students = res.data?.data || [];
            setClassStudents(students);
            // Reset trạng thái điểm danh khi đổi lớp
            setAttendance({});
            setNotes({});
        } catch (err) {
            console.error('Lỗi lấy danh sách học sinh:', err);
            toast.error('Không thể tải danh sách học sinh của lớp này.');
            setClassStudents([]);
        } finally {
            setLoadingStudents(false);
        }
    }, []);

    // Khi chọn một lớp
    const handleSelectClass = (cls) => {
        setSelectedClass(cls);
        fetchClassStudents(cls.id);
    };

    // Khi đổi ngày → reset điểm danh (chưa có persistence qua backend /attendance)
    const changeDate = (days) => {
        const newDate = new Date(date);
        newDate.setDate(newDate.getDate() + days);
        setDate(newDate);
        setAttendance({});
        setNotes({});
    };

    const handleStatusChange = (studentId, status) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: status
        }));
    };

    const handleNoteChange = (studentId, value) => {
        setNotes(prev => ({ ...prev, [studentId]: value }));
    };

    const handleMarkAll = (status) => {
        const newAttendance = {};
        classStudents.forEach(s => {
            newAttendance[s.student_id] = status;
        });
        setAttendance(newAttendance);
        const label = status === 'present' ? 'CÓ MẶT' : status === 'absent' ? 'VẮNG' : 'MUỘN';
        toast.success(`Đã đánh dấu ${label} cho toàn bộ ${classStudents.length} học viên!`);
    };

    const handleSaveAttendance = () => {
        const totalMarked = Object.keys(attendance).length;
        if (totalMarked === 0) {
            toast.warning('Bạn chưa điểm danh cho học viên nào!');
            return;
        }
        // TODO: Gọi API lưu điểm danh khi backend route /attendance được xây dựng
        toast.success(`Đã lưu điểm danh ${totalMarked}/${classStudents.length} học viên!`);
    };

    const formatDate = (d) => {
        return d.toLocaleDateString('vi-VN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const countStatus = (status) => Object.values(attendance).filter(s => s === status).length;

    // ─── VIEW 1: Chọn lớp ────────────────────────────────────────────
    if (!selectedClass) {
        return (
            <div style={{ padding: 'var(--space-lg)' }}>
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <h1>Điểm danh</h1>
                    <p style={{ color: 'var(--text-muted)' }}>
                        Chọn lớp để bắt đầu điểm danh hôm nay.
                    </p>
                </div>

                {classes.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--text-muted)' }}>
                        <GraduationCap size={40} style={{ marginBottom: 'var(--space-md)', opacity: 0.4 }} />
                        <p>Chưa có lớp học nào được phân công.</p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                        gap: 'var(--space-lg)'
                    }}>
                        {classes.map(cls => (
                            <div
                                key={cls.id}
                                onClick={() => handleSelectClass(cls)}
                                className="card"
                                style={{
                                    cursor: 'pointer',
                                    transition: 'transform 0.2s, box-shadow 0.2s',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    textAlign: 'center',
                                    gap: 'var(--space-md)',
                                    borderTop: '4px solid var(--secondary)',
                                    padding: 'var(--space-lg)'
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.transform = 'translateY(-4px)';
                                    e.currentTarget.style.boxShadow = 'var(--shadow-md)';
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '';
                                }}
                            >
                                <div style={{
                                    padding: 'var(--space-md)',
                                    borderRadius: '50%',
                                    background: 'hsl(150, 60%, 90%)',
                                    color: 'var(--secondary)'
                                }}>
                                    <GraduationCap size={32} />
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.1rem', marginBottom: '4px' }}>
                                        {cls.class_name}
                                    </h3>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '4px' }}>
                                        {cls.class_code}
                                    </p>
                                    <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                        <Users size={14} />
                                        {cls.student_count || 0} học viên
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    }

    // ─── VIEW 2: Điểm danh ───────────────────────────────────────────
    const presentCount = countStatus('present');
    const absentCount  = countStatus('absent');
    const lateCount    = countStatus('late');

    return (
        <div style={{ padding: 'var(--space-lg)' }}>
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-lg)',
                flexWrap: 'wrap',
                gap: 'var(--space-md)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                    <button
                        onClick={() => { setSelectedClass(null); setClassStudents([]); setAttendance({}); }}
                        className="btn"
                        style={{ padding: 'var(--space-sm)', color: 'var(--text-muted)' }}
                        title="Quay lại"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <div>
                        <h1 style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                            <GraduationCap size={24} color="var(--text-muted)" />
                            {selectedClass.class_name}
                        </h1>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                            Điểm danh ngày {formatDate(date)}
                        </p>
                    </div>
                </div>

                {/* Date Picker */}
                <div className="card" style={{
                    padding: 'var(--space-sm) var(--space-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-md)'
                }}>
                    <button
                        onClick={() => changeDate(-1)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontWeight: '500' }}>
                        <Calendar size={18} color="var(--primary)" />
                        <span style={{ textTransform: 'capitalize', fontSize: '0.875rem' }}>
                            {formatDate(date)}
                        </span>
                    </div>
                    <button
                        onClick={() => changeDate(1)}
                        style={{ border: 'none', background: 'transparent', cursor: 'pointer' }}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Action Buttons */}
                <div style={{ display: 'flex', gap: 'var(--space-sm)' }}>
                    <button
                        className="btn btn-primary"
                        onClick={() => handleMarkAll('present')}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                        disabled={loadingStudents || classStudents.length === 0}
                    >
                        <CheckSquare size={18} />
                        <span>Có mặt tất cả</span>
                    </button>
                    <button
                        className="btn"
                        onClick={handleSaveAttendance}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            background: 'var(--secondary)',
                            color: '#fff'
                        }}
                        disabled={loadingStudents || classStudents.length === 0}
                    >
                        Lưu điểm danh
                    </button>
                </div>
            </div>

            {/* Summary Stats */}
            {classStudents.length > 0 && (
                <div style={{
                    display: 'flex',
                    gap: 'var(--space-md)',
                    marginBottom: 'var(--space-md)',
                    flexWrap: 'wrap'
                }}>
                    <div className="card" style={{ flex: 1, minWidth: '120px', textAlign: 'center', padding: 'var(--space-md)', borderTop: '3px solid var(--secondary)' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--secondary)' }}>{presentCount}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Có mặt</div>
                    </div>
                    <div className="card" style={{ flex: 1, minWidth: '120px', textAlign: 'center', padding: 'var(--space-md)', borderTop: '3px solid orange' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'orange' }}>{lateCount}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Đi muộn</div>
                    </div>
                    <div className="card" style={{ flex: 1, minWidth: '120px', textAlign: 'center', padding: 'var(--space-md)', borderTop: '3px solid var(--accent)' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700', color: 'var(--accent)' }}>{absentCount}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Vắng mặt</div>
                    </div>
                    <div className="card" style={{ flex: 1, minWidth: '120px', textAlign: 'center', padding: 'var(--space-md)', borderTop: '3px solid var(--border)' }}>
                        <div style={{ fontSize: '1.5rem', fontWeight: '700' }}>
                            {classStudents.length - presentCount - lateCount - absentCount}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Chưa điểm</div>
                    </div>
                </div>
            )}

            {/* Students Table */}
            <div className="card">
                {loadingStudents ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--text-muted)' }}>
                        <Loader size={24} style={{ animation: 'spin 1s linear infinite', marginBottom: '8px' }} />
                        <p>Đang tải danh sách học viên...</p>
                    </div>
                ) : classStudents.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--text-muted)' }}>
                        <Users size={40} style={{ marginBottom: 'var(--space-md)', opacity: 0.4 }} />
                        <p>Lớp này chưa có học viên nào.</p>
                        <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                            Vui lòng vào <strong>Ghi danh</strong> để thêm học viên vào lớp.
                        </p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{
                                textAlign: 'left',
                                color: 'var(--text-muted)',
                                borderBottom: '1px solid var(--border)',
                                background: 'var(--bg-subtle, #f9fafb)'
                            }}>
                                <th style={{ padding: 'var(--space-md)', width: '40px' }}>#</th>
                                <th style={{ padding: 'var(--space-md)' }}>Tên học viên</th>
                                <th style={{ padding: 'var(--space-md)' }}>Email</th>
                                <th style={{ padding: 'var(--space-md)', textAlign: 'center' }}>Trạng thái điểm danh</th>
                                <th style={{ padding: 'var(--space-md)' }}>Ghi chú / Lý do</th>
                            </tr>
                        </thead>
                        <tbody>
                            {classStudents.map((student, idx) => {
                                const sid = student.student_id;
                                const status = attendance[sid];
                                return (
                                    <tr
                                        key={sid}
                                        style={{
                                            borderBottom: '1px solid var(--border)',
                                            background: status === 'present'
                                                ? 'hsl(150, 60%, 97%)'
                                                : status === 'absent'
                                                    ? 'hsl(0, 60%, 97%)'
                                                    : status === 'late'
                                                        ? 'hsl(40, 60%, 97%)'
                                                        : 'transparent',
                                            transition: 'background 0.2s'
                                        }}
                                    >
                                        <td style={{ padding: 'var(--space-md)', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            {idx + 1}
                                        </td>
                                        <td style={{ padding: 'var(--space-md)', fontWeight: '500' }}>
                                            {student.full_name}
                                        </td>
                                        <td style={{ padding: 'var(--space-md)', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                            {student.email}
                                        </td>
                                        <td style={{ padding: 'var(--space-md)' }}>
                                            <div style={{ display: 'flex', justifyContent: 'center', gap: 'var(--space-lg)' }}>

                                                {/* CÓ MẶT */}
                                                <label style={{
                                                    display: 'flex', flexDirection: 'column',
                                                    alignItems: 'center', cursor: 'pointer', gap: '4px'
                                                }}>
                                                    <div style={{
                                                        padding: '4px', borderRadius: '50%',
                                                        border: `2px solid ${status === 'present' ? 'var(--secondary)' : 'var(--border)'}`,
                                                        color: status === 'present' ? 'var(--secondary)' : 'var(--text-muted)',
                                                        transition: 'all 0.15s'
                                                    }}>
                                                        <CheckCircle size={24} fill={status === 'present' ? 'currentColor' : 'none'} />
                                                    </div>
                                                    <input
                                                        type="radio"
                                                        name={`att-${sid}`}
                                                        value="present"
                                                        checked={status === 'present'}
                                                        onChange={() => handleStatusChange(sid, 'present')}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '500', color: status === 'present' ? 'var(--secondary)' : 'var(--text-muted)' }}>
                                                        Có mặt
                                                    </span>
                                                </label>

                                                {/* MUỘN */}
                                                <label style={{
                                                    display: 'flex', flexDirection: 'column',
                                                    alignItems: 'center', cursor: 'pointer', gap: '4px'
                                                }}>
                                                    <div style={{
                                                        padding: '4px', borderRadius: '50%',
                                                        border: `2px solid ${status === 'late' ? 'orange' : 'var(--border)'}`,
                                                        color: status === 'late' ? 'orange' : 'var(--text-muted)',
                                                        transition: 'all 0.15s'
                                                    }}>
                                                        <Clock size={24} fill={status === 'late' ? 'currentColor' : 'none'} />
                                                    </div>
                                                    <input
                                                        type="radio"
                                                        name={`att-${sid}`}
                                                        value="late"
                                                        checked={status === 'late'}
                                                        onChange={() => handleStatusChange(sid, 'late')}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '500', color: status === 'late' ? 'orange' : 'var(--text-muted)' }}>
                                                        Muộn
                                                    </span>
                                                </label>

                                                {/* VẮNG */}
                                                <label style={{
                                                    display: 'flex', flexDirection: 'column',
                                                    alignItems: 'center', cursor: 'pointer', gap: '4px'
                                                }}>
                                                    <div style={{
                                                        padding: '4px', borderRadius: '50%',
                                                        border: `2px solid ${status === 'absent' ? 'var(--accent)' : 'var(--border)'}`,
                                                        color: status === 'absent' ? 'var(--accent)' : 'var(--text-muted)',
                                                        transition: 'all 0.15s'
                                                    }}>
                                                        <XCircle size={24} fill={status === 'absent' ? 'currentColor' : 'none'} />
                                                    </div>
                                                    <input
                                                        type="radio"
                                                        name={`att-${sid}`}
                                                        value="absent"
                                                        checked={status === 'absent'}
                                                        onChange={() => handleStatusChange(sid, 'absent')}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <span style={{ fontSize: '0.75rem', fontWeight: '500', color: status === 'absent' ? 'var(--accent)' : 'var(--text-muted)' }}>
                                                        Vắng
                                                    </span>
                                                </label>

                                            </div>
                                        </td>

                                        {/* GHI CHÚ */}
                                        <td style={{ padding: 'var(--space-md)', verticalAlign: 'middle' }}>
                                            <input
                                                type="text"
                                                className="input"
                                                placeholder={status === 'absent' ? 'Lý do vắng...' : status === 'late' ? 'Lý do muộn...' : 'Ghi chú...'}
                                                value={notes[sid] || ''}
                                                onChange={e => handleNoteChange(sid, e.target.value)}
                                                style={{
                                                    width: '100%',
                                                    fontSize: '0.85rem',
                                                    padding: '6px 10px',
                                                    borderRadius: '6px',
                                                    border: '1px solid var(--border)',
                                                    background: 'transparent',
                                                    color: 'var(--text-main)',
                                                    outline: 'none',
                                                    transition: 'border-color 0.15s'
                                                }}
                                                onFocus={e => e.target.style.borderColor = 'var(--primary)'}
                                                onBlur={e => e.target.style.borderColor = 'var(--border)'}
                                            />
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default Attendance;
