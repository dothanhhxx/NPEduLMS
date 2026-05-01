import React, { useEffect, useState } from 'react';

const API_URL = `http://${window.location.hostname}:5000/api`;

export default function MaterialList({ classId }) {
    const [materials, setMaterials] = useState([]);
    const [loading, setLoading] = useState(true);
    const token = localStorage.getItem('token');

    useEffect(() => {
        if (!classId || !token) {
            setMaterials([]);
            setLoading(false);
            return;
        }

        setLoading(true);

        fetch(`${API_URL}/materials/classes/${classId}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then((response) => response.json())
            .then((data) => {
                setMaterials(data.data || []);
            })
            .catch((error) => {
                console.error(error);
                setMaterials([]);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [classId, token]);

    const handleOpen = (materialId, mode) => {
        const url = mode === 'download'
            ? `${API_URL}/materials/${materialId}/download?token=${encodeURIComponent(token)}`
            : `${API_URL}/materials/${materialId}/view?token=${encodeURIComponent(token)}`;

        window.open(url, '_blank', 'noopener,noreferrer');
    };

    if (loading) return <p>Đang tải tài liệu...</p>;
    if (materials.length === 0) return <p>Lớp học này chưa có tài liệu nào.</p>;

    return (
        <div className="material-container">
            <h3>Tài liệu học tập</h3>
            <table border="1" width="100%">
                <thead>
                    <tr>
                        <th>Tên tài liệu</th>
                        <th>Loại</th>
                        <th>Ngày đăng</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {materials.map((material) => (
                        <tr key={material.id}>
                            <td>{material.title}</td>
                            <td>{material.file_type}</td>
                            <td>{new Date(material.uploaded_at).toLocaleDateString('vi-VN')}</td>
                            <td>
                                <button onClick={() => handleOpen(material.id, 'view')}>
                                    Xem
                                </button>
                                {' '}
                                <button onClick={() => handleOpen(material.id, 'download')}>
                                    Tải xuống
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}
