import React, { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLanguage } from '../context/LanguageContext'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'
import '../styles/modal.css'
import ParticleCanvas from '../components/ParticleCanvas'
import FloatingShapes from '../components/FloatingShapes'
import {
    Shield, Zap, Globe, Cpu, Database, Check,
    ArrowRight, Search, Code, Lock, Cloud, Users,
    Activity, Anchor, Layout, Server, Smartphone, Terminal, Wifi
} from 'lucide-react'

const IconMap = {
    Shield, Zap, Globe, Cpu, Database, Check,
    Search, Code, Lock, Cloud, Users,
    Activity, Anchor, Layout, Server, Smartphone, Terminal, Wifi
}

// Modal Component for Solution Details
function SolutionModal({ solution, onClose, navigate, lang }) {
    if (!solution) return null

    // Support both DB fields and static data fields
    const title = lang === 'vi' ? (solution.titleVi || solution.title) : (solution.titleEn || solution.title)
    const description = lang === 'vi' ? (solution.descriptionVi || solution.description) : (solution.descriptionEn || solution.description)

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content animate-slide-up" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>&times;</button>

                <div className={`modal-header ${solution.color}`}>
                    <div className="modal-icon">{IconMap[solution.icon] ? React.createElement(IconMap[solution.icon], { size: 32 }) : <Zap size={32} />}</div>
                    <h2>{title}</h2>
                </div>

                <div className="modal-body">
                    <p className="modal-desc">{description}</p>

                    {solution.detail && (
                        <>
                            <div className="modal-detail-section">
                                <h4><span className="icon-bullet">💡</span> {lang === 'vi' ? 'Khái niệm' : 'Concept'}</h4>
                                <p>{solution.detail.concept}</p>
                            </div>
                            <div className="modal-detail-section">
                                <h4><span className="icon-bullet">🛠️</span> {lang === 'vi' ? 'Cách sử dụng' : 'Usage'}</h4>
                                <p>{solution.detail.usage}</p>
                            </div>
                            <div className="modal-detail-section">
                                <h4><span className="icon-bullet">🌍</span> {lang === 'vi' ? 'Ứng dụng' : 'Application'}</h4>
                                <p>{solution.detail.application}</p>
                            </div>
                        </>
                    )}

                    {solution.relatedLabs && solution.relatedLabs.length > 0 && (
                        <div className="modal-labs-section">
                            <h4>{lang === 'vi' ? 'Các bài Lab liên quan:' : 'Related Labs:'}</h4>
                            <div className="modal-labs-grid">
                                {solution.relatedLabs.map(lab => (
                                    <button
                                        key={lab.id}
                                        className="lab-chip"
                                        onClick={() => navigate(lab.path)}
                                    >
                                        <Code size={14} /> {lab.name}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// Hook for scroll animations
function useScrollAnimation() {
    const ref = useRef(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('visible')
                    }
                })
            },
            { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
        )

        const elements = ref.current?.querySelectorAll('.animate-on-scroll, .stagger-children')
        elements?.forEach(el => observer.observe(el))

        return () => observer.disconnect()
    }, [])

    return ref
}

// Text reveal component - types out text letter by letter
function TextReveal({ text, delay = 0, className = '' }) {
    const [displayText, setDisplayText] = useState('')
    const [started, setStarted] = useState(false)
    const ref = useRef(null)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started) {
                    setStarted(true)
                }
            },
            { threshold: 0.5 }
        )
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [started])

    useEffect(() => {
        if (!started) return
        let isMounted = true
        let i = 0
        const timer = setTimeout(() => {
            if (!isMounted) return;
            const interval = setInterval(() => {
                if (!isMounted) {
                    clearInterval(interval)
                    return;
                }
                if (i < text.length) {
                    setDisplayText(text.substring(0, i + 1))
                    i++
                } else {
                    clearInterval(interval)
                }
            }, 35)
            // Save interval to variable so it can be cleared below if needed
            window.__revealInterval = interval;
        }, delay)
        return () => {
            isMounted = false
            clearTimeout(timer)
            if (window.__revealInterval) clearInterval(window.__revealInterval)
        }
    }, [started, text, delay])

    return (
        <span ref={ref} className={className}>
            {displayText}
            {displayText.length < text.length && started && (
                <span className="typing-cursor">|</span>
            )}
        </span>
    )
}

