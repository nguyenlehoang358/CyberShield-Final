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
            setAlerts(res.data || []);
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
        <div className="partner-security-monitor">
            <div className="admin-table-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ color: 'var(--text-primary)', margin: 0 }}>
                        {lang === 'vi' ? 'Giám sát An ninh Mạng lưới (SOC)' : 'Network Security Monitoring (SOC)'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>
                        {lang === 'vi' ? 'Theo dõi các cuộc tấn công thời gian thực từ website đối tác.' : 'Real-time monitoring of security threats from external partner sites.'}
                    </p>
                </div>
                <div className="active-badge" style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#22c55e', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.8rem', border: '1px solid rgba(34, 197, 94, 0.2)' }}>
                   ● {lang === 'vi' ? 'Đang bảo vệ 24/7' : '24/7 Protection Active'}
                </div>
            </div>

            <div className="admin-table-wrapper" style={{ animation: 'fadeIn 0.5s ease-out' }}>
                <div className="admin-table-scroll">
                    <table className="admin-data-table">
                        <thead>
                            <tr>
                                <th>{lang === 'vi' ? 'Thời gian' : 'Time'}</th>
                                <th>{lang === 'vi' ? 'Loại tấn công' : 'Attack Type'}</th>
                                <th>{lang === 'vi' ? 'Payload (Mã độc)' : 'Payload'}</th>
                                <th>{lang === 'vi' ? 'IP Kẻ tấn công' : 'Attacker IP'}</th>
                                <th>{lang === 'vi' ? 'Đường dẫn mục tiêu' : 'Target Path'}</th>
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
