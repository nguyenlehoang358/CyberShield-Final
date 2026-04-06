import React, { useState, useMemo, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import MfaModal from '../components/MfaModal'
import '../styles/auth.css'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/* ── Password Strength Analysis (from PasswordLab) ── */
const COMMON_PASSWORDS = [
    'password', '123456', '123456789', '12345678', 'qwerty', 'abc123', 'monkey', 'master',
    'dragon', '111111', 'baseball', 'iloveyou', 'trustno1', 'sunshine', 'princess',
    'football', 'letmein', 'shadow', 'superman', 'michael', 'admin', 'welcome', 'login',
    'passw0rd', 'password1', 'pass123', '1234567', '12345', '1234567890', '000000',
]

function analyzePassword(password) {
    if (!password) return null
    const checks = {
        length: password.length,
        hasLower: /[a-z]/.test(password),
        hasUpper: /[A-Z]/.test(password),
        hasDigit: /\d/.test(password),
        hasSpecial: /[^a-zA-Z0-9]/.test(password),
    }

    let poolSize = 0
    if (checks.hasLower) poolSize += 26
    if (checks.hasUpper) poolSize += 26
    if (checks.hasDigit) poolSize += 10
    if (checks.hasSpecial) poolSize += 33

    const entropy = poolSize > 0 ? Math.round(password.length * Math.log2(poolSize)) : 0
    const isCommon = COMMON_PASSWORDS.includes(password.toLowerCase())

    const patterns = []
    if (/^\d+$/.test(password)) patterns.push('numeric')
    if (/^[a-zA-Z]+$/.test(password)) patterns.push('alpha')
    if (/^(.)\1+$/.test(password)) patterns.push('repeat')

    let score = 0
    score += Math.min(40, password.length * 3.5)
    const diversityCount = [checks.hasLower, checks.hasUpper, checks.hasDigit, checks.hasSpecial].filter(Boolean).length
    score += diversityCount * 7.5
    score += Math.min(20, entropy / 5)
    if (isCommon) score = Math.max(5, score - 60)
    if (patterns.includes('repeat')) score = Math.max(5, score - 30)
    if (patterns.includes('numeric') || patterns.includes('alpha')) score -= 10
    score = Math.max(0, Math.min(100, Math.round(score)))

    let strength, strengthColor
    if (score < 20) { strength = 'very_weak'; strengthColor = '#f85149' }
    else if (score < 40) { strength = 'weak'; strengthColor = '#f0883e' }
    else if (score < 60) { strength = 'fair'; strengthColor = '#d29922' }
    else if (score < 80) { strength = 'good'; strengthColor = '#3fb950' }
    else { strength = 'excellent'; strengthColor = '#58a6ff' }

    return { checks, score, strength, strengthColor, isCommon, patterns }
}

/* ── Password Strength Meter Component ── */
function PasswordStrengthMeter({ password, lang, t }) {
    const analysis = useMemo(() => analyzePassword(password), [password])
    if (!password || !analysis) return null

    const strengthKeys = {
        very_weak: 'pwd_str_very_weak', weak: 'pwd_str_weak', fair: 'pwd_str_fair', good: 'pwd_str_good', excellent: 'pwd_str_excellent'
    }

    // Determine simple color based on score for a single progress bar
    let simpleColor = '#f85149'; // Red (Weak)
    if (analysis.score >= 80) simpleColor = '#3fb950'; // Green (Strong)
    else if (analysis.score >= 40) simpleColor = '#d29922'; // Yellow (Fair)

    // Dynamic suggestions based on missing checks
    const suggestions = [];
    if (analysis.checks.length < 8) suggestions.push(t('pwd_check_length').replace('{n}', 8));
    if (!analysis.checks.hasUpper) suggestions.push(t('pwd_check_upper'));
    if (!analysis.checks.hasLower) suggestions.push(t('pwd_check_lower'));
    if (!analysis.checks.hasDigit) suggestions.push(t('pwd_check_digit'));
    if (!analysis.checks.hasSpecial) suggestions.push(t('pwd_check_special'));
    if (analysis.isCommon) suggestions.push(t('pwd_check_common'));

    return (
        <div className="password-strength-simple" style={{ marginTop: '0.25rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>
                <span>💪 {t('pwd_str_label')}</span>
                <span style={{ color: simpleColor, fontWeight: '700' }}>{analysis.score}% — {t(strengthKeys[analysis.strength])}</span>
            </div>
            
            <div style={{ height: '6px', width: '100%', backgroundColor: 'var(--border-light)', borderRadius: '3px', overflow: 'hidden' }}>
                <div style={{
                    height: '100%',
                    width: `${Math.max(5, analysis.score)}%`,
                    backgroundColor: simpleColor,
                    transition: 'all 0.4s ease'
                }} />
            </div>
            
            {suggestions.length > 0 && analysis.score < 100 && (
                <div style={{ marginTop: '0.6rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {suggestions.slice(0, 3).map((s, i) => (
                        <span key={i} style={{ 
                            backgroundColor: 'var(--bg-card-hover)', 
                            border: '1px solid var(--border)',
                            color: 'var(--text-secondary)',
                            padding: '3px 8px', 
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <i className='bx bx-info-circle'></i> {s}
                        </span>
                    ))}
                </div>
            )}
        </div>
    )
}

export default function AuthPage() {
    const [isActive, setIsActive] = useState(false)
    const [viewMode, setViewMode] = useState('auth') // 'auth' | 'forgot' | 'reset'
    const [isTransitioning, setIsTransitioning] = useState(false)
    const navigate = useNavigate()
    const { login, register, verifyMfa, forgotPassword, resetPassword } = useAuth()
    const { lang, toggleLang, t } = useLanguage()

    // ─── Catch OAuth2 Errors from URL ───
    useEffect(() => {
        const params = new URLSearchParams(window.location.search)
        const error = params.get('error')
        if (error) {
            const errorMessages = {
                oauth_user_not_found: t('err_oauth_user_not_found') || 'Không tìm thấy tài khoản liên kết.',
                oauth2_failed: t('err_oauth2_failed') || 'Đăng nhập OAuth thất bại (Lỗi cấu hình Backend).',
                auth_failed_after_oauth: t('err_auth_failed') || 'Lỗi xác thực sau khi đăng nhập Social.'
            }
            toast.error(errorMessages[error] || error)
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname)
        }
    }, [t])

    const handleSocialLogin = (provider) => {
        // Derive backend base URL from environment (strip /api if present)
        const apiBase = import.meta.env.VITE_API_BASE_URL || `https://${window.location.hostname}:8443/api`
        const backendBase = apiBase.replace('/api', '')
        window.location.href = `${backendBase}/oauth2/authorization/${provider}`
    }

    // Login State
    const [loginEmail, setLoginEmail] = useState('')
    const [loginPassword, setLoginPassword] = useState('')
    const [showLoginPassword, setShowLoginPassword] = useState(false)
    const [loginEmailError, setLoginEmailError] = useState('')

    // Register State
    const [regUsername, setRegUsername] = useState('')
    const [regEmail, setRegEmail] = useState('')
    const [regPassword, setRegPassword] = useState('')
    const [showRegPassword, setShowRegPassword] = useState(false)
    const [regEmailError, setRegEmailError] = useState('')
    const [regPasswordError, setRegPasswordError] = useState('')
    const [termsAccepted, setTermsAccepted] = useState(false)
    const [isTermsModalOpen, setIsTermsModalOpen] = useState(false)

    // MFA State
    const [mfaRequired, setMfaRequired] = useState(false)
    const [mfaCode, setMfaCode] = useState('')
    const [tempToken, setTempToken] = useState('')

    // Forgot Password State
    const [forgotEmail, setForgotEmail] = useState('')
    const [forgotError, setForgotError] = useState('')
    const [forgotSuccess, setForgotSuccess] = useState('')
    const [forgotLoading, setForgotLoading] = useState(false)
    const [requiresCode, setRequiresCode] = useState(false)
    const [oauthProvider, setOauthProvider] = useState('')
    const [verificationCode, setVerificationCode] = useState('')
    const [codeHint, setCodeHint] = useState('')

    // Reset Password State
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [resetError, setResetError] = useState('')
    const [resetSuccess, setResetSuccess] = useState('')
    const [resetLoading, setResetLoading] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)

    const getRedirectPath = (roles) => {
        if (roles?.includes('ROLE_ADMIN')) return '/dashboard'
        return '/'
    }

    const handleLogin = async (e) => {
        e.preventDefault()
        setLoginEmailError('')

        let valid = true;
        if (!EMAIL_REGEX.test(loginEmail)) {
            setLoginEmailError(t('auth_error_email_format'))
            valid = false;
        }

        if (!valid) return;

        const fullEmail = loginEmail
        try {
            const res = await login(fullEmail, loginPassword)
            if (res.mfaRequired) {
                setMfaRequired(true)
                setTempToken(res.tempToken)
            } else {
                toast.success(t('auth_welcome_back'));
                navigate(getRedirectPath(res.roles))
            }
        } catch (err) {
            if (err.message === 'Network Error') {
                const currentHost = window.location.hostname
                toast.error(t('err_network_safari').replace('{host}', currentHost), { duration: 10000 });
                return;
            }
            const data = err.response?.data
            if (data?.blocked) {
                // IP is blocked — show countdown
                const remaining = data.remainingSeconds || 0
                const timeStr = remaining >= 3600 ? (lang === 'vi' ? `${Math.floor(remaining / 3600)} giờ` : `${Math.floor(remaining / 3600)}h`)
                    : remaining >= 60 ? (lang === 'vi' ? `${Math.floor(remaining / 60)} phút` : `${Math.floor(remaining / 60)}m`)
                        : (lang === 'vi' ? `${remaining} giây` : `${remaining}s`)
                toast.error(`🚫 ${data.error || t('err_ip_blocked').replace('{time}', timeStr)}`)
            } else if (data?.captchaRequired) {
                const attemptsLeft = data.attemptsRemaining || 0
                toast.error(`⚠️ ${t('err_login_attempts').replace('{n}', attemptsLeft)}`)
            } else if (data?.failureCount) {
                const attemptsLeft = data.attemptsRemaining || 0
                toast.error(`❌ ${t('err_wrong_credentials').replace('{n}', attemptsLeft)}`)
            } else {
                const errorMsg = data?.error || err.response?.data?.message || err.message || t('auth_login_failed')
                toast.error(errorMsg)
            }
        }
    }

    const handleRegister = async (e) => {
        e.preventDefault()
        setRegEmailError('')
        setRegPasswordError('')

        if (!termsAccepted) {
            toast.error(t('auth_error_terms_required') || "You must agree to the terms.")
            return
        }

        let valid = true

        if (!EMAIL_REGEX.test(regEmail)) {
            setRegEmailError(t('auth_invalid_email'))
            valid = false
        }

        if (regPassword.length < 8 || regPassword.length > 128) {
            setRegPasswordError(t('auth_password_range'))
            valid = false
        }

        if (!valid) return

        const fullEmail = regEmail
        try {
            await register(regUsername, fullEmail, regPassword)
            toast.success(t('auth_welcome_back') || 'Registration successful!')
            navigate('/')
        } catch (err) {
            if (err.message === 'Network Error') {
                const currentHost = window.location.hostname
                toast.error(t('err_network_safari').replace('{host}', currentHost), { duration: 10000 });
                return;
            }
            const errorMsg = err.response?.data?.error || err.response?.data?.message || err.message || t('auth_register_failed')
            toast.error(errorMsg)
        }
    }

    const handleForgotPassword = async (e) => {
        e.preventDefault()
        setForgotError('')
        setForgotSuccess('')
        if (!EMAIL_REGEX.test(forgotEmail)) {
            setForgotError(t('auth_invalid_email'))
            return
        }
        setForgotLoading(true)
        const fullEmail = forgotEmail
        try {
            const result = await forgotPassword(fullEmail)
            if (result.requiresCode) {
                setRequiresCode(true)
                setOauthProvider(result.provider)
                setForgotSuccess(result.message)
                if (result.hint) setCodeHint(result.hint)
            } else {
                setRequiresCode(false)
                setForgotSuccess(result.message)
                switchViewMode('reset')
            }
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message || t('auth_error_generic')
            setForgotError(errorMsg)
        }
        setForgotLoading(false)
    }

    const handleVerifyCodeAndProceed = async (e) => {
        e.preventDefault()
        if (!verificationCode || verificationCode.length !== 6) {
            setForgotError(t('auth_code_error'))
            return
        }
        setForgotError('')
        switchViewMode('reset')
    }

    const handleEmergencyUnblock = async () => {
        try {
            const currentHost = window.location.hostname;
            let baseUrl = `https://${currentHost}:8443`;
            if (currentHost.includes('ngrok-free') || currentHost.includes('ngrok-free.dev')) {
                baseUrl = import.meta.env.VITE_NGROK_BACKEND_URL || `https://api-${currentHost}/api`;
                if (baseUrl.endsWith('/api')) baseUrl = baseUrl.replace(/\/api$/, '');
            }
            await fetch(`${baseUrl}/api/public/emergency-unblock`, {
                headers: {
                    'ngrok-skip-browser-warning': 'true',
                    'bypass-tunnel-reminder': 'true'
                }
            });
            toast.success("Khẩn cấp: IP của bạn đã được bỏ chặn. Hãy thử đăng nhập lại!", { duration: 6000 });
        } catch (e) {
            toast.error("Lỗi bỏ chặn. Có thể do chứng chỉ SSL. Hãy truy cập trực tiếp Backend trước.", { duration: 5000 });
        }
    }

    const handleResetPassword = async (e) => {
        e.preventDefault()
        setResetError('')
        setResetSuccess('')
        setResetLoading(true)

        if (newPassword.length < 8 || newPassword.length > 128) {
            setResetError(t('auth_password_range'))
            setResetLoading(false)
            return
        }
        if (newPassword !== confirmPassword) {
            setResetError(t('auth_confirm_mismatch'))
            setResetLoading(false)
            return
        }

        const fullEmail = forgotEmail
        try {
            const result = await resetPassword(fullEmail, newPassword, requiresCode ? verificationCode : null)
            setResetSuccess(result.message)
            setTimeout(() => {
                goBackToLogin()
            }, 2000)
        } catch (err) {
            const errorMsg = err.response?.data?.error || err.message || t('auth_error_generic')
            setResetError(errorMsg)
        }
        setResetLoading(false)
    }

    // ─── Smooth transition for view mode changes ───
    const switchViewMode = (newMode) => {
        setIsTransitioning(true)
        setTimeout(() => {
            setViewMode(newMode)
            setTimeout(() => setIsTransitioning(false), 50)
        }, 300)
    }

    const goBackToLogin = () => {
        setIsTransitioning(true)
        setTimeout(() => {
            setViewMode('auth')
            setIsActive(false)
            setForgotError('')
            setForgotSuccess('')
            setRequiresCode(false)
            setVerificationCode('')
            setCodeHint('')
            setNewPassword('')
            setConfirmPassword('')
            setResetError('')
            setResetSuccess('')
            setForgotEmail('')
            setForgotLoading(false)
            setShowLoginPassword(false)
            setShowRegPassword(false)
            setShowNewPassword(false)
            setShowConfirmPassword(false)
            setOauthProvider('')
            setTimeout(() => setIsTransitioning(false), 50)
        }, 300)
    }

    // ─── Language Toggle Button (reusable) ───
    const LangToggle = () => (
        <button className="auth-lang-toggle" onClick={toggleLang} aria-label="Toggle language" id="auth-lang-toggle-btn">
            <span className="lang-icon">🌐</span>
            {lang.toUpperCase()}
        </button>
    )

    // ─── Forgot Password View ───
    if (viewMode === 'forgot') {
        return (
            <div className="auth-page">
                <Link to="/" className="back-home"><i className='bx bx-arrow-back'></i> {t('auth_back_home')}</Link>
                <LangToggle />
                <div className={`auth-container forgot-container ${isTransitioning ? 'view-transitioning' : 'view-visible'}`}>
                    <div className="form-wrapper">
                        <div className="form-box show" style={{ position: 'relative' }}>
                            {!requiresCode ? (
                                <form onSubmit={handleForgotPassword}>
                                    <div className="forgot-header">
                                        <div className="forgot-icon">
                                            <i className='bx bx-lock-open-alt'></i>
                                        </div>
                                        <h1>{t('auth_forgot_title')}</h1>
                                        <p className="forgot-subtitle">{t('auth_forgot_subtitle')}</p>
                                    </div>

                                    {forgotError && <div className="error-msg">{forgotError}</div>}
                                    {forgotSuccess && <div className="success-msg">{forgotSuccess}</div>}

                                    <div className="input-box">
                                        <i className='bx bx-envelope'></i>
                                        <input
                                            type="text"
                                            placeholder={t('auth_email_placeholder')}
                                            required
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                        />
                                    </div>

                                    <button type="submit" className="btn btn-primary btn-full" disabled={forgotLoading}>
                                        {forgotLoading ? (
                                            <span className="btn-loading"><i className='bx bx-loader-alt bx-spin'></i> {t('auth_processing')}</span>
                                        ) : t('auth_confirm_email')}
                                    </button>

                                    <button type="button" className="btn-back-login" onClick={goBackToLogin}>
                                        <i className='bx bx-arrow-back'></i> {t('auth_back_login')}
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyCodeAndProceed}>
                                    <div className="forgot-header">
                                        <div className="forgot-icon oauth-icon">
                                            <i className={`bx bxl-${oauthProvider === 'google' ? 'google' : oauthProvider === 'facebook' ? 'facebook' : oauthProvider === 'github' ? 'github' : 'key'}`}></i>
                                        </div>
                                        <h1>{t('auth_verify_title')}</h1>
                                        <p className="forgot-subtitle">
                                            {t('auth_verify_subtitle_provider')} <strong className="provider-name">{oauthProvider.toUpperCase()}</strong>
                                        </p>
                                        <p className="forgot-subtitle">{t('auth_verify_subtitle_code')}</p>
                                    </div>

                                    {forgotError && <div className="error-msg">{forgotError}</div>}
                                    {forgotSuccess && <div className="success-msg">{forgotSuccess}</div>}

                                    {codeHint && (
                                        <div className="code-hint-box">
                                            <i className='bx bx-info-circle'></i>
                                            <span>{t('auth_code_hint')}: <strong>{codeHint}</strong></span>
                                        </div>
                                    )}

                                    <div className="input-box">
                                        <i className='bx bx-key'></i>
                                        <input
                                            type="text"
                                            placeholder={t('auth_enter_code')}
                                            required
                                            maxLength={6}
                                            value={verificationCode}
                                            onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                                        />
                                    </div>

                                    <button type="submit" className="btn btn-primary btn-full">
                                        {t('auth_confirm_code')}
                                    </button>

                                    <button type="button" className="btn-back-login" onClick={goBackToLogin}>
                                        <i className='bx bx-arrow-back'></i> {t('auth_back_login')}
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // ─── Reset Password View ───
    if (viewMode === 'reset') {
        return (
            <div className="auth-page">
                <Link to="/" className="back-home"><i className='bx bx-arrow-back'></i> {t('auth_back_home')}</Link>
                <LangToggle />
                <div className={`auth-container forgot-container ${isTransitioning ? 'view-transitioning' : 'view-visible'}`}>
                    <div className="form-wrapper">
                        <div className="form-box show" style={{ position: 'relative' }}>
                            <form onSubmit={handleResetPassword}>
                                <div className="forgot-header">
                                    <div className="forgot-icon reset-icon">
                                        <i className='bx bx-reset'></i>
                                    </div>
                                    <h1>{t('auth_reset_title')}</h1>
                                    <p className="forgot-subtitle">{t('auth_reset_subtitle')}</p>
                                    <p className="forgot-subtitle email-display">
                                        <i className='bx bx-envelope'></i> {forgotEmail}
                                    </p>
                                </div>

                                {resetError && <div className="error-msg">{resetError}</div>}
                                {resetSuccess && <div className="success-msg">{resetSuccess}</div>}

                                <div className="input-box">
                                    <i className='bx bx-lock-alt'></i>
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder={t('auth_new_password')}
                                        required
                                        maxLength={128}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                    />
                                    <i className={`bx ${showNewPassword ? 'bx-hide' : 'bx-show'} toggle-password`} onClick={() => setShowNewPassword(!showNewPassword)}></i>
                                </div>

                                <div className="input-box">
                                    <i className='bx bx-check-shield'></i>
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder={t('auth_confirm_password')}
                                        required
                                        maxLength={128}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                    />
                                    <i className={`bx ${showConfirmPassword ? 'bx-hide' : 'bx-show'} toggle-password`} onClick={() => setShowConfirmPassword(!showConfirmPassword)}></i>
                                </div>

                                <div className="password-rules">
                                    <span className={newPassword.length >= 8 && newPassword.length <= 128 ? 'rule-ok' : 'rule-pending'}>
                                        <i className={`bx ${newPassword.length >= 8 && newPassword.length <= 128 ? 'bx-check-circle' : 'bx-circle'}`}></i>
                                        {t('auth_password_rule_range')}
                                    </span>
                                    <span className={newPassword && newPassword === confirmPassword ? 'rule-ok' : 'rule-pending'}>
                                        <i className={`bx ${newPassword && newPassword === confirmPassword ? 'bx-check-circle' : 'bx-circle'}`}></i>
                                        {t('auth_password_rule_match')}
                                    </span>
                                </div>

                                <button type="submit" className="btn btn-primary btn-full" disabled={resetLoading}>
                                    {resetLoading ? (
                                        <span className="btn-loading"><i className='bx bx-loader-alt bx-spin'></i> {t('auth_processing')}</span>
                                    ) : t('auth_reset_btn')}
                                </button>

                                <button type="button" className="btn-back-login" onClick={goBackToLogin}>
                                    <i className='bx bx-arrow-back'></i> {t('auth_back_login')}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="auth-page">
            <Link to="/" className="back-home"><i className='bx bx-arrow-back'></i> {t('auth_back_home')}</Link>
            <LangToggle />

        {/* ═══ TERMS & POLICY MODAL ═══ */}
        {isTermsModalOpen && (
            <div className="terms-modal-overlay" onClick={() => setIsTermsModalOpen(false)}>
                <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
                    <div className="terms-modal-header">
                        <div className="terms-modal-icon">
                            <i className='bx bx-shield-quarter'></i>
                        </div>
                        <h2>{t('terms_modal_title')}</h2>
                        <p className="terms-modal-subtitle">CyberShield Security Platform</p>
                        <button className="terms-modal-close" onClick={() => setIsTermsModalOpen(false)}>
                            <i className='bx bx-x'></i>
                        </button>
                    </div>
                    <div className="terms-modal-body">
                        {/* Điều 1 */}
                        <div className="terms-article">
                            <div className="terms-article-header">
                                <span className="terms-article-num">01</span>
                                <h3>{t('terms_art1_title')}</h3>
                            </div>
                            <div className="terms-article-content">
                                <p>{t('terms_art1_desc')}</p>
                                <ul>
                                    <li>{t('terms_art1_li1')}</li>
                                    <li>{t('terms_art1_li2')}</li>
                                    <li>{t('terms_art1_li3')}</li>
                                    <li>{t('terms_art1_li4')}</li>
                                </ul>
                            </div>
                        </div>

                        {/* Điều 2 */}
                        <div className="terms-article">
                            <div className="terms-article-header">
                                <span className="terms-article-num">02</span>
                                <h3>{t('terms_art2_title')}</h3>
                            </div>
                            <div className="terms-article-content">
                                <p>{t('terms_art2_desc')}</p>
                                <ul>
                                    <li>{t('terms_art2_li1')}</li>
                                    <li>{t('terms_art2_li2')}</li>
                                    <li>{t('terms_art2_li3')}</li>
                                    <li>{t('terms_art2_li4')}</li>
                                </ul>
                                <div className="terms-highlight">
                                    <i className='bx bx-info-circle'></i>
                                    <span>{t('terms_art2_note')}</span>
                                </div>
                            </div>
                        </div>

                        {/* Điều 3 */}
                        <div className="terms-article">
                            <div className="terms-article-header">
                                <span className="terms-article-num">03</span>
                                <h3>{t('terms_art3_title')}</h3>
                            </div>
                            <div className="terms-article-content">
                                <p>{t('terms_art3_desc')}</p>
                                <ul>
                                    <li>{t('terms_art3_li1')}</li>
                                    <li>{t('terms_art3_li2')}</li>
                                    <li>{t('terms_art3_li3')}</li>
                                </ul>
                                <div className="terms-highlight terms-highlight--warning">
                                    <i className='bx bx-error'></i>
                                    <span>{t('terms_art3_warning')}</span>
                                </div>
                            </div>
                        </div>

                        <div className="terms-footer-info">
                            <p>{t('terms_last_updated')}</p>
                        </div>
                    </div>
                    <div className="terms-modal-footer">
                        <button
                            className="terms-accept-btn"
                            onClick={() => { setTermsAccepted(true); setIsTermsModalOpen(false) }}
                        >
                            <i className='bx bx-check-shield'></i>
                            {t('terms_accept')}
                        </button>
                        <button
                            className="terms-close-btn"
                            onClick={() => setIsTermsModalOpen(false)}
                        >
                            {t('terms_close')}
                        </button>
                    </div>
                </div>
            </div>
        )}

            {mfaRequired && (
                <MfaModal
                    isOpen={true}
                    mode="verify"
                    tempToken={tempToken}
                    onClose={() => {
                        setMfaRequired(false);
                        setMfaCode('');
                        setTempToken('');
                    }}
                    onSuccess={(res) => navigate(getRedirectPath(res?.roles))}
                />
            )}

            <div className={`auth-container ${isActive ? 'active' : ''} ${isTransitioning ? 'view-transitioning' : 'view-visible'}`} id="container">

                {/* Form Wrapper */}
                <div className="form-wrapper">
                    {/* Sign Up Form */}
                    <div className={`form-box register`}>
                        <form onSubmit={handleRegister}>
                            <h1>{t('auth_register')}</h1>

                            <div className="input-box">
                                <i className='bx bx-user'></i>
                                <input
                                    type="text"
                                    placeholder={t('auth_username_placeholder')}
                                    required
                                    minLength={3}
                                    value={regUsername}
                                    onChange={(e) => setRegUsername(e.target.value)}
                                />
                            </div>
                            <div className="input-box" style={{ marginBottom: regEmailError ? '2rem' : '1.5rem' }}>
                                <i className='bx bx-envelope'></i>
                                <input
                                    type="text"
                                    placeholder={t('auth_email_placeholder')}
                                    required
                                    value={regEmail}
                                    onChange={(e) => setRegEmail(e.target.value)}
                                    className={regEmailError ? 'input-error' : ''}
                                />
                                {regEmailError && <span className="inline-error-text" style={{ color: '#f85149', fontSize: '0.8rem', position: 'absolute', bottom: '-20px', left: '0' }}>{regEmailError}</span>}
                            </div>
                            <div className="input-box" style={{ marginBottom: regPasswordError ? '2rem' : '1.5rem' }}>
                                <i className='bx bx-lock-alt'></i>
                                <input
                                    type={showRegPassword ? "text" : "password"}
                                    placeholder={t('auth_password_placeholder')}
                                    required
                                    maxLength={128}
                                    value={regPassword}
                                    onChange={(e) => setRegPassword(e.target.value)}
                                    className={regPasswordError ? 'input-error' : ''}
                                />
                                <i className={`bx ${showRegPassword ? 'bx-hide' : 'bx-show'} toggle-password`} onClick={() => setShowRegPassword(!showRegPassword)}></i>
                                {regPasswordError && <span className="inline-error-text" style={{ color: '#f85149', fontSize: '0.8rem', position: 'absolute', bottom: '-20px', left: '0' }}>{regPasswordError}</span>}
                            </div>

                            {/* Password Strength Meter */}
                            <PasswordStrengthMeter password={regPassword} lang={lang} t={t} />

                            <div className="terms-checkbox" style={{ display: 'flex', alignItems: 'flex-start', margin: '15px 0', fontSize: '0.85rem', textAlign: 'left', lineHeight: '1.4' }}>
                                <input
                                    type="checkbox"
                                    id="terms"
                                    checked={termsAccepted}
                                    onChange={(e) => setTermsAccepted(e.target.checked)}
                                    style={{ marginTop: '3px', marginRight: '8px', cursor: 'pointer', accentColor: 'var(--accent)' }}
                                />
                                <label htmlFor="terms" style={{ color: 'var(--text-secondary)' }}>
                                    {t('auth_terms_agree')}{' '}
                                    <span
                                        onClick={(e) => { e.preventDefault(); setIsTermsModalOpen(true) }}
                                        style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}
                                    >
                                        {t('auth_terms_of_service')}
                                    </span>
                                    {' '}{t('auth_and')}{' '}
                                    <span
                                        onClick={(e) => { e.preventDefault(); setIsTermsModalOpen(true) }}
                                        style={{ color: 'var(--accent)', cursor: 'pointer', textDecoration: 'underline', textUnderlineOffset: '2px' }}
                                    >
                                        {t('auth_privacy_policy')}
                                    </span>.
                                </label>
                            </div>

                            <button type="submit" className="btn btn-primary btn-full" disabled={!termsAccepted} style={{ opacity: termsAccepted ? 1 : 0.6 }}>{t('auth_register')}</button>

                            <p className="divider">{t('auth_or_register_with')}</p>
                            <div className="social-icons">
                                <button type="button" onClick={() => handleSocialLogin('google')} className="social-btn google-btn" title="Google">
                                    <i className='bx bxl-google'></i>
                                </button>
                                <button type="button" onClick={() => handleSocialLogin('facebook')} className="social-btn facebook-btn" title="Facebook">
                                    <i className='bx bxl-facebook'></i>
                                </button>
                                <button type="button" onClick={() => handleSocialLogin('github')} className="social-btn github-btn" title="GitHub">
                                    <i className='bx bxl-github'></i>
                                </button>
                                <button type="button" onClick={() => handleSocialLogin('linkedin')} className="social-btn linkedin-btn" title="LinkedIn">
                                    <i className='bx bxl-linkedin'></i>
                                </button>
                            </div>
                        </form>
                    </div>

                    <div className={`form-box login`}>
                        <form onSubmit={handleLogin}>
                            <h1>{t('auth_login')}</h1>

                            <div className="input-box" style={{ marginBottom: loginEmailError ? '2rem' : '1.5rem' }}>
                                <i className='bx bx-envelope'></i>
                                <input
                                    type="text"
                                    placeholder={t('auth_email_placeholder')}
                                    required
                                    value={loginEmail}
                                    onChange={(e) => setLoginEmail(e.target.value)}
                                    className={loginEmailError ? 'input-error' : ''}
                                />
                                {loginEmailError && <span className="inline-error-text" style={{ color: '#f85149', fontSize: '0.8rem', position: 'absolute', bottom: '-20px', left: '0' }}>{loginEmailError}</span>}
                            </div>
                            <div className="input-box">
                                <i className='bx bx-lock-alt'></i>
                                <input
                                    type={showLoginPassword ? "text" : "password"}
                                    placeholder={t('auth_password_placeholder')}
                                    required
                                    maxLength={128}
                                    value={loginPassword}
                                    onChange={(e) => setLoginPassword(e.target.value)}
                                />
                                <i className={`bx ${showLoginPassword ? 'bx-hide' : 'bx-show'} toggle-password`} onClick={() => setShowLoginPassword(!showLoginPassword)}></i>
                            </div>
                            <div className="forgot-link" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                                <a href="#" onClick={(e) => { e.preventDefault(); switchViewMode('forgot') }}>{t('auth_forgot_password')}</a>
                                <a href="#" onClick={(e) => { e.preventDefault(); handleEmergencyUnblock() }} style={{ color: '#ff4d4f' }}>
                                    <i className='bx bx-shield-x'></i> Mở khóa IP
                                </a>
                            </div>

                            <button type="submit" className="btn btn-primary btn-full">
                                {t('auth_login')}
                            </button>

                            <p className="divider">{t('auth_or_login_with')}</p>
                            <div className="social-icons">
                                <button type="button" onClick={() => handleSocialLogin('google')} className="social-btn google-btn" title="Google">
                                    <i className='bx bxl-google'></i>
                                </button>
                                <button type="button" onClick={() => handleSocialLogin('facebook')} className="social-btn facebook-btn" title="Facebook">
                                    <i className='bx bxl-facebook'></i>
                                </button>
                                <button type="button" onClick={() => handleSocialLogin('github')} className="social-btn github-btn" title="GitHub">
                                    <i className='bx bxl-github'></i>
                                </button>
                                <button type="button" onClick={() => handleSocialLogin('linkedin')} className="social-btn linkedin-btn" title="LinkedIn">
                                    <i className='bx bxl-linkedin'></i>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Toggle Box (Desktop) */}
                <div className="toggle-box desktop-only">
                    <div className={`toggle-panel toggle-left`}>
                        <h1>{t('auth_welcome_back')}</h1>
                        <p>{t('auth_have_account')}</p>
                        <button className="btn btn-outline" onClick={() => setIsActive(false)}>{t('auth_login')}</button>
                    </div>
                    <div className={`toggle-panel toggle-right`}>
                        <h1>{t('auth_hello')}</h1>
                        <p>{t('auth_no_account')}</p>
                        <button className="btn btn-outline" onClick={() => setIsActive(true)}>{t('auth_register')}</button>
                    </div>
                </div>

                {/* Mobile Toggle */}
                <div className="mobile-toggle">
                    <button className="toggle-link" onClick={() => setIsActive(!isActive)}>
                        {isActive ? t('auth_mobile_login') : t('auth_mobile_register')}
                    </button>
                </div>

            </div>
        </div>
    )
}
