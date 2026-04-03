import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import AIInput from '../../components/common/AIInput'
/* ──────────────────────────────────────
   ENCRYPTION ALGORITHMS (pure JS)
   ────────────────────────────────────── */

// ── Caesar Cipher ──
function caesarEncrypt(text, shift) {
    const s = ((shift % 26) + 26) % 26
    return text.split('').map(ch => {
        if (/[a-z]/.test(ch)) return String.fromCharCode(((ch.charCodeAt(0) - 97 + s) % 26) + 97)
        if (/[A-Z]/.test(ch)) return String.fromCharCode(((ch.charCodeAt(0) - 65 + s) % 26) + 65)
        return ch
    }).join('')
}
function caesarDecrypt(text, shift) {
    return caesarEncrypt(text, -shift)
}

// Step-by-step data for visualization
function caesarSteps(text, shift, isEncrypt) {
    const s = isEncrypt ? ((shift % 26) + 26) % 26 : (((-shift) % 26) + 26) % 26
    return text.split('').map(ch => {
        const isLetter = /[a-zA-Z]/.test(ch)
        const base = /[a-z]/.test(ch) ? 97 : 65
        const result = isLetter
            ? String.fromCharCode(((ch.charCodeAt(0) - base + s) % 26) + base)
            : ch
        return {
            original: ch,
            shifted: result,
            isLetter,
            shiftAmount: isLetter ? s : 0,
        }
    })
}

// ── AES (Web Crypto API) ──
async function deriveAESKey(password) {
    const enc = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
        'raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']
    )
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: enc.encode('labsalt2026'), iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    )
}

async function aesEncrypt(plaintext, password) {
    const key = await deriveAESKey(password)
    const enc = new TextEncoder()
    const iv = crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv },
        key,
        enc.encode(plaintext)
    )
    // Combine IV + ciphertext for storage
    const combined = new Uint8Array(iv.length + new Uint8Array(encrypted).length)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)
    return btoa(String.fromCharCode(...combined))
}

async function aesDecrypt(cipherB64, password) {
    const key = await deriveAESKey(password)
    const combined = Uint8Array.from(atob(cipherB64), c => c.charCodeAt(0))
    const iv = combined.slice(0, 12)
    const data = combined.slice(12)
    const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        key,
        data
    )
    return new TextDecoder().decode(decrypted)
}

// ── Vigenère Cipher (bonus — elegant symmetric) ──
function vigenereEncrypt(text, key) {
    const k = key.toUpperCase()
    let ki = 0
    return text.split('').map(ch => {
        if (/[a-zA-Z]/.test(ch)) {
            const base = ch === ch.toUpperCase() ? 65 : 97
            const shift = k.charCodeAt(ki % k.length) - 65
            ki++
            return String.fromCharCode(((ch.charCodeAt(0) - base + shift) % 26) + base)
        }
        return ch
    }).join('')
}

function vigenereDecrypt(text, key) {
    const k = key.toUpperCase()
    let ki = 0
    return text.split('').map(ch => {
        if (/[a-zA-Z]/.test(ch)) {
            const base = ch === ch.toUpperCase() ? 65 : 97
            const shift = k.charCodeAt(ki % k.length) - 65
            ki++
            return String.fromCharCode(((ch.charCodeAt(0) - base - shift + 26) % 26) + base)
        }
        return ch
    }).join('')
}

/* ──────────────────────────────────────
   THEORY SIDEBAR CONTENT
   ────────────────────────────────────── */
