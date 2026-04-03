import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const LabProgressContext = createContext(null)

/* ─────────────────────────────────────────
   Achievement definitions
   ───────────────────────────────────────── */
const ACHIEVEMENTS = [
    {
        id: 'first_lab',
        icon: '🚀',
        condition: (stats) => stats.completedCount >= 1,
    },
    {
        id: 'three_labs',
        icon: '⭐',
        condition: (stats) => stats.completedCount >= 3,
    },
    {
        id: 'five_labs',
        icon: '🔥',
        condition: (stats) => stats.completedCount >= 5,
    },
    {
        id: 'all_labs',
        icon: '🏆',
        condition: (stats) => stats.completedCount >= 8,
    },
    {
        id: 'crypto_master',
        icon: '🔐',
        condition: (stats) => stats.completed.encryption && stats.completed.hashing,
    },
    {
        id: 'attack_expert',
        icon: '⚔️',
        condition: (stats) => stats.completed.xss && stats.completed.sqli,
    },
    {
        id: 'network_guru',
        icon: '🌐',
        condition: (stats) => stats.completed.firewall && stats.completed.https,
    },
    {
        id: 'auth_specialist',
        icon: '🎫',
        condition: (stats) => stats.completed.jwt && stats.completed.password,
    },
]

const ALL_LAB_IDS = ['encryption', 'hashing', 'firewall', 'xss', 'sqli', 'password', 'https', 'jwt']

const STORAGE_KEY = 'lab_progress'

function loadProgress() {
    try {
        const saved = localStorage.getItem(STORAGE_KEY)
        if (saved) return JSON.parse(saved)
    } catch (e) { /* ignore */ }
    return {
        completed: {},      // { labId: true }
        timestamps: {},     // { labId: ISO date string }
        stepProgress: {},   // { labId: { current: n, total: m } }
        totalTimeSpent: 0,  // seconds (approximate)
    }
}

function saveProgress(progress) {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
    } catch (e) { /* ignore */ }
}

export function LabProgressProvider({ children }) {
    const [progress, setProgress] = useState(loadProgress)
    const [newAchievement, setNewAchievement] = useState(null) // for toast notification

    // Persist on change
    useEffect(() => {
        saveProgress(progress)
    }, [progress])

    // Mark a lab as completed
    const completeLab = useCallback((labId) => {
        setProgress(prev => {
            if (prev.completed[labId]) return prev // already done

            const next = {
                ...prev,
                completed: { ...prev.completed, [labId]: true },
                timestamps: { ...prev.timestamps, [labId]: new Date().toISOString() },
            }

            // Check for new achievements
            const completedCount = Object.keys(next.completed).length
            const stats = { completedCount, completed: next.completed }
            const prevCompletedCount = Object.keys(prev.completed).length
            const prevStats = { completedCount: prevCompletedCount, completed: prev.completed }

            for (const ach of ACHIEVEMENTS) {
                if (ach.condition(stats) && !ach.condition(prevStats)) {
                    // New achievement unlocked!
                    setTimeout(() => setNewAchievement(ach), 300)
                    break
                }
            }

            return next
        })
    }, [])

    // Update step progress for a lab (e.g. step 3 of 5)
    const updateStepProgress = useCallback((labId, current, total) => {
        setProgress(prev => ({
            ...prev,
            stepProgress: {
                ...prev.stepProgress,
                [labId]: { current: Math.min(current, total), total }
            }
        }))
    }, [])

    // Reset a single lab
    const resetLab = useCallback((labId) => {
        setProgress(prev => {
            const newCompleted = { ...prev.completed }
            const newTimestamps = { ...prev.timestamps }
            const newSteps = { ...prev.stepProgress }
            delete newCompleted[labId]
            delete newTimestamps[labId]
            delete newSteps[labId]
            return {
                ...prev,
                completed: newCompleted,
                timestamps: newTimestamps,
                stepProgress: newSteps,
            }
        })
    }, [])

    // Reset all
    const resetAll = useCallback(() => {
        setProgress({
            completed: {},
            timestamps: {},
            stepProgress: {},
            totalTimeSpent: 0,
        })
    }, [])

    // Dismiss achievement toast
    const dismissAchievement = useCallback(() => {
        setNewAchievement(null)
    }, [])

    // Computed stats
    const completedCount = Object.keys(progress.completed).length
    const totalLabs = ALL_LAB_IDS.length
    const progressPercent = Math.round((completedCount / totalLabs) * 100)
    const unlockedAchievements = ACHIEVEMENTS.filter(ach => {
        const stats = { completedCount, completed: progress.completed }
        return ach.condition(stats)
    })

    const value = {
        progress,
        completedCount,
        totalLabs,
        progressPercent,
        achievements: ACHIEVEMENTS,
        unlockedAchievements,
        newAchievement,
        isLabCompleted: (labId) => !!progress.completed[labId],
        getLabStepProgress: (labId) => progress.stepProgress[labId] || null,
        getLabTimestamp: (labId) => progress.timestamps[labId] || null,
        completeLab,
        updateStepProgress,
        resetLab,
        resetAll,
        dismissAchievement,
    }

    return (
        <LabProgressContext.Provider value={value}>
            {children}
        </LabProgressContext.Provider>
    )
}

export function useLabProgress() {
    const ctx = useContext(LabProgressContext)
    if (!ctx) throw new Error('useLabProgress must be used within LabProgressProvider')
    return ctx
}

export { ACHIEVEMENTS, ALL_LAB_IDS }
