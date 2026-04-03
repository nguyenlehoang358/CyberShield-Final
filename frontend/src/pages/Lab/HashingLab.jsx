import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import AIInput from '../../components/common/AIInput'
/* ──────────────────────────────────────
   HASH ALGORITHMS
   ────────────────────────────────────── */

// ── MD5 (pure JS implementation) ──
function md5(string) {
    function cmn(q, a, b, x, s, t) { a = (a + q + (x >>> 0) + t) | 0; return ((a << s) | (a >>> (32 - s))) + b | 0 }
    function ff(a, b, c, d, x, s, t) { return cmn((b & c) | (~b & d), a, b, x, s, t) }
    function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & ~d), a, b, x, s, t) }
    function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t) }
    function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | ~d), a, b, x, s, t) }

    const bytes = []
    for (let i = 0; i < string.length; i++) {
        const code = string.charCodeAt(i)
        if (code < 128) bytes.push(code)
        else if (code < 2048) { bytes.push(192 | (code >> 6)); bytes.push(128 | (code & 63)) }
        else { bytes.push(224 | (code >> 12)); bytes.push(128 | ((code >> 6) & 63)); bytes.push(128 | (code & 63)) }
    }

    const n = bytes.length
    bytes.push(0x80)
    while (bytes.length % 64 !== 56) bytes.push(0)
    const bitLen = n * 8
    bytes.push(bitLen & 0xff, (bitLen >> 8) & 0xff, (bitLen >> 16) & 0xff, (bitLen >> 24) & 0xff, 0, 0, 0, 0)

    let a = 0x67452301, b = 0xefcdab89, c = 0x98badcfe, d = 0x10325476
    for (let i = 0; i < bytes.length; i += 64) {
        const w = []
        for (let j = 0; j < 16; j++) w[j] = bytes[i + j * 4] | (bytes[i + j * 4 + 1] << 8) | (bytes[i + j * 4 + 2] << 16) | (bytes[i + j * 4 + 3] << 24)
        let aa = a, bb = b, cc = c, dd = d
        a = ff(a, b, c, d, w[0], 7, -680876936); d = ff(d, a, b, c, w[1], 12, -389564586); c = ff(c, d, a, b, w[2], 17, 606105819); b = ff(b, c, d, a, w[3], 22, -1044525330)
        a = ff(a, b, c, d, w[4], 7, -176418897); d = ff(d, a, b, c, w[5], 12, 1200080426); c = ff(c, d, a, b, w[6], 17, -1473231341); b = ff(b, c, d, a, w[7], 22, -45705983)
        a = ff(a, b, c, d, w[8], 7, 1770035416); d = ff(d, a, b, c, w[9], 12, -1958414417); c = ff(c, d, a, b, w[10], 17, -42063); b = ff(b, c, d, a, w[11], 22, -1990404162)
        a = ff(a, b, c, d, w[12], 7, 1804603682); d = ff(d, a, b, c, w[13], 12, -40341101); c = ff(c, d, a, b, w[14], 17, -1502002290); b = ff(b, c, d, a, w[15], 22, 1236535329)
        a = gg(a, b, c, d, w[1], 5, -165796510); d = gg(d, a, b, c, w[6], 9, -1069501632); c = gg(c, d, a, b, w[11], 14, 643717713); b = gg(b, c, d, a, w[0], 20, -373897302)
        a = gg(a, b, c, d, w[5], 5, -701558691); d = gg(d, a, b, c, w[10], 9, 38016083); c = gg(c, d, a, b, w[15], 14, -660478335); b = gg(b, c, d, a, w[4], 20, -405537848)
        a = gg(a, b, c, d, w[9], 5, 568446438); d = gg(d, a, b, c, w[14], 9, -1019803690); c = gg(c, d, a, b, w[3], 14, -187363961); b = gg(b, c, d, a, w[8], 20, 1163531501)
        a = gg(a, b, c, d, w[13], 5, -1444681467); d = gg(d, a, b, c, w[2], 9, -51403784); c = gg(c, d, a, b, w[7], 14, 1735328473); b = gg(b, c, d, a, w[12], 20, -1926607734)
        a = hh(a, b, c, d, w[5], 4, -378558); d = hh(d, a, b, c, w[8], 11, -2022574463); c = hh(c, d, a, b, w[11], 16, 1839030562); b = hh(b, c, d, a, w[14], 23, -35309556)
        a = hh(a, b, c, d, w[1], 4, -1530992060); d = hh(d, a, b, c, w[4], 11, 1272893353); c = hh(c, d, a, b, w[7], 16, -155497632); b = hh(b, c, d, a, w[10], 23, -1094730640)
        a = hh(a, b, c, d, w[13], 4, 681279174); d = hh(d, a, b, c, w[0], 11, -358537222); c = hh(c, d, a, b, w[3], 16, -722521979); b = hh(b, c, d, a, w[6], 23, 76029189)
        a = hh(a, b, c, d, w[9], 4, -640364487); d = hh(d, a, b, c, w[12], 11, -421815835); c = hh(c, d, a, b, w[15], 16, 530742520); b = hh(b, c, d, a, w[2], 23, -995338651)
        a = ii(a, b, c, d, w[0], 6, -198630844); d = ii(d, a, b, c, w[7], 10, 1126891415); c = ii(c, d, a, b, w[14], 15, -1416354905); b = ii(b, c, d, a, w[5], 21, -57434055)
        a = ii(a, b, c, d, w[12], 6, 1700485571); d = ii(d, a, b, c, w[3], 10, -1894986606); c = ii(c, d, a, b, w[10], 15, -1051523); b = ii(b, c, d, a, w[1], 21, -2054922799)
        a = ii(a, b, c, d, w[8], 6, 1873313359); d = ii(d, a, b, c, w[15], 10, -30611744); c = ii(c, d, a, b, w[6], 15, -1560198380); b = ii(b, c, d, a, w[13], 21, 1309151649)
        a = ii(a, b, c, d, w[4], 6, -145523070); d = ii(d, a, b, c, w[11], 10, -1120210379); c = ii(c, d, a, b, w[2], 15, 718787259); b = ii(b, c, d, a, w[9], 21, -343485551)
        a = (a + aa) | 0; b = (b + bb) | 0; c = (c + cc) | 0; d = (d + dd) | 0
    }
    const hex = x => {
        let s = ''
        for (let i = 0; i < 4; i++) s += ('0' + ((x >> (i * 8)) & 0xff).toString(16)).slice(-2)
        return s
    }
    return hex(a) + hex(b) + hex(c) + hex(d)
}

