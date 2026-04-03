import React, { useState, useRef, useEffect, useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { useLanguage } from '../../context/LanguageContext'
import './SupportChatWidget.css'

const translations = {
    vi: {
        title: 'CyberShield Assistant',
        subtitle: 'Trợ lý ảo HTTT CyberShield',
        placeholder: 'Nhập câu hỏi của bạn...',
        send: 'Gửi',
        thinking: 'Đang tìm kiếm & phân tích...',
        welcome: `Xin chào! 👋 Tôi là trợ lý AI của hệ thống CyberShield.

🧠 Tôi được thiết kế để hỗ trợ bạn trải nghiệm và sử dụng hệ thống một cách hiệu quả nhất.

• Hướng dẫn sử dụng hệ thống
• Xử lý sự cố kỹ thuật
• Trả lời FAQ
• Thông tin về CyberShield

Hãy hỏi tôi bất cứ điều gì!`,
        errorMsg: 'Xin lỗi, có lỗi xảy ra. Vui lòng thử lại.',
        offlineMsg: 'AI Assistant đang offline. Kết nối Ollama để sử dụng.',
        clear: 'Xóa hội thoại',
        minimize: 'Thu nhỏ',
        sources: 'Nguồn tham khảo',
        ragBadge: 'RAG',
        directBadge: 'Direct',
        copiedMsg: 'Đã copy!',
        responseTime: 'Thời gian phản hồi',
        rateLimited: 'Quá nhiều yêu cầu. Vui lòng chờ vài giây rồi thử lại.',
    },
    en: {
        title: 'CyberShield Assistant',
        subtitle: 'CyberShield Virtual Assistant',
        placeholder: 'Type your question...',
        send: 'Send',
        thinking: 'Searching & analyzing...',
        welcome: `Hello! 👋 I'm the CyberShield AI Assistant.

🧠 I am designed to assist you in experiencing and navigating the system efficiently.

• System usage guidelines
• Technical troubleshooting
• FAQ support
• CyberShield information

Ask me anything!`,
        errorMsg: 'Sorry, an error occurred. Please try again.',
        offlineMsg: 'AI Assistant is offline. Connect Ollama to use.',
        clear: 'Clear chat',
        minimize: 'Minimize',
        sources: 'Sources',
        ragBadge: 'RAG',
        directBadge: 'Direct',
        copiedMsg: 'Copied!',
        responseTime: 'Response time',
        rateLimited: 'Too many requests. Please wait a moment and try again.',
    }
}

/**
 * Simple markdown-like renderer for chat bubbles.
 * Supports: **bold**, *italic*, `code`, ```codeblock```, - lists, links
 */
function renderMarkdown(text) {
    if (!text) return null

    const lines = text.split('\n')
    const elements = []
    let codeBlock = null
    let codeLines = []

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i]

        // Code block start/end
        if (line.trim().startsWith('```')) {
            if (codeBlock !== null) {
                // End code block
                elements.push(
                    <pre key={`code-${i}`} className="support-chat-codeblock">
                        <code>{codeLines.join('\n')}</code>
                    </pre>
                )
                codeBlock = null
                codeLines = []
            } else {
                // Start code block
                codeBlock = line.trim().replace('```', '') || 'text'
                codeLines = []
            }
            continue
        }

        if (codeBlock !== null) {
            codeLines.push(line)
            continue
        }

        // Format inline text
        let formatted = line
            // Bold: **text**
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            // Italic: *text*
            .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>')
            // Inline code: `text`
            .replace(/`([^`]+)`/g, '<code class="support-chat-inline-code">$1</code>')
            // Links: [text](url)
            .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')

        if (line.trim() === '') {
            elements.push(<div key={i} className="support-chat-spacer" />)
        } else if (line.trim().startsWith('• ') || line.trim().startsWith('- ')) {
            elements.push(
                <div key={i} className="support-chat-list-item"
                    dangerouslySetInnerHTML={{ __html: '• ' + formatted.replace(/^[•\-]\s*/, '') }} />
            )
        } else if (/^\d+[.)]\s/.test(line.trim())) {
            elements.push(
                <div key={i} className="support-chat-list-item support-chat-list-item--numbered"
                    dangerouslySetInnerHTML={{ __html: formatted }} />
            )
        } else {
            elements.push(
                <span key={i} dangerouslySetInnerHTML={{ __html: formatted + (i < lines.length - 1 ? '<br/>' : '') }} />
            )
        }
    }

    // Handle unclosed code block
    if (codeBlock !== null && codeLines.length > 0) {
        elements.push(
            <pre key="code-end" className="support-chat-codeblock">
                <code>{codeLines.join('\n')}</code>
            </pre>
        )
    }

    return elements
}

export default function SupportChatWidget() {
    const location = useLocation()
    const { lang: language } = useLanguage()
    const t = translations[language] || translations.vi

    const currentIP = window.location.hostname
    const apiBase = (currentIP === 'localhost' || currentIP === '127.0.0.1') ? '' : `https://${currentIP}:8443`

    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        { role: 'assistant', content: t.welcome, timestamp: new Date() }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isOnline, setIsOnline] = useState(null)
    const [docCount, setDocCount] = useState(0)
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)
    const abortControllerRef = useRef(null)

    if (location.pathname.startsWith('/lab')) {
        return null; // hide on lab pages
    }

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus()
        }
    }, [isOpen])

    useEffect(() => {
        const controller = new AbortController()
        checkHealth(controller.signal)
        return () => {
            controller.abort()
            if (abortControllerRef.current) {
                abortControllerRef.current.abort()
            }
        }
    }, [])

    const checkHealth = async (signal) => {
        try {
            const res = await fetch(`${apiBase}/api/ai/status`, { signal })
            if (res.ok) {
                const data = await res.json()
                setIsOnline(data.status === 'OK')
                setDocCount(data.totalDocuments || 0)
            } else {
                setIsOnline(false)
            }
        } catch (err) {
            if (err.name === 'AbortError') return
            // Fallback to system-health endpoint
            try {
                const res = await fetch(`${apiBase}/api/public/system-health`, { signal })
                const data = await res.json()
                setIsOnline(data.ollama?.status === 'UP')
            } catch (fallbackErr) {
                if (fallbackErr.name === 'AbortError') return
                setIsOnline(false)
            }
        }
    }

    const sendMessage = useCallback(async () => {
        const trimmed = input.trim()
        if (!trimmed || isLoading) return

        const userMsg = { role: 'user', content: trimmed, timestamp: new Date() }
        setMessages(prev => [...prev, userMsg])
        setInput('')
        setIsLoading(true)

        if (abortControllerRef.current) {
            abortControllerRef.current.abort() // Cancel previous request if any
        }
        abortControllerRef.current = new AbortController();

        try {
            const token = localStorage.getItem('token')
            const res = await fetch(`${apiBase}/api/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({
                    message: trimmed,
                    sessionId: getSessionId(),
                    mode: 'support'
                }),
                signal: abortControllerRef.current.signal
            })

            if (res.status === 429) {
                const data = await res.json().catch(() => ({}))
                const retryAfter = data.retryAfter || 30
                setMessages(prev => [...prev, {
                    role: 'assistant',
                    content: `${t.rateLimited} (${retryAfter}s)`,
                    timestamp: new Date(),
                    isError: true
                }])
                return
            }

            if (!res.ok) throw new Error(`HTTP ${res.status}`)
            const data = await res.json()

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: data.response || data.message || t.errorMsg,
                timestamp: new Date(),
                sources: data.sources || [],
                ragEnabled: data.ragEnabled || false,
                sourcesCount: data.sourcesCount || 0,
                responseTimeMs: data.responseTimeMs || 0,
                model: data.model || 'unknown'
            }])
        } catch (err) {
            if (err.name === 'AbortError') return;
            console.error('AI Chat error:', err)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: isOnline === false ? t.offlineMsg : t.errorMsg,
                timestamp: new Date(),
                isError: true
            }])
        } finally {
            setIsLoading(false)
        }
    }, [input, isLoading, isOnline, t])

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    const clearChat = async () => {
        const sessionId = getSessionId()
        setMessages([{ role: 'assistant', content: t.welcome, timestamp: new Date() }])
        // Also clear server-side history
        try {
            const token = localStorage.getItem('token')
            await fetch(`${apiBase}/api/ai/clear?sessionId=${sessionId}`, {
                method: 'POST',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            })
        } catch { /* ignore */ }
        // New session
        sessionStorage.removeItem('ai_chat_session')
    }

    const getSessionId = () => {
        let sid = sessionStorage.getItem('ai_chat_session')
        if (!sid) {
            sid = 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 9)
            sessionStorage.setItem('ai_chat_session', sid)
        }
        return sid
    }

    const formatTime = (date) => {
        return new Date(date).toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', {
            hour: '2-digit', minute: '2-digit'
        })
    }

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text)
    }

    return (
        <>
            {/* Floating Chat Button */}
            <button
                className={`support-chat-fab ${isOpen ? 'support-chat-fab--open' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
                aria-label="AI Chat"
                id="support-chat-toggle"
            >
                {isOpen ? (
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                ) : (
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
                        <line x1="10" y1="22" x2="14" y2="22" /><line x1="9" y1="9" x2="9.01" y2="9" />
                        <line x1="15" y1="9" x2="15.01" y2="9" />
                        <path d="M9.5 13a3.5 3.5 0 0 0 5 0" />
                    </svg>
                )}
                {isOnline !== null && (
                    <span className={`support-chat-fab__status ${isOnline ? 'online' : 'offline'}`} />
                )}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="support-chat-window" id="support-chat-window">
                    {/* Header */}
                    <div className="support-chat-header">
                        <div className="support-chat-header__info">
                            <div className="support-chat-header__avatar">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <path d="M12 2a7 7 0 0 1 7 7c0 2.38-1.19 4.47-3 5.74V17a2 2 0 0 1-2 2H10a2 2 0 0 1-2-2v-2.26C6.19 13.47 5 11.38 5 9a7 7 0 0 1 7-7z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="support-chat-header__title">{t.title}</h4>
                                <div className="support-chat-header__meta">
                                    <span className={`support-chat-header__status ${isOnline ? 'online' : 'offline'}`}>
                                        {isOnline ? '● Online' : '○ Offline'}
                                    </span>
                                    {docCount > 0 && (
                                        <span className="support-chat-header__docs">
                                            📚 {docCount} docs
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="support-chat-header__actions">
                            <button onClick={clearChat} title={t.clear} className="support-chat-header__btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-2 14H7L5 6" />
                                    <path d="M10 11v6" /><path d="M14 11v6" />
                                </svg>
                            </button>
                            <button onClick={() => setIsOpen(false)} title={t.minimize} className="support-chat-header__btn">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <line x1="5" y1="12" x2="19" y2="12" />
                                </svg>
                            </button>
                        </div>
                    </div>

                    {/* Messages */}
                    <div className="support-chat-messages">
                        {messages.map((msg, i) => (
                            <div key={i} className={`support-chat-msg support-chat-msg--${msg.role} ${msg.isError ? 'support-chat-msg--error' : ''}`}>
                                <div className="support-chat-msg__bubble">
                                    <div className="support-chat-msg__content">
                                        {renderMarkdown(msg.content)}
                                    </div>

                                    {/* Source References */}
                                    {msg.sources && msg.sources.length > 0 && (
                                        <div className="support-chat-sources">
                                            <div className="support-chat-sources__title">
                                                📎 {t.sources} ({msg.sources.length})
                                            </div>
                                            {msg.sources.map((src, j) => (
                                                <div key={j} className="support-chat-source-item">
                                                    <span className="support-chat-source-item__title">{src.title}</span>
                                                    <span className="support-chat-source-item__meta">
                                                        {src.category} · {src.similarity}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Footer: time + badges */}
                                    <div className="support-chat-msg__footer">
                                        <span className="support-chat-msg__time">{formatTime(msg.timestamp)}</span>
                                        {msg.role === 'assistant' && msg.ragEnabled !== undefined && (
                                            <span className={`support-chat-msg__badge ${msg.ragEnabled ? 'rag' : 'direct'}`}>
                                                {msg.ragEnabled ? '🧠 RAG' : '⚡ Direct'}
                                            </span>
                                        )}
                                        {msg.responseTimeMs > 0 && (
                                            <span className="support-chat-msg__time">
                                                {(msg.responseTimeMs / 1000).toFixed(1)}s
                                            </span>
                                        )}
                                        {msg.role === 'assistant' && !msg.isError && i > 0 && (
                                            <button
                                                className="support-chat-msg__copy"
                                                onClick={() => copyToClipboard(msg.content)}
                                                title="Copy"
                                            >
                                                📋
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="support-chat-msg support-chat-msg--assistant">
                                <div className="support-chat-msg__bubble support-chat-msg__bubble--loading">
                                    <div className="support-chat-typing">
                                        <span></span><span></span><span></span>
                                    </div>
                                    <span className="support-chat-msg__thinking">{t.thinking}</span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="support-chat-input">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder={t.placeholder}
                            rows={1}
                            className="support-chat-input__field"
                            disabled={isLoading}
                            id="support-chat-input"
                        />
                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || isLoading}
                            className="support-chat-input__send"
                            id="support-chat-send"
                        >
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" />
                            </svg>
                        </button>
                    </div>
                </div>
            )}
        </>
    )
}
