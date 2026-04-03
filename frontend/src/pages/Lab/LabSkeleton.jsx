import React from 'react'
import '../../styles/lab.css'

/**
 * Beautiful skeleton loading screen for lazy-loaded lab modules.
 * Shown while lab code is being downloaded.
 */
export default function LabSkeleton() {
    return (
        <div className="lab-skeleton">
            <div className="lab-skeleton-header">
                <div className="lab-skeleton-bar skeleton-glow" style={{ width: '60%', height: 28 }} />
                <div className="lab-skeleton-bar skeleton-glow" style={{ width: '40%', height: 16, marginTop: 12 }} />
            </div>

            <div className="lab-skeleton-tabs">
                {[1, 2, 3].map(i => (
                    <div key={i} className="lab-skeleton-tab skeleton-glow" />
                ))}
            </div>

            <div className="lab-skeleton-body">
                <div className="lab-skeleton-input skeleton-glow" />
                <div className="lab-skeleton-input skeleton-glow" style={{ width: '70%' }} />

                <div className="lab-skeleton-result">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="lab-skeleton-line skeleton-glow" style={{ width: `${90 - i * 10}%` }} />
                    ))}
                </div>

                <div className="lab-skeleton-visual">
                    <div className="lab-skeleton-box skeleton-glow" />
                    <div className="lab-skeleton-box skeleton-glow" />
                </div>
            </div>
        </div>
    )
}
