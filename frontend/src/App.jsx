import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './components/Dashboard'
import Schedule from './components/Schedule'
import Students from './components/Students'
import Attendance from './components/Attendance'
import LearningMaterials from './components/LearningMaterials'
import Homework from './components/Homework'
import StudentProgress from './components/StudentProgress'
import Login from './components/Login'
import ChangePasswordModal from './components/auth/ChangePasswordModal'
import { Settings, Key, LogOut, ChevronDown } from 'lucide-react';
import ForgotPassword from './components/auth/ForgotPassword'
import CheckEmail from './components/auth/CheckEmail'
import ResetPassword from './components/auth/ResetPassword'
import AdminUsers from './components/admin/AdminUsers'
import AdminClasses from './components/admin/AdminClasses'
import AdminFinance from './components/admin/AdminFinance'
import AdminReports from './components/admin/AdminReports'
import AdminEnrollment from './components/admin/AdminEnrollment'
import StudentList from './components/admin/StudentList'
import { studentAPI, classAPI } from './api'
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {
    const [currentView, setView] = useState('dashboard');
    const [selectedClassId, setSelectedClassId] = useState(null);
    const [students, setStudents] = useState([]);
    const [classes, setClasses] = useState([]);
    const [authUser, setAuthUser] = useState(null);
    const [authPage, setAuthPage] = useState('login');
    const [forgotEmail, setForgotEmail] = useState('');
    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);
    const [isProfileMenuOpen, setProfileMenuOpen] = useState(false);

    useEffect(() => {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
            setAuthUser(JSON.parse(savedUser));
        }

        if (window.location.pathname === '/reset-password') {
            setAuthPage('reset');
        }
    }, []);

    useEffect(() => {
        if (authUser) {
            fetchAppData();
        }
    }, [authUser]);

    const fetchAppData = async () => {
        try {
            const stuRes = await studentAPI.getAll();
            setStudents(stuRes.data);
        } catch (error) {
            console.error('Error fetching students:', error);
        }

        try {
            const clsRes = await classAPI.getAll();
            setClasses(clsRes.data.data || []);
        } catch (error) {
            console.error('Error fetching classes:', error);
        }
    };

    const handleAddStudent = async (student) => {
        try {
            const response = await studentAPI.create(student);
            setStudents([...students, response.data]);
        } catch (error) {
            console.error('Error adding student:', error);
        }
    };

    const handleDeleteStudent = async (id) => {
        if (confirm('Bạn có chắc chắn muốn xóa học viên này không?')) {
            try {
                await studentAPI.delete(id);
                setStudents(students.filter(s => s.id !== id));
            } catch (error) {
                console.error('Lỗi khi xóa học viên:', error);
            }
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthUser(null);
        setProfileMenuOpen(false);
    };

    const handleNavigate = (view, id = null) => {
        setView(view);
        setSelectedClassId(id);
    };
    
    const renderContent = () => {
        switch (currentView) {
            case 'dashboard':
                return <Dashboard setView={setView} authUser={authUser} students={students} classes={classes} />;
            case 'schedule':
                return <Schedule authUser={authUser} classes={classes} />;
            case 'students':
                return (
                    <Students
                        students={students}
                        classes={classes}
                        onAddStudent={handleAddStudent}
                        onDeleteStudent={handleDeleteStudent}
                    />
                );
            case 'attendance':
                return <Attendance classes={classes} />;
            case 'learning':
                return <LearningMaterials authUser={authUser} classes={classes} />;
            case 'homework':
                return <Homework authUser={authUser} classes={classes} />;
            case 'progress':
                return <StudentProgress />;
            case 'users':
                return <AdminUsers authUser={authUser} />;
            case 'classes':
                return <AdminClasses authUser={authUser} classes={classes} onRefresh={fetchAppData} setView={handleNavigate} />;            
            case 'finance':
                return <AdminFinance />;
            case 'enrollment':
                return <AdminEnrollment initialClassId={selectedClassId} />;
            case 'reports':
                return <AdminReports />;
            case 'student-list':
                return <StudentList authUser={authUser} />;
            default:
                return <Dashboard authUser={authUser} students={students} classes={classes} />;
        }
    };

    if (!authUser) {
        if (authPage === 'forgot') {
            return (
                <>
                    <ForgotPassword
                        onBack={() => setAuthPage('login')}
                        onEmailSent={(email) => { setForgotEmail(email); setAuthPage('checkEmail'); }}
                    />
                    <ToastContainer position="bottom-right" autoClose={3000} />
                </>
            );
        }
        if (authPage === 'checkEmail') {
            return (
                <>
                    <CheckEmail
                        email={forgotEmail}
                        onBack={() => setAuthPage('login')}
                    />
                    <ToastContainer position="bottom-right" autoClose={3000} />
                </>
            );
        }
        if (authPage === 'reset') {
            return (
                <>
                    <ResetPassword onSuccess={() => setAuthPage('login')} />
                    <ToastContainer position="bottom-right" autoClose={3000} />
                </>
            );
        }
        return (
            <>
                <Login setAuthUser={setAuthUser} onForgotPassword={() => setAuthPage('forgot')} />
                <ToastContainer position="bottom-right" autoClose={3000} />
            </>
        );
    }

    return (
        <div className="app-container">
            <Sidebar currentView={currentView} setView={handleNavigate} authUser={authUser} setAuthUser={setAuthUser} />
            <main className="main-content">
                <header className="app-header">
                    <div className="header-title">
                        {currentView === 'dashboard' && <h2>Tổng quan Quản trị</h2>}
                        {currentView === 'students' && <h2>Quản lý Người dùng & Phân quyền</h2>}
                        {currentView === 'users' && <h2>Quản lý Người dùng & Phân quyền</h2>}
                        {currentView === 'student-list' && <h2>Quản lý học viên</h2>}
                        {currentView === 'classes' && <h2>Lớp học</h2>}
                        {currentView === 'finance' && <h2>Tài chính</h2>}
                        {currentView === 'reports' && <h2>Báo cáo</h2>}
                        {currentView === 'schedule' && <h2>{authUser?.role === 'Teacher' ? 'Lịch dạy' : 'Lịch học'}</h2>}
                        {currentView === 'attendance' && <h2>Điểm danh</h2>}
                        {currentView === 'learning' && <h2>Tài liệu học tập</h2>}
                        {currentView === 'homework' && <h2>Bài tập</h2>}
                        {currentView === 'progress' && <h2>Tiến độ học tập</h2>}
                        {currentView === 'enrollment' && <h2>Ghi danh Học viên</h2>}
                        <p className="header-subtitle">
                            {currentView === 'dashboard' ? `Chào mừng trở lại, ${authUser?.fullName || authUser?.full_name || 'Bạn'}` : ''}
                            {currentView === 'students' ? 'Quản lý học viên, giáo viên và nhân viên trên hệ thống.' : ''}
                            {currentView === 'users' ? 'Quản lý học viên, giáo viên và nhân viên trên hệ thống.' : ''}
                            {currentView === 'student-list' ? 'Xem và quản lý danh sách học viên.' : ''}
                            {currentView === 'classes' ? 'Quản lý danh sách lớp học trên hệ thống.' : ''}
                            {currentView === 'finance' ? 'Theo dõi doanh thu, chi phí và lịch sử giao dịch.' : ''}
                            {currentView === 'reports' ? 'Thống kê và phân tích dữ liệu hệ thống.' : ''}
                            {currentView === 'enrollment' ? 'Thêm học viên vào lớp học tương ứng.' : ''}
                        </p>
                    </div>
                    <div className="header-actions">
                        <button className="icon-btn notification-btn">
                            <span className="bell-icon">🔔</span>
                            <span className="badge"></span>
                        </button>
                        <div className="user-profile-container" style={{ position: 'relative' }}>
                                <div className="user-profile" onClick={() => setProfileMenuOpen(!isProfileMenuOpen)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                                    <div className="avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                        {(authUser?.fullName || authUser?.full_name || 'U')[0].toUpperCase()}
                                    </div>
                                    <div className="user-details">
                                        <span className="user-name">{authUser?.fullName || authUser?.full_name || 'Người dùng'}</span>
                                        <span className="user-email">{authUser?.email || ''}</span>
                                    </div>
                                    <ChevronDown size={16} color="var(--text-gray)" style={{ marginLeft: '8px' }} />
                                </div>
                                
                                {isProfileMenuOpen && (
                                    <>
                                        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 99}} onClick={() => setProfileMenuOpen(false)}></div>
                                        <div className="profile-dropdown">
                                            <button className="dropdown-item" onClick={() => { setProfileMenuOpen(false); alert('Tính năng đang được phát triển!'); }}>
                                                <Settings size={18} /> Cài đặt
                                            </button>
                                            <button className="dropdown-item" onClick={() => { setProfileMenuOpen(false); setPasswordModalOpen(true); }}>
                                                <Key size={18} /> Đổi mật khẩu
                                            </button>
                                            <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: '4px 0' }} />
                                            <button className="dropdown-item danger" onClick={handleLogout}>
                                                <LogOut size={18} /> Đăng xuất
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                    </div>
                </header>

                <div className="page-content">
                    {renderContent()}
                </div>
            </main>
            <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setPasswordModalOpen(false)} />
            <ToastContainer position="bottom-right" autoClose={3000} />
        </div>
    )
}

export default App
