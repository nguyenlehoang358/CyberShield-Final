import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useLab } from '../../context/LabContext'
import AIInput from '../../components/common/AIInput'
/* ──────────────────────────────────────
   COMMON PASSWORDS (top 50)
   ────────────────────────────────────── */
const COMMON_PASSWORDS = [
    'password', '123456', '123456789', '12345678', 'qwerty', 'abc123', 'monkey', 'master',
    'dragon', '111111', 'baseball', 'iloveyou', 'trustno1', 'sunshine', 'princess',
    'football', 'letmein', 'shadow', 'superman', 'michael', 'admin', 'welcome', 'login',
    'passw0rd', 'password1', 'pass123', '1234567', '12345', '1234567890', '000000',
    'charlie', 'donald', 'qwerty123', 'password123', 'test', 'guest', 'access',
    'starwars', 'batman', 'hello', 'root', 'toor', 'default', 'master123', 'love',
    '00000000', 'abcdef', 'soccer', 'jordan', 'harley',
]

/* ──────────────────────────────────────
   PASSWORD ANALYSIS
   ────────────────────────────────────── */
function analyzePassword(password) {
    if (!password) return null

    const checks = {
        length: password.length,
        hasLower: /[a-z]/.test(password),
        hasUpper: /[A-Z]/.test(password),
        hasDigit: /\d/.test(password),
        hasSpecial: /[^a-zA-Z0-9]/.test(password),
        hasSpace: / /.test(password),
    }

    // Character pool size
    let poolSize = 0
    if (checks.hasLower) poolSize += 26
    if (checks.hasUpper) poolSize += 26
    if (checks.hasDigit) poolSize += 10
    if (checks.hasSpecial) poolSize += 33
    if (checks.hasSpace) poolSize += 1

    // Entropy: log2(poolSize^length)
    const entropy = poolSize > 0 ? Math.round(password.length * Math.log2(poolSize)) : 0

    // Common password check
    const isCommon = COMMON_PASSWORDS.includes(password.toLowerCase())

    // Pattern detection
    const patterns = []
    if (/^(.)\1+$/.test(password)) patterns.push({ type: 'repeat', label: 'Repeated character' })
    if (/^(012|123|234|345|456|567|678|789|890|abc|bcd|cde|def|qwe|wer|ert|asd|zxc)/i.test(password))
        patterns.push({ type: 'sequence', label: 'Sequential characters' })
    if (/^(password|passwor|passwo|passw|pass)/i.test(password))
        patterns.push({ type: 'dictionary', label: '"password" variant' })
    if (/^(admin|root|user|test|guest|login)/i.test(password))
        patterns.push({ type: 'dictionary', label: 'Common username' })
    if (/^\d+$/.test(password)) patterns.push({ type: 'numeric', label: 'Numbers only' })
    if (/^[a-zA-Z]+$/.test(password)) patterns.push({ type: 'alpha', label: 'Letters only' })
    // Leet speak
    if (/[@4][s\$5]{2}[w]/i.test(password) || /p[@4][s\$5]{2}/i.test(password))
        patterns.push({ type: 'leet', label: 'Leet speak detected' })

    // Strength score (0-100)
    let score = 0
    // Length contribution (up to 40 points)
    score += Math.min(40, password.length * 3.5)
    // Pool diversity (up to 30 points)
    const diversityCount = [checks.hasLower, checks.hasUpper, checks.hasDigit, checks.hasSpecial].filter(Boolean).length
    score += diversityCount * 7.5
    // Entropy bonus (up to 20 points)
    score += Math.min(20, entropy / 5)
    // Penalties
    if (isCommon) score = Math.max(5, score - 60)
    if (patterns.some(p => p.type === 'repeat')) score = Math.max(5, score - 30)
    if (patterns.some(p => p.type === 'sequence')) score -= 15
    if (patterns.some(p => p.type === 'numeric' || p.type === 'alpha')) score -= 10

    score = Math.max(0, Math.min(100, Math.round(score)))

    // Strength label
    let strength, strengthColor
    if (score < 20) { strength = 'very_weak'; strengthColor = '#f85149' }
    else if (score < 40) { strength = 'weak'; strengthColor = '#f0883e' }
    else if (score < 60) { strength = 'fair'; strengthColor = '#d29922' }
    else if (score < 80) { strength = 'good'; strengthColor = '#3fb950' }
    else { strength = 'excellent'; strengthColor = '#58a6ff' }

    // Crack time estimates
    const totalCombinations = Math.pow(poolSize, password.length)
    const crackTimes = {
        online_10: totalCombinations / 10,          // 10 attempts/sec
        online_1k: totalCombinations / 1000,         // 1K attempts/sec
        offline_10b: totalCombinations / 1e10,       // 10 billion/sec (GPU)
        offline_100b: totalCombinations / 1e11,      // 100B/sec (multi-GPU)
    }

    return {
        checks,
        poolSize,
        entropy,
        isCommon,
        patterns,
        score,
        strength,
        strengthColor,
        crackTimes,
        totalCombinations,
    }
}

