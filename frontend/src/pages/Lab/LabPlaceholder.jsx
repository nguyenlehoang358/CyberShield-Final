import React from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { Construction } from 'lucide-react'

export default function LabPlaceholder({ labId }) {
    const { t } = useLanguage()

    return (
        <div className="lab-animate-in" style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <Construction size={48} style={{ color: 'var(--lab-yellow)', marginBottom: '1rem' }} />
            <h2 style={{ color: 'var(--lab-heading)', fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                {t(`lab_${labId}_title`)}
            </h2>
            <p style={{ color: 'var(--lab-text-dim)', maxWidth: 400, margin: '0 auto 1.5rem' }}>
                {t('lab_coming_soon')}
            </p>
            <div style={{
                display: 'inline-block',
                padding: '0.5rem 1.2rem',
                background: 'var(--lab-yellow-dim)',
                color: 'var(--lab-yellow)',
                borderRadius: '100px',
                fontSize: '0.8rem',
                fontWeight: 700,
            }}>
                🚧 {t('lab_under_construction')}
            </div>
        </div>
    )
}
