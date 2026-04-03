import React, { useState, useRef, useCallback, useEffect } from 'react'

// ═══════════════════════════════════════════════
// ER DIAGRAM DATA — Automatically derived from
// src/main/java/com/myweb/entity/*.java
// ═══════════════════════════════════════════════

const TABLES = [
    {
        id: 'users', name: 'users', color: '#00C4FF', // Cyan Blue
        fields: [
            { name: 'id', type: 'BIGINT', pk: true },
            { name: 'username', type: 'VARCHAR', unique: true },
            { name: 'email', type: 'VARCHAR', unique: true },
            { name: 'password', type: 'VARCHAR' },
            { name: 'oauth_provider', type: 'VARCHAR' },
            { name: 'oauth_id', type: 'VARCHAR' },
            { name: 'avatar_url', type: 'VARCHAR(1000)' },
            { name: 'mfa_enabled', type: 'BOOLEAN' },
            { name: 'mfa_secret', type: 'VARCHAR (ENC)' },
            { name: 'phone_number', type: 'VARCHAR (ENC)' },
            { name: 'account_non_locked', type: 'BOOLEAN' },
            { name: 'enabled', type: 'BOOLEAN' },
            { name: 'failed_login_attempts', type: 'INT' },
            { name: 'lock_time', type: 'TIMESTAMP' },
            { name: 'created_at', type: 'TIMESTAMP' },
            { name: 'updated_at', type: 'TIMESTAMP' },
        ]
    },
    {
        id: 'roles', name: 'roles', color: '#B800FF', // Purple
        fields: [
            { name: 'id', type: 'INT', pk: true },
            { name: 'name', type: 'ENUM(ERole)' },
            { name: 'description', type: 'VARCHAR' },
        ]
    },
    {
        id: 'user_roles', name: 'user_roles', color: '#8600FF', // Deep Purple
        fields: [
            { name: 'user_id', type: 'BIGINT', fk: 'users' },
            { name: 'role_id', type: 'INT', fk: 'roles' },
        ]
    },
    {
        id: 'audit_logs', name: 'audit_logs', color: '#FFC300', // Yellow/Warning
        fields: [
            { name: 'id', type: 'BIGINT', pk: true },
            { name: 'action', type: 'VARCHAR' },
            { name: 'username', type: 'VARCHAR' },
            { name: 'ip_address', type: 'VARCHAR' },
            { name: 'details', type: 'TEXT' },
            { name: 'timestamp', type: 'TIMESTAMP' },
            { name: 'severity', type: 'ENUM' },
        ]
    },
    {
        id: 'login_attempts', name: 'login_attempts', color: '#FF0055', // Magenta/Danger
        fields: [
            { name: 'id', type: 'BIGINT', pk: true },
            { name: 'ip_address', type: 'VARCHAR(45)' },
            { name: 'username', type: 'VARCHAR' },
            { name: 'success', type: 'BOOLEAN' },
            { name: 'failure_reason', type: 'VARCHAR(200)' },
            { name: 'user_agent', type: 'TEXT' },
            { name: 'geo_country', type: 'VARCHAR(100)' },
            { name: 'geo_city', type: 'VARCHAR(100)' },
            { name: 'created_at', type: 'TIMESTAMP' },
        ]
    },
    {
        id: 'security_events', name: 'security_events', color: '#D80044', // Dark Red/Danger
        fields: [
            { name: 'id', type: 'BIGINT', pk: true },
            { name: 'source', type: 'ENUM(Source)' },
            { name: 'severity', type: 'ENUM(Severity)' },
            { name: 'event_type', type: 'VARCHAR(100)' },
            { name: 'source_ip', type: 'VARCHAR(45)' },
            { name: 'description', type: 'TEXT' },
            { name: 'raw_data', type: 'JSONB' },
            { name: 'ai_analysis', type: 'JSONB' },
            { name: 'resolved', type: 'BOOLEAN' },
            { name: 'created_at', type: 'TIMESTAMP' },
        ]
    },
    {
        id: 'blocked_ip_history', name: 'blocked_ip_history', color: '#FF0055',
        fields: [
            { name: 'id', type: 'BIGINT', pk: true },
            { name: 'ip_address', type: 'VARCHAR(45)' },
            { name: 'reason', type: 'VARCHAR(200)' },
            { name: 'created_at', type: 'TIMESTAMP' },
        ]
    },
    {
        id: 'blogs', name: 'blogs', color: '#00FF9D', // Bright Green/Safe
        fields: [
            { name: 'id', type: 'BIGINT', pk: true },
            { name: 'title', type: 'VARCHAR' },
            { name: 'summary', type: 'TEXT' },
            { name: 'url', type: 'VARCHAR' },
            { name: 'image_url', type: 'VARCHAR' },
            { name: 'published_at', type: 'TIMESTAMP' },
        ]
    },
    {
        id: 'contacts', name: 'contacts', color: '#03E08A', // Teal
        fields: [
            { name: 'id', type: 'BIGINT', pk: true },
            { name: 'name', type: 'VARCHAR' },
            { name: 'email', type: 'VARCHAR' },
            { name: 'message', type: 'TEXT' },
            { name: 'created_at', type: 'TIMESTAMP' },
        ]
    },
    {
        id: 'solutions', name: 'solutions', color: '#0095FF', // Blue
        fields: [
            { name: 'id', type: 'BIGINT', pk: true },
            { name: 'title_vi', type: 'VARCHAR' },
            { name: 'title_en', type: 'VARCHAR' },
            { name: 'description_vi', type: 'TEXT' },
            { name: 'description_en', type: 'TEXT' },
            { name: 'icon', type: 'VARCHAR' },
            { name: 'color', type: 'VARCHAR' },
            { name: 'display_order', type: 'INT' },
            { name: 'active', type: 'BOOLEAN' },
        ]
    },
]

