import React, { useState, useEffect } from 'react';
import { Users, CalendarCheck, Search, DollarSign, Bell, TrendingUp, TrendingDown, BookOpen, UserPlus, AlertTriangle, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

const StatCard = ({ title, value, icon: Icon, color, trend, trendLabel, hasChart }) => (
    <div className="card" style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <h3 style={{ color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '500', marginBottom: '8px' }}>{title}</h3>
                <div style={{ fontSize: '1.75rem', fontWeight: '700', color: 'var(--text-main)' }}>{value}</div>
            </div>
            <div style={{
                padding: '10px',
                background: `${color}15`,
                color: color,
                borderRadius: '8px'
            }}>
                <Icon size={20} />
            </div>
        </div>

        {hasChart && (
            <div style={{ height: '40px', width: '100%', marginTop: 'auto' }}>
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={mockChartData}>
                        <Line type="monotone" dataKey="revenue" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        )}

        {trend && (
            <div style={{ fontSize: '0.75rem', color: trend === 'up' ? 'var(--secondary)' : trend === 'down' ? 'var(--accent)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: 'auto' }}>
                {trend === 'up' && <TrendingUp size={14} />}
                {trend === 'down' && <TrendingDown size={14} />}
                <span>{trendLabel}</span>
            </div>
        )}
    </div>
);

const mockChartData = [
    { name: 'T1', revenue: 0.8 },
    { name: 'T2', revenue: 0.9 },
    { name: 'T3', revenue: 1.1 },
    { name: 'T4', revenue: 1.0 },
    { name: 'T5', revenue: 1.2 },
    { name: 'T6', revenue: 1.15 },
];

const activityFeed = [
    {
        id: 1,
        text: 'Nguyễn Văn A đã điểm danh lớp IELTS Foundation',
        time: '2 phút trước',
        color: '#10b981',
        bg: '#d1fae5',
    },
    {
        id: 2,
        text: 'Trần Thị B đã đóng học phí lớp TOEIC 500+',
        time: '15 phút trước',
        color: '#8b5cf6',
        bg: '#ede9fe',
    },
    {
        id: 3,
        text: 'Giáo viên Lê Văn C đã nộp điểm lớp Tiếng Anh Giao Tiếp',
        time: '1 giờ trước',
        color: '#f59e0b',
        bg: '#fef3c7',
    },
    {
        id: 4,
        text: 'Lớp học mới Tiếng Anh Trẻ Em G1 đã được tạo',
        time: '3 giờ trước',
        color: '#3b82f6',
        bg: '#dbeafe',
    },
];

const Dashboard = ({ setView, authUser, students, classes }) => {
    // Mock notifications (có thể query sau)
    const notifications = [
        { id: 1, text: "Hệ thống đang chạy ổn định.", type: "info" }
    ];

    // Tính toán từ dữ liệu thật
    const studentCount = students ? students.length : 0;
    const classCount = classes ? classes.length : 0;
    // Tỷ lệ fake để demo
    const attendanceRate = studentCount > 0 ? "82%" : "0%";

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>

            {/* Stats Row */}
            {authUser?.role !== 'Student' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-lg)' }}>
                    {authUser?.role === 'Admin' && <StatCard title="Tổng doanh thu" value="1.2 Tỷ đ" icon={TrendingUp} color="#10b981" trend="up" trendLabel="Tăng 12% so với tháng trước" hasChart={true} />}
                    <StatCard title="Học viên đang học" value={studentCount > 0 ? "2,450" : "0"} icon={Users} color="#3b82f6" trend="up" trendLabel="Tăng 5% so với tháng trước" />
                    <StatCard title="Lớp học đang mở" value={classCount > 0 ? "128" : "0"} icon={BookOpen} color="#8b5cf6" trendLabel="+42 Giáo viên" />
                    {authUser?.role === 'Admin' && <StatCard title="Ghi danh mới" value="145" icon={UserPlus} color="#f97316" trendLabel="Tuần này" />}
                </div>
            )}

            {authUser?.role === 'Student' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 'var(--space-lg)' }}>
                    <StatCard title="Lớp đang tham gia" value="2" icon={BookOpen} color="#8b5cf6" />
                    <StatCard title="Tỷ lệ chuyên cần" value="95%" icon={CalendarCheck} color="#10b981" trend="up" trendLabel="Rất tốt!" />
                </div>
            )}

            {/* Charts & Actions Row */}
            {authUser?.role === 'Admin' ? (
                /* Admin 2-column layout */
                <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 'var(--space-lg)' }}>
                    {/* Left: Activity Feed */}
                    <div className="card">
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                            <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Activity size={18} color="var(--primary)" />
                                Hoạt động gần đây
                            </h3>
                            <a href="#" style={{ fontSize: '0.85rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 500 }}>Xem tất cả</a>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            {activityFeed.map(item => (
                                <div key={item.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: item.color, marginTop: 5, flexShrink: 0 }} />
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '0.875rem', color: 'var(--text-main)', marginBottom: '2px' }}>{item.text}</p>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{item.time}</span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Revenue chart below activity */}
                        <div style={{ marginTop: '1.5rem' }}>
                            <h3 style={{ marginBottom: '1rem' }}>Biểu đồ Doanh thu (6 tháng)</h3>
                            <div style={{ width: '100%', height: '200px' }}>
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={mockChartData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-md)' }}
                                            cursor={{ fill: 'var(--background)' }}
                                        />
                                        <Line type="monotone" dataKey="revenue" stroke="var(--primary)" strokeWidth={3} dot={{ stroke: 'var(--primary)', strokeWidth: 2, r: 4, fill: '#fff' }} activeDot={{ r: 6 }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </div>

                    {/* Right: Urgent Notifications + Post form */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                        <div className="card" style={{ background: 'var(--accent-light)', border: '1px solid #fecaca' }}>
                            <h3 style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertTriangle size={20} />
                                Thông báo khẩn
                            </h3>

                            <div style={{ marginTop: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                <div style={{ background: '#fff5f5', padding: '12px', borderRadius: '8px', border: '1px solid #fed7d7' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <h4 style={{ fontSize: '0.9rem', color: '#9b2c2c' }}>Bảo trì hệ thống</h4>
                                        <span style={{ fontSize: '0.65rem', background: '#fed7d7', color: '#c53030', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>CAO</span>
                                    </div>
                                    <p style={{ fontSize: '0.875rem', color: '#742a2a', marginBottom: '8px' }}>
                                        Bảo trì định kỳ tối nay từ 12h đêm đến 2h sáng. Hệ thống sẽ tạm ngừng hoạt động.
                                    </p>
                                    <span style={{ fontSize: '0.75rem', color: '#9b2c2c', opacity: 0.7 }}>Đăng 2 giờ trước</span>
                                </div>

                                <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <h4 style={{ fontSize: '0.9rem', color: '#1e3a8a' }}>Lịch nghỉ lễ</h4>
                                        <span style={{ fontSize: '0.65rem', background: '#bfdbfe', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>THÔNG TIN</span>
                                    </div>
                                    <p style={{ fontSize: '0.875rem', color: '#1e3a8a', marginBottom: '8px' }}>
                                        Trung tâm sẽ nghỉ lễ Quốc khánh mùng 2 tháng 9. Vui lòng thông báo cho học viên.
                                    </p>
                                    <span style={{ fontSize: '0.75rem', color: '#1e3a8a', opacity: 0.7 }}>Đăng hôm qua</span>
                                </div>
                            </div>
                        </div>

                        <div className="card">
                            <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Đăng thông báo mới</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                <input className="input" placeholder="Tiêu đề" />
                                <textarea className="input" placeholder="Nội dung thông báo..." rows="3" style={{ resize: 'none' }}></textarea>
                                <button className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem', background: 'var(--primary-dark)' }}>Đăng thông báo</button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                /* Non-Admin layout */
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-lg)' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
                        <div className="card" style={{ background: 'var(--accent-light)', border: '1px solid #fecaca' }}>
                            <h3 style={{ color: 'var(--accent)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertTriangle size={20} />
                                Thông báo khẩn
                            </h3>

                            <div style={{ marginTop: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                                <div style={{ background: '#fff5f5', padding: '12px', borderRadius: '8px', border: '1px solid #fed7d7' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <h4 style={{ fontSize: '0.9rem', color: '#9b2c2c' }}>Bảo trì hệ thống</h4>
                                        <span style={{ fontSize: '0.65rem', background: '#fed7d7', color: '#c53030', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>CAO</span>
                                    </div>
                                    <p style={{ fontSize: '0.875rem', color: '#742a2a', marginBottom: '8px' }}>
                                        Bảo trì định kỳ tối nay từ 12h đêm đến 2h sáng. Hệ thống sẽ tạm ngừng hoạt động.
                                    </p>
                                    <span style={{ fontSize: '0.75rem', color: '#9b2c2c', opacity: 0.7 }}>Đăng 2 giờ trước</span>
                                </div>

                                <div style={{ background: '#eff6ff', padding: '12px', borderRadius: '8px', border: '1px solid #bae6fd' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                        <h4 style={{ fontSize: '0.9rem', color: '#1e3a8a' }}>Lịch nghỉ lễ</h4>
                                        <span style={{ fontSize: '0.65rem', background: '#bfdbfe', color: '#1d4ed8', padding: '2px 6px', borderRadius: '4px', fontWeight: 'bold' }}>THÔNG TIN</span>
                                    </div>
                                    <p style={{ fontSize: '0.875rem', color: '#1e3a8a', marginBottom: '8px' }}>
                                        Trung tâm sẽ nghỉ lễ Quốc khánh mùng 2 tháng 9. Vui lòng thông báo cho học viên.
                                    </p>
                                    <span style={{ fontSize: '0.75rem', color: '#1e3a8a', opacity: 0.7 }}>Đăng hôm qua</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
