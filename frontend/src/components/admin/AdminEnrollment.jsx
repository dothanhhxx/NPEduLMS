import React, { useState, useEffect, useMemo } from 'react';
import { Search, UserPlus, CheckSquare, Square, Users } from 'lucide-react';
import { classAPI, studentAPI } from '../../api'; 

const AdminEnrollment = ({ initialClassId }) => {
    const [classes, setClasses] = useState([]);
    const [students, setStudents] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    
   const [selectedClass, setSelectedClass] = useState(initialClassId || '');
        // Thêm đoạn này để tự động nhảy lớp khi bấm từ trang ngoài vào
        useEffect(() => {
            if (initialClassId) {
                setSelectedClass(initialClassId);
            }
        }, [initialClassId]);
    const [search, setSearch] = useState('');
    const [selectedStudents, setSelectedStudents] = useState([]); 
    const [message, setMessage] = useState({ type: '', text: '' });

    // 1. Hàm lấy dữ liệu (Fetch Data)
    const fetchData = async () => {
        try {
            setIsLoading(true);
            const [classRes, studentRes] = await Promise.all([
                classAPI.getAll(),
                studentAPI.getAll()
            ]);
            console.log("Dữ liệu lớp học nhận được:", classRes.data.data); // THÊM DÒNG NÀY
            // Backend trả về: { status: 'Success', data: [...] }
            setClasses(classRes.data.data || []);
            // Student API trả về mảng trực tiếp: [...]
            setStudents(studentRes.data || []);
        } catch (error) {
            console.error("Lỗi lấy dữ liệu:", error);
            setMessage({ type: 'error', text: 'Lỗi tải dữ liệu. Vui lòng kiểm tra kết nối!' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // 2. Logic Tìm kiếm

    // Hàm kiểm tra xem học sinh đã có trong lớp đang chọn chưa
    const isEnrolled = (studentId) => {
        const currentClass = classes.find(c => String(c.id) === String(selectedClass));
        // Dùng .some() và ép kiểu String cả hai bên để đảm bảo luôn khớp dữ liệu
        return currentClass?.enrolled_student_ids?.some(id => String(id) === String(studentId)) || false;
    };
        
    const filteredStudents = useMemo(() => {
        return students.filter(s => 
            (s.full_name || '').toLowerCase().includes(search.toLowerCase()) || 
            (s.email || '').toLowerCase().includes(search.toLowerCase())
        );
    }, [students, search]);

    // 3. Logic chọn học viên (Dùng s.id thống nhất)
    const toggleStudent = (id) => {
        setSelectedStudents(prev => 
            prev.includes(id) ? prev.filter(sId => sId !== id) : [...prev, id]
        );
    };

       const toggleAll = () => {
        // Chỉ lấy danh sách những học viên chưa có trong lớp này
        const enrollableStudents = filteredStudents.filter(s => !isEnrolled(s.id));
        
        if (selectedStudents.length === enrollableStudents.length && enrollableStudents.length > 0) {
            setSelectedStudents([]);
        } else {
            setSelectedStudents(enrollableStudents.map(s => s.id));
        }
    };

    // 4. XỬ LÝ GHI DANH (Fix logic cập nhật sĩ số)
    const handleEnroll = async () => {
    // 1. Kiểm tra xem đã chọn lớp chưa
    if (!selectedClass) {
        setMessage({ type: 'error', text: 'Vui lòng chọn lớp học!' });
        return;
    }

    // 2. Kiểm tra xem đã chọn học viên chưa
    if (selectedStudents.length === 0) {
        setMessage({ type: 'error', text: 'Vui lòng chọn ít nhất 1 học viên!' });
        return;
    }

    // 3. KIỂM TRA SĨ SỐ: Ngăn chặn nếu vượt quá giới hạn
    // maxCapacity ở đây đã được gán bằng currentClassInfo?.max_students
    // 3. KIỂM TRA SĨ SỐ (Bản nâng cấp "thông minh")
    const remainingSlots = maxCapacity - currentCount; // Tính số chỗ còn trống

    if (remainingSlots <= 0) {
        // Trường hợp 1: Lớp đã đầy sẵn rồi (ví dụ 5/5)
        setMessage({ 
            type: 'error', 
            text: `Lớp học đã đạt số lượng tối đa. Không thể thêm học viên.` 
        });
        return;
    } 

    if (selectedStudents.length > remainingSlots) {
        // Trường hợp 2: Lớp chưa đầy, nhưng số lượng chọn vào lại làm nó "nổ" sĩ số
        setMessage({ 
            type: 'error', 
            text: `Lớp học đã đạt số lượng tối đa. Không thể thêm học viên.` 
        });
        return;
    }

    try {
        setMessage({ type: 'info', text: 'Đang xử lý ghi danh...' });
        
        const res = await classAPI.enrollStudents(selectedClass, { 
            student_ids: selectedStudents 
        });
        
        if (res.data.status === 'Success') {
            setMessage({ type: 'success', text: 'Đã thêm thành công học viên.' });
            setSelectedStudents([]); 
            await fetchData(); // Cập nhật lại sĩ số mới từ server
        }
    } catch (error) {
        const errorText = error.response?.data?.message || 'Lỗi ghi danh học viên.';
        setMessage({ type: 'error', text: errorText });
    }
};

    // 5. Logic tính toán sĩ số (Khớp với Key Backend: student_count)
    const currentClassInfo = classes.find(c => String(c.id) === String(selectedClass));
    const currentCount = currentClassInfo?.student_count || 0; 
    const maxCapacity = currentClassInfo?.max_students || 25;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            

            {message.text && (
                <div style={{ 
                    padding: '1rem', 
                    borderRadius: '8px', 
                    background: message.type === 'error' ? '#fee2e2' : message.type === 'success' ? '#d1fae5' : '#dbeafe',
                    color: message.type === 'error' ? '#991b1b' : message.type === 'success' ? '#065f46' : '#1e40af',
                    fontWeight: 500
                }}>
                    {message.text}
                </div>
            )}

            <div className="card" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '20px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
                <div style={{ flex: '1', minWidth: '250px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>1. Chọn Lớp học <span style={{color: 'red'}}>*</span></label>
                    <select 
                        className="input" 
                        value={selectedClass} 
                        onChange={(e) => {
                            setSelectedClass(e.target.value);
                            setMessage({ type: '', text: '' }); 
                        }}
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #ddd' }}
                    >
                        <option value="">-- Chọn lớp học cần ghi danh --</option>
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>
                                {cls.class_name} (Sĩ số: {cls.student_count || 0}/{cls.max_students || 25})
                            </option>
                        ))}
                    </select>
                </div>

                <div style={{ flex: '2', minWidth: '300px' }}>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, marginBottom: '8px' }}>2. Tìm kiếm Học viên</label>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'gray' }} />
                        <input
                            className="input"
                            maxLength={100}
                            style={{ width: '100%', padding: '10px 10px 10px 40px', borderRadius: '6px', border: '1px solid #ddd' }}
                            placeholder="Nhập tên hoặc email học viên..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="card" style={{ padding: 0, overflow: 'hidden', background: 'white', borderRadius: '12px' }}>
                <div style={{ padding: '1rem 1.5rem', background: '#f8fafc', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Users size={18} color="#1C513E" /> Danh sách học viên khả dụng
                    </div>
                    <div style={{ fontSize: '0.85rem' }}>
                        Đã chọn: <strong style={{ color: '#1C513E' }}>{selectedStudents.length}</strong> học viên
                    </div>
                </div>

                <div style={{maxHeight: '350px', overflowY: 'auto'}}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: '#f8fafc', textAlign: 'left', fontSize: '0.8rem' }}>
                            <tr>
                                <th style={{ padding: '12px', textAlign: 'center' }}>
                                    <button onClick={toggleAll} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                        {selectedStudents.length === filteredStudents.length && filteredStudents.length > 0 ? <CheckSquare size={20} color="#1C513E" /> : <Square size={20} color="#64748b" />}
                                    </button>
                                </th>
                                <th style={{ padding: '12px' }}>HỌ VÀ TÊN</th>
                                <th style={{ padding: '12px' }}>EMAIL</th>
                                <th style={{ padding: '12px' }}>SỐ ĐIỆN THOẠI</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map(student => {
                            const enrolled = isEnrolled(student.id); // Check xem đã học lớp này chưa
                            
                            return (
                                <tr key={student.id} 
                                    style={{ 
                                        borderBottom: '1px solid #f1f5f9', 
                                        // Nếu đã có trong lớp thì màu nền xám, nếu đang chọn thì màu xanh
                                        background: enrolled ? '#f8fafc' : (selectedStudents.includes(student.id) ? '#f0fdf4' : 'transparent'),
                                        // Nếu đã có thì hiện icon "cấm", nếu chưa thì hiện bàn tay
                                        cursor: enrolled ? 'not-allowed' : 'pointer',
                                        opacity: enrolled ? 0.6 : 1 
                                    }}
                                    onClick={() => !enrolled && toggleStudent(student.id)} // Đã có thì không cho bấm chọn
                                >
                                    <td style={{ padding: '12px', textAlign: 'center' }}>
                                        {enrolled ? (
                                            <CheckSquare size={20} color="#94a3b8" />
                                        ) : (
                                            selectedStudents.includes(student.id) ? <CheckSquare size={20} color="#1C513E" /> : <Square size={20} color="#64748b" />
                                        )}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{ fontWeight: 600 }}>{student.full_name}</div>
                                        <div style={{ fontSize: '0.7rem', color: 'gray' }}>ID: STU-0{student.id}</div>
                                    </td>
                                    <td style={{ padding: '12px', fontSize: '0.85rem' }}>{student.email}</td>
                                    <td style={{ padding: '12px', fontSize: '0.85rem' }}>{student.phone || '---'}</td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
                
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #eee', display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '1.5rem' }}>
                    {currentClassInfo && (
                        <span style={{ fontSize: '0.85rem' }}>
                            Sĩ số dự kiến: <strong style={{color: (currentCount + selectedStudents.length > maxCapacity) ? 'red' : '#1C513E'}}>
                                {currentCount + selectedStudents.length}
                            </strong> / {maxCapacity}
                        </span>
                    )}
                    
                    <button 
                        onClick={handleEnroll}
                        disabled={selectedStudents.length === 0}
                        style={{ 
                            padding: '10px 24px', 
                            borderRadius: '8px', 
                            backgroundColor: '#1C513E', 
                            color: 'white', 
                            border: 'none', 
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            opacity: (selectedStudents.length === 0) ? 0.6 : 1
                        }}
                    >
                        <UserPlus size={18} /> Ghi danh ngay
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AdminEnrollment;
