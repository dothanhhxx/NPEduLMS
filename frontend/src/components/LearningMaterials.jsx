import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import './LearningMaterials.css';

pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const API_BASE = import.meta.env.VITE_API_BASE_URL || `http://${window.location.hostname}:5000`;

// ── Type info ──────────────────────────────────────────────────
const getTypeInfo = (type = '', url = '', name = '') => {
    const t = (type || '').toLowerCase();
    if (t === 'video') return { label: 'Video', cls: 'type-video' };
    if (t === 'slide' || t === 'ppt') return { label: 'PPT', cls: 'type-ppt' };
    if (t === 'word' || t === 'doc') return { label: 'Word', cls: 'type-word' };
    if (t === 'pdf') return { label: 'PDF', cls: 'type-pdf' };
    const src = url || name || '';
    const ext = src.split('.').pop().toLowerCase().split('?')[0];
    if (['mp4', 'mov', 'avi', 'webm', 'mkv'].includes(ext)) return { label: 'Video', cls: 'type-video' };
    if (['ppt', 'pptx'].includes(ext)) return { label: 'PPT', cls: 'type-ppt' };
    if (['doc', 'docx'].includes(ext)) return { label: 'Word', cls: 'type-word' };
    return { label: 'PDF', cls: 'type-pdf' };
};

// ── File icon ──────────────────────────────────────────────────
const FileIcon = ({ typeInfo }) => {
    const { cls } = typeInfo;
    if (cls === 'type-pdf') return (
        <div className="lm-file-icon icon-pdf">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
            </svg>
        </div>
    );
    if (cls === 'type-word') return (
        <div className="lm-file-icon icon-word">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
        </div>
    );
    if (cls === 'type-ppt') return (
        <div className="lm-file-icon icon-ppt">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <rect x="8" y="12" width="4" height="3" rx="1"/>
                <line x1="12" y1="13.5" x2="16" y2="13.5"/>
            </svg>
        </div>
    );
    return (
        <div className="lm-file-icon icon-video">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="2" y="3" width="15" height="15" rx="2"/>
                <polygon points="22 3 22 18 17 13 17 8"/>
            </svg>
        </div>
    );
};

// ── Format date ────────────────────────────────────────────────
const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (isNaN(d)) return dateStr;
    const hh = d.getHours().toString().padStart(2, '0');
    const mm = d.getMinutes().toString().padStart(2, '0');
    const dd = d.getDate().toString().padStart(2, '0');
    const mo = (d.getMonth() + 1).toString().padStart(2, '0');
    const yy = d.getFullYear();
    return `${hh}:${mm}, ${dd}/${mo}/${yy}`;
};

// ── Normalize URL ──────────────────────────────────────────────
const getFileUrl = (url = '') => {
    if (!url) return null;
    // Replace localhost with actual hostname so it works on other devices
    if (url.startsWith('http://localhost:5000')) {
        return url.replace('http://localhost:5000', API_BASE);
    }
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return `${API_BASE}${url}`;
    return `${API_BASE}/${url}`;
};

// ── Allowed extensions ─────────────────────────────────────────
const ALLOWED_EXTS = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'mp4', 'mov', 'avi', 'webm', 'mkv'];
const MAX_SIZE_MB = 100;

const validateFile = (f) => {
    if (!f) return null;
    const ext = f.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
        return 'Định dạng tệp không được hỗ trợ. Vui lòng chọn tệp PDF, Word, PowerPoint hoặc Video.';
    }
    if (f.size > MAX_SIZE_MB * 1024 * 1024) {
        return `Dung lượng tệp vượt quá giới hạn cho phép (Tối đa ${MAX_SIZE_MB}MB).`;
    }
    return null;
};

const SORT_OPTIONS = [
    { value: 'name_asc', label: 'Tên (A-Z)' },
    { value: 'name_desc', label: 'Tên (Z-A)' },
    { value: 'date_desc', label: 'Mới nhất' },
    { value: 'date_asc', label: 'Cũ nhất' },
];

