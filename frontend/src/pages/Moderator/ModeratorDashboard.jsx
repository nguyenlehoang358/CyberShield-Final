import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import { Mail, CheckCircle, Clock } from 'lucide-react';
import BlogManager from '../Admin/BlogManager';
import ContactManager from '../Admin/ContactManager';
import SimplePieChart from '../../components/Admin/SimplePieChart';
import '../../styles/admin-dashboard.css';
import '../../styles/lab.css';
import './moderator.css';

export default function ModeratorDashboard() {
    const { api, user, logout } = useAuth();
    const { lang } = useLanguage();
    const { isDark, toggleTheme } = useTheme();
    const navigate = useNavigate();

    const [activeSection, setActiveSection] = useState('overview');
    
    const [stats, setStats] = useState({
        contacts: { total: 0, unread: 0, read: 0 },
        blogs: { total: 0, published: 0, draft: 0 },
        security: { blocked: 0, safe: 100 }
    });

    useEffect(() => {
        if (activeSection === 'overview') {
            const loadModStats = async () => {
                try {
                    const [contactsRes, blogsRes] = await Promise.all([
                        api.get('/contacts').catch(() => ({ data: [] })),
                        api.get('/blogs?page=0&size=100&all=true').catch(() => ({ data: [] }))
                    ]);
                    
                    const contactsData = contactsRes.data || [];
                    const blogsData = blogsRes.data?.content || blogsRes.data || [];
                    
                    const unread = contactsData.filter(c => !c.isRead).length;
                    const published = blogsData.filter(b => b.published).length;
                    
                    setStats({
                        contacts: { total: contactsData.length, unread, read: contactsData.length - unread },
                        blogs: { total: blogsData.length, published, draft: blogsData.length - published },
                        security: { blocked: 0, safe: 100 }
                    });
                } catch (err) {
                    console.error('Failed to load moderator stats', err);
                }
            };
            loadModStats();
        }
    }, [activeSection, api]);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className={`admin-dashboard lab-hub`}>
            <aside className="admin-sidebar">
                <div className="admin-sidebar-header">
                    <div>
                        <Link to="/" className="admin-logo">CyberShield</Link>
                        <span className="admin-badge" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', border: 'none', marginLeft: '8px' }}>Moderator Pro</span>
                    </div>
                </div>
                <nav className="admin-sidebar-nav">
                    <button
                        className={`admin-nav-item ${activeSection === 'overview' ? 'active' : ''}`}
                        onClick={() => setActiveSection('overview')}
                    >
                        <i className='bx bx-grid-alt'></i>
                        <span>{lang === 'vi' ? 'Tổng quan' : 'Overview'}</span>
                    </button>
                    <button
                        className={`admin-nav-item ${activeSection === 'contacts' ? 'active' : ''}`}
                        onClick={() => setActiveSection('contacts')}
                    >
                        <i className='bx bx-envelope'></i>
                        <span>{lang === 'vi' ? 'Phản hồi (Contacts)' : 'Contacts'}</span>
                    </button>
                    <button
                        className={`admin-nav-item ${activeSection === 'blogs' ? 'active' : ''}`}
                        onClick={() => setActiveSection('blogs')}
                    >
                        <i className='bx bx-news'></i>
                        <span>{lang === 'vi' ? 'Tin tức (Blogs)' : 'Blogs'}</span>
                    </button>
                </nav>
                <div className="admin-sidebar-footer">
                    <Link to="/" className="admin-nav-item">
                        <i className='bx bx-home'></i>
                        <span>{lang === 'vi' ? 'Trang chủ' : 'Home'}</span>
                    </Link>
                    <button className="admin-nav-item" onClick={handleLogout}>
                        <i className='bx bx-log-out'></i>
                        <span>{lang === 'vi' ? 'Đăng xuất' : 'Logout'}</span>
                    </button>
                </div>
            </aside>

            <main className="admin-main">
                <header className="admin-header">
                    <div className="admin-header-left">
                        <h1 className="admin-page-title" style={{ marginBottom: 0, fontSize: '1.8rem', color: 'var(--text-primary)' }}>
                            {activeSection === 'overview' && (lang === 'vi' ? 'Tổng quan Moderator' : 'Moderator Overview')}
                            {activeSection === 'contacts' && (lang === 'vi' ? 'Quản lý Liên hệ' : 'Contact Management')}
                            {activeSection === 'blogs' && (lang === 'vi' ? 'Quản lý Tin tức' : 'Blog Management')}
                        </h1>
                    </div>

                    <div className="admin-header-actions">
                        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme" style={{ padding: '0.4rem', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '36px', height: '36px', color: 'var(--text-primary)', transition: 'all 0.3s' }}>
                            {isDark ? <i className='bx bx-sun'></i> : <i className='bx bx-moon'></i>}
                        </button>
                        <span className="admin-user-info" style={{ fontWeight: 'bold', color: 'var(--text-primary)', backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 12px', borderRadius: '8px' }}>
                            <i className='bx bx-user-circle'></i> {user?.username}
                            <span className="admin-badge" style={{ background: 'rgba(139, 92, 246, 0.2)', color: '#a78bfa', border: 'none', marginLeft: '8px' }}>MODERATOR</span>
                        </span>
                    </div>
                </header>

                <div className="admin-content" style={{ padding: '2rem' }}>
                    {activeSection === 'overview' && (
                        <div style={{ animation: 'chartFadeIn 0.4s ease-out forwards' }}>
                            <div className="mod-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem', marginBottom: '2rem' }}>
                                <div className="stat-card" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center', transition: 'all 0.3s' }}>
                                    <div className="stat-icon" style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', borderRadius: '50%', marginBottom: '1rem' }}><Mail size={32} /></div>
                                    <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{stats.contacts.total}</div>
                                    <div className="stat-label" style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Tổng tin nhắn</div>
                                </div>
                                <div className="stat-card stat-card--unread" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center', transition: 'all 0.3s' }}>
                                    <div className="stat-icon" style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(139, 92, 246, 0.1)', color: '#8b5cf6', borderRadius: '50%', marginBottom: '1rem' }}><i className='bx bx-news' style={{ fontSize: '32px' }}></i></div>
                                    <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{stats.blogs.total}</div>
                                    <div className="stat-label" style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Tổng bài viết</div>
                                </div>
                                <div className="stat-card stat-card--replied" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '1.5rem', textAlign: 'center', transition: 'all 0.3s' }}>
                                    <div className="stat-icon" style={{ display: 'inline-flex', padding: '1rem', background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderRadius: '50%', marginBottom: '1rem' }}><CheckCircle size={32} /></div>
                                    <div className="stat-value" style={{ fontSize: '2.5rem', fontWeight: '800', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>100%</div>
                                    <div className="stat-label" style={{ color: 'var(--text-secondary)', fontWeight: '600' }}>Hệ thống Online</div>
                                </div>
                            </div>

                            <div className="admin-chart-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                <SimplePieChart
                                    title={lang === 'vi' ? 'Liên hệ khách hàng (Contacts)' : 'Contact Messages'}
                                    titleColor="var(--text-primary)"
                                    data={[
                                        { label: 'Unread', value: stats.contacts.unread, color: '#ff0055' },
                                        { label: 'Read', value: stats.contacts.read, color: '#00e5ff' }
                                    ]}
                                />
                                <SimplePieChart
                                    title={lang === 'vi' ? 'Bài viết & Tin tức (Blogs)' : 'Blogs & News'}
                                    titleColor="var(--text-primary)"
                                    data={[
                                        { label: 'Published', value: stats.blogs.published, color: '#00e5ff' },
                                        { label: 'Drafts', value: stats.blogs.draft, color: '#facc15' }
                                    ]}
                                />
                                <SimplePieChart
                                    title={lang === 'vi' ? 'Trạng thái Hệ thống (System)' : 'System Status'}
                                    titleColor="var(--text-primary)"
                                    data={[
                                        { label: lang === 'vi' ? 'Hoạt động an toàn' : 'Safe Operation', value: stats.security.safe, color: '#39ff14' },
                                        { label: lang === 'vi' ? 'Cảnh báo lỗi' : 'Error Alerts', value: stats.security.blocked, color: '#ff0055' }
                                    ]}
                                />
                            </div>
                        </div>
                    )}

                    {activeSection === 'contacts' && (
                        <ContactManager />
                    )}

                    {activeSection === 'blogs' && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '16px', padding: '1.5rem', minHeight: '60vh' }}>
                             {/* Thêm BlogManager vào đây */}
                             <BlogManager />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