// Counter animation
function AnimatedCounter({ target, duration = 2000 }) {
    const [count, setCount] = useState('0')
    const ref = useRef(null)
    const [started, setStarted] = useState(false)

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !started) {
                    setStarted(true)
                }
            },
            { threshold: 0.5 }
        )
        if (ref.current) observer.observe(ref.current)
        return () => observer.disconnect()
    }, [started])

    useEffect(() => {
        if (!started) return
        let isMounted = true
        const numericPart = parseInt(target.replace(/[^0-9.]/g, ''))
        const suffix = target.replace(/[0-9.]/g, '')
        const hasDecimal = target.includes('.')

        if (isNaN(numericPart)) {
            setCount(target)
            return
        }

        let startTime = null
        let animationFrameId = null
        
        function step(timestamp) {
            if (!isMounted) return;
            if (!startTime) startTime = timestamp
            const progress = Math.min((timestamp - startTime) / duration, 1)
            // Easing
            const eased = 1 - Math.pow(1 - progress, 3)
            const current = hasDecimal
                ? (numericPart * eased).toFixed(1)
                : Math.floor(numericPart * eased)
            setCount(current + suffix)
            if (progress < 1) {
                animationFrameId = requestAnimationFrame(step)
            }
        }
        animationFrameId = requestAnimationFrame(step)
        
        return () => {
            isMounted = false;
            if (animationFrameId) cancelAnimationFrame(animationFrameId);
        }
    }, [started, target, duration])

    return <span ref={ref}>{count}</span>
}

