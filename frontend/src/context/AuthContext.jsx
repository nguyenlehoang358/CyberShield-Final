import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

// Lấy Host để xác định môi trường
const currentHost = window.location.hostname

// Logic xác định API URL an toàn
let apiBaseURL = ""
try {
    // 1. Ưu tiên biến môi trường (Vercel Production)
    apiBaseURL = import.meta.env.VITE_API_BASE_URL || ""
} catch (e) {
    console.error("Lỗi nạp biến môi trường:", e)
}

if (!apiBaseURL) {
    // 2. Logic cho Localhost / LAN / Ngrok
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        apiBaseURL = '/api'
    } else if (currentHost.includes('ngrok-free.app')) {
        apiBaseURL = import.meta.env.VITE_NGROK_BACKEND_URL || ""
    } else {
        apiBaseURL = `https://${currentHost}:8443/api`
    }
}

// In ra console để debug (Xem trong F12)
console.log("🚀 CyberShield API Connection:", apiBaseURL)

// Cấu hình Axios Instance
const api = axios.create({
    baseURL: apiBaseURL,
    withCredentials: true,
    headers: {
        'ngrok-skip-browser-warning': 'true',
        'bypass-tunnel-reminder': 'true'
    }
})

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // Tự động gán Token vào header mỗi khi gọi API
    api.interceptors.request.use((config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    })

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const res = await api.get('/auth/me')
                setUser(res.data)
            } catch (err) {
                setUser(null)
            } finally {
                setLoading(false)
            }
        }
        checkAuth()
    }, [])

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password })
        if (res.data.mfaRequired) {
            return { mfaRequired: true, tempToken: res.data.token }
        }
        setUser({
            username: res.data.username,
            email: res.data.email,
            roles: res.data.roles,
            mfaEnabled: res.data.mfaEnabled
        })
        return { success: true, roles: res.data.roles }
    }

    const verifyMfa = async (tempToken, code) => {
        const res = await api.post('/auth/mfa/verify', { code }, {
            headers: { Authorization: `Bearer ${tempToken}` }
        })
        setUser({
            username: res.data.username,
            email: res.data.email,
            roles: res.data.roles,
            mfaEnabled: res.data.mfaEnabled
        })
        return { success: true }
    }

    const register = async (username, email, password) => {
        const res = await api.post('/auth/register', { username, email, password })
        setUser({
            username: res.data.username,
            email: res.data.email,
            roles: res.data.roles
        })
    }

    const logout = async () => {
        try {
            await api.post('/auth/logout')
        } catch (e) {
            console.error("Logout fail:", e)
        }
        localStorage.removeItem('token')
        setUser(null)
        window.location.assign('/')
    }

    const forgotPassword = async (email) => {
        const res = await api.post('/auth/forgot-password', { email })
        return res.data
    }

    const resetPassword = async (email, newPassword, verificationCode) => {
        const res = await api.post('/auth/reset-password', { email, newPassword, verificationCode })
        return res.data
    }

    return (
        <AuthContext.Provider value={{ user, setUser, login, verifyMfa, register, logout, loading, setLoading, api, forgotPassword, resetPassword }}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)
