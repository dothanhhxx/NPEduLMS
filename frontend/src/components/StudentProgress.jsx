import { useState, useEffect } from 'react';
import api from '../api';
import './StudentProgress.css';

// ── Helpers ──────────────────────────────────────────────────────────────────
const getTagClass = (tag) => {
    const map = {
        'IELTS':     'sp-tag-ielts',
        'TOEIC':     'sp-tag-toeic',
        'TOEFL':     'sp-tag-toefl',
        'Giao tiếp': 'sp-tag-giaotiep',
        'Ngữ pháp':  'sp-tag-nguphap',
    };
    return map[tag] || 'sp-tag-khac';
};

const getAttendanceClass = (rate) => {
    if (rate >= 75) return 'great';
    if (rate >= 50) return 'good';
    return 'bad';
};

// ── Skeleton ─────────────────────────────────────────────────────────────────
const SkeletonCard = () => (
    <div className="sp-skeleton-card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="sp-skeleton-line" style={{ height: 18, width: '70%' }} />
            <div className="sp-skeleton-line" style={{ height: 12, width: '30%' }} />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="sp-skeleton-line" style={{ height: 64, borderRadius: 10 }} />
            <div className="sp-skeleton-line" style={{ height: 64, borderRadius: 10 }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="sp-skeleton-line" style={{ height: 10, width: '50%' }} />
            <div className="sp-skeleton-line" style={{ height: 16, width: '40%' }} />
            <div className="sp-skeleton-line" style={{ height: 6, borderRadius: 999 }} />
        </div>
    </div>
);

// ── Course Card ───────────────────────────────────────────────────────────────
const CourseCard = ({ course }) => {
    const {
        courseName,
        tag,
        attendanceRate,
        averageScore,
        completedAssignments,
        totalAssignments,
        hasData
    } = course;

    const pct = totalAssignments > 0
        ? Math.round((completedAssignments / totalAssignments) * 100)
        : 0;

    const scoreDisplay = averageScore !== null && averageScore !== undefined
        ? averageScore.toFixed(1)
        : '--';

    return (
        <div className="sp-card">
            {/* Header */}
            <div className="sp-card-header">
                <h3 className="sp-card-title">{courseName}</h3>
                <span className={`sp-tag ${getTagClass(tag)}`}>{tag}</span>
            </div>

            {!hasData ? (
                <div className="sp-card-empty">
                    Không có dữ liệu trong khoảng thời gian này.
                </div>
            ) : (
                <>
                    {/* Stats */}
                    <div className="sp-stats">
                        <div className="sp-stat-box">
                            <span className="sp-stat-label">Tỷ lệ chuyên cần</span>
                            <span className={`sp-stat-value ${getAttendanceClass(attendanceRate)}`}>
                                {attendanceRate}%
                            </span>
                        </div>
                        <div className="sp-stat-box">
                            <span className="sp-stat-label">Điểm trung bình</span>
                            <span className={`sp-stat-value ${scoreDisplay === '--' ? 'dash' : 'neutral'}`}>
                                {scoreDisplay}
                            </span>
                        </div>
                    </div>

                    {/* Assignments */}
                    <div className="sp-assignments">
                        <div className="sp-assign-header">
                            <span className="sp-assign-label">Bài tập đã hoàn thành</span>
                        </div>
                        <div className="sp-assign-header">
                            <span className="sp-assign-count">
                                {completedAssignments}/{totalAssignments}
                                <span className="sp-assign-pct">({pct}%)</span>
                            </span>
                        </div>
                        <div className="sp-progress-track">
                            <div
                                className="sp-progress-fill"
                                style={{ width: `${pct}%` }}
                                role="progressbar"
                                aria-valuenow={pct}
                                aria-valuemin={0}
                                aria-valuemax={100}
                            />
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

// ── Main Component ────────────────────────────────────────────────────────────
const StudentProgress = () => {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Filters
    const [period, setPeriod] = useState('month');
    const [selectedCourseId, setSelectedCourseId] = useState('all');

    useEffect(() => {
        let cancelled = false;

        const fetchProgress = async () => {
            setLoading(true);
            setError(null);
            try {
                const res = await api.get(`/progress/me?period=${period}`);
                if (!cancelled) {
                    setCourses(res.data?.data || []);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err.response?.data?.message ||
                        'Không thể tải dữ liệu tiến độ. Vui lòng thử lại sau.'
                    );
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        fetchProgress();
        return () => { cancelled = true; };
    }, [period]);

    // Lọc theo khóa học
    const displayedCourses = selectedCourseId === 'all' 
        ? courses 
        : courses.filter(c => c.courseId.toString() === selectedCourseId);

    // ── Loading skeleton ──
    if (loading) {
        return (
            <div className="sp-container">
                <div className="sp-skeleton-grid">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <SkeletonCard key={i} />
                    ))}
                </div>
            </div>
        );
    }

    // ── Error ──
    if (error) {
        return (
            <div className="sp-container">
                <div className="sp-error">
                    <span>⚠️</span>
                    <span>{error}</span>
                </div>
            </div>
        );
    }

    // ── Empty state (Không đăng ký khóa học nào) ──
    if (courses.length === 0) {
        return (
            <div className="sp-container">
                <div className="sp-empty">
                    <div className="sp-empty-icon">📚</div>
                    <h3>Chưa có dữ liệu học tập</h3>
                    <p>Hãy liên hệ với trung tâm để được tư vấn và ghi danh vào lớp học phù hợp.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="sp-container">
            {/* Filters */}
            <div className="sp-filters">
                <div className="sp-filter-group">
                    <label className="sp-filter-label">Bộ lọc:</label>
                    <select 
                        className="sp-filter-select"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                    >
                        <option value="week">Tuần này</option>
                        <option value="month">Tháng này</option>
                        <option value="year">Năm nay</option>
                    </select>
                </div>
                
                <div className="sp-filter-group">
                    <label className="sp-filter-label">Lớp:</label>
                    <select 
                        className="sp-filter-select"
                        value={selectedCourseId}
                        onChange={(e) => setSelectedCourseId(e.target.value)}
                    >
                        <option value="all">Tất cả khóa học</option>
                        {courses.map(c => (
                            <option key={c.courseId} value={c.courseId}>
                                {c.courseName}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Grid of cards */}
            {displayedCourses.length === 0 ? (
                <div className="sp-empty">
                    <div className="sp-empty-icon">📂</div>
                    <h3>Không có dữ liệu trong khoảng thời gian này</h3>
                </div>
            ) : (
                <div className="sp-grid">
                    {displayedCourses.map((course) => (
                        <CourseCard key={course.courseId} course={course} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default StudentProgress;