// FK relationships: [source_table, source_field, target_table, target_field]
const RELATIONS = [
    ['user_roles', 'user_id', 'users', 'id'],
    ['user_roles', 'role_id', 'roles', 'id'],
]

// Initial node positions (2-column layout)
const INITIAL_POSITIONS = {
    users: { x: 60, y: 40 },
    roles: { x: 420, y: 40 },
    user_roles: { x: 240, y: 320 },
    audit_logs: { x: 680, y: 40 },
    login_attempts: { x: 60, y: 500 },
    security_events: { x: 420, y: 460 },
    blocked_ip_history: { x: 760, y: 460 },
    blogs: { x: 760, y: 260 },
    contacts: { x: 60, y: 780 },
    solutions: { x: 420, y: 740 },
}

const ROW_HEIGHT = 22
const NODE_WIDTH = 280
const HEADER_HEIGHT = 36

function getFieldY(table, fieldName, positions) {
    const pos = positions[table.id]
    if (!pos) return 0
    const idx = table.fields.findIndex(f => f.name === fieldName)
    return pos.y + HEADER_HEIGHT + (idx + 0.5) * ROW_HEIGHT
}

function getFieldX(tableId, side, positions) {
    const pos = positions[tableId]
    if (!pos) return 0
    return side === 'right' ? pos.x + NODE_WIDTH : pos.x
}

