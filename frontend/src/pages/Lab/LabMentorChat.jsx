import React, { useState, useRef, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../context/LanguageContext'
import { Send, Bot, User, Loader2, Sparkles, Trash2 } from 'lucide-react'
import { useLab } from '../../context/LabContext'

export default function LabMentorChat({ labId, labContext }) {
    const { api, user } = useAuth()
    const { t, lang } = useLanguage()
    const { autoFill } = useLab()
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const messagesEndRef = useRef(null)
    const chatContainerRef = useRef(null)
    const inputRef = useRef(null)

    // Auto-scroll to bottom of the chat container
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages])

    // Welcome message on mount or labId change
    useEffect(() => {
        const welcome = lang === 'vi'
            ? `Chào ${user?.fullName || 'bạn'}! 👋\n\nTôi là **CyberShield Lab Mentor** — trợ lý AI sẽ hướng dẫn bạn trong bài thực hành **${labId?.toUpperCase() || 'Lab'}**.\n\n💡 Hãy thử nhập payload, sau đó hỏi tôi nếu bạn cần gợi ý!`
            : `Hi ${user?.fullName || 'there'}! 👋\n\nI'm the **CyberShield Lab Mentor** — your AI assistant for the **${labId?.toUpperCase() || 'Lab'}** exercise.\n\n💡 Try a payload first, then ask me for hints!`
        setMessages([{ role: 'mentor', text: welcome, ts: Date.now() }])
    }, [labId, lang])

    const handleSend = async () => {
        const msg = input.trim()
        if (!msg || loading) return

        // Add user message
        setMessages(prev => [...prev, { role: 'user', text: msg, ts: Date.now() }])
        setInput('')
        setLoading(true)

        try {
            const res = await api.post('/ai/lab/chat', {
                message: msg,
                labContext: labContext || '',
                labId: labId || ''
            })

            const aiReply = typeof res.data === 'string' ? res.data : (res.data.reply || JSON.stringify(res.data));

            setMessages(prev => [...prev, {
                role: 'mentor',
                text: aiReply,
                ts: Date.now()
            }])

            // 🔧 Auto-Fill: Nếu AI trả về code block hoặc marker FILL_FORM, tự động điền vào Lab input
            tryAutoFill(aiReply)
        } catch (err) {
            const errMsg = err?.response?.status === 429
                ? (lang === 'vi' ? '⏳ Hệ thống Mentor đang quá tải. Vui lòng đợi vài giây.' : '⏳ Mentor system is overloaded. Please wait.')
                : (lang === 'vi' ? '❌ Lỗi kết nối AI. Thử lại sau.' : '❌ AI connection failed. Try again.')
            setMessages(prev => [...prev, { role: 'mentor', text: errMsg, ts: Date.now(), error: true }])
        } finally {
            setLoading(false)
            inputRef.current?.focus()
        }
    }

    // Auto-fill: Phát hiện code block hoặc marker FILL_FORM trong response AI
    const tryAutoFill = (text) => {
        if (!text) return
        
        // 1. Ưu tiên: Marker chuẩn <!--FILL_FORM:value-->
        const markerMatch = text.match(/<!--FILL_FORM:(.*?)-->/s)
        if (markerMatch) {
            autoFill(markerMatch[1].trim())
            return
        }

        // 2. Dự phòng: Phát hiện code blocks nếu user yêu cầu hành động
        const lastUserMsg = messages[messages.length - 1]?.text?.toLowerCase() || ''
        const fillKeywords = [
            'điền', 'fill', 'tự động', 'auto', 'nhập vào', 'paste', 
            'mã hóa', 'encrypt', 'decode', 'giải mã', 'hash', 'băm',
            'payload', 'suggest', 'gợi ý'
        ]
        const userWantsAction = fillKeywords.some(kw => lastUserMsg.includes(kw))
        
        if (userWantsAction) {
            //Regex bắt nội dung giữa ``` (có hoặc không có tên ngôn ngữ)
            const codeMatch = text.match(/```(?:[\w]*\n)?([\s\S]*?)```/)
            if (codeMatch && codeMatch[1].trim().length > 0) {
                // Chỉ điền nếu độ dài hợp lý và không phải là một đoạn văn dài
                const candidate = codeMatch[1].trim()
                if (candidate.length < 500 && !candidate.includes('\n\n')) {
                    autoFill(candidate)
                }
            }
        }
    }

    const handleClear = () => {
        const welcome = lang === 'vi'
            ? `Đã xóa hội thoại. Hãy hỏi tôi bất cứ điều gì! 🔄`
            : `Chat cleared. Ask me anything! 🔄`
        setMessages([{ role: 'mentor', text: welcome, ts: Date.now() }])
    }

    // Simple markdown-like rendering
    const renderText = (text) => {
        if (!text) return null
        return text.split('\n').map((line, i) => {
            // Bold
            let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            // Inline code
            processed = processed.replace(/`([^`]+)`/g, '<code style="background:rgba(88,166,255,0.1);padding:0.1rem 0.35rem;border-radius:3px;font-size:0.8rem;color:var(--lab-cyan);font-family:monospace">$1</code>')
            // Code block fences (simple single-line)
            if (processed.startsWith('```')) return null

            return (
                <span key={i}>
                    <span dangerouslySetInnerHTML={{ __html: processed }} />
                    {i < text.split('\n').length - 1 && <br />}
                </span>
            )
        })
    }

    return (
        <div className="mentor-chat-container">
            {/* Header */}
            <div className="mentor-chat-header">
                <div className="mentor-chat-header-left">
                    <div className="mentor-avatar">
                        <Sparkles size={14} />
                    </div>
                    <div>
                        <div className="mentor-title">Lab Mentor</div>
                        <div className="mentor-subtitle">Qwen 2.5 · Cloud AI</div>
                    </div>
                </div>
                <button className="mentor-clear-btn" onClick={handleClear} title={lang === 'vi' ? 'Xóa hội thoại' : 'Clear chat'}>
                    <Trash2 size={13} />
                </button>
            </div>

            {/* Context badge */}
            {labId && (
                <div className="mentor-context-badge">
                    <span className="mentor-context-dot" />
                    Lab: <strong>{labId.toUpperCase()}</strong>
                    {labContext && <span className="mentor-context-detail"> — {labContext.substring(0, 60)}{labContext.length > 60 ? '...' : ''}</span>}
                </div>
            )}

            {/* Messages */}
            <div className="mentor-messages" ref={chatContainerRef}>
                {messages.map((msg, i) => (
                    <div key={i} className={`mentor-msg ${msg.role}`}>
                        <div className="mentor-msg-avatar">
                            {msg.role === 'mentor' ? <Bot size={14} /> : <User size={14} />}
                        </div>
                        <div className={`mentor-msg-bubble ${msg.error ? 'error' : ''}`}>
                            {renderText(msg.text)}
                        </div>
                    </div>
                ))}

                {/* Typing indicator */}
                {loading && (
                    <div className="mentor-msg mentor">
                        <div className="mentor-msg-avatar"><Bot size={14} /></div>
                        <div className="mentor-msg-bubble typing">
                            <span className="mentor-typing-dot" />
                            <span className="mentor-typing-dot" />
                            <span className="mentor-typing-dot" />
                        </div>
                    </div>
                )}
                <div />
            </div>

            {/* Input */}
            <div className="mentor-input-area">
                <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleSend()}
                    placeholder={lang === 'vi' ? 'Hỏi Mentor về bài Lab...' : 'Ask Mentor about this lab...'}
                    className="mentor-input"
                    disabled={loading}
                />
                <button
                    className={`mentor-send-btn ${input.trim() && !loading ? 'active' : ''}`}
                    onClick={handleSend}
                    disabled={!input.trim() || loading}
                >
                    {loading ? <Loader2 size={16} className="mentor-spin" /> : <Send size={16} />}
                </button>
            </div>
        </div>
    )
}