// ─────────────────────────────────────────────────────────────────
const LearningMaterials = ({ authUser, classes = [] }) => {
    const [selectedClassId, setSelectedClassId] = useState('');
    const [materials, setMaterials] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date_desc');
    const [sortOpen, setSortOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Form state
    const [showForm, setShowForm] = useState(false);
    const [editingMaterial, setEditingMaterial] = useState(null);
    const [formData, setFormData] = useState({ name: '', description: '' });
    const [file, setFile] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [formErrors, setFormErrors] = useState({}); // inline errors
    const [successMsg, setSuccessMsg] = useState('');

    // Preview
    const [previewMaterial, setPreviewMaterial] = useState(null);
    const [pdfNumPages, setPdfNumPages] = useState(null);
    const [pdfPageNumber, setPdfPageNumber] = useState(1);

    // Delete
    const [deleteId, setDeleteId] = useState(null);
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Pagination
    const [page, setPage] = useState(1);
    const PAGE_SIZE = 10;

    const fileInputRef = useRef(null);
    const sortRef = useRef(null);

    // ── Close sort dropdown on outside click ────────────────────
    useEffect(() => {
        const handleClick = (e) => {
            if (sortRef.current && !sortRef.current.contains(e.target)) setSortOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    // ── Fetch materials ──────────────────────────────────────────
    const fetchMaterials = async () => {
        setLoading(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            let url;
            if (selectedClassId) {
                url = `${API_BASE}/api/learning-materials/class/${selectedClassId}`;
            } else {
                url = `${API_BASE}/api/learning-materials`;
            }
            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = Array.isArray(response.data) ? response.data : (response.data?.data || []);
            setMaterials(data);
            setPage(1);
        } catch (err) {
            if (err.response?.status === 404) {
                setMaterials([]);
            } else {
                setError('Không thể tải danh sách tài liệu. Vui lòng thử lại.');
                setMaterials([]);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchMaterials(); }, [selectedClassId]);

    const canEdit = authUser && (authUser.role === 'Admin' || authUser.role === 'Teacher');

    // ── Form validation ──────────────────────────────────────────
    const SPECIAL_CHARS_REGEX = /[!@#$%^&*()+=\[\]{};':"\\|,.<>\/?~`]/;

    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) {
            errors.name = 'Vui lòng nhập tên tài liệu.';
        } else if (SPECIAL_CHARS_REGEX.test(formData.name.trim())) {
            errors.name = 'Tên tài liệu không được có ký tự đặc biệt.';
        } else if (formData.name.trim().length > 200) {
            errors.name = 'Tên tài liệu không được vượt quá 200 kí tự!';
        }
        if (!editingMaterial && !file) {
            errors.file = 'Vui lòng chọn tệp tải lên.';
        }
        if (file) {
            const fileErr = validateFile(file);
            if (fileErr) errors.file = fileErr;
        }
        if (!editingMaterial && !selectedClassId) {
            errors.class = 'Vui lòng chọn lớp học.';
        }
        return errors;
    };

    // ── Handlers ─────────────────────────────────────────────────
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleAddClick = () => {
        setFormData({ name: '', description: '' });
        setFile(null);
        setEditingMaterial(null);
        setFormErrors({});
        setShowForm(true);
    };

    const handleEditClick = (material) => {
        setFormData({
            name: material.name || '',
            description: material.description || '',
        });
        setFile(null);
        setEditingMaterial(material);
        setFormErrors({});
        setShowForm(true);
    };

    const handleFileDrop = (e) => {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if (!f) return;
        const err = validateFile(f);
        if (err) { setFormErrors(prev => ({ ...prev, file: err })); return; }
        setFile(f);
        setFormErrors(prev => ({ ...prev, file: '' }));
    };

    const handleFileChange = (e) => {
        const f = e.target.files?.[0];
        if (!f) return;
        const err = validateFile(f);
        if (err) { setFormErrors(prev => ({ ...prev, file: err })); return; }
        setFile(f);
        setFormErrors(prev => ({ ...prev, file: '' }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm();
        if (Object.keys(errors).length > 0) {
            setFormErrors(errors);
            return;
        }

        setFormLoading(true);
        try {
            const token = localStorage.getItem('token');
            const data = new FormData();
            data.append('name', formData.name.trim());
            data.append('description', formData.description);
            if (file) data.append('file', file);

            const headers = {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'multipart/form-data',
            };

            if (editingMaterial) {
                await axios.put(
                    `${API_BASE}/api/learning-materials/${editingMaterial.id}`,
                    data, { headers }
                );
            } else {
                await axios.post(
                    `${API_BASE}/api/learning-materials/class/${selectedClassId}`,
                    data, { headers }
                );
            }

            setShowForm(false);
            setEditingMaterial(null);
            await fetchMaterials();
            setSuccessMsg(editingMaterial ? 'Cập nhật tài liệu thành công!' : 'Tải lên tài liệu thành công!');
            setTimeout(() => setSuccessMsg(''), 3500);
        } catch (err) {
            const serverMsg = err.response?.data?.message;
            if (serverMsg) {
                // Map server errors to form fields
                if (serverMsg.includes('tên') || serverMsg.includes('name')) {
                    setFormErrors({ name: serverMsg });
                } else {
                    setFormErrors({ submit: serverMsg });
                }
            } else {
                setFormErrors({ submit: 'Lỗi kết nối. Vui lòng kiểm tra lại.' });
            }
        } finally {
            setFormLoading(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!deleteId) return;
        setDeleteLoading(true);
        try {
            const token = localStorage.getItem('token');
            await axios.delete(`${API_BASE}/api/learning-materials/${deleteId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setDeleteId(null);
            await fetchMaterials();
            setSuccessMsg('Xóa tài liệu thành công!');
            setTimeout(() => setSuccessMsg(''), 3000);
        } catch {
            alert('Lỗi khi xóa tài liệu.');
        } finally {
            setDeleteLoading(false);
        }
    };

    const handlePreview = (material) => {
        setPreviewMaterial(material);
        setPdfNumPages(null);
        setPdfPageNumber(1);
    };

    const handleDownload = (material) => {
        const url = getFileUrl(material.url);
        if (!url) return;
        fetch(url)
            .then(r => r.blob())
            .then(blob => {
                const ext = (material.url || '').split('.').pop().split('?')[0];
                const filename = material.name?.includes('.') ? material.name : `${material.name}.${ext}`;
                const blobUrl = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = blobUrl;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                setTimeout(() => URL.revokeObjectURL(blobUrl), 5000);
            })
            .catch(() => window.open(url, '_blank'));
    };

    // ── Filter + Sort + Paginate ─────────────────────────────────
    const filtered = materials.filter(m =>
        m.name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    const sorted = [...filtered].sort((a, b) => {
        if (sortBy === 'name_asc') return (a.name || '').localeCompare(b.name || '');
        if (sortBy === 'name_desc') return (b.name || '').localeCompare(a.name || '');
        if (sortBy === 'date_asc') return new Date(a.created_at) - new Date(b.created_at);
        return new Date(b.created_at) - new Date(a.created_at);
    });
    const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    const paginated = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    const selectedSortLabel = SORT_OPTIONS.find(o => o.value === sortBy)?.label || 'Sắp xếp';

    const getClassName = (classId) => {
        const cls = classes.find(c => String(c.id) === String(classId));
        return cls?.class_name || cls?.class_code || '—';
    };

    // ── Upload / Edit Form ──────────────────────────────────────
    if (showForm) {
        const isEdit = !!editingMaterial;
        return (
            <div className="lm-wrapper">
                <div className="lm-form-card">
                    <div className="lm-form-header">
                        <button className="lm-back-btn" onClick={() => { setShowForm(false); setEditingMaterial(null); }}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="19" y1="12" x2="5" y2="12"/>
                                <polyline points="12 19 5 12 12 5"/>
                            </svg>
                            Quay lại
                        </button>
                        <div>
                            <h2 className="lm-form-title">{isEdit ? 'Chỉnh sửa tài liệu' : 'Tải lên tài liệu học tập'}</h2>
                            <p className="lm-form-subtitle">{isEdit ? 'Cập nhật thông tin tài liệu' : 'Thêm tài liệu mới vào hệ thống'}</p>
                        </div>
                    </div>

                    <form onSubmit={handleFormSubmit} className="lm-form-body" noValidate>
                        {/* Submit-level error */}
                        {formErrors.submit && (
                            <div className="lm-field-error lm-error-banner">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <circle cx="12" cy="12" r="10"/>
                                    <line x1="12" y1="8" x2="12" y2="12"/>
                                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                                </svg>
                                {formErrors.submit}
                            </div>
                        )}

                        {/* Class select (create only) */}
                        {!isEdit && (
                            <div className="lm-field">
                                <label className="lm-label">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                                        <circle cx="9" cy="7" r="4"/>
                                    </svg>
                                    Lớp học <span className="lm-required">*</span>
                                </label>
                                <div className="lm-select-wrap">
                                    <select
                                        className={`lm-input ${formErrors.class ? 'lm-input-error' : ''}`}
                                        value={selectedClassId}
                                        onChange={e => {
                                            setSelectedClassId(e.target.value);
                                            setFormErrors(prev => ({ ...prev, class: '' }));
                                        }}
                                    >
                                        <option value="" disabled>Chọn lớp học...</option>
                                        {classes.map(c => (
                                            <option key={c.id} value={c.id}>{c.class_name || c.class_code}</option>
                                        ))}
                                    </select>
                                    <svg className="lm-select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <polyline points="6 9 12 15 18 9"/>
                                    </svg>
                                </div>
                                {formErrors.class && <p className="lm-field-error">{formErrors.class}</p>}
                            </div>
                        )}

                        {/* Name */}
                        <div className="lm-field">
                            <label className="lm-label">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                </svg>
                                Tên tài liệu <span className="lm-required">*</span>
                            </label>
                            <input
                                type="text"
                                className={`lm-input ${formErrors.name ? 'lm-input-error' : ''}`}
                                placeholder="Ví dụ: Chiến thuật Reading IELTS - Unit 5"
                                name="name"
                                value={formData.name}
                                onChange={handleFormChange}
                                maxLength={255}
                                autoFocus
                            />
                            {formErrors.name && <p className="lm-field-error">{formErrors.name}</p>}
                        </div>

                        {/* Description */}
                        <div className="lm-field">
                            <label className="lm-label">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                                    <line x1="8" y1="18" x2="21" y2="18"/>
                                    <line x1="3" y1="6" x2="3.01" y2="6"/>
                                    <line x1="3" y1="12" x2="3.01" y2="12"/>
                                </svg>
                                Mô tả
                            </label>
                            <textarea
                                className="lm-input lm-textarea"
                                placeholder="Nhập tóm tắt nội dung hoặc lưu ý cho học viên..."
                                name="description"
                                value={formData.description}
                                onChange={handleFormChange}
                                rows="3"
                            />
                        </div>

                        {/* File upload */}
                        <div className="lm-field">
                            <label className="lm-label">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="17 8 12 3 7 8"/>
                                    <line x1="12" y1="3" x2="12" y2="15"/>
                                </svg>
                                {isEdit ? 'Thay thế file (để trống nếu không đổi)' : <>Tệp đính kèm <span className="lm-required">*</span></>}
                            </label>

                            {/* Current file when editing */}
                            {isEdit && editingMaterial?.url && !file && (
                                <div className="lm-current-file">
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                        <polyline points="14 2 14 8 20 8"/>
                                    </svg>
                                    <span>File hiện tại: <strong>{editingMaterial.name}</strong></span>
                                    <button type="button" className="lm-current-file-preview"
                                        onClick={() => {
                                            const u = getFileUrl(editingMaterial.url);
                                            if (u) window.open(u, '_blank');
                                        }}>
                                        Xem
                                    </button>
                                </div>
                            )}

                            {/* Dropzone */}
                            <div
                                className={`lm-dropzone ${file ? 'has-file' : ''} ${formErrors.file ? 'lm-dropzone-err' : ''}`}
                                onDragOver={e => e.preventDefault()}
                                onDrop={handleFileDrop}
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <input type="file" ref={fileInputRef} onChange={handleFileChange} style={{display:'none'}}
                                    accept=".pdf,.doc,.docx,.ppt,.pptx,.mp4,.mov,.avi,.webm,.mkv" />

                                {file ? (
                                    <div className="lm-dropzone-selected">
                                        <div className="lm-dz-icon-ok">
                                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <polyline points="20 6 9 17 4 12"/>
                                            </svg>
                                        </div>
                                        <div style={{flex:1, minWidth:0}}>
                                            <p className="lm-dz-filename">{file.name}</p>
                                            <p className="lm-dz-filesize">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                        </div>
                                        <button type="button" className="lm-dz-clear" onClick={e => { e.stopPropagation(); setFile(null); setFormErrors(p => ({ ...p, file: '' })); }}>
                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <line x1="18" y1="6" x2="6" y2="18"/>
                                                <line x1="6" y1="6" x2="18" y2="18"/>
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    <div className="lm-dropzone-idle">
                                        <div className="lm-dz-icon">
                                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#2e7d32" strokeWidth="2">
                                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                                <polyline points="17 8 12 3 7 8"/>
                                                <line x1="12" y1="3" x2="12" y2="15"/>
                                            </svg>
                                        </div>
                                        <p className="lm-dz-text"><strong>Kéo thả tệp vào đây</strong> hoặc click để chọn</p>
                                        <div className="lm-dz-filetypes">
                                            <span className="lm-ft-badge ft-pdf">PDF</span>
                                            <span className="lm-ft-badge ft-word">WORD</span>
                                            <span className="lm-ft-badge ft-ppt">PPT</span>
                                            <span className="lm-ft-badge ft-video">VIDEO</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {formErrors.file && <p className="lm-field-error">{formErrors.file}</p>}
                            <p className="lm-hint">ⓘ Giới hạn dung lượng: {MAX_SIZE_MB}MB — Định dạng: PDF, Word, PPT, Video</p>
                        </div>

                        {/* Actions */}
                        <div className="lm-form-actions">
                            <button type="button" className="lm-btn-cancel" onClick={() => { setShowForm(false); setEditingMaterial(null); }}>
                                Hủy bỏ
                            </button>
                            <button type="submit" className="lm-btn-submit" disabled={formLoading}>
                                {formLoading ? (
                                    <><span className="lm-spinner"/>{isEdit ? 'Đang lưu...' : 'Đang tải lên...'}</>
                                ) : (
                                    <>
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            {isEdit
                                                ? <><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></>
                                                : <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></>
                                            }
                                        </svg>
                                        {isEdit ? 'Lưu thay đổi' : 'Tải lên tài liệu'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    }

    // ── Main list view ────────────────────────────────────────────
    return (
        <div className="lm-wrapper">
            {/* Toast */}
            {successMsg && (
                <div className="lm-toast">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                        <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>
                    {successMsg}
                </div>
            )}

            {/* Delete modal */}
            {deleteId && (
                <div className="lm-overlay" onClick={() => !deleteLoading && setDeleteId(null)}>
                    <div className="lm-modal" onClick={e => e.stopPropagation()}>
                        <div className="lm-modal-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6"/>
                                <path d="M19 6l-1 14.5A2 2 0 0 1 16 22H8a2 2 0 0 1-2-1.5L5 6"/>
                                <path d="M10 11v6"/><path d="M14 11v6"/>
                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                            </svg>
                        </div>
                        <h3 className="lm-modal-title">Xóa tài liệu?</h3>
                        <p className="lm-modal-text">Hành động này không thể hoàn tác. Bạn có chắc không?</p>
                        <div className="lm-modal-actions">
                            <button className="lm-btn-cancel" onClick={() => setDeleteId(null)} disabled={deleteLoading}>Hủy</button>
                            <button className="lm-btn-danger" onClick={handleDeleteConfirm} disabled={deleteLoading}>
                                {deleteLoading ? 'Đang xóa...' : 'Xóa tài liệu'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filter bar */}
            <div className="lm-filter-bar">
                <div className="lm-filter-group">
                    <div className="lm-filter-item">
                        <label className="lm-filter-label">Lọc theo lớp</label>
                        <div className="lm-select-wrap">
                            <select
                                className="lm-filter-select"
                                value={selectedClassId}
                                onChange={e => { setSelectedClassId(e.target.value); setPage(1); }}
                            >
                                <option value="">Tất cả</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.class_name || c.class_code}</option>
                                ))}
                            </select>
                            <svg className="lm-select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </div>
                    </div>

                    <div className="lm-filter-item lm-search-item">
                        <label className="lm-filter-label">Tìm kiếm tài liệu</label>
                        <div className="lm-search-wrap">
                            <svg className="lm-search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                            </svg>
                            <input
                                type="text"
                                className="lm-search-input"
                                placeholder="Nhập tên tài liệu..."
                                value={searchTerm}
                                onChange={e => { setSearchTerm(e.target.value); setPage(1); }}
                                maxLength={255}
                            />
                            {searchTerm && (
                                <button className="lm-search-clear" onClick={() => setSearchTerm('')}>
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                        <line x1="18" y1="6" x2="6" y2="18"/>
                                        <line x1="6" y1="6" x2="18" y2="18"/>
                                    </svg>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="lm-toolbar">
                <div className="lm-toolbar-left">
                    <span className="lm-count">{sorted.length} tài liệu</span>
                    <div className="lm-sort-wrap" ref={sortRef}>
                        <span className="lm-sort-label">Sắp xếp theo:</span>
                        <button className="lm-sort-btn" onClick={() => setSortOpen(!sortOpen)}>
                            {selectedSortLabel}
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="6 9 12 15 18 9"/>
                            </svg>
                        </button>
                        {sortOpen && (
                            <div className="lm-sort-dropdown">
                                {SORT_OPTIONS.map(o => (
                                    <button key={o.value} className={`lm-sort-option ${sortBy === o.value ? 'active' : ''}`}
                                        onClick={() => { setSortBy(o.value); setSortOpen(false); }}>
                                        {sortBy === o.value && (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                                <polyline points="20 6 9 17 4 12"/>
                                            </svg>
                                        )}
                                        {o.label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {canEdit && (
                    <button className="lm-btn-add" onClick={handleAddClick}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <circle cx="12" cy="12" r="10"/>
                            <line x1="12" y1="8" x2="12" y2="16"/>
                            <line x1="8" y1="12" x2="16" y2="12"/>
                        </svg>
                        Tải lên tài liệu
                    </button>
                )}
            </div>

            {/* Table */}
            {loading ? (
                <div className="lm-state">
                    <div className="lm-spinner-lg"/>
                    <p>Đang tải tài liệu...</p>
                </div>
            ) : error ? (
                <div className="lm-state lm-state-error">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
                        <line x1="12" y1="16" x2="12.01" y2="16"/>
                    </svg>
                    <p>{error}</p>
                    <button className="lm-btn-retry" onClick={fetchMaterials}>Thử lại</button>
                </div>
            ) : sorted.length === 0 ? (
                <div className="lm-state">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>
                    </svg>
                    <p className="lm-state-text">
                        {searchTerm ? `Không tìm thấy tài liệu với từ khóa "${searchTerm}"` : 'Chưa có tài liệu nào'}
                    </p>
                    {canEdit && !searchTerm && (
                        <button className="lm-btn-add" style={{marginTop:'8px'}} onClick={handleAddClick}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="12" y1="5" x2="12" y2="19"/>
                                <line x1="5" y1="12" x2="19" y2="12"/>
                            </svg>
                            Tải lên tài liệu đầu tiên
                        </button>
                    )}
                </div>
            ) : (
                <div className="lm-table-wrap">
                    <table className="lm-table">
                        <thead>
                            <tr>
                                <th style={{width:'40%'}}>TÊN TÀI LIỆU</th>
                                <th style={{width:'15%'}}>NGÀY TẢI LÊN</th>
                                <th style={{width:'15%'}}>LỚP HỌC</th>
                                <th style={{width:'12%'}}>LOẠI FILE</th>
                                <th style={{width:'18%', textAlign:'right'}}>THAO TÁC</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginated.map(item => {
                                const typeInfo = getTypeInfo(item.type, item.url, item.name);
                                return (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="lm-name-cell">
                                                <FileIcon typeInfo={typeInfo}/>
                                                <div className="lm-name-info">
                                                    <span className="lm-name">{item.name}</span>
                                                    {item.description && <span className="lm-desc">{item.description}</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="lm-date">{formatDate(item.created_at)}</td>
                                        <td>
                                            <span className="lm-class-badge">{getClassName(item.class_id)}</span>
                                        </td>
                                        <td>
                                            <span className={`lm-type-badge ${typeInfo.cls}`}>{typeInfo.label}</span>
                                        </td>
                                        <td>
                                            <div className="lm-actions">
                                                {/* Preview */}
                                                <button className="lm-action-btn lm-btn-preview" title="Xem trước" onClick={() => handlePreview(item)}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                                                        <circle cx="12" cy="12" r="3"/>
                                                    </svg>
                                                </button>
                                                {/* Download */}
                                                <button className="lm-action-btn lm-btn-dl" title="Tải xuống" onClick={() => handleDownload(item)}>
                                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                                        <polyline points="7 10 12 15 17 10"/>
                                                        <line x1="12" y1="15" x2="12" y2="3"/>
                                                    </svg>
                                                </button>
                                                {canEdit && (
                                                    <>
                                                        {/* Edit */}
                                                        <button className="lm-action-btn lm-btn-edit" title="Chỉnh sửa" onClick={() => handleEditClick(item)}>
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                                                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                                            </svg>
                                                        </button>
                                                        {/* Delete */}
                                                        <button className="lm-action-btn lm-btn-del" title="Xóa" onClick={() => setDeleteId(item.id)}>
                                                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                                <polyline points="3 6 5 6 21 6"/>
                                                                <path d="M19 6l-1 14.5A2 2 0 0 1 16 22H8a2 2 0 0 1-2-1.5L5 6"/>
                                                                <path d="M10 11v6"/><path d="M14 11v6"/>
                                                                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                                                            </svg>
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="lm-pagination">
                            <button className="lm-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="15 18 9 12 15 6"/>
                                </svg>
                            </button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                                <button key={p} className={`lm-page-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                            ))}
                            <button className="lm-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="9 18 15 12 9 6"/>
                                </svg>
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Preview Modal ──────────────────────────────────────── */}
            {previewMaterial && (() => {
                const url = getFileUrl(previewMaterial.url);
                const typeInfo = getTypeInfo(previewMaterial.type, previewMaterial.url, previewMaterial.name);
                const isVideo = typeInfo.cls === 'type-video';
                const isImage = /\.(jpg|jpeg|png|gif|webp)(\?|$)/i.test(previewMaterial.url || '');
                const isPdf = typeInfo.cls === 'type-pdf';
                const isPpt = typeInfo.cls === 'type-ppt';
                const isWord = typeInfo.cls === 'type-word';

                return (
                    <div className="lm-overlay" onClick={() => setPreviewMaterial(null)}>
                        <div className="lm-preview-modal" onClick={e => e.stopPropagation()}>
                            {/* Header */}
                            <div className="lm-preview-header">
                                <div className="lm-preview-title-wrap">
                                    <FileIcon typeInfo={typeInfo}/>
                                    <div>
                                        <h3 className="lm-preview-title">{previewMaterial.name}</h3>
                                        <span className={`lm-type-badge ${typeInfo.cls}`}>{typeInfo.label}</span>
                                    </div>
                                </div>
                                <div className="lm-preview-actions">

                                    <button className="lm-preview-dl-btn" onClick={() => handleDownload(previewMaterial)}>
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                            <polyline points="7 10 12 15 17 10"/>
                                            <line x1="12" y1="15" x2="12" y2="3"/>
                                        </svg>
                                        Tải xuống
                                    </button>
                                    <button className="lm-preview-close" onClick={() => setPreviewMaterial(null)}>
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                            <line x1="18" y1="6" x2="6" y2="18"/>
                                            <line x1="6" y1="6" x2="18" y2="18"/>
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            {/* Body */}
                            <div className="lm-preview-body">
                                {!url ? (
                                    <div className="lm-preview-nofile">
                                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.2">
                                            <circle cx="12" cy="12" r="10"/>
                                            <line x1="12" y1="8" x2="12" y2="12"/>
                                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                                        </svg>
                                        <p>Không tìm thấy file</p>
                                    </div>
                                ) : isVideo ? (
                                    <video className="lm-preview-video" controls autoPlay>
                                        <source src={url}/>
                                        Trình duyệt không hỗ trợ video.
                                    </video>
                                ) : isImage ? (
                                    <img className="lm-preview-img" src={url} alt={previewMaterial.name}/>
                                ) : (isPdf || isPpt || isWord) ? (
                                    <div className="lm-pdf-viewer">
                                        <Document
                                            file={isPdf ? url : `${url}.pdf`}
                                            onLoadSuccess={({ numPages }) => setPdfNumPages(numPages)}
                                            loading={<div className="lm-spinner-lg" style={{margin:'auto'}}/>}
                                            error={
                                                (isPpt || isWord) ? (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
                                                        {url.includes('localhost') && (
                                                            <div style={{ padding: '10px', background: '#fffbeb', color: '#b45309', fontSize: '0.875rem', textAlign: 'center', borderBottom: '1px solid #fde68a' }}>
                                                                Lưu ý: Bạn chưa cài đặt LibreOffice trên Server, bản Convert bị lỗi. Môi trường local (localhost) không thể xem qua iframe. Vui lòng tải xuống.
                                                            </div>
                                                        )}
                                                        <iframe
                                                            className="lm-preview-iframe"
                                                            src={`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`}
                                                            title={previewMaterial.name}
                                                            style={{ flex: 1, border: 'none', width: '100%', height: '100%' }}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="lm-preview-nofile" style={{background:'#fff'}}>
                                                        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#d97706" strokeWidth="1.5">
                                                            <circle cx="12" cy="12" r="10"/>
                                                            <line x1="12" y1="8" x2="12" y2="12"/>
                                                            <line x1="12" y1="16" x2="12.01" y2="16"/>
                                                        </svg>
                                                        <p>Lỗi khi tải PDF. Hãy dùng một trong các tùy chọn sau:</p>
                                                        <div style={{display:'flex',gap:'10px',flexWrap:'wrap',justifyContent:'center',marginTop:'4px'}}>

                                                            <button className="lm-preview-dl-btn" onClick={() => handleDownload(previewMaterial)}>
                                                                Tải xuống
                                                            </button>
                                                        </div>
                                                    </div>
                                                )
                                            }
                                        >
                                            <Page 
                                                pageNumber={pdfPageNumber} 
                                                renderTextLayer={false}
                                                renderAnnotationLayer={false}
                                                width={Math.min(window.innerWidth * 0.8, 800)}
                                            />
                                        </Document>
                                        
                                        {pdfNumPages && (
                                            <div className="lm-pdf-controls">
                                                <button 
                                                    className="lm-pdf-btn"
                                                    disabled={pdfPageNumber <= 1} 
                                                    onClick={() => setPdfPageNumber(p => Math.max(1, p - 1))}
                                                >
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
                                                </button>
                                                <span className="lm-pdf-page-info">{pdfPageNumber} / {pdfNumPages}</span>
                                                <button 
                                                    className="lm-pdf-btn"
                                                    disabled={pdfPageNumber >= pdfNumPages} 
                                                    onClick={() => setPdfPageNumber(p => Math.min(pdfNumPages, p + 1))}
                                                >
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="lm-preview-nofile">
                                        <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.2">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                                            <polyline points="14 2 14 8 20 8"/>
                                        </svg>
                                        <p>Loại file này không thể xem trước trực tiếp.</p>
                                        <div style={{display:'flex',gap:'10px',marginTop:'12px'}}>

                                            <button className="lm-preview-dl-btn" onClick={() => handleDownload(previewMaterial)}>
                                                Tải xuống
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })()}
        </div>
    );
};

export default LearningMaterials;
