import React, { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'
import SolutionManager from './Admin/SolutionManager'
import BlogManager from './Admin/BlogManager'
import ContactManager from './Admin/ContactManager'
import SimplePieChart from '../components/Admin/SimplePieChart'
import SecurityDashboard from '../components/SecurityDashboard/SecurityDashboard'
import SecurityAdvisor from '../components/SecurityAdvisor/SecurityAdvisor'
import ErrorBoundary from '../components/ErrorBoundary/ErrorBoundary'
import ERDiagram from '../components/Admin/ERDiagram'
import AdminSettings from '../components/AdminSettings/AdminSettings'
import '../styles/admin-dashboard.css'
import '../styles/lab.css'

export default function AdminDashboard() {
    const { user, logout, api } = useAuth()
    const { lang, setLang, t } = useLanguage()
    const { isDark, toggleTheme } = useTheme()
    const navigate = useNavigate()
    const [activeSection, setActiveSection] = useState('overview')
    const [stats, setStats] = useState({
        userCount: 0,
        tables: [],
        charts: {},
        recentLogs: []
    })
    const [chartInsight, setChartInsight] = useState('')
    const [isTypingInsight, setIsTypingInsight] = useState(false)
    const [users, setUsers] = useState([])
    const [loadingData, setLoadingData] = useState(false)

    // Chart type toggle
    const [chartType, setChartType] = useState('bar')
    const [showERDLightbox, setShowERDLightbox] = useState(false)
    const [showLangMenu, setShowLangMenu] = useState(false)
    const langMenuTimeout = useRef(null)

    const handleLangMouseEnter = () => {
        if (langMenuTimeout.current) clearTimeout(langMenuTimeout.current)
        setShowLangMenu(true)
    }

    const handleLangMouseLeave = () => {
        langMenuTimeout.current = setTimeout(() => {
            setShowLangMenu(false)
        }, 300) // 300ms delay to give user time to click
    }

    // Database PIN lock
    const [dbUnlocked, setDbUnlocked] = useState(false)
    const [dbPin, setDbPin] = useState('')
    const [dbPinError, setDbPinError] = useState('')

    // Initial data load (runs once on mount)
    useEffect(() => {
        loadStats()
        loadUsers()
    }, [])

    // Polling interval — runs only when on relevant sections, 30s to reduce load
    useEffect(() => {
        const interval = setInterval(() => {
            if (activeSection === 'overview' || activeSection === 'database') {
                loadStats()
            }
            if (activeSection === 'users' || activeSection === 'database') {
                loadUsers()
            }
        }, 30000)
        return () => clearInterval(interval)
    }, [activeSection])

    const loadStats = async () => {
        try {
            const res = await api.get('/dashboard/stats')
            if (res.data) {
                setStats(prevStats => {
                    // Check if there is a new blocked IP
                    if (prevStats.latestBlockedIp !== undefined && res.data.latestBlockedIp && prevStats.latestBlockedIp !== res.data.latestBlockedIp) {
                        toast.error(
                            `🤖 Phát hiện hành vi tấn công dò mật khẩu từ IP [${res.data.latestBlockedIp}]. Hệ thống đã thực hiện chặn cứng để bảo vệ dữ liệu.`,
                            { duration: 8000, style: { background: 'rgba(239, 68, 68, 0.9)', color: '#fff', border: '1px solid #ff0055', boxShadow: '0 0 15px rgba(255, 0, 85, 0.5)' } }
                        )
                    }
                    return { ...prevStats, ...res.data }
                })

                // Fetch AI Insight if charts exist
                if (res.data.charts && Object.keys(res.data.charts).length > 0) {
                    try {
                        setIsTypingInsight(true);
                        setChartInsight('');
                        const insightRes = await api.post('/admin/advisor/insight', res.data.charts)
                        if (insightRes.data && insightRes.data.insight) {
                            setChartInsight(insightRes.data.insight)
                        }
                    } catch (e) {
                        console.error('Failed to load chart insight', e)
                        setChartInsight('Tính năng phân tích AI tạm thời không hoạt động.')
                    } finally {
                        setIsTypingInsight(false);
                    }
                }
            }
        } catch (err) {
            console.error('Failed to load stats:', err?.response?.status, err?.message)
        }
    }

    const loadUsers = async () => {
        setLoadingData(true)
        try {
            const res = await api.get('/dashboard/database/users')
            setUsers(res.data)
        } catch (err) {
            console.error('Failed to load users:', err)
        }
        setLoadingData(false)
    }

    const handleSectionChange = (section) => {
        setActiveSection(section)
        if (section === 'database' || section === 'users') loadUsers()
        if (section === 'overview' || section === 'database') loadStats()
    }

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const formatDate = (iso) => {
        if (!iso) return '-'
        try {
            return new Date(iso).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US')
        } catch { return iso }
    }

    return (
        <div className="admin-dashboard lab-hub">
            {/* Sidebar */}
            <aside className="admin-sidebar">
                <div className="admin-sidebar-header">
                    <div>
                        <Link to="/" className="admin-logo">CyberShield</Link>
                        <span className="admin-badge">Admin Pro</span>
                    </div>
                </div>
                <nav className="admin-sidebar-nav">
                    <button
                        className={`admin-nav-item ${activeSection === 'overview' ? 'active' : ''}`}
                        onClick={() => handleSectionChange('overview')}
                    >
                        <i className='bx bx-grid-alt'></i>
                        <span>{lang === 'vi' ? 'Dashboard' : 'Dashboard'}</span>
                    </button>
                    <button
                        className={`admin-nav-item ${activeSection === 'advisor' ? 'active' : ''}`}
                        onClick={() => handleSectionChange('advisor')}
                    >
                        <i className='bx bx-bot'></i>
                        <span>{lang === 'vi' ? 'AI Security Advisor' : 'AI Security Advisor'}</span>
                    </button>
                    <button
                        className={`admin-nav-item ${activeSection === 'database' ? 'active' : ''}`}
                        onClick={() => handleSectionChange('database')}
                    >
                        <i className='bx bx-data'></i>
                        <span>{t('admin_db_manager')}</span>
                    </button>
                    <button
                        className={`admin-nav-item ${activeSection === 'users' ? 'active' : ''}`}
                        onClick={() => handleSectionChange('users')}
                    >
                        <i className='bx bx-user'></i>
                        <span>{t('admin_user_mgr')}</span>
                    </button>
                    <button
                        className={`admin-nav-item ${activeSection === 'contacts' ? 'active' : ''}`}
                        onClick={() => handleSectionChange('contacts')}
                    >
                        <i className='bx bx-envelope'></i>
                        <span>{lang === 'vi' ? 'Phản hồi (Contacts)' : 'Contacts'}</span>
                    </button>
                    <button
                        className={`admin-nav-item ${activeSection === 'blogs' ? 'active' : ''}`}
                        onClick={() => handleSectionChange('blogs')}
                    >
                        <i className='bx bx-news'></i>
                        <span>{lang === 'vi' ? 'Tin tức (Blogs)' : 'Blogs'}</span>
                    </button>
                    <button
                        className={`admin-nav-item ${activeSection === 'solutions' ? 'active' : ''}`}
                        onClick={() => handleSectionChange('solutions')}
                    >
                        <i className='bx bx-layer'></i>
                        <span>{t('admin_sol_mgr')}</span>
                    </button>
                    <button
                        className={`admin-nav-item ${activeSection === 'security' ? 'active' : ''}`}
                        onClick={() => handleSectionChange('security')}
                    >
                        <i className='bx bx-shield-quarter'></i>
                        <span>{t('admin_sys_sec')}</span>
                    </button>
                    <button
                        className={`admin-nav-item ${activeSection === 'settings' ? 'active' : ''}`}
                        onClick={() => handleSectionChange('settings')}
                    >
                        <i className='bx bx-cog'></i>
                        <span>{t('admin_sys_settings')}</span>
                    </button>
                </nav>
                <div className="admin-sidebar-footer">
                    <Link to="/" className="admin-nav-item">
                        <i className='bx bx-home'></i>
                        <span>{t('admin_home')}</span>
                    </Link>
                    <button className="admin-nav-item" onClick={handleLogout}>
                        <i className='bx bx-log-out'></i>
                        <span>{t('admin_logout')}</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                <header className="admin-header">
                    <div className="admin-header-left">
                        <h1 className="admin-page-title" style={{ marginBottom: 0, fontSize: '1.8rem', color: 'var(--text-primary)' }}>
                            {activeSection === 'overview' && t('admin_sys_overview')}
                            {activeSection === 'database' && t('admin_db_manager')}
                            {activeSection === 'users' && t('admin_user_mgr')}
                            {activeSection === 'contacts' && (lang === 'vi' ? 'Quản lý Liên hệ' : 'Contact Management')}
                            {activeSection === 'blogs' && (lang === 'vi' ? 'Quản lý Tin tức' : 'Blog Management')}
                            {activeSection === 'solutions' && t('admin_sol_mgr')}
                            {activeSection === 'security' && t('admin_sys_sec')}
                            {activeSection === 'advisor' && t('admin_ai_advisor')}
                            {activeSection === 'settings' && t('admin_sys_settings')}
                        </h1>
                    </div>

                    <div className="admin-header-actions">
                        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme" style={{ padding: '0.4rem', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', color: 'var(--text-primary)', transition: 'all 0.3s' }}>
                            {isDark ? <i className='bx bx-sun'></i> : <i className='bx bx-moon'></i>}
                        </button>
                        <div className="admin-lang-dropdown-wrapper" 
                             onMouseEnter={handleLangMouseEnter}
                             onMouseLeave={handleLangMouseLeave}>
                            <button className="admin-lang-toggle">
                                🌐 {lang.toUpperCase()} <i className='bx bx-chevron-down'></i>
                            </button>
                            {showLangMenu && (
                                <div className="admin-lang-menu">
                                    <button className={`admin-lang-item ${lang === 'vi' ? 'active' : ''}`} onClick={() => { setLang('vi'); setShowLangMenu(false); }}>🇻🇳 Tiếng Việt</button>
                                    <button className={`admin-lang-item ${lang === 'en' ? 'active' : ''}`} onClick={() => { setLang('en'); setShowLangMenu(false); }}>EN English</button>
                                    <button className={`admin-lang-item ${lang === 'ja' ? 'active' : ''}`} onClick={() => { setLang('ja'); setShowLangMenu(false); }}>🇯🇵 日本語</button>
                                    <button className={`admin-lang-item ${lang === 'ko' ? 'active' : ''}`} onClick={() => { setLang('ko'); setShowLangMenu(false); }}>🇰🇷 한국어</button>
                                    <button className={`admin-lang-item ${lang === 'zh' ? 'active' : ''}`} onClick={() => { setLang('zh'); setShowLangMenu(false); }}>🇨🇳 中文</button>
                                </div>
                            )}
                        </div>
                        <span className="admin-user-info" style={{ fontWeight: 'bold', color: 'var(--text-primary)', backgroundColor: 'var(--bg-glass)', border: '1px solid var(--border)' }}>
                            <i className='bx bx-user-circle'></i> {user?.username}
                        </span>
                    </div>
                </header>

                <div className="admin-content">
                    {/* Section: Overview */}
                    {activeSection === 'overview' && (
                        <section className="admin-section">
                            {/* Key Metrics */}
                            <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', width: '100%' }}>
                                <div className="admin-stat-card">
                                    <i className='bx bx-user admin-stat-icon'></i>
                                    <div>
                                        <span className="admin-stat-value">{stats.userCount ?? 0}</span>
                                        <span className="admin-stat-label">Total Users</span>
                                    </div>
                                </div>
                                <div className="admin-stat-card">
                                    <i className='bx bx-envelope admin-stat-icon'></i>
                                    <div>
                                        <span className="admin-stat-value">{stats.contactCount ?? 0}</span>
                                        <span className="admin-stat-label">Messages</span>
                                    </div>
                                </div>
                                <div className="admin-stat-card glowing-danger">
                                    <i className='bx bx-shield admin-stat-icon' style={{ color: '#ff0055', textShadow: '0 0 10px #ff0055' }}></i>
                                    <div>
                                        <span className="admin-stat-value" style={{ textShadow: '0 0 8px #ff0055' }}>{stats.blockedIpCount ?? 0}</span>
                                        <span className="admin-stat-label">{t('admin_blocked_ips')}</span>
                                    </div>
                                </div>
                                <div className="admin-stat-card">
                                    <i className='bx bx-server admin-stat-icon'></i>
                                    <div>
                                        <span className="admin-stat-value" style={{ color: '#22c55e' }}>Active</span>
                                        <span className="admin-stat-label">System Status</span>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Section */}
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '3rem', marginBottom: '1.5rem' }}>
                                <h3 style={{ color: 'var(--text-primary)', fontWeight: 600, margin: 0 }}>
                                    {lang === 'vi' ? 'Thống kê dữ liệu & AI Insight' : 'Data Analytics & AI Insight'}
                                </h3>
                            </div>

                            {/* AI Insight Box */}
                            <div className={`admin-ai-insight-box ${isTypingInsight ? 'glowing' : ''}`}>
                                <div className="insight-header">
                                    <i className='bx bx-brain'></i>
                                    <span>Qwen 2.5 Insight</span>
                                </div>
                                <div className="insight-content">
                                    {isTypingInsight ? (
                                        <div className="typing-indicator">
                                            <span></span><span></span><span></span>
                                        </div>
                                    ) : (
                                        <p className="typewriter-text">{chartInsight || 'Chưa có phân tích dữ liệu.'}</p>
                                    )}
                                </div>
                            </div>

                            <div style={{ animation: 'chartFadeIn 0.4s ease-out forwards' }}>
                                <div className="admin-chart-grid">
                                    <SimplePieChart
                                        title={lang === 'vi' ? 'Liên hệ khách hàng (Contacts)' : 'Contact Messages'}
                                        titleColor="var(--text-primary)"
                                        data={[
                                            { label: 'Unread', value: stats.charts?.contacts?.unread ?? 0, color: '#ff0055' },
                                            { label: 'Read', value: stats.charts?.contacts?.read ?? 0, color: '#00e5ff' }
                                        ]}
                                    />
                                    <SimplePieChart
                                        title={lang === 'vi' ? 'Bài viết & Tin tức (Blogs)' : 'Blogs & News'}
                                        titleColor="var(--text-primary)"
                                        data={[
                                            { label: 'Published', value: stats.charts?.blogs?.published ?? 0, color: '#00e5ff' },
                                            { label: 'Drafts', value: stats.charts?.blogs?.draft ?? 0, color: '#facc15' }
                                        ]}
                                    />
                                    <SimplePieChart
                                        title={lang === 'vi' ? 'Trạng thái Bảo mật (Security)' : 'Security Status'}
                                        titleColor="var(--text-primary)"
                                        data={[
                                            { label: lang === 'vi' ? 'Truy cập bị chặn' : 'Blocked Access', value: stats.charts?.security?.blocked ?? 0, color: '#ff0055' },
                                            { label: lang === 'vi' ? 'Truy cập an toàn' : 'Safe Access', value: stats.charts?.security?.safe ?? 0, color: '#39ff14' }
                                        ]}
                                    />
                                </div>
                            </div>

                            {/* Dual-Table Layout */}
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                                gap: '1.5rem',
                                marginTop: '3rem'
                            }}>
                                {/* Table 1: Security Logs */}
                                <div>
                                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                                        {lang === 'vi' ? 'Nhật ký bảo mật gần đây' : 'Recent Security Logs'}
                                    </h3>
                                    <div className="admin-table-wrapper">
                                        <div className="admin-table-scroll">
                                            <table className="admin-data-table">
                                                <thead>
                                                    <tr>
                                                        <th>Time</th>
                                                        <th>Action</th>
                                                        <th>User</th>
                                                        <th>IP</th>
                                                        <th>Severity</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {stats.recentLogs?.length > 0 ? (
                                                        stats.recentLogs.map(log => (
                                                            <tr key={log.id}>
                                                                <td>{formatDate(log.timestamp)}</td>
                                                                <td>{log.action}</td>
                                                                <td>{log.username || 'Anonymous'}</td>
                                                                <td>{log.ipAddress}</td>
                                                                <td className={`log-severity-${log.severity}`}>{log.severity}</td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '1rem' }}>No logs available</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* Table 2: Recent Users or DB Stats */}
                                <div>
                                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', fontWeight: 600 }}>
                                        {lang === 'vi' ? 'Cập nhật Người dùng' : 'Recent Users Update'}
                                    </h3>
                                    <div className="admin-table-wrapper">
                                        <div className="admin-table-scroll">
                                            <table className="admin-data-table">
                                                <thead>
                                                    <tr>
                                                        <th>Account</th>
                                                        <th>Status</th>
                                                        <th>Roles</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {users && users.length > 0 ? (
                                                        users.slice(0, 50).map(u => (
                                                            <tr key={u.id}>
                                                                <td>
                                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 'bold' }}>
                                                                            {u.username?.charAt(0)?.toUpperCase()}
                                                                        </div>
                                                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                            <span style={{ fontWeight: 600 }}>{u.username}</span>
                                                                            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{u.email}</span>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <span className={`admin-status ${u.enabled !== false ? 'active' : 'locked'}`}>
                                                                        {u.enabled !== false ? 'Active' : 'Locked'}
                                                                    </span>
                                                                </td>
                                                                <td>
                                                                    {typeof u.roles === 'string'
                                                                        ? u.roles.split(', ')[0]
                                                                        : u.roles?.[0]?.name || u.roles?.[0] || 'USER'}
                                                                </td>
                                                            </tr>
                                                        ))
                                                    ) : (
                                                        <tr><td colSpan="3" style={{ textAlign: 'center', padding: '1rem' }}>No users available</td></tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                            </div> {/* End Dual-Table */}
                        </section>
                    )}

                    {/* ERD Lightbox Modal */}
                    {showERDLightbox && (
                        <div style={{
                            position: 'fixed', inset: 0,
                            background: 'rgba(5, 8, 18, 0.96)', backdropFilter: 'blur(10px)',
                            zIndex: 10000, display: 'flex', flexDirection: 'column',
                            padding: '2rem', animation: 'fadeIn 0.2s ease-out'
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', padding: '0 1rem' }}>
                                <h2 style={{ color: 'var(--text-primary)', margin: 0, fontWeight: 700 }}>
                                    {lang === 'vi' ? 'Sơ đồ Thực thể Quan hệ (Toàn màn hình)' : 'Entity Relationship Diagram (Full Screen)'}
                                </h2>
                                <button onClick={() => setShowERDLightbox(false)} style={{
                                    background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: '50%',
                                    width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    cursor: 'pointer', fontSize: '1.8rem', transition: 'all 0.2s',
                                    boxShadow: '0 0 15px rgba(239, 68, 68, 0.2)'
                                }}>
                                    <i className='bx bx-x'></i>
                                </button>
                            </div>
                            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', borderRadius: '16px' }}>
                                <ERDiagram lang={lang} isMini={false} />
                            </div>
                        </div>
                    )}
                    {/* Section: Database */}
                    {activeSection === 'database' && (
                        <section className="admin-section">
                            {!dbUnlocked ? (
                                /* ═══ PIN LOCK GATE ═══ */
                                <div style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    minHeight: '400px'
                                }}>
                                    <div style={{
                                        width: '100%', maxWidth: '420px',
                                        background: 'rgba(15, 15, 30, 0.8)',
                                        border: '1px solid rgba(99, 102, 241, 0.15)',
                                        borderRadius: '20px', padding: '2.5rem',
                                        textAlign: 'center',
                                        boxShadow: '0 16px 48px rgba(0,0,0,0.4)'
                                    }}>
                                        <div style={{
                                            width: 64, height: 64, borderRadius: 16,
                                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            margin: '0 auto 1.25rem', fontSize: '1.75rem',
                                            boxShadow: '0 8px 24px rgba(99,102,241,0.3)'
                                        }}>
                                            🔒
                                        </div>
                                        <h3 style={{ color: 'var(--text-primary)', fontSize: '1.25rem', fontWeight: 800, margin: '1.5rem 0 0.5rem' }}>
                                            {lang === 'vi' ? 'Khu vực bảo mật' : 'Secured Area'}
                                        </h3>
                                        <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.5rem', lineHeight: 1.5 }}>
                                            {lang === 'vi'
                                                ? 'Nhập mã PIN bảo mật để truy cập cơ sở dữ liệu hệ thống.'
                                                : 'Enter security PIN to access the system database.'}
                                        </p>

                                        {dbPinError && (
                                            <div style={{
                                                color: '#f87171', fontSize: '0.85rem',
                                                background: 'rgba(239,68,68,0.1)',
                                                border: '1px solid rgba(239,68,68,0.2)',
                                                borderRadius: 10, padding: '0.6rem 1rem',
                                                marginBottom: '1rem'
                                            }}>
                                                ❌ {dbPinError}
                                            </div>
                                        )}

                                        <form onSubmit={(e) => {
                                            e.preventDefault()
                                            if (dbPin === '123456') {
                                                setDbUnlocked(true)
                                                setDbPinError('')
                                                loadStats()
                                                loadUsers()
                                            } else {
                                                setDbPinError(lang === 'vi' ? 'Mã PIN không đúng. Vui lòng thử lại.' : 'Incorrect PIN. Please try again.')
                                            }
                                        }}>
                                            <input
                                                type="password"
                                                inputMode="numeric"
                                                pattern="[0-9]*"
                                                maxLength={6}
                                                placeholder={lang === 'vi' ? 'Nhập mã PIN (6 chữ số)' : 'Enter PIN (6 digits)'}
                                                value={dbPin}
                                                onChange={(e) => setDbPin(e.target.value.replace(/\D/g, ''))}
                                                style={{
                                                    width: '100%', padding: '0.9rem 1.25rem',
                                                    background: 'rgba(30, 30, 50, 0.9)',
                                                    border: `1px solid ${dbPinError ? 'rgba(239,68,68,0.4)' : 'rgba(99,102,241,0.2)'}`,
                                                    borderRadius: 12, color: '#e2e8f0',
                                                    fontSize: '1.1rem', fontWeight: 700,
                                                    textAlign: 'center', letterSpacing: '0.3em',
                                                    outline: 'none', marginBottom: '1rem',
                                                    fontFamily: "'JetBrains Mono', monospace"
                                                }}
                                                autoFocus
                                            />
                                            <button
                                                type="submit"
                                                disabled={dbPin.length < 4}
                                                style={{
                                                    width: '100%', padding: '0.85rem',
                                                    background: dbPin.length >= 4
                                                        ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                                        : 'rgba(99,102,241,0.2)',
                                                    border: 'none', borderRadius: 12,
                                                    color: 'white', fontSize: '0.95rem',
                                                    fontWeight: 700, cursor: dbPin.length >= 4 ? 'pointer' : 'not-allowed',
                                                    opacity: dbPin.length >= 4 ? 1 : 0.5,
                                                    transition: 'all 0.3s',
                                                    boxShadow: dbPin.length >= 4 ? '0 4px 15px rgba(99,102,241,0.35)' : 'none'
                                                }}
                                            >
                                                🔓 {lang === 'vi' ? 'Mở khóa' : 'Unlock'}
                                            </button>
                                        </form>
                                    </div>
                                </div>
                            ) : (
                                /* ═══ UNLOCKED DATABASE CONTENT ═══ */
                                <>
                                    <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)', fontWeight: 700 }}>
                                        {lang === 'vi' ? 'Sơ đồ cơ sở dữ liệu hệ thống' : 'Database Schema Overview'}
                                    </h3>
                                    {stats.tables?.length > 0 ? (
                                        <div>
                                            <div className="admin-table-header" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '12px', padding: '1.25rem' }}>
                                                <h3 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.1rem' }}>{lang === 'vi' ? 'Gồm ' + stats.tables.length + ' bảng dữ liệu chính (Cập nhật thời gian thực)' : stats.tables.length + ' Tables Found (Real-time)'}</h3>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button className="admin-btn admin-btn-sm" onClick={loadStats}>
                                                        <i className='bx bx-refresh'></i> Refresh
                                                    </button>
                                                    <button
                                                        className="admin-btn admin-btn-sm"
                                                        onClick={() => window.open('http://localhost:8080/browser/', '_blank')}
                                                        style={{
                                                            background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                                                            border: 'none', color: 'white'
                                                        }}
                                                    >
                                                        <i className='bx bx-link-external'></i> {lang === 'vi' ? 'Truy cập pgAdmin' : 'Open pgAdmin'}
                                                    </button>
                                                    <button
                                                        className="admin-btn admin-btn-sm"
                                                        onClick={() => window.open('https://console.neon.tech/app/projects/solitary-unit-23173474/branches/br-tiny-smoke-a170qjq4/tables?database=neondb', '_blank')}
                                                        style={{
                                                            background: 'linear-gradient(135deg, #0ce6ac, #07b587)',
                                                            border: 'none', color: '#1A1A1A', fontWeight: 'bold'
                                                        }}
                                                    >
                                                        <i className='bx bx-cloud-light-rain'></i> {lang === 'vi' ? 'Truy cập Neon' : 'Open Neon DB'}
                                                    </button>
                                                </div>
                                            </div>
                                            <div style={{
                                                display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1fr)', gap: '1.5rem', marginTop: '1.5rem'
                                            }}>
                                                <div className="admin-table-wrapper">
                                                    <div className="admin-table-scroll">
                                                        <table className="admin-data-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Table Name</th>
                                                                    <th>Records</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {stats.tables.slice(0, Math.ceil(stats.tables.length / 2)).map((t, i) => (
                                                                    <tr key={i}>
                                                                        <td><code style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{t.name}</code></td>
                                                                        <td>{t.rows}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>

                                                <div className="admin-table-wrapper">
                                                    <div className="admin-table-scroll">
                                                        <table className="admin-data-table">
                                                            <thead>
                                                                <tr>
                                                                    <th>Table Name</th>
                                                                    <th>Records</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {stats.tables.slice(Math.ceil(stats.tables.length / 2)).map((t, i) => (
                                                                    <tr key={i}>
                                                                        <td><code style={{ color: 'var(--accent-color)', fontWeight: 600 }}>{t.name}</code></td>
                                                                        <td>{t.rows}</td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="admin-table-wrapper" style={{ padding: '2rem', textAlign: 'center' }}>
                                            <p style={{ color: 'var(--text-secondary)' }}>Loading database overview...</p>
                                        </div>
                                    )}

                                    {/* ═══ ER DIAGRAM SECTION ═══ */}
                                    <div style={{ marginTop: '2.5rem', padding: '1.5rem', background: 'var(--bg-card)', borderRadius: '12px', border: '1px solid var(--border-color)', position: 'relative' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                            <h3 style={{ color: 'var(--text-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
                                                <i className='bx bx-git-repo-forked' style={{ color: 'var(--accent-color)' }}></i>
                                                {lang === 'vi' ? 'Sơ đồ quan hệ Entity (ER Diagram)' : 'Entity Relationship Diagram'}
                                            </h3>
                                            <button
                                                className="admin-btn admin-btn-sm"
                                                onClick={() => setShowERDLightbox(true)}
                                            >
                                                <i className='bx bx-fullscreen'></i> {lang === 'vi' ? 'Phóng to' : 'Fullscreen'}
                                            </button>
                                        </div>
                                        <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: 1.6 }}>
                                            {lang === 'vi'
                                                ? 'Sơ đồ thu nhỏ. Nhấn Phóng to để tương tác đầy đủ.'
                                                : 'Mini diagram. Click Fullscreen for full interaction.'}
                                        </p>
                                        <div style={{ height: '400px', width: '100%', position: 'relative', borderRadius: '8px', overflow: 'hidden' }}>
                                            <ERDiagram lang={lang} isMini={true} onClick={() => setShowERDLightbox(true)} />
                                        </div>
                                    </div>
                                </>
                            )}
                        </section>
                    )}

                    {/* Section: Users */}
                    {activeSection === 'users' && (
                        <section className="admin-section">

                            <div className="admin-table-wrapper">
                                <div className="admin-table-header">
                                    <h3>User Records</h3>
                                    <button className="admin-btn admin-btn-sm" onClick={loadUsers}>
                                        <i className='bx bx-refresh'></i> Refresh
                                    </button>
                                </div>
                                <div className="admin-table-scroll" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                                    <table className="admin-data-table">
                                        <thead>
                                            <tr>
                                                <th>ID</th>
                                                <th>Username</th>
                                                <th>Email</th>
                                                <th>OAuth</th>
                                                <th>Roles</th>
                                                <th>Status</th>
                                                <th>Created At</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loadingData ? (
                                                <tr><td colSpan="7" className="admin-loading" style={{ textAlign: 'center', padding: '1.5rem' }}>Loading users...</td></tr>
                                            ) : users.length === 0 ? (
                                                <tr><td colSpan="7" className="admin-loading" style={{ textAlign: 'center', padding: '1.5rem' }}>No users found or error connecting to database.</td></tr>
                                            ) : (
                                                users.map(u => (
                                                    <tr key={u.id}>
                                                        <td>{u.id}</td>
                                                        <td>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                                <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>
                                                                    {u.username.charAt(0).toUpperCase()}
                                                                </div>
                                                                {u.username}
                                                            </div>
                                                        </td>
                                                        <td>{u.email}</td>
                                                        <td>{u.oauthProvider || '-'}</td>
                                                        <td>
                                                            {typeof u.roles === 'string'
                                                                ? u.roles.split(', ').filter(Boolean).map((r, i) => (
                                                                    <span key={i} className="admin-role-badge">{r}</span>
                                                                ))
                                                                : u.roles?.map(r => (
                                                                    <span key={r.id || r.name} className="admin-role-badge">{r.name || r}</span>
                                                                ))
                                                            }
                                                        </td>
                                                        <td>
                                                            <span className={`admin-status ${u.enabled !== false ? 'active' : 'locked'}`}>
                                                                {u.enabled !== false ? 'Active' : 'Locked'}
                                                            </span>
                                                        </td>
                                                        <td>{formatDate(u.createdAt)}</td>
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </section>
                    )}

                    {/* Section: Solutions */}
                    {activeSection === 'solutions' && (
                        <SolutionManager />
                    )}

                    {/* Section: Contacts */}
                    {activeSection === 'contacts' && (
                        <ContactManager />
                    )}

                    {/* Section: Blogs */}
                    {activeSection === 'blogs' && (
                        <BlogManager />
                    )}

                    {/* Section: Security */}
                    {activeSection === 'security' && (
                        <section className="admin-section">
                            <ErrorBoundary title="Security Dashboard Error" message="Could not load security dashboard. Please refresh.">
                                <SecurityDashboard />
                            </ErrorBoundary>
                        </section>
                    )}

                    {/* Section: AI Security Advisor */}
                    {activeSection === 'advisor' && (
                        <section className="admin-section">
                            <ErrorBoundary title="AI Advisor Error" message="Could not load AI Security Advisor. Please refresh.">
                                <SecurityAdvisor />
                            </ErrorBoundary>
                        </section>
                    )}

                    {/* Section: System Settings */}
                    {activeSection === 'settings' && (
                        <section className="admin-section">
                            <ErrorBoundary title="Settings Error" message="Could not load System Settings. Please refresh.">
                                <AdminSettings />
                            </ErrorBoundary>
                        </section>
                    )}
                </div>
            </main>
        </div >
    )
}
