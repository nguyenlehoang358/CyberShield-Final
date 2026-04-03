import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
    const { user, logout } = useAuth()
    const { lang, setLang, toggleLang, t } = useLanguage()
    const { isDark, toggleTheme } = useTheme()
    const [mobileOpen, setMobileOpen] = useState(false)
    const location = useLocation()

    const isActive = (path) => location.pathname === path ? 'active' : ''

    return (
        <nav className="navbar" id="main-navbar">
            <div className="nav-container">
                <Link to="/" className="logo">CyberShield</Link>
                <ul className={`nav-links${mobileOpen ? ' open' : ''}`} id="nav-links">
                    <li><Link to="/" className={isActive('/')} onClick={() => setMobileOpen(false)}>{t('nav_products')}</Link></li>
                    <li>
                        <Link to="/about" className={isActive('/about')} onClick={() => setMobileOpen(false)}>{t('nav_about')}</Link>
                    </li>
                    <li><Link to="/contact" className={isActive('/contact')} onClick={() => setMobileOpen(false)}>{t('nav_contact')}</Link></li>
                    <li><Link to="/lab" className={isActive('/lab')} onClick={() => setMobileOpen(false)}>{t('nav_lab')}</Link></li>
                    <li><Link to="/blog" className={isActive('/blog')} onClick={() => setMobileOpen(false)}>{t('nav_news')}</Link></li>

                    {/* Theme Toggle */}
                    <li>
                        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
                            {isDark ? <i className='bx bx-sun'></i> : <i className='bx bx-moon'></i>}
                        </button>
                    </li>

                    {/* Language Dropdown */}
                    <li className="user-menu lang-menu">
                        <button className="lang-toggle" onClick={() => {}} aria-label="Toggle language" id="lang-toggle-btn">
                            <span className="lang-icon">🌐</span>
                            {lang.toUpperCase()} <i className='bx bx-chevron-down'></i>
                        </button>
                        <div className="user-menu-content lang-menu-content">
                            <a href="#" onClick={(e) => { e.preventDefault(); setLang('vi'); setMobileOpen(false); }}>🇻🇳 Tiếng Việt</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); setLang('en'); setMobileOpen(false); }}>EN English</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); setLang('ja'); setMobileOpen(false); }}>🇯🇵 日本語</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); setLang('ko'); setMobileOpen(false); }}>🇰🇷 한국어</a>
                            <a href="#" onClick={(e) => { e.preventDefault(); setLang('zh'); setMobileOpen(false); }}>🇨🇳 中文</a>
                        </div>
                    </li>

                    {user ? (
                        <li className="user-menu">
                            <span className="user-badge">{user.username} <i className='bx bx-user'></i></span>
                            <div className="user-menu-content">
                                <Link to="/profile" onClick={() => setMobileOpen(false)}>{t('nav_profile') || 'Trang cá nhân'}</Link>
                                <Link
                                    to={
                                        user.roles?.includes('ROLE_ADMIN') ? '/dashboard'
                                        : user.roles?.includes('ROLE_MODERATOR') ? '/moderator'
                                        : '/profile'
                                    }
                                    onClick={() => setMobileOpen(false)}
                                >{t('nav_dashboard')}</Link>
                                <a href="#" onClick={(e) => { e.preventDefault(); logout(); setMobileOpen(false); }}>{t('nav_logout')}</a>
                            </div>
                        </li>
                    ) : (
                        <li><Link to="/login" className="btn-login" onClick={() => setMobileOpen(false)}>{t('nav_login')}</Link></li>
                    )}
                </ul>
                <button
                    className="nav-toggle"
                    aria-label="Menu"
                    onClick={() => setMobileOpen(!mobileOpen)}
                    id="nav-toggle-btn"
                >
                    <i className={mobileOpen ? 'bx bx-x' : 'bx bx-menu'}></i>
                </button>
            </div>
        </nav>
    )
}
