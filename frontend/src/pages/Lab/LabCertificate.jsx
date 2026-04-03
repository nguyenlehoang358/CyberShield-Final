import React, { useRef, useCallback } from 'react'
import { useLanguage } from '../../context/LanguageContext'
import { useLabProgress } from '../../context/LabProgressContext'
import { Download, Award, X } from 'lucide-react'
import '../../styles/lab.css'

const LAB_NAMES = {
    encryption: 'Encryption & Decryption',
    hashing: 'Hashing Functions',
    firewall: 'Firewall Simulator',
    xss: 'XSS Attack',
    sqli: 'SQL Injection',
    password: 'Password Security',
    https: 'HTTPS & TLS',
    jwt: 'JWT Token',
}

export default function LabCertificate({ onClose }) {
    const { t } = useLanguage()
    const { progress, completedCount, totalLabs } = useLabProgress()
    const certRef = useRef(null)

    // Get the date of the last completion
    const timestamps = Object.values(progress.timestamps || {})
    const lastDate = timestamps.length > 0
        ? new Date(Math.max(...timestamps.map(ts => new Date(ts).getTime())))
        : new Date()
    const dateStr = lastDate.toLocaleDateString('vi-VN', {
        year: 'numeric', month: 'long', day: 'numeric'
    })

    const handleDownload = useCallback(() => {
        if (!certRef.current) return

        // Use html2canvas-like approach — create a downloadable SVG
        const svgContent = `
<svg xmlns="http://www.w3.org/2000/svg" width="900" height="640" viewBox="0 0 900 640">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0e17"/>
      <stop offset="100%" stop-color="#131a2b"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#3fb950"/>
      <stop offset="100%" stop-color="#39d0d8"/>
    </linearGradient>
    <linearGradient id="gold" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#d29922"/>
      <stop offset="100%" stop-color="#f0c040"/>
    </linearGradient>
  </defs>
  
  <!-- Background -->
  <rect width="900" height="640" fill="url(#bg)" rx="20"/>
  
  <!-- Border -->
  <rect x="12" y="12" width="876" height="616" fill="none" stroke="url(#accent)" stroke-width="2" rx="14" opacity="0.5"/>
  <rect x="20" y="20" width="860" height="600" fill="none" stroke="url(#gold)" stroke-width="1" rx="10" opacity="0.3"/>
  
  <!-- Corner decorations -->
  <circle cx="50" cy="50" r="6" fill="#d29922" opacity="0.6"/>
  <circle cx="850" cy="50" r="6" fill="#d29922" opacity="0.6"/>
  <circle cx="50" cy="590" r="6" fill="#d29922" opacity="0.6"/>
  <circle cx="850" cy="590" r="6" fill="#d29922" opacity="0.6"/>
  
  <!-- Trophy icon -->
  <text x="450" y="110" text-anchor="middle" font-size="54">🏆</text>
  
  <!-- Title -->
  <text x="450" y="165" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#d29922" letter-spacing="6" font-weight="bold">CERTIFICATE OF COMPLETION</text>
  
  <!-- Divider -->
  <line x1="250" y1="185" x2="650" y2="185" stroke="url(#accent)" stroke-width="1" opacity="0.5"/>
  
  <!-- Main text -->
  <text x="450" y="230" text-anchor="middle" font-family="Arial, sans-serif" font-size="14" fill="#8b949e">This certifies that the participant has successfully completed</text>
  
  <!-- Course name -->
  <text x="450" y="275" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#f0f6fc" font-weight="bold">MyWeb Cybersecurity Lab</text>
  <text x="450" y="310" text-anchor="middle" font-family="Arial, sans-serif" font-size="16" fill="#58a6ff">${completedCount} / ${totalLabs} Modules Completed</text>
  
  <!-- Lab list -->
  ${Object.entries(LAB_NAMES).map(([id, name], i) => {
            const completed = progress.completed?.[id]
            const col = i < 4 ? 250 : 650
            const row = 360 + (i % 4) * 30
            const color = completed ? '#3fb950' : '#6e7a8a'
            const check = completed ? '✓' : '○'
            return `<text x="${col}" y="${row}" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="${color}">${check} ${name}</text>`
        }).join('\n  ')}
  
  <!-- Date -->
  <line x1="250" y1="500" x2="650" y2="500" stroke="url(#accent)" stroke-width="1" opacity="0.3"/>
  <text x="450" y="535" text-anchor="middle" font-family="Arial, sans-serif" font-size="13" fill="#8b949e">${dateStr}</text>
  
  <!-- Platform -->
  <text x="450" y="580" text-anchor="middle" font-family="Arial, sans-serif" font-size="12" fill="#6e7a8a">MyWeb Cybersecurity Platform — myweb.com</text>
</svg>`

        const blob = new Blob([svgContent], { type: 'image/svg+xml' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'cybersecurity-lab-certificate.svg'
        a.click()
        URL.revokeObjectURL(url)
    }, [completedCount, totalLabs, progress, dateStr])

    return (
        <div className="lab-cert-overlay" onClick={onClose}>
            <div className="lab-cert-modal" onClick={e => e.stopPropagation()}>
                <button className="lab-cert-close" onClick={onClose}>
                    <X size={18} />
                </button>

                {/* Certificate preview */}
                <div className="lab-cert-preview" ref={certRef}>
                    <div className="lab-cert-border">
                        <div className="lab-cert-trophy">🏆</div>

                        <div className="lab-cert-label">{t('cert_title')}</div>
                        <div className="lab-cert-divider" />

                        <div className="lab-cert-subtitle">{t('cert_subtitle')}</div>

                        <h2 className="lab-cert-course">MyWeb Cybersecurity Lab</h2>
                        <div className="lab-cert-count">
                            {completedCount} / {totalLabs} Modules
                        </div>

                        <div className="lab-cert-modules">
                            {Object.entries(LAB_NAMES).map(([id, name]) => {
                                const done = progress.completed?.[id]
                                return (
                                    <div key={id} className={`lab-cert-module ${done ? 'done' : ''}`}>
                                        <span>{done ? '✓' : '○'}</span> {name}
                                    </div>
                                )
                            })}
                        </div>

                        <div className="lab-cert-divider" />
                        <div className="lab-cert-date">{dateStr}</div>
                        <div className="lab-cert-platform">MyWeb Cybersecurity Platform</div>
                    </div>
                </div>

                {/* Action buttons */}
                <div className="lab-cert-actions">
                    <button className="lab-cert-download-btn" onClick={handleDownload}>
                        <Download size={16} />
                        {t('cert_download')}
                    </button>
                </div>
            </div>
        </div>
    )
}
