import React, { useState, useEffect } from 'react'
import { Flag, Trophy, Target, Award, Unlock, HelpCircle, BookOpen, Globe } from 'lucide-react'
import { ctfChallenges } from '../../data/ctfChallenges'
import { useLanguage } from '../../context/LanguageContext'
import '../../styles/ecosystem.css'

// Hardcoded flags for demonstration
const FLAGS = {
    'sanity-check': 'CTF{welcome_to_myweb_ctf}',
    'web-inspector': 'CTF{html_comments_are_not_secret}',
    'cookie-monster': 'CTF{cookies_tast_good}',
    'base64-decoder': 'CTF{base64_is_not_encryption}'
}

export default function CTFHub() {
    const { t, lang, toggleLang } = useLanguage()

    const [solved, setSolved] = useState(() => {
        const saved = localStorage.getItem('ctf_solved')
        return saved ? JSON.parse(saved) : []
    })
    const [totalPoints, setTotalPoints] = useState(0)
    const [currentFlag, setCurrentFlag] = useState('')
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const [showHint, setShowHint] = useState({})
    const [showInstructions, setShowInstructions] = useState(true)

    useEffect(() => {
        // Challenge 2: HTML Comment
        const comment = document.createComment(' Flag: CTF{html_comments_are_not_secret} ')
        document.body.appendChild(comment)

        // Challenge 3: Cookie
        document.cookie = "admin_flag=CTF{cookies_tast_good}; path=/; SameSite=Strict"

        return () => {
            document.body.removeChild(comment)
        }
    }, [])

    useEffect(() => {
        const points = solved.reduce((acc, id) => {
            const chal = ctfChallenges.find(c => c.id === id)
            return acc + (chal?.points || 0)
        }, 0)
        setTotalPoints(points)
        localStorage.setItem('ctf_solved', JSON.stringify(solved))
    }, [solved])

    const submitFlag = (e, chalId) => {
        e.preventDefault()
        setError(null)
        setSuccess(null)

        if (solved.includes(chalId)) return

        const correctFlag = FLAGS[chalId]
        if (currentFlag.trim() === correctFlag) {
            setSolved([...solved, chalId])
            setSuccess(`Correct! +${ctfChallenges.find(c => c.id === chalId).points} points`)
            setCurrentFlag('')
            setTimeout(() => setSuccess(null), 3000)
        } else {
            setError(t('ctf_feedback_error') || 'Incorrect flag. Try again!')
            setTimeout(() => setError(null), 3000)
        }
    }

    const toggleHint = (id) => {
        setShowHint(prev => ({ ...prev, [id]: !prev[id] }))
    }

    return (
        <div className="eco-page">
            <div className="eco-container">
                {/* Header */}
                <header className="ctf-header">
                    <div>
                        <h1 className="eco-title-gradient">{t('ctf_title')}</h1>
                        <p className="eco-subtitle">{t('ctf_subtitle')}</p>

                        <div style={{ display: 'flex', gap: '1rem' }}>
                            <button
                                onClick={() => setShowInstructions(v => !v)}
                                className="ctf-hint-btn"
                                style={{ margin: 0, border: '1px solid var(--eco-border)', padding: '0.4rem 0.8rem', borderRadius: '6px' }}
                            >
                                <BookOpen size={16} /> {t('ctf_instruction_title')}
                            </button>

                            <button
                                onClick={toggleLang}
                                className="ctf-hint-btn"
                                style={{ margin: 0, border: '1px solid var(--eco-border)', padding: '0.4rem 0.8rem', borderRadius: '6px' }}
                            >
                                <Globe size={16} /> {lang.toUpperCase()}
                            </button>
                        </div>
                    </div>

                    <div className="ctf-score-card">
                        <div className="ctf-score-icon">
                            <Trophy />
                        </div>
                        <div>
                            <div className="ctf-label">{t('ctf_score')}</div>
                            <div className="ctf-score-value">{totalPoints}</div>
                        </div>
                    </div>
                </header>

                {/* Instructions Section */}
                {showInstructions && (
                    <div className="eco-instructions">
                        <h3><BookOpen size={20} /> {t('ctf_instruction_title')}</h3>
                        <p>{t('ctf_instruction_desc')}</p>
                        <strong>{t('ctf_how_to_play')}</strong>
                        <ol>
                            <li>{t('ctf_step_1')}</li>
                            <li>{t('ctf_step_2')}</li>
                            <li>{t('ctf_step_3')}</li>
                            <li>{t('ctf_step_4')}</li>
                        </ol>
                        <div className="eco-example">
                            {t('ctf_example')}
                        </div>
                    </div>
                )}

                {/* Grid */}
                <div className="ctf-grid">
                    {ctfChallenges.map(chal => {
                        const isSolved = solved.includes(chal.id)

                        return (
                            <div key={chal.id} className={`ctf-card ${isSolved ? 'solved' : ''}`}>
                                <div className="ctf-card-header">
                                    <span className={`ctf-badge badge-${chal.category.toLowerCase()}`}>
                                        {t(`ctf_category_${chal.category.toLowerCase()}`) || chal.category}
                                    </span>
                                    <span className="ctf-points">{chal.points} PTS</span>
                                </div>

                                <h3 className="ctf-card-title">{chal.title}</h3>
                                <p className="ctf-desc">{chal.desc}</p>

                                {/* Solved overlay */}
                                {isSolved ? (
                                    <div className="ctf-feedback success" style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.1rem' }}>
                                        <Unlock size={20} /> {t('ctf_solved')}
                                    </div>
                                ) : (
                                    <form onSubmit={(e) => submitFlag(e, chal.id)} className="ctf-input-group">
                                        <div style={{ position: 'relative' }}>
                                            <Target size={18} style={{ position: 'absolute', left: '12px', top: '12px', color: 'var(--eco-text-dim)' }} />
                                            <input
                                                type="text"
                                                className="ctf-input"
                                                placeholder="CTF{...}"
                                                onChange={(e) => setCurrentFlag(e.target.value)}
                                            />
                                            <button type="submit" className="ctf-submit-btn">{t('ctf_submit')}</button>
                                        </div>

                                        {error && <div className="ctf-feedback error">{error}</div>}

                                        <button
                                            type="button"
                                            className="ctf-hint-btn"
                                            onClick={() => toggleHint(chal.id)}
                                        >
                                            <HelpCircle size={14} /> {showHint[chal.id] ? t('ctf_hide_hint') : t('ctf_hint_btn')}
                                        </button>

                                        {showHint[chal.id] && (
                                            <div className="ctf-hint-box">
                                                💡 Hint: {chal.hint}
                                            </div>
                                        )}
                                    </form>
                                )}
                            </div>
                        )
                    })}
                </div>

                {/* Toast */}
                {success && (
                    <div className="ctf-toast">
                        <Award size={24} />
                        <div>
                            <div style={{ fontWeight: 800 }}>{t('ctf_congrats')}</div>
                            <div>{success}</div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
