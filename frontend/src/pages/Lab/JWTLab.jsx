import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import AIInput from '../../components/common/AIInput'
/* ──────────────────────────────────────
   BASE64URL HELPERS
   ────────────────────────────────────── */
function base64UrlEncode(str) {
    return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str) {
    let s = str.replace(/-/g, '+').replace(/_/g, '/')
    while (s.length % 4) s += '='
    try { return atob(s) } catch { return '' }
}

function tryParseJSON(str) {
    try { return JSON.parse(str) } catch { return null }
}

/* ──────────────────────────────────────
   FAKE HMAC SIGNATURE
   ────────────────────────────────────── */
async function computeHMAC(data, secret) {
    const enc = new TextEncoder()
    const key = await crypto.subtle.importKey(
        'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    )
    const sig = await crypto.subtle.sign('HMAC', key, enc.encode(data))
    const bytes = new Uint8Array(sig)
    let binary = ''
    bytes.forEach(b => { binary += String.fromCharCode(b) })
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/* ──────────────────────────────────────
   SAMPLE JWTS
   ────────────────────────────────────── */
const SAMPLE_JWTS = {
    basic: {
        label: 'Basic User Token',
        token: null, // will be generated
        header: { alg: 'HS256', typ: 'JWT' },
        payload: {
            sub: '1234567890',
            name: 'Alice Nguyen',
            email: 'alice@example.com',
            role: 'user',
            iat: 1740000000,
            exp: 1740086400,
        },
        secret: 'my-secret-key-256',
    },
    admin: {
        label: 'Admin Token',
        token: null,
        header: { alg: 'HS256', typ: 'JWT' },
        payload: {
            sub: '0001',
            name: 'Admin',
            email: 'admin@corp.net',
            roles: ['ROLE_ADMIN', 'ROLE_USER'],
            permissions: ['read', 'write', 'delete', 'manage_users'],
            iat: 1740000000,
            exp: 1740086400,
        },
        secret: 'super-secret-admin-key',
    },
    expired: {
        label: 'Expired Token',
        token: null,
        header: { alg: 'HS256', typ: 'JWT' },
        payload: {
            sub: '9999',
            name: 'Bob',
            iat: 1700000000,
            exp: 1700003600, // already expired
        },
        secret: 'expired-key',
    },
}

// Build sample tokens
function buildSampleToken(sample) {
    const h = base64UrlEncode(JSON.stringify(sample.header))
    const p = base64UrlEncode(JSON.stringify(sample.payload))
    // fake signature for display (real HMAC done async)
    const s = base64UrlEncode('fake-sig-for-display-' + sample.secret.slice(0, 5))
    return `${h}.${p}.${s}`
}

Object.keys(SAMPLE_JWTS).forEach(k => {
    SAMPLE_JWTS[k].token = buildSampleToken(SAMPLE_JWTS[k])
})

/* ──────────────────────────────────────
   JWT DECODER
   ────────────────────────────────────── */
function decodeJWT(token) {
    const parts = token.split('.')
    if (parts.length !== 3) return { valid: false, error: 'JWT must have 3 parts (header.payload.signature)' }

    const headerRaw = base64UrlDecode(parts[0])
    const payloadRaw = base64UrlDecode(parts[1])

    const header = tryParseJSON(headerRaw)
    const payload = tryParseJSON(payloadRaw)

    if (!header) return { valid: false, error: 'Invalid header — not valid Base64URL JSON' }
    if (!payload) return { valid: false, error: 'Invalid payload — not valid Base64URL JSON' }

    // Check expiry
    const now = Math.floor(Date.now() / 1000)
    let expired = false
    let expiresIn = null
    if (payload.exp) {
        expired = payload.exp < now
        expiresIn = payload.exp - now
    }

    return {
        valid: true,
        parts,
        header,
        payload,
        signature: parts[2],
        expired,
        expiresIn,
        headerRaw,
        payloadRaw,
    }
}

/* ──────────────────────────────────────
   PRETTY JSON
   ────────────────────────────────────── */
function PrettyJSON({ data, color }) {
    const json = JSON.stringify(data, null, 2)
    // Simple syntax highlighting
    const highlighted = json
        .replace(/"([^"]+)":/g, `<span style="color:${color || '#bc8cff'}">"$1"</span>:`)
        .replace(/: "([^"]*)"/g, ': <span style="color:#3fb950">"$1"</span>')
        .replace(/: (\d+)/g, ': <span style="color:#58a6ff">$1</span>')
        .replace(/: (true|false)/g, ': <span style="color:#f0883e">$1</span>')
        .replace(/: (null)/g, ': <span style="color:#6e7a8a">$1</span>')

    return (
        <pre style={{
            margin: 0, padding: '0.8rem 1rem', background: '#0b0f19', borderRadius: 6,
            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', lineHeight: 1.7,
            overflowX: 'auto', wordBreak: 'break-all',
        }} dangerouslySetInnerHTML={{ __html: highlighted }} />
    )
}

