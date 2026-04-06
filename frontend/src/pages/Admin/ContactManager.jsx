import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Mail, CheckCircle, Trash2, Clock, Check } from 'lucide-react'

export default function ContactManager() {
    const { api } = useAuth()
    const [contacts, setContacts] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        loadContacts()
    }, [])

    const loadContacts = async () => {
        setLoading(true)
        try {
            const res = await api.get('/v1/contacts')
            // Sắp xếp ID lớn nhất (mới nhất) lên trên cùng
            const sortedData = (res.data || []).sort((a, b) => b.id - a.id)
            setContacts(sortedData)
        } catch (err) {
            console.error('Failed to load contacts', err)
        }
        setLoading(false)
    }

    const handleMarkAsRead = async (id) => {
        try {
            const res = await api.put(`/v1/contacts/${id}/read`)
            setContacts(contacts.map(c => c.id === id ? res.data : c))
        } catch (err) {
            alert('Lỗi: ' + (err.response?.data?.message || err.message))
        }
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Xác nhận xóa liên hệ này?')) return
        try {
            await api.delete(`/v1/contacts/${id}`)
            setContacts(contacts.filter(c => c.id !== id))
        } catch (err) {
            alert('Lỗi khi xóa: ' + err.message)
        }
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleString()
    }

    return (
        <section className="admin-section animate-fade-in">
            <div className="admin-table-wrapper">
                <div className="admin-table-header">
                    <div>
                        <h3 className="neon-text" style={{ fontSize: '1.5rem', margin: 0, paddingLeft: '8px' }}>Quản lý Phản hồi (Contacts)</h3>
                        <p className="admin-subtitle" style={{ color: '#94a3b8', margin: '0.25rem 0 0', paddingLeft: '8px' }}>Ghi nhận thắc mắc và yêu cầu hỗ trợ từ người dùng</p>
                    </div>
                    <button className="admin-btn admin-btn-sm" onClick={loadContacts}>
                        <i className='bx bx-refresh'></i> Làm mới
                    </button>
                </div>
                <div className="admin-table-scroll" style={{ maxHeight: 'calc(100vh - 250px)' }}>
                    <table className="admin-data-table">
                        <thead>
                            <tr style={{ background: 'rgba(0,0,0,0.3)', textAlign: 'left' }}>
                                <th style={{ width: '20%', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Tên khách hàng</th>
                                <th style={{ width: '45%', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Nội dung tin nhắn</th>
                                <th style={{ width: '15%', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Thời gian</th>
                                <th style={{ width: '10%', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>Trạng thái</th>
                                <th style={{ width: '10%', padding: '1rem', borderBottom: '1px solid rgba(255,255,255,0.1)', textAlign: 'right' }}>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>Đang tải...</td></tr>
                            ) : contacts.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>Chưa có tin nhắn nào.</td></tr>
                            ) : contacts.map(contact => (
                                <tr key={contact.id} style={{ 
                                    background: contact.isRead ? 'transparent' : 'rgba(59, 130, 246, 0.05)',
                                    fontWeight: contact.isRead ? 'normal' : 'bold',
                                    borderBottom: '1px solid rgba(255,255,255,0.05)'
                                }}>
                                    <td style={{ padding: '1rem', color: contact.isRead ? '#cbd5e1' : '#fff' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span>{contact.name}</span>
                                            <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: 'normal' }}>{contact.email}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <div style={{ color: contact.isRead ? '#94a3b8' : '#e2e8f0', lineHeight: '1.5', whiteSpace: 'pre-wrap' }}>
                                            {contact.message}
                                        </div>
                                    </td>
                                    <td style={{ padding: '1rem', color: '#94a3b8', fontSize: '0.85rem', fontWeight: 'normal' }}>
                                        <Clock size={12} style={{ display: 'inline', marginRight: '4px' }}/>
                                        {formatDate(contact.createdAt)}
                                    </td>
                                    <td style={{ padding: '1rem' }}>
                                        <span style={{ 
                                            padding: '4px 10px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600',
                                            background: contact.isRead ? 'rgba(71, 85, 105, 0.2)' : 'rgba(234, 179, 8, 0.2)',
                                            color: contact.isRead ? '#94a3b8' : '#fbbf24',
                                            border: `1px solid ${contact.isRead ? 'rgba(71, 85, 105, 0.4)' : 'rgba(234, 179, 8, 0.4)'}`
                                        }}>
                                            {contact.isRead ? 'Đã đọc' : 'Chưa đọc'}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                                            {!contact.isRead && (
                                                <button onClick={() => handleMarkAsRead(contact.id)} title="Đánh dấu đã đọc" style={{ width: '30px', height: '30px', borderRadius: '6px', border: 'none', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <Check size={16} />
                                                </button>
                                            )}
                                            <button onClick={() => handleDelete(contact.id)} title="Xóa tin nhắn" style={{ width: '30px', height: '30px', borderRadius: '6px', border: 'none', background: 'rgba(239, 68, 68, 0.15)', color: '#f87171', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </section>
    )
}
