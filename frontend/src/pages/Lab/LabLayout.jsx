import React, { useState, useCallback, useEffect } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import { useLabProgress } from '../../context/LabProgressContext'
import {
    ChevronLeft, ChevronRight, BookOpen, ArrowLeft,
    Lock, Hash, Shield, Code, Database, Key, Globe, FileKey,
    CheckCircle2, RotateCcw, Keyboard, Sparkles
} from 'lucide-react'
import LabMentorChat from './LabMentorChat'
import { useLab } from '../../context/LabContext'
import '../../styles/lab.css'

const labList = [
    { id: 'encryption', icon: Lock },
    { id: 'hashing', icon: Hash },
    { id: 'firewall', icon: Shield },
    { id: 'xss', icon: Code },
    { id: 'sqli', icon: Database },
    { id: 'password', icon: Key },
    { id: 'https', icon: Globe },
    { id: 'jwt', icon: FileKey },
]

export default function LabLayout() {
    const { t } = useLanguage()
    const location = useLocation()
    const navigate = useNavigate()
    const [sidebarOpen, setSidebarOpen] = useState(true)
    const [theoryContent, setTheoryContent] = useState(null)
    const [isScrolled, setIsScrolled] = useState(false)
    const [showShortcuts, setShowShortcuts] = useState(false)
    const [sidebarTab, setSidebarTab] = useState('theory')
    const [labContext, setLabContext] = useState('')

    const { isLabCompleted, completeLab, resetLab } = useLabProgress()
    const { setLabInputData } = useLab()

    // Reset Lab Context when switching labs
    useEffect(() => {
        setLabInputData('');
    }, [location.pathname, setLabInputData])

    // Detect scroll to apply sticky header background
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 10)
        }
        window.addEventListener('scroll', handleScroll, { passive: true })
        handleScroll()
        return () => window.removeEventListener('scroll', handleScroll)
    }, [])

    // Find current lab info
    const currentSlug = location.pathname.split('/lab/')[1] || ''
    const currentIndex = labList.findIndex(l => l.id === currentSlug)
    const currentLab = labList[currentIndex]
    const prevLab = currentIndex > 0 ? labList[currentIndex - 1] : null
    const nextLab = currentIndex < labList.length - 1 ? labList[currentIndex + 1] : null
    const currentCompleted = currentSlug ? isLabCompleted(currentSlug) : false

    // Dynamic page title
    useEffect(() => {
        if (currentLab) {
            const labTitle = t(`lab_${currentLab.id}_title`)
            document.title = `${labTitle} — Lab | MyWeb`
        }
        return () => { document.title = 'MyWeb — Cybersecurity Platform' }
    }, [currentLab, t])

    // Keyboard shortcuts
    useEffect(() => {
        const handleKey = (e) => {
            // Don't trigger when typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return

            switch (e.key) {
                case 'ArrowLeft':
                case '[':
                    if (prevLab) {
                        e.preventDefault()
                        navigate(`/lab/${prevLab.id}`)
                    }
                    break
                case 'ArrowRight':
                case ']':
                    if (nextLab) {
                        e.preventDefault()
                        navigate(`/lab/${nextLab.id}`)
                    }
                    break
                case 't':
                case 'T':
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault()
                        setSidebarOpen(prev => !prev)
                    }
                    break
                case 'h':
                case 'H':
                    if (!e.ctrlKey && !e.metaKey) {
                        e.preventDefault()
                        navigate('/lab')
                    }
                    break
                case 'c':
                case 'C':
                    if (!e.ctrlKey && !e.metaKey && currentSlug && !currentCompleted) {
                        e.preventDefault()
                        completeLab(currentSlug)
                    }
                    break
                case '?':
                    e.preventDefault()
                    setShowShortcuts(prev => !prev)
                    break
                case 'Escape':
                    setShowShortcuts(false)
                    break
                default:
                    break
            }
        }

        window.addEventListener('keydown', handleKey)
        return () => window.removeEventListener('keydown', handleKey)
    }, [prevLab, nextLab, navigate, currentSlug, currentCompleted, completeLab])

    // Callback for child modules to set theory content
    const setTheory = useCallback((content) => {
        setTheoryContent(content)
    }, [])

    return (
        <div className="lab-layout">
            {/* Keyboard shortcuts overlay */}
            {showShortcuts && (
                <div className="lab-shortcuts-overlay" onClick={() => setShowShortcuts(false)}>
                    <div className="lab-shortcuts-modal" onClick={e => e.stopPropagation()}>
                        <h3><Keyboard size={18} /> {t('kb_title')}</h3>
                        <div className="lab-shortcuts-grid">
                            <div className="lab-shortcut"><kbd>←</kbd> <span>{t('kb_prev')}</span></div>
                            <div className="lab-shortcut"><kbd>→</kbd> <span>{t('kb_next')}</span></div>
                            <div className="lab-shortcut"><kbd>T</kbd> <span>{t('kb_toggle_theory')}</span></div>
                            <div className="lab-shortcut"><kbd>H</kbd> <span>{t('kb_home')}</span></div>
                            <div className="lab-shortcut"><kbd>C</kbd> <span>{t('kb_complete')}</span></div>
                            <div className="lab-shortcut"><kbd>?</kbd> <span>{t('kb_shortcuts')}</span></div>
                            <div className="lab-shortcut"><kbd>Esc</kbd> <span>{t('kb_close')}</span></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Sticky header wrapper */}
            <div className={`lab-sticky-header ${isScrolled ? 'scrolled' : ''}`}>
                <div className="lab-topbar">
                    <div className="lab-breadcrumb">
                        <Link to="/lab">
                            <ArrowLeft size={16} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                            Lab
                        </Link>
                        <span className="separator">/</span>
                        <span className="current">
                            {currentLab ? t(`lab_${currentLab.id}_title`) : 'Lab'}
                        </span>

                        {/* Lab position indicator */}
                        {currentIndex >= 0 && (
                            <span className="lab-position-badge">
                                {currentIndex + 1} / {labList.length}
                            </span>
                        )}
                    </div>

                    <div className="lab-topbar-actions">
                        {/* Complete / Reset button */}
                        {currentSlug && (
                            currentCompleted ? (
                                <div className="lab-topbar-completion">
                                    <span className="lab-topbar-done-badge">
                                        <CheckCircle2 size={14} />
                                        {t('lab_completed_badge')}
                                    </span>
                                    <button
                                        className="lab-topbar-reset-btn"
                                        onClick={() => resetLab(currentSlug)}
                                        title={t('lab_reset_progress')}
                                    >
                                        <RotateCcw size={12} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    className="lab-topbar-complete-btn"
                                    onClick={() => completeLab(currentSlug)}
                                >
                                    <CheckCircle2 size={14} />
                                    {t('lab_mark_complete')}
                                </button>
                            )
                        )}

                        {/* Keyboard shortcuts button */}
                        <button
                            className="lab-topbar-kb-btn"
                            onClick={() => setShowShortcuts(v => !v)}
                            title={t('kb_shortcuts')}
                        >
                            <Keyboard size={14} />
                        </button>

                        {/* Nav buttons */}
                        <div className="lab-nav-btns">
                            {prevLab && (
                                <Link to={`/lab/${prevLab.id}`} className="lab-nav-btn">
                                    <ChevronLeft size={14} />
                                    {t(`lab_${prevLab.id}_title`)}
                                </Link>
                            )}
                            {nextLab && (
                                <Link to={`/lab/${nextLab.id}`} className="lab-nav-btn">
                                    {t(`lab_${nextLab.id}_title`)}
                                    <ChevronRight size={14} />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Body */}
            <div className="lab-body" style={{ position: 'relative' }}>
                {/* Toggle button */}
                <button
                    className="lab-sidebar-toggle"
                    onClick={() => setSidebarOpen(prev => !prev)}
                    style={{ left: sidebarOpen ? 380 : 0 }}
                    title={sidebarOpen ? t('lab_hide_theory') : t('lab_show_theory')}
                >
                    {sidebarOpen ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
                </button>

                {/* Theory Sidebar */}
                <aside className={`lab-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
                    {/* Sidebar Tabs: Theory / Mentor */}
                    <div className="lab-sidebar-tabs">
                        <button
                            className={`lab-sidebar-tab ${sidebarTab === 'theory' ? 'active' : ''}`}
                            onClick={() => { setSidebarTab('theory'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                        >
                            <BookOpen size={13} />
                            {t('lab_theory')}
                        </button>
                        <button
                            className={`lab-sidebar-tab ${sidebarTab === 'mentor' ? 'active' : ''}`}
                            onClick={() => { setSidebarTab('mentor'); window.scrollTo({ top: 0, behavior: 'instant' }); }}
                        >
                            <Sparkles size={13} />
                            Lab Mentor
                        </button>
                    </div>

                    {/* Theory Content */}
                    {sidebarTab === 'theory' && (
                        <>
                            <div className="lab-theory-title">
                                <BookOpen size={14} />
                                {t('lab_theory')}
                            </div>
                            <div className="lab-theory">
                                {theoryContent}
                            </div>
                        </>
                    )}

                    {/* Mentor Chat */}
                    {sidebarTab === 'mentor' && (
                        <LabMentorChat
                            labId={currentSlug}
                            labContext={labContext}
                        />
                    )}
                </aside>

                {/* Main simulation area */}
                <main className="lab-main">
                    <Outlet context={{ sidebarOpen, setSidebarOpen, setTheory, setLabContext }} />
                </main>
            </div>
        </div>
    )
}