/* ──────────────────────────────────────
   THEORY SIDEBAR
   ────────────────────────────────────── */
function JWTTheory({ lang }) {
    if (lang === 'vi') {
        return (
            <>
                <h3>JWT là gì?</h3>
                <p>JSON Web Token (JWT) là chuẩn mở (RFC 7519) để truyền thông tin an toàn giữa các bên dưới dạng JSON object, được ký số để đảm bảo tính toàn vẹn.</p>

                <h3>Cấu trúc JWT</h3>
                <ul>
                    <li><strong style={{ color: '#f85149' }}>Header</strong> — Thuật toán ký (alg) và loại token (typ)</li>
                    <li><strong style={{ color: '#bc8cff' }}>Payload</strong> — Claims: dữ liệu người dùng (sub, name, role, exp...)</li>
                    <li><strong style={{ color: '#58a6ff' }}>Signature</strong> — Chữ ký số: HMAC(header + payload, secret)</li>
                </ul>

                <h3>Registered Claims</h3>
                <ul>
                    <li><strong>iss</strong> — Issuer (ai phát hành)</li>
                    <li><strong>sub</strong> — Subject (user ID)</li>
                    <li><strong>aud</strong> — Audience (dành cho ai)</li>
                    <li><strong>exp</strong> — Expiration (hết hạn lúc nào)</li>
                    <li><strong>iat</strong> — Issued At (phát hành lúc nào)</li>
                    <li><strong>nbf</strong> — Not Before (chưa hiệu lực trước)</li>
                </ul>

                <h3>Lỗ hổng JWT phổ biến</h3>
                <ul>
                    <li>🚨 <strong>alg: none</strong> — Bỏ qua signature</li>
                    <li>🚨 <strong>Weak secret</strong> — Brute-force key</li>
                    <li>🚨 <strong>No expiry</strong> — Token sống mãi</li>
                    <li>🚨 <strong>Payload tampering</strong> — Sửa role</li>
                </ul>

                <div className="lab-theory-note danger">
                    ⚠️ JWT payload KHÔNG được mã hóa! Bất kỳ ai cũng có thể đọc (decode Base64). Chỉ có signature đảm bảo tính toàn vẹn.
                </div>
            </>
        )
    }

    return (
        <>
            <h3>What is JWT?</h3>
            <p>JSON Web Token (JWT) is an open standard (RFC 7519) for securely transmitting information between parties as a JSON object, digitally signed to ensure integrity.</p>

            <h3>JWT Structure</h3>
            <ul>
                <li><strong style={{ color: '#f85149' }}>Header</strong> — Signing algorithm (alg) and token type (typ)</li>
                <li><strong style={{ color: '#bc8cff' }}>Payload</strong> — Claims: user data (sub, name, role, exp...)</li>
                <li><strong style={{ color: '#58a6ff' }}>Signature</strong> — Digital sig: HMAC(header + payload, secret)</li>
            </ul>

            <h3>Registered Claims</h3>
            <ul>
                <li><strong>iss</strong> — Issuer (who issued it)</li>
                <li><strong>sub</strong> — Subject (user ID)</li>
                <li><strong>aud</strong> — Audience (intended for)</li>
                <li><strong>exp</strong> — Expiration (when it expires)</li>
                <li><strong>iat</strong> — Issued At (when it was issued)</li>
                <li><strong>nbf</strong> — Not Before (not valid before)</li>
            </ul>

            <h3>Common JWT Vulnerabilities</h3>
            <ul>
                <li>🚨 <strong>alg: none</strong> — Skip signature verification</li>
                <li>🚨 <strong>Weak secret</strong> — Brute-force the key</li>
                <li>🚨 <strong>No expiry</strong> — Token lives forever</li>
                <li>🚨 <strong>Payload tampering</strong> — Modify role claim</li>
            </ul>

            <div className="lab-theory-note danger">
                ⚠️ JWT payload is NOT encrypted! Anyone can read it (Base64 decode). Only the signature ensures integrity.
            </div>
        </>
    )
}

/* ──────────────────────────────────────
   MAIN COMPONENT
   ────────────────────────────────────── */