function formatTime(seconds) {
    if (!isFinite(seconds) || seconds <= 0) return '< 1 giây'
    if (seconds < 1) return '< 1 giây'
    if (seconds < 60) return `${Math.round(seconds)} giây`
    if (seconds < 3600) return `${Math.round(seconds / 60)} phút`
    if (seconds < 86400) return `${Math.round(seconds / 3600)} giờ`
    if (seconds < 86400 * 365) return `${Math.round(seconds / 86400)} ngày`
    if (seconds < 86400 * 365 * 1000) return `${Math.round(seconds / (86400 * 365))} năm`
    if (seconds < 86400 * 365 * 1e6) return `${(seconds / (86400 * 365 * 1000)).toFixed(0)}K năm`
    if (seconds < 86400 * 365 * 1e9) return `${(seconds / (86400 * 365 * 1e6)).toFixed(0)}M năm`
    return `${(seconds / (86400 * 365 * 1e9)).toFixed(0)}B năm`
}
function formatTimeEn(seconds) {
    if (!isFinite(seconds) || seconds <= 0) return '< 1 second'
    if (seconds < 1) return '< 1 second'
    if (seconds < 60) return `${Math.round(seconds)} seconds`
    if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`
    if (seconds < 86400 * 365) return `${Math.round(seconds / 86400)} days`
    if (seconds < 86400 * 365 * 1000) return `${Math.round(seconds / (86400 * 365))} years`
    if (seconds < 86400 * 365 * 1e6) return `${(seconds / (86400 * 365 * 1000)).toFixed(0)}K years`
    if (seconds < 86400 * 365 * 1e9) return `${(seconds / (86400 * 365 * 1e6)).toFixed(0)}M years`
    return `${(seconds / (86400 * 365 * 1e9)).toFixed(0)}B years`
}

/* ──────────────────────────────────────
   PASSWORD GENERATOR
   ────────────────────────────────────── */
function generatePassword(length = 16, options = {}) {
    const { lower = true, upper = true, digits = true, special = true } = options
    let chars = ''
    if (lower) chars += 'abcdefghijklmnopqrstuvwxyz'
    if (upper) chars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    if (digits) chars += '0123456789'
    if (special) chars += '!@#$%^&*()_+-=[]{}|;:,.<>?'
    if (!chars) chars = 'abcdefghijklmnopqrstuvwxyz'

    const values = new Uint32Array(length)
    crypto.getRandomValues(values)
    return Array.from(values, v => chars[v % chars.length]).join('')
}

/* ──────────────────────────────────────
   THEORY SIDEBAR
   ────────────────────────────────────── */
function PasswordTheory({ lang }) {
    if (lang === 'vi') {
        return (
            <>
                <h3>Tại sao mật khẩu quan trọng?</h3>
                <p>Mật khẩu là tuyến phòng thủ đầu tiên. 80% các vụ rò rỉ dữ liệu liên quan đến mật khẩu yếu hoặc bị đánh cắp.</p>

                <h3>Brute Force Attack</h3>
                <p>Kẻ tấn công thử <strong>tất cả</strong> tổ hợp ký tự có thể. Tốc độ phụ thuộc vào phần cứng:</p>
                <ul>
                    <li><strong>Online</strong> — 10–1000 thử/giây (bị rate limit)</li>
                    <li><strong>Offline GPU</strong> — 10–100 tỷ thử/giây</li>
                    <li><strong>Supercomputer</strong> — 1000+ tỷ thử/giây</li>
                </ul>

                <h3>Entropy (Độ ngẫu nhiên)</h3>
                <p>Đo bằng bit — entropy càng cao, mật khẩu càng khó crack.</p>
                <ul>
                    <li>&lt; 28 bit — Rất yếu (crack trong giây)</li>
                    <li>28–35 bit — Yếu</li>
                    <li>36–59 bit — Tạm được</li>
                    <li>60–127 bit — Mạnh</li>
                    <li>128+ bit — Cực mạnh</li>
                </ul>
                <div className="lab-theory-note">
                    💡 Entropy = log₂(poolSize ^ length). Pool size phụ thuộc vào các loại ký tự bạn dùng.
                </div>

                <h3>Dictionary Attack</h3>
                <p>Thay vì brute force, dùng danh sách mật khẩu phổ biến (wordlist). <strong>"password123"</strong> bị crack trong &lt; 1 giây!</p>

                <h3>Best Practices</h3>
                <ul>
                    <li>✅ Dài ≥ 12 ký tự</li>
                    <li>✅ Kết hợp chữ hoa, chữ thường, số, ký tự đặc biệt</li>
                    <li>✅ Dùng password manager</li>
                    <li>✅ Bật 2FA (xác thực 2 bước)</li>
                    <li>❌ Không dùng lại mật khẩu</li>
                    <li>❌ Không dùng thông tin cá nhân</li>
                </ul>

                <h3>Salt & Hashing</h3>
                <p>Mật khẩu nên được lưu dưới dạng <strong>hash + salt</strong> (bcrypt, argon2) — không bao giờ lưu plaintext!</p>
                <div className="lab-theory-note success">
                    ✅ Passphrase dài như "correct-horse-battery-staple" mạnh hơn "P@ssw0rd!" ngắn.
                </div>
            </>
        )
    }

    return (
        <>
            <h3>Why Passwords Matter</h3>
            <p>Passwords are the first line of defense. 80% of data breaches involve weak or stolen passwords.</p>

            <h3>Brute Force Attack</h3>
            <p>Attackers try <strong>every possible</strong> character combination. Speed depends on hardware:</p>
            <ul>
                <li><strong>Online</strong> — 10–1000 tries/sec (rate limited)</li>
                <li><strong>Offline GPU</strong> — 10–100 billion tries/sec</li>
                <li><strong>Supercomputer</strong> — 1000+ billion tries/sec</li>
            </ul>

            <h3>Entropy (Randomness)</h3>
            <p>Measured in bits — higher entropy means harder to crack.</p>
            <ul>
                <li>&lt; 28 bits — Very weak (cracked in seconds)</li>
                <li>28–35 bits — Weak</li>
                <li>36–59 bits — Fair</li>
                <li>60–127 bits — Strong</li>
                <li>128+ bits — Excellent</li>
            </ul>
            <div className="lab-theory-note">
                💡 Entropy = log₂(poolSize ^ length). Pool size depends on character types used.
            </div>

            <h3>Dictionary Attack</h3>
            <p>Instead of brute force, uses a list of common passwords. <strong>"password123"</strong> is cracked in &lt; 1 second!</p>

            <h3>Best Practices</h3>
            <ul>
                <li>✅ At least 12 characters long</li>
                <li>✅ Mix uppercase, lowercase, numbers, special chars</li>
                <li>✅ Use a password manager</li>
                <li>✅ Enable 2FA (two-factor authentication)</li>
                <li>❌ Never reuse passwords</li>
                <li>❌ Don't use personal information</li>
            </ul>

            <h3>Salt & Hashing</h3>
            <p>Passwords should be stored as <strong>hash + salt</strong> (bcrypt, argon2) — never store plaintext!</p>
            <div className="lab-theory-note success">
                ✅ A long passphrase like "correct-horse-battery-staple" is stronger than a short "P@ssw0rd!".
            </div>
        </>
    )
}

/* ──────────────────────────────────────
   MAIN COMPONENT
   ────────────────────────────────────── */
export default function PasswordLab() {
    const { t, lang } = useLanguage()
    const { setTheory, setLabContext } = useOutletContext()
    const { labInputData, setLabInputData } = useLab()
    const fmt = lang === 'vi' ? formatTime : formatTimeEn

    // Analyzer state — using context for main input
    const password = labInputData
    const setPassword = setLabInputData
    const [showPassword, setShowPassword] = useState(true)
    const analysis = analyzePassword(password)

    // Generator state
    const [genLength, setGenLength] = useState(16)
    const [genLower, setGenLower] = useState(true)
    const [genUpper, setGenUpper] = useState(true)
    const [genDigits, setGenDigits] = useState(true)
    const [genSpecial, setGenSpecial] = useState(true)
    const [generatedPw, setGeneratedPw] = useState('')

    // Brute force simulation state
    const [bruteRunning, setBruteRunning] = useState(false)
    const [bruteAttempts, setBruteAttempts] = useState(0)
    const [bruteCurrentTry, setBruteCurrentTry] = useState('')
    const [bruteFound, setBruteFound] = useState(false)
    const [bruteSpeed, setBruteSpeed] = useState(0)
    const bruteRef = useRef(null)
    const bruteStartRef = useRef(0)

    // Active tab
    const [activeTab, setActiveTab] = useState('analyze')

    // Set theory
    useEffect(() => {
        setTheory(<PasswordTheory lang={lang} />)
    }, [setTheory, lang])

    // Generate password
    const handleGenerate = useCallback(() => {
        const pw = generatePassword(genLength, {
            lower: genLower, upper: genUpper, digits: genDigits, special: genSpecial,
        })
        setGeneratedPw(pw)
    }, [genLength, genLower, genUpper, genDigits, genSpecial])

    // Copy to clipboard
    const handleCopy = useCallback((text) => {
        navigator.clipboard.writeText(text)
    }, [])

    // Brute force simulation
    const startBruteForce = useCallback(() => {
        if (!password || password.length > 6) return // Only allow short passwords to demo
        setBruteRunning(true)
        setBruteFound(false)
        setBruteAttempts(0)
        setBruteCurrentTry('')
        bruteStartRef.current = performance.now()

        const target = password
        const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()'
        let attempt = 0
        let found = false

        const speedPerBatch = 500 // attempts per frame

        function tryBatch() {
            const batchStart = performance.now()
            for (let i = 0; i < speedPerBatch && !found; i++) {
                attempt++
                // Generate a pseudo-random attempt (incremental for short passwords)
                let tryPw = ''
                let idx = attempt
                const len = Math.min(target.length, Math.max(1, Math.ceil(Math.log(attempt + 1) / Math.log(chars.length))))
                for (let j = 0; j < target.length; j++) {
                    tryPw += chars[idx % chars.length]
                    idx = Math.floor(idx / chars.length)
                }

                if (tryPw === target) {
                    found = true
                    setBruteFound(true)
                    setBruteCurrentTry(tryPw)
                    setBruteAttempts(attempt)
                    setBruteRunning(false)
                    const elapsed = (performance.now() - bruteStartRef.current) / 1000
                    setBruteSpeed(Math.round(attempt / elapsed))
                    return
                }

                if (i % 100 === 0) setBruteCurrentTry(tryPw)
            }

            setBruteAttempts(attempt)
            const elapsed = (performance.now() - bruteStartRef.current) / 1000
            setBruteSpeed(Math.round(attempt / Math.max(0.001, elapsed)))

            if (!found && attempt < 5000000) {
                bruteRef.current = requestAnimationFrame(tryBatch)
            } else if (!found) {
                setBruteRunning(false)
            }
        }

        bruteRef.current = requestAnimationFrame(tryBatch)
    }, [password])

    const stopBruteForce = useCallback(() => {
        if (bruteRef.current) cancelAnimationFrame(bruteRef.current)
        setBruteRunning(false)
    }, [])

    useEffect(() => () => { if (bruteRef.current) cancelAnimationFrame(bruteRef.current) }, [])

    // Strength labels
    const strengthLabels = {
        vi: { very_weak: 'Rất yếu', weak: 'Yếu', fair: 'Tạm được', good: 'Mạnh', excellent: 'Rất mạnh' },
        en: { very_weak: 'Very Weak', weak: 'Weak', fair: 'Fair', good: 'Good', excellent: 'Excellent' },
    }

    return (
        <div className="lab-animate-in">
            {/* Title */}
            <div className="lab-section">
                <h2 className="lab-section-title" style={{ fontSize: '1.3rem' }}>
                    🔑 {t('lab_password_title')}
                </h2>
                <p style={{ color: 'var(--lab-text-dim)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    {t('lab_password_desc')}
                </p>
            </div>

            {/* Tabs */}
            <div className="lab-tabs">
                {[
                    { id: 'analyze', label: lang === 'vi' ? '🔍 Phân tích' : '🔍 Analyzer' },
                    { id: 'bruteforce', label: lang === 'vi' ? '⚡ Brute Force' : '⚡ Brute Force' },
                    { id: 'generator', label: lang === 'vi' ? '🎲 Tạo mật khẩu' : '🎲 Generator' },
                ].map(tab => (
                    <button key={tab.id} className={`lab-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => { setActiveTab(tab.id); window.scrollTo({ top: 0, behavior: 'instant' }); }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ═══════ TAB 1: Password Analyzer ═══════ */}
            {activeTab === 'analyze' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {/* Input */}
                    <div className="lab-visual-panel">
                        <div className="lab-input-group">
                            <label className="lab-input-label">
                                🔑 {lang === 'vi' ? 'Nhập mật khẩu để phân tích' : 'Enter password to analyze'}
                            </label>
                            <div style={{ position: 'relative' }}>
                                <AIInput
                                    className="lab-input"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    placeholder={lang === 'vi' ? 'Thử nhập mật khẩu bất kỳ...' : 'Try any password...'}
                                    style={{ paddingRight: '2.5rem', fontSize: '1.1rem', letterSpacing: showPassword ? '0.05em' : '0.15em' }}
                                    labType="bruteforce"
                                />
                                <button
                                    onClick={() => setShowPassword(p => !p)}
                                    style={{
                                        position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', color: 'var(--lab-text-dim)',
                                        cursor: 'pointer', fontSize: '1.1rem', padding: '0.3rem',
                                    }}
                                >{showPassword ? '👁️' : '🙈'}</button>
                            </div>
                        </div>

                        {/* Quick test buttons */}
                        <div style={{ display: 'flex', gap: '0.4rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                            {['123456', 'password', 'P@ssw0rd!', 'correct-horse-battery', 'Kq$7!mX2pR@nL9vB'].map(pw => (
                                <button key={pw} className="lab-btn lab-btn-secondary"
                                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
                                    onClick={() => setPassword(pw)}>
                                    {pw.length > 12 ? pw.slice(0, 12) + '…' : pw}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Strength Analysis */}
                    {analysis && (
                        <>
                            {/* Strength Bar */}
                            <div className="lab-visual-panel">
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                                    <h3 className="lab-section-title" style={{ margin: 0 }}>
                                        💪 {lang === 'vi' ? 'Độ mạnh' : 'Strength'}
                                    </h3>
                                    <span style={{
                                        fontSize: '0.88rem', fontWeight: 800, color: analysis.strengthColor,
                                    }}>
                                        {analysis.score}% — {strengthLabels[lang][analysis.strength]}
                                    </span>
                                </div>

                                {/* Progress bar */}
                                <div style={{
                                    height: 14, borderRadius: 7, background: 'rgba(255,255,255,0.05)',
                                    overflow: 'hidden', marginBottom: '1.25rem',
                                }}>
                                    <div style={{
                                        height: '100%', borderRadius: 7,
                                        width: `${analysis.score}%`,
                                        background: `linear-gradient(90deg, ${analysis.strengthColor}, ${analysis.score > 60 ? 'var(--lab-cyan)' : analysis.strengthColor})`,
                                        transition: 'all 0.4s ease',
                                        boxShadow: `0 0 12px ${analysis.strengthColor}40`,
                                    }} />
                                </div>

                                {/* Checklist */}
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                    {[
                                        { ok: analysis.checks.length >= 8, label: lang === 'vi' ? `Độ dài: ${analysis.checks.length} ký tự` : `Length: ${analysis.checks.length} chars`, rec: '≥ 8' },
                                        { ok: analysis.checks.hasLower, label: lang === 'vi' ? 'Chữ thường (a-z)' : 'Lowercase (a-z)' },
                                        { ok: analysis.checks.hasUpper, label: lang === 'vi' ? 'Chữ hoa (A-Z)' : 'Uppercase (A-Z)' },
                                        { ok: analysis.checks.hasDigit, label: lang === 'vi' ? 'Số (0-9)' : 'Numbers (0-9)' },
                                        { ok: analysis.checks.hasSpecial, label: lang === 'vi' ? 'Ký tự đặc biệt (!@#$)' : 'Special chars (!@#$)' },
                                        { ok: !analysis.isCommon, bad: analysis.isCommon, label: lang === 'vi' ? 'Không phải mật khẩu phổ biến' : 'Not a common password' },
                                    ].map((item, i) => (
                                        <div key={i} style={{
                                            display: 'flex', alignItems: 'center', gap: '0.5rem',
                                            padding: '0.45rem 0.7rem', borderRadius: 6,
                                            background: item.bad ? 'var(--lab-red-dim)' : item.ok ? 'var(--lab-green-dim)' : 'rgba(255,255,255,0.02)',
                                            fontSize: '0.82rem',
                                            color: item.bad ? 'var(--lab-red)' : item.ok ? 'var(--lab-green)' : 'var(--lab-text-dim)',
                                        }}>
                                            <span style={{ fontSize: '1rem' }}>{item.bad ? '❌' : item.ok ? '✅' : '○'}</span>
                                            {item.label}
                                        </div>
                                    ))}
                                </div>

                                {/* Pattern warnings */}
                                {analysis.patterns.length > 0 && (
                                    <div style={{ marginTop: '1rem' }}>
                                        {analysis.patterns.map((p, i) => (
                                            <div key={i} style={{
                                                padding: '0.4rem 0.8rem', marginBottom: '0.3rem',
                                                background: 'var(--lab-yellow-dim)', borderRadius: 6,
                                                fontSize: '0.8rem', color: 'var(--lab-yellow)',
                                                borderLeft: '3px solid var(--lab-yellow)',
                                            }}>
                                                ⚠️ {p.label}
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {analysis.isCommon && (
                                    <div className="lab-theory-note danger" style={{ marginTop: '0.75rem' }}>
                                        🚨 {lang === 'vi'
                                            ? 'Mật khẩu này nằm trong TOP 50 mật khẩu phổ biến nhất! Bị crack trong < 1 giây.'
                                            : 'This password is in the TOP 50 most common passwords! Cracked in < 1 second.'
                                        }
                                    </div>
                                )}
                            </div>

                            {/* Entropy & Stats */}
                            <div className="lab-visual-panel">
                                <h3 className="lab-section-title">📊 {lang === 'vi' ? 'Thống kê kỹ thuật' : 'Technical Stats'}</h3>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
                                    {[
                                        { label: 'Entropy', value: `${analysis.entropy} bits`, icon: '🎲', color: analysis.entropy > 60 ? 'var(--lab-green)' : analysis.entropy > 35 ? 'var(--lab-yellow)' : 'var(--lab-red)' },
                                        { label: 'Pool Size', value: `${analysis.poolSize} chars`, icon: '🔤', color: 'var(--lab-blue)' },
                                        { label: lang === 'vi' ? 'Tổ hợp' : 'Combinations', value: analysis.totalCombinations > 1e15 ? `${(analysis.totalCombinations / 1e15).toFixed(1)}Q` : analysis.totalCombinations > 1e9 ? `${(analysis.totalCombinations / 1e9).toFixed(1)}B` : analysis.totalCombinations.toLocaleString(), icon: '🔢', color: 'var(--lab-purple)' },
                                        { label: lang === 'vi' ? 'Độ dài' : 'Length', value: `${password.length} chars`, icon: '📏', color: 'var(--lab-cyan)' },
                                    ].map((stat, i) => (
                                        <div key={i} style={{
                                            padding: '1rem', background: 'rgba(0,0,0,0.2)',
                                            borderRadius: 10, textAlign: 'center',
                                            borderTop: `3px solid ${stat.color}`,
                                        }}>
                                            <div style={{ fontSize: '1.4rem', marginBottom: '0.25rem' }}>{stat.icon}</div>
                                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: stat.color }}>{stat.value}</div>
                                            <div style={{ fontSize: '0.72rem', color: 'var(--lab-text-dim)', marginTop: '0.2rem' }}>{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Crack Time Estimates */}
                            <div className="lab-visual-panel">
                                <h3 className="lab-section-title">⏱️ {lang === 'vi' ? 'Thời gian crack ước tính' : 'Estimated Crack Time'}</h3>
                                <div style={{ display: 'grid', gap: '0.6rem' }}>
                                    {[
                                        { label: lang === 'vi' ? 'Online (10/s)' : 'Online attack (10/s)', time: analysis.crackTimes.online_10, desc: lang === 'vi' ? 'Tấn công qua web form' : 'Web form attack', icon: '🌐' },
                                        { label: lang === 'vi' ? 'Online nhanh (1K/s)' : 'Fast online (1K/s)', time: analysis.crackTimes.online_1k, desc: lang === 'vi' ? 'API không rate limit' : 'API without rate limit', icon: '⚡' },
                                        { label: lang === 'vi' ? 'Offline GPU (10B/s)' : 'Offline GPU (10B/s)', time: analysis.crackTimes.offline_10b, desc: lang === 'vi' ? 'Hash bị leak, crack với GPU' : 'Leaked hash, GPU cracking', icon: '🎮' },
                                        { label: lang === 'vi' ? 'Multi-GPU (100B/s)' : 'Multi-GPU (100B/s)', time: analysis.crackTimes.offline_100b, desc: lang === 'vi' ? 'Farm GPU chuyên dụng' : 'Dedicated GPU farm', icon: '🖥️' },
                                    ].map((item, i) => {
                                        const timeStr = fmt(item.time)
                                        const isDanger = item.time < 3600
                                        const isWarn = item.time < 86400 * 365
                                        return (
                                            <div key={i} style={{
                                                display: 'flex', alignItems: 'center', gap: '1rem',
                                                padding: '0.7rem 1rem',
                                                background: isDanger ? 'var(--lab-red-dim)' : isWarn ? 'rgba(0,0,0,0.15)' : 'var(--lab-green-dim)',
                                                borderRadius: 8,
                                                borderLeft: `3px solid ${isDanger ? 'var(--lab-red)' : isWarn ? 'var(--lab-yellow)' : 'var(--lab-green)'}`,
                                            }}>
                                                <span style={{ fontSize: '1.3rem' }}>{item.icon}</span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ fontWeight: 600, color: 'var(--lab-heading)', fontSize: '0.85rem' }}>{item.label}</div>
                                                    <div style={{ fontSize: '0.72rem', color: 'var(--lab-text-dim)' }}>{item.desc}</div>
                                                </div>
                                                <div style={{
                                                    fontWeight: 800, fontSize: '0.9rem',
                                                    color: isDanger ? 'var(--lab-red)' : isWarn ? 'var(--lab-yellow)' : 'var(--lab-green)',
                                                    textAlign: 'right',
                                                }}>
                                                    {timeStr}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ═══════ TAB 2: Brute Force Simulation ═══════ */}
            {activeTab === 'bruteforce' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            ⚡ {lang === 'vi' ? 'Mô phỏng Brute Force' : 'Brute Force Simulation'}
                        </h3>
                        <p style={{ color: 'var(--lab-text-dim)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            {lang === 'vi'
                                ? 'Nhập mật khẩu ngắn (≤ 6 ký tự) và xem máy tính thử từng tổ hợp để tìm ra mật khẩu!'
                                : 'Enter a short password (≤ 6 chars) and watch the computer try every combination to find it!'}
                        </p>

                        <div className="lab-input-group">
                            <label className="lab-input-label">
                                🎯 {lang === 'vi' ? 'Mật khẩu mục tiêu (≤ 6 ký tự)' : 'Target password (≤ 6 chars)'}
                            </label>
                            <AIInput
                                className="lab-input"
                                value={password}
                                onChange={e => setPassword(e.target.value.slice(0, 6))}
                                maxLength={6}
                                placeholder="abc"
                                style={{ fontSize: '1.2rem', letterSpacing: '0.1em' }}
                                labType="bruteforce"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                            <button className="lab-btn lab-btn-danger" onClick={startBruteForce}
                                disabled={bruteRunning || !password || password.length > 6}>
                                {bruteRunning ? '⏳' : '⚡'} {lang === 'vi' ? 'Bắt đầu Brute Force' : 'Start Brute Force'}
                            </button>
                            {bruteRunning && (
                                <button className="lab-btn lab-btn-secondary" onClick={stopBruteForce}>
                                    ⏹ {lang === 'vi' ? 'Dừng' : 'Stop'}
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Brute Force Live Display */}
                    {(bruteRunning || bruteAttempts > 0) && (
                        <div className="lab-visual-panel">
                            {/* Terminal-style display */}
                            <div style={{
                                background: '#0b0f19', borderRadius: 8, padding: '1.25rem',
                                fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem',
                                border: '1px solid var(--lab-border)',
                                minHeight: 120,
                            }}>
                                {/* Header */}
                                <div style={{ color: 'var(--lab-text-dim)', marginBottom: '0.75rem', display: 'flex', gap: '1rem' }}>
                                    <span>$ brute_force --target="{'*'.repeat(password.length)}"</span>
                                </div>

                                {/* Current attempt */}
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <span style={{ color: 'var(--lab-text-dim)' }}>
                                        {lang === 'vi' ? 'Đang thử: ' : 'Trying: '}
                                    </span>
                                    <span style={{
                                        color: bruteFound ? 'var(--lab-green)' : 'var(--lab-yellow)',
                                        fontWeight: 700, fontSize: '1.1rem',
                                    }}>
                                        {bruteCurrentTry || '...'}
                                    </span>
                                    {bruteRunning && <span className="lab-typing-cursor" />}
                                </div>

                                {/* Stats */}
                                <div style={{ display: 'flex', gap: '2rem', color: 'var(--lab-text-dim)', fontSize: '0.78rem' }}>
                                    <span>{lang === 'vi' ? 'Lần thử' : 'Attempts'}: <span style={{ color: 'var(--lab-cyan)' }}>{bruteAttempts.toLocaleString()}</span></span>
                                    <span>{lang === 'vi' ? 'Tốc độ' : 'Speed'}: <span style={{ color: 'var(--lab-cyan)' }}>{bruteSpeed.toLocaleString()}/s</span></span>
                                </div>

                                {/* Found! */}
                                {bruteFound && (
                                    <div style={{
                                        marginTop: '1rem', padding: '0.7rem',
                                        background: 'var(--lab-green-dim)',
                                        border: '1px solid rgba(63,185,80,0.3)',
                                        borderRadius: 6, color: 'var(--lab-green)',
                                    }}>
                                        🎉 {lang === 'vi'
                                            ? `TÌM THẤY! Mật khẩu "${bruteCurrentTry}" — sau ${bruteAttempts.toLocaleString()} lần thử`
                                            : `FOUND! Password "${bruteCurrentTry}" — after ${bruteAttempts.toLocaleString()} attempts`
                                        }
                                    </div>
                                )}
                            </div>

                            {/* Insight */}
                            <div className="lab-theory-note" style={{ marginTop: '1rem' }}>
                                💡 {lang === 'vi'
                                    ? `Demo này chạy ~${bruteSpeed.toLocaleString()} thử/giây trong trình duyệt. GPU thực tế chạy tới 100 TỶ thử/giây — nhanh gấp ${bruteSpeed > 0 ? Math.round(1e10 / bruteSpeed).toLocaleString() : '?'} lần!`
                                    : `This demo runs ~${bruteSpeed.toLocaleString()} tries/sec in browser. Real GPUs run up to 100 BILLION tries/sec — ${bruteSpeed > 0 ? Math.round(1e10 / bruteSpeed).toLocaleString() : '?'}x faster!`
                                }
                            </div>
                        </div>
                    )}

                    {/* How brute force scales */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">📈 {lang === 'vi' ? 'Brute Force theo độ dài' : 'Brute Force by Length'}</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--lab-border)' }}>
                                        {[
                                            lang === 'vi' ? 'Độ dài' : 'Length',
                                            lang === 'vi' ? 'Chỉ số (a-z)' : 'Lowercase only',
                                            lang === 'vi' ? 'Hỗn hợp' : 'Mixed case + digits',
                                            lang === 'vi' ? 'Đầy đủ (+special)' : 'Full charset',
                                        ].map(h => (
                                            <th key={h} style={{ padding: '0.6rem', textAlign: 'left', color: 'var(--lab-text-dim)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[4, 6, 8, 10, 12, 16].map(len => {
                                        const t1 = Math.pow(26, len) / 1e10
                                        const t2 = Math.pow(62, len) / 1e10
                                        const t3 = Math.pow(95, len) / 1e10
                                        return (
                                            <tr key={len} style={{
                                                borderBottom: '1px solid rgba(255,255,255,0.04)',
                                                background: password.length === len ? 'rgba(88,166,255,0.05)' : 'transparent',
                                            }}>
                                                <td style={{ padding: '0.6rem', fontWeight: 700, color: 'var(--lab-heading)' }}>{len} chars</td>
                                                <td style={{ padding: '0.6rem', color: t1 < 1 ? 'var(--lab-red)' : t1 < 86400 ? 'var(--lab-yellow)' : 'var(--lab-green)' }}>{fmt(t1)}</td>
                                                <td style={{ padding: '0.6rem', color: t2 < 1 ? 'var(--lab-red)' : t2 < 86400 ? 'var(--lab-yellow)' : 'var(--lab-green)' }}>{fmt(t2)}</td>
                                                <td style={{ padding: '0.6rem', color: t3 < 1 ? 'var(--lab-red)' : t3 < 86400 ? 'var(--lab-yellow)' : 'var(--lab-green)' }}>{fmt(t3)}</td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--lab-text-dim)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                            * {lang === 'vi' ? 'Ước tính với tốc độ 10 tỷ thử/giây (single GPU)' : 'Estimated at 10 billion tries/sec (single GPU)'}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════ TAB 3: Password Generator ═══════ */}
            {activeTab === 'generator' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            🎲 {lang === 'vi' ? 'Tạo mật khẩu an toàn' : 'Generate Secure Password'}
                        </h3>

                        {/* Length slider */}
                        <div className="lab-input-group">
                            <label className="lab-input-label">
                                📏 {lang === 'vi' ? 'Độ dài' : 'Length'}: <strong style={{ color: 'var(--lab-cyan)' }}>{genLength}</strong>
                            </label>
                            <input type="range" min="4" max="64" value={genLength}
                                onChange={e => setGenLength(parseInt(e.target.value))}
                                style={{ width: '100%', accentColor: 'var(--lab-blue)', background: 'transparent', cursor: 'pointer' }}
                            />
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--lab-text-dim)' }}>
                                <span>4</span><span>16</span><span>32</span><span>64</span>
                            </div>
                        </div>

                        {/* Character options */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginTop: '0.75rem' }}>
                            {[
                                { key: 'lower', value: genLower, set: setGenLower, label: 'a-z', desc: lang === 'vi' ? 'Chữ thường' : 'Lowercase' },
                                { key: 'upper', value: genUpper, set: setGenUpper, label: 'A-Z', desc: lang === 'vi' ? 'Chữ hoa' : 'Uppercase' },
                                { key: 'digits', value: genDigits, set: setGenDigits, label: '0-9', desc: lang === 'vi' ? 'Chữ số' : 'Digits' },
                                { key: 'special', value: genSpecial, set: setGenSpecial, label: '!@#$', desc: lang === 'vi' ? 'Đặc biệt' : 'Special' },
                            ].map(opt => (
                                <label key={opt.key} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.6rem',
                                    padding: '0.6rem 0.8rem', borderRadius: 8, cursor: 'pointer',
                                    background: opt.value ? 'var(--lab-blue-dim)' : 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${opt.value ? 'rgba(88,166,255,0.2)' : 'var(--lab-border)'}`,
                                    transition: 'all 0.2s',
                                }}>
                                    <input type="checkbox" checked={opt.value}
                                        onChange={e => opt.set(e.target.checked)}
                                        style={{ accentColor: 'var(--lab-blue)' }} />
                                    <div>
                                        <div style={{ fontWeight: 700, color: opt.value ? 'var(--lab-blue)' : 'var(--lab-text-dim)', fontSize: '0.9rem' }}>{opt.label}</div>
                                        <div style={{ fontSize: '0.72rem', color: 'var(--lab-text-dim)' }}>{opt.desc}</div>
                                    </div>
                                </label>
                            ))}
                        </div>

                        {/* Generate button */}
                        <button className="lab-btn lab-btn-primary" style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}
                            onClick={handleGenerate}>
                            🎲 {lang === 'vi' ? 'Tạo mật khẩu mới' : 'Generate New Password'}
                        </button>
                    </div>

                    {/* Generated password display */}
                    {generatedPw && (
                        <div className="lab-visual-panel">
                            <div style={{
                                padding: '1rem', background: 'rgba(0,0,0,0.3)',
                                borderRadius: 8, fontFamily: "'JetBrains Mono', monospace",
                                fontSize: '1.1rem', fontWeight: 700,
                                color: 'var(--lab-cyan)', wordBreak: 'break-all',
                                letterSpacing: '0.05em', textAlign: 'center',
                                border: '1px solid var(--lab-border)',
                                position: 'relative',
                            }}>
                                {generatedPw}
                                <button
                                    onClick={() => handleCopy(generatedPw)}
                                    style={{
                                        position: 'absolute', right: 8, top: 8,
                                        background: 'rgba(255,255,255,0.05)',
                                        border: '1px solid var(--lab-border)',
                                        borderRadius: 4, padding: '0.3rem 0.5rem',
                                        color: 'var(--lab-text-dim)', cursor: 'pointer',
                                        fontSize: '0.75rem',
                                    }}
                                >📋 Copy</button>
                            </div>

                            {/* Analysis of generated password */}
                            {(() => {
                                const genAnalysis = analyzePassword(generatedPw)
                                if (!genAnalysis) return null
                                return (
                                    <div style={{
                                        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginTop: '1rem',
                                    }}>
                                        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: genAnalysis.strengthColor }}>{genAnalysis.score}%</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--lab-text-dim)' }}>{lang === 'vi' ? 'Độ mạnh' : 'Strength'}</div>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--lab-purple)' }}>{genAnalysis.entropy}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--lab-text-dim)' }}>Bits entropy</div>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--lab-green)' }}>{generatedPw.length}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--lab-text-dim)' }}>{lang === 'vi' ? 'Ký tự' : 'Chars'}</div>
                                        </div>
                                        <div style={{ textAlign: 'center', padding: '0.75rem', background: 'rgba(0,0,0,0.2)', borderRadius: 8 }}>
                                            <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--lab-cyan)' }}>{fmt(genAnalysis.crackTimes.offline_10b)}</div>
                                            <div style={{ fontSize: '0.7rem', color: 'var(--lab-text-dim)' }}>GPU crack</div>
                                        </div>
                                    </div>
                                )
                            })()}

                            <button className="lab-btn lab-btn-secondary" style={{ marginTop: '0.75rem' }}
                                onClick={() => { setPassword(generatedPw); setActiveTab('analyze') }}>
                                🔍 {lang === 'vi' ? 'Phân tích chi tiết' : 'Analyze in detail'}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
