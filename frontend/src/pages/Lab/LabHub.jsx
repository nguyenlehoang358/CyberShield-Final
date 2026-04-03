import React, { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useLabProgress } from '../../context/LabProgressContext'
import {
    Lock, Hash, Shield, Code, Database, Key, Globe, FileKey,
    ArrowRight, Trophy, CheckCircle2, RotateCcw, Filter, Search,
    Award
} from 'lucide-react'
import LabCertificate from './LabCertificate'
import '../../styles/lab.css'

const labModules = [
    { id: 'encryption', icon: Lock, accent: 'blue', difficulty: 'intermediate', tags: ['AES', 'RSA', 'Caesar'] },
    { id: 'hashing', icon: Hash, accent: 'purple', difficulty: 'beginner', tags: ['SHA-256', 'MD5', 'Avalanche'] },
    { id: 'firewall', icon: Shield, accent: 'green', difficulty: 'advanced', tags: ['Packet Filter', 'Rules', 'TCP/UDP'] },
    { id: 'xss', icon: Code, accent: 'red', difficulty: 'intermediate', tags: ['Reflected', 'Stored', 'DOM-based'] },
    { id: 'sqli', icon: Database, accent: 'yellow', difficulty: 'intermediate', tags: ['SQL', 'Auth Bypass', 'UNION'] },
    { id: 'password', icon: Key, accent: 'cyan', difficulty: 'beginner', tags: ['Entropy', 'Brute Force', 'Salt'] },
    { id: 'https', icon: Globe, accent: 'green', difficulty: 'advanced', tags: ['TLS 1.3', 'Handshake', 'MITM'] },
    { id: 'jwt', icon: FileKey, accent: 'pink', difficulty: 'intermediate', tags: ['Token', 'HMAC', 'Claims'] },
]

