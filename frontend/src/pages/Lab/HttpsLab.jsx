import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'

/* ──────────────────────────────────────
   TLS HANDSHAKE STEPS
   ────────────────────────────────────── */
function getHandshakeSteps(lang) {
    const vi = lang === 'vi'
    return [
        {
            id: 'client_hello',
            title: vi ? '1. Client Hello' : '1. Client Hello',
            from: 'client', to: 'server',
            icon: '👋',
            color: '#58a6ff',
            desc: vi
                ? 'Trình duyệt gửi: phiên bản TLS hỗ trợ, danh sách cipher suites, và một số ngẫu nhiên (client random).'
                : 'Browser sends: supported TLS versions, list of cipher suites, and a random number (client random).',
            payload: {
                version: 'TLS 1.3',
                cipherSuites: ['TLS_AES_256_GCM_SHA384', 'TLS_CHACHA20_POLY1305_SHA256', 'TLS_AES_128_GCM_SHA256'],
                clientRandom: 'a3b8c1d4...f7e2 (32 bytes)',
                extensions: ['server_name: example.com', 'key_share: x25519'],
            },
        },
        {
            id: 'server_hello',
            title: vi ? '2. Server Hello' : '2. Server Hello',
            from: 'server', to: 'client',
            icon: '🤝',
            color: '#3fb950',
            desc: vi
                ? 'Server chọn cipher suite và gửi server random. Trong TLS 1.3, key share cũng được gửi ở bước này.'
                : 'Server selects cipher suite and sends server random. In TLS 1.3, key share is also sent at this step.',
            payload: {
                selectedCipher: 'TLS_AES_256_GCM_SHA384',
                serverRandom: '7f1c9e3a...b4d8 (32 bytes)',
                keyShare: 'x25519 public key: 04a1b2c3...',
            },
        },
        {
            id: 'certificate',
            title: vi ? '3. Certificate' : '3. Certificate',
            from: 'server', to: 'client',
            icon: '📜',
            color: '#f0883e',
            desc: vi
                ? 'Server gửi chứng chỉ SSL/TLS. Client kiểm tra: tên miền, ngày hết hạn, chữ ký CA, và chuỗi tin cậy.'
                : 'Server sends SSL/TLS certificate. Client verifies: domain name, expiry date, CA signature, and trust chain.',
            payload: {
                subject: 'CN=example.com',
                issuer: "CN=Let's Encrypt Authority X3",
                validity: '2026-01-01 → 2026-12-31',
                publicKey: 'RSA 2048-bit: 30820122...',
                signature: 'SHA256withRSA: 4a8b2c...',
            },
        },
        {
            id: 'key_exchange',
            title: vi ? '4. Key Exchange' : '4. Key Exchange',
            from: 'both', to: 'both',
            icon: '🔑',
            color: '#bc8cff',
            desc: vi
                ? 'Cả hai bên tính toán Pre-Master Secret bằng Diffie-Hellman. Từ đó derive ra Session Keys (không bao giờ truyền qua mạng!).'
                : 'Both sides compute Pre-Master Secret via Diffie-Hellman. Then derive Session Keys (never transmitted over the wire!).',
            payload: {
                preMasterSecret: 'ECDHE shared secret (32 bytes)',
                masterSecret: 'PRF(pre_master, client_random + server_random)',
                sessionKeys: {
                    clientWriteKey: 'AES-256 key for client → server',
                    serverWriteKey: 'AES-256 key for server → client',
                    clientWriteIV: '12-byte nonce for GCM',
                    serverWriteIV: '12-byte nonce for GCM',
                },
            },
        },
        {
            id: 'finished',
            title: vi ? '5. Finished' : '5. Finished',
            from: 'both', to: 'both',
            icon: '✅',
            color: '#2ea043',
            desc: vi
                ? 'Cả hai gửi "Finished" message — mã hóa bằng session key để xác nhận handshake thành công. Mọi traffic sau đây đều được mã hóa.'
                : 'Both send "Finished" message — encrypted with session key to confirm handshake. All subsequent traffic is encrypted.',
            payload: {
                verifyData: 'HMAC of all handshake messages',
                status: vi ? '✅ Handshake hoàn tất!' : '✅ Handshake complete!',
            },
        },
        {
            id: 'app_data',
            title: vi ? '6. Application Data' : '6. Application Data',
            from: 'both', to: 'both',
            icon: '🔒',
            color: '#58a6ff',
            desc: vi
                ? 'Dữ liệu ứng dụng (HTTP requests/responses) được mã hóa AES-256-GCM. Kẻ nghe lén chỉ thấy dữ liệu mã hóa vô nghĩa.'
                : 'Application data (HTTP requests/responses) is encrypted with AES-256-GCM. Eavesdroppers only see meaningless ciphertext.',
            payload: {
                plaintext: 'GET /api/account HTTP/1.1\nAuthorization: Bearer eyJhbG...',
                encrypted: '17 03 03 00 1c 8a 3b f2 91 c4 7e a0 5d 12 bb 9f ...',
            },
        },
    ]
}

