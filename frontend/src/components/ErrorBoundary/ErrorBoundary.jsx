import React, { Component } from 'react'

/**
 * Error Boundary — catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI instead of crashing the entire app.
 */
class ErrorBoundary extends Component {
    constructor(props) {
        super(props)
        this.state = { hasError: false, error: null, errorInfo: null }
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error }
    }

    componentDidCatch(error, errorInfo) {
        this.setState({ errorInfo })
        console.error('ErrorBoundary caught:', error, errorInfo)
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null })
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{
                    padding: '40px 20px',
                    textAlign: 'center',
                    background: 'rgba(239, 68, 68, 0.05)',
                    border: '1px solid rgba(239, 68, 68, 0.2)',
                    borderRadius: '16px',
                    margin: '20px',
                    color: '#e2e8f0'
                }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>⚠️</div>
                    <h3 style={{ color: '#f87171', margin: '0 0 8px' }}>
                        {this.props.title || 'Đã xảy ra lỗi'}
                    </h3>
                    <p style={{ color: '#94a3b8', fontSize: '14px', margin: '0 0 20px' }}>
                        {this.props.message || 'Component không thể hiển thị. Vui lòng thử lại.'}
                    </p>
                    {process.env.NODE_ENV === 'development' && this.state.error && (
                        <pre style={{
                            textAlign: 'left',
                            padding: '12px',
                            background: 'rgba(0,0,0,0.3)',
                            borderRadius: '8px',
                            fontSize: '11px',
                            color: '#fca5a5',
                            overflow: 'auto',
                            maxHeight: '200px',
                            marginBottom: '16px'
                        }}>
                            {this.state.error.toString()}
                            {this.state.errorInfo?.componentStack}
                        </pre>
                    )}
                    <button
                        onClick={this.handleReset}
                        style={{
                            padding: '10px 24px',
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: '600'
                        }}
                    >
                        🔄 Thử lại
                    </button>
                </div>
            )
        }

        return this.props.children
    }
}

export default ErrorBoundary
