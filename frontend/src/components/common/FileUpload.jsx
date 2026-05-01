import React, { useRef, useState } from 'react';
import { UploadCloud, X } from 'lucide-react';
import { toast } from 'react-toastify';

const FileUpload = ({ file, setFile, accept = "*", maxSizeMB = 100 }) => {
    const inputRef = useRef(null);
    const [dragActive, setDragActive] = useState(false);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files && e.target.files[0];
        validateAndSetFile(selectedFile);
    };

    const validateAndSetFile = (selectedFile) => {
        if (!selectedFile) return;
        const fileSizeMB = selectedFile.size / (1024 * 1024);
        if (fileSizeMB > maxSizeMB) {
            toast.error(`Dung lượng tệp vượt quá giới hạn cho phép (Tối đa ${maxSizeMB}MB).`);
            setFile(null);
            if(inputRef.current) inputRef.current.value = "";
            return;
        }
        setFile(selectedFile);
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setDragActive(true);
        } else if (e.type === "dragleave" || e.type === "drop") {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            validateAndSetFile(e.dataTransfer.files[0]);
        }
    };

    const removeFile = (e) => {
        e.stopPropagation();
        setFile(null);
        if(inputRef.current) inputRef.current.value = "";
    };

    return (
        <div style={{ width: '100%' }}>
            {!file ? (
                <div 
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    onClick={() => inputRef.current.click()}
                    style={{ 
                        border: `2px dashed ${dragActive ? 'var(--primary)' : 'var(--border)'}`, 
                        borderRadius: '8px', padding: '2rem', textAlign: 'center', 
                        cursor: 'pointer', background: dragActive ? 'var(--primary-light)' : '#f9fafb',
                        transition: 'all 0.2s'
                    }}
                >
                    <input 
                        type="file" 
                        ref={inputRef} 
                        onChange={handleFileChange} 
                        style={{ display: 'none' }} 
                        accept={accept}
                    />
                    <UploadCloud size={32} color={dragActive ? 'var(--primary)' : 'var(--text-muted)'} style={{ marginBottom: '8px' }} />
                    <div style={{ fontWeight: 500, color: 'var(--text-main)', marginBottom: '4px' }}>
                        Nhấp hoặc Kéo thả tệp vào đây
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Định dạng hỗ trợ: {accept} (Tối đa {maxSizeMB}MB)
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: '#f9fafb', border: '1px solid var(--border)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', overflow: 'hidden' }}>
                        <UploadCloud size={20} color="var(--primary)" />
                        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 500, fontSize: '0.875rem' }}>
                            {file.name}
                        </div>
                    </div>
                    <button type="button" onClick={removeFile} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex', padding: '4px' }}>
                        <X size={16} />
                    </button>
                </div>
            )}
        </div>
    );
};

export default FileUpload;
