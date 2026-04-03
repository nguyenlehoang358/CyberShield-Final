import React from 'react';
import { Link } from 'react-router-dom';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '3rem', textAlign: 'center', minHeight: '50vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#f85149' }}>Oops! Rất tiếc, đã có lỗi xảy ra.</h2>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>Thao tác quá nhanh nảy sinh lỗi hiển thị tải trang. Vui lòng tải lại.</p>
                    <button 
                        onClick={() => window.location.reload()} 
                        style={{ padding: '0.75rem 1.5rem', background: 'var(--accent)', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
                    >
                        Tải lại trang
                    </button>
                    <Link to="/" style={{ marginTop: '1rem', color: 'var(--accent)', textDecoration: 'underline' }}>
                        Hoặc quay về Trang chủ
                    </Link>
                </div>
            );
        }

        return this.props.children; 
    }
}

export default ErrorBoundary;
