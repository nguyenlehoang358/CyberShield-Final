import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { LanguageProvider } from './context/LanguageContext'
import { LabProgressProvider } from './context/LabProgressContext'
import { ThemeProvider } from './context/ThemeContext'
import { LabProvider } from './context/LabContext'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import ErrorBoundary from './components/ErrorBoundary'
import AIChatWidget from './components/AIChatWidget/AIChatWidget'
import SupportChatWidget from './components/SupportChatWidget/SupportChatWidget'
import ScrollToTop from './components/common/ScrollToTop'
import Home from './pages/Home'
import AuthPage from './pages/AuthPage'
import Dashboard from './pages/Dashboard'
import OAuth2RedirectHandler from './pages/OAuth2RedirectHandler'
import AdminDashboard from './pages/AdminDashboard'
import ModeratorDashboard from './pages/Moderator/ModeratorDashboard'
import About from './pages/About/About'
// Dòng import các trang bị thiếu chưa được tạo
// import Certificate from './pages/About/Certificate'
// import Customer from './pages/About/Customer'
// import Partner from './pages/About/Partner'
import Contact from './pages/Contact/Contact'
import Placeholder from './components/Placeholder'
import LabHub from './pages/Lab/LabHub'
import LabLayout from './pages/Lab/LabLayout'
import LabSkeleton from './pages/Lab/LabSkeleton'
import axios from 'axios';
/* ─────────────────────────────────────────
   Lazy-loaded Lab Modules (Code Splitting)
   Each lab is 40-53KB — loading on-demand
   cuts initial bundle by ~350KB
   ───────────────────────────────────────── */
const EncryptionLab = lazy(() => import('./pages/Lab/EncryptionLab'))
const HashingLab = lazy(() => import('./pages/Lab/HashingLab'))
const FirewallLab = lazy(() => import('./pages/Lab/FirewallLab'))
const XSSLab = lazy(() => import('./pages/Lab/XSSLab'))
const SQLiLab = lazy(() => import('./pages/Lab/SQLiLab'))
const PasswordLab = lazy(() => import('./pages/Lab/PasswordLab'))
const HttpsLab = lazy(() => import('./pages/Lab/HttpsLab'))
const JWTLab = lazy(() => import('./pages/Lab/JWTLab'))

// Phase 4 — Ecosystem
const BlogList = lazy(() => import('./pages/Blog/BlogList'))

// Removed redundant axios client and dynamic IP guessing logic to prevent connection timeouts and UI crashes.
// All API communication is now handle correctly via AuthContext.
const SecurityScanner = lazy(() => import('./pages/Tools/SecurityScanner'))
import CTFHub from './pages/CTF/CTFHub'
import { Toaster } from 'sonner'

function ProtectedRoute() {
    const { user, loading } = useAuth()
    if (loading) return <div className="p-10 text-center">Loading...</div>
    return user ? <Outlet /> : <Navigate to="/login" />
}

function AdminRoute() {
    const { user, loading } = useAuth()
    if (loading) return <div className="p-10 text-center">Loading...</div>
    if (!user) return <Navigate to="/login" />
    const isAdmin = user.roles?.includes('ROLE_ADMIN')
    return isAdmin ? <Outlet /> : <Navigate to="/" />
}

function ModeratorRoute() {
    const { user, loading } = useAuth()
    if (loading) return <div className="p-10 text-center">Loading...</div>
    if (!user) return <Navigate to="/login" />
    const isAllowed = user.roles?.includes('ROLE_MODERATOR') || user.roles?.includes('ROLE_ADMIN')
    return isAllowed ? <Outlet /> : <Navigate to="/" />
}