export default function Home() {
    const { t, lang } = useLanguage()
    const { api } = useAuth()
    const scrollRef = useScrollAnimation()
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 })

    // Track mouse for parallax effects
    useEffect(() => {
        const handleMouseMove = (e) => {
            setMousePos({
                x: (e.clientX / window.innerWidth - 0.5) * 2,
                y: (e.clientY / window.innerHeight - 0.5) * 2
            })
        }
        window.addEventListener('mousemove', handleMouseMove)
        return () => window.removeEventListener('mousemove', handleMouseMove)
    }, [])

    const [selectedSolution, setSelectedSolution] = useState(null)
    const [solutions, setSolutions] = useState([])
    const [solutionsLoading, setSolutionsLoading] = useState(true)
    const navigate = useNavigate()

    // Fetch solutions from API
    useEffect(() => {
        let isMounted = true;
        const fetchSolutions = async () => {
            try {
                const currentHost = window.location.hostname;
                let apiPath = `https://${currentHost}:8443/api/public/solutions`;

                if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
                    apiPath = '/api/public/solutions';
                } else if (currentHost.includes('ngrok-free.app') || currentHost.includes('ngrok-free.dev')) {
                    apiPath = import.meta.env.VITE_NGROK_BACKEND_URL ? `${import.meta.env.VITE_NGROK_BACKEND_URL}/public/solutions` : `https://api-${currentHost}/api/public/solutions`;
                }
                const res = await axios.get(apiPath, {
                    headers: {
                        'ngrok-skip-browser-warning': 'true',
                        'bypass-tunnel-reminder': 'true'
                    }
                });
                if (!isMounted) return;
                
                const parsedSolutions = res.data.map(s => {
                    let parsedDetail = null;
                    let parsedLabs = [];
                    try {
                        if (s.detailJson) parsedDetail = JSON.parse(s.detailJson);
                        if (s.relatedLabsJson) parsedLabs = JSON.parse(s.relatedLabsJson);
                    } catch (e) {
                        console.error('Lỗi khi parse JSON của solution:', s.id, e);
                    }
                    return {
                        ...s,
                        detail: parsedDetail,
                        relatedLabs: parsedLabs
                    };
                });
                setSolutions(parsedSolutions)
            } catch (err) {
                if (!isMounted) return;
                console.error('Failed to load solutions from API:', err)
                setSolutions([])
            } finally {
                if (isMounted) setSolutionsLoading(false)
            }
        }
        fetchSolutions()
        
        return () => {
            isMounted = false;
        }
    }, [])

    const steps = [
        { num: '01', cls: 's1', title: t('how_step1_title'), desc: t('how_step1_desc') },
        { num: '02', cls: 's2', title: t('how_step2_title'), desc: t('how_step2_desc') },
        { num: '03', cls: 's3', title: t('how_step3_title'), desc: t('how_step3_desc') },
        { num: '04', cls: 's4', title: t('how_step4_title'), desc: t('how_step4_desc') },
    ]

    const stats = [
        { num: t('stats_1_num'), label: t('stats_1_label') },
        { num: t('stats_2_num'), label: t('stats_2_label') },
        { num: t('stats_3_num'), label: t('stats_3_label') },
        { num: t('stats_4_num'), label: t('stats_4_label') },
    ]

    const testimonials = [
        { quote: t('testimonial_1'), name: t('testimonial_1_name'), title: t('testimonial_1_title'), initials: 'NA' },
        { quote: t('testimonial_2'), name: t('testimonial_2_name'), title: t('testimonial_2_title'), initials: 'MP' },
        { quote: t('testimonial_3'), name: t('testimonial_3_name'), title: t('testimonial_3_title'), initials: 'HD' },
    ]

    const techs = [
        'React', 'Spring Boot', 'Python', 'Docker', 'Kubernetes',
        'AWS', 'TensorFlow', 'PostgreSQL', 'Redis', 'GraphQL',
        'Solidity', 'Node.js', 'TypeScript', 'Go'
    ]

    return (
        <div ref={scrollRef}>
            {/* ===== HERO SECTION with Particle Animation ===== */}
            <section id="home" className="hero">
                {/* Interactive Particle Background */}
                <ParticleCanvas className="particles-canvas" />

                {/* Floating 3D Shapes */}
                <FloatingShapes />

                {/* Gradient Background */}
                <div className="hero-bg" style={{
                    transform: `translate(${mousePos.x * 15}px, ${mousePos.y * 15}px)`
                }}></div>

                {/* Mouse-reactive gradient glow */}
                <div className="hero-mouse-glow" style={{
                    background: `radial-gradient(600px circle at ${50 + mousePos.x * 20}% ${50 + mousePos.y * 20}%, rgba(102, 126, 234, 0.08), transparent 50%)`
                }}></div>

                <div className="hero-content">
                    <div className="hero-badge animate-slide-in">
                        <span className="badge-pulse"></span>
                        {t('hero_badge')}
                    </div>
                    <h1 className="hero-title-reveal">
                        <span className="title-line">
                            <TextReveal text={t('hero_title_1')} delay={300} />
                        </span>
                        <br />
                        <span className="title-line">
                            <span className="gradient-text gradient-text-animated">
                                <TextReveal text={t('hero_title_2')} delay={800} />
                            </span>
                        </span>
                    </h1>
                    <p className="hero-desc-reveal">{t('hero_desc')}</p>
                    <div className="hero-btns">
                        <Link to="/login" className="btn btn-primary btn-glow">
                            {t('hero_cta')} <ArrowRight size={18} />
                        </Link>
                        <Link to="/contact" className="btn btn-outline btn-hover-fill">
                            {t('hero_cta2')}
                        </Link>
                    </div>
                    <div className="hero-stats">
                        <div className="hero-stat">
                            <div className="hero-stat-number">
                                <AnimatedCounter target={t('hero_stat1_num')} />
                            </div>
                            <div className="hero-stat-label">{t('hero_stat1_label')}</div>
                        </div>
                        <div className="hero-stat">
                            <div className="hero-stat-number">
                                <AnimatedCounter target={t('hero_stat2_num')} />
                            </div>
                            <div className="hero-stat-label">{t('hero_stat2_label')}</div>
                        </div>
                        <div className="hero-stat">
                            <div className="hero-stat-number">
                                <AnimatedCounter target={t('hero_stat3_num')} />
                            </div>
                            <div className="hero-stat-label">{t('hero_stat3_label')}</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== SOLUTIONS SECTION ===== */}
            <section id="solutions" className="section section-gradient">
                <div className="container">
                    <div className="section-header animate-on-scroll">
                        <h2><span className="gradient-text">{t('solutions_title')}</span></h2>
                        <p>{t('solutions_desc')}</p>
                    </div>
                    <div className="grid-3 stagger-children">
                        {solutionsLoading ? (
                            [...Array(3)].map((_, i) => (
                                <div className="solution-card" key={i} style={{ opacity: 0.4, animation: 'pulse 1.5s infinite' }}>
                                    <div className="solution-card-icon blue"><Zap size={28} /></div>
                                    <h3 style={{ background: 'var(--border-light)', height: 20, borderRadius: 6, width: '60%' }}></h3>
                                    <p style={{ background: 'var(--border-light)', height: 40, borderRadius: 6 }}></p>
                                </div>
                            ))
                        ) : solutions.length > 0 ? (
                            solutions
                                .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0))
                                .filter(s => s.active !== false)
                                .map((s, i) => {
                                    const title = lang === 'vi' ? (s.titleVi || s.title) : (s.titleEn || s.title)
                                    const desc = lang === 'vi' ? (s.descriptionVi || s.description) : (s.descriptionEn || s.description)
                                    return (
                                        <div className="solution-card" key={s.id || i} onClick={() => setSelectedSolution(s)}>
                                            <div className={`solution-card-icon ${s.color}`}>
                                                {IconMap[s.icon] ? React.createElement(IconMap[s.icon], { size: 28 }) : <Zap size={28} />}
                                            </div>
                                            <h3>{title}</h3>
                                            <p>{desc}</p>
                                            <span className="card-link">
                                                {t('learn_more') || 'Xem thêm'} <ArrowRight size={16} />
                                            </span>
                                        </div>
                                    )
                                })
                        ) : (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-secondary)', padding: '2rem' }}>
                                {lang === 'vi' ? 'Chưa có giải pháp nào. Hãy thêm từ Admin Panel.' : 'No solutions yet. Add from Admin Panel.'}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Solution Modal Detail */}
            {selectedSolution && (
                <SolutionModal
                    solution={selectedSolution}
                    onClose={() => setSelectedSolution(null)}
                    navigate={navigate}
                    lang={lang}
                />
            )}

            {/* ===== HOW IT WORKS SECTION ===== */}
            <section id="how-it-works" className="section">
                <div className="container">
                    <div className="section-header animate-on-scroll">
                        <h2><span className="gradient-text">{t('how_title')}</span></h2>
                        <p>{t('how_desc')}</p>
                    </div>
                    <div className="steps-grid stagger-children">
                        {steps.map((step, i) => (
                            <div className="step-item" key={i}>
                                <div className={`step-number ${step.cls}`}>{step.num}</div>
                                <h3>{step.title}</h3>
                                <p>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== STATS SECTION (Dark) ===== */}
            <section id="stats" className="section section-dark">
                <div className="container">
                    <div className="section-header animate-on-scroll">
                        <h2 style={{ color: 'white' }}>{t('stats_title')}</h2>
                        <p>{t('stats_desc')}</p>
                    </div>
                    <div className="stats-grid stagger-children">
                        {stats.map((s, i) => (
                            <div className="stat-card" key={i}>
                                <div className="stat-number">
                                    <AnimatedCounter target={s.num} />
                                </div>
                                <div className="stat-label">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== TESTIMONIALS SECTION ===== */}
            <section id="testimonials" className="section">
                <div className="container">
                    <div className="section-header animate-on-scroll">
                        <h2><span className="gradient-text">{t('testimonials_title')}</span></h2>
                        <p>{t('testimonials_desc')}</p>
                    </div>
                    <div className="testimonials-grid stagger-children">
                        {testimonials.map((tm, i) => (
                            <div className="testimonial-card" key={i}>
                                <div className="stars">
                                    {[...Array(5)].map((_, j) => (
                                        <span key={j}>★</span>
                                    ))}
                                </div>
                                <blockquote>{tm.quote}</blockquote>
                                <div className="testimonial-author">
                                    <div className="testimonial-avatar">{tm.initials}</div>
                                    <div className="testimonial-info">
                                        <h4>{tm.name}</h4>
                                        <span>{tm.title}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ===== TECH MARQUEE SECTION ===== */}
            <section id="tech" className="section section-gradient">
                <div className="container">
                    <div className="section-header animate-on-scroll">
                        <h2><span className="gradient-text">{t('tech_title')}</span></h2>
                        <p>{t('tech_desc')}</p>
                    </div>
                    {/* Infinite scroll marquee */}
                    <div className="marquee-wrapper">
                        <div className="marquee-track">
                            {[...techs, ...techs].map((tech, i) => (
                                <div className="tech-item" key={i}>{tech}</div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* ===== CTA SECTION ===== */}
            <section id="cta" className="cta-section">
                <div className="cta-particles" aria-hidden="true">
                    {[...Array(20)].map((_, i) => (
                        <div
                            key={i}
                            className="cta-particle"
                            style={{
                                left: `${Math.random() * 100}%`,
                                top: `${Math.random() * 100}%`,
                                width: `${Math.random() * 6 + 2}px`,
                                height: `${Math.random() * 6 + 2}px`,
                                animationDelay: `${Math.random() * 5}s`,
                                animationDuration: `${Math.random() * 10 + 8}s`,
                            }}
                        ></div>
                    ))}
                </div>
                <div className="container animate-on-scroll">
                    <h2>{t('cta_title')}</h2>
                    <p>{t('cta_desc')}</p>
                    <div className="cta-btns">
                        <Link to="/contact" className="btn btn-white btn-glow">
                            {t('cta_btn')} <ArrowRight size={18} />
                        </Link>
                        <Link to="/about" className="btn btn-outline" style={{ borderColor: 'rgba(255,255,255,0.3)', color: 'white' }}>
                            {t('cta_btn2')}
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    )
}
