import React, { useState } from 'react';
import { Download, FileText, Table } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell, Legend } from 'recharts';

const studentData = [
    { month: 'T1', students: 180 },
    { month: 'T2', students: 210 },
    { month: 'T3', students: 240 },
    { month: 'T4', students: 230 },
    { month: 'T5', students: 260 },
    { month: 'T6', students: 290 },
];

const revenueData = [
    { month: 'T1', revenue: 820 },
    { month: 'T2', revenue: 930 },
    { month: 'T3', revenue: 1100 },
    { month: 'T4', revenue: 1000 },
    { month: 'T5', revenue: 1200 },
    { month: 'T6', revenue: 1150 },
];

const attendanceData = [
    { name: 'Đúng giờ', value: 72, color: '#1C513E' },
    { name: 'Trễ', value: 15, color: '#f59e0b' },
    { name: 'Vắng có phép', value: 8, color: '#3b82f6' },
    { name: 'Vắng không phép', value: 5, color: '#ef4444' },
];

const gradeData = [
    { range: 'Xuất sắc (9-10)', count: 45 },
    { range: 'Giỏi (8-8.9)', count: 120 },
    { range: 'Khá (6.5-7.9)', count: 200 },
    { range: 'TB (5-6.4)', count: 80 },
    { range: 'Yếu (<5)', count: 20 },
];

const AdminReports = () => {
    const [period, setPeriod] = useState('6months');

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Header actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', gap: '8px' }}>
                    {['1month', '3months', '6months', '1year'].map(p => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className="btn"
                            style={{
                                padding: '6px 14px',
                                border: `1px solid ${period === p ? '#1C513E' : 'var(--border)'}`,
                                background: period === p ? '#1C513E' : 'white',
                                color: period === p ? 'white' : 'var(--text-muted)',
                                fontSize: '0.8rem',
                            }}
                        >
                            {{ '1month': '1 tháng', '3months': '3 tháng', '6months': '6 tháng', '1year': '1 năm' }[p]}
                        </button>
                    ))}
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="btn" style={{ border: '1px solid var(--border)', background: 'white', gap: '6px', color: 'var(--text-main)' }}>
                        <FileText size={15} /> Xuất PDF
                    </button>
                    <button className="btn" style={{ border: '1px solid var(--border)', background: 'white', gap: '6px', color: 'var(--text-main)' }}>
                        <Table size={15} /> Xuất Excel
                    </button>
                </div>
            </div>

            {/* Charts row 1 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Student count chart */}
                <div className="card">
                    <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>Số học viên theo tháng</h3>
                    <div style={{ width: '100%', height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={studentData} barSize={28}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-md)' }} />
                                <Bar dataKey="students" fill="#1C513E" radius={[4, 4, 0, 0]} name="Học viên" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Revenue chart */}
                <div className="card">
                    <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>Doanh thu theo tháng (Triệu đ)</h3>
                    <div style={{ width: '100%', height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={revenueData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 12 }} />
                                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-md)' }} />
                                <Line type="monotone" dataKey="revenue" stroke="#1C513E" strokeWidth={2.5} dot={{ r: 4, fill: '#fff', stroke: '#1C513E' }} name="Doanh thu" />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Charts row 2 */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                {/* Attendance pie */}
                <div className="card">
                    <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>Tỷ lệ điểm danh</h3>
                    <div style={{ width: '100%', height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={attendanceData} cx="45%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3}>
                                    {attendanceData.map((entry, i) => (
                                        <Cell key={i} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(v) => `${v}%`} />
                                <Legend iconSize={10} iconType="circle" formatter={(v) => <span style={{ fontSize: '0.78rem' }}>{v}</span>} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Grade distribution */}
                <div className="card">
                    <h3 style={{ marginBottom: '1.25rem', fontSize: '1rem' }}>Phân bố kết quả học tập</h3>
                    <div style={{ width: '100%', height: 220 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={gradeData} layout="vertical" barSize={18}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
                                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} />
                                <YAxis type="category" dataKey="range" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)', fontSize: 11 }} width={120} />
                                <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-md)' }} />
                                <Bar dataKey="count" fill="#1C513E" radius={[0, 4, 4, 0]} name="Học viên" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Summary stats */}
            <div className="card">
                <h3 style={{ marginBottom: '1rem', fontSize: '1rem' }}>Tổng hợp kết quả học tập</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' }}>
                    {[
                        { label: 'Tổng học viên', value: '2,450', color: '#1C513E' },
                        { label: 'Tỷ lệ đậu', value: '87.3%', color: '#10b981' },
                        { label: 'Điểm TB', value: '7.4', color: '#3b82f6' },
                        { label: 'Tỷ lệ chuyên cần', value: '82%', color: '#8b5cf6' },
                        { label: 'Lớp đang mở', value: '128', color: '#f59e0b' },
                    ].map(s => (
                        <div key={s.label} style={{ textAlign: 'center', padding: '1rem', background: `${s.color}10`, borderRadius: 10 }}>
                            <div style={{ fontSize: '1.75rem', fontWeight: 700, color: s.color }}>{s.value}</div>
                            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: 4 }}>{s.label}</div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default AdminReports;
