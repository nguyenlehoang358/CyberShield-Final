import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useOutletContext } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import AIInput from '../../components/common/AIInput'
/* ──────────────────────────────────────
   FIREWALL RULES ENGINE
   ────────────────────────────────────── */
const PROTOCOLS = ['TCP', 'UDP', 'ICMP', 'HTTP', 'HTTPS', 'DNS', 'SSH', 'FTP']

const DEFAULT_RULES = [
    { id: 1, action: 'ALLOW', protocol: 'TCP', srcIp: '*', dstIp: '*', dstPort: '80', description: 'Allow HTTP' },
    { id: 2, action: 'ALLOW', protocol: 'TCP', srcIp: '*', dstIp: '*', dstPort: '443', description: 'Allow HTTPS' },
    { id: 3, action: 'ALLOW', protocol: 'UDP', srcIp: '*', dstIp: '*', dstPort: '53', description: 'Allow DNS' },
    { id: 4, action: 'BLOCK', protocol: 'TCP', srcIp: '*', dstIp: '*', dstPort: '23', description: 'Block Telnet' },
    { id: 5, action: 'BLOCK', protocol: 'TCP', srcIp: '*', dstIp: '*', dstPort: '21', description: 'Block FTP' },
    { id: 6, action: 'BLOCK', protocol: 'ICMP', srcIp: '10.0.0.*', dstIp: '*', dstPort: '*', description: 'Block ping from internal' },
]

const PRESET_RULESETS = {
    minimal: {
        label: { vi: 'Tối thiểu (chỉ web)', en: 'Minimal (web only)' },
        rules: [
            { id: 1, action: 'ALLOW', protocol: 'TCP', srcIp: '*', dstIp: '*', dstPort: '80', description: 'Allow HTTP' },
            { id: 2, action: 'ALLOW', protocol: 'TCP', srcIp: '*', dstIp: '*', dstPort: '443', description: 'Allow HTTPS' },
            { id: 3, action: 'ALLOW', protocol: 'UDP', srcIp: '*', dstIp: '*', dstPort: '53', description: 'Allow DNS' },
        ]
    },
    strict: {
        label: { vi: 'Nghiêm ngặt (corporate)', en: 'Strict (corporate)' },
        rules: [
            { id: 1, action: 'ALLOW', protocol: 'TCP', srcIp: '192.168.1.*', dstIp: '*', dstPort: '443', description: 'HTTPS only from LAN' },
            { id: 2, action: 'ALLOW', protocol: 'UDP', srcIp: '192.168.1.*', dstIp: '8.8.8.8', dstPort: '53', description: 'DNS to Google only' },
            { id: 3, action: 'ALLOW', protocol: 'TCP', srcIp: '192.168.1.100', dstIp: '*', dstPort: '22', description: 'SSH from admin only' },
            { id: 4, action: 'BLOCK', protocol: 'TCP', srcIp: '*', dstIp: '*', dstPort: '23', description: 'Block Telnet' },
            { id: 5, action: 'BLOCK', protocol: 'TCP', srcIp: '*', dstIp: '*', dstPort: '21', description: 'Block FTP' },
            { id: 6, action: 'BLOCK', protocol: 'ICMP', srcIp: '*', dstIp: '*', dstPort: '*', description: 'Block all ICMP' },
            { id: 7, action: 'BLOCK', protocol: 'TCP', srcIp: '*', dstIp: '*', dstPort: '3389', description: 'Block RDP' },
        ]
    },
    open: {
        label: { vi: 'Mở hoàn toàn', en: 'Wide open' },
        rules: [
            { id: 1, action: 'ALLOW', protocol: '*', srcIp: '*', dstIp: '*', dstPort: '*', description: 'Allow everything' },
        ]
    },
}

/* Generate random packets */
const RANDOM_IPS = ['192.168.1.10', '192.168.1.25', '10.0.0.5', '10.0.0.100', '172.16.0.50', '8.8.8.8', '1.1.1.1', '203.0.113.42', '198.51.100.7']
const RANDOM_DSTS = ['93.184.216.34', '142.250.80.46', '151.101.1.140', '104.16.132.229', '8.8.8.8', '1.1.1.1', '192.168.1.1']
const PACKET_TYPES = [
    { protocol: 'TCP', dstPort: 80, label: 'HTTP Request' },
    { protocol: 'TCP', dstPort: 443, label: 'HTTPS Request' },
    { protocol: 'UDP', dstPort: 53, label: 'DNS Query' },
    { protocol: 'TCP', dstPort: 22, label: 'SSH Connection' },
    { protocol: 'TCP', dstPort: 21, label: 'FTP Transfer' },
    { protocol: 'TCP', dstPort: 23, label: 'Telnet Session' },
    { protocol: 'ICMP', dstPort: 0, label: 'Ping (ICMP)' },
    { protocol: 'TCP', dstPort: 3389, label: 'RDP Connection' },
    { protocol: 'TCP', dstPort: 25, label: 'SMTP Email' },
    { protocol: 'TCP', dstPort: 3306, label: 'MySQL Query' },
    { protocol: 'TCP', dstPort: 8080, label: 'Proxy Request' },
    { protocol: 'UDP', dstPort: 123, label: 'NTP Sync' },
]

