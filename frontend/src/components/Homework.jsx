import React, { useState, useEffect, useRef, useCallback } from 'react';
import { homeworkAPI } from '../api';
import { FileText, Search, Upload, UploadCloud, File, FileIcon, Video, CheckCircle, AlertTriangle, Download, X, Star, BookOpen, Clock, ChevronRight } from 'lucide-react';
import './Homework.css';

const API_BASE = `http://${window.location.hostname}:5000`;

const Homework = ({ authUser, classes }) => {
    const [selectedClassId, setSelectedClassId] = useState('all');
    const [homeworkList, setHomeworkList] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortOrder, setSortOrder] = useState('due-asc'); // nearest deadline first
    
    // View state: 'list' | 'create' | 'detail'
    const [view, setView] = useState('list');
    const [selectedHomework, setSelectedHomework] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [statusFilter, setStatusFilter] = useState('all');
    
    // Form state for creating homework
    const [newHomework, setNewHomework] = useState({
        classId: '',
        title: '',
        description: '',
        start_date: '',
        due_date: '',
        file: null
    });
    const [formErrors, setFormErrors] = useState({});

    // Submit state (student)
    const [submitFile, setSubmitFile] = useState(null);
    const [submitError, setSubmitError] = useState('');
    const [submitSuccess, setSubmitSuccess] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    // Grading state (teacher)
    const [gradeModal, setGradeModal] = useState(null); // { submissionId, studentName, currentScore, currentFeedback }
    const [gradeScore, setGradeScore] = useState('');
    const [gradeFeedback, setGradeFeedback] = useState('');
    const [grading, setGrading] = useState(false);

    const fileInputRef = useRef(null);
    const submitFileRef = useRef(null);

    const isStudent = authUser?.role === 'Student';
    const isTeacher = authUser?.role === 'Teacher';

    const ALLOWED_TYPES = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    const ALLOWED_EXTS = ['.pdf', '.doc', '.docx'];
    const MAX_SIZE = 100 * 1024 * 1024; // 100 MB

    useEffect(() => {
        fetchHomework(selectedClassId);
    }, [selectedClassId, classes]);

    const fetchHomework = async (classId) => {
        setLoading(true);
        try {
            const res = classId === 'all'
                ? await homeworkAPI.getAll()
                : await homeworkAPI.getByClass(classId);
            setHomeworkList(res.data.data || []);
        } catch (error) {
            console.error('Lỗi khi lấy bài tập:', error);
            setHomeworkList([]);
        } finally {
            setLoading(false);
        }
    };

    const openDetail = async (hw) => {
        setDetailLoading(true);
        setView('detail');
        setSubmitFile(null);
        setSubmitError('');
        setSubmitSuccess('');
        try {
            const res = await homeworkAPI.getById(hw.id);
            setSelectedHomework(res.data.data);
        } catch (e) {
            setSelectedHomework(hw); // fallback to list data
        } finally {
            setDetailLoading(false);
        }
    };

    // ---- Regex kiểm tra ký tự đặc biệt ----
    const HW_SPECIAL_CHARS_REGEX = /[!@#$%^&*()+=\[\]{};':"\\|,.<>\/?~`]/;

    // ---- Create Homework (Teacher) ----
    const handleCreateHomework = async (e) => {
        e.preventDefault();
        const errors = {};
        const { classId, title, description, start_date, due_date, file } = newHomework;
        if (!classId) errors.classId = "Vui lòng chọn môn học/lớp học.";
        if (!title.trim()) errors.title = "Vui lòng nhập tên bài tập.";
        else if (HW_SPECIAL_CHARS_REGEX.test(title.trim())) errors.title = "Tên bài tập không được có ký tự đặc biệt.";
        else if (title.length > 200) errors.title = "Tên bài tập không được vượt quá 200 ký tự.";
        if (!description.trim()) errors.description = "Vui lòng nhập mô tả bài tập.";
        if (!start_date) errors.start_date = "Vui lòng chọn ngày và giờ bắt đầu.";
        if (!due_date) errors.due_date = "Vui lòng chọn hạn nộp.";
        if (start_date && due_date && new Date(due_date) <= new Date(start_date)) {
            errors.due_date = "Hạn nộp phải sau thời gian bắt đầu.";
        }
        if (!file) errors.file = "Vui lòng chọn tệp đính kèm.";
        else if (file.size > MAX_SIZE) errors.file = "Dung lượng tệp đính kèm vượt quá 100MB.";

        if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
        setFormErrors({});

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            const startParts = start_date.split('T');
            formData.append('start_date', startParts[0]);
            formData.append('start_time', startParts[1] || '00:00');
            const dueDateParts = due_date.split('T');
            formData.append('due_date', dueDateParts[0]);
            formData.append('due_time', dueDateParts[1] || '23:59');
            formData.append('file', file);
            const res = await homeworkAPI.create(classId, formData);
            alert(res.data.message || 'Tạo bài tập thành công.');
            setView('list');
            setNewHomework({ classId: '', title: '', description: '', start_date: '', due_date: '', file: null });
            fetchHomework(classId);
        } catch (error) {
            alert(error.response?.data?.message || 'Lỗi khi tạo bài tập');
        }
    };

    // ---- Update Homework (Teacher) ----
    const openEdit = (hw) => {
        setNewHomework({
            classId: hw.class_id || '',
            title: hw.title || '',
            description: hw.description || '',
            start_date: hw.start_date ? `${hw.start_date.split('T')[0]}T${hw.start_time || '00:00'}` : '',
            due_date: hw.due_date ? `${hw.due_date.split('T')[0]}T${hw.due_time || '23:59'}` : '',
            file: null
        });
        setSelectedHomework(hw);
        setView('edit');
    };

    const handleUpdateHomework = async (e) => {
        e.preventDefault();
        const errors = {};
        const { title, description, start_date, due_date, file } = newHomework;
        if (!title.trim()) errors.title = "Vui lòng nhập tên bài tập.";
        else if (HW_SPECIAL_CHARS_REGEX.test(title.trim())) errors.title = "Tên bài tập không được có ký tự đặc biệt.";
        else if (title.length > 200) errors.title = "Tên bài tập không được vượt quá 200 ký tự.";
        if (!description.trim()) errors.description = "Vui lòng nhập mô tả bài tập.";
        if (!start_date) errors.start_date = "Vui lòng chọn ngày và giờ bắt đầu.";
        if (!due_date) errors.due_date = "Vui lòng chọn hạn nộp.";

        if (start_date && due_date && new Date(due_date) <= new Date(start_date)) {
            errors.due_date = "Hạn nộp phải sau thời gian bắt đầu.";
        }
        if (file && file.size > MAX_SIZE) errors.file = "Dung lượng tệp đính kèm vượt quá 100MB.";

        if (Object.keys(errors).length > 0) { setFormErrors(errors); return; }
        setFormErrors({});

        try {
            const formData = new FormData();
            formData.append('title', title);
            formData.append('description', description);
            const startParts = start_date.split('T');
            formData.append('start_date', startParts[0]);
            formData.append('start_time', startParts[1] || '00:00');
            const dueDateParts = due_date.split('T');
            formData.append('due_date', dueDateParts[0]);
            formData.append('due_time', dueDateParts[1] || '23:59');
            if (file) formData.append('file', file);

            const res = await homeworkAPI.update(selectedHomework.id, formData);
            alert(res.data.message || 'Cập nhật bài tập thành công.');
            setView('list');
            setNewHomework({ classId: '', title: '', description: '', start_date: '', due_date: '', file: null });
            fetchHomework(selectedClassId);
        } catch (error) {
            alert(error.response?.data?.message || 'Lỗi khi cập nhật bài tập');
        }
    };

    // ---- Submit Homework (Student) ----
    const validateSubmitFile = (file) => {
        if (!file) return 'Vui lòng tải lên tệp.';
        const ext = '.' + file.name.split('.').pop().toLowerCase();
        if (!ALLOWED_EXTS.includes(ext) && !ALLOWED_TYPES.includes(file.type)) {
            return 'Tệp tải lên không đúng định dạng. Chỉ chấp nhận PDF, DOC, DOCX.';
        }
        if (file.size > MAX_SIZE) return 'Dung lượng tệp vượt quá giới hạn cho phép (Tối đa 100MB).';
        return '';
    };

    const handleSubmitHomework = async () => {
        const err = validateSubmitFile(submitFile);
        if (err) { setSubmitError(err); return; }
        setSubmitting(true);
        setSubmitError('');
        setSubmitSuccess('');
        try {
            const formData = new FormData();
            formData.append('file', submitFile);
            const res = await homeworkAPI.submit(selectedHomework.id, formData);
            setSubmitSuccess('Nộp bài tập thành công.');
            // Refresh detail
            const detail = await homeworkAPI.getById(selectedHomework.id);
            setSelectedHomework(detail.data.data);
            setSubmitFile(null);
            fetchHomework(selectedClassId);
        } catch (e) {
            setSubmitError(e.response?.data?.message || 'Lỗi khi nộp bài. Vui lòng thử lại.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmitDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const f = e.dataTransfer.files[0];
        if (f) { setSubmitFile(f); setSubmitError(validateSubmitFile(f)); setSubmitSuccess(''); }
    };

    // ---- Grade Submission (Teacher) ----
    const handleGrade = async () => {
        if (!gradeModal) return;
        setGrading(true);
        try {
            await homeworkAPI.grade(selectedHomework.id, gradeModal.submissionId, {
                score: gradeScore,
                feedback: gradeFeedback
            });
            alert('Chấm điểm thành công!');
            setGradeModal(null);
            const detail = await homeworkAPI.getById(selectedHomework.id);
            setSelectedHomework(detail.data.data);
        } catch (e) {
            alert(e.response?.data?.message || 'Lỗi khi chấm điểm');
        } finally {
            setGrading(false);
        }
    };

    // ---- Helpers ----
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const d = new Date(dateStr);
        const time = d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        const date = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
        return `${time}, ${date}`;
    };

    const getDueDateTime = (hw) => {
        if (!hw.due_date) return null;
        const dateStr = hw.due_date.split('T')[0];
        const timeStr = hw.due_time || '23:59:59';
        return new Date(`${dateStr}T${timeStr}`);
    };

    const getFileIcon = (url) => {
        if (!url) return <FileText size={20} />;
        const ext = url.split('.').pop().toLowerCase();
        if (ext === 'pdf') return <FileIcon size={20} />;
        if (['doc', 'docx'].includes(ext)) return <FileText size={20} />;
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <FileIcon size={20} />;
        return <File size={20} />;
    };

    const getFileName = (url) => {
        if (!url) return 'file';
        return url.split('/').pop();
    };

    // ---- Processed List ----
    const processedList = homeworkList.map(hw => {
        const dueDateTime = getDueDateTime(hw);
        const isClosed = dueDateTime ? dueDateTime < new Date() : false;
        const isSubmitted = !!hw.submission_id;
        
        let statusStr, statusClass, scoreStr, scoreColor;
        if (isSubmitted) {
            // Check if nộp muộn
            if (hw.submitted_at && dueDateTime && new Date(hw.submitted_at) > dueDateTime) {
                statusStr = 'Nộp muộn'; statusClass = 'nop-muon';
            } else {
                statusStr = 'Đã nộp'; statusClass = 'da-nop';
            }
            scoreStr = hw.score !== null && hw.score !== undefined ? `${hw.score}/10` : '--/10';
            scoreColor = hw.score !== null && hw.score !== undefined ? '#16a34a' : '#94a3b8';
        } else if (isClosed) {
            statusStr = 'Quá hạn'; statusClass = 'qua-han'; scoreStr = '0/10'; scoreColor = '#ef4444';
        } else {
            statusStr = 'Chưa nộp'; statusClass = 'chua-nop'; scoreStr = '--/10'; scoreColor = '#94a3b8';
        }
        return { ...hw, isClosed, isSubmitted, statusStr, statusClass, scoreStr, scoreColor, dueDateTime };
    });

    let displayedList = processedList.filter(hw =>
        hw.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (hw.class_name && hw.class_name.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    if (isStudent && statusFilter !== 'all') {
        displayedList = displayedList.filter(hw => hw.statusClass === statusFilter);
    }

    // Sort
    if (sortOrder === 'due-asc') {
        displayedList.sort((a, b) => (a.dueDateTime || 0) - (b.dueDateTime || 0));
    } else if (sortOrder === 'due-desc') {
        displayedList.sort((a, b) => (b.dueDateTime || 0) - (a.dueDateTime || 0));
    } else if (sortOrder === 'name-asc') {
        displayedList.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortOrder === 'name-desc') {
        displayedList.sort((a, b) => b.title.localeCompare(a.title));
    }

    // ============================================================
    // RENDER LIST VIEW
    // ============================================================
    const renderListView = () => (
        <div className="hw-container">
            <div className="hw-page-header">
                <div>
                    <h2 className="hw-page-title">
                        {isStudent ? 'Bài tập của tôi' : 'Quản lý bài tập'}
                    </h2>
                    <p className="hw-page-desc">
                        {isStudent ? 'Theo dõi và hoàn thành các bài tập được giao.' : 'Theo dõi tiến độ nộp bài và chấm điểm.'}
                    </p>
                </div>
                {isTeacher && (
                    <button className="hw-btn-submit" onClick={() => setView('create')}>
                        <Upload size={16} /> Tải lên bài tập
                    </button>
                )}
            </div>

            <div className="hw-filters-card">
                <div className="hw-filter-group" style={{ maxWidth: '250px' }}>
                    <label className="hw-filter-label">Lớp học</label>
                    <select className="hw-input" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                        <option value="all">Tất cả lớp học</option>
                        {classes.map(cls => (
                            <option key={cls.id} value={cls.id}>{cls.class_name}</option>
                        ))}
                    </select>
                </div>
                {isStudent && (
                    <div className="hw-filter-group" style={{ maxWidth: '200px' }}>
                        <label className="hw-filter-label">Trạng thái</label>
                        <select className="hw-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="all">Tất cả</option>
                            <option value="chua-nop">Chưa nộp</option>
                            <option value="da-nop">Đã nộp</option>
                            <option value="nop-muon">Nộp muộn</option>
                            <option value="qua-han">Quá hạn</option>
                        </select>
                    </div>
                )}
                <div className="hw-filter-group">
                    <label className="hw-filter-label">Tìm kiếm</label>
                    <div style={{ position: 'relative' }}>
                        <Search size={16} color="#9ca3af" style={{ position: 'absolute', left: '12px', top: '12px' }} />
                        <input
                            type="text"
                            className="hw-input"
                            placeholder="Nhập tên bài tập hoặc môn học..."
                            style={{ paddingLeft: '38px' }}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
                <div className="hw-filter-group" style={{ maxWidth: '200px' }}>
                    <label className="hw-filter-label">Sắp xếp theo</label>
                    <select className="hw-input" value={sortOrder} onChange={e => setSortOrder(e.target.value)}>
                        <option value="due-asc">Hạn nộp (gần nhất)</option>
                        <option value="due-desc">Hạn nộp (xa nhất)</option>
                        <option value="name-asc">Tên (A-Z)</option>
                        <option value="name-desc">Tên (Z-A)</option>
                    </select>
                </div>
            </div>

            <table className="hw-table">
                <thead>
                    <tr>
                        <th>Tên bài tập</th>
                        <th>Môn học / Lớp</th>
                        <th>Hạn nộp</th>
                        <th>Trạng thái</th>
                        {isStudent && <th>Điểm</th>}
                        <th style={{ textAlign: 'right' }}>Thao tác</th>
                    </tr>
                </thead>
                <tbody>
                    {loading && (
                        <tr><td colSpan={isStudent ? 6 : 5} style={{ textAlign: 'center', padding: '40px' }}>
                            <div className="hw-loading-spinner"></div>
                            <div style={{ marginTop: '10px', color: '#6b7280' }}>Đang tải...</div>
                        </td></tr>
                    )}
                    {!loading && displayedList.length === 0 && (
                        <tr><td colSpan={isStudent ? 6 : 5} style={{ textAlign: 'center', padding: '40px' }}>
                            <BookOpen size={40} color="#d1d5db" style={{ margin: '0 auto 12px', display: 'block' }} />
                            <div style={{ color: '#6b7280' }}>Không có bài tập nào.</div>
                        </td></tr>
                    )}
                    {!loading && displayedList.map(hw => {
                        const isUrgent = !hw.isClosed && hw.dueDateTime &&
                            (hw.dueDateTime - new Date()) < 24 * 60 * 60 * 1000;
                        return (
                            <tr key={hw.id} className={isUrgent ? 'hw-row-urgent' : ''}>
                                <td>
                                    <div className="hw-item-title-col">
                                        <div className={`hw-item-icon ${hw.isClosed ? 'closed' : 'active'}`}>
                                            <CheckCircle size={20} />
                                        </div>
                                        <div>
                                            <div className="hw-item-name">
                                                {hw.title}
                                                {isUrgent && (
                                                    <span className="hw-urgent-badge">
                                                        <Clock size={10} /> Sắp hết hạn
                                                    </span>
                                                )}
                                            </div>
                                            <div className="hw-item-desc">{hw.description || 'Xem chi tiết bài tập'}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <span className="hw-item-class-badge">{hw.class_name || '—'}</span>
                                </td>
                                <td>
                                    <div className={`hw-item-datetime ${isUrgent ? 'urgent' : ''}`}>
                                        {formatDate(hw.due_date)}
                                    </div>
                                </td>
                                <td>
                                    {isStudent ? (
                                        <span className={`hw-status-badge ${hw.statusClass}`}>{hw.statusStr}</span>
                                    ) : (
                                        <span className={`hw-status-badge ${hw.isClosed ? 'closed' : 'active'}`}>
                                            {hw.isClosed ? 'Đã đóng' : 'Đang mở'}
                                        </span>
                                    )}
                                </td>
                                {isStudent && (
                                    <td>
                                        <div className="hw-progress" style={{ color: hw.scoreColor }}>{hw.scoreStr}</div>
                                    </td>
                                )}
                                <td style={{ textAlign: 'right' }}>
                                    <button
                                        className="hw-btn-action"
                                        onClick={() => openDetail(hw)}
                                    >
                                        Xem chi tiết <ChevronRight size={14} />
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );

    // ============================================================
    // RENDER CREATE VIEW (Teacher)
    // ============================================================
    const renderCreateView = () => (
        <div className="hw-container">
            <div className="hw-page-header">
                <div>
                    <div className="hw-breadcrumb">
                        <span onClick={() => setView('list')} style={{ cursor: 'pointer' }}>Bài tập</span>
                        {' › '}<span style={{ color: '#1C513E', fontWeight: 700 }}>{view === 'edit' ? 'Cập nhật bài tập' : 'Tải lên bài tập mới'}</span>
                    </div>
                    <h2 className="hw-page-title">{view === 'edit' ? 'Cập nhật bài tập' : 'Tạo bài tập mới'}</h2>
                </div>
            </div>
            <div className="hw-upload-card">
                <form onSubmit={view === 'edit' ? handleUpdateHomework : handleCreateHomework} noValidate>
                    <div className="hw-form-group">
                        <label className="hw-form-label">Chọn lớp học *</label>
                        <select
                            className={`hw-input ${formErrors.classId ? 'error' : ''}`}
                            value={newHomework.classId}
                            onChange={e => setNewHomework({ ...newHomework, classId: e.target.value })}
                            disabled={view === 'edit'}
                        >
                            <option value="">Chọn lớp học...</option>
                            {classes.map(cls => <option key={cls.id} value={cls.id}>{cls.class_name}</option>)}
                        </select>
                        {formErrors.classId && <span className="hw-error-text">{formErrors.classId}</span>}
                    </div>
                    <div className="hw-form-group">
                        <label className="hw-form-label">Tên bài tập *</label>
                        <input
                            type="text" placeholder="Ví dụ: Bài tập Reading Unit 5"
                            className={`hw-input ${formErrors.title ? 'error' : ''}`}
                            value={newHomework.title}
                            onChange={e => setNewHomework({ ...newHomework, title: e.target.value })}
                        />
                        {formErrors.title && <span className="hw-error-text">{formErrors.title}</span>}
                    </div>
                    <div className="hw-form-group">
                        <label className="hw-form-label">Mô tả / Nội dung yêu cầu *</label>
                        <textarea
                            placeholder="Nhập nội dung yêu cầu, hướng dẫn cho học viên..."
                            className={`hw-input hw-textarea ${formErrors.description ? 'error' : ''}`}
                            value={newHomework.description}
                            onChange={e => setNewHomework({ ...newHomework, description: e.target.value })}
                        />
                        {formErrors.description && <span className="hw-error-text">{formErrors.description}</span>}
                    </div>
                    <div className="hw-date-row hw-form-group">
                        <div>
                            <label className="hw-form-label">Ngày &amp; giờ bắt đầu *</label>
                            <input
                                type="datetime-local"
                                className={`hw-input ${formErrors.start_date ? 'error' : ''}`}
                                value={newHomework.start_date}
                                onChange={e => setNewHomework({ ...newHomework, start_date: e.target.value })}
                            />
                            {formErrors.start_date && <span className="hw-error-text">{formErrors.start_date}</span>}
                        </div>
                        <div>
                            <label className="hw-form-label">Hạn nộp *</label>
                            <input
                                type="datetime-local"
                                className={`hw-input ${formErrors.due_date ? 'error' : ''}`}
                                value={newHomework.due_date}
                                onChange={e => setNewHomework({ ...newHomework, due_date: e.target.value })}
                            />
                            {formErrors.due_date && <span className="hw-error-text">{formErrors.due_date}</span>}
                        </div>
                    </div>
                    <div className="hw-form-group">
                        <label className="hw-form-label">Tài liệu đính kèm *</label>
                        <div
                            className={`hw-dropzone ${formErrors.file ? 'error' : ''}`}
                            onDragOver={e => e.preventDefault()}
                            onDrop={e => {
                                e.preventDefault();
                                const f = e.dataTransfer.files[0];
                                if (f) setNewHomework({ ...newHomework, file: f });
                            }}
                            onClick={() => fileInputRef.current.click()}
                        >
                            <input type="file" ref={fileInputRef} style={{ display: 'none' }}
                                onChange={e => { if (e.target.files[0]) setNewHomework({ ...newHomework, file: e.target.files[0] }); }}
                            />
                            {newHomework.file ? (
                                <div>
                                    <CheckCircle size={40} color="#10B981" style={{ margin: '0 auto 10px', display: 'block' }} />
                                    <div className="hw-dropzone-title">Đã chọn: {newHomework.file.name}</div>
                                    <div className="hw-dropzone-subtitle">Click hoặc kéo thả để đổi tệp</div>
                                </div>
                            ) : (
                                <div>
                                    <div className="hw-dropzone-icon"><UploadCloud size={24} /></div>
                                    <div className="hw-dropzone-title">
                                        {view === 'edit' && selectedHomework?.attachment_url ? "Đã có tệp. Kéo thả tệp mới vào đây để thay đổi" : "Kéo thả tệp vào đây"}
                                    </div>
                                    <div className="hw-dropzone-subtitle">hoặc click để chọn tệp</div>
                                    <div className="hw-file-types">
                                        <span className="hw-file-type"><FileIcon size={20} color="#ef4444" /> PDF</span>
                                        <span className="hw-file-type"><FileText size={20} color="#3b82f6" /> WORD</span>
                                        <span className="hw-file-type"><File size={20} color="#f97316" /> PPT</span>
                                        <span className="hw-file-type"><Video size={20} color="#8b5cf6" /> VIDEO</span>
                                    </div>
                                </div>
                            )}
                        </div>
                        <div className="hw-dropzone-footer"><AlertTriangle size={14} style={{ marginRight: '6px' }} /> Giới hạn: 100MB</div>
                        {formErrors.file && <span className="hw-error-text">{formErrors.file}</span>}
                    </div>
                    <div className="hw-form-actions">
                        <button type="button" className="hw-btn-cancel" onClick={() => view === 'edit' ? setView('detail') : setView('list')}>Hủy</button>
                        <button type="submit" className="hw-btn-submit">{view === 'edit' ? 'Cập nhật' : 'Tải lên'} <Upload size={16} /></button>
                    </div>
                </form>
            </div>
        </div>
    );

    // ============================================================
    // RENDER DETAIL VIEW
    // ============================================================
    const renderDetailView = () => {
        if (detailLoading) return (
            <div className="hw-container" style={{ textAlign: 'center', padding: '60px' }}>
                <div className="hw-loading-spinner" style={{ margin: '0 auto' }}></div>
                <div style={{ marginTop: '16px', color: '#6b7280' }}>Đang tải chi tiết bài tập...</div>
            </div>
        );
        if (!selectedHomework) return null;

        const hw = selectedHomework;
        const dueDateTime = getDueDateTime(hw);
        const isClosed = dueDateTime ? dueDateTime < new Date() : false;

        // Student submission info from detailed response
        const submission = hw.submission || null;
        const isSubmitted = !!submission;

        // Teacher grading: submissionsList
        const submissionsList = hw.submissionsList || [];

        const processedStatus = (() => {
            if (isStudent) {
                if (isSubmitted) {
                    const lateSubmit = submission.submitted_at && dueDateTime && new Date(submission.submitted_at) > dueDateTime;
                    return { str: lateSubmit ? 'Nộp muộn' : 'Đã nộp', cls: lateSubmit ? 'nop-muon' : 'da-nop' };
                }
                return isClosed ? { str: 'Quá hạn', cls: 'qua-han' } : { str: 'Chưa nộp', cls: 'chua-nop' };
            }
            return { str: isClosed ? 'Đã đóng' : 'Đang mở', cls: isClosed ? 'closed' : 'active' };
        })();

        const renderStudentRightColumn = () => {
            if (isClosed && !isSubmitted) {
                // DFF001: Quá hạn nhưng vẫn cho nộp muộn (status = 'Nộp muộn')
                return (
                    <div className="hw-detail-right">
                        <div className="hw-score-card" style={{ background: '#fef2f2', border: '1px solid #fecaca' }}>
                            <div className="hw-score-label" style={{ color: '#991b1b' }}>TRẠNG THÁI</div>
                            <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#dc2626', marginTop: '8px' }}>Quá hạn nộp bài</div>
                            <div style={{ fontSize: '0.8rem', color: '#b91c1c', marginTop: '6px' }}>Bạn vẫn có thể nộp bài muộn. Bài nộp sẽ được đánh dấu "Nộp muộn".</div>
                        </div>
                        <div className="hw-submit-card">
                            <h3 className="hw-submit-card-title" style={{ color: '#dc2626' }}>⚠ Nộp bài muộn</h3>
                            {renderSubmitZone()}
                        </div>
                        <button className="hw-btn-secondary" onClick={() => setView('list')}>← Quay lại danh sách</button>
                        <div className="hw-feedback-card">
                            <div className="hw-feedback-icon"><FileText size={20} /></div>
                            <div className="hw-feedback-title">Chưa có nhận xét</div>
                            <div className="hw-feedback-desc">Nhận xét từ giáo viên sẽ hiển thị sau khi chấm.</div>
                        </div>
                    </div>
                );
            }

            if (isSubmitted && isClosed) {
                // Đã nộp, đã đóng
                return (
                    <div className="hw-detail-right">
                        <div className="hw-score-card">
                            <div className="hw-score-label">ĐIỂM SỐ ĐẠT ĐƯỢC</div>
                            <div className="hw-score-value">
                                {submission.score !== null && submission.score !== undefined
                                    ? submission.score
                                    : '--'}
                                <span className="hw-score-total">/10</span>
                            </div>
                            {submission.score === null && (
                                <div style={{ fontSize: '0.8rem', color: '#6b7280', marginTop: '8px' }}>Đang chờ giáo viên chấm điểm</div>
                            )}
                        </div>
                        <button className="hw-btn-secondary" onClick={() => setView('list')}>← Quay lại danh sách</button>
                        <div className="hw-feedback-card" style={{ textAlign: 'left', background: '#fff' }}>
                            <div className="hw-section-title" style={{ marginBottom: '12px' }}>
                                <FileText size={18} color="#16a34a" /> Phản hồi từ giáo viên
                            </div>
                            <div className="hw-feedback-content">
                                {submission.feedback || 'Giáo viên chưa để lại nhận xét.'}
                            </div>
                        </div>
                    </div>
                );
            }

            if (isSubmitted && !isClosed) {
                // Đã nộp, còn hạn (có thể nộp lại)
                return (
                    <div className="hw-detail-right">
                        <div className="hw-score-card" style={{ background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                            <div className="hw-score-label" style={{ color: '#166534' }}>TRẠNG THÁI NỘP BÀI</div>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '8px', color: '#166534', fontWeight: 700, fontSize: '1rem' }}>
                                <CheckCircle size={20} /> Đã nộp bài
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '6px' }}>
                                Nộp lúc {formatDate(submission.submitted_at)}
                            </div>
                        </div>
                        {/* Resubmit zone */}
                        <div className="hw-submit-card">
                            <h3 className="hw-submit-card-title">Nộp lại bài làm</h3>
                            {renderSubmitZone()}
                        </div>
                        <button className="hw-btn-secondary" onClick={() => setView('list')}>← Quay lại danh sách</button>
                        <div className="hw-feedback-card">
                            <div className="hw-feedback-icon"><FileText size={20} /></div>
                            <div className="hw-feedback-title">Chưa có nhận xét</div>
                            <div className="hw-feedback-desc">Nhận xét sẽ hiển thị sau khi bài làm được chấm.</div>
                        </div>
                    </div>
                );
            }

            // Chưa nộp, còn hạn
            return (
                <div className="hw-detail-right">
                    <div className="hw-submit-card">
                        <h3 className="hw-submit-card-title">Nộp bài làm</h3>
                        {renderSubmitZone()}
                    </div>
                    <button className="hw-btn-secondary" onClick={() => setView('list')}>← Quay lại danh sách</button>
                    <div className="hw-feedback-card">
                        <div className="hw-feedback-icon"><FileText size={20} /></div>
                        <div className="hw-feedback-title">Chưa có nhận xét</div>
                        <div className="hw-feedback-desc">Nhận xét từ giáo viên sẽ hiển thị sau khi chấm.</div>
                    </div>
                </div>
            );
        };

        const renderSubmitZone = () => (
            <>
                <div
                    className={`hw-upload-zone ${isDragging ? 'dragging' : ''}`}
                    onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleSubmitDrop}
                    onClick={() => submitFileRef.current.click()}
                >
                    <input
                        type="file"
                        ref={submitFileRef}
                        style={{ display: 'none' }}
                        accept=".pdf,.doc,.docx"
                        onChange={e => {
                            const f = e.target.files[0];
                            if (f) { setSubmitFile(f); setSubmitError(validateSubmitFile(f)); setSubmitSuccess(''); }
                        }}
                    />
                    {submitFile ? (
                        <>
                            <CheckCircle size={28} color="#10B981" style={{ margin: '0 auto 8px', display: 'block' }} />
                            <div style={{ fontWeight: 600, color: '#1f2937', fontSize: '0.9rem' }}>{submitFile.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                                {(submitFile.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#10B981', marginTop: '4px' }}>Click để đổi tệp</div>
                        </>
                    ) : (
                        <>
                            <UploadCloud size={32} color={isDragging ? '#10B981' : '#9ca3af'} style={{ margin: '0 auto 10px', display: 'block' }} />
                            <div style={{ fontWeight: 600, color: '#1f2937' }}>Kéo thả file vào đây</div>
                            <div style={{ fontSize: '0.8rem', color: '#9ca3af', marginTop: '4px' }}>hoặc click để chọn file</div>
                            <div style={{ fontSize: '0.72rem', color: '#d1d5db', marginTop: '8px' }}>PDF, DOC, DOCX • Tối đa 100MB</div>
                        </>
                    )}
                </div>
                {submitError && (
                    <div className="hw-alert hw-alert-error">
                        <AlertTriangle size={14} /> {submitError}
                    </div>
                )}
                {submitSuccess && (
                    <div className="hw-alert hw-alert-success">
                        <CheckCircle size={14} /> {submitSuccess}
                    </div>
                )}
                <button
                    className="hw-btn-submit-large"
                    onClick={handleSubmitHomework}
                    disabled={submitting}
                >
                    {submitting ? 'Đang nộp...' : <><Upload size={18} /> Nộp bài ngay</>}
                </button>
                <div className="hw-submit-note">
                    <AlertTriangle size={14} color="#f59e0b" style={{ flexShrink: 0 }} />
                    Bài nộp trước hạn sẽ được tính là đúng hạn.
                </div>
            </>
        );

        const renderTeacherRightColumn = () => (
            <div className="hw-detail-right">
                <div className="hw-submit-card">
                    <h3 className="hw-submit-card-title">
                        Bài nộp ({submissionsList.length})
                    </h3>
                    {submissionsList.length === 0 ? (
                        <div className="hw-feedback-card" style={{ padding: '20px' }}>
                            <div className="hw-feedback-icon"><FileText size={20} /></div>
                            <div className="hw-feedback-title">Chưa có bài nộp</div>
                        </div>
                    ) : (
                        submissionsList.map(sub => (
                            <div key={sub.id} className="hw-submission-item">
                                <div className="hw-submission-header">
                                    <div>
                                        <div className="hw-submission-student">{sub.student_name}</div>
                                        <div className="hw-submission-time">{formatDate(sub.submitted_at)}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        {sub.score !== null && sub.score !== undefined ? (
                                            <span className="hw-score-badge">{sub.score}/10</span>
                                        ) : (
                                            <span className="hw-score-badge ungraded">Chưa chấm</span>
                                        )}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                    <a
                                        href={`${API_BASE}${sub.file_url}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="hw-btn-download"
                                    >
                                        <Download size={14} /> Tải xuống
                                    </a>
                                    <button
                                        className="hw-btn-grade"
                                        onClick={() => {
                                            setGradeModal({ submissionId: sub.id, studentName: sub.student_name });
                                            setGradeScore(sub.score !== null ? String(sub.score) : '');
                                            setGradeFeedback(sub.feedback || '');
                                        }}
                                    >
                                        <Star size={14} /> Chấm điểm
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
                <button className="hw-btn-secondary" onClick={() => setView('list')}>← Quay lại danh sách</button>
            </div>
        );

        return (
            <div className="hw-container">
                <div className="hw-breadcrumb">
                    <span onClick={() => setView('list')} className="hw-breadcrumb-link">Bài tập</span>
                    {' › '}
                    <span>{hw.title}</span>
                </div>
                <div className="hw-detail-layout">
                    {/* LEFT COLUMN */}
                    <div className="hw-detail-left">
                        <div className="hw-detail-main-header">
                            <span className={`hw-status-badge ${processedStatus.cls}`} style={{ marginBottom: '10px', display: 'inline-block' }}>
                                {processedStatus.str}
                            </span>
                            <h2 className="hw-detail-title-large">{hw.title}</h2>
                            {isTeacher && !isClosed && (
                                <div style={{ marginTop: '4px', marginBottom: '16px' }}>
                                    <button 
                                        onClick={() => openEdit(hw)} 
                                        className="hw-btn-secondary" 
                                        style={{ padding: '6px 14px', fontSize: '14px' }}
                                    >
                                        Chỉnh sửa
                                    </button>
                                </div>
                            )}
                            <div className="hw-detail-meta-row">
                                {hw.class_name && (
                                    <div className="hw-detail-meta-item">
                                        <BookOpen size={14} />
                                        <span>{hw.class_name}</span>
                                        {hw.course_name && <span className="hw-meta-sep">—</span>}
                                        {hw.course_name && <span>{hw.course_name}</span>}
                                    </div>
                                )}
                                <div className={`hw-detail-meta-item ${isClosed ? 'overdue' : ''}`}>
                                    <Clock size={14} />
                                    <span>Hạn nộp: {formatDate(hw.due_date)}</span>
                                </div>
                            </div>
                        </div>

                        <div className="hw-detail-section">
                            <h3 className="hw-section-title">Yêu cầu bài tập</h3>
                            <div className="hw-detail-desc">
                                {hw.description || 'Không có mô tả chi tiết.'}
                            </div>
                        </div>

                        {/* Teacher attachment (tài liệu giáo viên đính kèm) */}
                        {hw.attachment_url && (
                            <div className="hw-detail-section">
                                <h3 className="hw-section-title">Tài liệu đính kèm</h3>
                                <div className="hw-file-item">
                                    <div className="hw-file-icon">
                                        {getFileIcon(hw.attachment_url)}
                                    </div>
                                    <div className="hw-file-info">
                                        <div className="hw-file-name">{getFileName(hw.attachment_url)}</div>
                                        <div className="hw-file-meta">Tệp đính kèm từ giáo viên</div>
                                    </div>
                                    <a
                                        href={`${API_BASE}${hw.attachment_url}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        download
                                        className="hw-file-download"
                                        title="Tải xuống"
                                    >
                                        <Download size={18} />
                                    </a>
                                </div>
                            </div>
                        )}

                        {/* Student's submitted file — DF002: Thêm xem trực tiếp (inline preview) */}
                        {isStudent && isSubmitted && submission.file_url && (
                            <div className="hw-detail-section">
                                <h3 className="hw-section-title">Bài nộp của bạn</h3>
                                <div className="hw-file-item">
                                    <div className="hw-file-icon">
                                        {getFileIcon(submission.file_url)}
                                    </div>
                                    <div className="hw-file-info">
                                        <div className="hw-file-name">{getFileName(submission.file_url)}</div>
                                        <div className="hw-file-meta">Nộp lúc {formatDate(submission.submitted_at)}</div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                        <a
                                            href={`${API_BASE}${submission.file_url}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="hw-file-download"
                                            title="Xem trực tiếp"
                                            style={{ background: '#e0f2fe', color: '#0369a1' }}
                                        >
                                            <FileText size={18} />
                                        </a>
                                        <a
                                            href={`${API_BASE}${submission.file_url}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            download
                                            className="hw-file-download"
                                            title="Tải xuống"
                                        >
                                            <Download size={18} />
                                        </a>
                                    </div>
                                </div>
                                {/* DF002: Inline preview cho file PDF */}
                                {submission.file_url.toLowerCase().endsWith('.pdf') && (
                                    <div style={{ marginTop: '12px', borderRadius: '8px', overflow: 'hidden', border: '1px solid #e5e7eb' }}>
                                        <iframe
                                            src={`${API_BASE}${submission.file_url}`}
                                            title="Xem bài nộp"
                                            width="100%"
                                            height="500px"
                                            style={{ border: 'none' }}
                                        />
                                    </div>
                                )}
                                {/* DF002: Preview link cho file DOC/DOCX qua Google Docs Viewer */}
                                {(submission.file_url.toLowerCase().endsWith('.doc') || submission.file_url.toLowerCase().endsWith('.docx')) && (
                                    <div style={{ marginTop: '12px', padding: '16px', background: '#f0f9ff', borderRadius: '8px', border: '1px solid #bae6fd', textAlign: 'center' }}>
                                        <a
                                            href={`https://docs.google.com/gview?url=${encodeURIComponent(API_BASE + submission.file_url)}&embedded=true`}
                                            target="_blank"
                                            rel="noreferrer"
                                            style={{ color: '#0369a1', fontWeight: 600, textDecoration: 'underline', fontSize: '0.9rem' }}
                                        >
                                            📄 Xem file trực tiếp trên trình duyệt (Google Docs Viewer)
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN */}
                    {isStudent && renderStudentRightColumn()}
                    {isTeacher && renderTeacherRightColumn()}
                </div>
            </div>
        );
    };

    // ============================================================
    // GRADE MODAL (Teacher)
    // ============================================================
    const renderGradeModal = () => {
        if (!gradeModal) return null;
        return (
            <div className="hw-modal-overlay" onClick={() => setGradeModal(null)}>
                <div className="hw-modal" onClick={e => e.stopPropagation()}>
                    <div className="hw-modal-header">
                        <h3>Chấm điểm — {gradeModal.studentName}</h3>
                        <button className="hw-modal-close" onClick={() => setGradeModal(null)}><X size={20} /></button>
                    </div>
                    <div className="hw-modal-body">
                        <div className="hw-form-group">
                            <label className="hw-form-label">Điểm số (0 – 10) *</label>
                            <input
                                type="number" min="0" max="10" step="0.1"
                                className="hw-input"
                                placeholder="Nhập điểm..."
                                value={gradeScore}
                                onChange={e => setGradeScore(e.target.value)}
                            />
                        </div>
                        <div className="hw-form-group">
                            <label className="hw-form-label">Nhận xét</label>
                            <textarea
                                className="hw-input hw-textarea"
                                placeholder="Nhận xét của giáo viên..."
                                value={gradeFeedback}
                                onChange={e => setGradeFeedback(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="hw-modal-footer">
                        <button className="hw-btn-cancel" onClick={() => setGradeModal(null)}>Hủy</button>
                        <button className="hw-btn-submit" onClick={handleGrade} disabled={grading}>
                            {grading ? 'Đang lưu...' : <><Star size={16} /> Lưu điểm</>}
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <>
            {(view === 'create' || view === 'edit') && renderCreateView()}
            {view === 'detail' && renderDetailView()}
            {view === 'list' && renderListView()}
            {renderGradeModal()}
        </>
    );
};

export default Homework;
