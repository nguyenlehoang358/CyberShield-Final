import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Save, Server, Shield, Brain, Bell, Settings2, RefreshCw } from 'lucide-react';
import './AdminSettings.css';

export default function AdminSettings() {
    const { lang } = useLanguage();
    const { api } = useAuth();
    
    // 1. Khởi tạo State với giá trị mặc định an toàn (Phòng thủ Crash)
    const [settings, setSettings] = useState({
        'general.maintenance_mode': 'false',
        'general.log_level': 'ALL',
        'general.default_lang': 'vi',
        'defense.auto_ban_threshold': '5',
        'defense.block_duration_minutes': '60',
        'defense.ip_whitelist': '127.0.0.1',
        'ai.sensitivity': 'MEDIUM',
        'ai.ollama_url': 'http://localhost:11434',
        'ai.ollama_model': 'qwen2.5:0.5b',
        'ai.auto_resolve': 'true',
        'alert.admin_emails': 'admin@cybershield.local',
        'alert.webhook_url': ''
    });

    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);
    const [hasChanges, setHasChanges] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        setIsLoading(true);
        try {
            const res = await api.get('/admin/settings');
            // Gộp dữ liệu một cách an toàn
            const newSettings = { ...settings };
            if (Array.isArray(res.data)) {
                res.data.forEach(item => {
                    if (item?.settingKey) {
                        newSettings[item.settingKey] = item.settingValue || '';
                    }
                });
            }
            setSettings(newSettings);
            setHasChanges(false);
        } catch (error) {
            console.error("Failed to load settings:", error);
            // Vẫn giữ UI không crash nhờ giá trị mặc định đã khai báo sẵn
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = async (e) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            await api.put('/admin/settings', settings);
            setHasChanges(false);
            alert(lang === 'vi' ? '✅ Lưu cấu hình thành công!' : '✅ Settings saved successfully!');
        } catch (error) {
            console.error("Failed to save settings:", error);
            alert(lang === 'vi' ? '❌ Lưu thất bại!' : '❌ Save failed!');
        } finally {
            setIsSaving(false);
        }
    };

    const testWebhook = async () => {
        setIsTesting(true);
        try {
            await api.post('/admin/settings/test-webhook');
            alert(lang === 'vi' ? '📨 Đã gửi tin nhắn test!' : '📨 Test notification sent!');
        } catch (error) {
            console.error("Failed to test webhook:", error);
            alert(lang === 'vi' ? '❌ Gửi test thất bại!' : '❌ Test failed!');
        } finally {
            setIsTesting(false);
        }
    };

    // 2. Xử lý trạng thái Loading
    if (isLoading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', color: '#60a5fa' }}>
                <RefreshCw className="spin-animation" size={40} style={{ marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
                <h3 className="neon-text">Đang tải cấu hình hệ thống...</h3>
            </div>
        );
    }

    return (
        <div className="admin-settings-fullview animate-fade-in" style={{ padding: '1rem' }}>
            {/* Header */}
            <div style={{ paddingBottom: '2rem', borderBottom: '1px solid var(--border-light)', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 className="neon-text" style={{ fontSize: '1.8rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Settings2 size={28} /> {lang === 'vi' ? 'Cài đặt Hệ thống' : 'System Settings'}
                    </h2>
                    <p style={{ color: '#94a3b8', marginTop: '0.5rem' }}>
                        {lang === 'vi' ? 'Tùy chỉnh linh hoạt các cấu hình bảo vệ cho CyberShield.' : 'Manage core protection configs for CyberShield.'}
                    </p>
                </div>
                {hasChanges && (
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        style={{ 
                            padding: '12px 24px', background: 'linear-gradient(135deg, #10b981, #059669)', 
                            border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 'bold', 
                            cursor: isSaving ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', gap: '10px',
                            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)'
                        }}>
                        {isSaving ? <RefreshCw className="spin-animation" size={18} /> : <Save size={18} />}
                        {isSaving ? (lang === 'vi' ? 'Đang lưu...' : 'Saving...') : (lang === 'vi' ? 'Lưu Thay đổi' : 'Save Changes')}
                    </button>
                )}
            </div>

            {/* 3. Phân chia Grid section gọn gàng, bind dữ liệu OR an toàn */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
                
                {/* General Settings */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                        <Server size={20} color="#60a5fa" /> Thông tin Vận hành
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <label style={{ color: 'var(--text-secondary)', fontWeight: '600', display: 'block' }}>Chế độ Bảo trì (Maintenance)</label>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Khóa luồng ngoài khi có sự cố</span>
                            </div>
                            <label className="ui-switch">
                                <input type="checkbox" 
                                    checked={settings?.['general.maintenance_mode'] === 'true'} 
                                    onChange={(e) => handleChange('general.maintenance_mode', e.target.checked ? 'true' : 'false')} 
                                    disabled={isSaving} />
                                <span className="slider"></span>
                            </label>
                        </div>
                        
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Mức độ Ghi Log (Log Level)</label>
                            <select 
                                value={settings?.['general.log_level'] || 'ALL'} 
                                onChange={(e) => handleChange('general.log_level', e.target.value)}
                                disabled={isSaving}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', outline: 'none' }}
                            >
                                <option value="ALL">Theo dõi Toàn bộ (ALL)</option>
                                <option value="DANGER_ONLY">Chỉ cảnh báo Nguy hiểm (DANGER)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Firewall Settings */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                        <Shield size={20} color="#f43f5e" /> Tùy chọn Tường lửa
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Số lần Fail tối đa trước khi khóa IP</label>
                            <input type="number" 
                                value={settings?.['defense.auto_ban_threshold'] || '5'} 
                                onChange={(e) => handleChange('defense.auto_ban_threshold', e.target.value)}
                                disabled={isSaving}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                        
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Thời gian Phạt Khóa (Phút)</label>
                            <input type="number" 
                                value={settings?.['defense.block_duration_minutes'] || '60'} 
                                onChange={(e) => handleChange('defense.block_duration_minutes', e.target.value)}
                                disabled={isSaving}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                    </div>
                </div>

                {/* AI Configuration */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                        <Brain size={20} color="#a855f7" /> Engine Cốt lõi (AI)
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Độ nhạy Cảnh báo (AI Sensitivity)</label>
                            <select 
                                value={settings?.['ai.sensitivity'] || 'MEDIUM'} 
                                onChange={(e) => handleChange('ai.sensitivity', e.target.value)}
                                disabled={isSaving}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', outline: 'none' }}
                            >
                                <option value="LOW">Thấp (Chỉ thông báo khi rất nghiêm trọng)</option>
                                <option value="MEDIUM">Vừa (Đề xuất)</option>
                                <option value="HIGH">Tuýt còi mọi hành động nhỏ (High)</option>
                            </select>
                        </div>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <label style={{ color: 'var(--text-secondary)', fontWeight: '600', display: 'block' }}>Quyền Tự quyết (Auto-Resolve)</label>
                                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cho phép AI tự đóng cảnh báo giả</span>
                            </div>
                            <label className="ui-switch">
                                <input type="checkbox" 
                                    checked={settings?.['ai.auto_resolve'] === 'true'} 
                                    onChange={(e) => handleChange('ai.auto_resolve', e.target.checked ? 'true' : 'false')} 
                                    disabled={isSaving} />
                                <span className="slider"></span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Notifications */}
                <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1.5rem' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-primary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-light)', paddingBottom: '10px' }}>
                        <Bell size={20} color="#f59e0b" /> Cảnh báo (Alerts)
                    </h3>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Webhook Discord URL</label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input type="text" 
                                    placeholder="https://discord.com/api/webhooks/..."
                                    value={settings?.['alert.webhook_url'] || ''} 
                                    onChange={(e) => handleChange('alert.webhook_url', e.target.value)}
                                    disabled={isSaving}
                                    style={{ flex: 1, padding: '12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', outline: 'none' }} />
                                <button 
                                    onClick={testWebhook}
                                    disabled={isTesting || isSaving}
                                    style={{ padding: '0 15px', background: 'var(--bg-card-hover)', border: '1px solid var(--border-light)', borderRadius: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                    title="Kiểm tra tin nhắn">
                                    {isTesting ? <RefreshCw className="spin-animation" size={18} /> : 'Test'}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label style={{ color: 'var(--text-secondary)', fontWeight: '600', display: 'block', marginBottom: '8px' }}>Admin Emails (Nhận báo cáo hàng ngày)</label>
                            <input type="email" 
                                value={settings?.['alert.admin_emails'] || ''} 
                                onChange={(e) => handleChange('alert.admin_emails', e.target.value)}
                                disabled={isSaving}
                                style={{ width: '100%', padding: '12px', borderRadius: '8px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', color: 'var(--text-primary)', outline: 'none' }} />
                        </div>
                    </div>
                </div>

            </div>

            <style>{`
                @keyframes spin { 100% { transform: rotate(360deg); } }
                .ui-switch { position: relative; display: inline-block; width: 44px; height: 24px; }
                .ui-switch input { opacity: 0; width: 0; height: 0; }
                .slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: var(--border-light); transition: .4s; border-radius: 24px; }
                .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; }
                input:checked + .slider { background-color: #3b82f6; }
                input:checked + .slider:before { transform: translateX(20px); }
                input:disabled + .slider { opacity: 0.5; cursor: not-allowed; }
            `}</style>
        </div>
    );
}