function generatePacket(id) {
    const type = PACKET_TYPES[Math.floor(Math.random() * PACKET_TYPES.length)]
    return {
        id,
        srcIp: RANDOM_IPS[Math.floor(Math.random() * RANDOM_IPS.length)],
        dstIp: RANDOM_DSTS[Math.floor(Math.random() * RANDOM_DSTS.length)],
        srcPort: 1024 + Math.floor(Math.random() * 64000),
        dstPort: type.dstPort,
        protocol: type.protocol,
        label: type.label,
        size: 40 + Math.floor(Math.random() * 1400),
        timestamp: new Date(),
    }
}

function matchRule(packet, rule) {
    // Protocol check
    if (rule.protocol !== '*' && rule.protocol !== packet.protocol) return false
    // Source IP check
    if (rule.srcIp !== '*') {
        if (rule.srcIp.endsWith('.*')) {
            const prefix = rule.srcIp.slice(0, -1)
            if (!packet.srcIp.startsWith(prefix)) return false
        } else if (rule.srcIp !== packet.srcIp) return false
    }
    // Dest IP check
    if (rule.dstIp !== '*') {
        if (rule.dstIp.endsWith('.*')) {
            const prefix = rule.dstIp.slice(0, -1)
            if (!packet.dstIp.startsWith(prefix)) return false
        } else if (rule.dstIp !== packet.dstIp) return false
    }
    // Port check
    if (rule.dstPort !== '*' && parseInt(rule.dstPort) !== packet.dstPort) return false
    return true
}

function evaluatePacket(packet, rules, defaultAction = 'BLOCK') {
    for (const rule of rules) {
        if (matchRule(packet, rule)) {
            return { action: rule.action, matchedRule: rule }
        }
    }
    return { action: defaultAction, matchedRule: null }
}

/* ──────────────────────────────────────
   THEORY SIDEBAR
   ────────────────────────────────────── */
function FirewallTheory({ lang }) {
    if (lang === 'vi') {
        return (
            <>
                <h3>Firewall là gì?</h3>
                <p>Firewall là hệ thống bảo mật mạng giám sát và kiểm soát lưu lượng mạng dựa trên các quy tắc bảo mật đã định nghĩa.</p>

                <h3>Các loại Firewall</h3>
                <ul>
                    <li><strong>Packet Filtering</strong> — Lọc theo header gói tin (IP, port, protocol). Nhanh nhưng đơn giản.</li>
                    <li><strong>Stateful Inspection</strong> — Theo dõi trạng thái kết nối. Hiểu ngữ cảnh phiên.</li>
                    <li><strong>Application Layer</strong> — Kiểm tra nội dung gói tin (Layer 7). Phát hiện tấn công ứng dụng.</li>
                    <li><strong>Next-Gen (NGFW)</strong> — Kết hợp tất cả + IPS, deep packet inspection, threat intelligence.</li>
                </ul>

                <h3>Cách Firewall hoạt động</h3>
                <ul>
                    <li>📥 Gói tin đến → kiểm tra từng rule theo thứ tự</li>
                    <li>✅ Rule đầu tiên match → ALLOW hoặc BLOCK</li>
                    <li>🚫 Không match rule nào → Default action (thường là BLOCK)</li>
                </ul>

                <h3>Quy tắc phổ biến</h3>
                <ul>
                    <li>Port 80 (HTTP) — Web không mã hóa</li>
                    <li>Port 443 (HTTPS) — Web mã hóa</li>
                    <li>Port 22 (SSH) — Remote shell an toàn</li>
                    <li>Port 53 (DNS) — Phân giải tên miền</li>
                    <li>Port 21 (FTP) — Truyền file (không an toàn)</li>
                    <li>Port 23 (Telnet) — Shell (không mã hóa!)</li>
                </ul>

                <div className="lab-theory-note">
                    💡 Firewall không thể ngăn 100% tấn công. Cần kết hợp với IDS/IPS, VPN, và security policies.
                </div>
            </>
        )
    }

    return (
        <>
            <h3>What is a Firewall?</h3>
            <p>A firewall is a network security system that monitors and controls network traffic based on predefined security rules.</p>

            <h3>Firewall Types</h3>
            <ul>
                <li><strong>Packet Filtering</strong> — Filters by packet headers (IP, port, protocol). Fast but simple.</li>
                <li><strong>Stateful Inspection</strong> — Tracks connection states. Understands session context.</li>
                <li><strong>Application Layer</strong> — Inspects packet content (Layer 7). Detects application attacks.</li>
                <li><strong>Next-Gen (NGFW)</strong> — Combines all + IPS, deep packet inspection, threat intelligence.</li>
            </ul>

            <h3>How Firewalls Work</h3>
            <ul>
                <li>📥 Packet arrives → check rules in order</li>
                <li>✅ First matching rule → ALLOW or BLOCK</li>
                <li>🚫 No match → Default action (usually BLOCK)</li>
            </ul>

            <h3>Common Ports</h3>
            <ul>
                <li>Port 80 (HTTP) — Unencrypted web</li>
                <li>Port 443 (HTTPS) — Encrypted web</li>
                <li>Port 22 (SSH) — Secure remote shell</li>
                <li>Port 53 (DNS) — Domain name resolution</li>
                <li>Port 21 (FTP) — File transfer (insecure)</li>
                <li>Port 23 (Telnet) — Shell (unencrypted!)</li>
            </ul>

            <div className="lab-theory-note">
                💡 Firewalls can't prevent 100% of attacks. Must combine with IDS/IPS, VPN, and security policies.
            </div>
        </>
    )
}

/* ──────────────────────────────────────
   MAIN COMPONENT
   ────────────────────────────────────── */
