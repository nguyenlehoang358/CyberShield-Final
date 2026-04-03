import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function MfaModal({ isOpen, mode, tempToken, onClose, onSuccess }) {
    const { t } = useLanguage();
    const { verifyMfa, api } = useAuth();
    const [code, setCode] = useState(['', '', '', '', '', '']);
    const [qrUrl, setQrUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const inputRefs = useRef([]);

    useEffect(() => {
        if (isOpen && mode === 'setup') {
            api.post('/auth/mfa/setup')
                .then(res => setQrUrl(res.data.qrCodeUrl))
                .catch(err => toast.error("Failed to load QR Code"));
        }
    }, [isOpen, mode, api]);

    if (!isOpen) return null;

    const handleChange = (e, index) => {
        const value = e.target.value;
        if (isNaN(value)) return;

        const newCode = [...code];
        if (value.length > 1) { // Handle Paste
            const pastedData = value.substring(0, 6).split('');
            for (let i = 0; i < 6; i++) {
                newCode[i] = pastedData[i] || '';
            }
            setCode(newCode);
            const lastFilled = pastedData.length - 1;
            inputRefs.current[Math.min(lastFilled + 1, 5)]?.focus();
        } else { // Handle Single Input
            newCode[index] = value;
            setCode(newCode);
            if (value && index < 5) {
                inputRefs.current[index + 1]?.focus();
            }
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace') {
            if (!code[index] && index > 0) {
                inputRefs.current[index - 1]?.focus();
            }
        }
    };

    const handleSubmit = async () => {
        const optString = code.join('');
        if (optString.length !== 6) return;

        setLoading(true);
        try {
            if (mode === 'verify') {
                const res = await verifyMfa(tempToken, parseInt(optString));
                if (res.success) {
                    onSuccess(res);
                }
            } else if (mode === 'setup') {
                await api.post('/auth/mfa/enable', { code: parseInt(optString) });
                toast.success("MFA Enabled successfully!");
                onSuccess();
            }
        } catch (err) {
            toast.error(t('mfa_error_invalid') || "Invalid verification code");
            setCode(['', '', '', '', '', '']);
            inputRefs.current[0]?.focus();
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm px-4" style={{ background: 'rgba(13, 13, 43, 0.4)' }}>
            <div className="rounded-xl shadow-2xl w-full max-w-md p-8 relative transform transition-all scale-100" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                <div className="text-center mb-6">
                    <div className="mx-auto bg-blue-500/10 text-blue-500 w-16 h-16 rounded-full flex items-center justify-center mb-4">
                        <i className='bx bx-shield-quarter text-4xl'></i>
                    </div>
                    <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
                        {mode === 'setup' ? (t('mfa_setup_title') || 'SETUP 2FA') : (t('mfa_verify_title') || 'SECURITY VERIFICATION')}
                    </h2>
                    <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                        {mode === 'setup' ? (t('mfa_setup_desc') || 'Scan QR with Authenticator app') : (t('mfa_verify_desc') || 'Enter 6 digits')}
                    </p>
                </div>

                {mode === 'setup' && qrUrl && (
                    <div className="flex justify-center mb-8 bg-white p-4 rounded-xl w-max mx-auto shadow-inner">
                        <QRCodeSVG value={qrUrl} size={160} />
                    </div>
                )}

                <div className="flex justify-between gap-1 sm:gap-2 mb-8">
                    {code.map((digit, i) => (
                        <input
                            key={i}
                            ref={el => inputRefs.current[i] = el}
                            type="text"
                            inputMode="numeric"
                            maxLength={6}
                            value={digit}
                            onChange={(e) => handleChange(e, i)}
                            onKeyDown={(e) => handleKeyDown(e, i)}
                            className="w-10 sm:w-12 h-12 sm:h-14 text-center text-xl sm:text-2xl font-bold rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
                        />
                    ))}
                </div>

                <div className="flex flex-col gap-3">
                    <button
                        onClick={handleSubmit}
                        disabled={loading || code.join('').length !== 6}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-lg transition-colors flex justify-center items-center"
                    >
                        {loading ? <i className='bx bx-loader-alt bx-spin text-xl'></i> : (t('auth_confirm') || 'VERIFY')}
                    </button>
                    <button
                        onClick={onClose}
                        className="btn-back-login"
                        style={{ marginTop: '0.5rem' }}
                    >
                        {t('mfa_cancel') || 'Cancel'}
                    </button>
                </div>
            </div>
        </div>
    );
}
