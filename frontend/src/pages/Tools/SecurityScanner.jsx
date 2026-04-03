import React, { useState } from 'react'
import axios from 'axios'
import { Shield, ShieldAlert, ShieldCheck, Search, Globe, Lock, Server, BookOpen } from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import '../../styles/ecosystem.css'

export default function SecurityScanner() {
    const { t, lang, toggleLang } = useLanguage()
    const [target, setTarget] = useState(window.location.origin)
    const [loading, setLoading] = useState(false)
    const [results, setResults] = useState(null)
    const [error, setError] = useState(null)
    const [showInstructions, setShowInstructions] = useState(true)

    const scanTarget = async () => {
        setLoading(true)
        setError(null)
        setResults(null)

        try {
            const start = performance.now()
            const response = await axios.get(target, { validateStatus: () => true })
            const duration = performance.now() - start

            const headers = response.headers
            const analysis = { score: 0, details: [] }

            // Checks (Logic remains same)
            if (headers['strict-transport-security']) {
                analysis.score += 20; analysis.details.push({ key: 'HSTS', status: 'pass', msg: 'Strict-Transport-Security enabled.' })
            } else {
                analysis.details.push({ key: 'HSTS', status: 'fail', msg: 'Missing HSTS header.' })
            }
            if (headers['x-frame-options']) {
                analysis.score += 20; analysis.details.push({ key: 'Clickjacking', status: 'pass', msg: `X-Frame-Options: ${headers['x-frame-options']}` })
            } else {
                analysis.details.push({ key: 'Clickjacking', status: 'fail', msg: 'Missing X-Frame-Options.' })
            }
            if (headers['x-content-type-options'] === 'nosniff') {
                analysis.score += 20; analysis.details.push({ key: 'MIME Sniffing', status: 'pass', msg: 'nosniff enabled.' })
            } else {
                analysis.details.push({ key: 'MIME Sniffing', status: 'fail', msg: 'Missing X-Content-Type-Options.' })
            }
            if (headers['content-security-policy']) {
                analysis.score += 20; analysis.details.push({ key: 'CSP', status: 'pass', msg: 'Content-Security-Policy configured.' })
            } else {
                analysis.details.push({ key: 'CSP', status: 'warn', msg: 'Missing CSP (Recommended).' })
            }
            if (headers['server'] || headers['x-powered-by']) {
                analysis.details.push({ key: 'Info Leak', status: 'warn', msg: `Revealed: ${headers['server'] || headers['x-powered-by']}` })
            } else {
                analysis.score += 20; analysis.details.push({ key: 'Info Leak', status: 'pass', msg: 'Server info hidden.' })
            }

            setResults({
                url: target,
                status: response.status,
                duration: Math.round(duration),
                headers: headers,
                analysis: analysis
            })
        } catch (err) {
            setError(err.message || 'Scan failed (CORS/Network error)')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="eco-page">
            <div className="eco-container">
                <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                    <h1 className="eco-title-gradient">{t('scan_title')}</h1>
                    <p className="eco-subtitle">{t('scan_subtitle')}</p>

                    <button
                        onClick={toggleLang}
                        style={{ background: 'none', border: '1px solid var(--eco-border)', padding: '0.4rem 0.8rem', borderRadius: '6px', color: 'var(--eco-text)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', marginRight: '1rem' }}
                    >
                        <Globe size={16} /> {lang.toUpperCase()}
                    </button>

                    <button
                        onClick={() => setShowInstructions(v => !v)}
                        style={{ background: 'none', border: '1px solid var(--eco-border)', padding: '0.4rem 0.8rem', borderRadius: '6px', color: 'var(--eco-text)', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                    >
                        <BookOpen size={16} /> {t('scan_instruction_title')}
                    </button>
                </header>

                {/* Instructions / Theory */}
                {showInstructions && (
                    <div className="eco-instructions" style={{ maxWidth: '800px', margin: '0 auto 3rem auto' }}>
                        <h3><BookOpen size={20} /> {t('scan_instruction_title')}</h3>
                        <p>{t('scan_instruction_desc')}</p>
                        <ul className="eco-theory-list">
                            <li><strong>HSTS:</strong> {t('scan_theory_hsts')}</li>
                            <li><strong>CSP:</strong> {t('scan_theory_csp')}</li>
                            <li><strong>Anti-Clickjacking:</strong> {t('scan_theory_xframe')}</li>
                            <li><strong>MIME Sniffing:</strong> {t('scan_theory_nosniff')}</li>
                        </ul>
                    </div>
                )}

                {/* Input Box */}
                <div className="scan-box">
                    <div className="scan-input-wrapper">
                        <Globe className="scan-input-icon" size={20} />
                        <input
                            type="text"
                            className="scan-input"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            placeholder={t('scan_placeholder')}
                        />
                    </div>
                    <button
                        onClick={scanTarget}
                        disabled={loading}
                        className="scan-btn"
                    >
                        {loading ? 'Scanning...' : <><Search size={18} /> {t('scan_btn')}</>}
                    </button>
                </div>

                <p style={{ fontSize: '0.8rem', color: '#666', textAlign: 'center', marginBottom: '2rem' }}>
                    {t('scan_note')}
                </p>

                {error && (
                    <div className="ctf-feedback error" style={{ padding: '1rem', background: 'rgba(218,54,51,0.1)', borderRadius: '8px', marginBottom: '2rem' }}>
                        <ShieldAlert size={20} style={{ float: 'left', marginRight: '10px' }} />
                        {error}
                    </div>
                )}

                {results && (
                    <div className="scan-results">
                        {/* Score Grid */}
                        <div className="scan-score-grid">
                            <div className="scan-stat-card">
                                <div className="ctf-label">{t('scan_result_score')}</div>
                                <div className={`scan-score-big ${getGradeClass(results.analysis.score)}`}>
                                    {results.analysis.score}
                                </div>
                                <div className={`ctf-badge ${getGradeClass(results.analysis.score)}`}>
                                    {getGradeText(results.analysis.score)}
                                </div>
                            </div>

                            <div className="scan-stat-card" style={{ alignItems: 'flex-start', textAlign: 'left' }}>
                                <div className="ctf-label" style={{ marginBottom: '1rem' }}>{t('scan_target')}</div>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <span style={{ color: '#666' }}>URL: </span>
                                    <b>{new URL(results.url).hostname}</b>
                                </div>
                                <div style={{ marginBottom: '0.5rem' }}>
                                    <span style={{ color: '#666' }}>{t('scan_status')}: </span>
                                    <span style={{ color: results.status === 200 ? '#238636' : '#d29922' }}>{results.status} OK</span>
                                </div>
                                <div>
                                    <span style={{ color: '#666' }}>{t('scan_time')}: </span>
                                    {results.duration}ms
                                </div>
                            </div>

                            <div className="scan-stat-card">
                                <Shield size={64} color={getScoreColor(results.analysis.score)} />
                            </div>
                        </div>

                        {/* Details Table */}
                        <div className="scan-details">
                            <div className="scan-details-header">
                                <Server size={18} /> {t('scan_details')}
                            </div>
                            <div>
                                {results.analysis.details.map((item, idx) => (
                                    <div key={idx} className="scan-row">
                                        <div className={`scan-status-icon ${item.status}`}>
                                            {getStatusIcon(item.status)}
                                        </div>
                                        <div className="scan-row-content">
                                            <h4>{item.key}</h4>
                                            <p>{item.msg}</p>
                                        </div>
                                        <span className={`scan-badge ${item.status}`}>{item.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

// Helpers
function getGradeClass(score) {
    if (score >= 80) return 'good' // green using CSS var
    if (score >= 50) return 'avg'  // yellow
    return 'bad' // red
}

function getGradeText(score) {
    if (score >= 90) return 'EXCELLENT'
    if (score >= 80) return 'GOOD'
    if (score >= 60) return 'AVERAGE'
    return 'POOR'
}

function getScoreColor(score) {
    if (score >= 80) return '#238636'
    if (score >= 50) return '#d29922'
    return '#da3633'
}

function getStatusIcon(status) {
    if (status === 'pass') return <ShieldCheck size={20} />
    if (status === 'fail') return <ShieldAlert size={20} />
    return <Lock size={20} />
}