function Layout() {
    const location = useLocation()
    const isLab = location.pathname.startsWith('/lab')

    return (
        <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 pt-16">
                <ErrorBoundary>
                    <Suspense fallback={<div className="p-10 text-center flex items-center justify-center min-h-[50vh]"><i className='bx bx-loader-alt bx-spin text-3xl text-accent'></i></div>}>
                        <Outlet />
                    </Suspense>
                </ErrorBoundary>
            </main>
            <Footer />
            {/* <AIChatWidget key={`ai-chat-${isLab ? 'lab' : 'web'}`} /> */}
            <SupportChatWidget key={`support-chat-${isLab ? 'lab' : 'web'}`} />
        </div>
    )
}

function App() {
    return (
        <ThemeProvider>
            <LanguageProvider>
                <LabProgressProvider>
                    <AuthProvider>
                        <Toaster richColors position="top-right" />
                        <Router>
                            <ScrollToTop />
                            <LabProvider>
                                <Routes>
                                    {/* All existing routes... */}
                                    <Route element={<AdminRoute />}>
                                        <Route path="/dashboard" element={<AdminDashboard />} />
                                    </Route>

                                    <Route element={<ModeratorRoute />}>
                                        <Route path="/moderator" element={<ModeratorDashboard />} />
                                    </Route>

                                    <Route path="/login" element={<AuthPage />} />
                                    <Route path="/register" element={<AuthPage />} />
                                    <Route path="/oauth2/redirect" element={<OAuth2RedirectHandler />} />

                                    <Route element={<Layout />}>
                                        <Route path="/" element={<Home />} />
                                        <Route element={<ProtectedRoute />}>
                                            <Route path="/profile" element={<Dashboard />} />
                                        </Route>
                                        <Route path="/about" element={<About />} />
                                        <Route path="/about/intro" element={<About />} />
                                        <Route path="/about/cert" element={<Placeholder title="Certificates" />} />
                                        <Route path="/about/customer" element={<Placeholder title="Customers" />} />
                                        <Route path="/about/partner" element={<Placeholder title="Partners" />} />

                                        <Route path="/lab">
                                            <Route index element={<LabHub />} />
                                            <Route element={<LabLayout />}>
                                                <Route path="encryption" element={<Suspense fallback={<LabSkeleton />}><EncryptionLab /></Suspense>} />
                                                <Route path="hashing" element={<Suspense fallback={<LabSkeleton />}><HashingLab /></Suspense>} />
                                                <Route path="firewall" element={<Suspense fallback={<LabSkeleton />}><FirewallLab /></Suspense>} />
                                                <Route path="xss" element={<Suspense fallback={<LabSkeleton />}><XSSLab /></Suspense>} />
                                                <Route path="sqli" element={<Suspense fallback={<LabSkeleton />}><SQLiLab /></Suspense>} />
                                                <Route path="password" element={<Suspense fallback={<LabSkeleton />}><PasswordLab /></Suspense>} />
                                                <Route path="https" element={<Suspense fallback={<LabSkeleton />}><HttpsLab /></Suspense>} />
                                                <Route path="jwt" element={<Suspense fallback={<LabSkeleton />}><JWTLab /></Suspense>} />
                                            </Route>
                                        </Route>

                                        <Route path="/blog" element={<Suspense fallback={<div className="p-10 text-center">Loading Blog...</div>}><BlogList /></Suspense>} />
                                        <Route path="/tools/scanner" element={<Suspense fallback={<div className="p-10 text-center">Loading Scanner...</div>}><SecurityScanner /></Suspense>} />
                                        <Route path="/ctf" element={<Suspense fallback={<div className="p-10 text-center">Loading CTF Arena...</div>}><CTFHub /></Suspense>} />

                                        <Route path="/contact" element={<Contact />} />
                                        <Route path="/news" element={<Placeholder title="News & Events" />} />
                                        <Route path="/recruitment" element={<Placeholder title="Join Our Team" />} />
                                        <Route path="*" element={<Placeholder title="404 Not Found" />} />
                                    </Route>
                                </Routes>
                            </LabProvider>
                        </Router>
                    </AuthProvider>
                </LabProgressProvider>
            </LanguageProvider>
        </ThemeProvider>
    )
}

export default App
