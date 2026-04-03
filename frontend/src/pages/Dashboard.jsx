
import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { QRCodeSVG } from 'qrcode.react'
import SafeOutput from '../components/SafeOutput'
import { Shield, CheckCircle, AlertTriangle, Key, Mail, User, Clock, Smartphone, LogOut, Github, Facebook, Activity, X } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import './dashboard.css'

export default function Dashboard() {
    const { user, api, logout } = useAuth()
    const { t } = useLanguage()
    const [qrUrl, setQrUrl] = useState('')
    const [mfaCode, setMfaCode] = useState('')
    const [setupStep, setSetupStep] = useState(0) // 0: None, 1: QR, 2: Verify
    const [msg, setMsg] = useState({ text: '', type: '' })
    const [activeTab, setActiveTab] = useState('overview') // 'overview', 'security', 'linked'

    const handleLinkAccount = (provider) => {
        // Cookie HttpOnly 'jwt' tự động được gửi kèm khi trình duyệt redirect sang Backend cùng domain
        // Chỉ cần thêm ?mode=link để Backend biết đây là luồng Liên kết, không phải Đăng nhập mới
        window.location.href = `https://${window.location.hostname}:8443/oauth2/authorization/${provider}?mode=link`
    }

    const handleSetupMFA = async () => {
        try {
            const res = await api.post('/auth/mfa/setup')
            setQrUrl(res.data.qrCodeUrl)
            setSetupStep(1)
            setMsg({ text: '', type: '' })
        } catch (err) {
            setMsg({ text: 'Lỗi thiết lập MFA', type: 'error' })
        }
    }

    const handleEnableMFA = async () => {
        try {
            await api.post('/auth/mfa/enable', { code: parseInt(mfaCode) })
            setMsg({ text: 'Bật MFA thành công!', type: 'success' })
            setSetupStep(0)
            window.location.reload()
        } catch (err) {
            setMsg({ text: 'Mã không hợp lệ. Vui lòng thử lại.', type: 'error' })
        }
    }

    return (
        <div className="dashboard-page">
            {/* Background Effects */}
            <div className="dashboard-bg-effect">
                <div className="dashboard-bg-orb-1"></div>
                <div className="dashboard-bg-orb-2"></div>
            </div>

            <div className="dashboard-container">
                {/* Header Profile Info */}
                <div className="dashboard-header">
                    <div className="profile-avatar-wrapper shadow-lg">
                        <div className="profile-avatar-inner">
                            <span className="profile-avatar-text">
                                {user?.username?.charAt(0) || 'U'}
                            </span>
                        </div>
                    </div>
                    
                    <div className="profile-info">
                        <div className="role-badge">
                            {user?.roles?.includes('ROLE_ADMIN') ? 'ADMINISTRATOR' : 'MEMBER'}
                        </div>
                        <h1 className="profile-name">
                            <SafeOutput>{user?.username}</SafeOutput>
                            {user?.mfaEnabled && <Shield size={24} color="#4ade80" />}
                        </h1>
                        <p className="profile-email">
                            <Mail size={16} /> <SafeOutput>{user?.email}</SafeOutput>
                        </p>
                    </div>
                    
                    <div className="profile-actions">
                        <button onClick={() => logout()} className="btn-logout">
                            <LogOut size={18} /> Đăng xuất
                        </button>
                    </div>
                </div>

                <div className="dashboard-layout">
                    {/* Sidebar Nav */}
                    <div className="dashboard-sidebar">
                        <div className="sidebar-nav-container">
                            <nav className="sidebar-nav">
                                <button 
                                    onClick={() => setActiveTab('overview')}
                                    className={`nav-tab ${activeTab === 'overview' ? 'active' : ''}`}
                                >
                                    <User size={18} /> Tổng quan
                                </button>
                                <button 
                                    onClick={() => setActiveTab('security')}
                                    className={`nav-tab ${activeTab === 'security' ? 'active' : ''}`}
                                >
                                    <Shield size={18} /> Bảo mật & MFA
                                </button>
                                <button 
                                    onClick={() => setActiveTab('linked')}
                                    className={`nav-tab ${activeTab === 'linked' ? 'active' : ''}`}
                                >
                                    <Activity size={18} /> Liên kết tài khoản
                                </button>
                            </nav>
                        </div>
                    </div>

                    {/* Main Content Area */}
                    <div className="dashboard-content">
                        {/* Tab: Overview */}
                        {activeTab === 'overview' && (
                            <div className="tab-pane">
                                <div className="dash-card">
                                    <h2 className="dash-card-title">
                                        <User color="#60a5fa" /> Thông tin cá nhân
                                    </h2>
                                    <div className="info-grid">
                                        <div className="info-item">
                                            <p className="info-label">Tên đăng nhập</p>
                                            <p className="info-val"><SafeOutput>{user?.username}</SafeOutput></p>
                                        </div>
                                        <div className="info-item">
                                            <p className="info-label">Địa chỉ Email</p>
                                            <p className="info-val"><SafeOutput>{user?.email}</SafeOutput></p>
                                        </div>
                                        <div className="info-item">
                                            <p className="info-label">Phân quyền gốc</p>
                                            <div style={{display:'flex', gap:'0.5rem', marginTop:'0.25rem'}}>
                                                {user?.roles?.map(r => (
                                                    <span key={r} className="role-tag">
                                                        {r}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="info-item">
                                            <p className="info-label">Ngày tham gia</p>
                                            <p className="info-val">
                                                <Clock size={16} color="#9ca3af"/>
                                                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="dash-card">
                                    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
                                        <h2 className="dash-card-title" style={{margin:0}}>
                                            <Activity color="#4ade80" /> Tiến độ học tập Lab
                                        </h2>
                                        <button style={{background:'none', border:'none', color:'#60a5fa', cursor:'pointer', fontSize:'0.875rem'}}>Xem chi tiết</button>
                                    </div>
                                    <div style={{display:'flex', flexDirection:'column', alignItems:'center', padding:'2.5rem 0', color:'#9ca3af', textAlign:'center'}}>
                                        <div style={{width:'4rem', height:'4rem', borderRadius:'50%', background:'var(--bg-glass)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:'1rem'}}>
                                            <Activity size={24} />
                                        </div>
                                        <p>Bạn chưa hoàn thành bài Lab nào.</p>
                                        <p style={{fontSize:'0.875rem', marginTop:'0.25rem'}}>Hãy bắt đầu luyện tập tại khu vực Lab & Tools nhé!</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: Security */}
                        {activeTab === 'security' && (
                            <div className="tab-pane">
                                <div className="dash-card">
                                    <h2 className="dash-card-title">
                                        <Shield color="#c084fc" /> Trạng thái bảo mật
                                    </h2>
                                    <p style={{color:'#9ca3af', marginBottom:'1.5rem'}}>Bảo vệ tài khoản của bạn bằng các thiết lập bảo mật nhiều lớp.</p>

                                    <div className="mfa-status-box">
                                        <div style={{display:'flex', alignItems:'center', gap:'1rem', marginBottom:'1rem'}}>
                                            <div className={`mfa-status-icon ${user?.mfaEnabled ? 'enabled' : 'disabled'}`}>
                                                {user?.mfaEnabled ? <CheckCircle size={24}/> : <Shield size={24}/>}
                                            </div>
                                            <div>
                                                <h3 style={{fontSize:'1.125rem', fontWeight:600}}>{user?.mfaEnabled ? 'Đã bật' : 'Chưa bật'} xác minh 2 bước (2FA)</h3>
                                                <p style={{fontSize:'0.875rem', marginTop:'0.25rem', color: user?.mfaEnabled ? '#4ade80' : '#eab308'}}>
                                                    {user?.mfaEnabled ? 'Tài khoản của bạn đang được bảo vệ an toàn.' : 'Tài khoản có nguy cơ bị tấn công. Đề nghị bật 2FA.'}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        {!user?.mfaEnabled && setupStep === 0 && (
                                            <button onClick={handleSetupMFA} className="btn-gradient">
                                                Kích hoạt ngay
                                            </button>
                                        )}
                                        {user?.mfaEnabled && (
                                            <div style={{padding:'0.5rem 1rem', background:'var(--bg-glass)', borderRadius:'0.5rem', border:'1px solid var(--border)', fontSize:'0.875rem'}}>
                                                Được quản lý
                                            </div>
                                        )}
                                    </div>

                                    {setupStep === 1 && (
                                        <div className="setup-mfa-wrapper">
                                            <div className="setup-mfa-inner">
                                                <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1.5rem'}}>
                                                    <h3 className="dash-card-title" style={{margin:0}}><Smartphone color="#60a5fa"/> Quét mã QR </h3>
                                                    <button onClick={() => setSetupStep(0)} style={{background:'none', border:'none', color:'#9ca3af', cursor:'pointer', padding:'0.5rem', borderRadius:'50%'}}>
                                                        <X size={20} />
                                                    </button>
                                                </div>
                                                <div className="setup-mfa-layout">
                                                    <div className="qr-box">
                                                        <QRCodeSVG value={qrUrl} size={180} />
                                                    </div>
                                                    <div style={{textAlign:'left', maxWidth:'24rem'}}>
                                                        <ol style={{color:'#d1d5db', paddingLeft:'1.25rem', marginBottom:'1.5rem', lineHeight:1.7}}>
                                                            <li>Tải ứng dụng <strong>Google Authenticator</strong> hoặc Authy trên điện thoại.</li>
                                                            <li>Mở ứng dụng và chọn <strong>Quét mã QR</strong>.</li>
                                                            <li>Quét mã QR bên cạnh và nhập mã 6 số hiển thị trên ứng dụng vào ô dưới đây.</li>
                                                        </ol>
                                                        <div className="mfa-input-container">
                                                            <i style={{position:'absolute', left:'0.75rem', top:'50%', transform:'translateY(-50%)', color:'#6b7280'}}>
                                                                <Key size={20} />
                                                            </i>
                                                            <input
                                                                type="text"
                                                                maxLength="6"
                                                                placeholder="Nhập mã 6 số..."
                                                                className="mfa-input"
                                                                value={mfaCode}
                                                                onChange={(e) => setMfaCode(e.target.value.replace(/[^0-9]/g, ''))}
                                                            />
                                                        </div>
                                                        <button 
                                                            onClick={handleEnableMFA} 
                                                            disabled={mfaCode.length !== 6}
                                                            className="btn-gradient"
                                                            style={{width:'100%', marginTop:'1rem', opacity: mfaCode.length === 6 ? 1 : 0.5, cursor: mfaCode.length === 6 ? 'pointer' : 'not-allowed'}}
                                                        >
                                                            Xác nhận & Bật
                                                        </button>
                                                        {msg.text && (
                                                            <p style={{marginTop:'0.75rem', textAlign:'center', fontSize:'0.875rem', color: msg.type === 'error' ? '#f87171' : '#4ade80'}}>
                                                                {msg.text}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                </div>

                                {/* Password Reset Notice */}
                                <div className="dash-card" style={{display:'flex', gap:'1rem', alignItems:'flex-start'}}>
                                    <div style={{width:'2.5rem', height:'2.5rem', borderRadius:'50%', background:'rgba(59,130,246,0.1)', display:'flex', alignItems:'center', justifyContent:'center', color:'#60a5fa', flexShrink:0}}>
                                        <Key size={20} />
                                    </div>
                                    <div>
                                        <h3 style={{fontSize:'1.125rem', fontWeight:600, marginBottom:'0.25rem'}}>Mật khẩu</h3>
                                        {user?.hasPassword ? (
                                            <>
                                                <p style={{color:'#9ca3af', fontSize:'0.875rem', marginBottom:'1rem'}}>Bạn nên tạo thói quen đổi mật khẩu 3 tháng 1 lần để đảm bảo an toàn.</p>
                                                <button style={{padding:'0.5rem 1.25rem', borderRadius:'0.5rem', border:'1px solid var(--border)', background:'transparent', color:'var(--text-primary)', cursor:'pointer', fontSize:'0.875rem', fontWeight:500}}>Đổi mật khẩu</button>
                                            </>
                                        ) : (
                                            <p style={{color:'#eab308', fontSize:'0.875rem'}}>
                                                ⚠ Tài khoản đang sử dụng đăng nhập qua <strong style={{color:'#4ade80'}}>{user?.oauthProvider?.toUpperCase()}</strong>. 
                                                Bạn không cần mật khẩu nội bộ — hãy dùng nút "Quên mật khẩu" nếu muốn tạo mật khẩu riêng cho CyberShield.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Tab: Linked Accounts */}
                        {activeTab === 'linked' && (
                            <div className="tab-pane">
                                <div className="dash-card">
                                    <h2 className="dash-card-title">
                                        <Activity color="#60a5fa" /> Liên kết tài khoản
                                    </h2>
                                    <p style={{color:'#9ca3af', marginBottom:'2rem'}}>Liên kết các tài khoản mạng xã hội để đăng nhập nhanh chóng bằng 1 click mà không cần nhớ mật khẩu.</p>

                                    <div style={{display:'flex', flexDirection:'column', gap:'1rem'}}>
                                        {/* Google */}
                                        <div className="linked-account-item">
                                            <div className="linked-account-info">
                                                <div className="linked-icon" style={{background:'white'}}>
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                                        <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                                        <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                                        <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                                    </svg>
                                                </div>
                                                <div>
                                                    <h3 style={{fontSize:'1.125rem', fontWeight:600}}>Google</h3>
                                                    <p style={{fontSize:'0.875rem', color: user?.oauthProvider === 'google' ? '#4ade80' : '#6b7280'}}>
                                                        {user?.oauthProvider === 'google' 
                                                            ? (user?.oauthEmail ? `✓ ${user.oauthEmail}` : '✓ Đã liên kết')
                                                            : 'Chưa liên kết'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleLinkAccount('google')}
                                                disabled={user?.oauthProvider === 'google'}
                                                style={{
                                                    padding:'0.5rem 1rem', borderRadius:'0.5rem', 
                                                    background: user?.oauthProvider === 'google' ? 'rgba(74,222,128,0.15)' : 'var(--bg-card-hover)', 
                                                    color: user?.oauthProvider === 'google' ? '#4ade80' : 'var(--text-primary)', 
                                                    border: `1px solid ${user?.oauthProvider === 'google' ? 'rgba(74,222,128,0.3)' : 'var(--border)'}`, 
                                                    cursor: user?.oauthProvider === 'google' ? 'default' : 'pointer', 
                                                    fontSize:'0.875rem', fontWeight:500
                                                }}
                                            >
                                                {user?.oauthProvider === 'google' ? '✓ Đã liên kết' : 'Liên kết ngay'}
                                            </button>
                                        </div>

                                        {/* GitHub */}
                                        <div className="linked-account-item">
                                            <div className="linked-account-info">
                                                <div className="linked-icon" style={{background:'#333', color:'white'}}>
                                                    <Github size={20} />
                                                </div>
                                                <div>
                                                    <h3 style={{fontSize:'1.125rem', fontWeight:600}}>GitHub</h3>
                                                    <p style={{fontSize:'0.875rem', color: user?.oauthProvider === 'github' ? '#4ade80' : '#6b7280'}}>
                                                        {user?.oauthProvider === 'github' 
                                                            ? (user?.oauthEmail ? `✓ ${user.oauthEmail}` : '✓ Đã liên kết')
                                                            : 'Chưa liên kết'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleLinkAccount('github')}
                                                disabled={user?.oauthProvider === 'github'}
                                                style={{
                                                    padding:'0.5rem 1rem', borderRadius:'0.5rem', 
                                                    background: user?.oauthProvider === 'github' ? 'rgba(74,222,128,0.15)' : 'var(--bg-card-hover)', 
                                                    color: user?.oauthProvider === 'github' ? '#4ade80' : 'var(--text-primary)', 
                                                    border: `1px solid ${user?.oauthProvider === 'github' ? 'rgba(74,222,128,0.3)' : 'var(--border)'}`, 
                                                    cursor: user?.oauthProvider === 'github' ? 'default' : 'pointer', 
                                                    fontSize:'0.875rem', fontWeight:500
                                                }}
                                            >
                                                {user?.oauthProvider === 'github' ? '✓ Đã liên kết' : 'Liên kết ngay'}
                                            </button>
                                        </div>

                                        {/* Facebook */}
                                        <div className="linked-account-item">
                                            <div className="linked-account-info">
                                                <div className="linked-icon" style={{background:'#1877F2', color:'white'}}>
                                                    <Facebook size={20} />
                                                </div>
                                                <div>
                                                    <h3 style={{fontSize:'1.125rem', fontWeight:600}}>Facebook</h3>
                                                    <p style={{fontSize:'0.875rem', color: user?.oauthProvider === 'facebook' ? '#4ade80' : '#6b7280'}}>
                                                        {user?.oauthProvider === 'facebook' 
                                                            ? (user?.oauthEmail ? `✓ ${user.oauthEmail}` : '✓ Đã liên kết')
                                                            : 'Chưa liên kết'}
                                                    </p>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => handleLinkAccount('facebook')}
                                                disabled={user?.oauthProvider === 'facebook'}
                                                style={{
                                                    padding:'0.5rem 1rem', borderRadius:'0.5rem', 
                                                    background: user?.oauthProvider === 'facebook' ? 'rgba(74,222,128,0.15)' : 'var(--bg-card-hover)', 
                                                    color: user?.oauthProvider === 'facebook' ? '#4ade80' : 'var(--text-primary)', 
                                                    border: `1px solid ${user?.oauthProvider === 'facebook' ? 'rgba(74,222,128,0.3)' : 'var(--border)'}`, 
                                                    cursor: user?.oauthProvider === 'facebook' ? 'default' : 'pointer', 
                                                    fontSize:'0.875rem', fontWeight:500
                                                }}
                                            >
                                                {user?.oauthProvider === 'facebook' ? '✓ Đã liên kết' : 'Liên kết ngay'}
                                            </button>
                                        </div>
                                        
                                        <div style={{marginTop:'1.5rem', padding:'1rem', borderRadius:'0.75rem', border:'1px solid rgba(59,130,246,0.3)', background:'rgba(59,130,246,0.1)', color:'#60a5fa', fontSize:'0.875rem', display:'flex', gap:'0.75rem'}}>
                                            <Shield size={20} style={{flexShrink:0}} />
                                            <p>Việc liên kết chỉ dùng để xác thực nhanh. Chúng tôi không thu thập bài đăng hay tin nhắn của bạn từ các nền tảng này.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
