import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';

export default function OAuth2RedirectHandler() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { setUser, api } = useAuth();

    useEffect(() => {
        const handleOAuth2Callback = async () => {
            const token = searchParams.get('token');
            const error = searchParams.get('error');
            const isLinked = searchParams.get('linked') === 'true';

            if (token) {
                localStorage.setItem('token', token);
                try {
                    const res = await api.get('/auth/me', {
                        headers: { Authorization: `Bearer ${token}` }
                    });

                    if (setUser) setUser(res.data);

                    if (isLinked) {
                        // Luồng Liên kết tài khoản → về Profile
                        toast.success('✅ Liên kết tài khoản thành công!');
                        navigate('/profile', { replace: true });
                    } else if (res.data.roles && res.data.roles.includes('ROLE_ADMIN')) {
                        // Luồng Đăng nhập Admin
                        toast.success('Đăng nhập OAuth thành công (Admin)');
                        navigate('/dashboard', { replace: true });
                    } else {
                        // Luồng Đăng nhập User thường
                        toast.success('Đăng nhập thành công!');
                        navigate('/profile', { replace: true });
                    }
                } catch (err) {
                    console.error("Token provided but failed to fetch user", err);
                    localStorage.removeItem('token');
                    toast.error('Lỗi xác thực sau khi đăng nhập OAuth.');
                    navigate('/login?error=auth_failed_after_oauth', { replace: true });
                }
            } else {
                console.error("OAuth2 Error:", error || "No token found");
                toast.error(error || 'Đăng nhập OAuth thất bại.');
                navigate('/login?error=' + (error || "oauth2_failed"), { replace: true });
            }
        };

        handleOAuth2Callback();
    }, [searchParams, navigate, api, setUser]);

    return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0a0a1a', color: '#fff' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                <i className='bx bx-loader-alt bx-spin' style={{ fontSize: '2.5rem', color: '#3b82f6' }}></i>
                <div style={{ fontSize: '1.25rem', fontWeight: 600 }}>Đang hoàn tất xác thực...</div>
                <p style={{ color: '#9ca3af' }}>Vui lòng chờ trong giây lát</p>
            </div>
        </div>
    );
}