export default function FirewallLab() {
    const { t, lang } = useLanguage()
    const { setTheory } = useOutletContext()

    const [activeTab, setActiveTab] = useState('simulator')
    const [rules, setRules] = useState(DEFAULT_RULES)
    const [defaultAction, setDefaultAction] = useState('BLOCK')
    const [packets, setPackets] = useState([])
    const [simRunning, setSimRunning] = useState(false)
    const [stats, setStats] = useState({ total: 0, allowed: 0, blocked: 0 })
    const intervalRef = useRef(null)
    const packetIdRef = useRef(0)

    // New rule form
    const [newRule, setNewRule] = useState({
        action: 'ALLOW', protocol: 'TCP', srcIp: '*', dstIp: '*', dstPort: '80', description: ''
    })

    // Manual packet form
    const [manualPacket, setManualPacket] = useState({
        srcIp: '192.168.1.10', dstIp: '93.184.216.34', protocol: 'TCP', dstPort: '80'
    })

    // Theory
    useEffect(() => { setTheory(<FirewallTheory lang={lang} />) }, [setTheory, lang])

    // Start/stop simulation
    const startSimulation = useCallback(() => {
        setSimRunning(true)
        intervalRef.current = setInterval(() => {
            const pkt = generatePacket(++packetIdRef.current)
            const result = evaluatePacket(pkt, rules, defaultAction)
            pkt.action = result.action
            pkt.matchedRule = result.matchedRule
            setPackets(prev => [pkt, ...prev].slice(0, 50))
            setStats(prev => ({
                total: prev.total + 1,
                allowed: prev.allowed + (result.action === 'ALLOW' ? 1 : 0),
                blocked: prev.blocked + (result.action === 'BLOCK' ? 1 : 0),
            }))
        }, 800)
    }, [rules, defaultAction])

    const stopSimulation = useCallback(() => {
        setSimRunning(false)
        if (intervalRef.current) clearInterval(intervalRef.current)
    }, [])

    useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current) }, [])

    // Restart sim when rules change
    useEffect(() => {
        if (simRunning) {
            stopSimulation()
            startSimulation()
        }
    }, [rules, defaultAction])

    // Add rule
    const addRule = useCallback(() => {
        if (!newRule.dstPort && newRule.protocol !== 'ICMP') return
        const id = Math.max(0, ...rules.map(r => r.id)) + 1
        setRules(prev => [...prev, { ...newRule, id }])
        setNewRule({ action: 'ALLOW', protocol: 'TCP', srcIp: '*', dstIp: '*', dstPort: '', description: '' })
    }, [newRule, rules])

    // Delete rule
    const deleteRule = useCallback((id) => setRules(prev => prev.filter(r => r.id !== id)), [])

    // Move rule up/down
    const moveRule = useCallback((id, dir) => {
        setRules(prev => {
            const idx = prev.findIndex(r => r.id === id)
            if (idx < 0) return prev
            const newIdx = idx + dir
            if (newIdx < 0 || newIdx >= prev.length) return prev
            const arr = [...prev];
            [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
            return arr
        })
    }, [])

    // Load preset
    const loadPreset = useCallback((key) => {
        setRules(PRESET_RULESETS[key].rules)
        setPackets([])
        setStats({ total: 0, allowed: 0, blocked: 0 })
    }, [])

    // Test manual packet
    const testManualPacket = useCallback(() => {
        const pkt = {
            id: ++packetIdRef.current,
            srcIp: manualPacket.srcIp,
            dstIp: manualPacket.dstIp,
            srcPort: 1024 + Math.floor(Math.random() * 64000),
            dstPort: parseInt(manualPacket.dstPort) || 0,
            protocol: manualPacket.protocol,
            label: 'Manual Test',
            size: 64,
            timestamp: new Date(),
        }
        const result = evaluatePacket(pkt, rules, defaultAction)
        pkt.action = result.action
        pkt.matchedRule = result.matchedRule
        setPackets(prev => [pkt, ...prev].slice(0, 50))
        setStats(prev => ({
            total: prev.total + 1,
            allowed: prev.allowed + (result.action === 'ALLOW' ? 1 : 0),
            blocked: prev.blocked + (result.action === 'BLOCK' ? 1 : 0),
        }))
    }, [manualPacket, rules, defaultAction])

    const clearLog = useCallback(() => {
        setPackets([])
        setStats({ total: 0, allowed: 0, blocked: 0 })
    }, [])

    return (
        <div className="lab-animate-in">
            {/* Title */}
            <div className="lab-section">
                <h2 className="lab-section-title" style={{ fontSize: '1.3rem' }}>
                    🛡️ {t('lab_firewall_title')}
                </h2>
                <p style={{ color: 'var(--lab-text-dim)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                    {t('lab_firewall_desc')}
                </p>
            </div>

            {/* Tabs */}
            <div className="lab-tabs">
                {[
                    { id: 'simulator', label: lang === 'vi' ? '🔥 Mô phỏng' : '🔥 Simulator' },
                    { id: 'rules', label: lang === 'vi' ? '📋 Quy tắc' : '📋 Rules' },
                    { id: 'learn', label: lang === 'vi' ? '📖 Kiến thức' : '📖 Learn' },
                ].map(tab => (
                    <button key={tab.id} className={`lab-tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => { setActiveTab(tab.id); window.scrollTo({ top: 0, behavior: 'instant' }); }}>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ═══════ TAB 1: Live Simulator ═══════ */}
            {activeTab === 'simulator' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {/* Controls */}
                    <div className="lab-visual-panel">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                            {!simRunning ? (
                                <button className="lab-btn lab-btn-primary" onClick={startSimulation}>
                                    ▶️ {lang === 'vi' ? 'Bắt đầu mô phỏng' : 'Start Simulation'}
                                </button>
                            ) : (
                                <button className="lab-btn lab-btn-danger" onClick={stopSimulation}>
                                    ⏹ {lang === 'vi' ? 'Dừng' : 'Stop'}
                                </button>
                            )}
                            <button className="lab-btn lab-btn-secondary" onClick={clearLog}>
                                🗑️ Clear
                            </button>

                            <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                <span style={{ fontSize: '0.78rem', color: 'var(--lab-text-dim)' }}>
                                    Default:
                                </span>
                                <button className={`lab-btn ${defaultAction === 'BLOCK' ? 'lab-btn-danger' : 'lab-btn-secondary'}`}
                                    onClick={() => setDefaultAction(defaultAction === 'BLOCK' ? 'ALLOW' : 'BLOCK')}
                                    style={{ fontSize: '0.75rem', padding: '0.3rem 0.7rem' }}>
                                    {defaultAction === 'BLOCK' ? '🚫 BLOCK' : '✅ ALLOW'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Stats bar */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                        {[
                            { label: lang === 'vi' ? 'Tổng gói tin' : 'Total Packets', value: stats.total, color: 'var(--lab-blue)', icon: '📦' },
                            { label: lang === 'vi' ? 'Cho phép' : 'Allowed', value: stats.allowed, color: 'var(--lab-green)', icon: '✅' },
                            { label: lang === 'vi' ? 'Chặn' : 'Blocked', value: stats.blocked, color: 'var(--lab-red)', icon: '🚫' },
                        ].map((s, i) => (
                            <div key={i} style={{
                                padding: '1rem', background: 'rgba(0,0,0,0.2)',
                                borderRadius: 10, textAlign: 'center',
                                borderTop: `3px solid ${s.color}`,
                            }}>
                                <div style={{ fontSize: '1.4rem' }}>{s.icon}</div>
                                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                                <div style={{ fontSize: '0.72rem', color: 'var(--lab-text-dim)' }}>{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Ratio bar */}
                    {stats.total > 0 && (
                        <div style={{ display: 'flex', height: 20, borderRadius: 10, overflow: 'hidden', border: '1px solid var(--lab-border)' }}>
                            <div style={{
                                width: `${(stats.allowed / stats.total) * 100}%`,
                                background: 'linear-gradient(90deg, #2ea043, #3fb950)',
                                transition: 'width 0.3s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.68rem', fontWeight: 700, color: '#fff',
                            }}>{stats.allowed > 0 ? `${Math.round(stats.allowed / stats.total * 100)}%` : ''}</div>
                            <div style={{
                                width: `${(stats.blocked / stats.total) * 100}%`,
                                background: 'linear-gradient(90deg, #da3633, #f85149)',
                                transition: 'width 0.3s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: '0.68rem', fontWeight: 700, color: '#fff',
                            }}>{stats.blocked > 0 ? `${Math.round(stats.blocked / stats.total * 100)}%` : ''}</div>
                        </div>
                    )}

                    {/* Manual packet test */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            🧪 {lang === 'vi' ? 'Gửi gói tin thủ công' : 'Send Manual Packet'}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '0.6rem' }}>
                            <div className="lab-input-group" style={{ margin: 0 }}>
                                <label className="lab-input-label">Source IP</label>
                                <AIInput className="lab-input" value={manualPacket.srcIp}
                                    onChange={e => setManualPacket(p => ({ ...p, srcIp: e.target.value }))}
                                    labType="firewall"
                                    style={{ fontSize: '0.82rem' }} />
                            </div>
                            <div className="lab-input-group" style={{ margin: 0 }}>
                                <label className="lab-input-label">Dest IP</label>
                                <AIInput className="lab-input" value={manualPacket.dstIp}
                                    onChange={e => setManualPacket(p => ({ ...p, dstIp: e.target.value }))}
                                    labType="firewall"
                                    style={{ fontSize: '0.82rem' }} />
                            </div>
                            <div className="lab-input-group" style={{ margin: 0 }}>
                                <label className="lab-input-label">Protocol</label>
                                <select className="lab-input" value={manualPacket.protocol}
                                    onChange={e => setManualPacket(p => ({ ...p, protocol: e.target.value }))}
                                    style={{ fontSize: '0.82rem' }}>
                                    {PROTOCOLS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div className="lab-input-group" style={{ margin: 0 }}>
                                <label className="lab-input-label">Dest Port</label>
                                <AIInput className="lab-input" value={manualPacket.dstPort}
                                    onChange={e => setManualPacket(p => ({ ...p, dstPort: e.target.value }))}
                                    labType="firewall"
                                    style={{ fontSize: '0.82rem' }} />
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem', flexWrap: 'wrap' }}>
                            <button className="lab-btn lab-btn-primary" onClick={testManualPacket}>
                                📤 {lang === 'vi' ? 'Gửi' : 'Send'}
                            </button>
                            {/* Quick presets */}
                            {[
                                { label: 'HTTP :80', p: 'TCP', port: '80' },
                                { label: 'HTTPS :443', p: 'TCP', port: '443' },
                                { label: 'SSH :22', p: 'TCP', port: '22' },
                                { label: 'FTP :21', p: 'TCP', port: '21' },
                                { label: 'Telnet :23', p: 'TCP', port: '23' },
                                { label: 'Ping', p: 'ICMP', port: '0' },
                                { label: 'DNS :53', p: 'UDP', port: '53' },
                                { label: 'MySQL :3306', p: 'TCP', port: '3306' },
                            ].map((q, i) => (
                                <button key={i} className="lab-btn lab-btn-secondary"
                                    onClick={() => setManualPacket(p => ({ ...p, protocol: q.p, dstPort: q.port }))}
                                    style={{ fontSize: '0.72rem', padding: '0.25rem 0.5rem' }}>
                                    {q.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Packet log */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            📜 {lang === 'vi' ? 'Log gói tin' : 'Packet Log'} ({packets.length})
                        </h3>
                        <div style={{
                            maxHeight: 400, overflowY: 'auto', overflowX: 'auto',
                            background: '#0b0f19', borderRadius: 6, padding: '0.5rem',
                            fontFamily: "'JetBrains Mono', monospace", fontSize: '0.75rem',
                        }}>
                            {packets.length === 0 ? (
                                <div style={{ color: 'var(--lab-text-dim)', textAlign: 'center', padding: '2rem' }}>
                                    {lang === 'vi' ? 'Chưa có gói tin. Nhấn "Bắt đầu mô phỏng" hoặc gửi gói tin thủ công.' : 'No packets yet. Click "Start Simulation" or send a manual packet.'}
                                </div>
                            ) : (
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '1px solid var(--lab-border)' }}>
                                            {['#', lang === 'vi' ? 'Kết quả' : 'Result', 'Protocol', 'Source', 'Destination', 'Port', lang === 'vi' ? 'Rule match' : 'Matched Rule'].map(h => (
                                                <th key={h} style={{ padding: '0.3rem 0.5rem', textAlign: 'left', color: 'var(--lab-text-dim)', fontSize: '0.68rem', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{h}</th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {packets.map(pkt => (
                                            <tr key={pkt.id} style={{
                                                borderBottom: '1px solid rgba(255,255,255,0.03)',
                                                background: pkt.action === 'ALLOW' ? 'rgba(63,185,80,0.04)' : 'rgba(248,81,73,0.04)',
                                                animation: 'labFadeIn 0.3s ease-out',
                                            }}>
                                                <td style={{ padding: '0.3rem 0.5rem', color: 'var(--lab-text-dim)' }}>{pkt.id}</td>
                                                <td style={{ padding: '0.3rem 0.5rem' }}>
                                                    <span style={{
                                                        padding: '0.1rem 0.4rem', borderRadius: 3, fontSize: '0.68rem', fontWeight: 700,
                                                        background: pkt.action === 'ALLOW' ? 'var(--lab-green-dim)' : 'var(--lab-red-dim)',
                                                        color: pkt.action === 'ALLOW' ? 'var(--lab-green)' : 'var(--lab-red)',
                                                    }}>
                                                        {pkt.action === 'ALLOW' ? '✅' : '🚫'} {pkt.action}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '0.3rem 0.5rem', color: 'var(--lab-purple)' }}>{pkt.protocol}</td>
                                                <td style={{ padding: '0.3rem 0.5rem', color: 'var(--lab-cyan)' }}>{pkt.srcIp}</td>
                                                <td style={{ padding: '0.3rem 0.5rem', color: 'var(--lab-blue)' }}>{pkt.dstIp}</td>
                                                <td style={{ padding: '0.3rem 0.5rem', color: 'var(--lab-yellow)', fontWeight: 600 }}>{pkt.dstPort || '—'}</td>
                                                <td style={{ padding: '0.3rem 0.5rem', color: 'var(--lab-text-dim)', fontSize: '0.7rem' }}>
                                                    {pkt.matchedRule ? `#${pkt.matchedRule.id}: ${pkt.matchedRule.description}` : (lang === 'vi' ? 'Default' : 'Default policy')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════ TAB 2: Rules Editor ═══════ */}
            {activeTab === 'rules' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {/* Presets */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">📦 {lang === 'vi' ? 'Bộ quy tắc mẫu' : 'Preset Rulesets'}</h3>
                        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            {Object.entries(PRESET_RULESETS).map(([key, preset]) => (
                                <button key={key} className="lab-btn lab-btn-secondary"
                                    onClick={() => loadPreset(key)}>
                                    {key === 'minimal' ? '🟢' : key === 'strict' ? '🔴' : '⚪'}
                                    {' '}{preset.label[lang]}
                                </button>
                            ))}
                            <button className="lab-btn lab-btn-secondary" onClick={() => setRules(DEFAULT_RULES)}>
                                🔄 {lang === 'vi' ? 'Mặc định' : 'Default'}
                            </button>
                        </div>
                    </div>

                    {/* Current rules */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">
                            📋 {lang === 'vi' ? 'Quy tắc hiện tại' : 'Current Rules'} ({rules.length})
                        </h3>
                        <div style={{ fontSize: '0.72rem', color: 'var(--lab-text-dim)', marginBottom: '0.75rem' }}>
                            ℹ️ {lang === 'vi' ? 'Rules được kiểm tra từ trên xuống. Rule đầu tiên match sẽ quyết định.' : 'Rules are checked top-down. First matching rule wins.'}
                        </div>
                        <div style={{ display: 'grid', gap: '0.4rem' }}>
                            {rules.map((rule, idx) => (
                                <div key={rule.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                                    padding: '0.5rem 0.8rem', borderRadius: 6,
                                    background: rule.action === 'ALLOW' ? 'rgba(63,185,80,0.06)' : 'rgba(248,81,73,0.06)',
                                    borderLeft: `3px solid ${rule.action === 'ALLOW' ? 'var(--lab-green)' : 'var(--lab-red)'}`,
                                    fontSize: '0.82rem',
                                }}>
                                    <span style={{
                                        fontWeight: 700, fontSize: '0.72rem', color: 'var(--lab-text-dim)',
                                        minWidth: 20, textAlign: 'center',
                                    }}>#{idx + 1}</span>
                                    <span style={{
                                        padding: '0.1rem 0.4rem', borderRadius: 3, fontSize: '0.7rem', fontWeight: 700,
                                        background: rule.action === 'ALLOW' ? 'var(--lab-green-dim)' : 'var(--lab-red-dim)',
                                        color: rule.action === 'ALLOW' ? 'var(--lab-green)' : 'var(--lab-red)',
                                        minWidth: 55, textAlign: 'center',
                                    }}>{rule.action}</span>
                                    <span style={{ color: 'var(--lab-purple)', fontWeight: 600, minWidth: 35 }}>{rule.protocol}</span>
                                    <span style={{ color: 'var(--lab-text-dim)', fontSize: '0.78rem', flex: 1, fontFamily: 'monospace' }}>
                                        {rule.srcIp} → {rule.dstIp}:{rule.dstPort}
                                    </span>
                                    <span style={{ color: 'var(--lab-text-dim)', fontSize: '0.72rem', fontStyle: 'italic' }}>
                                        {rule.description}
                                    </span>
                                    <div style={{ display: 'flex', gap: 2 }}>
                                        <button onClick={() => moveRule(rule.id, -1)} style={{ background: 'none', border: 'none', color: 'var(--lab-text-dim)', cursor: 'pointer', fontSize: '0.7rem', padding: 2 }} title="Move up">▲</button>
                                        <button onClick={() => moveRule(rule.id, 1)} style={{ background: 'none', border: 'none', color: 'var(--lab-text-dim)', cursor: 'pointer', fontSize: '0.7rem', padding: 2 }} title="Move down">▼</button>
                                        <button onClick={() => deleteRule(rule.id)} style={{ background: 'none', border: 'none', color: 'var(--lab-red)', cursor: 'pointer', fontSize: '0.8rem', padding: 2 }} title="Delete">✕</button>
                                    </div>
                                </div>
                            ))}
                            {/* Default action */}
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem',
                                padding: '0.5rem 0.8rem', borderRadius: 6,
                                background: 'rgba(255,255,255,0.02)',
                                borderLeft: `3px dashed ${defaultAction === 'BLOCK' ? 'var(--lab-red)' : 'var(--lab-green)'}`,
                                fontSize: '0.82rem',
                            }}>
                                <span style={{ fontWeight: 700, fontSize: '0.72rem', color: 'var(--lab-text-dim)' }}>★</span>
                                <span style={{
                                    padding: '0.1rem 0.4rem', borderRadius: 3, fontSize: '0.7rem', fontWeight: 700,
                                    background: defaultAction === 'BLOCK' ? 'var(--lab-red-dim)' : 'var(--lab-green-dim)',
                                    color: defaultAction === 'BLOCK' ? 'var(--lab-red)' : 'var(--lab-green)',
                                }}>{defaultAction}</span>
                                <span style={{ color: 'var(--lab-text-dim)', fontStyle: 'italic', fontSize: '0.78rem' }}>
                                    {lang === 'vi' ? 'Mặc định (nếu không match rule nào)' : 'Default policy (no rule matched)'}
                                </span>
                                <button className="lab-btn lab-btn-secondary" style={{ marginLeft: 'auto', fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
                                    onClick={() => setDefaultAction(d => d === 'BLOCK' ? 'ALLOW' : 'BLOCK')}>
                                    {lang === 'vi' ? 'Đổi' : 'Toggle'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Add new rule */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">➕ {lang === 'vi' ? 'Thêm quy tắc mới' : 'Add New Rule'}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.6rem' }}>
                            <div className="lab-input-group" style={{ margin: 0 }}>
                                <label className="lab-input-label">Action</label>
                                <select className="lab-input" value={newRule.action}
                                    onChange={e => setNewRule(r => ({ ...r, action: e.target.value }))}
                                    style={{ fontSize: '0.82rem' }}>
                                    <option value="ALLOW">✅ ALLOW</option>
                                    <option value="BLOCK">🚫 BLOCK</option>
                                </select>
                            </div>
                            <div className="lab-input-group" style={{ margin: 0 }}>
                                <label className="lab-input-label">Protocol</label>
                                <select className="lab-input" value={newRule.protocol}
                                    onChange={e => setNewRule(r => ({ ...r, protocol: e.target.value }))}
                                    style={{ fontSize: '0.82rem' }}>
                                    <option value="*">* (All)</option>
                                    {PROTOCOLS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                            <div className="lab-input-group" style={{ margin: 0 }}>
                                <label className="lab-input-label">Src IP</label>
                                <AIInput className="lab-input" value={newRule.srcIp}
                                    onChange={e => setNewRule(r => ({ ...r, srcIp: e.target.value }))}
                                    labType="firewall"
                                    placeholder="* or 192.168.1.*" style={{ fontSize: '0.82rem' }} />
                            </div>
                            <div className="lab-input-group" style={{ margin: 0 }}>
                                <label className="lab-input-label">Dst IP</label>
                                <AIInput className="lab-input" value={newRule.dstIp}
                                    onChange={e => setNewRule(r => ({ ...r, dstIp: e.target.value }))}
                                    labType="firewall"
                                    placeholder="*" style={{ fontSize: '0.82rem' }} />
                            </div>
                            <div className="lab-input-group" style={{ margin: 0 }}>
                                <label className="lab-input-label">Dst Port</label>
                                <AIInput className="lab-input" value={newRule.dstPort}
                                    onChange={e => setNewRule(r => ({ ...r, dstPort: e.target.value }))}
                                    labType="firewall"
                                    placeholder="80, 443, *" style={{ fontSize: '0.82rem' }} />
                            </div>
                            <div className="lab-input-group" style={{ margin: 0 }}>
                                <label className="lab-input-label">{lang === 'vi' ? 'Mô tả' : 'Description'}</label>
                                <input className="lab-input" value={newRule.description}
                                    onChange={e => setNewRule(r => ({ ...r, description: e.target.value }))}
                                    placeholder="Allow HTTP" style={{ fontSize: '0.82rem' }} />
                            </div>
                        </div>
                        <button className="lab-btn lab-btn-primary" style={{ marginTop: '0.75rem' }} onClick={addRule}>
                            ➕ {lang === 'vi' ? 'Thêm rule' : 'Add Rule'}
                        </button>
                    </div>
                </div>
            )}

            {/* ═══════ TAB 3: Learn ═══════ */}
            {activeTab === 'learn' && (
                <div style={{ display: 'grid', gap: '1.5rem' }}>
                    {/* Firewall types */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">🏗️ {lang === 'vi' ? 'Các loại Firewall' : 'Firewall Types'}</h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                            {[
                                {
                                    title: 'Packet Filtering', icon: '📦', color: 'var(--lab-blue)',
                                    layer: 'Layer 3-4', speed: lang === 'vi' ? 'Rất nhanh' : 'Very fast',
                                    desc: lang === 'vi' ? 'Kiểm tra header: IP nguồn/đích, port, protocol. Không hiểu nội dung.' : 'Checks headers: source/dest IP, port, protocol. No content understanding.',
                                    pros: lang === 'vi' ? 'Nhanh, đơn giản, chi phí thấp' : 'Fast, simple, low cost',
                                    cons: lang === 'vi' ? 'Dễ bypass, không thấy payload' : 'Easily bypassed, blind to payload',
                                },
                                {
                                    title: 'Stateful Inspection', icon: '🔗', color: 'var(--lab-green)',
                                    layer: 'Layer 3-4', speed: lang === 'vi' ? 'Nhanh' : 'Fast',
                                    desc: lang === 'vi' ? 'Theo dõi trạng thái kết nối TCP. Hiểu SYN→SYN-ACK→ACK.' : 'Tracks TCP connection state. Understands SYN→SYN-ACK→ACK.',
                                    pros: lang === 'vi' ? 'Hiểu context, chặn invalid packets' : 'Context-aware, blocks invalid packets',
                                    cons: lang === 'vi' ? 'Tốn RAM cho state table' : 'RAM intensive for state table',
                                },
                                {
                                    title: 'Application Layer (WAF)', icon: '🔍', color: 'var(--lab-purple)',
                                    layer: 'Layer 7', speed: lang === 'vi' ? 'Chậm hơn' : 'Slower',
                                    desc: lang === 'vi' ? 'Đọc nội dung gói tin: HTTP headers, payload, URLs. Phát hiện SQLi, XSS.' : 'Reads packet content: HTTP headers, payload, URLs. Detects SQLi, XSS.',
                                    pros: lang === 'vi' ? 'Deep inspection, chặn tấn công L7' : 'Deep inspection, blocks L7 attacks',
                                    cons: lang === 'vi' ? 'Chậm, false positives, đắt' : 'Slow, false positives, expensive',
                                },
                                {
                                    title: 'Next-Gen (NGFW)', icon: '🚀', color: 'var(--lab-cyan)',
                                    layer: 'Layer 3-7', speed: lang === 'vi' ? 'Trung bình' : 'Medium',
                                    desc: lang === 'vi' ? 'Kết hợp tất cả: packet filter + stateful + L7 + IPS + threat intelligence + SSL inspection.' : 'Combines all: packet filter + stateful + L7 + IPS + threat intel + SSL inspection.',
                                    pros: lang === 'vi' ? 'Bảo mật toàn diện nhất' : 'Most comprehensive security',
                                    cons: lang === 'vi' ? 'Đắt, phức tạp cấu hình' : 'Expensive, complex to configure',
                                },
                            ].map((fw, i) => (
                                <div key={i} style={{
                                    padding: '1.25rem', background: 'rgba(0,0,0,0.2)',
                                    borderRadius: 10, borderTop: `3px solid ${fw.color}`,
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                                        <span style={{ fontSize: '1.3rem' }}>{fw.icon}</span>
                                        <div>
                                            <div style={{ fontWeight: 700, color: fw.color, fontSize: '0.92rem' }}>{fw.title}</div>
                                            <div style={{ fontSize: '0.68rem', color: 'var(--lab-text-dim)' }}>{fw.layer} · {fw.speed}</div>
                                        </div>
                                    </div>
                                    <p style={{ fontSize: '0.82rem', color: 'var(--lab-text)', lineHeight: 1.6, marginBottom: '0.5rem' }}>{fw.desc}</p>
                                    <div style={{ display: 'grid', gap: '0.3rem', fontSize: '0.75rem' }}>
                                        <div style={{ color: 'var(--lab-green)' }}>✅ {fw.pros}</div>
                                        <div style={{ color: 'var(--lab-red)' }}>❌ {fw.cons}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Common ports table */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">🔌 {lang === 'vi' ? 'Bảng Port phổ biến' : 'Common Ports Reference'}</h3>
                        <div style={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem' }}>
                                <thead>
                                    <tr style={{ borderBottom: '1px solid var(--lab-border)' }}>
                                        {['Port', 'Protocol', lang === 'vi' ? 'Dịch vụ' : 'Service', lang === 'vi' ? 'Bảo mật' : 'Security', lang === 'vi' ? 'Khuyến nghị' : 'Recommendation'].map(h => (
                                            <th key={h} style={{ padding: '0.5rem', textAlign: 'left', color: 'var(--lab-text-dim)', fontSize: '0.72rem', textTransform: 'uppercase' }}>{h}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {[
                                        { port: 21, proto: 'TCP', service: 'FTP', sec: '🔴', rec: lang === 'vi' ? 'Chặn — dùng SFTP thay thế' : 'Block — use SFTP instead' },
                                        { port: 22, proto: 'TCP', service: 'SSH', sec: '🟢', rec: lang === 'vi' ? 'Cho phép (giới hạn IP)' : 'Allow (restrict by IP)' },
                                        { port: 23, proto: 'TCP', service: 'Telnet', sec: '🔴', rec: lang === 'vi' ? 'Chặn — dùng SSH thay thế' : 'Block — use SSH instead' },
                                        { port: 25, proto: 'TCP', service: 'SMTP', sec: '🟡', rec: lang === 'vi' ? 'Chỉ cho mail server' : 'Mail server only' },
                                        { port: 53, proto: 'UDP/TCP', service: 'DNS', sec: '🟢', rec: lang === 'vi' ? 'Cho phép (cần thiết)' : 'Allow (required)' },
                                        { port: 80, proto: 'TCP', service: 'HTTP', sec: '🟡', rec: lang === 'vi' ? 'Redirect sang HTTPS' : 'Redirect to HTTPS' },
                                        { port: 443, proto: 'TCP', service: 'HTTPS', sec: '🟢', rec: lang === 'vi' ? 'Cho phép' : 'Allow' },
                                        { port: 3306, proto: 'TCP', service: 'MySQL', sec: '🔴', rec: lang === 'vi' ? 'Chặn từ bên ngoài' : 'Block from outside' },
                                        { port: 3389, proto: 'TCP', service: 'RDP', sec: '🔴', rec: lang === 'vi' ? 'Chặn — dùng VPN' : 'Block — use VPN' },
                                        { port: 8080, proto: 'TCP', service: 'HTTP Proxy', sec: '🟡', rec: lang === 'vi' ? 'Tùy nhu cầu' : 'Case by case' },
                                    ].map((row, i) => (
                                        <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                                            <td style={{ padding: '0.5rem', fontWeight: 700, color: 'var(--lab-cyan)', fontFamily: 'monospace' }}>{row.port}</td>
                                            <td style={{ padding: '0.5rem', color: 'var(--lab-purple)' }}>{row.proto}</td>
                                            <td style={{ padding: '0.5rem', fontWeight: 600, color: 'var(--lab-heading)' }}>{row.service}</td>
                                            <td style={{ padding: '0.5rem', fontSize: '1rem' }}>{row.sec}</td>
                                            <td style={{ padding: '0.5rem', color: 'var(--lab-text-dim)', fontSize: '0.78rem' }}>{row.rec}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* iptables example */}
                    <div className="lab-visual-panel">
                        <h3 className="lab-section-title">🐧 {lang === 'vi' ? 'Ví dụ: iptables (Linux)' : 'Example: iptables (Linux)'}</h3>
                        <div className="lab-code">
                            <span className="comment"># Allow established connections</span>{'\n'}
                            <span className="keyword">iptables</span> -A INPUT -m state --state ESTABLISHED,RELATED -j <span className="safe-hl">ACCEPT</span>{'\n'}
                            {'\n'}
                            <span className="comment"># Allow SSH from admin IP only</span>{'\n'}
                            <span className="keyword">iptables</span> -A INPUT -p tcp -s <span className="string">192.168.1.100</span> --dport 22 -j <span className="safe-hl">ACCEPT</span>{'\n'}
                            {'\n'}
                            <span className="comment"># Allow HTTP and HTTPS</span>{'\n'}
                            <span className="keyword">iptables</span> -A INPUT -p tcp --dport 80 -j <span className="safe-hl">ACCEPT</span>{'\n'}
                            <span className="keyword">iptables</span> -A INPUT -p tcp --dport 443 -j <span className="safe-hl">ACCEPT</span>{'\n'}
                            {'\n'}
                            <span className="comment"># Allow DNS</span>{'\n'}
                            <span className="keyword">iptables</span> -A INPUT -p udp --dport 53 -j <span className="safe-hl">ACCEPT</span>{'\n'}
                            {'\n'}
                            <span className="comment"># Block everything else (default deny)</span>{'\n'}
                            <span className="keyword">iptables</span> -A INPUT -j <span className="danger-hl">DROP</span>{'\n'}
                            <span className="keyword">iptables</span> -P INPUT <span className="danger-hl">DROP</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
