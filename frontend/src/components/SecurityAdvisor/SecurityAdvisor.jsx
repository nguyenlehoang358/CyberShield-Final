import React, { useState, useEffect, useCallback } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useAuth } from '../../context/AuthContext'
import './SecurityAdvisor.css'

const translations = {
    vi: {
        title: 'AI Security Advisor',
        subtitle: 'Phân tích mối đe dọa bằng AI',
        tabOverview: 'Tổng quan',
        tabEvents: 'Sự kiện',
        tabReport: 'Báo cáo AI',
        riskScore: 'Điểm rủi ro',
        totalEvents: 'Tổng sự kiện',
        unresolved: 'Chưa xử lý',
        critical: 'Nghiêm trọng',
        high: 'Cao',
        eventsLastHour: 'Sự kiện (1h)',
        events24h: 'Tổng sự kiện',
        severity: 'Mức độ',
        eventType: 'Loại sự kiện',
        sourceIp: 'IP nguồn',
        description: 'Mô tả',
        time: 'Thời gian',
        status: 'Trạng thái',
        resolved: 'Đã xử lý',
        pending: 'Chờ xử lý',
        resolve: 'Xử lý',
        analyze: 'Phân tích AI',
        generateReport: 'Tạo báo cáo AI',
        generating: 'Đang phân tích...',
        refresh: 'Làm mới',
        topAttackers: 'Top IP tấn công',
        severityDist: 'Phân bổ mức độ',
        eventTypeDist: 'Phân loại sự kiện (Toàn thời gian)',
        logEvent: 'Ghi sự kiện',
        safe: 'An toàn',
        warning: 'Cảnh báo',
        danger: 'Nguy hiểm',
        criticalAlert: 'Nghiêm trọng',
        analyzeIp: 'Phân tích IP',
        noEvents: 'Chưa có sự kiện bảo mật nào.',
        responseTime: 'Thời gian phản hồi',
        fallbackNote: 'Phân tích tự động (rule-based). Kết nối Ollama để phân tích AI.',
    },
    en: {
        title: 'AI Security Advisor',
        subtitle: 'AI-powered Threat Analysis',
        tabOverview: 'Overview',
        tabEvents: 'Events',
        tabReport: 'AI Report',
        riskScore: 'Risk Score',
        totalEvents: 'Total Events',
        unresolved: 'Unresolved',
        critical: 'Critical',
        high: 'High',
        eventsLastHour: 'Events (1h)',
        events24h: 'Total Events',
        severity: 'Severity',
        eventType: 'Event Type',
        sourceIp: 'Source IP',
        description: 'Description',
        time: 'Time',
        status: 'Status',
        resolved: 'Resolved',
        pending: 'Pending',
        resolve: 'Resolve',
        analyze: 'AI Analyze',
        generateReport: 'Generate AI Report',
        generating: 'Analyzing...',
        refresh: 'Refresh',
        topAttackers: 'Top Attacking IPs',
        severityDist: 'Severity Distribution',
        eventTypeDist: 'Event Types (All-time)',
        logEvent: 'Log Event',
        safe: 'Safe',
        warning: 'Warning',
        danger: 'Danger',
        criticalAlert: 'Critical',
        analyzeIp: 'Analyze IP',
        noEvents: 'No security events found.',
        responseTime: 'Response time',
        fallbackNote: 'Rule-based analysis. Connect Ollama for AI analysis.',
    }
}

