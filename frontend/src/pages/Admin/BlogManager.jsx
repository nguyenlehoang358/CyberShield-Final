import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Plus, Edit, Trash2, Save, X, Globe, Link as LinkIcon, Image as ImageIcon, Calendar } from 'lucide-react'

export default function BlogManager() {
    const { api } = useAuth()
    const [blogs, setBlogs] = useState([])
    const [loading, setLoading] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [formData, setFormData] = useState(initialFormState())
    const [isAdding, setIsAdding] = useState(false)

    function initialFormState() {
        return {
            title: '', summary: '',
            url: '', imageUrl: '',
            published: true
        }
    }

    useEffect(() => {
        loadBlogs()
    }, [])

    const loadBlogs = async () => {
        setLoading(true)
        try {
            const res = await api.get('/blogs?page=0&size=100&all=true')
            setBlogs(res.data.content || res.data || [])
        } catch (err) {
            console.error('Failed to load blogs', err)
        }
        setLoading(false)
    }

    const handleEdit = (blog) => {
        setEditingId(blog.id)
        setFormData({ ...blog })
        setIsAdding(false)
    }

    const handleAdd = () => {
        setEditingId(null)
        setFormData(initialFormState())
        setIsAdding(true)
    }

    const handleCancel = () => {
        setEditingId(null)
        setIsAdding(false)
        setFormData(initialFormState())
    }

    const handleDelete = async (id) => {
        if (!window.confirm('Bạn có chắc chắn muốn xóa bài viết này vĩnh viễn?')) return
        try {
            await api.delete(`/blogs/${id}`)
            setBlogs(prev => prev.filter(b => b.id !== id))
        } catch (err) {
            alert('Lỗi khi xóa: ' + err.message)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            if (isAdding) {
                const res = await api.post('/blogs', formData)
                setBlogs([res.data, ...blogs])
            } else {
                const res = await api.put(`/blogs/${editingId}`, formData)
                setBlogs(blogs.map(b => b.id === editingId ? res.data : b))
            }
            handleCancel()
        } catch (err) {
            alert('Lỗi khi lưu: ' + (err.response?.data?.message || err.message))
        }
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString()
    }

    return (
        <div className="solution-manager animate-fade-in" style={{ padding: '0 1rem' }}>
            <div className="admin-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                <div>
                    <h3 className="neon-text" style={{ fontSize: '1.5rem', margin: 0 }}>Quản lý Tin tức (Blogs)</h3>
                    <p className="admin-subtitle" style={{ color: '#94a3b8', margin: '0.25rem 0 0' }}>Hiệu chỉnh bài viết Security cào từ hệ thống</p>
                </div>
                {!isAdding && !editingId && (
                    <button className="admin-btn admin-btn-primary cyber-button glow" onClick={handleAdd} style={{ padding: '0.6rem 1.2rem', background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={18} /> Thêm bài viết mới
                    </button>
                )}
            </div>

            {(isAdding || editingId) && (
                <form onSubmit={handleSubmit} className="admin-form-card glass-panel cyber-border" style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '2rem', borderRadius: '12px', border: '1px solid rgba(102, 126, 234, 0.3)', marginBottom: '2rem' }}>
                    <h4 className="form-title" style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
                        {isAdding ? 'Thêm bài viết thủ công' : 'Chỉnh sửa bài viết ID: ' + editingId}
                    </h4>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem' }}>Tiêu đề</label>
                            <input className="cyber-input" style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '8px' }} name="title" value={formData.title} onChange={handleChange} required />
                        </div>
                        
                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem' }}>Tóm tắt (Summary)</label>
                            <textarea className="cyber-input" style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '8px', height: '100px' }} name="summary" value={formData.summary} onChange={handleChange} required />
                        </div>
                        
                        <div>
                            <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem' }}><LinkIcon size={14} style={{verticalAlign: 'middle', marginRight: '4px'}}/> URL liên kết</label>
                            <input className="cyber-input" style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '8px' }} name="url" value={formData.url} onChange={handleChange} required />
                        </div>
                        
                        <div>
                            <label style={{ display: 'block', color: '#cbd5e1', marginBottom: '0.5rem' }}><ImageIcon size={14} style={{verticalAlign: 'middle', marginRight: '4px'}}/> URL Hình ảnh</label>
                            <input className="cyber-input" style={{ width: '100%', padding: '0.8rem', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', borderRadius: '8px' }} name="imageUrl" value={formData.imageUrl} onChange={handleChange} />
                        </div>

                        <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#cbd5e1', cursor: 'pointer', padding: '10px 0' }}>
                                <input type="checkbox" name="published" checked={formData.published} onChange={handleChange} style={{ width: '20px', height: '20px' }} />
                                Hiển thị công khai trên giao diện (Publish)
                            </label>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                        <button type="button" onClick={handleCancel} style={{ padding: '0.6rem 1.2rem', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <X size={16} /> Hủy bỏ
                        </button>
                        <button type="submit" style={{ padding: '0.6rem 1.2rem', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none', borderRadius: '8px', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Save size={16} /> Lưu thay đổi
                        </button>
                    </div>
                </form>
            )}

            {!isAdding && !editingId && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem' }}>
                    {blogs.map(blog => (
                        <div key={blog.id} style={{ background: 'rgba(15, 23, 42, 0.6)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', overflow: 'hidden', display: 'flex', flexDirection: 'column', opacity: blog.published ? 1 : 0.6 }}>
                            {blog.imageUrl ? (
                                <img src={blog.imageUrl} alt={blog.title} style={{ width: '100%', height: '160px', objectFit: 'cover' }} />
                            ) : (
                                <div style={{ width: '100%', height: '160px', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                                    <Globe size={32} />
                                </div>
                            )}
                            <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                    <h4 style={{ color: '#f1f5f9', margin: 0, fontSize: '1.1rem', lineHeight: '1.4', flex: 1, paddingRight: '1rem' }}>{blog.title}</h4>
                                </div>
                                
                                <p style={{ color: '#cbd5e1', fontSize: '0.9rem', margin: '0.5rem 0 1rem', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    {blog.summary}
                                </p>

                                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1rem' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem', color: '#94a3b8' }}>
                                        <Calendar size={14} /> {formatDate(blog.publishedAt)}
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <span style={{ fontSize: '0.75rem', padding: '4px 8px', borderRadius: '4px', background: blog.published ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: blog.published ? '#34d399' : '#f87171', border: `1px solid ${blog.published ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}` }}>
                                            {blog.published ? 'Hiện' : 'Đã Ẩn'}
                                        </span>
                                        <button onClick={() => handleEdit(blog)} style={{ background: 'rgba(59, 130, 246, 0.15)', border: 'none', color: '#60a5fa', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Sửa"><Edit size={14} /></button>
                                        <button onClick={() => handleDelete(blog.id)} style={{ background: 'rgba(239, 68, 68, 0.15)', border: 'none', color: '#f87171', width: '28px', height: '28px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Xóa"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {blogs.length === 0 && !loading && (
                        <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', color: '#94a3b8' }}>
                            Không có bài viết nào trong hệ thống.
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