// ── SHA family via Web Crypto API ──
async function shaHash(algorithm, text) {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const hashBuffer = await crypto.subtle.digest(algorithm, data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

// Compute all hashes for a given input
async function computeAllHashes(text) {
    const [sha1, sha256, sha512] = await Promise.all([
        shaHash('SHA-1', text),
        shaHash('SHA-256', text),
        shaHash('SHA-512', text),
    ])
    return {
        md5: md5(text),
        sha1,
        sha256,
        sha512,
    }
}

// Compare two hex strings and return diff info
function compareHashes(hash1, hash2) {
    if (!hash1 || !hash2 || hash1.length !== hash2.length) return { diffCount: 0, total: 0, percent: 0, diffs: [] }
    let diffCount = 0
    const diffs = []
    for (let i = 0; i < hash1.length; i++) {
        const isDiff = hash1[i] !== hash2[i]
        if (isDiff) diffCount++
        diffs.push(isDiff)
    }
    return {
        diffCount,
        total: hash1.length,
        percent: Math.round((diffCount / hash1.length) * 100),
        diffs,
    }
}

// Bit-level comparison for avalanche
function compareBits(hash1, hash2) {
    let totalBits = 0, differentBits = 0
    for (let i = 0; i < hash1.length; i++) {
        const b1 = parseInt(hash1[i], 16)
        const b2 = parseInt(hash2[i], 16)
        const xor = b1 ^ b2
        totalBits += 4
        differentBits += [0, 1, 1, 2, 1, 2, 2, 3, 1, 2, 2, 3, 2, 3, 3, 4][xor]
    }
    return { totalBits, differentBits, percent: Math.round((differentBits / totalBits) * 100) }
}

/* ──────────────────────────────────────
   THEORY SIDEBAR CONTENT
   ────────────────────────────────────── */
function HashingTheory({ lang }) {
    if (lang === 'vi') {
        return (
            <>
                <h3>Hàm băm là gì?</h3>
                <p>
                    Hàm băm (Hash Function) biến đổi dữ liệu có độ dài bất kỳ thành
                    chuỗi có độ dài cố định. Quá trình này là <strong>một chiều</strong> —
                    không thể giải mã ngược.
                </p>

                <h3>Đặc tính quan trọng</h3>
                <ul>
                    <li><strong>Deterministic</strong> — Cùng input luôn cho cùng output</li>
                    <li><strong>One-way</strong> — Không thể tìm ngược input từ hash</li>
                    <li><strong>Fixed length</strong> — Output luôn có cùng độ dài</li>
                    <li><strong>Avalanche effect</strong> — Thay đổi 1 bit → ~50% output thay đổi</li>
                    <li><strong>Collision resistant</strong> — Rất khó tìm 2 input có cùng hash</li>
                </ul>

                <h3>MD5 (128-bit)</h3>
                <p>
                    Tạo ra năm 1991, output 32 ký tự hex. Đã bị phá vào 2004 —
                    tìm được collision trong vài giây.
                </p>
                <div className="lab-theory-note danger">
                    🚫 KHÔNG dùng MD5 cho bảo mật! Chỉ dùng cho checksum file.
                </div>

                <h3>SHA-256 (256-bit)</h3>
                <p>
                    Thuộc họ SHA-2, output 64 ký tự hex. An toàn, được dùng trong
                    Bitcoin, SSL/TLS, và nhiều hệ thống bảo mật.
                </p>

                <h3>SHA-512 (512-bit)</h3>
                <p>
                    Phiên bản mạnh hơn của SHA-256, output 128 ký tự hex.
                    Phù hợp cho hệ thống yêu cầu bảo mật cao nhất.
                </p>

                <h3>Ứng dụng thực tế</h3>
                <ul>
                    <li><strong>Lưu mật khẩu</strong> — bcrypt/argon2 (hash + salt)</li>
                    <li><strong>Blockchain</strong> — SHA-256 hash chain</li>
                    <li><strong>Kiểm tra file</strong> — checksum integrity</li>
                    <li><strong>Chữ ký số</strong> — hash trước khi ký</li>
                </ul>

                <div className="lab-theory-note success">
                    ✅ Hash ≠ Mã hóa. Hash không thể giải mã ngược, mã hóa có thể giải mã bằng key.
                </div>
            </>
        )
    }

    return (
        <>
            <h3>What is Hashing?</h3>
            <p>
                A Hash Function transforms data of any length into a fixed-length string.
                This process is <strong>one-way</strong> — you cannot reverse it to find the original input.
            </p>

            <h3>Key Properties</h3>
            <ul>
                <li><strong>Deterministic</strong> — Same input always gives same output</li>
                <li><strong>One-way</strong> — Cannot reverse hash to find input</li>
                <li><strong>Fixed length</strong> — Output always has same length</li>
                <li><strong>Avalanche effect</strong> — Change 1 bit → ~50% output changes</li>
                <li><strong>Collision resistant</strong> — Very hard to find 2 inputs with same hash</li>
            </ul>

            <h3>MD5 (128-bit)</h3>
            <p>
                Created in 1991, outputs 32 hex characters. Broken in 2004 —
                collisions can be found in seconds.
            </p>
            <div className="lab-theory-note danger">
                🚫 Do NOT use MD5 for security! Only for file checksums.
            </div>

            <h3>SHA-256 (256-bit)</h3>
            <p>
                Part of SHA-2 family, outputs 64 hex characters. Secure, used in
                Bitcoin, SSL/TLS, and many security systems.
            </p>

            <h3>SHA-512 (512-bit)</h3>
            <p>
                Stronger version of SHA-256, outputs 128 hex characters.
                Suitable for systems requiring highest security.
            </p>

            <h3>Real-world Uses</h3>
            <ul>
                <li><strong>Password storage</strong> — bcrypt/argon2 (hash + salt)</li>
                <li><strong>Blockchain</strong> — SHA-256 hash chain</li>
                <li><strong>File integrity</strong> — checksum verification</li>
                <li><strong>Digital signatures</strong> — hash before signing</li>
            </ul>

            <div className="lab-theory-note success">
                ✅ Hash ≠ Encryption. Hashing cannot be reversed, encryption can be decrypted with a key.
            </div>
        </>
    )
}

/* ──────────────────────────────────────
   HASH DISPLAY COMPONENT
   ────────────────────────────────────── */
function HashDisplay({ label, hash, compareWith, color, bits }) {
    const diff = compareWith ? compareHashes(hash, compareWith) : null
    return (
        <div style={{ marginBottom: '0.75rem' }}>
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                marginBottom: '0.3rem',
            }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {label} <span style={{ color: 'var(--lab-text-dim)', fontWeight: 400 }}>({bits}-bit)</span>
                </span>
                {diff && diff.total > 0 && (
                    <span style={{
                        fontSize: '0.7rem', fontWeight: 700,
                        color: diff.percent > 40 ? 'var(--lab-red)' : diff.percent > 20 ? 'var(--lab-yellow)' : 'var(--lab-green)',
                    }}>
                        {diff.diffCount}/{diff.total} chars ({diff.percent}% changed)
                    </span>
                )}
            </div>
            <div style={{
                padding: '0.5rem 0.7rem',
                background: 'rgba(0,0,0,0.3)',
                borderRadius: 6,
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: '0.78rem',
                wordBreak: 'break-all',
                lineHeight: 1.8,
                border: '1px solid var(--lab-border)',
            }}>
                {hash ? hash.split('').map((ch, i) => (
                    <span key={i} style={{
                        color: diff && diff.diffs[i]
                            ? 'var(--lab-red)'
                            : 'var(--lab-cyan)',
                        fontWeight: diff && diff.diffs[i] ? 700 : 400,
                        background: diff && diff.diffs[i] ? 'rgba(248,81,73,0.12)' : 'transparent',
                        borderRadius: 2,
                        padding: diff && diff.diffs[i] ? '0 1px' : 0,
                        transition: 'all 0.2s',
                    }}>
                        {ch}
                    </span>
                )) : (
                    <span style={{ color: 'var(--lab-text-dim)', fontStyle: 'italic' }}>—</span>
                )}
            </div>
        </div>
    )
}

/* ──────────────────────────────────────
   MAIN COMPONENT
   ────────────────────────────────────── */
export default function HashingLab() {
    const { t, lang } = useLanguage()
    const { setTheory } = useOutletContext()

    // Main hash state
    const [input, setInput] = useState('Hello World')
    const [hashes, setHashes] = useState({ md5: '', sha1: '', sha256: '', sha512: '' })

    // Avalanche state
    const [avalInput1, setAvalInput1] = useState('Hello World')
    const [avalInput2, setAvalInput2] = useState('Hello World!')
    const [avalHashes1, setAvalHashes1] = useState({ md5: '', sha1: '', sha256: '', sha512: '' })
    const [avalHashes2, setAvalHashes2] = useState({ md5: '', sha1: '', sha256: '', sha512: '' })
    const [avalBits, setAvalBits] = useState(null)

    // Collision state
    const [collInput1, setCollInput1] = useState('')
    const [collInput2, setCollInput2] = useState('')
    const [collHash1, setCollHash1] = useState('')
    const [collHash2, setCollHash2] = useState('')
    const [collAlgo, setCollAlgo] = useState('md5')

    // Active section
    const [activeSection, setActiveSection] = useState('realtime')

    // Set theory
    useEffect(() => {
        setTheory(<HashingTheory lang={lang} />)
    }, [setTheory, lang])

    // ── Real-time hash computation ──
    useEffect(() => {
        if (!input) { setHashes({ md5: '', sha1: '', sha256: '', sha512: '' }); return }
        let cancelled = false
        computeAllHashes(input).then(h => { if (!cancelled) setHashes(h) })
        return () => { cancelled = true }
    }, [input])

    // ── Avalanche computation ──
    useEffect(() => {
        if (!avalInput1 || !avalInput2) return
        let cancelled = false
        Promise.all([computeAllHashes(avalInput1), computeAllHashes(avalInput2)]).then(([h1, h2]) => {
            if (cancelled) return
            setAvalHashes1(h1)
            setAvalHashes2(h2)
            setAvalBits(compareBits(h1.sha256, h2.sha256))
        })
        return () => { cancelled = true }
    }, [avalInput1, avalInput2])

    // ── Collision check ──
    useEffect(() => {
        if (!collInput1) { setCollHash1(''); return }
        if (collAlgo === 'md5') setCollHash1(md5(collInput1))
        else shaHash(collAlgo === 'sha1' ? 'SHA-1' : 'SHA-256', collInput1).then(setCollHash1)
    }, [collInput1, collAlgo])

    useEffect(() => {
        if (!collInput2) { setCollHash2(''); return }
        if (collAlgo === 'md5') setCollHash2(md5(collInput2))
        else shaHash(collAlgo === 'sha1' ? 'SHA-1' : 'SHA-256', collInput2).then(setCollHash2)
    }, [collInput2, collAlgo])

    const collisionMatch = collHash1 && collHash2 && collHash1 === collHash2 && collInput1 !== collInput2

    // Render
    return (
        <div className="lab-animate-in">
            {/* Title */}
            <div className="lab-section">
                <h2 className="lab-section-title" style={{ fontSize: '1.3rem' }}>
                    #️⃣ {t('lab_hashing_title')}
                </h2>
                <p style={{ color: 'var(--lab-text-dim)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    {t('lab_hashing_desc')}
                </p>
            </div>

            {/* Section Tabs */}
            <div className="lab-tabs">
                {[
                    { id: 'realtime', label: lang === 'vi' ? '⚡ Hash Real-time' : '⚡ Real-time Hash' },
                    { id: 'avalanche', label: lang === 'vi' ? '🏔️ Hiệu ứng tuyết lở' : '🏔️ Avalanche Effect' },
                    { id: 'collision', label: lang === 'vi' ? '💥 Thử Collision' : '💥 Collision Test' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        className={`lab-tab ${activeSection === tab.id ? 'active' : ''}`}
                        onClick={() => { setActiveSection(tab.id); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ═══════ SECTION 1: Real-time Hash ═══════ */}
            {activeSection === 'realtime' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div className="lab-visual-panel">
                        <div className="lab-input-group">
                            <label className="lab-input-label">
                                📝 {lang === 'vi' ? 'Nhập văn bản' : 'Input Text'}
                            </label>
                            <AIInput
                                as="textarea"
                                className="lab-input lab-textarea"
                                value={input}
                                onChange={e => setInput(e.target.value)}
                                labType="hashing"
                                placeholder={lang === 'vi' ? 'Gõ bất kỳ thứ gì...' : 'Type anything...'}
                                rows={2}
                            />
                            <div style={{
                                display: 'flex', gap: '0.75rem', marginTop: '0.5rem',
                                fontSize: '0.75rem', color: 'var(--lab-text-dim)',
                            }}>
                                <span>{input.length} {lang === 'vi' ? 'ký tự' : 'chars'}</span>
                                <span>{new TextEncoder().encode(input).length} bytes</span>
                            </div>
                        </div>
                    </div>

                    {/* Hash Results */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title" style={{ marginBottom: '1rem' }}>
                            🔢 {lang === 'vi' ? 'Kết quả Hash (real-time)' : 'Hash Results (real-time)'}
                        </h3>
                        <HashDisplay label="MD5" hash={hashes.md5} color="var(--lab-red)" bits="128" />
                        <HashDisplay label="SHA-1" hash={hashes.sha1} color="var(--lab-yellow)" bits="160" />
                        <HashDisplay label="SHA-256" hash={hashes.sha256} color="var(--lab-green)" bits="256" />
                        <HashDisplay label="SHA-512" hash={hashes.sha512} color="var(--lab-purple)" bits="512" />
                    </div>

                    {/* Properties Visualization */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            📏 {lang === 'vi' ? 'Đặc tính Hash' : 'Hash Properties'}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '0.75rem' }}>
                            {[
                                {
                                    label: lang === 'vi' ? 'Kích thước cố định' : 'Fixed Length',
                                    icon: '📏',
                                    value: `MD5: 32 | SHA-256: 64 | SHA-512: 128`,
                                    detail: lang === 'vi' ? 'Output luôn cùng độ dài, bất kể input' : 'Output always same length regardless of input',
                                    color: 'var(--lab-blue)',
                                },
                                {
                                    label: lang === 'vi' ? 'Xác định' : 'Deterministic',
                                    icon: '🎯',
                                    value: lang === 'vi' ? 'Cùng input = Cùng hash' : 'Same input = Same hash',
                                    detail: lang === 'vi' ? 'Thử gõ lại cùng nội dung để kiểm chứng' : 'Try retyping the same content to verify',
                                    color: 'var(--lab-green)',
                                },
                                {
                                    label: lang === 'vi' ? 'Một chiều' : 'One-way',
                                    icon: '🔒',
                                    value: lang === 'vi' ? 'Hash → Input: Không thể!' : 'Hash → Input: Impossible!',
                                    detail: lang === 'vi' ? 'Không có cách nào giải mã ngược hash' : 'There is no way to reverse a hash',
                                    color: 'var(--lab-purple)',
                                },
                                {
                                    label: lang === 'vi' ? 'Nhạy cảm' : 'Sensitive',
                                    icon: '🏔️',
                                    value: lang === 'vi' ? '1 ký tự → ~50% thay đổi' : '1 char change → ~50% different',
                                    detail: lang === 'vi' ? 'Xem tab Avalanche Effect để demo' : 'See the Avalanche Effect tab for demo',
                                    color: 'var(--lab-cyan)',
                                },
                            ].map((prop, i) => (
                                <div key={i} style={{
                                    padding: '1rem',
                                    background: 'rgba(0,0,0,0.2)',
                                    borderRadius: 10,
                                    borderLeft: `3px solid ${prop.color}`,
                                }}>
                                    <div style={{ fontSize: '1.2rem', marginBottom: '0.3rem' }}>{prop.icon}</div>
                                    <div style={{ fontWeight: 700, color: 'var(--lab-heading)', fontSize: '0.88rem', marginBottom: '0.25rem' }}>{prop.label}</div>
                                    <div style={{ fontSize: '0.78rem', color: prop.color, fontWeight: 600, marginBottom: '0.3rem' }}>{prop.value}</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--lab-text-dim)', lineHeight: 1.5 }}>{prop.detail}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Algorithm Comparison */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">📊 {lang === 'vi' ? 'So sánh thuật toán' : 'Algorithm Comparison'}</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--lab-border)' }}>
                                        {[lang === 'vi' ? 'Thuật toán' : 'Algorithm', 'Output', lang === 'vi' ? 'Bảo mật' : 'Security', lang === 'vi' ? 'Trạng thái' : 'Status', lang === 'vi' ? 'Dùng cho' : 'Use Case'].map(h => (
                                            <th key={h} style={{ padding: '0.6rem', textAlign: 'left', color: 'var(--lab-text-dim)', fontWeight: 600, fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { name: 'MD5', output: '128-bit (32 hex)', sec: '❌', secLabel: lang === 'vi' ? 'Bị phá' : 'Broken', status: 'var(--lab-red)', use: lang === 'vi' ? 'Chỉ checksum' : 'Checksum only' },
                                        { name: 'SHA-1', output: '160-bit (40 hex)', sec: '⚠️', secLabel: lang === 'vi' ? 'Không an toàn' : 'Unsafe', status: 'var(--lab-yellow)', use: lang === 'vi' ? 'Không khuyến khích' : 'Deprecated' },
                                        { name: 'SHA-256', output: '256-bit (64 hex)', sec: '✅', secLabel: lang === 'vi' ? 'An toàn' : 'Secure', status: 'var(--lab-green)', use: 'Blockchain, TLS, JWT' },
                                        { name: 'SHA-512', output: '512-bit (128 hex)', sec: '✅', secLabel: lang === 'vi' ? 'Rất an toàn' : 'Very Secure', status: 'var(--lab-green)', use: lang === 'vi' ? 'Bảo mật cao' : 'High security' },
                                    ].map((r, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <td style={{ padding: '0.6rem', fontWeight: 700, color: 'var(--lab-heading)' }}>{r.name}</td>
                                            <td style={{ padding: '0.6rem', fontFamily: 'monospace', color: 'var(--lab-text-dim)', fontSize: '0.78rem' }}>{r.output}</td>
                                            <td style={{ padding: '0.6rem', color: r.status, fontWeight: 600 }}>{r.sec} {r.secLabel}</td>
                                            <td style={{ padding: '0.6rem' }}>
                                                <span style={{ display: 'inline-block', padding: '0.15rem 0.5rem', borderRadius: 100, fontSize: '0.7rem', fontWeight: 700, background: r.status === 'var(--lab-green)' ? 'var(--lab-green-dim)' : r.status === 'var(--lab-yellow)' ? 'var(--lab-yellow-dim)' : 'var(--lab-red-dim)', color: r.status }}>
                                                    {r.secLabel}
                                                </span>
                                            </td>
                                            <td style={{ padding: '0.6rem', color: 'var(--lab-text-dim)', fontSize: '0.8rem' }}>{r.use}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════ SECTION 2: Avalanche Effect ═══════ */}
            {activeSection === 'avalanche' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            🏔️ {lang === 'vi' ? 'Hiệu ứng tuyết lở (Avalanche Effect)' : 'Avalanche Effect Demo'}
                        </h3>
                        <p style={{ color: 'var(--lab-text-dim)', fontSize: '0.85rem', marginBottom: '1.25rem' }}>
                            {lang === 'vi'
                                ? 'Thay đổi chỉ 1 ký tự trong input → khoảng 50% hash sẽ thay đổi. Thử sửa 1 ký tự bên Input B!'
                                : 'Change just 1 character in input → about 50% of the hash changes. Try editing 1 character in Input B!'}
                        </p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div className="lab-input-group">
                                <label className="lab-input-label">📝 Input A</label>
                                <AIInput
                                    className="lab-input"
                                    value={avalInput1}
                                    onChange={e => setAvalInput1(e.target.value)}
                                    labType="hashing"
                                />
                            </div>
                            <div className="lab-input-group">
                                <label className="lab-input-label">📝 Input B</label>
                                <AIInput
                                    className="lab-input"
                                    value={avalInput2}
                                    onChange={e => setAvalInput2(e.target.value)}
                                    labType="hashing"
                                />
                            </div>
                        </div>

                        {/* Quick preset buttons */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                            {[
                                { a: 'Hello World', b: 'Hello World!', label: '+1 char (!)' },
                                { a: 'abc', b: 'abd', label: 'c → d' },
                                { a: 'password', b: 'Password', label: 'p → P' },
                                { a: '1000000', b: '1000001', label: '0 → 1' },
                            ].map((preset, i) => (
                                <button key={i} className="lab-btn lab-btn-secondary" style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}
                                    onClick={() => { setAvalInput1(preset.a); setAvalInput2(preset.b) }}>
                                    {preset.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Bit-level Avalanche Meter */}
                    {avalBits && (
                        <div className="lab-visual-panel">
                            <h3 className="lab-section-title">
                                📊 {lang === 'vi' ? 'Đo lường Avalanche (SHA-256, cấp bit)' : 'Avalanche Measurement (SHA-256, bit-level)'}
                            </h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
                                <div style={{ flex: 1 }}>
                                    <div style={{
                                        height: 12, borderRadius: 6, background: 'rgba(255,255,255,0.05)',
                                        overflow: 'hidden', position: 'relative',
                                    }}>
                                        <div style={{
                                            height: '100%', borderRadius: 6,
                                            width: `${avalBits.percent}%`,
                                            background: avalBits.percent > 40
                                                ? 'linear-gradient(90deg, var(--lab-green), var(--lab-cyan))'
                                                : avalBits.percent > 20
                                                    ? 'linear-gradient(90deg, var(--lab-yellow), var(--lab-green))'
                                                    : 'linear-gradient(90deg, var(--lab-red), var(--lab-yellow))',
                                            transition: 'width 0.5s ease',
                                        }} />
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', minWidth: 120 }}>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--lab-heading)' }}>{avalBits.percent}%</div>
                                    <div style={{ fontSize: '0.72rem', color: 'var(--lab-text-dim)' }}>{avalBits.differentBits}/{avalBits.totalBits} bits</div>
                                </div>
                            </div>
                            <div style={{
                                padding: '0.6rem 1rem', borderRadius: 6, fontSize: '0.82rem',
                                background: avalBits.percent > 40 ? 'var(--lab-green-dim)' : 'var(--lab-yellow-dim)',
                                color: avalBits.percent > 40 ? 'var(--lab-green)' : 'var(--lab-yellow)',
                                border: `1px solid ${avalBits.percent > 40 ? 'rgba(63,185,80,0.2)' : 'rgba(210,153,34,0.2)'}`,
                            }}>
                                {avalBits.percent > 40
                                    ? (lang === 'vi'
                                        ? `✅ Đạt chuẩn Avalanche! Thay đổi nhỏ → ${avalBits.percent}% hash khác biệt (lý tưởng: ~50%)`
                                        : `✅ Avalanche criteria met! Small change → ${avalBits.percent}% hash differs (ideal: ~50%)`)
                                    : (lang === 'vi'
                                        ? `⚠️ Chưa đạt chuẩn Avalanche — chỉ ${avalBits.percent}% thay đổi. Thử nhập 2 text khác nhau hơn.`
                                        : `⚠️ Below avalanche threshold — only ${avalBits.percent}% changed. Try more different inputs.`)
                                }
                            </div>
                        </div>
                    )}

                    {/* Side-by-side hash comparison */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            🔍 {lang === 'vi' ? 'So sánh Hash (ký tự khác nhau được tô đỏ)' : 'Hash Comparison (different chars highlighted in red)'}
                        </h3>
                        {['md5', 'sha1', 'sha256', 'sha512'].map(algo => {
                            const colors = { md5: 'var(--lab-red)', sha1: 'var(--lab-yellow)', sha256: 'var(--lab-green)', sha512: 'var(--lab-purple)' }
                            const bits = { md5: 128, sha1: 160, sha256: 256, sha512: 512 }
                            return (
                                <div key={algo} style={{ marginBottom: '1rem' }}>
                                    <div style={{ fontWeight: 700, color: colors[algo], fontSize: '0.78rem', marginBottom: '0.3rem', textTransform: 'uppercase' }}>
                                        {algo.toUpperCase()} ({bits[algo]}-bit)
                                    </div>
                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                        <div>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--lab-text-dim)', marginBottom: '0.2rem' }}>Input A</div>
                                            <HashDisplay label="" hash={avalHashes1[algo]} compareWith={avalHashes2[algo]} color={colors[algo]} bits={bits[algo]} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--lab-text-dim)', marginBottom: '0.2rem' }}>Input B</div>
                                            <HashDisplay label="" hash={avalHashes2[algo]} compareWith={avalHashes1[algo]} color={colors[algo]} bits={bits[algo]} />
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* ═══════ SECTION 3: Collision Test ═══════ */}
            {activeSection === 'collision' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            💥 {lang === 'vi' ? 'Thử tìm Collision' : 'Collision Test'}
                        </h3>
                        <p style={{ color: 'var(--lab-text-dim)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                            {lang === 'vi'
                                ? 'Collision xảy ra khi 2 input khác nhau tạo ra cùng 1 hash. Thử tìm xem! (Gợi ý: gần như bất khả thi với SHA-256)'
                                : 'A collision occurs when 2 different inputs produce the same hash. Try finding one! (Hint: nearly impossible with SHA-256)'}
                        </p>

                        {/* Algorithm selector */}
                        <div className="lab-input-group">
                            <label className="lab-input-label">
                                {lang === 'vi' ? 'Chọn thuật toán' : 'Select Algorithm'}
                            </label>
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                                {['md5', 'sha1', 'sha256'].map(a => (
                                    <button key={a} className={`lab-btn ${collAlgo === a ? 'lab-btn-primary' : 'lab-btn-secondary'}`}
                                        style={{ fontSize: '0.8rem' }}
                                        onClick={() => setCollAlgo(a)}>
                                        {a.toUpperCase()}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
                            <div className="lab-input-group">
                                <label className="lab-input-label">Input A</label>
                                <AIInput className="lab-input" value={collInput1} onChange={e => setCollInput1(e.target.value)}
                                    labType="hashing" placeholder={lang === 'vi' ? 'Nhập text A...' : 'Enter text A...'} />
                            </div>
                            <div className="lab-input-group">
                                <label className="lab-input-label">Input B</label>
                                <AIInput className="lab-input" value={collInput2} onChange={e => setCollInput2(e.target.value)}
                                    labType="hashing" placeholder={lang === 'vi' ? 'Nhập text B khác...' : 'Enter different text B...'} />
                            </div>
                        </div>

                        {/* Hash outputs */}
                        {(collHash1 || collHash2) && (
                            <div style={{ marginTop: '1rem' }}>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                    <div className="lab-output" style={{ fontSize: '0.75rem' }}>
                                        {collHash1 || '—'}
                                    </div>
                                    <div className="lab-output" style={{ fontSize: '0.75rem' }}>
                                        {collHash2 || '—'}
                                    </div>
                                </div>

                                {/* Match result */}
                                <div style={{
                                    marginTop: '0.75rem', padding: '0.6rem 1rem', borderRadius: 6,
                                    background: collisionMatch ? 'var(--lab-red-dim)' : collHash1 && collHash2 ? 'rgba(0,0,0,0.2)' : 'transparent',
                                    border: collisionMatch ? '1px solid rgba(248,81,73,0.3)' : '1px solid var(--lab-border)',
                                    display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.5rem',
                                    fontSize: '0.88rem', fontWeight: 700,
                                    color: collisionMatch ? 'var(--lab-red)' : 'var(--lab-text-dim)',
                                }}>
                                    {collisionMatch
                                        ? `🚨 COLLISION FOUND!`
                                        : collHash1 && collHash2
                                            ? `❌ ${lang === 'vi' ? 'Không trùng — tiếp tục thử!' : 'No match — keep trying!'}`
                                            : `${lang === 'vi' ? 'Nhập cả 2 input để kiểm tra' : 'Enter both inputs to check'}`
                                    }
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Collision probability info */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            📐 {lang === 'vi' ? 'Xác suất Collision (Birthday Paradox)' : 'Collision Probability (Birthday Paradox)'}
                        </h3>
                        <div style={{ display: 'grid', gap: '0.75rem' }}>
                            {[
                                {
                                    algo: 'MD5',
                                    bits: 128,
                                    prob: '2⁶⁴ hashes (~18 tỷ tỷ)',
                                    time: lang === 'vi' ? 'Vài giây (đã bị phá 2004)' : 'Seconds (broken since 2004)',
                                    color: 'var(--lab-red)',
                                    bg: 'var(--lab-red-dim)',
                                },
                                {
                                    algo: 'SHA-1',
                                    bits: 160,
                                    prob: '2⁸⁰ hashes',
                                    time: lang === 'vi' ? '~6500 GPU-năm (Google 2017)' : '~6500 GPU-years (Google 2017)',
                                    color: 'var(--lab-yellow)',
                                    bg: 'var(--lab-yellow-dim)',
                                },
                                {
                                    algo: 'SHA-256',
                                    bits: 256,
                                    prob: '2¹²⁸ hashes',
                                    time: lang === 'vi' ? 'Hàng tỷ năm (an toàn)' : 'Billions of years (safe)',
                                    color: 'var(--lab-green)',
                                    bg: 'var(--lab-green-dim)',
                                },
                            ].map((item, i) => (
                                <div key={i} style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '0.75rem 1rem', background: item.bg,
                                    borderRadius: 8, borderLeft: `3px solid ${item.color}`,
                                }}>
                                    <div style={{ fontWeight: 700, color: item.color, minWidth: 70 }}>{item.algo}</div>
                                    <div style={{ flex: 1 }}>
                                        <div style={{ fontSize: '0.82rem', color: 'var(--lab-heading)' }}>
                                            {lang === 'vi' ? 'Cần tìm' : 'Need'}: <strong>{item.prob}</strong>
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--lab-text-dim)' }}>
                                            ⏱️ {item.time}
                                        </div>
                                    </div>
                                    <span style={{
                                        padding: '0.15rem 0.5rem', borderRadius: 100,
                                        fontSize: '0.7rem', fontWeight: 700,
                                        background: 'rgba(0,0,0,0.2)', color: item.color,
                                    }}>
                                        {item.bits}-bit
                                    </span>
                                </div>
                            ))}
                        </div>

                        <div className="lab-theory-note" style={{ marginTop: '1rem' }}>
                            💡 {lang === 'vi'
                                ? 'Birthday Paradox: Trong phòng 23 người, xác suất 2 người trùng sinh nhật là > 50%. Tương tự, collision xảy ra sớm hơn bạn nghĩ — khoảng 2^(n/2) thử cho hash n-bit.'
                                : 'Birthday Paradox: In a room of 23 people, the probability of 2 sharing a birthday is > 50%. Similarly, collisions happen sooner than you think — about 2^(n/2) tries for an n-bit hash.'
                            }
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