export default function ERDiagram({ lang = 'vi', isMini = false, onClick }) {
    const [positions, setPositions] = useState(INITIAL_POSITIONS)
    const [dragging, setDragging] = useState(null)
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
    // Mini view starts zoomed out
    const [zoom, setZoom] = useState(isMini ? 0.35 : 0.85)
    const containerRef = useRef(null)

    const handleMouseDown = useCallback((tableId, e) => {
        e.preventDefault()
        const pos = positions[tableId]
        const rect = containerRef.current.getBoundingClientRect()
        setDragging(tableId)
        setDragOffset({
            x: (e.clientX - rect.left) / zoom - pos.x,
            y: (e.clientY - rect.top) / zoom - pos.y
        })
    }, [positions, zoom])

    const handleMouseMove = useCallback((e) => {
        if (!dragging) return
        const rect = containerRef.current.getBoundingClientRect()
        setPositions(prev => ({
            ...prev,
            [dragging]: {
                x: (e.clientX - rect.left) / zoom - dragOffset.x,
                y: (e.clientY - rect.top) / zoom - dragOffset.y,
            }
        }))
    }, [dragging, dragOffset, zoom])

    const handleMouseUp = useCallback(() => {
        setDragging(null)
    }, [])

    useEffect(() => {
        if (dragging) {
            window.addEventListener('mousemove', handleMouseMove)
            window.addEventListener('mouseup', handleMouseUp)
            return () => {
                window.removeEventListener('mousemove', handleMouseMove)
                window.removeEventListener('mouseup', handleMouseUp)
            }
        }
    }, [dragging, handleMouseMove, handleMouseUp])

    return (
        <div style={{ marginTop: isMini ? '0' : '1.5rem', height: isMini ? '100%' : 'auto', display: 'flex', flexDirection: 'column' }}>
            {/* Controls */}
            {!isMini && (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '1rem', padding: '0 0.25rem'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem', fontWeight: 600 }}>
                            {lang === 'vi' ? `${TABLES.length} Entity • ${RELATIONS.length} Quan hệ` : `${TABLES.length} Entities • ${RELATIONS.length} Relations`}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))}
                            style={zoomBtnStyle}>＋</button>
                        <span style={{ color: '#94a3b8', fontSize: '0.8rem', lineHeight: '28px' }}>
                            {Math.round(zoom * 100)}%
                        </span>
                        <button onClick={() => setZoom(z => Math.max(z - 0.1, 0.4))}
                            style={zoomBtnStyle}>−</button>
                        <button onClick={() => { setPositions(INITIAL_POSITIONS); setZoom(0.85) }}
                            style={{ ...zoomBtnStyle, width: 'auto', padding: '0 10px', fontSize: '0.75rem' }}>
                            Reset
                        </button>
                    </div>
                </div>
            )}

            {/* Canvas */}
            <div
                ref={containerRef}
                onClick={isMini ? onClick : undefined}
                style={{
                    width: '100%',
                    height: isMini ? '100%' : '700px',
                    minHeight: isMini ? '300px' : 'auto',
                    flex: isMini ? 1 : 'none',
                    background: 'rgba(5, 8, 18, 0.9)',
                    border: '1px solid rgba(0, 196, 255, 0.15)',
                    borderRadius: '16px',
                    overflow: 'hidden',
                    position: 'relative',
                    cursor: isMini ? 'zoom-in' : dragging ? 'grabbing' : 'default',
                    // Grid pattern background
                    backgroundImage: `
                        radial-gradient(circle at 1px 1px, rgba(0,196,255,0.08) 1px, transparent 0)
                    `,
                    backgroundSize: `${24 * zoom}px ${24 * zoom}px`,
                    transition: isMini ? 'all 0.3s ease' : 'none',
                }}
                className={isMini ? "mini-erd-canvas" : ""}
            >
                {isMini && (
                    <div className="mini-erd-overlay" style={{
                        position: 'absolute',
                        inset: 0,
                        background: 'rgba(5, 8, 18, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000,
                        opacity: 0,
                        transition: 'opacity 0.3s',
                        backdropFilter: 'blur(2px)'
                    }}>
                        <div style={{
                            background: 'rgba(0,196,255,0.2)',
                            color: '#00C4FF',
                            padding: '10px 20px',
                            borderRadius: '30px',
                            fontWeight: 'bold',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            border: '1px solid rgba(0,196,255,0.4)',
                            pointerEvents: 'none'
                        }}>
                            <i className='bx bx-zoom-in' style={{ fontSize: '1.2rem' }}></i>
                            Click to Expand ERD
                        </div>
                    </div>
                )}
                <div style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left',
                    width: `${100 / zoom}%`,
                    height: `${100 / zoom}%`,
                    position: 'relative',
                }}>
                    {/* SVG layer for relationship lines */}
                    <svg style={{
                        position: 'absolute', top: 0, left: 0,
                        width: '100%', height: '100%',
                        pointerEvents: 'none', zIndex: 1
                    }}>
                        <defs>
                            <marker id="arrowhead" markerWidth="8" markerHeight="6"
                                refX="8" refY="3" orient="auto" fill="#6366f1">
                                <polygon points="0 0, 8 3, 0 6" />
                            </marker>
                        </defs>
                        {RELATIONS.map(([srcTable, srcField, tgtTable, tgtField], i) => {
                            const srcT = TABLES.find(t => t.id === srcTable)
                            const tgtT = TABLES.find(t => t.id === tgtTable)
                            if (!srcT || !tgtT) return null

                            const srcPos = positions[srcTable]
                            const tgtPos = positions[tgtTable]
                            if (!srcPos || !tgtPos) return null

                            const srcCenterX = srcPos.x + NODE_WIDTH / 2
                            const tgtCenterX = tgtPos.x + NODE_WIDTH / 2
                            const srcSide = srcCenterX < tgtCenterX ? 'right' : 'left'
                            const tgtSide = srcCenterX < tgtCenterX ? 'left' : 'right'

                            const x1 = getFieldX(srcTable, srcSide, positions)
                            const y1 = getFieldY(srcT, srcField, positions)
                            const x2 = getFieldX(tgtTable, tgtSide, positions)
                            const y2 = getFieldY(tgtT, tgtField, positions)

                            const cpOffset = Math.min(Math.abs(x2 - x1) * 0.4, 80)

                            return (
                                <g key={i}>
                                    <path
                                        d={`M ${x1} ${y1} C ${x1 + (srcSide === 'right' ? cpOffset : -cpOffset)} ${y1}, ${x2 + (tgtSide === 'right' ? cpOffset : -cpOffset)} ${y2}, ${x2} ${y2}`}
                                        fill="none"
                                        stroke="rgba(99,102,241,0.5)"
                                        strokeWidth={2}
                                        strokeDasharray="6 3"
                                        markerEnd="url(#arrowhead)"
                                    />
                                    {/* Relationship label */}
                                    <text
                                        x={(x1 + x2) / 2}
                                        y={(y1 + y2) / 2 - 8}
                                        fill="#818cf8"
                                        fontSize="10"
                                        textAnchor="middle"
                                        fontWeight="600"
                                    >
                                        FK
                                    </text>
                                </g>
                            )
                        })}
                    </svg>

                    {/* Table nodes */}
                    {TABLES.map(table => {
                        const pos = positions[table.id]
                        if (!pos) return null
                        const nodeHeight = HEADER_HEIGHT + table.fields.length * ROW_HEIGHT + 6
                        return (
                            <div
                                key={table.id}
                                onMouseDown={(e) => {
                                    if (!isMini) handleMouseDown(table.id, e)
                                }}
                                style={{
                                    position: 'absolute',
                                    left: pos.x,
                                    top: pos.y,
                                    width: NODE_WIDTH,
                                    height: nodeHeight,
                                    background: 'rgba(15, 18, 32, 0.95)',
                                    border: `1px solid ${table.color}66`,
                                    borderRadius: 10,
                                    overflow: 'hidden',
                                    cursor: isMini ? 'zoom-in' : dragging === table.id ? 'grabbing' : 'grab',
                                    zIndex: dragging === table.id ? 100 : 2,
                                    boxShadow: dragging === table.id
                                        ? `0 8px 32px ${table.color}66`
                                        : `0 2px 10px rgba(0,0,0,0.5)`,
                                    transition: dragging === table.id ? 'none' : 'box-shadow 0.2s',
                                    userSelect: 'none',
                                }}
                            >
                                {/* Header */}
                                <div style={{
                                    height: HEADER_HEIGHT,
                                    background: `linear-gradient(135deg, ${table.color}dd, ${table.color}88)`,
                                    display: 'flex',
                                    alignItems: 'center',
                                    padding: '0 12px',
                                    gap: 6,
                                }}>
                                    <span style={{ fontSize: '0.7rem' }}>🗂</span>
                                    <span style={{
                                        fontWeight: 800,
                                        fontSize: '0.78rem',
                                        color: '#fff',
                                        letterSpacing: '0.3px',
                                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                    }}>
                                        {table.name}
                                    </span>
                                    <span style={{
                                        marginLeft: 'auto',
                                        fontSize: '0.6rem',
                                        color: 'rgba(255,255,255,0.7)',
                                        background: 'rgba(0,0,0,0.25)',
                                        padding: '1px 6px',
                                        borderRadius: 4,
                                    }}>
                                        {table.fields.length}
                                    </span>
                                </div>
                                {/* Fields */}
                                {table.fields.map((field, fi) => (
                                    <div key={fi} style={{
                                        height: ROW_HEIGHT,
                                        display: 'flex',
                                        alignItems: 'center',
                                        padding: '0 10px',
                                        fontSize: '0.7rem',
                                        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                                        borderBottom: fi < table.fields.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                                        background: fi % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.015)',
                                    }}>
                                        {field.pk && (
                                            <span style={{
                                                color: '#fbbf24',
                                                fontSize: '0.6rem',
                                                fontWeight: 800,
                                                marginRight: 4,
                                                background: 'rgba(251,191,36,0.15)',
                                                padding: '0 3px',
                                                borderRadius: 2
                                            }}>PK</span>
                                        )}
                                        {field.fk && (
                                            <span style={{
                                                color: '#818cf8',
                                                fontSize: '0.6rem',
                                                fontWeight: 800,
                                                marginRight: 4,
                                                background: 'rgba(129,140,248,0.15)',
                                                padding: '0 3px',
                                                borderRadius: 2
                                            }}>FK</span>
                                        )}
                                        <span style={{
                                            color: field.pk ? '#fbbf24' : field.fk ? '#818cf8' : '#e2e8f0',
                                            fontWeight: field.pk || field.fk ? 700 : 500,
                                        }}>
                                            {field.name}
                                        </span>
                                        <span style={{
                                            marginLeft: 'auto',
                                            color: '#64748b',
                                            fontSize: '0.6rem',
                                        }}>
                                            {field.type}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

const zoomBtnStyle = {
    width: 28, height: 28,
    background: 'rgba(99,102,241,0.12)',
    border: '1px solid rgba(99,102,241,0.25)',
    borderRadius: 6,
    color: '#818cf8',
    fontSize: '0.9rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 700,
}
