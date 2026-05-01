import React, { useState, useEffect } from 'react';
import { Table, Input, Select, Tag, ConfigProvider, message } from 'antd';
import { Search } from 'lucide-react';
import { studentAPI, classAPI } from '../../api';

const { Option } = Select;

const StudentList = ({ authUser }) => {
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState(null);
  const [searchText, setSearchText] = useState('');

  useEffect(() => {
    fetchData();
  }, [authUser]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [classRes, studentRes] = await Promise.all([
        classAPI.getAll(),
        studentAPI.getAll()
      ]);

      const allClasses = classRes.data?.data || classRes.data || [];
      const allStudents = studentRes.data?.data || studentRes.data || [];

      let filteredClasses = allClasses;
      // Lỗi do c.teacher_id (bảng teachers) khác với authUser.id (bảng users).
      // Nhưng không sao, API backend (getAllClasses) đã tự động nối bảng và chỉ 
      // trả về đúng những lớp thuộc về Teacher này (WHERE t.user_id = ?), 
      // nên chúng ta không cần filter gì thêm ở Frontend cả!

      setClasses(filteredClasses);
      setStudents(allStudents);

      if (filteredClasses.length > 0) {
        setSelectedClassId(filteredClasses[0].id);
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      message.error('Không thể tải dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);

  // Lọc học viên theo lớp được chọn
  let classStudents = [];
  if (selectedClass) {
    const enrolledIds = selectedClass.enrolled_student_ids || [];
    classStudents = students.filter(s => enrolledIds.includes(s.id));
  }

  // Lọc thêm theo tìm kiếm (Tên, Mã HV, SĐT)
  const filteredStudents = classStudents.filter(student => {
    const term = searchText.toLowerCase();
    const fullName = (student.fullName || student.full_name || '').toLowerCase();
    const formattedId = student.id ? (typeof student.id === 'string' && student.id.startsWith('STU') ? student.id : `STU-${String(student.id).padStart(3, '0')}`) : '';
    const sid = formattedId.toLowerCase();
    const phone = (student.phone || '').toLowerCase();
    
    return fullName.includes(term) || sid.includes(term) || phone.includes(term);
  });

  const columns = [
    {
      title: 'Mã HV',
      dataIndex: 'id',
      key: 'id',
      render: (id) => (typeof id === 'string' && id.startsWith('STU')) ? id : `STU-${String(id).padStart(3, '0')}`,
    },
    {
      title: 'Họ và tên',
      dataIndex: 'fullName',
      key: 'fullName',
      render: (text, record) => text || record.full_name || 'N/A'
    },
    {
      title: 'Thông tin liên hệ',
      key: 'contact',
      render: (_, record) => (
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <span>{record.phone || 'N/A'}</span>
          <span style={{ fontSize: '12px', color: '#666' }}>{record.email || 'N/A'}</span>
        </div>
      ),
    },
    {
      title: 'Tên khóa học',
      key: 'courseName',
      render: () => selectedClass?.name || selectedClass?.class_name || 'N/A',
    },
    {
      title: 'Trạng thái',
      key: 'status',
      render: () => (
        <span className="badge-active">Đang học</span>
      ),
    },
  ];

  return (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1C513E',
        },
      }}
    >
      <div style={{ padding: '24px', background: '#fff', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', alignItems: 'center' }}>
          <div style={{ width: '300px' }}>
            <Select
              style={{ width: '100%' }}
              value={selectedClassId}
              onChange={setSelectedClassId}
              placeholder="Chọn lớp học"
              allowClear={false}
              options={classes.map(c => ({ value: c.id, label: c.name || c.class_name }))}
            />
          </div>
          <div style={{ width: '300px' }}>
            <Input
              placeholder="Tìm kiếm nhanh..."
              prefix={<Search size={18} color="#999" />}
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
            />
          </div>
        </div>

        <Table 
          columns={columns} 
          dataSource={filteredStudents} 
          rowKey="id" 
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: 'Không có học sinh nào trong lớp.' }}
        />
      </div>
    </ConfigProvider>
  );
};

export default StudentList;