/* ──────────────────────────────────────
   CERTIFICATE CHAIN DATA
   ────────────────────────────────────── */
function getCertChain(lang) {
    const vi = lang === 'vi'
    return [
        {
            level: 0,
            type: vi ? 'Root CA' : 'Root CA',
            name: 'ISRG Root X1',
            icon: '🏛️',
            color: '#f0883e',
            details: {
                subject: 'CN=ISRG Root X1, O=Internet Security Research Group',
                issuer: vi ? 'Tự ký (Self-signed)' : 'Self-signed',
                validity: '2015-06-04 → 2035-06-04',
                keyType: 'RSA 4096-bit',
                note: vi
                    ? 'Được cài sẵn trong OS/browser. Là gốc tin cậy.'
                    : 'Pre-installed in OS/browser. Root of trust.',
            },
        },
        {
            level: 1,
            type: vi ? 'Intermediate CA' : 'Intermediate CA',
            name: "Let's Encrypt Authority X3",
            icon: '🔗',
            color: '#bc8cff',
            details: {
                subject: "CN=Let's Encrypt Authority X3, O=Let's Encrypt",
                issuer: 'CN=ISRG Root X1',
                validity: '2024-03-13 → 2027-03-12',
                keyType: 'RSA 2048-bit',
                note: vi
                    ? 'Ký bởi Root CA. Dùng để ký cert cho website.'
                    : 'Signed by Root CA. Used to sign website certs.',
            },
        },
        {
            level: 2,
            type: vi ? 'Server Certificate' : 'Server Certificate',
            name: 'example.com',
            icon: '🌐',
            color: '#58a6ff',
            details: {
                subject: 'CN=example.com',
                issuer: "CN=Let's Encrypt Authority X3",
                validity: '2026-01-01 → 2026-03-31',
                keyType: 'ECDSA P-256',
                SAN: 'example.com, www.example.com, api.example.com',
                note: vi
                    ? 'Cert của website, ký bởi Intermediate CA.'
                    : 'Website cert, signed by Intermediate CA.',
            },
        },
    ]
}

/* ──────────────────────────────────────
   THEORY SIDEBAR
   ────────────────────────────────────── */
function HttpsTheory({ lang }) {
    if (lang === 'vi') {
        return (
            <>
                <h3>HTTPS là gì?</h3>
                <p>HTTPS = HTTP + TLS. Nó mã hóa toàn bộ giao tiếp giữa trình duyệt và server, đảm bảo tính bảo mật, toàn vẹn, và xác thực.</p>

                <h3>TLS (Transport Layer Security)</h3>
                <ul>
                    <li><strong>Bảo mật (Confidentiality)</strong> — Mã hóa dữ liệu bằng AES/ChaCha20</li>
                    <li><strong>Toàn vẹn (Integrity)</strong> — MAC đảm bảo dữ liệu không bị sửa</li>
                    <li><strong>Xác thực (Authentication)</strong> — Certificate xác minh danh tính server</li>
                </ul>

                <h3>TLS 1.2 vs TLS 1.3</h3>
                <ul>
                    <li>TLS 1.2: 2 round-trips (2-RTT handshake)</li>
                    <li>TLS 1.3: 1 round-trip (1-RTT), hỗ trợ 0-RTT resumption</li>
                    <li>TLS 1.3 loại bỏ cipher yếu: RSA key exchange, CBC, SHA-1</li>
                </ul>

                <h3>Certificate Authority (CA)</h3>
                <ul>
                    <li>🏛️ <strong>Root CA</strong> — cài sẵn trong browser/OS</li>
                    <li>🔗 <strong>Intermediate CA</strong> — ký bởi Root, ký cert website</li>
                    <li>🌐 <strong>Server Cert</strong> — chứng minh domain thuộc về server</li>
                </ul>

                <div className="lab-theory-note">
                    💡 Từ 2018, Google Chrome đánh dấu tất cả trang HTTP là "Not Secure". HTTPS là bắt buộc cho SEO và bảo mật.
                </div>
            </>
        )
    }

    return (
        <>
            <h3>What is HTTPS?</h3>
            <p>HTTPS = HTTP + TLS. It encrypts all communication between browser and server, ensuring confidentiality, integrity, and authentication.</p>

            <h3>TLS (Transport Layer Security)</h3>
            <ul>
                <li><strong>Confidentiality</strong> — Encrypts data with AES/ChaCha20</li>
                <li><strong>Integrity</strong> — MAC ensures data isn't tampered</li>
                <li><strong>Authentication</strong> — Certificate verifies server identity</li>
            </ul>

            <h3>TLS 1.2 vs TLS 1.3</h3>
            <ul>
                <li>TLS 1.2: 2 round-trips (2-RTT handshake)</li>
                <li>TLS 1.3: 1 round-trip (1-RTT), supports 0-RTT resumption</li>
                <li>TLS 1.3 removes weak ciphers: RSA key exchange, CBC, SHA-1</li>
            </ul>

            <h3>Certificate Authority (CA)</h3>
            <ul>
                <li>🏛️ <strong>Root CA</strong> — Pre-installed in browser/OS</li>
                <li>🔗 <strong>Intermediate CA</strong> — Signed by Root, signs website certs</li>
                <li>🌐 <strong>Server Cert</strong> — Proves domain belongs to server</li>
            </ul>

            <div className="lab-theory-note">
                💡 Since 2018, Google Chrome marks all HTTP pages as "Not Secure". HTTPS is mandatory for SEO and security.
            </div>
        </>
    )
}

