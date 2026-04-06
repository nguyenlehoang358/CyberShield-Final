import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { toast } from 'sonner';

/**
 * [CYBERSHIELD PARTNER SECURITY MONITOR]
 * Giao diện giám sát an ninh mạng lưới đối tác (SECaaS Dashboard)
 */
export default function PartnerSecurityMonitor() {
    const { api } = useAuth();
    const { lang } = useLanguage();
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadAlerts();
        // Tự động làm mới dữ liệu mỗi 10 giây để demo hiệu ứng "Thời gian thực"
        const interval = setInterval(loadAlerts, 10000);
        return () => clearInterval(interval);
    }, []);

    const loadAlerts = async () => {
        try {
            const res = await api.get('/v1/external/alerts');
            const newAlerts = res.data || [];
            
            // Nếu có cảnh báo mới hơn so với dữ liệu cũ, bắn Toast thông báo ngay!
            if (alerts.length > 0 && newAlerts.length > alerts.length) {
                const latest = newAlerts[0];
                toast.error(`🚀 CẢNH BÁO SOC: Phát hiện cuộc tấn công ${latest.attackType} từ trang web đối tác!`, {
                    description: `Mã độc: ${latest.payload.substring(0, 30)}...`,
                    duration: 5000,
                    style: { background: '#7f1d1d', color: '#fff', border: '1px solid #ef4444' }
                });
                // Bạn có thể thêm lệnh phát âm thanh cảnh báo tại đây nếu muốn
            }
            
            setAlerts(newAlerts);
        } catch (err) {
            console.error('Failed to load partner alerts', err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (iso) => {
        if (!iso) return '-';
        return new Date(iso).toLocaleString(lang === 'vi' ? 'vi-VN' : 'en-US');
    };

    return (
        <div className="partner-security-monitor" style={{ width: '100%', minHeight: '80vh' }}>
            <div className="admin-table-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ color: 'var(--text-primary)', margin: 0, fontSize: '1.8rem', fontWeight: '800' }}>
                        {lang === 'vi' ? '📍 Trung tâm Điều hành An ninh Mạng lưới (SOC)' : 'Network Security SOC Central'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '0.5rem' }}>
                        {lang === 'vi' ? 'Giám sát và ngăn chặn các cuộc tấn công xuyên biên giới đến hệ thống đối tác.' : 'Monitoring and neutralizing cross-border attacks on partner systems.'}
                    </p>
                </div>
                <div className="active-badge" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '0.7rem 1.2rem', borderRadius: '30px', fontSize: '0.9rem', fontWeight: 'bold', border: '1px solid rgba(34, 197, 94, 0.2)', boxShadow: '0 0 15px rgba(34, 197, 94, 0.2)' }}>
                   ● {lang === 'vi' ? 'Hệ thống Đang bảo vệ 24/7' : '24/7 Shield Active'}
                </div>
            </div>

            <div className="admin-table-wrapper" style={{ width: '100%', animation: 'fadeIn 0.5s ease-out', border: '1px solid var(--border-color)', borderRadius: '16px', overflow: 'hidden', background: 'var(--bg-card)' }}>
                <div className="admin-table-scroll" style={{ maxHeight: '70vh' }}>
                    <table className="admin-data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead style={{ background: 'rgba(255,255,255,0.03)' }}>
                            <tr>
                                <th style={{ padding: '1.2rem', textAlign: 'left' }}>{lang === 'vi' ? 'Thời gian' : 'Time'}</th>
                                <th style={{ padding: '1.2rem', textAlign: 'left' }}>{lang === 'vi' ? 'Loại tấn công' : 'Attack Type'}</th>
                                <th style={{ padding: '1.2rem', textAlign: 'left' }}>{lang === 'vi' ? 'Dữ liệu độc hại (Payload)' : 'Payload'}</th>
                                <th style={{ padding: '1.2rem', textAlign: 'left' }}>{lang === 'vi' ? 'Nguồn (IP)' : 'Source IP'}</th>
                                <th style={{ padding: '1.2rem', textAlign: 'left' }}>{lang === 'vi' ? 'Mục tiêu' : 'Target'}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Loading threats...</td></tr>
                            ) : alerts.length === 0 ? (
                                <tr>
                                    <td colSpan="5" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                                        <i className='bx bx-check-shield' style={{ fontSize: '3rem', display: 'block', marginBottom: '1rem', color: '#22c55e' }}></i>
                                        {lang === 'vi' ? 'Hiện tại không có mối đe dọa nào được phát hiện.' : 'No security threats detected at the moment.'}
                                    </td>
                                </tr>
                            ) : (
                                alerts.map((alert) => (
                                    <tr key={alert.id} className="threat-row" style={{ borderLeft: alert.attackType?.includes('XSS') ? '4px solid #ef4444' : '4px solid #f59e0b' }}>
                                        <td style={{ fontSize: '0.85rem' }}>{formatDate(alert.timestamp)}</td>
                                        <td>
                                            <span className={`admin-status ${alert.attackType?.includes('XSS') ? 'locked' : 'pending'}`} style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>
                                                {alert.attackType}
                                            </span>
                                        </td>
                                        <td>
                                            <code style={{ background: 'rgba(0,0,0,0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.8rem', color: '#fca5a5' }}>
                                                {alert.payload}
                                            </code>
                                        </td>
                                        <td style={{ fontFamily: 'monospace' }}>{alert.attackerIp}</td>
                                        <td style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                                            {alert.targetPath?.substring(0, 50)}...
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <style dangerouslySetInnerHTML={{ __html: `
                .threat-row:hover {
                    background: rgba(239, 68, 68, 0.05) !important;
                }
                .threat-row {
                    transition: background 0.3s;
                    animation: slideInRight 0.3s ease-out forwards;
                }
                @keyframes slideInRight {
                    from { transform: translateX(20px); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `}} />
        </div>
    );
}
