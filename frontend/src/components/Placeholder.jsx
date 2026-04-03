import React from 'react'

export default function Placeholder({ title }) {
    return (
        <section className="section" style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div className="container" style={{ textAlign: 'center' }}>
                <h1 style={{
                    fontSize: 'clamp(2rem, 5vw, 3rem)',
                    fontWeight: 800,
                    marginBottom: '1rem',
                    background: 'linear-gradient(135deg, #667eea, #764ba2)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                }}>
                    {title}
                </h1>
                <p style={{
                    color: 'var(--text-secondary)',
                    fontSize: '1.1rem',
                    maxWidth: '500px',
                    margin: '0 auto'
                }}>
                    Trang này đang được phát triển. Hãy quay lại sau nhé! 🚀
                </p>
            </div>
        </section>
    )
}
