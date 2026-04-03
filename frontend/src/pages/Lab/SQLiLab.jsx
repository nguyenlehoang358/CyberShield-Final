import React, { useState, useEffect, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import AIInput from '../../components/common/AIInput'

/* ──────────────────────────────────────
   FAKE DATABASE
   ────────────────────────────────────── */
const FAKE_DB = {
    users: [
        { id: 1, username: 'admin', password: 'SuperSecret123!', email: 'admin@shop.com', role: 'admin', balance: 99999 },
        { id: 2, username: 'alice', password: 'alice2024', email: 'alice@email.com', role: 'user', balance: 1500 },
        { id: 3, username: 'bob', password: 'bob_pass!', email: 'bob@email.com', role: 'user', balance: 3200 },
        { id: 4, username: 'charlie', password: 'Ch@rlie99', email: 'charlie@corp.net', role: 'user', balance: 720 },
    ],
    products: [
        { id: 1, name: 'iPhone 16 Pro', price: 1199, category: 'phones', stock: 45 },
        { id: 2, name: 'MacBook Air M3', price: 1299, category: 'laptops', stock: 23 },
        { id: 3, name: 'AirPods Pro 3', price: 249, category: 'audio', stock: 120 },
        { id: 4, name: 'iPad Pro 13"', price: 1099, category: 'tablets', stock: 67 },
        { id: 5, name: 'Apple Watch Ultra', price: 799, category: 'wearables', stock: 31 },
    ],
    secrets: [
        { id: 1, key: 'API_KEY', value: 'sk-live-abc123xyz789!@#' },
        { id: 2, key: 'DB_PASSWORD', value: 'prod_db_P@ss2026' },
        { id: 3, key: 'JWT_SECRET', value: 'my-super-secret-jwt-key-256bit' },
    ],
}

/* ──────────────────────────────────────
   SQLI DETECTION
   ────────────────────────────────────── */
const SQLI_PATTERNS = [
    { regex: /'\s*(OR|AND)\s+/i, type: 'boolean_injection', label: 'Boolean-based SQLi' },
    { regex: /'\s*;\s*/i, type: 'stacked_query', label: 'Stacked query' },
    { regex: /UNION\s+(ALL\s+)?SELECT/i, type: 'union_select', label: 'UNION SELECT' },
    { regex: /--\s*$/m, type: 'comment', label: 'SQL comment (--) bypass' },
    { regex: /#\s*$/m, type: 'comment_hash', label: 'SQL comment (#) bypass' },
    { regex: /'\s*=\s*'/i, type: 'tautology', label: 'Tautology attack' },
    { regex: /DROP\s+TABLE/i, type: 'destructive', label: 'DROP TABLE (destructive)' },
    { regex: /SLEEP\s*\(/i, type: 'time_based', label: 'Time-based blind SQLi' },
    { regex: /1\s*=\s*1/i, type: 'always_true', label: 'Always-true condition' },
    { regex: /information_schema/i, type: 'schema_dump', label: 'Schema enumeration' },
]

function detectSQLi(input) {
    return SQLI_PATTERNS.filter(p => p.regex.test(input))
}

/* ──────────────────────────────────────
   SIMULATE SQL EXECUTION
   ────────────────────────────────────── */
function simulateLoginQuery(username, password, vulnerable) {
    const rawSQL = `SELECT * FROM users WHERE username='${username}' AND password='${password}'`

    if (!vulnerable) {
        // Parameterized — just match exact
        const user = FAKE_DB.users.find(u => u.username === username && u.password === password)
        return {
            query: `SELECT * FROM users WHERE username=? AND password=?`,
            params: [username, password],
            rawSQL: null,
            results: user ? [user] : [],
            success: !!user,
            safe: true,
        }
    }

    // Vulnerable — simulate injection
    let results = []
    let success = false

    // Check for tautology: ' OR '1'='1 or ' OR 1=1 --
    if (/'\s*OR\s+('1'\s*=\s*'1'|1\s*=\s*1|true)/i.test(username) || /'\s*OR\s+('1'\s*=\s*'1'|1\s*=\s*1|true)/i.test(password)) {
        results = [...FAKE_DB.users] // Return ALL users
        success = true
    }
    // Comment bypass: admin'--
    else if (/--\s*$/.test(username) || /#\s*$/.test(username)) {
        const cleanName = username.replace(/'\s*--.*$/, '').replace(/'\s*#.*$/, '')
        const user = FAKE_DB.users.find(u => u.username === cleanName)
        results = user ? [user] : []
        success = !!user
    }
    // UNION SELECT
    else if (/UNION\s+(ALL\s+)?SELECT/i.test(username) || /UNION\s+(ALL\s+)?SELECT/i.test(password)) {
        // If asking for secrets table
        if (/secrets/i.test(username) || /secrets/i.test(password)) {
            results = FAKE_DB.secrets.map(s => ({ id: s.id, username: s.key, password: s.value, email: '—', role: '—', balance: 0 }))
        } else {
            results = [...FAKE_DB.users]
        }
        success = true
    }
    // Normal login
    else {
        const user = FAKE_DB.users.find(u => u.username === username && u.password === password)
        results = user ? [user] : []
        success = !!user
    }

    return { query: rawSQL, params: null, rawSQL, results, success, safe: false }
}

function simulateSearchQuery(search, vulnerable) {
    const rawSQL = `SELECT * FROM products WHERE name LIKE '%${search}%'`

    if (!vulnerable) {
        const filtered = FAKE_DB.products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
        return {
            query: `SELECT * FROM products WHERE name LIKE ?`,
            params: [`%${search}%`],
            rawSQL: null,
            results: filtered,
            safe: true,
        }
    }

    let results = []

    // UNION SELECT on users
    if (/UNION\s+(ALL\s+)?SELECT/i.test(search) && /users/i.test(search)) {
        results = FAKE_DB.users.map(u => ({
            id: u.id, name: u.username, price: '***', category: u.email, stock: u.role,
        }))
    }
    // UNION SELECT on secrets
    else if (/UNION\s+(ALL\s+)?SELECT/i.test(search) && /secrets/i.test(search)) {
        results = FAKE_DB.secrets.map(s => ({
            id: s.id, name: s.key, price: '—', category: s.value, stock: '—',
        }))
    }
    // OR 1=1 — dump all
    else if (/'\s*OR\s+('1'\s*=\s*'1'|1\s*=\s*1|true)/i.test(search)) {
        results = [...FAKE_DB.products]
    }
    // Normal search
    else {
        results = FAKE_DB.products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
    }

    return { query: rawSQL, params: null, rawSQL, results, safe: false }
}

/* ──────────────────────────────────────
   SQLI EXAMPLES
   ────────────────────────────────────── */
const LOGIN_EXAMPLES = [
    { label: "Comment bypass", user: "admin'--", pass: "anything" },
    { label: "OR tautology", user: "' OR '1'='1'--", pass: "anything" },
    { label: "UNION secrets", user: "' UNION SELECT * FROM secrets--", pass: "x" },
    { label: "Normal login", user: "admin", pass: "SuperSecret123!" },
]

const SEARCH_EXAMPLES = [
    { label: "Dump users", search: "' UNION ALL SELECT id,username,password,email,role FROM users--" },
    { label: "Dump secrets", search: "' UNION ALL SELECT id,key,0,value,'—' FROM secrets--" },
    { label: "OR 1=1", search: "' OR '1'='1" },
    { label: "Normal search", search: "iPhone" },
]

/* ──────────────────────────────────────
   THEORY
   ────────────────────────────────────── */
function SQLiTheory({ lang }) {
    if (lang === 'vi') {
        return (
            <>
                <h3>SQL Injection là gì?</h3>
                <p>SQL Injection (SQLi) là lỗ hổng cho phép kẻ tấn công chèn mã SQL vào các câu truy vấn, thay đổi logic truy vấn để truy cập/thao tác dữ liệu trái phép.</p>

                <h3>Các loại SQLi</h3>
                <ul>
                    <li><strong>Classic (In-band)</strong> — Kết quả hiện trực tiếp trên trang</li>
                    <li><strong>Error-based</strong> — Khai thác thông báo lỗi SQL</li>
                    <li><strong>UNION-based</strong> — Dùng UNION để gộp dữ liệu từ bảng khác</li>
                    <li><strong>Blind SQLi</strong> — Không thấy kết quả, dùng Boolean/Time</li>
                    <li><strong>Out-of-band</strong> — Gửi dữ liệu qua DNS/HTTP khác</li>
                </ul>

                <h3>Hậu quả</h3>
                <ul>
                    <li>🔓 Bypass đăng nhập (authentication bypass)</li>
                    <li>📊 Dump toàn bộ database</li>
                    <li>🔑 Đánh cắp mật khẩu, API keys</li>
                    <li>💣 Xóa/sửa dữ liệu (DROP TABLE!)</li>
                    <li>🖥️ Thực thi lệnh hệ thống (RCE)</li>
                </ul>

                <h3>Phòng chống</h3>
                <ul>
                    <li>✅ <strong>Parameterized queries</strong> (Prepared Statements)</li>
                    <li>✅ <strong>ORM</strong> (Hibernate, Sequelize, Prisma)</li>
                    <li>✅ <strong>Input validation</strong> (whitelist)</li>
                    <li>✅ <strong>Least privilege</strong> — DB user với quyền tối thiểu</li>
                    <li>✅ <strong>WAF</strong> (Web Application Firewall)</li>
                </ul>

                <div className="lab-theory-note danger">
                    🚨 SQLi đứng #3 trong OWASP Top 10. Nhiều vụ rò rỉ hàng triệu tài khoản do SQLi (Sony, LinkedIn, Yahoo).
                </div>
            </>
        )
    }

    return (
        <>
            <h3>What is SQL Injection?</h3>
            <p>SQL Injection (SQLi) allows attackers to insert malicious SQL into queries, altering query logic to access or manipulate data without authorization.</p>

            <h3>Types of SQLi</h3>
            <ul>
                <li><strong>Classic (In-band)</strong> — Results shown directly on page</li>
                <li><strong>Error-based</strong> — Exploits SQL error messages</li>
                <li><strong>UNION-based</strong> — Uses UNION to merge data from other tables</li>
                <li><strong>Blind SQLi</strong> — No visible results, uses Boolean/Time</li>
                <li><strong>Out-of-band</strong> — Exfiltrates data via DNS/HTTP</li>
            </ul>

            <h3>Impact</h3>
            <ul>
                <li>🔓 Authentication bypass</li>
                <li>📊 Full database dump</li>
                <li>🔑 Steal passwords, API keys</li>
                <li>💣 Delete/modify data (DROP TABLE!)</li>
                <li>🖥️ Remote code execution (RCE)</li>
            </ul>

            <h3>Prevention</h3>
            <ul>
                <li>✅ <strong>Parameterized queries</strong> (Prepared Statements)</li>
                <li>✅ <strong>ORM</strong> (Hibernate, Sequelize, Prisma)</li>
                <li>✅ <strong>Input validation</strong> (whitelist)</li>
                <li>✅ <strong>Least privilege</strong> — Minimal DB user permissions</li>
                <li>✅ <strong>WAF</strong> (Web Application Firewall)</li>
            </ul>

            <div className="lab-theory-note danger">
                🚨 SQLi is #3 in OWASP Top 10. Major breaches from SQLi include Sony, LinkedIn, Yahoo (millions of accounts).
            </div>
        </>
    )
}

/* ──────────────────────────────────────
   FAKE BROWSER
   ────────────────────────────────────── */
function FakeBrowser({ url, children, title }) {
    return (
        <div style={{ borderRadius: 10, overflow: 'hidden', border: '1px solid var(--lab-border)', background: '#1a1a2e' }}>
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
                    fontFamily: 'monospace',
                }}>
                    <span style={{ color: 'var(--lab-green)', fontSize: '0.7rem' }}>🔒</span> {url}
                </div>
                {title && <span style={{ fontSize: '0.7rem', color: 'var(--lab-text-dim)' }}>{title}</span>}
            </div>
            <div style={{ padding: '1.25rem', background: '#fafafa', minHeight: 100, color: '#222', fontSize: '0.88rem', lineHeight: 1.6 }}>
                {children}
            </div>
        </div>
    )
}

/* ──────────────────────────────────────
   SQL HIGHLIGHT COMPONENT
   ────────────────────────────────────── */
function SQLHighlight({ sql, dangerous }) {
    if (!sql) return null
    // Simple keyword coloring
    const highlighted = sql
        .replace(/(SELECT|FROM|WHERE|AND|OR|UNION|ALL|LIKE|INSERT|UPDATE|DELETE|DROP|TABLE|INTO|VALUES|SET)/gi,
            '<span style="color:#bc8cff;font-weight:700">$1</span>')
        .replace(/('(?:[^'\\]|\\.)*')/g, '<span style="color:#3fb950">$1</span>')
        .replace(/(--.*$)/gm, '<span style="color:#6e7a8a;font-style:italic">$1</span>')
        .replace(/(\*)/g, '<span style="color:#f85149;font-weight:700">$1</span>')

    return (
        <div style={{
            padding: '0.9rem 1.1rem', borderRadius: 6,
            background: '#0b0f19',
            border: `1px solid ${dangerous ? 'rgba(248,81,73,0.3)' : 'var(--lab-border)'}`,
            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.8rem',
            lineHeight: 1.7, overflowX: 'auto', wordBreak: 'break-all',
        }}>
            <span dangerouslySetInnerHTML={{ __html: highlighted }} />
        </div>
    )
}

/* ──────────────────────────────────────
   MAIN COMPONENT
   ────────────────────────────────────── */
export default function SQLiLab() {
    const { t, lang } = useLanguage()
    const { setTheory, setLabContext } = useOutletContext()

    const [activeTab, setActiveTab] = useState('login')
    const [isVulnerable, setIsVulnerable] = useState(true)

    // Login demo
    const [loginUser, setLoginUser] = useState('')
    const [loginPass, setLoginPass] = useState('')
    const [loginResult, setLoginResult] = useState(null)

    // Search demo
    const [searchInput, setSearchInput] = useState('')
    const [searchResult, setSearchResult] = useState(null)

    // Theory
    useEffect(() => { setTheory(<SQLiTheory lang={lang} />) }, [setTheory, lang])

    // Push lab context to Mentor Chat
    useEffect(() => {
        if (setLabContext) {
            const ctx = [
                `Lab: SQL Injection`,
                `Mode: ${isVulnerable ? 'VULNERABLE' : 'SAFE'}`,
                `Tab: ${activeTab}`,
                activeTab === 'login' && loginUser ? `Login payload: username="${loginUser}", password="${loginPass}"` : '',
                activeTab === 'search' && searchInput ? `Search payload: "${searchInput}"` : '',
                loginResult ? `Login result: ${loginResult.success ? 'SUCCESS' : 'FAILED'}, ${loginResult.results?.length || 0} rows` : '',
                searchResult ? `Search result: ${searchResult.results?.length || 0} rows` : '',
            ].filter(Boolean).join('. ')
            setLabContext(ctx)
        }
    }, [isVulnerable, activeTab, loginUser, loginPass, loginResult, searchInput, searchResult, setLabContext])

    // Execute login
    const handleLogin = useCallback(() => {
        if (!loginUser) return
        const result = simulateLoginQuery(loginUser, loginPass, isVulnerable)
        setLoginResult(result)
    }, [loginUser, loginPass, isVulnerable])

    // Execute search
    const handleSearch = useCallback(() => {
        const result = simulateSearchQuery(searchInput, isVulnerable)
        setSearchResult(result)
    }, [searchInput, isVulnerable])

    // Auto-search on input change
    useEffect(() => {
        if (searchInput) {
            const timer = setTimeout(() => handleSearch(), 300)
            return () => clearTimeout(timer)
        } else {
            setSearchResult(null)
        }
    }, [searchInput, isVulnerable])

    const loginDetections = detectSQLi(loginUser + ' ' + loginPass)
    const searchDetections = detectSQLi(searchInput)


    return (
        <div className="lab-animate-in">
            {/* Title */}
            <div className="lab-section">
                <h2 className="lab-section-title" style={{ fontSize: '1.3rem' }}>
                    🗃️ {t('lab_sqli_title')}
                </h2>
                <p style={{ color: 'var(--lab-text-dim)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    {t('lab_sqli_desc')}
                </p>
            </div>

            {/* Mode Toggle */}
            <div className="lab-toggle-group">
                <button className={`lab-toggle-opt ${isVulnerable ? 'active-vuln' : ''}`}
                    onClick={() => { setIsVulnerable(true); setLoginResult(null); setSearchResult(null) }}>
                    🔓 {lang === 'vi' ? 'Chế độ LỖ HỔNG' : 'VULNERABLE Mode'}
                </button>
                <button className={`lab-toggle-opt ${!isVulnerable ? 'active-safe' : ''}`}
                    onClick={() => { setIsVulnerable(false); setLoginResult(null); setSearchResult(null) }}>
                    🔒 {lang === 'vi' ? 'Chế độ AN TOÀN' : 'SAFE Mode'}
                </button>
            </div>

            {/* Tabs */}
            <div className="lab-tabs">
                {[
                    { id: 'login', label: lang === 'vi' ? '🔐 Bypass đăng nhập' : '🔐 Login Bypass' },
                    { id: 'search', label: lang === 'vi' ? '🔍 UNION Attack' : '🔍 UNION Attack' },
                    { id: 'prevention', label: lang === 'vi' ? '🛡️ Phòng chống' : '🛡️ Prevention' },
                ].map(tab => (
                    <button key={tab.id} className={`lab-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ═══════ TAB 1: Login Bypass ═══════ */}
            {activeTab === 'login' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            🔐 {lang === 'vi' ? 'Mô phỏng: Trang đăng nhập bị lỗ hổng' : 'Simulation: Vulnerable Login Page'}
                        </h3>
                        <FakeBrowser url="https://shop.example.com/login" title={isVulnerable ? '⚠️ VULNERABLE' : '✅ SAFE'}>
                            <div style={{ maxWidth: 360, margin: '0 auto' }}>
                                <h3 style={{ textAlign: 'center', color: '#1a73e8', marginBottom: 16 }}>🛒 ShopExample Login</h3>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Username (AI Auto-Suggest)</label>
                                    <AIInput 
                                        labType="sqli"
                                        value={loginUser} 
                                        onChange={e => setLoginUser(e.target.value)}
                                        placeholder="admin or payload..." 
                                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                        style={{
                                            width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #ddd',
                                            borderRadius: 4, fontSize: '0.88rem',
                                            background: loginDetections.length > 0 ? '#fff5f5' : 'white',
                                        }} 
                                    />
                                </div>
                                <div style={{ marginBottom: 12 }}>
                                    <label style={{ fontSize: '0.82rem', fontWeight: 600, color: '#555', display: 'block', marginBottom: 4 }}>Password</label>
                                    <input value={loginPass} onChange={e => setLoginPass(e.target.value)}
                                        placeholder="password" onKeyDown={e => e.key === 'Enter' && handleLogin()}
                                        style={{
                                            width: '100%', padding: '0.5rem 0.75rem', border: '1px solid #ddd',
                                            borderRadius: 4, fontSize: '0.88rem',
                                        }} />
                                </div>
                                <button onClick={handleLogin} style={{
                                    width: '100%', padding: '0.6rem', background: '#1a73e8', color: 'white',
                                    border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 600,
                                }}>Login</button>
                            </div>

                            {/* Quick payload buttons */}
                            <div style={{ display: 'flex', gap: 4, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
                                {LOGIN_EXAMPLES.map((ex, i) => (
                                    <button key={i} onClick={() => { setLoginUser(ex.user); setLoginPass(ex.pass) }}
                                        style={{
                                            padding: '0.2rem 0.5rem', fontSize: '0.68rem',
                                            background: '#f5f5f5', border: '1px solid #ddd',
                                            borderRadius: 3, cursor: 'pointer', color: '#666',
                                        }}>{ex.label}</button>
                                ))}
                            </div>
                        </FakeBrowser>
                    </div>

                    {/* Query display */}
                    {loginResult && (
                        <div className="lab-visual-panel">
                            <h3 className="lab-section-title">
                                🗂️ {lang === 'vi' ? 'Câu truy vấn SQL' : 'SQL Query Executed'}
                            </h3>

                            {/* Raw SQL (vulnerable) */}
                            {loginResult.rawSQL && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--lab-red)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                                        ❌ {lang === 'vi' ? 'Query thực tế (vulnerable)' : 'Actual query (vulnerable)'}
                                    </div>
                                    <SQLHighlight sql={loginResult.rawSQL} dangerous />
                                </div>
                            )}

                            {/* Safe query */}
                            {loginResult.safe && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--lab-green)', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                                        ✅ {lang === 'vi' ? 'Parameterized Query (safe)' : 'Parameterized Query (safe)'}
                                    </div>
                                    <SQLHighlight sql={loginResult.query} />
                                    <div style={{
                                        marginTop: '0.5rem', padding: '0.4rem 0.7rem', background: 'rgba(0,0,0,0.15)',
                                        borderRadius: 4, fontSize: '0.78rem', color: 'var(--lab-blue)',
                                        fontFamily: "'JetBrains Mono', monospace",
                                    }}>
                                        params: [{loginResult.params.map(p => `"${p}"`).join(', ')}]
                                    </div>
                                </div>
                            )}

                            {/* Result status */}
                            <div style={{
                                padding: '0.6rem 1rem', borderRadius: 6, marginBottom: '1rem',
                                background: loginResult.success ? 'var(--lab-green-dim)' : 'var(--lab-red-dim)',
                                borderLeft: `3px solid ${loginResult.success ? 'var(--lab-green)' : 'var(--lab-red)'}`,
                                display: 'flex', alignItems: 'center', gap: '0.75rem',
                            }}>
                                <span style={{ fontSize: '1.3rem' }}>{loginResult.success ? '✅' : '❌'}</span>
                                <div>
                                    <div style={{ fontWeight: 700, color: loginResult.success ? 'var(--lab-green)' : 'var(--lab-red)', fontSize: '0.9rem' }}>
                                        {loginResult.success
                                            ? (lang === 'vi' ? 'ĐĂNG NHẬP THÀNH CÔNG!' : 'LOGIN SUCCESSFUL!')
                                            : (lang === 'vi' ? 'Đăng nhập thất bại' : 'Login failed')
                                        }
                                    </div>
                                    {loginResult.success && !loginResult.safe && loginDetections.length > 0 && (
                                        <div style={{ fontSize: '0.78rem', color: 'var(--lab-yellow)' }}>
                                            ⚠️ {lang === 'vi' ? 'Bypass bằng SQL Injection!' : 'Bypassed via SQL Injection!'}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Data table */}
                            {loginResult.results.length > 0 && (
                                <div style={{ overflowX: 'auto' }}>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--lab-text-dim)', marginBottom: '0.4rem' }}>
                                        📊 {lang === 'vi' ? `${loginResult.results.length} bản ghi trả về` : `${loginResult.results.length} rows returned`}
                                    </div>
                                    <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '1px solid var(--lab-border)' }}>
                                                {['ID', 'Username', 'Password', 'Email', 'Role', 'Balance'].map(h => (
                                                    <th key={h} style={{ padding: '0.4rem 0.6rem', textAlign: 'left', color: 'var(--lab-text-dim)', fontSize: '0.7rem', textTransform: 'uppercase' }}>{h}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {loginResult.results.map((row, i) => (
                                                <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                                    <td style={{ padding: '0.4rem 0.6rem', color: 'var(--lab-text-dim)' }}>{row.id}</td>
                                                    <td style={{ padding: '0.4rem 0.6rem', fontWeight: 600, color: 'var(--lab-heading)' }}>{row.username}</td>
                                                    <td style={{ padding: '0.4rem 0.6rem', color: 'var(--lab-red)', fontFamily: 'monospace' }}>{row.password}</td>
                                                    <td style={{ padding: '0.4rem 0.6rem', color: 'var(--lab-blue)' }}>{row.email}</td>
                                                    <td style={{ padding: '0.4rem 0.6rem' }}>
                                                        <span style={{
                                                            padding: '0.1rem 0.4rem', borderRadius: 100, fontSize: '0.68rem', fontWeight: 700,
                                                            background: row.role === 'admin' ? 'var(--lab-red-dim)' : 'var(--lab-blue-dim)',
                                                            color: row.role === 'admin' ? 'var(--lab-red)' : 'var(--lab-blue)',
                                                        }}>{row.role}</span>
                                                    </td>
                                                    <td style={{ padding: '0.4rem 0.6rem', color: 'var(--lab-green)', fontWeight: 600 }}>${row.balance?.toLocaleString()}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Detection panel */}
                    {loginDetections.length > 0 && (
                        <div className="lab-visual-panel">
                            <h3 className="lab-section-title">🔍 {lang === 'vi' ? 'Phát hiện SQLi' : 'SQLi Detection'}</h3>
                            <div style={{ display: 'grid', gap: '0.4rem' }}>
                                {loginDetections.map((d, i) => (
                                    <div key={i} style={{
                                        padding: '0.5rem 0.8rem', borderRadius: 6,
                                        background: 'var(--lab-red-dim)', borderLeft: '3px solid var(--lab-red)',
                                        fontSize: '0.82rem', color: 'var(--lab-red)', fontWeight: 600,
                                    }}>
                                        🚨 {d.label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ═══════ TAB 2: UNION Attack ═══════ */}
            {activeTab === 'search' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            🔍 {lang === 'vi' ? 'UNION-based SQLi — Tìm kiếm sản phẩm' : 'UNION-based SQLi — Product Search'}
                        </h3>
                        <p style={{ color: 'var(--lab-text-dim)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            {lang === 'vi'
                                ? 'Mô phỏng: Trang tìm kiếm sản phẩm bị lỗ hổng — dùng UNION SELECT để lấy dữ liệu từ bảng khác.'
                                : 'Simulation: Vulnerable product search — use UNION SELECT to extract data from other tables.'
                            }
                        </p>

                        <FakeBrowser url="https://shop.example.com/products" title={isVulnerable ? '⚠️ VULNERABLE' : '✅ SAFE'}>
                            <div style={{ fontWeight: 700, fontSize: '1.1rem', marginBottom: 12, color: '#1a73e8' }}>
                                🛒 ShopExample — Products
                            </div>
                            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
                                <input value={searchInput} onChange={e => setSearchInput(e.target.value)}
                                    placeholder={lang === 'vi' ? 'Tìm sản phẩm...' : 'Search products...'}
                                    style={{
                                        flex: 1, padding: '0.5rem 0.75rem', border: '1px solid #ddd',
                                        borderRadius: 4, fontSize: '0.85rem',
                                        background: searchDetections.length > 0 ? '#fff5f5' : 'white',
                                    }} />
                            </div>

                            {/* Quick payloads in fake browser */}
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 12 }}>
                                {SEARCH_EXAMPLES.map((ex, i) => (
                                    <button key={i} onClick={() => setSearchInput(ex.search)}
                                        style={{
                                            padding: '0.2rem 0.5rem', fontSize: '0.68rem',
                                            background: '#f5f5f5', border: '1px solid #ddd',
                                            borderRadius: 3, cursor: 'pointer', color: '#666',
                                        }}>{ex.label}</button>
                                ))}
                            </div>

                            {/* Results in fake browser */}
                            {searchResult && searchResult.results.length > 0 && (
                                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #eee' }}>
                                            {['ID', 'Name', 'Price', 'Category', 'Stock'].map(h => (
                                                <th key={h} style={{ padding: '0.4rem', textAlign: 'left', color: '#888', fontSize: '0.72rem' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {searchResult.results.map((row, i) => (
                                            <tr key={i} style={{ borderBottom: '1px solid #f0f0f0' }}>
                                                <td style={{ padding: '0.4rem', color: '#888' }}>{row.id}</td>
                                                <td style={{ padding: '0.4rem', fontWeight: 600 }}>{row.name}</td>
                                                <td style={{ padding: '0.4rem', color: '#1a73e8' }}>{typeof row.price === 'number' ? `$${row.price}` : row.price}</td>
                                                <td style={{ padding: '0.4rem', color: '#666' }}>{row.category}</td>
                                                <td style={{ padding: '0.4rem' }}>{row.stock}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                            {searchResult && searchResult.results.length === 0 && (
                                <div style={{ color: '#999', fontStyle: 'italic', textAlign: 'center', padding: '1rem' }}>
                                    {lang === 'vi' ? 'Không tìm thấy sản phẩm.' : 'No products found.'}
                                </div>
                            )}
                        </FakeBrowser>
                    </div>

                    {/* SQL query display */}
                    {searchResult && (
                        <div className="lab-visual-panel">
                            <h3 className="lab-section-title">🗂️ SQL Query</h3>
                            {searchResult.rawSQL && (
                                <div style={{ marginBottom: '0.75rem' }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--lab-red)', marginBottom: '0.3rem' }}>
                                        ❌ {lang === 'vi' ? 'Query thực tế' : 'Actual query'}
                                    </div>
                                    <SQLHighlight sql={searchResult.rawSQL} dangerous />
                                </div>
                            )}
                            {searchResult.safe && (
                                <div>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--lab-green)', marginBottom: '0.3rem' }}>
                                        ✅ Parameterized Query
                                    </div>
                                    <SQLHighlight sql={searchResult.query} />
                                    <div style={{
                                        marginTop: '0.5rem', padding: '0.4rem 0.7rem', background: 'rgba(0,0,0,0.15)',
                                        borderRadius: 4, fontSize: '0.78rem', color: 'var(--lab-blue)',
                                        fontFamily: "'JetBrains Mono', monospace",
                                    }}>
                                        params: [{searchResult.params.map(p => `"${p}"`).join(', ')}]
                                    </div>
                                </div>
                            )}

                            {searchDetections.length > 0 && (
                                <div style={{ marginTop: '1rem', display: 'grid', gap: '0.3rem' }}>
                                    {searchDetections.map((d, i) => (
                                        <div key={i} style={{
                                            padding: '0.4rem 0.7rem', borderRadius: 4,
                                            background: 'var(--lab-red-dim)', fontSize: '0.78rem',
                                            color: 'var(--lab-red)', fontWeight: 600,
                                            borderLeft: '3px solid var(--lab-red)',
                                        }}>🚨 {d.label}</div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Database Schema hint */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">🗄️ {lang === 'vi' ? 'Cấu trúc Database (đã biết)' : 'Database Schema (known)'}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                            {[
                                { table: 'users', cols: ['id', 'username', 'password', 'email', 'role', 'balance'], color: 'var(--lab-blue)' },
                                { table: 'products', cols: ['id', 'name', 'price', 'category', 'stock'], color: 'var(--lab-green)' },
                                { table: 'secrets', cols: ['id', 'key', 'value'], color: 'var(--lab-red)' },
                            ].map((t, i) => (
                                <div key={i} style={{
                                    padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: 8,
                                    borderTop: `3px solid ${t.color}`,
                                }}>
                                    <div style={{ fontWeight: 700, color: t.color, fontSize: '0.88rem', marginBottom: '0.4rem' }}>📋 {t.table}</div>
                                    {t.cols.map(col => (
                                        <div key={col} style={{ fontSize: '0.75rem', color: 'var(--lab-text-dim)', fontFamily: 'monospace', padding: '0.1rem 0' }}>
                                            ├─ {col}
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════ TAB 3: Prevention ═══════ */}
            {activeTab === 'prevention' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {/* Prevention techniques */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            🛡️ {lang === 'vi' ? 'Kỹ thuật phòng chống SQLi' : 'SQLi Prevention Techniques'}
                        </h3>

                        <div style={{ display: 'grid', gap: '1.5rem' }}>
                            {/* 1. Parameterized Queries */}
                            <div>
                                <h4 style={{ color: 'var(--lab-green)', fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                    1. Parameterized Queries (Prepared Statements)
                                </h4>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--lab-red)', marginBottom: '0.3rem' }}>❌ VULNERABLE</div>
                                        <div className="lab-code">
                                            <span className="comment">{'// String concatenation'}</span>{'\n'}
                                            <span className="keyword">const</span> sql = <span className="danger-hl">{`\`SELECT * FROM users\n  WHERE name='\${input}'\``}</span>{'\n'}
                                            {'\n'}
                                            db.query(sql)
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--lab-green)', marginBottom: '0.3rem' }}>✅ SAFE</div>
                                        <div className="lab-code">
                                            <span className="comment">{'// Parameterized'}</span>{'\n'}
                                            <span className="keyword">const</span> sql = <span className="safe-hl">{`"SELECT * FROM users\n  WHERE name = ?"`}</span>{'\n'}
                                            {'\n'}
                                            db.query(sql, <span className="safe-hl">[input]</span>)
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. ORM */}
                            <div>
                                <h4 style={{ color: 'var(--lab-green)', fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                    2. ORM (Object-Relational Mapping)
                                </h4>
                                <div className="lab-code">
                                    <span className="comment">{'// Sequelize (Node.js)'}</span>{'\n'}
                                    <span className="keyword">const</span> user = <span className="keyword">await</span> User.<span className="function">findOne</span>({'{'}{'\n'}
                                    {'  '}where: {'{'} username: input {'}'}{'\n'}
                                    {'}'});{'\n'}
                                    {'\n'}
                                    <span className="comment">{'// JPA / Hibernate (Java — Spring Boot)'}</span>{'\n'}
                                    <span className="keyword">@Query</span>(<span className="string">"SELECT u FROM User u WHERE u.username = :name"</span>){'\n'}
                                    User <span className="function">findByUsername</span>(@Param(<span className="string">"name"</span>) String name);
                                </div>
                            </div>

                            {/* 3. Input v alidation */}
                            <div>
                                <h4 style={{ color: 'var(--lab-green)', fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                    3. Input Validation (Whitelist)
                                </h4>
                                <div className="lab-code">
                                    <span className="comment">{'// Only allow alphanumeric'}</span>{'\n'}
                                    <span className="keyword">if</span> (<span className="safe-hl">{`!/^[a-zA-Z0-9_]+$/.test(input)`}</span>) {'{'}{'\n'}
                                    {'  '}<span className="keyword">throw</span> <span className="keyword">new</span> Error(<span className="string">'Invalid input'</span>){'\n'}
                                    {'}'}{'\n'}
                                    {'\n'}
                                    <span className="comment">{'// Reject SQL keywords'}</span>{'\n'}
                                    <span className="keyword">const</span> blacklist = <span className="safe-hl">[/UNION/i, /SELECT/i, /DROP/i, /--/]</span>
                                </div>
                            </div>

                            {/* 4. Least privilege */}
                            <div>
                                <h4 style={{ color: 'var(--lab-green)', fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.5rem' }}>
                                    4. Principle of Least Privilege
                                </h4>
                                <div className="lab-code">
                                    <span className="comment">{'-- DB user for web app (read-only where possible)'}</span>{'\n'}
                                    <span className="keyword">CREATE USER</span> <span className="string">'webapp'</span>@<span className="string">'localhost'</span>{'\n'}
                                    {'  '}IDENTIFIED BY <span className="string">'strong_password'</span>;{'\n'}
                                    {'\n'}
                                    <span className="keyword">GRANT</span> <span className="safe-hl">SELECT</span> ON shop.products TO <span className="string">'webapp'</span>;{'\n'}
                                    <span className="comment">{'-- NO DROP, DELETE, UPDATE on sensitive tables!'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comparison chart */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">📊 {lang === 'vi' ? 'So sánh phương pháp' : 'Method Comparison'}</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--lab-border)' }}>
                                        {[
                                            lang === 'vi' ? 'Phương pháp' : 'Method',
                                            lang === 'vi' ? 'Hiệu quả' : 'Effectiveness',
                                            lang === 'vi' ? 'Độ phức tạp' : 'Complexity',
                                            lang === 'vi' ? 'Ghi chú' : 'Notes',
                                        ].map(h => (
                                            <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--lab-text-dim)', fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { method: 'Prepared Statements', eff: '★★★★★', comp: lang === 'vi' ? 'Thấp' : 'Low', note: lang === 'vi' ? 'Phương pháp tốt nhất' : 'Best practice' },
                                        { method: 'ORM', eff: '★★★★☆', comp: lang === 'vi' ? 'Trung bình' : 'Medium', note: lang === 'vi' ? 'Tự động parameterize' : 'Auto-parameterized' },
                                        { method: 'Input Validation', eff: '★★★☆☆', comp: lang === 'vi' ? 'Thấp' : 'Low', note: lang === 'vi' ? 'Lớp phòng thủ bổ sung' : 'Additional defense layer' },
                                        { method: 'WAF', eff: '★★★☆☆', comp: lang === 'vi' ? 'Cao' : 'High', note: lang === 'vi' ? 'Có thể bypass' : 'Can be bypassed' },
                                        { method: 'Escaping', eff: '★★☆☆☆', comp: lang === 'vi' ? 'Cao' : 'High', note: lang === 'vi' ? 'Dễ sai sót, không khuyến khích' : 'Error-prone, not recommended' },
                                    ].map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--lab-heading)' }}>{row.method}</td>
                                            <td style={{ padding: '0.5rem', color: 'var(--lab-yellow)' }}>{row.eff}</td>
                                            <td style={{ padding: '0.5rem', color: 'var(--lab-text-dim)' }}>{row.comp}</td>
                                            <td style={{ padding: '0.5rem', color: 'var(--lab-text-dim)', fontSize: '0.78rem' }}>{row.note}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
