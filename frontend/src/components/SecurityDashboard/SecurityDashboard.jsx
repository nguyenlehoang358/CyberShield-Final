import React, { useState, useEffect, useRef } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import './SecurityDashboard.css'

const ADMIN_SECURITY_PATH = '/admin/security'

const translations = {
    vi: {
        title: '🛡️ Bảo Mật & Brute Force Protection',
        subtitle: 'Giám sát an ninh hệ thống thời gian thực',
        statsTitle: 'Tổng quan bảo mật',
        failures24h: 'Tổng đăng nhập thất bại',
        successes24h: 'Tổng đăng nhập thành công',
        failures1h: 'Thất bại (1 giờ qua)',
        blockedIPs: 'IP đang bị chặn',
        topAttackers: 'Top IP tấn công (Toàn thời gian)',
        topTargets: 'Tài khoản bị nhắm (Toàn thời gian)',
        blockedIPsTitle: 'Danh sách IP bị chặn',
        loginLog: 'Nhật ký đăng nhập',
        ip: 'Địa chỉ IP',
        remaining: 'Thời gian còn lại',
        failures: 'Số lần thất bại',
        actions: 'Hành động',
        unblock: 'Bỏ chặn',
        blockManual: 'Chặn IP thủ công',
        blockBtn: 'Chặn',
        duration: 'Thời gian (phút)',
        search: 'Tìm theo IP hoặc tên...',
        username: 'Tên tài khoản',
        status: 'Trạng thái',
        reason: 'Lý do',
        time: 'Thời gian',
        userAgent: 'User Agent',
        success: 'Thành công',
        failed: 'Thất bại',
        noData: 'Chưa có dữ liệu',
        redisDown: 'Redis không khả dụng — Brute Force Protection tắt',
        refresh: 'Làm mới',
        prev: 'Trang trước',
        next: 'Trang sau',
        page: 'Trang',
        captcha: 'CAPTCHA',
        count: 'Số lần',
        loading: 'Đang tải...',
        socTitle: '🤖 SOC AI Assistant',
        socPlaceholder: 'Nhập lệnh SOC (VD: "Phân tích các IP" hoặc "Chặn IP 1.2.3.4")...',
        socSend: 'Gửi',
        socThinking: 'SOC AI đang phân tích...',
        socWelcome: '🛡️ SOC AI Assistant sẵn sàng. Nhập lệnh để phân tích bảo mật hoặc chặn IP.',
    },
    en: {
        title: '🛡️ Security & Brute Force Protection',
        subtitle: 'Real-time system security monitoring',
        statsTitle: 'Security Overview',
        failures24h: 'Total Failed Logins',
        successes24h: 'Total Successful Logins',
        failures1h: 'Failures (last 1h)',
        blockedIPs: 'Blocked IPs',
        topAttackers: 'Top Attacking IPs (All-time)',
        topTargets: 'Targeted Accounts (All-time)',
        blockedIPsTitle: 'Blocked IP List',
        loginLog: 'Login Attempts Log',
        ip: 'IP Address',
        remaining: 'Time Remaining',
        failures: 'Failure Count',
        actions: 'Actions',
        unblock: 'Unblock',
        blockManual: 'Manually Block IP',
        blockBtn: 'Block',
        duration: 'Duration (min)',
        search: 'Search by IP or username...',
        username: 'Username',
        status: 'Status',
        reason: 'Reason',
        time: 'Time',
        userAgent: 'User Agent',
        success: 'Success',
        failed: 'Failed',
        noData: 'No data available',
        redisDown: 'Redis unavailable — Brute Force Protection disabled',
        refresh: 'Refresh',
        prev: 'Previous',
        next: 'Next',
        page: 'Page',
        captcha: 'CAPTCHA',
        count: 'Count',
        loading: 'Loading...',
        errorLoading: 'Failed to load security data.',
        socTitle: '🤖 SOC AI Assistant',
        socPlaceholder: 'Enter SOC command (e.g. "Analyze IPs" or "Block IP 1.2.3.4")...',
        socSend: 'Send',
        socThinking: 'SOC AI is analyzing...',
        socWelcome: '🛡️ SOC AI Assistant ready. Enter a command to analyze security or block IPs.',
    }
}

