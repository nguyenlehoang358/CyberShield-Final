import React, { useEffect, useState } from 'react'

// Gradient definitions matching dark-theme SaaS UI
const GRADIENTS = {
    success: ['#10b981', '#059669'],
    warning: ['#f59e0b', '#d97706'],
    danger: ['#ef4444', '#be123c'],
    primary: ['#6366f1', '#a855f7'],
    secondary: ['#0ea5e9', '#2563eb'],
}

function resolveGradient(color) {
    if (color?.includes('ef4444') || color?.includes('red') || color?.includes('danger')) return GRADIENTS.danger
    if (color?.includes('22c55e') || color?.includes('10b981') || color?.includes('green') || color?.includes('success')) return GRADIENTS.success
    if (color?.includes('f59e0b') || color?.includes('yellow') || color?.includes('warning') || color?.includes('amber')) return GRADIENTS.warning
    if (color?.includes('6366f1') || color?.includes('purple') || color?.includes('primary') || color?.includes('indigo')) return GRADIENTS.primary
    if (color?.includes('3b82f6') || color?.includes('0ea5e9') || color?.includes('blue') || color?.includes('cyan')) return GRADIENTS.secondary
    return GRADIENTS.primary
}

export default function SimpleBarChart({ data = [], title, color = '#6366f1' }) {
    const [animated, setAnimated] = useState(false)
    const safeData = data.map(d => ({ ...d, value: Number(d.value) || 0 }))
    const maxValue = Math.max(...safeData.map(d => d.value), 1)

    useEffect(() => {
        const timeout = setTimeout(() => setAnimated(true), 50)
        return () => clearTimeout(timeout)
    }, [])

    const gradientId = (i) => `bar-grad-${title?.replace(/\s/g, '') || ''}-${i}`

    return (
        <div className="admin-chart-card" style={{ overflow: 'hidden' }}>
            <h3>{title}</h3>

            {/* SVG Gradient Definitions */}
            <svg width="0" height="0" style={{ position: 'absolute' }}>
                <defs>
                    {safeData.map((item, i) => {
                        const [c1, c2] = resolveGradient(item.color)
                        return (
                            <linearGradient key={i} id={gradientId(i)} x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor={c1} stopOpacity={0.95} />
                                <stop offset="100%" stopColor={c2} stopOpacity={0.85} />
                            </linearGradient>
                        )
                    })}
                </defs>
            </svg>

            <div className="chart-container">
                {safeData.map((item, index) => {
                    const pct = (item.value / maxValue) * 100
                    const barHeight = item.value > 0 ? Math.max(pct, 6) : 2
                    const [c1] = resolveGradient(item.color)

                    return (
                        <div key={index} className="chart-bar-group">
                            <div className="chart-bar-wrapper" style={{
                                background: 'rgba(255,255,255,0.03)',
                                borderRadius: '8px',
                                width: '44px'
                            }}>
                                <div
                                    className="chart-bar"
                                    style={{
                                        height: animated ? `${barHeight}%` : '0%',
                                        background: `url(#${gradientId(index)})`,
                                        // Fallback: CSS gradient since SVG fill doesn't work on divs
                                        backgroundImage: `linear-gradient(to top, ${resolveGradient(item.color)[1]}, ${resolveGradient(item.color)[0]})`,
                                        borderRadius: '8px 8px 0 0',
                                        minHeight: item.value > 0 ? '8px' : '3px',
                                        transition: 'height 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                                        boxShadow: item.value > 0 ? `0 -4px 16px ${c1}33` : 'none',
                                        position: 'relative'
                                    }}
                                >
                                    <span className="chart-tooltip">{item.value}</span>
                                </div>
                            </div>
                            <span style={{
                                fontSize: '0.95rem',
                                fontWeight: 800,
                                color: c1,
                                marginTop: '0.3rem',
                                textShadow: `0 0 12px ${c1}44`
                            }}>
                                {item.value}
                            </span>
                            <span className="chart-label" style={{ fontSize: '0.78rem' }}>{item.label}</span>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
