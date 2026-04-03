import React, { useEffect, useState } from 'react'

const GRADIENTS = {
    // Power BI Data-driven vibrant colors
    success: ['#00FF9D', '#03E08A'], // Bright Neon Green
    warning: ['#FFC300', '#FFA200'], // Vibrant Yellow-Orange
    danger: ['#FF0055', '#D80044'],  // Magenta Pink/Red
    primary: ['#00C4FF', '#0095FF'], // Cyan Blue
    secondary: ['#B800FF', '#8600FF'], // Deep Purple
}

function resolveGradient(color) {
    if (color?.includes('ef4444') || color?.includes('red') || color?.includes('danger')) return GRADIENTS.danger
    if (color?.includes('22c55e') || color?.includes('10b981') || color?.includes('green') || color?.includes('success')) return GRADIENTS.success
    if (color?.includes('f59e0b') || color?.includes('yellow') || color?.includes('warning') || color?.includes('amber')) return GRADIENTS.warning
    if (color?.includes('6366f1') || color?.includes('purple') || color?.includes('primary') || color?.includes('indigo')) return GRADIENTS.secondary
    if (color?.includes('3b82f6') || color?.includes('0ea5e9') || color?.includes('blue') || color?.includes('cyan')) return GRADIENTS.primary
    return GRADIENTS.primary
}

export default function SimplePieChart({ data = [], title, titleColor }) {
    const [animated, setAnimated] = useState(false)
    const safeData = data.map(d => ({ ...d, value: Number(d.value) || 0 }))
    const total = safeData.reduce((sum, d) => sum + d.value, 0) || 1

    useEffect(() => {
        const timeout = setTimeout(() => setAnimated(true), 80)
        return () => clearTimeout(timeout)
    }, [])

    // Build conic gradient with proper gradient-based colors
    let accumulated = 0
    const segments = safeData.map((item) => {
        const start = accumulated
        const pct = (item.value / total) * 100
        accumulated += pct
        const [c1, c2] = resolveGradient(item.color)
        return { ...item, start, end: accumulated, c1, c2 }
    })

    // Create true conic segments with stops to prevent blending between unrelated segments
    const conicParts = segments.map(s => `${s.c1} ${s.start}%, ${s.c2} ${s.end}%`)
    const conicGradient = conicParts.join(', ')

    return (
        <div className="admin-chart-card">
            <h3 style={titleColor ? { color: titleColor } : {}}>{title}</h3>
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '2rem',
                padding: '0.75rem 0'
            }}>
                {/* Donut chart */}
                <div style={{
                    width: 160,
                    height: 160,
                    borderRadius: '50%',
                    background: animated
                        ? `conic-gradient(${conicGradient})`
                        : 'rgba(255,255,255,0.05)',
                    boxShadow: `
                        0 0 30px ${segments[0]?.c1 || '#6366f1'}22,
                        0 0 60px ${segments[0]?.c1 || '#6366f1'}11,
                        inset 0 0 20px rgba(0,0,0,0.2)
                    `,
                    flexShrink: 0,
                    position: 'relative',
                    transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    transform: animated ? 'scale(1) rotate(0deg)' : 'scale(0.5) rotate(-90deg)',
                    opacity: animated ? 1 : 0,
                }}>
                    {/* Inner circle (donut hole) */}
                    <div style={{
                        position: 'absolute',
                        top: '22%', left: '22%',
                        width: '56%', height: '56%',
                        borderRadius: '50%',
                        background: 'var(--bg-card, #131a2b)',
                        boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.3)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}>
                        <span style={{
                            fontSize: '1.8rem',
                            fontWeight: 900,
                            color: 'var(--text-primary, #ffffff)',
                            lineHeight: 1,
                            letterSpacing: '-0.5px'
                        }}>
                            {safeData.reduce((s, d) => s + d.value, 0)}
                        </span>
                        <span style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-secondary, #6e7a8a)',
                            fontWeight: 600,
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px',
                            marginTop: '2px'
                        }}>
                            total
                        </span>
                    </div>
                </div>

                {/* Legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {segments.map((item, i) => {
                        const pct = Math.round((item.value / total) * 100)
                        return (
                            <div key={i} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.6rem',
                                fontSize: '0.88rem',
                                opacity: animated ? 1 : 0,
                                transform: animated ? 'translateX(0)' : 'translateX(12px)',
                                transition: `all 0.5s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.1 + 0.3}s`
                            }}>
                                <div style={{
                                    width: 14, height: 14,
                                    borderRadius: 4,
                                    background: `linear-gradient(135deg, ${item.c1}, ${item.c2})`,
                                    boxShadow: `0 0 8px ${item.c1}44`,
                                    flexShrink: 0
                                }} />
                                <span style={{
                                    color: 'var(--text-secondary, #6e7a8a)',
                                    fontWeight: 500
                                }}>
                                    {item.label}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.3rem', marginLeft: 'auto' }}>
                                    <span style={{
                                        fontWeight: 800,
                                        color: item.c1,
                                        fontSize: '0.95rem',
                                        textShadow: `0 0 10px ${item.c1}33`
                                    }}>
                                        {item.value}
                                    </span>
                                    <span style={{
                                        fontSize: '0.7rem',
                                        color: 'var(--text-secondary, #6e7a8a)',
                                        fontWeight: 600
                                    }}>
                                        ({pct}%)
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