export default function SecurityDashboard() {
    const { lang } = useLanguage()
    const { api } = useAuth()
    const t = translations[lang] || translations.vi

    const [stats, setStats] = useState(null)
    const [blockedIPs, setBlockedIPs] = useState({ content: [], totalPages: 0, currentPage: 0 })
    const [loginAttempts, setLoginAttempts] = useState({ content: [], totalPages: 0, currentPage: 0 })
    const [searchQuery, setSearchQuery] = useState('')
    const [loading, setLoading] = useState(true)
    const [fetchError, setFetchError] = useState(null)
    const [blockIp, setBlockIp] = useState('')
    const [blockDuration, setBlockDuration] = useState(60)
    const [activeTab, setActiveTab] = useState('overview') // overview | blocked | logs

    // SOC AI Chatbox state
    const [socMessages, setSocMessages] = useState([])
    const [socInput, setSocInput] = useState('')
    const [socLoading, setSocLoading] = useState(false)
    const socEndRef = useRef(null)

    const fetchStats = async () => {
        try {
            const res = await api.get(`${ADMIN_SECURITY_PATH}/stats`, {
                headers: { 'ngrok-skip-browser-warning': 'true', 'bypass-tunnel-reminder': 'true' }
            })
            setStats(res.data)
        } catch (e) {
            console.error('Stats error:', e.response?.data || e.message)
            throw e
        }
    }

    const fetchBlockedIPs = async (page = 0) => {
        try {
            const res = await api.get(`${ADMIN_SECURITY_PATH}/blocked-ips?page=${page}&size=15`, {
                headers: { 'ngrok-skip-browser-warning': 'true', 'bypass-tunnel-reminder': 'true' }
            })
            setBlockedIPs(res.data)
        } catch (e) {
            console.error('Blocked IPs error:', e.response?.data || e.message)
            throw e
        }
    }

    const fetchLoginAttempts = async (page = 0) => {
        try {
            const url = searchQuery
                ? `${ADMIN_SECURITY_PATH}/login-attempts/search?q=${encodeURIComponent(searchQuery)}&page=${page}&size=15`
                : `${ADMIN_SECURITY_PATH}/login-attempts?page=${page}&size=15`
            const res = await api.get(url, {
                headers: { 'ngrok-skip-browser-warning': 'true', 'bypass-tunnel-reminder': 'true' }
            })
            setLoginAttempts(res.data)
        } catch (e) {
            console.error('Login attempts error:', e.response?.data || e.message)
            throw e
        }
    }

    const refreshAll = async () => {
        setLoading(true)
        setFetchError(null)
        try {
            await Promise.all([fetchStats(), fetchBlockedIPs(), fetchLoginAttempts()])
        } catch (e) {
            setFetchError(e.message)
        } finally {
            setLoading(false)
        }
    }

    // Initial load (once on mount)
    useEffect(() => {
        refreshAll()
    }, [])

    // Stable polling interval — 30s
    useEffect(() => {
        const interval = setInterval(() => {
            fetchStats().catch(() => { })
            fetchBlockedIPs().catch(() => { })
            fetchLoginAttempts().catch(() => { })
        }, 30000)
        return () => clearInterval(interval)
    }, [])

    const handleUnblock = async (ip) => {
        if (!window.confirm(`Unblock IP: ${ip}?`)) return
        try {
            await api.delete(`${ADMIN_SECURITY_PATH}/unblock/${ip}`, {
                headers: { 'ngrok-skip-browser-warning': 'true', 'bypass-tunnel-reminder': 'true' }
            })
            refreshAll()
        } catch (e) {
            console.error('Unblock error:', e.response?.data || e.message)
        }
    }

    const handleManualBlock = async (e) => {
        e.preventDefault()
        if (!blockIp.trim()) return
        try {
            await api.post(`${ADMIN_SECURITY_PATH}/block-ip`, { ip: blockIp, durationMinutes: blockDuration }, {
                headers: { 'ngrok-skip-browser-warning': 'true', 'bypass-tunnel-reminder': 'true' }
            })
            setBlockIp('')
            refreshAll()
        } catch (e) {
            console.error('Block error:', e.response?.data || e.message)
        }
    }

    // SOC AI Chat handler
    const handleSocSend = async (e) => {
        e?.preventDefault()
        const cmd = socInput.trim()
        if (!cmd || socLoading) return

        // Add user message
        setSocMessages(prev => [...prev, { role: 'user', content: cmd, time: new Date() }])
        setSocInput('')
        setSocLoading(true)

        try {
            const res = await api.post(`${ADMIN_SECURITY_PATH}/ai-chat`, { command: cmd }, {
                headers: { 'ngrok-skip-browser-warning': 'true', 'bypass-tunnel-reminder': 'true' }
            })
            const data = res.data

            setSocMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response || 'Không có phản hồi.',
                type: data.type,
                action: data.action,
                targetIp: data.targetIp,
                responseTimeMs: data.responseTimeMs,
                time: new Date()
            }])

            // If the AI blocked an IP, refresh the tables
            if (data.type === 'action') {
                refreshAll()
            }
        } catch (err) {
            setSocMessages(prev => [...prev, {
                role: 'assistant',
                content: `❌ Lỗi: ${err.response?.data?.error || err.message}`,
                type: 'error',
                time: new Date()
            }])
        } finally {
            setSocLoading(false)
        }
    }

    // Auto-scroll SOC chat
    useEffect(() => {
        socEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [socMessages, socLoading])

    const formatRemaining = (seconds) => {
        if (seconds < 0) return '∞'
        if (seconds >= 3600) return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
        if (seconds >= 60) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
        return `${seconds}s`
    }

    const formatTime = (iso) => {
        if (!iso) return '-'
        return new Date(iso).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'
        })
    }

    if (loading && !stats && !fetchError) {
        return <div className="sec-dashboard sec-loading"><div className="sec-spinner" /><p>{t.loading}</p></div>
    }

    if (fetchError && !stats) {
        return (
            <div className="sec-dashboard sec-loading" style={{ color: 'var(--lab-red)' }}>
                <div className="sec-stat-icon" style={{ marginBottom: '1rem' }}>⚠️</div>
                <p>{t.errorLoading}</p>
                <button className="sec-btn sec-btn--outline" style={{ marginTop: '1rem' }} onClick={refreshAll}>{t.refresh}</button>
            </div>
        )
    }

    return (
        <div className="sec-dashboard">
            {/* Header */}
            <div className="sec-header">
                <div>
                    <h2 className="sec-title">{t.title}</h2>
                    <p className="sec-subtitle">{t.subtitle}</p>
                </div>
                <button className="sec-refresh-btn" onClick={refreshAll} disabled={loading}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
                        <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" />
                    </svg>
                    {t.refresh}
                </button>
            </div>

            {/* Redis Warning */}
            {stats && !stats.redisAvailable && (
                <div className="sec-alert sec-alert--warning">
                    ⚠️ {t.redisDown}
                </div>
            )}

            {/* Tabs */}
            <div className="sec-tabs">
                {['overview', 'blocked', 'logs'].map(tab => (
                    <button
                        key={tab}
                        className={`sec-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}
                    >
                        {tab === 'overview' && '📊'} {tab === 'blocked' && '🚫'} {tab === 'logs' && '📋'}
                        {tab === 'overview' ? t.statsTitle : tab === 'blocked' ? t.blockedIPsTitle : t.loginLog}
                        {tab === 'blocked' && blockedIPs.content?.length > 0 && (
                            <span className="sec-tab-badge">{blockedIPs.totalElements || blockedIPs.content.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* ═══ OVERVIEW TAB ═══ */}
            {activeTab === 'overview' && stats && (
                <div className="sec-overview">
                    {/* Stats Cards */}
                    <div className="sec-stats-grid">
                        <div className="sec-stat-card sec-stat--danger">
                            <div className="sec-stat-icon">🚨</div>
                            <div className="sec-stat-info">
                                <span className="sec-stat-value">{stats.totalFailures || 0}</span>
                                <span className="sec-stat-label">{t.failures24h}</span>
                            </div>
                        </div>
                        <div className="sec-stat-card sec-stat--success">
                            <div className="sec-stat-icon">✅</div>
                            <div className="sec-stat-info">
                                <span className="sec-stat-value">{stats.totalSuccesses || 0}</span>
                                <span className="sec-stat-label">{t.successes24h}</span>
                            </div>
                        </div>
                        <div className="sec-stat-card sec-stat--warning">
                            <div className="sec-stat-icon">⏱️</div>
                            <div className="sec-stat-info">
                                <span className="sec-stat-value">{stats.failures1h || 0}</span>
                                <span className="sec-stat-label">{t.failures1h}</span>
                            </div>
                        </div>
                        <div className="sec-stat-card sec-stat--info">
                            <div className="sec-stat-icon">🔒</div>
                            <div className="sec-stat-info">
                                <span className="sec-stat-value">{stats.blockedIPsCount || 0}</span>
                                <span className="sec-stat-label">{t.blockedIPs}</span>
                            </div>
                        </div>
                    </div>

                    {/* Top Attackers + Targets */}
                    <div className="sec-analytics-grid">
                        <div className="sec-analytics-card">
                            <h4 className="sec-analytics-title">🎯 {t.topAttackers}</h4>
                            {stats.topAttackingIPs?.length > 0 ? (
                                <div className="sec-analytics-list">
                                    {stats.topAttackingIPs.map((item, i) => (
                                        <div key={i} className="sec-analytics-item">
                                            <span className="sec-rank">#{i + 1}</span>
                                            <span className="sec-analytics-ip">{item.ip}</span>
                                            <span className="sec-analytics-count">{item.count} {t.count}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="sec-no-data">{t.noData}</p>}
                        </div>

                        <div className="sec-analytics-card">
                            <h4 className="sec-analytics-title">👤 {t.topTargets}</h4>
                            {stats.topTargetedUsers?.length > 0 ? (
                                <div className="sec-analytics-list">
                                    {stats.topTargetedUsers.map((item, i) => (
                                        <div key={i} className="sec-analytics-item">
                                            <span className="sec-rank">#{i + 1}</span>
                                            <span className="sec-analytics-ip">{item.username}</span>
                                            <span className="sec-analytics-count">{item.count} {t.count}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : <p className="sec-no-data">{t.noData}</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══ BLOCKED IPs TAB ═══ */}
            {activeTab === 'blocked' && (
                <div className="sec-blocked">
                    {/* Manual Block Form */}
                    <form className="sec-block-form" onSubmit={handleManualBlock}>
                        <h4>🔒 {t.blockManual}</h4>
                        <div className="sec-block-inputs">
                            <input
                                type="text"
                                placeholder={t.ip}
                                value={blockIp}
                                onChange={e => setBlockIp(e.target.value)}
                                className="sec-input"
                                required
                            />
                            <input
                                type="number"
                                placeholder={t.duration}
                                value={blockDuration}
                                onChange={e => setBlockDuration(parseInt(e.target.value) || 60)}
                                className="sec-input sec-input--small"
                                min="1"
                            />
                            <button type="submit" className="sec-btn sec-btn--danger">{t.blockBtn}</button>
                        </div>
                    </form>

                    {/* ═══ SOC AI ASSISTANT CHATBOX ═══ */}
                    <div className="soc-chatbox">
                        <div className="soc-header">
                            <span className="soc-header-icon">🤖</span>
                            <span className="soc-header-title">{t.socTitle}</span>
                            <span className="soc-header-status">{socLoading ? '🔄' : '🟢'}</span>
                        </div>
                        <div className="soc-messages">
                            {socMessages.length === 0 && (
                                <div className="soc-welcome">{t.socWelcome}</div>
                            )}
                            {socMessages.map((msg, i) => (
                                <div key={i} className={`soc-msg soc-msg--${msg.role}`}>
                                    <div className="soc-msg-header">
                                        <span className="soc-msg-role">
                                            {msg.role === 'user' ? '👤 Admin' : '🤖 SOC AI'}
                                        </span>
                                        <span className="soc-msg-time">
                                            {msg.time?.toLocaleTimeString()}
                                        </span>
                                    </div>
                                    <div className="soc-msg-content">
                                        {msg.type === 'action' && (
                                            <span className="sec-badge sec-badge--success" style={{ marginBottom: 6, display: 'inline-block' }}>⚡ ACTION</span>
                                        )}
                                        {msg.content.split('\n').map((line, j) => (
                                            <span key={j}>
                                                {line.replace(/\*\*(.*?)\*\*/g, '$1').replace(/`(.*?)`/g, '$1')}
                                                <br />
                                            </span>
                                        ))}
                                    </div>
                                    {msg.responseTimeMs && (
                                        <div className="soc-msg-meta">⏱️ {msg.responseTimeMs}ms</div>
                                    )}
                                </div>
                            ))}
                            {socLoading && (
                                <div className="soc-msg soc-msg--assistant">
                                    <div className="soc-msg-content soc-thinking">
                                        <div className="soc-dots"><span /><span /><span /></div>
                                        {t.socThinking}
                                    </div>
                                </div>
                            )}
                            <div ref={socEndRef} />
                        </div>
                        <form className="soc-input-bar" onSubmit={handleSocSend}>
                            <input
                                type="text"
                                value={socInput}
                                onChange={e => setSocInput(e.target.value)}
                                placeholder={t.socPlaceholder}
                                className="soc-input"
                                disabled={socLoading}
                            />
                            <button type="submit" className="soc-send-btn" disabled={socLoading || !socInput.trim()}>
                                {socLoading ? '⏳' : '▶'} {t.socSend}
                            </button>
                        </form>
                    </div>

                    {/* Blocked IPs Table */}
                    {blockedIPs.content?.length > 0 ? (
                        <>
                            <div className="sec-table-wrapper">
                                <table className="sec-table">
                                    <thead>
                                        <tr>
                                            <th>{t.time}</th>
                                            <th>{t.ip}</th>
                                            <th>{t.reason}</th>
                                            <th>{t.actions}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {blockedIPs.content.map((item, i) => (
                                            <tr key={i}>
                                                <td className="sec-time-cell">{formatTime(item.createdAt)}</td>
                                                <td className="sec-ip-cell">{item.ipAddress}</td>
                                                <td>
                                                    {(() => {
                                                        const isUnblocked = item.reason && item.reason.includes('_UNBLOCKED');
                                                        const orgReason = item.reason ? item.reason.replace('_UNBLOCKED', '') : '';

                                                        return (
                                                            <>
                                                                {orgReason === 'AI_AUTO_BLOCKED'
                                                                    ? <span className={`sec-badge ${isUnblocked ? 'sec-badge--muted' : 'sec-badge--danger'}`}>🤖 AI Auto-Blocked</span>
                                                                    : orgReason === 'MANUAL_ADMIN'
                                                                        ? <span className={`sec-badge ${isUnblocked ? 'sec-badge--muted' : 'sec-badge--warning'}`}>👤 {t.blockManual}</span>
                                                                        : <span className={`sec-badge ${isUnblocked ? 'sec-badge--muted' : 'sec-badge--danger'}`}>{orgReason}</span>}
                                                                {isUnblocked && <span className="sec-badge sec-badge--success" style={{ marginLeft: 8 }}>✅ Đã bỏ chặn</span>}
                                                            </>
                                                        )
                                                    })()}
                                                </td>
                                                <td>
                                                    {(!item.reason || !item.reason.includes('_UNBLOCKED')) && (
                                                        <button className="sec-btn sec-btn--success sec-btn--sm" onClick={() => handleUnblock(item.ipAddress)}>
                                                            🔓 {t.unblock}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination for Blocked IPs */}
                            <div className="sec-pagination">
                                <button
                                    className="sec-btn sec-btn--outline"
                                    disabled={blockedIPs.currentPage === 0}
                                    onClick={() => fetchBlockedIPs(blockedIPs.currentPage - 1)}
                                >
                                    ← {t.prev}
                                </button>
                                <span className="sec-page-info">
                                    {t.page} {blockedIPs.currentPage + 1} / {blockedIPs.totalPages || 1}
                                </span>
                                <button
                                    className="sec-btn sec-btn--outline"
                                    disabled={blockedIPs.currentPage >= blockedIPs.totalPages - 1}
                                    onClick={() => fetchBlockedIPs(blockedIPs.currentPage + 1)}
                                >
                                    {t.next} →
                                </button>
                            </div>
                        </>
                    ) : <p className="sec-no-data">{t.noData}</p>}
                </div>
            )}

            {/* ═══ LOGIN LOGS TAB ═══ */}
            {activeTab === 'logs' && (
                <div className="sec-logs">
                    {/* Search */}
                    <div className="sec-search-bar">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                        <input
                            type="text"
                            placeholder={t.search}
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && fetchLoginAttempts(0)}
                            className="sec-search-input"
                        />
                    </div>

                    {/* Login Attempts Table */}
                    {loginAttempts.content?.length > 0 ? (
                        <>
                            <div className="sec-table-wrapper">
                                <table className="sec-table">
                                    <thead>
                                        <tr>
                                            <th>{t.time}</th>
                                            <th>{t.ip}</th>
                                            <th>{t.username}</th>
                                            <th>{t.status}</th>
                                            <th>{t.reason}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {loginAttempts.content.map((attempt, i) => (
                                            <tr key={i} className={attempt.success ? '' : 'sec-row--fail'}>
                                                <td className="sec-time-cell">{formatTime(attempt.createdAt)}</td>
                                                <td className="sec-ip-cell">{attempt.ipAddress}</td>
                                                <td>{attempt.username || '-'}</td>
                                                <td>
                                                    {attempt.success
                                                        ? <span className="sec-badge sec-badge--success">{t.success}</span>
                                                        : <span className="sec-badge sec-badge--danger">{t.failed}</span>}
                                                </td>
                                                <td className="sec-reason-cell">{attempt.failureReason || '-'}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="sec-pagination">
                                <button
                                    className="sec-btn sec-btn--outline"
                                    disabled={loginAttempts.currentPage === 0}
                                    onClick={() => fetchLoginAttempts(loginAttempts.currentPage - 1)}
                                >
                                    ← {t.prev}
                                </button>
                                <span className="sec-page-info">
                                    {t.page} {loginAttempts.currentPage + 1} / {loginAttempts.totalPages || 1}
                                </span>
                                <button
                                    className="sec-btn sec-btn--outline"
                                    disabled={loginAttempts.currentPage >= loginAttempts.totalPages - 1}
                                    onClick={() => fetchLoginAttempts(loginAttempts.currentPage + 1)}
                                >
                                    {t.next} →
                                </button>
                            </div>
                        </>
                    ) : <p className="sec-no-data">{t.noData}</p>}
                </div>
            )}
        </div>
    )
}