export default function JWTLab() {
    const { t, lang } = useLanguage()
    const { setTheory } = useOutletContext()

    const [activeTab, setActiveTab] = useState('decoder')

    // Decoder state
    const [tokenInput, setTokenInput] = useState(SAMPLE_JWTS.basic.token)
    const decoded = useMemo(() => decodeJWT(tokenInput), [tokenInput])

    // Creator state
    const [creatorHeader, setCreatorHeader] = useState(JSON.stringify({ alg: 'HS256', typ: 'JWT' }, null, 2))
    const [creatorPayload, setCreatorPayload] = useState(JSON.stringify({
        sub: '12345',
        name: 'Your Name',
        email: 'you@example.com',
        role: 'user',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
    }, null, 2))
    const [creatorSecret, setCreatorSecret] = useState('my-secret-key-256')
    const [createdToken, setCreatedToken] = useState('')
    const [signatureValid, setSignatureValid] = useState(null)

    // Verify state
    const [verifySecret, setVerifySecret] = useState('')
    const [verifyResult, setVerifyResult] = useState(null)

    // Theory
    useEffect(() => { setTheory(<JWTTheory lang={lang} />) }, [setTheory, lang])

    // Create JWT
    const createJWT = useCallback(async () => {
        try {
            const header = JSON.parse(creatorHeader)
            const payload = JSON.parse(creatorPayload)
            const h = base64UrlEncode(JSON.stringify(header))
            const p = base64UrlEncode(JSON.stringify(payload))
            const sig = await computeHMAC(`${h}.${p}`, creatorSecret)
            setCreatedToken(`${h}.${p}.${sig}`)
        } catch (e) {
            setCreatedToken('Error: ' + e.message)
        }
    }, [creatorHeader, creatorPayload, creatorSecret])

    // Verify signature
    const verifySignature = useCallback(async () => {
        if (!decoded.valid || !verifySecret) {
            setVerifyResult({ valid: false, message: lang === 'vi' ? 'Nhập secret key' : 'Enter secret key' })
            return
        }
        const { parts } = decoded
        const expectedSig = await computeHMAC(`${parts[0]}.${parts[1]}`, verifySecret)
        const isValid = expectedSig === parts[2]
        setVerifyResult({
            valid: isValid,
            message: isValid
                ? (lang === 'vi' ? 'Chữ ký HỢP LỆ ✅' : 'Signature is VALID ✅')
                : (lang === 'vi' ? 'Chữ ký KHÔNG hợp lệ ❌' : 'Signature is INVALID ❌'),
            expected: expectedSig,
            actual: parts[2],
        })
    }, [decoded, verifySecret, lang])

    // Format timestamp
    function formatTimestamp(ts) {
        if (!ts) return '—'
        try { return new Date(ts * 1000).toLocaleString() } catch { return String(ts) }
    }

    function formatTimeRemaining(seconds) {
        if (seconds <= 0) return lang === 'vi' ? 'ĐÃ HẾT HẠN' : 'EXPIRED'
        const h = Math.floor(seconds / 3600)
        const m = Math.floor((seconds % 3600) / 60)
        if (h > 24) return `${Math.floor(h / 24)}d ${h % 24}h`
        if (h > 0) return `${h}h ${m}m`
        return `${m}m ${seconds % 60}s`
    }

    return (
        <div className="lab-animate-in">
            {/* Title */}
            <div className="lab-section">
                <h2 className="lab-section-title" style={{ fontSize: '1.3rem' }}>
                    🎫 {t('lab_jwt_title')}
                </h2>
                <p style={{ color: 'var(--lab-text-dim)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    {t('lab_jwt_desc')}
                </p>
            </div>

            {/* Tabs */}
            <div className="lab-tabs">
                {[
                    { id: 'decoder', label: lang === 'vi' ? '🔍 Giải mã' : '🔍 Decoder' },
                    { id: 'creator', label: lang === 'vi' ? '🔨 Tạo JWT' : '🔨 Creator' },
                    { id: 'security', label: lang === 'vi' ? '🛡️ Bảo mật' : '🛡️ Security' },
                ].map(tab => (
                    <button key={tab.id} className={`lab-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => { setActiveTab(tab.id); window.scrollTo({ top: 0, behavior: 'instant' }); }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ═══════ TAB 1: Decoder ═══════ */}
            {activeTab === 'decoder' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {/* JWT Input */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">🔍 {lang === 'vi' ? 'Nhập JWT Token' : 'Paste JWT Token'}</h3>

                        {/* Sample buttons */}
                        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                            {Object.entries(SAMPLE_JWTS).map(([key, sample]) => (
                                <button key={key} className="lab-btn lab-btn-secondary"
                                    onClick={() => { setTokenInput(sample.token); setVerifyResult(null); setVerifySecret('') }}
                                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}>
                                    {sample.label}
                                </button>
                            ))}
                        </div>

                        <AIInput as="textarea" className="lab-input" value={tokenInput}
                            onChange={e => { setTokenInput(e.target.value); setVerifyResult(null) }}
                            rows={4}
                            labType="jwt"
                            placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0..."
                            style={{
                                fontSize: '0.78rem',
                                lineHeight: 1.6, width: '100%',
                                wordBreak: 'break-all',
                            }} />

                        {/* Color-coded token */}
                        {decoded.valid && (
                            <div style={{
                                marginTop: '0.75rem', padding: '0.6rem 0.9rem', background: '#0b0f19',
                                borderRadius: 6, fontSize: '0.75rem', fontFamily: "'JetBrains Mono', monospace",
                                lineHeight: 1.8, wordBreak: 'break-all',
                            }}>
                                <span style={{ color: '#f85149' }}>{decoded.parts[0]}</span>
                                <span style={{ color: 'var(--lab-text-dim)' }}>.</span>
                                <span style={{ color: '#bc8cff' }}>{decoded.parts[1]}</span>
                                <span style={{ color: 'var(--lab-text-dim)' }}>.</span>
                                <span style={{ color: '#58a6ff' }}>{decoded.parts[2]}</span>
                            </div>
                        )}
                    </div>

                    {/* Decoded output */}
                    {!decoded.valid && tokenInput && (
                        <div className="lab-visual-panel" style={{ borderLeft: '3px solid var(--lab-red)' }}>
                            <div style={{ color: 'var(--lab-red)', fontWeight: 700, fontSize: '0.88rem' }}>
                                ❌ {decoded.error}
                            </div>
                        </div>
                    )}

                    {decoded.valid && (
                        <>
                            {/* Header + Payload side by side */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                {/* Header */}
                                <div className="lab-visual-panel" style={{ borderTop: '3px solid #f85149' }}>
                                    <h3 className="lab-section-title" style={{ color: '#f85149' }}>
                                        📋 HEADER
                                    </h3>
                                    <PrettyJSON data={decoded.header} color="#f85149" />
                                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: 'var(--lab-text-dim)' }}>
                                        <div>🔐 Algorithm: <strong style={{ color: '#f85149' }}>{decoded.header.alg}</strong></div>
                                        <div>📌 Type: <strong>{decoded.header.typ || 'JWT'}</strong></div>
                                    </div>
                                </div>

                                {/* Payload */}
                                <div className="lab-visual-panel" style={{ borderTop: '3px solid #bc8cff' }}>
                                    <h3 className="lab-section-title" style={{ color: '#bc8cff' }}>
                                        📦 PAYLOAD (Claims)
                                    </h3>
                                    <PrettyJSON data={decoded.payload} color="#bc8cff" />

                                    {/* Timestamps */}
                                    <div style={{ marginTop: '0.75rem', display: 'grid', gap: '0.3rem', fontSize: '0.75rem' }}>
                                        {decoded.payload.iat && (
                                            <div style={{ color: 'var(--lab-text-dim)' }}>
                                                📅 Issued: <strong>{formatTimestamp(decoded.payload.iat)}</strong>
                                            </div>
                                        )}
                                        {decoded.payload.exp && (
                                            <div style={{ color: decoded.expired ? 'var(--lab-red)' : 'var(--lab-green)' }}>
                                                ⏰ Expires: <strong>{formatTimestamp(decoded.payload.exp)}</strong>
                                                {' '}({formatTimeRemaining(decoded.expiresIn)})
                                            </div>
                                        )}
                                    </div>

                                    {/* Expiry badge */}
                                    {decoded.payload.exp && (
                                        <div style={{
                                            marginTop: '0.5rem', padding: '0.4rem 0.7rem', borderRadius: 6,
                                            background: decoded.expired ? 'var(--lab-red-dim)' : 'var(--lab-green-dim)',
                                            color: decoded.expired ? 'var(--lab-red)' : 'var(--lab-green)',
                                            fontSize: '0.78rem', fontWeight: 700, textAlign: 'center',
                                        }}>
                                            {decoded.expired
                                                ? `🚫 ${lang === 'vi' ? 'TOKEN ĐÃ HẾT HẠN' : 'TOKEN EXPIRED'}`
                                                : `✅ ${lang === 'vi' ? 'Token còn hiệu lực' : 'Token is valid'}`
                                            }
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Signature verification */}
                            <div className="lab-visual-panel" style={{ borderTop: '3px solid #58a6ff' }}>
                                <h3 className="lab-section-title" style={{ color: '#58a6ff' }}>
                                    🔐 SIGNATURE {lang === 'vi' ? 'Verification' : 'Verification'}
                                </h3>
                                <div style={{ fontSize: '0.82rem', color: 'var(--lab-text-dim)', marginBottom: '0.75rem' }}>
                                    {lang === 'vi'
                                        ? 'Nhập secret key để xác minh chữ ký. Nếu key đúng → signature match.'
                                        : 'Enter the secret key to verify signature. If key is correct → signature matches.'}
                                </div>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <AIInput className="lab-input" value={verifySecret}
                                        onChange={e => { setVerifySecret(e.target.value); setVerifyResult(null) }}
                                        placeholder={lang === 'vi' ? 'Nhập secret key...' : 'Enter secret key...'}
                                        labType="jwt"
                                        style={{ flex: 1, fontSize: '0.82rem' }} />
                                    <button className="lab-btn lab-btn-primary" onClick={verifySignature}>
                                        🔍 {lang === 'vi' ? 'Xác minh' : 'Verify'}
                                    </button>
                                </div>

                                {/* Quick secret buttons */}
                                <div style={{ display: 'flex', gap: 4, marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                    {Object.entries(SAMPLE_JWTS).map(([key, s]) => (
                                        <button key={key} className="lab-btn lab-btn-secondary"
                                            onClick={() => setVerifySecret(s.secret)}
                                            style={{ fontSize: '0.68rem', padding: '0.2rem 0.4rem' }}>
                                            🔑 {s.label}: {s.secret}
                                        </button>
                                    ))}
                                </div>

                                {verifyResult && (
                                    <div style={{
                                        marginTop: '0.75rem', padding: '0.6rem 0.9rem', borderRadius: 6,
                                        background: verifyResult.valid ? 'var(--lab-green-dim)' : 'var(--lab-red-dim)',
                                        borderLeft: `3px solid ${verifyResult.valid ? 'var(--lab-green)' : 'var(--lab-red)'}`,
                                    }}>
                                        <div style={{
                                            fontWeight: 700, fontSize: '0.88rem',
                                            color: verifyResult.valid ? 'var(--lab-green)' : 'var(--lab-red)',
                                        }}>
                                            {verifyResult.message}
                                        </div>
                                        {verifyResult.expected && !verifyResult.valid && (
                                            <div style={{ marginTop: '0.3rem', fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--lab-text-dim)' }}>
                                                <div>{lang === 'vi' ? 'Mong đợi' : 'Expected'}: <span style={{ color: 'var(--lab-green)' }}>{verifyResult.expected.slice(0, 30)}...</span></div>
                                                <div>{lang === 'vi' ? 'Thực tế' : 'Got'}:&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<span style={{ color: 'var(--lab-red)' }}>{verifyResult.actual.slice(0, 30)}...</span></div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Signature formula */}
                                <div style={{
                                    marginTop: '0.75rem', padding: '0.5rem 0.8rem', background: '#0b0f19',
                                    borderRadius: 6, fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: '0.75rem', color: 'var(--lab-text-dim)', lineHeight: 1.8,
                                }}>
                                    <span style={{ color: '#58a6ff' }}>signature</span> = HMAC_SHA256({'\n'}
                                    {'  '}<span style={{ color: '#f85149' }}>base64UrlEncode(header)</span> + "." +{'\n'}
                                    {'  '}<span style={{ color: '#bc8cff' }}>base64UrlEncode(payload)</span>,{'\n'}
                                    {'  '}<span style={{ color: '#3fb950' }}>secret_key</span>{'\n'}
                                    )
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* ═══════ TAB 2: Creator ═══════ */}
            {activeTab === 'creator' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {/* Header editor */}
                        <div className="lab-visual-panel" style={{ borderTop: '3px solid #f85149' }}>
                            <h3 className="lab-section-title" style={{ color: '#f85149' }}>📋 Header</h3>
                            <textarea className="lab-input" value={creatorHeader}
                                onChange={e => setCreatorHeader(e.target.value)}
                                rows={4}
                                style={{
                                    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem',
                                    resize: 'vertical', width: '100%',
                                }} />
                        </div>

                        {/* Payload editor */}
                        <div className="lab-visual-panel" style={{ borderTop: '3px solid #bc8cff' }}>
                            <h3 className="lab-section-title" style={{ color: '#bc8cff' }}>📦 Payload</h3>
                            <textarea className="lab-input" value={creatorPayload}
                                onChange={e => setCreatorPayload(e.target.value)}
                                rows={10}
                                style={{
                                    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem',
                                    resize: 'vertical', width: '100%',
                                }} />
                            {/* Quick claim buttons */}
                            <div style={{ display: 'flex', gap: 4, marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                {[
                                    {
                                        label: '+1h exp', fn: () => {
                                            try {
                                                const p = JSON.parse(creatorPayload)
                                                p.exp = Math.floor(Date.now() / 1000) + 3600
                                                p.iat = Math.floor(Date.now() / 1000)
                                                setCreatorPayload(JSON.stringify(p, null, 2))
                                            } catch { }
                                        }
                                    },
                                    {
                                        label: '+24h exp', fn: () => {
                                            try {
                                                const p = JSON.parse(creatorPayload)
                                                p.exp = Math.floor(Date.now() / 1000) + 86400
                                                p.iat = Math.floor(Date.now() / 1000)
                                                setCreatorPayload(JSON.stringify(p, null, 2))
                                            } catch { }
                                        }
                                    },
                                    {
                                        label: 'Add admin role', fn: () => {
                                            try {
                                                const p = JSON.parse(creatorPayload)
                                                p.role = 'admin'
                                                setCreatorPayload(JSON.stringify(p, null, 2))
                                            } catch { }
                                        }
                                    },
                                ].map((btn, i) => (
                                    <button key={i} className="lab-btn lab-btn-secondary" onClick={btn.fn}
                                        style={{ fontSize: '0.68rem', padding: '0.2rem 0.4rem' }}>
                                        {btn.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Secret + Generate */}
                    <div className="lab-visual-panel" style={{ borderTop: '3px solid #58a6ff' }}>
                        <h3 className="lab-section-title" style={{ color: '#58a6ff' }}>🔑 Secret Key</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <AIInput className="lab-input" value={creatorSecret}
                                onChange={e => setCreatorSecret(e.target.value)}
                                placeholder="your-secret-key"
                                labType="jwt"
                                style={{ flex: 1, fontSize: '0.82rem' }} />
                            <button className="lab-btn lab-btn-primary" onClick={createJWT}>
                                🔨 {lang === 'vi' ? 'Tạo JWT' : 'Generate JWT'}
                            </button>
                        </div>
                    </div>

                    {/* Generated token */}
                    {createdToken && (
                        <div className="lab-visual-panel">
                            <h3 className="lab-section-title">🎫 {lang === 'vi' ? 'JWT đã tạo' : 'Generated JWT'}</h3>
                            <div style={{
                                padding: '0.8rem 1rem', background: '#0b0f19', borderRadius: 6,
                                fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem',
                                wordBreak: 'break-all', lineHeight: 1.8,
                                cursor: 'pointer',
                            }} onClick={() => navigator.clipboard?.writeText(createdToken)}>
                                {createdToken.startsWith('Error') ? (
                                    <span style={{ color: 'var(--lab-red)' }}>{createdToken}</span>
                                ) : (
                                    <>
                                        <span style={{ color: '#f85149' }}>{createdToken.split('.')[0]}</span>
                                        <span style={{ color: 'var(--lab-text-dim)' }}>.</span>
                                        <span style={{ color: '#bc8cff' }}>{createdToken.split('.')[1]}</span>
                                        <span style={{ color: 'var(--lab-text-dim)' }}>.</span>
                                        <span style={{ color: '#58a6ff' }}>{createdToken.split('.')[2]}</span>
                                    </>
                                )}
                            </div>
                            {!createdToken.startsWith('Error') && (
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                    <button className="lab-btn lab-btn-secondary"
                                        onClick={() => navigator.clipboard?.writeText(createdToken)}
                                        style={{ fontSize: '0.75rem' }}>
                                        📋 {lang === 'vi' ? 'Sao chép' : 'Copy'}
                                    </button>
                                    <button className="lab-btn lab-btn-secondary"
                                        onClick={() => { setTokenInput(createdToken); setActiveTab('decoder') }}
                                        style={{ fontSize: '0.75rem' }}>
                                        🔍 {lang === 'vi' ? 'Decode token này' : 'Decode this token'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* ═══════ TAB 3: Security ═══════ */}
            {activeTab === 'security' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {/* Vulnerabilities */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">🚨 {lang === 'vi' ? 'Lỗ hổng JWT phổ biến' : 'Common JWT Vulnerabilities'}</h3>
                        <div style={{ display: 'grid', gap: '1.25rem' }}>
                            {/* 1. alg:none */}
                            <div style={{ borderLeft: '3px solid var(--lab-red)', paddingLeft: '1rem' }}>
                                <h4 style={{ color: 'var(--lab-red)', fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                                    1. Algorithm None Attack (alg: "none")
                                </h4>
                                <p style={{ fontSize: '0.82rem', color: 'var(--lab-text-dim)', marginBottom: '0.5rem' }}>
                                    {lang === 'vi'
                                        ? 'Kẻ tấn công sửa header thành alg:"none" và bỏ signature. Server không kiểm tra → chấp nhận token giả.'
                                        : 'Attacker changes header to alg:"none" and removes signature. Server skips validation → accepts forged token.'}
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--lab-red)', marginBottom: '0.2rem' }}>❌ VULNERABLE</div>
                                        <div className="lab-code" style={{ fontSize: '0.72rem' }}>
                                            <span className="comment">// Attacker modifies header</span>{'\n'}
                                            {'{'}<span className="danger-hl">"alg": "none"</span>, "typ": "JWT"{'}'}{'\n'}
                                            {'\n'}
                                            <span className="comment">// Server blindly trusts alg</span>{'\n'}
                                            jwt.verify(token, secret, {'{'}{'\n'}
                                            {'  '}algorithms: [<span className="danger-hl">header.alg</span>]{'\n'}
                                            {'}'})
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--lab-green)', marginBottom: '0.2rem' }}>✅ SAFE</div>
                                        <div className="lab-code" style={{ fontSize: '0.72rem' }}>
                                            <span className="comment">// Whitelist algorithms</span>{'\n'}
                                            jwt.verify(token, secret, {'{'}{'\n'}
                                            {'  '}algorithms: [<span className="safe-hl">"HS256"</span>]{'\n'}
                                            {'}'}){'\n'}
                                            {'\n'}
                                            <span className="comment">// Never trust client's alg!</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 2. Weak secret */}
                            <div style={{ borderLeft: '3px solid var(--lab-yellow)', paddingLeft: '1rem' }}>
                                <h4 style={{ color: 'var(--lab-yellow)', fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                                    2. Weak Secret Key
                                </h4>
                                <p style={{ fontSize: '0.82rem', color: 'var(--lab-text-dim)', marginBottom: '0.5rem' }}>
                                    {lang === 'vi'
                                        ? 'Secret key ngắn hoặc phổ biến (VD: "secret", "password") có thể bị bruteforce bằng công cụ như hashcat.'
                                        : 'Short or common secret keys (e.g., "secret", "password") can be bruteforced with tools like hashcat.'}
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--lab-red)', marginBottom: '0.2rem' }}>❌ WEAK</div>
                                        <div className="lab-code" style={{ fontSize: '0.72rem' }}>
                                            <span className="danger-hl">"secret"</span>{'\n'}
                                            <span className="danger-hl">"password"</span>{'\n'}
                                            <span className="danger-hl">"jwt_key"</span>{'\n'}
                                            <span className="danger-hl">"123456"</span>
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--lab-green)', marginBottom: '0.2rem' }}>✅ STRONG</div>
                                        <div className="lab-code" style={{ fontSize: '0.72rem' }}>
                                            <span className="comment"># 256-bit random key</span>{'\n'}
                                            <span className="safe-hl">openssl rand -hex 32</span>{'\n'}
                                            {'\n'}
                                            <span className="comment"># Or use RS256 with RSA keys</span>{'\n'}
                                            <span className="safe-hl">openssl genrsa -out key.pem 2048</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. Missing expiry */}
                            <div style={{ borderLeft: '3px solid var(--lab-purple)', paddingLeft: '1rem' }}>
                                <h4 style={{ color: 'var(--lab-purple)', fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                                    3. Missing Expiration (No exp claim)
                                </h4>
                                <p style={{ fontSize: '0.82rem', color: 'var(--lab-text-dim)', marginBottom: '0.5rem' }}>
                                    {lang === 'vi'
                                        ? 'Token không có exp claim sẽ sống mãi. Nếu bị đánh cắp → attacker có quyền truy cập vĩnh viễn.'
                                        : 'Token without exp claim lives forever. If stolen → attacker has permanent access.'}
                                </p>
                                <div className="lab-code" style={{ fontSize: '0.72rem' }}>
                                    <span className="comment">// Always set short expiry</span>{'\n'}
                                    jwt.sign(payload, secret, {'{'}{'\n'}
                                    {'  '}expiresIn: <span className="safe-hl">"15m"</span>  <span className="comment">// Access token: 15 minutes</span>{'\n'}
                                    {'}'}){'\n'}
                                    {'\n'}
                                    <span className="comment">// Use refresh tokens for long sessions</span>{'\n'}
                                    jwt.sign(refreshPayload, refreshSecret, {'{'}{'\n'}
                                    {'  '}expiresIn: <span className="safe-hl">"7d"</span>   <span className="comment">// Refresh token: 7 days</span>{'\n'}
                                    {'}'})
                                </div>
                            </div>

                            {/* 4. Sensitive data in payload */}
                            <div style={{ borderLeft: '3px solid var(--lab-cyan)', paddingLeft: '1rem' }}>
                                <h4 style={{ color: 'var(--lab-cyan)', fontSize: '0.92rem', fontWeight: 700, marginBottom: '0.3rem' }}>
                                    4. Sensitive Data in Payload
                                </h4>
                                <p style={{ fontSize: '0.82rem', color: 'var(--lab-text-dim)', marginBottom: '0.5rem' }}>
                                    {lang === 'vi'
                                        ? 'Payload chỉ được Base64 encode (KHÔNG mã hóa!). Ai cũng có thể decode. Đừng bao giờ đặt password, credit card, hay PII vào JWT.'
                                        : 'Payload is only Base64 encoded (NOT encrypted!). Anyone can decode it. Never put passwords, credit cards, or PII in JWT.'}
                                </p>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--lab-red)', marginBottom: '0.2rem' }}>❌ NEVER DO THIS</div>
                                        <div className="lab-code" style={{ fontSize: '0.72rem' }}>
                                            {'{'}{'\n'}
                                            {'  '}"sub": "1234",{'\n'}
                                            {'  '}<span className="danger-hl">"password": "MyP@ss!"</span>,{'\n'}
                                            {'  '}<span className="danger-hl">"credit_card": "4111..."</span>,{'\n'}
                                            {'  '}<span className="danger-hl">"ssn": "123-45-6789"</span>{'\n'}
                                            {'}'}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--lab-green)', marginBottom: '0.2rem' }}>✅ CORRECT</div>
                                        <div className="lab-code" style={{ fontSize: '0.72rem' }}>
                                            {'{'}{'\n'}
                                            {'  '}<span className="safe-hl">"sub": "1234"</span>,{'\n'}
                                            {'  '}<span className="safe-hl">"role": "user"</span>,{'\n'}
                                            {'  '}<span className="safe-hl">"exp": 1740086400</span>{'\n'}
                                            {'}'}{'\n'}
                                            <span className="comment">// Minimal claims only!</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Best practices checklist */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">✅ {lang === 'vi' ? 'JWT Best Practices' : 'JWT Best Practices'}</h3>
                        <div style={{ display: 'grid', gap: '0.4rem' }}>
                            {[
                                { check: true, text: lang === 'vi' ? 'Luôn set exp claim (access token: 15-30 phút)' : 'Always set exp claim (access token: 15-30 min)' },
                                { check: true, text: lang === 'vi' ? 'Dùng secret key mạnh (≥256 bit random)' : 'Use strong secret key (≥256 bit random)' },
                                { check: true, text: lang === 'vi' ? 'Whitelist algorithms — không trust header.alg' : 'Whitelist algorithms — never trust header.alg' },
                                { check: true, text: lang === 'vi' ? 'Không lưu sensitive data trong payload' : 'Never store sensitive data in payload' },
                                { check: true, text: lang === 'vi' ? 'Dùng HTTPS để truyền token' : 'Always transmit tokens over HTTPS' },
                                { check: true, text: lang === 'vi' ? 'Lưu token trong HttpOnly cookie (không localStorage)' : 'Store in HttpOnly cookie (not localStorage)' },
                                { check: true, text: lang === 'vi' ? 'Implement token refresh flow' : 'Implement token refresh flow' },
                                { check: true, text: lang === 'vi' ? 'Validate issuer (iss) và audience (aud)' : 'Validate issuer (iss) and audience (aud)' },
                                { check: true, text: lang === 'vi' ? 'Có cơ chế revoke/blacklist token' : 'Have token revocation/blacklist mechanism' },
                                { check: true, text: lang === 'vi' ? 'Cân nhắc RS256 cho microservices (public key verify)' : 'Consider RS256 for microservices (public key verify)' },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    padding: '0.4rem 0.7rem', borderRadius: 4,
                                    background: 'var(--lab-green-dim)',
                                    fontSize: '0.82rem', color: 'var(--lab-text)',
                                    display: 'flex', gap: '0.5rem', alignItems: 'center',
                                }}>
                                    <span style={{ color: 'var(--lab-green)' }}>✅</span>
                                    {item.text}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* JWT Flow diagram */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">🔄 {lang === 'vi' ? 'JWT Authentication Flow' : 'JWT Authentication Flow'}</h3>
                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                            {[
                                { step: 1, from: '🖥️ Client', action: lang === 'vi' ? 'POST /login {username, password}' : 'POST /login {username, password}', to: '🖧 Server', color: '#58a6ff' },
                                { step: 2, from: '🖧 Server', action: lang === 'vi' ? 'Xác thực → Tạo JWT → Trả về token' : 'Authenticate → Create JWT → Return token', to: '🖥️ Client', color: '#3fb950' },
                                { step: 3, from: '🖥️ Client', action: lang === 'vi' ? 'Lưu token (cookie/memory)' : 'Store token (cookie/memory)', to: '💾', color: '#bc8cff' },
                                { step: 4, from: '🖥️ Client', action: lang === 'vi' ? 'Gửi request: Authorization: Bearer <token>' : 'Send request: Authorization: Bearer <token>', to: '🖧 Server', color: '#58a6ff' },
                                { step: 5, from: '🖧 Server', action: lang === 'vi' ? 'Verify signature + Check exp → Trả về data' : 'Verify signature + Check exp → Return data', to: '🖥️ Client', color: '#3fb950' },
                            ].map((s, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                    padding: '0.5rem 0.8rem', borderRadius: 6,
                                    background: `${s.color}08`, borderLeft: `3px solid ${s.color}`,
                                    fontSize: '0.82rem',
                                }}>
                                    <span style={{
                                        minWidth: 24, height: 24, borderRadius: '50%',
                                        background: s.color, color: '#fff', display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.72rem', fontWeight: 700,
                                    }}>{s.step}</span>
                                    <span style={{ fontSize: '0.9rem' }}>{s.from}</span>
                                    <span style={{ color: 'var(--lab-text-dim)' }}>→</span>
                                    <span style={{ flex: 1, fontFamily: "'JetBrains Mono', monospace", fontSize: '0.78rem', color: s.color }}>{s.action}</span>
                                    <span style={{ color: 'var(--lab-text-dim)' }}>→</span>
                                    <span style={{ fontSize: '0.9rem' }}>{s.to}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