export default function LabHub() {
    const { t } = useLanguage()
    const {
        completedCount, totalLabs, progressPercent,
        isLabCompleted, achievements, unlockedAchievements,
        newAchievement, dismissAchievement, resetAll,
    } = useLabProgress()

    const [filter, setFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [showAchievements, setShowAchievements] = useState(false)
    const [showCertificate, setShowCertificate] = useState(false)

    // Dynamic page title
    useEffect(() => {
        document.title = 'Cybersecurity Lab — MyWeb'
        return () => { document.title = 'MyWeb — Cybersecurity Platform' }
    }, [])

    // Auto-dismiss achievement toast after 4s
    useEffect(() => {
        if (newAchievement) {
            const timer = setTimeout(dismissAchievement, 4000)
            return () => clearTimeout(timer)
        }
    }, [newAchievement, dismissAchievement])

    // Filter + Search
    const filteredModules = useMemo(() => {
        return labModules.filter(lab => {
            // Filter by completion status
            if (filter === 'completed' && !isLabCompleted(lab.id)) return false
            if (filter === 'incomplete' && isLabCompleted(lab.id)) return false

            // Search
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase()
                const title = t(`lab_${lab.id}_title`).toLowerCase()
                const desc = t(`lab_${lab.id}_desc`).toLowerCase()
                const tags = lab.tags.join(' ').toLowerCase()
                if (!title.includes(q) && !desc.includes(q) && !tags.includes(q) && !lab.id.includes(q)) {
                    return false
                }
            }

            return true
        })
    }, [filter, searchQuery, isLabCompleted, t])

    return (
        <div className="lab-hub">
            {/* Achievement Toast */}
            {newAchievement && (
                <div className="lab-achievement-toast" onClick={dismissAchievement}>
                    <div className="lab-achievement-toast-icon">{newAchievement.icon}</div>
                    <div>
                        <div className="lab-achievement-toast-title">{t('lab_achievement_unlocked')}</div>
                        <div className="lab-achievement-toast-name">{t(`ach_${newAchievement.id}`)}</div>
                    </div>
                </div>
            )}

            {/* Certificate Modal */}
            {showCertificate && (
                <LabCertificate onClose={() => setShowCertificate(false)} />
            )}

            {/* Header */}
            <header className="lab-hub-header">
                <div className="lab-hub-badge">
                    <span className="pulse-dot"></span>
                    {t('lab_badge')}
                </div>

                <h1 className="lab-hub-title">
                    {t('lab_hub_title_1')}{' '}
                    <span className="accent">{t('lab_hub_title_2')}</span>
                </h1>

                <p className="lab-hub-desc">{t('lab_hub_desc')}</p>

                <div className="lab-hub-stats">
                    <div className="lab-hub-stat">
                        <div className="lab-hub-stat-num">8</div>
                        <div className="lab-hub-stat-label">{t('lab_stat_modules')}</div>
                    </div>
                    <div className="lab-hub-stat">
                        <div className="lab-hub-stat-num">100%</div>
                        <div className="lab-hub-stat-label">{t('lab_stat_interactive')}</div>
                    </div>
                    <div className="lab-hub-stat">
                        <div className="lab-hub-stat-num">0</div>
                        <div className="lab-hub-stat-label">{t('lab_stat_risk')}</div>
                    </div>
                </div>
            </header>

            {/* Progress Section */}
            <section className="lab-progress-section">
                <div className="lab-progress-card">
                    <div className="lab-progress-header">
                        <div className="lab-progress-info">
                            <Trophy size={20} className="lab-progress-icon" />
                            <h3>{t('lab_progress_title')}</h3>
                        </div>
                        <div className="lab-progress-stats-inline">
                            <span className="lab-progress-count">{completedCount}</span>
                            <span className="lab-progress-sep">/</span>
                            <span className="lab-progress-total">{totalLabs}</span>
                        </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="lab-progress-bar-container">
                        <div
                            className="lab-progress-bar-fill"
                            style={{ width: `${progressPercent}%` }}
                        />
                        <span className="lab-progress-bar-label">{progressPercent}%</span>
                    </div>

                    {/* Lab dot indicators */}
                    <div className="lab-progress-dots">
                        {labModules.map(lab => {
                            const completed = isLabCompleted(lab.id)
                            return (
                                <Link
                                    key={lab.id}
                                    to={`/lab/${lab.id}`}
                                    className={`lab-progress-dot ${completed ? 'completed' : ''}`}
                                    data-accent={lab.accent}
                                    title={t(`lab_${lab.id}_title`)}
                                >
                                    {completed && <CheckCircle2 size={10} />}
                                </Link>
                            )
                        })}
                    </div>

                    {/* Achievements + Certificate row */}
                    <div className="lab-achievements-row">
                        <div className="lab-achievements-left">
                            <button
                                className="lab-achievements-toggle"
                                onClick={() => setShowAchievements(v => !v)}
                            >
                                <Trophy size={14} />
                                {t('lab_achievements_title')} ({unlockedAchievements.length}/{achievements.length})
                            </button>

                            {completedCount > 0 && (
                                <button
                                    className="lab-cert-trigger"
                                    onClick={() => setShowCertificate(true)}
                                >
                                    <Award size={14} />
                                    {t('cert_view')}
                                </button>
                            )}
                        </div>

                        {completedCount > 0 && (
                            <button className="lab-reset-btn" onClick={resetAll} title={t('lab_reset_all')}>
                                <RotateCcw size={12} />
                                {t('lab_reset_all')}
                            </button>
                        )}
                    </div>

                    {/* Achievements panel */}
                    {showAchievements && (
                        <div className="lab-achievements-grid">
                            {achievements.map(ach => {
                                const unlocked = unlockedAchievements.includes(ach)
                                return (
                                    <div
                                        key={ach.id}
                                        className={`lab-achievement-item ${unlocked ? 'unlocked' : 'locked'}`}
                                    >
                                        <div className="lab-achievement-icon">{ach.icon}</div>
                                        <div className="lab-achievement-name">{t(`ach_${ach.id}`)}</div>
                                        <div className="lab-achievement-desc">{t(`ach_${ach.id}_desc`)}</div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </section>

            {/* Search + Filter bar */}
            <div className="lab-filter-bar">
                <div className="lab-search-box">
                    <Search size={14} />
                    <input
                        type="text"
                        placeholder={t('lab_search_placeholder')}
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="lab-search-input"
                    />
                    {searchQuery && (
                        <button className="lab-search-clear" onClick={() => setSearchQuery('')}>×</button>
                    )}
                </div>

                <div className="lab-filter-pills">
                    <Filter size={14} />
                    {['all', 'completed', 'incomplete'].map(f => (
                        <button
                            key={f}
                            className={`lab-filter-btn ${filter === f ? 'active' : ''}`}
                            onClick={() => setFilter(f)}
                        >
                            {t(`lab_filter_${f}`)}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lab Cards Grid */}
            <div className="lab-grid">
                {filteredModules.map((lab) => {
                    const Icon = lab.icon
                    const diffLabel = t(`lab_diff_${lab.difficulty}`)
                    const completed = isLabCompleted(lab.id)
                    return (
                        <Link
                            key={lab.id}
                            to={`/lab/${lab.id}`}
                            className={`lab-card lab-animate-in ${completed ? 'lab-card-completed' : ''}`}
                            data-accent={lab.accent}
                        >
                            {completed && (
                                <div className="lab-card-completed-badge">
                                    <CheckCircle2 size={14} />
                                </div>
                            )}

                            <div className="lab-card-icon">
                                <Icon />
                            </div>

                            <h3 className="lab-card-title">{t(`lab_${lab.id}_title`)}</h3>
                            <p className="lab-card-desc">{t(`lab_${lab.id}_desc`)}</p>

                            <div className="lab-card-tags">
                                {lab.tags.map(tag => (
                                    <span key={tag} className="lab-card-tag">{tag}</span>
                                ))}
                            </div>

                            <div className="lab-card-footer">
                                <span className={`lab-card-difficulty ${lab.difficulty}`}>
                                    {diffLabel}
                                </span>
                                <span className="lab-card-arrow">
                                    <ArrowRight size={16} />
                                </span>
                            </div>
                        </Link>
                    )
                })}

                {filteredModules.length === 0 && (
                    <div className="lab-empty-state">
                        {searchQuery
                            ? `🔍 ${t('lab_no_results')} "${searchQuery}"`
                            : filter === 'completed'
                                ? `🎯 ${t('lab_none_completed')}`
                                : `✅ ${t('lab_all_completed')}`
                        }
                    </div>
                )}
            </div>
        </div>
    )
}