function EncryptionTheory({ lang }) {
    if (lang === 'vi') {
        return (
            <>
                <h3>Mã hóa là gì?</h3>
                <p>
                    Mã hóa (Encryption) là quá trình biến đổi thông tin từ dạng đọc được
                    (plaintext) thành dạng không đọc được (ciphertext) để bảo vệ tính bí mật.
                </p>

                <h3>Mã hóa đối xứng vs Bất đối xứng</h3>
                <ul>
                    <li><strong>Đối xứng (Symmetric)</strong> — Dùng cùng 1 key để mã hóa & giải mã. Ví dụ: AES, Caesar, Vigenère</li>
                    <li><strong>Bất đối xứng (Asymmetric)</strong> — Dùng cặp public/private key. Ví dụ: RSA, ECC</li>
                </ul>

                <h3>Caesar Cipher</h3>
                <p>
                    Thuật toán cổ điển nhất — dịch chuyển mỗi ký tự đi N vị trí trong bảng chữ cái.
                    Ví dụ: với shift=3, A→D, B→E, C→F...
                </p>
                <div className="lab-theory-note warning">
                    ⚠️ Caesar rất yếu! Chỉ có 25 khả năng, có thể brute force ngay lập tức.
                </div>

                <h3>Vigenère Cipher</h3>
                <p>
                    Cải tiến của Caesar — dùng một từ khóa (keyword) thay vì 1 số.
                    Mỗi ký tự dùng shift khác nhau dựa trên keyword, khó phá hơn Caesar đáng kể.
                </p>

                <h3>AES-256</h3>
                <p>
                    Advanced Encryption Standard — tiêu chuẩn mã hóa hiện đại,
                    sử dụng block cipher 128-bit với key 256-bit. Được dùng bởi
                    chính phủ, quân đội, và các hệ thống tài chính trên toàn thế giới.
                </p>
                <div className="lab-theory-note success">
                    ✅ AES-256 hiện tại chưa thể bị phá bằng bất kỳ phương pháp nào đã biết.
                </div>

                <h3>Ứng dụng thực tế</h3>
                <ul>
                    <li>HTTPS/TLS — mã hóa giao tiếp web</li>
                    <li>VPN — bảo vệ kết nối mạng</li>
                    <li>Ổ đĩa mã hóa — BitLocker, FileVault</li>
                    <li>Messaging — Signal, WhatsApp (E2E)</li>
                </ul>
            </>
        )
    }

    return (
        <>
            <h3>What is Encryption?</h3>
            <p>
                Encryption is the process of transforming readable information
                (plaintext) into an unreadable format (ciphertext) to protect confidentiality.
            </p>

            <h3>Symmetric vs Asymmetric</h3>
            <ul>
                <li><strong>Symmetric</strong> — Same key for encryption & decryption. Ex: AES, Caesar, Vigenère</li>
                <li><strong>Asymmetric</strong> — Public/private key pair. Ex: RSA, ECC</li>
            </ul>

            <h3>Caesar Cipher</h3>
            <p>
                The oldest known cipher — shifts each letter by N positions in the alphabet.
                Example: with shift=3, A→D, B→E, C→F...
            </p>
            <div className="lab-theory-note warning">
                ⚠️ Caesar is very weak! Only 25 possibilities, can be brute forced instantly.
            </div>

            <h3>Vigenère Cipher</h3>
            <p>
                An improvement over Caesar — uses a keyword instead of a single number.
                Each character uses a different shift based on the keyword, significantly harder to break.
            </p>

            <h3>AES-256</h3>
            <p>
                Advanced Encryption Standard — the modern encryption standard using
                128-bit block cipher with 256-bit key. Used by governments, military,
                and financial systems worldwide.
            </p>
            <div className="lab-theory-note success">
                ✅ AES-256 currently cannot be broken by any known method.
            </div>

            <h3>Real-world Applications</h3>
            <ul>
                <li>HTTPS/TLS — web communication encryption</li>
                <li>VPN — network connection protection</li>
                <li>Disk encryption — BitLocker, FileVault</li>
                <li>Messaging — Signal, WhatsApp (E2E)</li>
            </ul>
        </>
    )
}

/* ──────────────────────────────────────
   MAIN COMPONENT
   ────────────────────────────────────── */
