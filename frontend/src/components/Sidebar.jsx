import React, { useState } from 'react';
import { LayoutDashboard, Users, CalendarCheck, BookOpen, Calendar, LogOut, DollarSign, BarChart2, Key, ClipboardList, TrendingUp } from 'lucide-react';
import logo from '../asset/npedu-logo-1.png';
import ChangePasswordModal from './auth/ChangePasswordModal';

const adminMenuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'users', label: 'Quản lí người dùng', icon: Users },
    { id: 'classes', label: 'Lớp học', icon: BookOpen },
    { id: 'finance', label: 'Tài chính', icon: DollarSign },
    { id: 'reports', label: 'Báo cáo', icon: BarChart2 },
];

const teacherMenuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'student-list', label: 'Quản lý học viên', icon: Users },
    { id: 'schedule', label: 'Lịch dạy', icon: Calendar },
    { id: 'attendance', label: 'Điểm danh', icon: CalendarCheck },
    { id: 'learning', label: 'Tài liệu học tập', icon: BookOpen },
    { id: 'homework', label: 'Bài tập', icon: ClipboardList },
];

const studentMenuItems = [
    { id: 'dashboard', label: 'Tổng quan', icon: LayoutDashboard },
    { id: 'schedule', label: 'Lịch học', icon: Calendar },
    { id: 'progress', label: 'Tiến độ học tập', icon: TrendingUp },
    { id: 'learning', label: 'Tài liệu học tập', icon: BookOpen },
    { id: 'homework', label: 'Bài tập', icon: ClipboardList },
];

const Sidebar = ({ currentView, setView, authUser, setAuthUser }) => {
    const isAdmin = authUser?.role === 'Admin';
    const [isPasswordModalOpen, setPasswordModalOpen] = useState(false);

    const menuItems = isAdmin
        ? adminMenuItems
        : authUser?.role === 'Student'
        ? studentMenuItems
        : teacherMenuItems;

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setAuthUser(null);
    };

    if (isAdmin) {
        return (
            <aside className="sidebar sidebar-admin">
                <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'center', padding: '24px 0', borderBottom: '1px solid rgba(255,255,255,0.15)' }}>
                    <img src={logo} alt="NP Education" style={{ height: '48px', objectFit: 'contain', filter: 'brightness(0) invert(1)' }} />
                </div>

                <nav className="sidebar-nav">
                    <ul>
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentView === item.id;
                            return (
                                <li key={item.id} className="nav-item">
                                    <button
                                        onClick={() => setView(item.id)}
                                        className={`nav-btn ${isActive ? 'active' : ''}`}
                                    >
                                        <Icon size={20} />
                                        <span>{item.label}</span>
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                
                <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setPasswordModalOpen(false)} />
            </aside>
        );
    }

    return (
        <aside className="sidebar">
            <div className="sidebar-header" style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
                <img src={logo} alt="NP Education" style={{ height: '48px', objectFit: 'contain' }} />
            </div>

            <nav className="sidebar-nav">
                <ul>
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = currentView === item.id;
                        return (
                            <li key={item.id} className="nav-item">
                                <button
                                    onClick={() => setView(item.id)}
                                    className={`nav-btn ${isActive ? 'active' : ''}`}
                                >
                                    <Icon size={20} />
                                    <span>{item.label}</span>
                                </button>
                            </li>
                        );
                    })}
                </ul>
            </nav>

            <div className="sidebar-footer" style={{ display: 'flex', gap: '8px' }}>
                
            </div>
            <ChangePasswordModal isOpen={isPasswordModalOpen} onClose={() => setPasswordModalOpen(false)} />
        </aside>
    );
};

export default Sidebar;