const severityConfig = {
    CRITICAL: { emoji: '🔴', color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
    HIGH: { emoji: '🟠', color: '#f97316', bg: 'rgba(249,115,22,0.12)' },
    MEDIUM: { emoji: '🟡', color: '#eab308', bg: 'rgba(234,179,8,0.12)' },
    LOW: { emoji: '🟢', color: '#22c55e', bg: 'rgba(34,197,94,0.12)' },
}

function renderMarkdownSimple(text) {
    if (!text) return null
    // Handle object (e.g., JSONB from DB) — extract meaningful text
    let str = text
    if (typeof text === 'object') {
        str = text.analysis || text.summary || text.result || text.message || JSON.stringify(text, null, 2)
    }
    if (typeof str !== 'string') str = String(str)
    return str.split('\n').map((line, i) => {
        let formatted = line
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/`([^`]+)`/g, '<code>$1</code>')
        if (line.trim() === '') return <div key={i} style={{ height: 6 }} />
        if (line.trim().startsWith('- ') || line.trim().startsWith('• '))
            return <div key={i} className="sa-list-item" dangerouslySetInnerHTML={{ __html: '• ' + formatted.replace(/^[-•]\s*/, '') }} />
        if (/^\d+[.)]\s/.test(line.trim()))
            return <div key={i} className="sa-list-item sa-list-numbered" dangerouslySetInnerHTML={{ __html: formatted }} />
        return <div key={i} dangerouslySetInnerHTML={{ __html: formatted }} />
    })
}

export default function SecurityAdvisor() {
    const { language } = useLanguage()
    const { api } = useAuth()
    const t = translations[language] || translations.vi

    const [activeTab, setActiveTab] = useState('overview')
    const [stats, setStats] = useState(null)
    const [events, setEvents] = useState([])
    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)
    const [reportLoading, setReportLoading] = useState(false)
    const [analyzingEvent, setAnalyzingEvent] = useState(null)
    const [filterSeverity, setFilterSeverity] = useState('ALL') // Bộ lọc cho Tab Sự kiện theo mức độ
    const [filterStatus, setFilterStatus] = useState('ALL') // Bộ lọc trạng thái: ALL, RESOLVED, PENDING, UNRESOLVED
    const [aiInsight, setAiInsight] = useState(null)
    const [insightLoading, setInsightLoading] = useState(false)
    const [aiActivities, setAiActivities] = useState([])

    // Helper: push an AI activity message (max 5 entries)
    const addActivity = (icon, message) => {
        const entry = { id: Date.now(), icon, message, time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) }
        setAiActivities(prev => [entry, ...prev].slice(0, 5))
    }

    // Fetch dashboard stats
    const fetchStats = useCallback(async () => {
        try {
            addActivity('📊', 'Đang tải thống kê Dashboard...')
            const res = await api.get('/admin/advisor/dashboard')
            if (res.data) {
                setStats(res.data)
                addActivity('✅', `Đã tải ${res.data.totalEvents || 0} sự kiện — Risk Score: ${res.data.riskScore || 0}/100`)
                fetchInsight(res.data)
            }
        } catch (e) {
            addActivity('❌', 'Lỗi tải thống kê Dashboard')
            console.error('Stats error:', e)
        }
    }, [api])

    // Fetch AI Insight for Overview
    const fetchInsight = async (dashboardStats) => {
        setInsightLoading(true)
        addActivity('🧠', 'AI Quick Insight đang phân tích tổng quan bảo mật...')
        try {
            const res = await api.post('/admin/advisor/insight', {
                criticalCount: dashboardStats.criticalCount,
                highCount: dashboardStats.highCount,
                unresolvedCount: dashboardStats.unresolvedCount,
                riskScore: dashboardStats.riskScore,
            })
            if (res.data?.insight) {
                setAiInsight(res.data.insight)
                addActivity('✅', 'AI Quick Insight đã hoàn thành phân tích')
            }
        } catch (e) {
            addActivity('⚠️', 'AI Quick Insight tạm không khả dụng')
            console.error('Insight error:', e)
        }
        setInsightLoading(false)
    }

    // Fetch events
    const fetchEvents = useCallback(async () => {
        try {
            addActivity('📋', 'Đang tải danh sách sự kiện bảo mật...')
            const res = await api.get('/admin/advisor/events?limit=50')
            if (res.data) {
                setEvents(res.data)
                addActivity('✅', `Đã tải ${res.data.length || 0} sự kiện mới nhất`)
            }
        } catch (e) {
            addActivity('❌', 'Lỗi tải danh sách sự kiện')
            console.error('Events error:', e)
        }
    }, [api])

    useEffect(() => {
        Promise.all([fetchStats(), fetchEvents()]).finally(() => setLoading(false))
        const interval = setInterval(() => {
            fetchStats()
            fetchEvents()
        }, 30000)
        return () => clearInterval(interval)
    }, [fetchStats, fetchEvents])

    // Generate AI Report
    const generateReport = async () => {
        setReportLoading(true)
        addActivity('🧠', 'AI đang tạo Báo cáo Phân tích Mối đe dọa...')
        try {
            const res = await api.get('/admin/advisor/report')
            if (res.data) {
                setReport(res.data)
                addActivity('✅', `Báo cáo AI hoàn thành (${((res.data.responseTimeMs || 0) / 1000).toFixed(1)}s)`)
            }
        } catch (e) {
            addActivity('❌', 'Lỗi tạo báo cáo AI')
            console.error('Report error:', e)
        }
        setReportLoading(false)
    }

    // Resolve event
    const resolveEvent = async (id) => {
        try {
            await api.post(`/admin/advisor/resolve/${id}`)
            fetchEvents()
            fetchStats()
        } catch (e) { console.error('Resolve error:', e) }
    }

    // Analyze event with AI
    const analyzeEvent = async (id) => {
        setAnalyzingEvent(id)
        addActivity('🔍', `AI đang phân tích sự kiện #${id}...`)
        try {
            const res = await api.post('/admin/advisor/analyze-event', { eventId: id })
            if (res.data) {
                addActivity('✅', `Phân tích sự kiện #${id} hoàn thành`)
                fetchEvents()
            }
        } catch (e) {
            addActivity('❌', `Lỗi phân tích sự kiện #${id}`)
            console.error('Analyze error:', e)
        }
        setAnalyzingEvent(null)
    }

    const getRiskLevel = (score) => {
        if (score >= 60) return { label: t.criticalAlert, class: 'critical', emoji: '🔴' }
        if (score >= 30) return { label: t.danger, class: 'danger', emoji: '🟠' }
        if (score >= 10) return { label: t.warning, class: 'warning', emoji: '🟡' }
        return { label: t.safe, class: 'safe', emoji: '🟢' }
    }

    const formatTime = (ts) => {
        if (!ts) return '-'
        return new Date(ts).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US', {
            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
        })
    }

    if (loading) {
        return <div className="sa-loading"><div className="sa-spinner" /><span>{t.generating}</span></div>
    }

    const riskScore = stats?.riskScore || 0
    const riskLevel = getRiskLevel(riskScore)

    return (
        <div className="security-advisor">
            {/* Header */}
            <div className="sa-header">
                <div>
                    <h2 className="sa-title">🛡️ {t.title}</h2>
                    <p className="sa-subtitle">{t.subtitle}</p>
                </div>
                <button className="sa-btn sa-btn--refresh" onClick={() => { fetchStats(); fetchEvents() }}>
                    🔄 {t.refresh}
                </button>
            </div>

            {/* Tabs */}
            <div className="sa-tabs">
                {['overview', 'events', 'report'].map(tab => (
                    <button key={tab}
                        className={`sa-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab)}>
                        {tab === 'overview' ? `📊 ${t.tabOverview}` :
                            tab === 'events' ? `📋 ${t.tabEvents}` :
                                `🤖 ${t.tabReport}`}
                    </button>
                ))}
            </div>

            {/* ═══ OVERVIEW TAB ═══ */}
            {activeTab === 'overview' && (
                <div className="sa-content">
                    {/* Risk Score Hero */}
                    <div className={`sa-risk-hero sa-risk--${riskLevel.class}`}>
                        <div className="sa-risk-glow-layer"></div>
                        <div className="sa-risk-score-circle">
                            <svg viewBox="0 0 120 120" className="sa-risk-svg">
                                <circle cx="60" cy="60" r="54" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="8" />
                                <circle cx="60" cy="60" r="54" fill="none"
                                    stroke="currentColor" strokeWidth="8"
                                    strokeDasharray={`${(riskScore / 100) * 339} 339`}
                                    strokeLinecap="round"
                                    transform="rotate(-90 60 60)" />
                            </svg>
                            <div className="sa-risk-value">
                                <span className="sa-risk-number">{riskScore}</span>
                                <span className="sa-risk-max">/100</span>
                            </div>
                        </div>
                        <div className="sa-risk-info">
                            <span className="sa-risk-label">{t.riskScore}</span>
                            <span className="sa-risk-level">{riskLevel.emoji} {riskLevel.label}</span>
                        </div>
                    </div>

                    {/* AI Activity Ticker */}
                    <div className="sa-activity-ticker">
                        <div className="sa-activity-header">
                            <span className="sa-activity-icon">⚡</span>
                            <span>AI Activity Log</span>
                            {(insightLoading || reportLoading || analyzingEvent) && (
                                <span className="sa-pulse-dot" />
                            )}
                        </div>
                        <div className="sa-activity-list">
                            {aiActivities.length === 0 ? (
                                <div className="sa-activity-item sa-activity-idle">
                                    <span className="sa-activity-item-icon">💤</span>
                                    <span>AI đang chờ lệnh...</span>
                                </div>
                            ) : (
                                aiActivities.map(a => (
                                    <div key={a.id} className="sa-activity-item">
                                        <span className="sa-activity-item-icon">{a.icon}</span>
                                        <span className="sa-activity-item-msg">{a.message}</span>
                                        <span className="sa-activity-item-time">{a.time}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* AI Quick Insight Box */}
                    <div className="sa-insight-box">
                        <div className="sa-insight-header">
                            🤖 AI Quick Insight
                            {insightLoading && <span className="sa-pulse-dot"></span>}
                        </div>
                        <div className="sa-insight-body">
                            {insightLoading ? 'Đang phân tích tổng quan tĩnh...' : (aiInsight || 'Không có dữ liệu.')}
                        </div>
                    </div>

                    {/* Stat Cards */}
                    <div className="sa-stat-grid">
                        <div className="sa-stat-card"><span className="sa-stat-value">{stats?.totalEvents || 0}</span><span className="sa-stat-label">{t.totalEvents}</span></div>
                        <div className="sa-stat-card sa-stat--warn"><span className="sa-stat-value">{stats?.unresolvedCount || 0}</span><span className="sa-stat-label">{t.unresolved}</span></div>
                        <div className="sa-stat-card sa-stat--critical"><span className="sa-stat-value">{stats?.criticalCount || 0}</span><span className="sa-stat-label">{t.critical}</span></div>
                        <div className="sa-stat-card sa-stat--high"><span className="sa-stat-value">{stats?.highCount || 0}</span><span className="sa-stat-label">{t.high}</span></div>
                        <div className="sa-stat-card"><span className="sa-stat-value">{stats?.eventsLastHour || 0}</span><span className="sa-stat-label">{t.eventsLastHour}</span></div>
                        <div className="sa-stat-card"><span className="sa-stat-value">{stats?.events24h || 0}</span><span className="sa-stat-label">{t.events24h}</span></div>
                    </div>

                    {/* Analytics Row */}
                    <div className="sa-analytics-row">
                        {/* Severity Distribution */}
                        <div className="sa-analytics-card">
                            <h4>{t.severityDist}</h4>
                            <div className="sa-severity-bars">
                                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => {
                                    const count = stats?.severityDistribution?.[sev] || 0
                                    const total = Object.values(stats?.severityDistribution || {}).reduce((a, b) => a + b, 0) || 1
                                    const pct = Math.round((count / total) * 100)
                                    const cfg = severityConfig[sev]
                                    return (
                                        <div key={sev} className="sa-severity-row">
                                            <span className="sa-severity-label">{cfg.emoji} {sev}</span>
                                            <div className="sa-severity-bar">
                                                <div className="sa-severity-fill" style={{ width: `${pct}%`, background: cfg.color }} />
                                            </div>
                                            <span className="sa-severity-count">{count}</span>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Top Attacking IPs */}
                        <div className="sa-analytics-card">
                            <h4>{t.topAttackers}</h4>
                            {stats?.topAttackingIPs?.length > 0 ? (
                                <div className="sa-top-ips">
                                    {stats.topAttackingIPs.slice(0, 5).map((item, i) => (
                                        <div key={i} className="sa-top-ip-row">
                                            <span className="sa-top-ip-rank">#{i + 1}</span>
                                            <span className="sa-top-ip-addr">{item.ip}</span>
                                            <span className="sa-top-ip-count">{item.count} events</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="sa-empty-text">{t.noEvents}</p>
                            )}
                        </div>
                    </div>

                    {/* Event Types */}
                    {stats?.eventTypes && Object.keys(stats.eventTypes).length > 0 && (
                        <div className="sa-analytics-card sa-full-width">
                            <h4>{t.eventTypeDist}</h4>
                            <div className="sa-event-type-grid">
                                {Object.entries(stats.eventTypes).map(([type, count]) => (
                                    <div key={type} className="sa-event-type-chip">
                                        <span className="sa-event-type-name">{type}</span>
                                        <span className="sa-event-type-count">{count}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══ EVENTS TAB ═══ */}
            {activeTab === 'events' && (
                <div className="sa-content">
                    {/* Render Filters */}
                    <div className="sa-event-filters">
                        <div className="sa-filter-group">
                            <span className="sa-filter-label">Mức độ:</span>
                            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(sev => (
                                <button
                                    key={sev}
                                    className={`sa-filter-btn ${filterSeverity === sev ? 'active' : ''}`}
                                    onClick={() => setFilterSeverity(sev)}
                                >
                                    {sev === 'ALL' ? 'Tất cả' : `${severityConfig[sev]?.emoji} ${sev}`}
                                </button>
                            ))}
                        </div>
                        <div className="sa-filter-group sa-filter-status-group">
                            <span className="sa-filter-label">Trạng thái:</span>
                            <button className={`sa-filter-btn ${filterStatus === 'ALL' ? 'active' : ''}`} onClick={() => setFilterStatus('ALL')}>
                                🌐 Tất cả
                            </button>
                            <button className={`sa-filter-btn sa-filter-btn--resolved ${filterStatus === 'RESOLVED' ? 'active' : ''}`} onClick={() => setFilterStatus('RESOLVED')}>
                                ✅ Đã xử lý
                            </button>
                            <button className={`sa-filter-btn sa-filter-btn--pending ${filterStatus === 'PENDING' ? 'active' : ''}`} onClick={() => setFilterStatus('PENDING')}>
                                ⏳ Đang chờ xử lý
                            </button>
                            <button className={`sa-filter-btn sa-filter-btn--unresolved ${filterStatus === 'UNRESOLVED' ? 'active' : ''}`} onClick={() => setFilterStatus('UNRESOLVED')}>
                                ⚠️ Chưa xử lý
                            </button>
                        </div>
                    </div>

                    {(() => {
                        // Tính toán danh sách đã lọc
                        const filteredEvents = events.filter(e => {
                            // 1. Lọc theo severity
                            if (filterSeverity !== 'ALL' && e.severity !== filterSeverity) return false;
                            // 2. Lọc theo status
                            if (filterStatus === 'RESOLVED' && !e.resolved) return false;
                            // "Đang chờ xử lý": AI đã có đề xuất (aiAnalysis !== null) nhưng admin chưa chốt (resolved = false)
                            if (filterStatus === 'PENDING' && (e.resolved || !e.aiAnalysis)) return false;
                            // "Chưa xử lý": Hoàn toàn mới, chưa ai phân tích và chưa resolved
                            if (filterStatus === 'UNRESOLVED' && (e.resolved || e.aiAnalysis)) return false;
                            return true;
                        });

                        return filteredEvents.length === 0 ? (
                            <div className="sa-empty"><span>🛡️</span><p>{t.noEvents}</p></div>
                        ) : (
                            <div className="sa-events-list">
                                {filteredEvents.map(event => {
                                    const cfg = severityConfig[event.severity] || severityConfig.LOW
                                    return (
                                        <div key={event.id} className={`sa-event-card ${event.resolved ? 'resolved' : ''}`}
                                            style={{ borderLeftColor: cfg.color }}>
                                            <div className="sa-event-header">
                                                <span className="sa-event-severity" style={{ background: cfg.bg, color: cfg.color }}>
                                                    {cfg.emoji} {event.severity}
                                                </span>
                                                <span className="sa-event-type">{event.eventType}</span>
                                                <span className="sa-event-time">{formatTime(event.createdAt)}</span>
                                            </div>
                                            <div className="sa-event-body">
                                                <div className="sa-event-ip">🌐 {event.sourceIp || '-'}</div>
                                                <div className="sa-event-desc">{event.description}</div>
                                            </div>
                                            {event.aiAnalysis && (
                                                <div className="sa-event-ai">
                                                    <div className="sa-event-ai-title">🤖 AI Analysis</div>
                                                    <div className="sa-event-ai-content">
                                                        {renderMarkdownSimple(event.aiAnalysis)}
                                                    </div>
                                                </div>
                                            )}
                                            <div className="sa-event-actions">
                                                {!event.resolved && (
                                                    <button className="sa-btn sa-btn--resolve" onClick={() => resolveEvent(event.id)}>
                                                        ✅ {t.resolve}
                                                    </button>
                                                )}
                                                <button className="sa-btn sa-btn--analyze"
                                                    onClick={() => analyzeEvent(event.id)}
                                                    disabled={analyzingEvent === event.id}>
                                                    {analyzingEvent === event.id ? '⏳' : '🤖'} {t.analyze}
                                                </button>
                                                <span className={`sa-event-status ${event.resolved ? 'resolved' : 'pending'}`}>
                                                    {event.resolved ? `✅ ${t.resolved}` : `⏳ ${t.pending}`}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    })()}
                </div>
            )}

            {/* ═══ AI REPORT TAB ═══ */}
            {activeTab === 'report' && (
                <div className="sa-content">
                    {!report && !reportLoading && (
                        <div className="sa-report-cta">
                            <div className="sa-report-icon">🤖</div>
                            <h3>{t.generateReport}</h3>
                            <p>{language === 'vi'
                                ? 'AI sẽ phân tích tất cả sự kiện bảo mật gần đây và đưa ra báo cáo chi tiết với đề xuất.'
                                : 'AI will analyze all recent security events and generate a detailed report with recommendations.'}</p>
                            <button className="sa-btn sa-btn--primary" onClick={generateReport}>
                                🧠 {t.generateReport}
                            </button>
                        </div>
                    )}

                    {reportLoading && (
                        <div className="sa-report-loading">
                            <div className="sa-spinner sa-spinner--large" />
                            <h3>{t.generating}</h3>
                            <p>{language === 'vi'
                                ? 'AI đang phân tích dữ liệu bảo mật. Quá trình này có thể mất 30-60 giây...'
                                : 'AI is analyzing security data. This may take 30-60 seconds...'}</p>
                        </div>
                    )}

                    {report && !reportLoading && (
                        <div className="sa-report">
                            <div className="sa-report-header">
                                <h3>🛡️ {language === 'vi' ? 'Báo cáo Phân tích Mối đe dọa' : 'Threat Analysis Report'}</h3>
                                <div className="sa-report-meta">
                                    <span>{formatTime(report.generatedAt)}</span>
                                    {report.responseTimeMs && (
                                        <span className="sa-report-time">⏱️ {(report.responseTimeMs / 1000).toFixed(1)}s</span>
                                    )}
                                    <span className={`sa-report-badge ${report.status === 'OK' ? 'ai' : 'fallback'}`}>
                                        {report.status === 'OK' ? '🤖 AI Analysis' : '📊 Rule-based'}
                                    </span>
                                </div>
                            </div>

                            {/* Risk Score */}
                            <div className={`sa-report-risk sa-risk--${getRiskLevel(report.riskScore || 0).class}`}>
                                <span className="sa-report-risk-score">{report.riskScore || 0}/100</span>
                                <span>{getRiskLevel(report.riskScore || 0).emoji} {getRiskLevel(report.riskScore || 0).label}</span>
                            </div>

                            {/* AI Analysis Content - Terminal Style */}
                            <div className="sa-report-document">
                                <div className="sa-report-doc-header">
                                    <span className="sa-doc-dot red"></span>
                                    <span className="sa-doc-dot yellow"></span>
                                    <span className="sa-doc-dot green"></span>
                                    <span className="sa-doc-title">cyber_threat_intel.md</span>
                                </div>
                                <div className="sa-report-content">
                                    {renderMarkdownSimple(report.analysis)}
                                </div>
                            </div>

                            {report.status === 'FALLBACK' && (
                                <div className="sa-report-fallback-note">
                                    ⚠️ {t.fallbackNote}
                                </div>
                            )}

                            <button className="sa-btn sa-btn--primary" onClick={generateReport} style={{ marginTop: 16 }}>
                                🔄 {language === 'vi' ? 'Tạo lại báo cáo' : 'Regenerate Report'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