export default function EncryptionLab() {
    const { t, lang } = useLanguage()
    const { setTheory } = useOutletContext()

    // State
    const [activeTab, setActiveTab] = useState('caesar')
    const [plaintext, setPlaintext] = useState('Hello World')
    const [ciphertext, setCiphertext] = useState('')
    const [caesarShift, setCaesarShift] = useState(3)
    const [vigenereKey, setVigenereKey] = useState('SECRET')
    const [aesPassword, setAesPassword] = useState('my-secret-key')
    const [isProcessing, setIsProcessing] = useState(false)
    const [error, setError] = useState('')
    const [visSteps, setVisSteps] = useState([])
    const [animatingIdx, setAnimatingIdx] = useState(-1)
    const [direction, setDirection] = useState('encrypt')  // 'encrypt' or 'decrypt'
    const animRef = useRef(null)

    // Set theory content on mount
    useEffect(() => {
        setTheory(<EncryptionTheory lang={lang} />)
    }, [setTheory, lang])

    // ── Animation for Caesar/Vigenère ──
    const animateSteps = useCallback((steps) => {
        setVisSteps(steps)
        setAnimatingIdx(0)
        let i = 0
        if (animRef.current) clearInterval(animRef.current)
        animRef.current = setInterval(() => {
            i++
            if (i >= steps.length) {
                clearInterval(animRef.current)
                setAnimatingIdx(steps.length)
            } else {
                setAnimatingIdx(i)
            }
        }, 60)
    }, [])

    // Cleanup animation on unmount
    useEffect(() => () => { if (animRef.current) clearInterval(animRef.current) }, [])

    // ── Encrypt handler ──
    const handleEncrypt = async () => {
        setError('')
        setDirection('encrypt')
        if (!plaintext.trim()) { setError(lang === 'vi' ? 'Vui lòng nhập văn bản' : 'Please enter text'); return }

        try {
            setIsProcessing(true)
            let result = ''
            if (activeTab === 'caesar') {
                result = caesarEncrypt(plaintext, caesarShift)
                animateSteps(caesarSteps(plaintext, caesarShift, true))
            } else if (activeTab === 'vigenere') {
                if (!vigenereKey.trim() || !/^[a-zA-Z]+$/.test(vigenereKey)) {
                    setError(lang === 'vi' ? 'Key phải chứa chỉ chữ cái' : 'Key must contain only letters')
                    setIsProcessing(false)
                    return
                }
                result = vigenereEncrypt(plaintext, vigenereKey)
                // Build similar step visualization
                const k = vigenereKey.toUpperCase()
                let ki = 0
                const steps = plaintext.split('').map(ch => {
                    const isLetter = /[a-zA-Z]/.test(ch)
                    const shift = isLetter ? k.charCodeAt(ki % k.length) - 65 : 0
                    const base = ch === ch.toUpperCase() ? 65 : 97
                    const shifted = isLetter
                        ? String.fromCharCode(((ch.charCodeAt(0) - base + shift) % 26) + base)
                        : ch
                    if (isLetter) ki++
                    return { original: ch, shifted, isLetter, shiftAmount: shift, keyChar: isLetter ? k[((ki - 1) % k.length)] : '' }
                })
                animateSteps(steps)
            } else if (activeTab === 'aes') {
                if (!aesPassword.trim()) {
                    setError(lang === 'vi' ? 'Vui lòng nhập mật khẩu' : 'Please enter a password')
                    setIsProcessing(false)
                    return
                }
                result = await aesEncrypt(plaintext, aesPassword)
                setVisSteps([])
            }
            setCiphertext(result)
        } catch (e) {
            setError(e.message)
        } finally {
            setIsProcessing(false)
        }
    }

    // ── Decrypt handler ──
    const handleDecrypt = async () => {
        setError('')
        setDirection('decrypt')
        if (!ciphertext.trim()) { setError(lang === 'vi' ? 'Vui lòng nhập bản mã' : 'Please enter ciphertext'); return }

        try {
            setIsProcessing(true)
            let result = ''
            if (activeTab === 'caesar') {
                result = caesarDecrypt(ciphertext, caesarShift)
                animateSteps(caesarSteps(ciphertext, caesarShift, false))
            } else if (activeTab === 'vigenere') {
                result = vigenereDecrypt(ciphertext, vigenereKey)
                setVisSteps([])
            } else if (activeTab === 'aes') {
                result = await aesDecrypt(ciphertext, aesPassword)
                setVisSteps([])
            }
            setPlaintext(result)
        } catch (e) {
            setError(lang === 'vi' ? 'Giải mã thất bại! Key không đúng hoặc dữ liệu bị hỏng.' : 'Decryption failed! Wrong key or corrupted data.')
        } finally {
            setIsProcessing(false)
        }
    }

    // ── Caesar Brute Force ──
    const [bruteResults, setBruteResults] = useState([])
    const handleBruteForce = () => {
        if (!ciphertext.trim()) return
        const results = []
        for (let s = 1; s <= 25; s++) {
            results.push({ shift: s, text: caesarDecrypt(ciphertext, s) })
        }
        setBruteResults(results)
    }

    // ── Render ──
    return (
        <div className="lab-animate-in">
            {/* Section Title */}
            <div className="lab-section">
                <h2 className="lab-section-title" style={{ fontSize: '1.3rem' }}>
                    🔐 {t('lab_encryption_title')}
                </h2>
                <p style={{ color: 'var(--lab-text-dim)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    {t('lab_encryption_desc')}
                </p>
            </div>

            {/* Algorithm Tabs */}
            <div className="lab-tabs">
                {['caesar', 'vigenere', 'aes'].map(tab => (
                    <button
                        key={tab}
                        className={`lab-tab ${activeTab === tab ? 'active' : ''}`}
                        onClick={() => { setActiveTab(tab); setVisSteps([]); setBruteResults([]); setError(''); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                    >
                        {tab === 'caesar' ? '🏛️ Caesar' : tab === 'vigenere' ? '🔤 Vigenère' : '🔒 AES-256'}
                    </button>
                ))}
            </div>

            {/* Main Simulation Area */}
            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {/* Input Section */}
                <div className="lab-visual-panel">
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                        {/* Plaintext */}
                        <div className="lab-input-group">
                            <label className="lab-input-label">
                                📝 {lang === 'vi' ? 'Văn bản gốc (Plaintext)' : 'Plaintext'}
                            </label>
                            <AIInput
                                as="textarea"
                                className="lab-input lab-textarea"
                                value={plaintext}
                                onChange={e => setPlaintext(e.target.value)}
                                labType="encryption"
                                placeholder={lang === 'vi' ? 'Nhập văn bản cần mã hóa...' : 'Enter text to encrypt...'}
                                rows={3}
                            />
                        </div>

                        {/* Ciphertext */}
                        <div className="lab-input-group">
                            <label className="lab-input-label">
                                🔒 {lang === 'vi' ? 'Bản mã (Ciphertext)' : 'Ciphertext'}
                            </label>
                            <AIInput
                                as="textarea"
                                className="lab-input lab-textarea"
                                value={ciphertext}
                                onChange={e => setCiphertext(e.target.value)}
                                labType="encryption"
                                placeholder={lang === 'vi' ? 'Kết quả giải mã sẽ được dùng để Auto-Suggest hoặc nhập payload...' : 'Ciphertext payload...'}
                                rows={3}
                            />
                        </div>
                    </div>

                    {/* Key Input — different per algorithm */}
                    <div style={{ marginTop: '1rem' }}>
                        {activeTab === 'caesar' && (
                            <div className="lab-input-group">
                                <label className="lab-input-label">
                                    🔑 {lang === 'vi' ? 'Độ dịch chuyển (Shift)' : 'Shift Amount'}: <strong style={{ color: 'var(--lab-cyan)' }}>{caesarShift}</strong>
                                </label>
                                <input
                                    type="range" min="1" max="25" value={caesarShift}
                                    onChange={e => setCaesarShift(parseInt(e.target.value))}
                                    style={{
                                        width: '100%', accentColor: 'var(--lab-blue)',
                                        background: 'transparent', cursor: 'pointer'
                                    }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--lab-text-dim)' }}>
                                    <span>1</span><span>13 (ROT13)</span><span>25</span>
                                </div>
                            </div>
                        )}

                        {activeTab === 'vigenere' && (
                            <div className="lab-input-group">
                                <label className="lab-input-label">
                                    🔑 {lang === 'vi' ? 'Từ khóa (Keyword)' : 'Keyword'}
                                </label>
                                <AIInput
                                    className="lab-input"
                                    value={vigenereKey}
                                    onChange={e => setVigenereKey(e.target.value.replace(/[^a-zA-Z]/g, ''))}
                                    labType="encryption"
                                    placeholder="SECRET"
                                    maxLength={20}
                                />
                            </div>
                        )}

                        {activeTab === 'aes' && (
                            <div className="lab-input-group">
                                <label className="lab-input-label">
                                    🔑 {lang === 'vi' ? 'Mật khẩu (Password)' : 'Password / Passphrase'}
                                </label>
                                <AIInput
                                    className="lab-input"
                                    type="password"
                                    value={aesPassword}
                                    onChange={e => setAesPassword(e.target.value)}
                                    labType="encryption"
                                    placeholder={lang === 'vi' ? 'Nhập mật khẩu bất kỳ...' : 'Enter any passphrase...'}
                                />
                            </div>
                        )}
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                        <button className="lab-btn lab-btn-primary" onClick={handleEncrypt} disabled={isProcessing}>
                            {isProcessing && direction === 'encrypt' ? '⏳' : '🔒'}{' '}
                            {lang === 'vi' ? 'Mã hóa' : 'Encrypt'}
                        </button>
                        <button className="lab-btn lab-btn-success" onClick={handleDecrypt} disabled={isProcessing}>
                            {isProcessing && direction === 'decrypt' ? '⏳' : '🔓'}{' '}
                            {lang === 'vi' ? 'Giải mã' : 'Decrypt'}
                        </button>
                        <button className="lab-btn lab-btn-secondary" onClick={() => {
                            setPlaintext(''); setCiphertext(''); setVisSteps([]); setBruteResults([]); setError('')
                        }}>
                            🔄 Reset
                        </button>
                        {activeTab === 'caesar' && ciphertext && (
                            <button className="lab-btn lab-btn-danger" onClick={handleBruteForce}>
                                ⚡ Brute Force (25 {lang === 'vi' ? 'thử' : 'tries'})
                            </button>
                        )}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div style={{
                            marginTop: '0.75rem', padding: '0.6rem 1rem',
                            background: 'var(--lab-red-dim)', border: '1px solid rgba(248,81,73,0.3)',
                            borderRadius: '6px', color: 'var(--lab-red)', fontSize: '0.85rem'
                        }}>
                            ❌ {error}
                        </div>
                    )}
                </div>

                {/* Visual Step-by-Step (Caesar & Vigenère) */}
                {visSteps.length > 0 && (
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            🎬 {lang === 'vi' ? 'Quá trình mã hóa từng bước' : 'Step-by-Step Visualization'}
                        </h3>
                        <div style={{
                            display: 'flex', flexWrap: 'wrap', gap: '4px',
                            fontFamily: "'JetBrains Mono', monospace"
                        }}>
                            {visSteps.map((step, i) => (
                                <div key={i} style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center',
                                    padding: '0.5rem 0.35rem',
                                    minWidth: 36,
                                    background: i < animatingIdx
                                        ? (step.isLetter ? 'rgba(88,166,255,0.08)' : 'transparent')
                                        : 'transparent',
                                    borderRadius: 6,
                                    opacity: i < animatingIdx ? 1 : 0.2,
                                    transition: 'all 0.15s ease',
                                    transform: i < animatingIdx ? 'scale(1)' : 'scale(0.85)',
                                }}>
                                    {/* Original char */}
                                    <span style={{ color: 'var(--lab-text-dim)', fontSize: '0.8rem' }}>
                                        {step.original}
                                    </span>
                                    {/* Arrow + shift info */}
                                    {step.isLetter ? (
                                        <span style={{ color: 'var(--lab-yellow)', fontSize: '0.6rem', margin: '2px 0' }}>
                                            {activeTab === 'vigenere' && step.keyChar ? `${step.keyChar}` : ''}
                                            +{step.shiftAmount}
                                        </span>
                                    ) : (
                                        <span style={{ color: 'var(--lab-text-dim)', fontSize: '0.6rem', margin: '2px 0' }}>—</span>
                                    )}
                                    <span style={{ fontSize: '0.65rem', color: 'var(--lab-text-dim)' }}>↓</span>
                                    {/* Result char */}
                                    <span style={{
                                        color: step.isLetter ? 'var(--lab-cyan)' : 'var(--lab-text-dim)',
                                        fontSize: '0.95rem',
                                        fontWeight: step.isLetter ? 700 : 400,
                                    }}>
                                        {step.shifted}
                                    </span>
                                </div>
                            ))}
                        </div>

                        {/* Summary */}
                        {animatingIdx >= visSteps.length && (
                            <div style={{
                                marginTop: '1rem', padding: '0.6rem 1rem',
                                background: 'var(--lab-green-dim)',
                                border: '1px solid rgba(63,185,80,0.2)',
                                borderRadius: 6, fontSize: '0.82rem',
                                color: 'var(--lab-green)',
                            }}>
                                ✅ {lang === 'vi'
                                    ? `Hoàn thành! ${visSteps.filter(s => s.isLetter).length} ký tự đã được biến đổi.`
                                    : `Done! ${visSteps.filter(s => s.isLetter).length} characters transformed.`
                                }
                            </div>
                        )}
                    </div>
                )}

                {/* AES Process Info */}
                {activeTab === 'aes' && ciphertext && (
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            🔧 {lang === 'vi' ? 'Quy trình AES-256-GCM' : 'AES-256-GCM Process'}
                        </h3>
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {[
                                { step: 1, label: lang === 'vi' ? 'Tạo key từ password' : 'Derive key from password', detail: 'PBKDF2 w/ SHA-256, 100k iterations', color: 'var(--lab-purple)' },
                                { step: 2, label: lang === 'vi' ? 'Tạo IV ngẫu nhiên' : 'Generate random IV', detail: '12 bytes (96-bit) random nonce', color: 'var(--lab-blue)' },
                                { step: 3, label: lang === 'vi' ? 'Mã hóa với AES-GCM' : 'Encrypt with AES-GCM', detail: '256-bit key, authenticated encryption', color: 'var(--lab-cyan)' },
                                { step: 4, label: lang === 'vi' ? 'Ghép IV + Ciphertext' : 'Combine IV + Ciphertext', detail: 'Base64 encoded for transport', color: 'var(--lab-green)' },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '0.75rem', background: 'rgba(0,0,0,0.2)',
                                    borderRadius: 8, borderLeft: `3px solid ${item.color}`,
                                }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        background: item.color, display: 'flex',
                                        alignItems: 'center', justifyContent: 'center',
                                        fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0,
                                    }}>{item.step}</div>
                                    <div>
                                        <div style={{ fontWeight: 600, color: 'var(--lab-heading)', fontSize: '0.88rem' }}>{item.label}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--lab-text-dim)', fontFamily: 'monospace' }}>{item.detail}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Caesar Brute Force Results */}
                {bruteResults.length > 0 && (
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            ⚡ {lang === 'vi' ? 'Kết quả Brute Force' : 'Brute Force Results'}
                        </h3>
                        <p style={{ color: 'var(--lab-text-dim)', fontSize: '0.82rem', marginBottom: '1rem' }}>
                            {lang === 'vi'
                                ? 'Tất cả 25 khả năng giải mã — bạn có thể tìm ra bản gốc không?'
                                : 'All 25 possible decryptions — can you spot the original?'
                            }
                        </p>
                        <div style={{
                            maxHeight: 300, overflowY: 'auto',
                            display: 'grid', gap: '4px',
                        }}>
                            {bruteResults.map((r, i) => {
                                const isMatch = r.shift === caesarShift
                                return (
                                    <div key={i} style={{
                                        display: 'flex', gap: '1rem', alignItems: 'center',
                                        padding: '0.45rem 0.75rem',
                                        background: isMatch ? 'var(--lab-green-dim)' : 'rgba(0,0,0,0.15)',
                                        borderRadius: 6,
                                        border: isMatch ? '1px solid rgba(63,185,80,0.3)' : '1px solid transparent',
                                        fontSize: '0.82rem', fontFamily: "'JetBrains Mono', monospace",
                                    }}>
                                        <span style={{
                                            color: isMatch ? 'var(--lab-green)' : 'var(--lab-text-dim)',
                                            fontWeight: 700, minWidth: 50,
                                        }}>
                                            shift={r.shift}
                                        </span>
                                        <span style={{
                                            color: isMatch ? 'var(--lab-green)' : 'var(--lab-text)',
                                            flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                        }}>
                                            {r.text}
                                        </span>
                                        {isMatch && (
                                            <span style={{ color: 'var(--lab-green)', fontWeight: 700 }}>✅ {lang === 'vi' ? 'ĐÚNG!' : 'MATCH!'}</span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                        <div className="lab-theory-note danger" style={{ marginTop: '1rem' }}>
                            🚨 {lang === 'vi'
                                ? 'Đây là lý do Caesar cực kỳ yếu — chỉ cần 25 lần thử là phá được! Trong thực tế, không bao giờ dùng Caesar cho dữ liệu quan trọng.'
                                : 'This is why Caesar is extremely weak — only 25 tries to crack! In practice, never use Caesar for important data.'
                            }
                        </div>
                    </div>
                )}

                {/* Alphabet Wheel (Caesar visual aid) */}
                {activeTab === 'caesar' && (
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            🎡 {lang === 'vi' ? 'Bảng chữ cái dịch chuyển' : 'Shifted Alphabet Table'}
                        </h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{
                                width: '100%', borderCollapse: 'collapse',
                                fontFamily: "'JetBrains Mono', monospace", fontSize: '0.82rem',
                            }}>
                                <thead>
                                    <tr>
                                        <td style={{ padding: '0.5rem', color: 'var(--lab-text-dim)', fontWeight: 700, fontSize: '0.7rem' }}>
                                            {lang === 'vi' ? 'GỐC' : 'PLAIN'}
                                        </td>
                                        {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(ch => (
                                            <td key={ch} style={{
                                                padding: '0.4rem 0.3rem', textAlign: 'center',
                                                color: 'var(--lab-text)', borderBottom: '1px solid var(--lab-border)',
                                            }}>{ch}</td>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td style={{ padding: '0.5rem', color: 'var(--lab-cyan)', fontWeight: 700, fontSize: '0.7rem' }}>
                                            +{caesarShift}
                                        </td>
                                        {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map(ch => (
                                            <td key={ch} style={{
                                                padding: '0.4rem 0.3rem', textAlign: 'center',
                                                color: 'var(--lab-cyan)', fontWeight: 600,
                                                background: 'rgba(57,208,216,0.06)',
                                            }}>
                                                {String.fromCharCode(((ch.charCodeAt(0) - 65 + caesarShift) % 26) + 65)}
                                            </td>
                                        ))}
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* Comparison Table */}
                <div className="lab-visual-panel">
                    <h3 className="lab-section-title">
                        📊 {lang === 'vi' ? 'So sánh thuật toán' : 'Algorithm Comparison'}
                    </h3>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{
                            width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem',
                        }}>
                            <thead>
                                <tr style={{ borderBottom: '1px solid var(--lab-border)' }}>
                                    {[
                                        lang === 'vi' ? 'Thuật toán' : 'Algorithm',
                                        lang === 'vi' ? 'Loại' : 'Type',
                                        lang === 'vi' ? 'Key Space' : 'Key Space',
                                        lang === 'vi' ? 'Bảo mật' : 'Security',
                                        lang === 'vi' ? 'Tốc độ' : 'Speed',
                                    ].map(h => (
                                        <th key={h} style={{
                                            padding: '0.6rem', textAlign: 'left',
                                            color: 'var(--lab-text-dim)', fontWeight: 600,
                                            fontSize: '0.72rem', textTransform: 'uppercase',
                                            letterSpacing: '0.05em',
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    {
                                        name: 'Caesar', type: lang === 'vi' ? 'Đối xứng' : 'Symmetric',
                                        keys: '25', security: '❌', secLabel: lang === 'vi' ? 'Rất yếu' : 'Very weak',
                                        speed: '⚡⚡⚡⚡⚡', secColor: 'var(--lab-red)',
                                    },
                                    {
                                        name: 'Vigenère', type: lang === 'vi' ? 'Đối xứng' : 'Symmetric',
                                        keys: '26^n', security: '⚠️', secLabel: lang === 'vi' ? 'Yếu' : 'Weak',
                                        speed: '⚡⚡⚡⚡⚡', secColor: 'var(--lab-yellow)',
                                    },
                                    {
                                        name: 'AES-256', type: lang === 'vi' ? 'Đối xứng' : 'Symmetric',
                                        keys: '2²⁵⁶', security: '✅', secLabel: lang === 'vi' ? 'Cực mạnh' : 'Very strong',
                                        speed: '⚡⚡⚡⚡', secColor: 'var(--lab-green)',
                                    },
                                    {
                                        name: 'RSA-2048', type: lang === 'vi' ? 'Bất đối xứng' : 'Asymmetric',
                                        keys: '~2²⁰⁴⁸', security: '✅', secLabel: lang === 'vi' ? 'Mạnh' : 'Strong',
                                        speed: '⚡', secColor: 'var(--lab-green)',
                                    },
                                ].map((row, i) => (
                                    <tr key={i} style={{
                                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                                        background: activeTab === row.name.toLowerCase().split('-')[0] ? 'rgba(88,166,255,0.04)' : 'transparent',
                                    }}>
                                        <td style={{ padding: '0.6rem', fontWeight: 600, color: 'var(--lab-heading)' }}>{row.name}</td>
                                        <td style={{ padding: '0.6rem', color: 'var(--lab-text-dim)' }}>{row.type}</td>
                                        <td style={{ padding: '0.6rem', fontFamily: 'monospace', color: 'var(--lab-purple)' }}>{row.keys}</td>
                                        <td style={{ padding: '0.6rem' }}>
                                            <span style={{ color: row.secColor, fontWeight: 600 }}>{row.security} {row.secLabel}</span>
                                        </td>
                                        <td style={{ padding: '0.6rem' }}>{row.speed}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