/* ──────────────────────────────────────
   FAKE BROWSER
   ────────────────────────────────────── */
function FakeBrowser({ url, secure, children }) {
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
                    padding: '0.3rem 0.75rem', fontSize: '0.78rem',
                    fontFamily: 'monospace', display: 'flex', alignItems: 'center', gap: 6,
                }}>
                    {secure ? (
                        <span style={{ color: '#2ea043', fontSize: '0.72rem' }}>🔒</span>
                    ) : (
                        <span style={{ color: '#f85149', fontSize: '0.72rem' }}>⚠️</span>
                    )}
                    <span style={{ color: secure ? 'var(--lab-green)' : 'var(--lab-red)' }}>{url}</span>
                </div>
            </div>
            <div style={{ padding: '1.25rem', minHeight: 80 }}>
                {children}
            </div>
        </div>
    )
}

/* ──────────────────────────────────────
   MAIN COMPONENT
   ────────────────────────────────────── */
export default function HttpsLab() {
    const { t, lang } = useLanguage()
    const { setTheory } = useOutletContext()

    const [activeTab, setActiveTab] = useState('handshake')

    // Handshake sim
    const [handshakeStep, setHandshakeStep] = useState(-1)
    const [autoPlay, setAutoPlay] = useState(false)
    const autoRef = useRef(null)

    // Theory
    useEffect(() => { setTheory(<HttpsTheory lang={lang} />) }, [setTheory, lang])

    // Auto-play handshake
    useEffect(() => {
        if (autoPlay) {
            autoRef.current = setInterval(() => {
                setHandshakeStep(prev => {
                    if (prev >= 5) {
                        setAutoPlay(false)
                        return prev
                    }
                    return prev + 1
                })
            }, 2200)
        }
        return () => { if (autoRef.current) clearInterval(autoRef.current) }
    }, [autoPlay])

    const steps = getHandshakeSteps(lang)
    const certChain = getCertChain(lang)

    const resetHandshake = useCallback(() => {
        setHandshakeStep(-1)
        setAutoPlay(false)
    }, [])

    const startAutoPlay = useCallback(() => {
        setHandshakeStep(-1)
        setTimeout(() => {
            setHandshakeStep(0)
            setAutoPlay(true)
        }, 300)
    }, [])

    return (
        <div className="lab-animate-in">
            {/* Title */}
            <div className="lab-section">
                <h2 className="lab-section-title" style={{ fontSize: '1.3rem' }}>
                    🔒 {t('lab_https_title')}
                </h2>
                <p style={{ color: 'var(--lab-text-dim)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    {t('lab_https_desc')}
                </p>
            </div>

            {/* Tabs */}
            <div className="lab-tabs">
                {[
                    { id: 'handshake', label: lang === 'vi' ? '🤝 TLS Handshake' : '🤝 TLS Handshake' },
                    { id: 'compare', label: lang === 'vi' ? '⚔️ HTTP vs HTTPS' : '⚔️ HTTP vs HTTPS' },
                    { id: 'certs', label: lang === 'vi' ? '📜 Certificate' : '📜 Certificates' },
                ].map(tab => (
                    <button key={tab.id} className={`lab-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ═══════ TAB 1: TLS Handshake ═══════ */}
            {activeTab === 'handshake' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {/* Controls */}
                    <div className="lab-visual-panel">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <button className="lab-btn lab-btn-primary" onClick={startAutoPlay} disabled={autoPlay}>
                                ▶️ {lang === 'vi' ? 'Tự động' : 'Auto Play'}
                            </button>
                            <button className="lab-btn lab-btn-secondary"
                                onClick={() => setHandshakeStep(s => Math.min(s + 1, 5))}
                                disabled={autoPlay || handshakeStep >= 5}>
                                ⏭ {lang === 'vi' ? 'Bước tiếp' : 'Next Step'}
                            </button>
                            <button className="lab-btn lab-btn-secondary" onClick={resetHandshake}>
                                🔄 Reset
                            </button>
                            <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--lab-text-dim)' }}>
                                {lang === 'vi' ? 'Bước' : 'Step'}: {handshakeStep + 1}/6
                            </span>
                        </div>
                    </div>

                    {/* Visual handshake diagram */}
                    <div className="lab-visual-panel">
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem' }}>🖥️</div>
                                <div style={{ fontWeight: 700, color: 'var(--lab-blue)', fontSize: '0.88rem' }}>Client</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--lab-text-dim)' }}>(Browser)</div>
                            </div>
                            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '0 1.5rem' }}>
                                <div style={{ borderBottom: '2px dashed var(--lab-border)', position: 'relative' }}>
                                    <span style={{
                                        position: 'absolute', top: -12, left: '50%', transform: 'translateX(-50%)',
                                        background: 'var(--lab-surface)', padding: '0 0.5rem',
                                        fontSize: '0.72rem', color: 'var(--lab-text-dim)',
                                    }}>
                                        {handshakeStep >= 5 ? '🔒 ' + (lang === 'vi' ? 'MÃ HÓA' : 'ENCRYPTED') : '📡 ' + (lang === 'vi' ? 'ĐANG BẮT TAY...' : 'HANDSHAKING...')}
                                    </span>
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '2rem' }}>🖧</div>
                                <div style={{ fontWeight: 700, color: 'var(--lab-green)', fontSize: '0.88rem' }}>Server</div>
                                <div style={{ fontSize: '0.68rem', color: 'var(--lab-text-dim)' }}>example.com</div>
                            </div>
                        </div>

                        {/* Step list */}
                        <div style={{ display: 'grid', gap: '0.6rem' }}>
                            {steps.map((step, idx) => {
                                const isActive = idx === handshakeStep
                                const isDone = idx < handshakeStep
                                const isHidden = idx > handshakeStep

                                return (
                                    <div key={step.id} style={{
                                        padding: '0.9rem 1.1rem', borderRadius: 8,
                                        background: isActive ? `${step.color}15` : isDone ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.15)',
                                        borderLeft: `3px solid ${isActive ? step.color : isDone ? 'var(--lab-green)' : 'var(--lab-border)'}`,
                                        opacity: isHidden ? 0.3 : 1,
                                        transition: 'all 0.4s ease',
                                        cursor: 'pointer',
                                    }} onClick={() => { if (!autoPlay) setHandshakeStep(idx) }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: isActive ? '0.5rem' : 0 }}>
                                            <span style={{ fontSize: '1.1rem' }}>{isDone ? '✅' : step.icon}</span>
                                            <span style={{ fontWeight: 700, color: isActive ? step.color : isDone ? 'var(--lab-green)' : 'var(--lab-text-dim)', fontSize: '0.88rem' }}>
                                                {step.title}
                                            </span>
                                            {step.from !== 'both' && (
                                                <span style={{ fontSize: '0.72rem', color: 'var(--lab-text-dim)', marginLeft: 'auto' }}>
                                                    {step.from === 'client' ? '🖥️ → 🖧' : '🖧 → 🖥️'}
                                                </span>
                                            )}
                                            {step.from === 'both' && (
                                                <span style={{ fontSize: '0.72rem', color: 'var(--lab-text-dim)', marginLeft: 'auto' }}>
                                                    🖥️ ↔ 🖧
                                                </span>
                                            )}
                                        </div>

                                        {isActive && (
                                            <div style={{ animation: 'labFadeIn 0.3s ease-out' }}>
                                                <p style={{ fontSize: '0.82rem', color: 'var(--lab-text)', lineHeight: 1.6, marginBottom: '0.6rem' }}>
                                                    {step.desc}
                                                </p>
                                                {/* Payload */}
                                                <div style={{
                                                    background: '#0b0f19', borderRadius: 6, padding: '0.6rem 0.9rem',
                                                    fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem',
                                                    lineHeight: 1.8, overflowX: 'auto',
                                                }}>
                                                    {Object.entries(step.payload).map(([key, value]) => (
                                                        <div key={key}>
                                                            <span style={{ color: 'var(--lab-purple)' }}>{key}</span>
                                                            <span style={{ color: 'var(--lab-text-dim)' }}>: </span>
                                                            {typeof value === 'object' && !Array.isArray(value) ? (
                                                                <div style={{ paddingLeft: '1rem' }}>
                                                                    {Object.entries(value).map(([k, v]) => (
                                                                        <div key={k}>
                                                                            <span style={{ color: 'var(--lab-cyan)' }}>{k}</span>
                                                                            <span style={{ color: 'var(--lab-text-dim)' }}>: </span>
                                                                            <span style={{ color: 'var(--lab-green)' }}>{v}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : Array.isArray(value) ? (
                                                                <span style={{ color: 'var(--lab-green)' }}>[{value.join(', ')}]</span>
                                                            ) : (
                                                                <span style={{ color: 'var(--lab-green)' }}>{value}</span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* TLS version comparison */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">📊 TLS 1.2 vs TLS 1.3</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--lab-border)' }}>
                                        {['', 'TLS 1.2', 'TLS 1.3'].map(h => (
                                            <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--lab-text-dim)', fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { feature: 'Handshake RTT', v12: '2-RTT', v13: '1-RTT ⚡' },
                                        { feature: '0-RTT Resumption', v12: '❌', v13: '✅' },
                                        { feature: 'RSA Key Exchange', v12: '✅ (weak)', v13: '❌ removed' },
                                        { feature: 'Forward Secrecy', v12: lang === 'vi' ? 'Tùy chọn' : 'Optional', v13: lang === 'vi' ? 'Bắt buộc ✅' : 'Mandatory ✅' },
                                        { feature: 'Cipher Suites', v12: '37+', v13: '5 (only strong)' },
                                        { feature: 'CBC Mode', v12: '✅', v13: '❌ removed' },
                                        { feature: 'AEAD Required', v12: lang === 'vi' ? 'Không' : 'No', v13: lang === 'vi' ? 'Có ✅' : 'Yes ✅' },
                                        { feature: lang === 'vi' ? 'Năm phát hành' : 'Released', v12: '2008', v13: '2018' },
                                    ].map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--lab-heading)' }}>{row.feature}</td>
                                            <td style={{ padding: '0.5rem', color: 'var(--lab-text-dim)' }}>{row.v12}</td>
                                            <td style={{ padding: '0.5rem', color: 'var(--lab-green)', fontWeight: 600 }}>{row.v13}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════ TAB 2: HTTP vs HTTPS ═══════ */}
            {activeTab === 'compare' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {/* MITM demo */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            🕵️ {lang === 'vi' ? 'Man-in-the-Middle: HTTP bị nghe lén' : 'Man-in-the-Middle: HTTP Eavesdropping'}
                        </h3>
                        <p style={{ color: 'var(--lab-text-dim)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            {lang === 'vi'
                                ? 'Khi dùng HTTP, kẻ tấn công trên cùng mạng Wi-Fi có thể đọc toàn bộ dữ liệu bạn gửi.'
                                : 'With HTTP, an attacker on the same Wi-Fi can read everything you send.'}
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            {/* HTTP side */}
                            <div>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--lab-red)', marginBottom: '0.5rem', textAlign: 'center' }}>
                                    ⚠️ HTTP (Port 80)
                                </div>
                                <FakeBrowser url="http://bank.example.com/login" secure={false}>
                                    <div style={{ fontSize: '0.82rem', color: '#d32f2f', fontWeight: 600, marginBottom: 8 }}>
                                        ⚠️ Not Secure
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: '#555' }}>
                                        <div style={{ marginBottom: 4 }}><strong>Username:</strong> alice</div>
                                        <div><strong>Password:</strong> My$ecretP@ss!</div>
                                    </div>
                                </FakeBrowser>
                                <div style={{
                                    marginTop: '0.75rem', padding: '0.6rem', borderRadius: 6,
                                    background: 'rgba(248,81,73,0.08)', border: '1px solid rgba(248,81,73,0.2)',
                                }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--lab-red)', marginBottom: '0.3rem' }}>
                                        🕵️ {lang === 'vi' ? 'Kẻ tấn công thấy:' : 'Attacker sees:'}
                                    </div>
                                    <div style={{
                                        fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem',
                                        color: 'var(--lab-red)', lineHeight: 1.8,
                                    }}>
                                        POST /login HTTP/1.1{'\n'}
                                        Host: bank.example.com{'\n'}
                                        Content-Type: application/json{'\n'}
                                        {'\n'}
                                        <span style={{ background: 'rgba(248,81,73,0.15)', padding: '0 0.3rem' }}>
                                            {`{"username":"alice","password":"My$ecretP@ss!"}`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* HTTPS side */}
                            <div>
                                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--lab-green)', marginBottom: '0.5rem', textAlign: 'center' }}>
                                    🔒 HTTPS (Port 443)
                                </div>
                                <FakeBrowser url="https://bank.example.com/login" secure={true}>
                                    <div style={{ fontSize: '0.82rem', color: '#2e7d32', fontWeight: 600, marginBottom: 8 }}>
                                        🔒 Connection is secure
                                    </div>
                                    <div style={{ fontSize: '0.78rem', color: '#555' }}>
                                        <div style={{ marginBottom: 4 }}><strong>Username:</strong> alice</div>
                                        <div><strong>Password:</strong> My$ecretP@ss!</div>
                                    </div>
                                </FakeBrowser>
                                <div style={{
                                    marginTop: '0.75rem', padding: '0.6rem', borderRadius: 6,
                                    background: 'rgba(63,185,80,0.08)', border: '1px solid rgba(63,185,80,0.2)',
                                }}>
                                    <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--lab-green)', marginBottom: '0.3rem' }}>
                                        🕵️ {lang === 'vi' ? 'Kẻ tấn công thấy:' : 'Attacker sees:'}
                                    </div>
                                    <div style={{
                                        fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem',
                                        color: 'var(--lab-text-dim)', lineHeight: 1.8, wordBreak: 'break-all',
                                    }}>
                                        17 03 03 00 1c 8a 3b f2{'\n'}
                                        91 c4 7e a0 5d 12 bb 9f{'\n'}
                                        <span style={{ color: '#555', fontStyle: 'italic' }}>
                                            ({lang === 'vi' ? 'Dữ liệu mã hóa — vô nghĩa!' : 'Encrypted garbage — meaningless!'})
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Comparison table */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">📊 {lang === 'vi' ? 'So sánh chi tiết' : 'Detailed Comparison'}</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--lab-border)' }}>
                                        {['', 'HTTP', 'HTTPS'].map(h => (
                                            <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--lab-text-dim)', fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { f: 'URL', http: 'http://', https: 'https://' },
                                        { f: 'Port', http: '80', https: '443' },
                                        { f: lang === 'vi' ? 'Mã hóa' : 'Encryption', http: '❌ ' + (lang === 'vi' ? 'Plaintext' : 'Plaintext'), https: '✅ AES-256-GCM' },
                                        { f: lang === 'vi' ? 'Xác thực server' : 'Server Auth', http: '❌', https: '✅ Certificate' },
                                        { f: lang === 'vi' ? 'Toàn vẹn dữ liệu' : 'Data Integrity', http: '❌', https: '✅ HMAC' },
                                        { f: 'SEO (Google)', http: '⬇️ ' + (lang === 'vi' ? 'Bị phạt' : 'Penalty'), https: '⬆️ ' + (lang === 'vi' ? 'Ưu tiên' : 'Boosted') },
                                        { f: lang === 'vi' ? 'Trình duyệt' : 'Browser', http: '⚠️ "Not Secure"', https: '🔒 ' + (lang === 'vi' ? 'Biểu tượng khóa' : 'Lock icon') },
                                        { f: 'MITM Attack', http: '🎯 ' + (lang === 'vi' ? 'Dễ bị tấn công' : 'Vulnerable'), https: '🛡️ ' + (lang === 'vi' ? 'Được bảo vệ' : 'Protected') },
                                        { f: lang === 'vi' ? 'Cost' : 'Cost', http: lang === 'vi' ? 'Miễn phí' : 'Free', https: lang === 'vi' ? "Miễn phí (Let's Encrypt)" : "Free (Let's Encrypt)" },
                                        { f: lang === 'vi' ? 'Hiệu suất' : 'Performance', http: lang === 'vi' ? 'Nhanh hơn ~1%' : '~1% faster', https: lang === 'vi' ? 'HTTP/2 + QUIC bù lại' : 'HTTP/2 + QUIC compensate' },
                                    ].map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--lab-heading)' }}>{row.f}</td>
                                            <td style={{ padding: '0.5rem', color: 'var(--lab-red)' }}>{row.http}</td>
                                            <td style={{ padding: '0.5rem', color: 'var(--lab-green)' }}>{row.https}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Attack types */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">⚔️ {lang === 'vi' ? 'Tấn công HTTP phổ biến' : 'Common HTTP Attacks'}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                            {[
                                { icon: '🕵️', title: lang === 'vi' ? 'Nghe lén (Sniffing)' : 'Eavesdropping', desc: lang === 'vi' ? 'Đọc toàn bộ request/response trên cùng mạng' : 'Read all requests/responses on same network', tool: 'Wireshark, tcpdump' },
                                { icon: '🔄', title: lang === 'vi' ? 'Giả mạo (Spoofing)' : 'Spoofing', desc: lang === 'vi' ? 'Giả DNS để chuyển hướng người dùng sang trang giả' : 'Fake DNS to redirect users to phishing site', tool: 'DNS poisoning' },
                                { icon: '💉', title: lang === 'vi' ? 'Chèn mã (Injection)' : 'Content Injection', desc: lang === 'vi' ? 'ISP/attacker chèn quảng cáo, mã JS vào trang' : 'ISP/attacker injects ads, JS into pages', tool: 'HTTP proxy injection' },
                                { icon: '🍪', title: lang === 'vi' ? 'Đánh cắp Cookie' : 'Session Hijacking', desc: lang === 'vi' ? 'Đánh cắp session cookie qua mạng' : 'Steal session cookies over the network', tool: 'Firesheep, ettercap' },
                            ].map((atk, i) => (
                                <div key={i} style={{
                                    padding: '1rem', background: 'rgba(248,81,73,0.05)',
                                    borderRadius: 8, borderLeft: '3px solid var(--lab-red)',
                                }}>
                                    <div style={{ fontSize: '1.2rem', marginBottom: '0.3rem' }}>{atk.icon}</div>
                                    <div style={{ fontWeight: 700, color: 'var(--lab-heading)', fontSize: '0.88rem', marginBottom: '0.3rem' }}>{atk.title}</div>
                                    <div style={{ fontSize: '0.78rem', color: 'var(--lab-text-dim)', lineHeight: 1.5, marginBottom: '0.3rem' }}>{atk.desc}</div>
                                    <div style={{ fontSize: '0.68rem', color: 'var(--lab-purple)', fontFamily: 'monospace' }}>🔧 {atk.tool}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════ TAB 3: Certificates ═══════ */}
            {activeTab === 'certs' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {/* Certificate chain visualization */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            🔗 {lang === 'vi' ? 'Chuỗi tin cậy (Certificate Chain)' : 'Certificate Trust Chain'}
                        </h3>
                        <p style={{ color: 'var(--lab-text-dim)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                            {lang === 'vi'
                                ? 'Browser kiểm tra certificate theo chuỗi: Server Cert → Intermediate CA → Root CA. Nếu Root CA có trong trust store → certificate hợp lệ.'
                                : 'Browser verifies certificate chain: Server Cert → Intermediate CA → Root CA. If Root CA is in trust store → certificate is valid.'
                            }
                        </p>

                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {certChain.map((cert, idx) => (
                                <div key={idx} style={{
                                    padding: '1rem 1.25rem', borderRadius: 10,
                                    background: `${cert.color}08`,
                                    borderLeft: `4px solid ${cert.color}`,
                                    marginLeft: idx * 30,
                                    position: 'relative',
                                }}>
                                    {idx > 0 && (
                                        <div style={{
                                            position: 'absolute', top: -12, left: -15,
                                            fontSize: '1.2rem', color: 'var(--lab-text-dim)',
                                        }}>↗️</div>
                                    )}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '1.3rem' }}>{cert.icon}</span>
                                        <div>
                                            <div style={{ fontWeight: 700, color: cert.color, fontSize: '0.92rem' }}>{cert.name}</div>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--lab-text-dim)' }}>{cert.type}</div>
                                        </div>
                                        {idx === 0 && (
                                            <span style={{
                                                marginLeft: 'auto', padding: '0.15rem 0.5rem', borderRadius: 100,
                                                fontSize: '0.68rem', fontWeight: 700,
                                                background: 'var(--lab-green-dim)', color: 'var(--lab-green)',
                                            }}>
                                                {lang === 'vi' ? 'CÀI SẴN' : 'PRE-INSTALLED'}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{
                                        display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                                        gap: '0.3rem', fontSize: '0.75rem',
                                    }}>
                                        {Object.entries(cert.details).filter(([k]) => k !== 'note').map(([key, value]) => (
                                            <div key={key} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                                <span style={{ color: 'var(--lab-purple)' }}>{key}</span>
                                                <span style={{ color: 'var(--lab-text-dim)' }}>: </span>
                                                <span style={{ color: 'var(--lab-text)' }}>{value}</span>
                                            </div>
                                        ))}
                                    </div>
                                    {cert.details.note && (
                                        <div style={{
                                            marginTop: '0.5rem', fontSize: '0.75rem', color: cert.color,
                                            fontStyle: 'italic',
                                        }}>💡 {cert.details.note}</div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Verification flow */}
                        <div style={{
                            marginTop: '1.25rem', padding: '0.75rem 1rem', borderRadius: 8,
                            background: 'var(--lab-green-dim)', borderLeft: '3px solid var(--lab-green)',
                        }}>
                            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--lab-green)', marginBottom: '0.3rem' }}>
                                ✅ {lang === 'vi' ? 'Quá trình xác minh' : 'Verification Process'}
                            </div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--lab-text)', lineHeight: 1.8 }}>
                                {lang === 'vi' ? (
                                    <>
                                        1. Browser nhận server cert: <strong>example.com</strong><br />
                                        2. Kiểm tra issuer: ký bởi <strong>Let's Encrypt X3</strong> → tìm cert Intermediate<br />
                                        3. Kiểm tra Intermediate: ký bởi <strong>ISRG Root X1</strong> → tìm trong Trust Store<br />
                                        4. ✅ Root CA có trong store → <strong>Certificate hợp lệ!</strong>
                                    </>
                                ) : (
                                    <>
                                        1. Browser receives server cert: <strong>example.com</strong><br />
                                        2. Check issuer: signed by <strong>Let's Encrypt X3</strong> → find Intermediate cert<br />
                                        3. Check Intermediate: signed by <strong>ISRG Root X1</strong> → find in Trust Store<br />
                                        4. ✅ Root CA is in store → <strong>Certificate is valid!</strong>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Certificate errors */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">⚠️ {lang === 'vi' ? 'Lỗi Certificate thường gặp' : 'Common Certificate Errors'}</h3>
                        <div style={{ display: 'grid', gap: '0.6rem' }}>
                            {[
                                {
                                    error: 'ERR_CERT_DATE_INVALID',
                                    color: 'var(--lab-red)',
                                    cause: lang === 'vi' ? 'Certificate hết hạn hoặc chưa đến ngày hiệu lực' : 'Certificate expired or not yet valid',
                                    fix: lang === 'vi' ? 'Renew certificate (certbot renew)' : 'Renew certificate (certbot renew)',
                                },
                                {
                                    error: 'ERR_CERT_COMMON_NAME_INVALID',
                                    color: 'var(--lab-yellow)',
                                    cause: lang === 'vi' ? 'Tên miền trong cert không match URL' : 'Domain in cert does not match URL',
                                    fix: lang === 'vi' ? 'Đảm bảo SAN bao gồm tất cả subdomains' : 'Ensure SAN includes all subdomains',
                                },
                                {
                                    error: 'ERR_CERT_AUTHORITY_INVALID',
                                    color: 'var(--lab-purple)',
                                    cause: lang === 'vi' ? 'Self-signed cert hoặc CA không được tin cậy' : 'Self-signed cert or untrusted CA',
                                    fix: lang === 'vi' ? "Dùng CA uy tín (Let's Encrypt)" : "Use trusted CA (Let's Encrypt)",
                                },
                                {
                                    error: 'ERR_CERT_REVOKED',
                                    color: 'var(--lab-red)',
                                    cause: lang === 'vi' ? 'Certificate bị thu hồi (revoked)' : 'Certificate has been revoked',
                                    fix: lang === 'vi' ? 'Tạo certificate mới' : 'Generate a new certificate',
                                },
                            ].map((err, i) => (
                                <div key={i} style={{
                                    padding: '0.75rem 1rem', borderRadius: 6,
                                    background: 'rgba(0,0,0,0.2)', borderLeft: `3px solid ${err.color}`,
                                    display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: '0.75rem',
                                    alignItems: 'center', fontSize: '0.82rem',
                                }}>
                                    <div style={{ fontFamily: 'monospace', fontWeight: 700, color: err.color, fontSize: '0.75rem' }}>{err.error}</div>
                                    <div style={{ color: 'var(--lab-text-dim)' }}>❓ {err.cause}</div>
                                    <div style={{ color: 'var(--lab-green)' }}>🔧 {err.fix}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Let's Encrypt setup */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">🛠️ {lang === 'vi' ? "Cài đặt HTTPS miễn phí (Let's Encrypt)" : "Free HTTPS Setup (Let's Encrypt)"}</h3>
                        <div className="lab-code">
                            <span className="comment"># Install Certbot</span>{'\n'}
                            <span className="keyword">sudo apt install</span> certbot python3-certbot-nginx{'\n'}
                            {'\n'}
                            <span className="comment"># Get certificate (auto-configure Nginx)</span>{'\n'}
                            <span className="keyword">sudo certbot</span> --nginx -d <span className="string">example.com</span> -d <span className="string">www.example.com</span>{'\n'}
                            {'\n'}
                            <span className="comment"># Auto-renew (cron job added automatically)</span>{'\n'}
                            <span className="keyword">sudo certbot renew</span> --dry-run{'\n'}
                            {'\n'}
                            <span className="comment"># Nginx config (auto-generated)</span>{'\n'}
                            <span className="keyword">server</span> {'{'}{'\n'}
                            {'  '}listen <span className="safe-hl">443 ssl</span>;{'\n'}
                            {'  '}server_name <span className="string">example.com</span>;{'\n'}
                            {'  '}ssl_certificate <span className="safe-hl">/etc/letsencrypt/live/example.com/fullchain.pem</span>;{'\n'}
                            {'  '}ssl_certificate_key <span className="safe-hl">/etc/letsencrypt/live/example.com/privkey.pem</span>;{'\n'}
                            {'  '}ssl_protocols <span className="safe-hl">TLSv1.2 TLSv1.3</span>;{'\n'}
                            {'}'}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
