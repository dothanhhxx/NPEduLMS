import React from 'react';
import { TrendingUp, TrendingDown, DollarSign, CreditCard, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

const revenueData = [
    { month: 'T1', revenue: 820, expense: 520 },
    { month: 'T2', revenue: 930, expense: 580 },
    { month: 'T3', revenue: 1100, expense: 620 },
    { month: 'T4', revenue: 1000, expense: 600 },
    { month: 'T5', revenue: 1200, expense: 650 },
    { month: 'T6', revenue: 1150, expense: 700 },
];

const transactions = [
    { id: 'TXN-001', student: 'Nguyễn Văn A', course: 'IELTS Foundation', amount: 3500000, date: '10/03/2026', status: 'paid' },
    { id: 'TXN-002', student: 'Trần Thị B', course: 'TOEIC 500+', amount: 2800000, date: '09/03/2026', status: 'paid' },
    { id: 'TXN-003', student: 'Lê Minh', course: 'Tiếng Anh Giao Tiếp', amount: 1500000, date: '08/03/2026', status: 'pending' },
    { id: 'TXN-004', student: 'Hoàng Thị Mai', course: 'IELTS Advanced', amount: 4200000, date: '07/03/2026', status: 'paid' },
    { id: 'TXN-005', student: 'Phạm Quang Huy', course: 'Tiếng Anh Trẻ Em G1', amount: 1200000, date: '06/03/2026', status: 'overdue' },
];

const formatVND = (n) => n.toLocaleString('vi-VN') + ' đ';

const StatusBadge = ({ status }) => {
    const map = {
        paid: { label: 'Đã thanh toán', bg: '#d1fae5', color: '#065f46' },
        pending: { label: 'Chờ thanh toán', bg: '#fef3c7', color: '#92400e' },
        overdue: { label: 'Quá hạn', bg: '#fee2e2', color: '#991b1b' },
    };
    const s = map[status] || map.pending;
    return (
        <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '999px', fontSize: '0.75rem', fontWeight: 600 }}>
            {s.label}
        </span>
    );
};

const StatCard = ({ title, value, icon: Icon, color, trend, trendLabel }) => (
    <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 4 }}>{title}</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{value}</div>
            </div>
            <div style={{ padding: 10, background: `${color}22`, borderRadius: 8 }}>
                <Icon size={20} color={color} />
            </div>
        </div>
        {trendLabel && (
            <div style={{ fontSize: '0.75rem', color: trend === 'up' ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                {trend === 'up' ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {trendLabel}
            </div>
        )}
    </div>
);

const AdminFinance = () => {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <StatCard title="Tổng doanh thu" value="6.2 Tỷ đ" icon={DollarSign} color="#1C513E" trend="up" trendLabel="Tăng 8% so với năm ngoái" />
                <StatCard title="Thu trong tháng" value="1.15 Tỷ đ" icon={ArrowUpCircle} color="#10b981" trend="up" trendLabel="Tăng 4% so với tháng trước" />
                <StatCard title="Chi phí tháng" value="700 Triệu đ" icon={ArrowDownCircle} color="#ef4444" trend="down" trendLabel="Giảm 2% so với tháng trước" />
                <StatCard title="Lợi nhuận" value="450 Triệu đ" icon={CreditCard} color="#8b5cf6" trend="up" trendLabel="Tăng 10% so với tháng trước" />
            </div>

            {/* Revenue chart */}
            <div className="card">
                <h3 style={{ marginBottom: '1.25rem' }}>Biểu đồ Doanh thu & Chi phí (6 tháng gần nhất)</h3>
                <div style={{ width: '100%', height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={revenueData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: 'var(--text-muted)' }} />
                            <Tooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-md)' }} />
                            <Line type="monotone" dataKey="revenue" stroke="#1C513E" strokeWidth={2.5} dot={{ r: 4, fill: '#fff', stroke: '#1C513E' }} name="Doanh thu (triệu đ)" />
                            <Line type="monotone" dataKey="expense" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 3, fill: '#fff', stroke: '#ef4444' }} name="Chi phí (triệu đ)" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
                <div style={{ display: 'flex', gap: '1.5rem', justifyContent: 'center', marginTop: '0.5rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span style={{ width: 20, height: 3, background: '#1C513E', display: 'inline-block', borderRadius: 2 }} /> Doanh thu
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        <span style={{ width: 20, height: 3, background: '#ef4444', display: 'inline-block', borderRadius: 2, borderTop: '2px dashed #ef4444' }} /> Chi phí
                    </span>
                </div>
            </div>

            {/* Transaction history */}
            <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
                    <h3>Lịch sử thanh toán gần đây</h3>
                </div>
                <table className="user-table">
                    <thead>
                        <tr>
                            <th>MÃ GIAO DỊCH</th>
                            <th>HỌC VIÊN</th>
                            <th>KHÓA HỌC</th>
                            <th>SỐ TIỀN</th>
                            <th>NGÀY</th>
                            <th>TRẠNG THÁI</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(tx => (
                            <tr key={tx.id}>
                                <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{tx.id}</td>
                                <td style={{ fontWeight: 500, fontSize: '0.875rem' }}>{tx.student}</td>
                                <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{tx.course}</td>
                                <td style={{ fontWeight: 600, color: '#1C513E' }}>{formatVND(tx.amount)}</td>
                                <td style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>{tx.date}</td>
                                <td><StatusBadge status={tx.status} /></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminFinance;
