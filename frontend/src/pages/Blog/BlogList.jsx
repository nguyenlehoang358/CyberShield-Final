import React, { useState, useEffect } from 'react'
import { Calendar, User, Tag, ArrowRight, ExternalLink } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import '../../styles/ecosystem.css'

function formatDate(dateStr) {
    if (!dateStr) return '-'
    try {
        return new Date(dateStr).toLocaleDateString()
    } catch {
        return dateStr
    }
}

export default function BlogList() {
    const [blogs, setBlogs] = useState([])
    const [loading, setLoading] = useState(true)
    const { api } = useAuth()

    useEffect(() => {
        const fetchBlogs = async () => {
            try {
                const res = await api.get('/blogs?page=0&size=50')
                if (res.data && res.data.content) {
                    setBlogs(res.data.content)
                } else if (Array.isArray(res.data)) {
                    setBlogs(res.data)
                }
            } catch (err) {
                console.error("Failed to load blogs:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchBlogs()
    }, [api])

    return (
        <div className="eco-container" style={{ padding: '2rem' }}>
            <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
                <h1 className="eco-title-gradient">Security News</h1>
                <p className="eco-subtitle">Cập nhật tin tức an toàn thông tin toàn cầu từ The Hacker News.</p>
            </header>

            {loading ? (
                <div style={{ textAlign: 'center', color: 'var(--eco-text)', padding: '2rem' }}>Đang tải dữ liệu...</div>
            ) : blogs.length === 0 ? (
                <div style={{ textAlign: 'center', color: 'var(--eco-text)', padding: '2rem' }}>Chưa có bài viết nào được crawl. Vui lòng đảm bảo Backend đang chạy.</div>
            ) : (
                <div className="blog-grid">
                    {blogs.map(post => (
                        <article key={post.id} className="blog-card">
                            {post.imageUrl && (
                                <img src={post.imageUrl} alt={post.title} style={{ width: '100%', height: '180px', objectFit: 'cover' }} />
                            )}
                            <div className="blog-content">
                                <div className="blog-meta">
                                    <Calendar size={14} /> {formatDate(post.publishedAt)}
                                    <span>•</span>
                                    <span>Security News</span>
                                </div>

                                <h2 className="blog-title">
                                    <a href={post.url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'none' }}>
                                        {post.title}
                                    </a>
                                </h2>

                                <p className="blog-excerpt">
                                    {post.summary}
                                </p>

                                <div className="blog-footer">
                                    <a href={post.url} target="_blank" rel="noopener noreferrer" className="blog-link">
                                        Đọc tiếp <ExternalLink size={14} />
                                    </a>
                                </div>
                            </div>
                        </article>
                    ))}
                </div>
            )}
        </div>
    )
}
