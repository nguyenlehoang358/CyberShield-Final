
import React, { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext()

// Lấy IP động để hỗ trợ truy cập mạng LAN từ điện thoại
const currentHost = window.location.hostname
// Ưu tiên lấy từ biến môi trường (Cho Production trên Vercel/Render)
let apiBaseURL = import.meta.env.VITE_API_BASE_URL || ""

// Logic cho môi trường phát triển (Local / LAN / Ngrok)
if (!apiBaseURL) {
    if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
        apiBaseURL = '/api' // Dùng Vite Proxy
    } else if (currentHost.includes('ngrok-free.app') || currentHost.includes('ngrok-free.dev')) {
        apiBaseURL = import.meta.env.VITE_NGROK_BACKEND_URL || `https://api-${currentHost}/api`
    } else {
        // Mặc định cho LAN access (VD: http://192.168.x.x:5173 -> trỏ về cổng backend 8443)
        apiBaseURL = `https://${currentHost}:8443/api`
    }
}

// Axios instance
const api = axios.create({
    baseURL: apiBaseURL,
    withCredentials: true,
    headers: {
        'ngrok-skip-browser-warning': 'true', // Bỏ qua màng hình cảnh báo của ngrok
        'bypass-tunnel-reminder': 'true' // Bỏ qua cảnh báo Localtunnel
    }
})

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // Attach token to requests
    api.interceptors.request.use((config) => {
        const token = localStorage.getItem('token')
        if (token) {
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    })

    useEffect(() => {
        const checkAuth = async () => {
            // Check if we can get user (via cookie OR token)
            const token = localStorage.getItem('token')
            // If no token in localstorage, we still try to hit 'me' 
            // because OAuth sets cookie.

            try {
                const res = await api.get('/auth/me')
                setUser(res.data)
            } catch (err) {
                // If 401, not logged in
                setUser(null)
            }
            setLoading(false)
        }
        checkAuth()
    }, [])

    const login = async (email, password) => {
        const res = await api.post('/auth/login', { email, password })
        if (res.data.mfaRequired) {
            return { mfaRequired: true, tempToken: res.data.token };
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
        });
        // Response includes user details
        setUser({ username: res.data.username, email: res.data.email, roles: res.data.roles, mfaEnabled: res.data.mfaEnabled });
        return { success: true };
    }

    const register = async (username, email, password) => {
        const res = await api.post('/auth/register', { username, email, password })
        setUser({ username: res.data.username, email: res.data.email, roles: res.data.roles })
    }

    const logout = async () => {
        try {
            await api.post('/auth/logout')
        } catch (e) {
            console.error(e)
        }
        localStorage.removeItem('token') // Keep cleaning up any old state just in case
        setUser(null)
        window.location.href = '/login'
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
