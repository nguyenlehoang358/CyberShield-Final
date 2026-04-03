import React, { useState, useEffect } from 'react'
import { useAuth } from '../../context/AuthContext'
import { Plus, Edit, Trash2, Save, X, MoveUp, MoveDown, Shield, Zap, Globe, Cpu, Database, Check, Search, Code, Lock, Cloud, Users, Activity, Anchor, Layout, Server, Smartphone, Terminal, Wifi } from 'lucide-react'

const IconMap = {
    Shield, Zap, Globe, Cpu, Database, Check,
    Search, Code, Lock, Cloud, Users,
    Activity, Anchor, Layout, Server, Smartphone, Terminal, Wifi
}

export default function SolutionManager() {
    const { api } = useAuth()
    const [solutions, setSolutions] = useState([])
    const [loading, setLoading] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [formData, setFormData] = useState(initialFormState())
    const [isAdding, setIsAdding] = useState(false)

    function initialFormState() {
        return {
            titleVi: '', titleEn: '',
            descriptionVi: '', descriptionEn: '',
            icon: 'Zap', color: 'blue',
            displayOrder: 0, active: true,
            detailJson: '{\n  "concept": "",\n  "usage": "",\n  "application": ""\n}',
            relatedLabsJson: '[]'
        }
    }

    useEffect(() => {
        loadSolutions()
    }, [])

    const loadSolutions = async () => {
        setLoading(true)
        try {
            const res = await api.get('/admin/solutions')
            setSolutions(res.data)
        } catch (err) {
            console.error('Failed to load solutions', err)
        }
        setLoading(false)
    }

    const handleEdit = (sol) => {
        setEditingId(sol.id)
        setFormData({ 
            ...sol,
            detailJson: sol.detailJson || '{\n  "concept": "",\n  "usage": "",\n  "application": ""\n}',
            relatedLabsJson: sol.relatedLabsJson || '[]'
        })
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
        if (!window.confirm('Bạn có chắc chắn muốn xóa giải pháp này? Dữ liệu con có thể bị ảnh hưởng.')) return
        try {
            await api.delete(`/admin/solutions/${id}`)
            setSolutions(prev => prev.filter(s => s.id !== id))
        } catch (err) {
            alert('Lỗi khi xóa: ' + err.message)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        try {
            // Check JSON validity before submit!
            try {
                if (formData.detailJson) JSON.parse(formData.detailJson);
                if (formData.relatedLabsJson) JSON.parse(formData.relatedLabsJson);
            } catch (err) {
                alert('Lỗi: detailJson hoặc relatedLabsJson không phải là định dạng JSON hợp lệ!');
                return;
            }

            if (isAdding) {
                const res = await api.post('/admin/solutions', formData)
                setSolutions([...solutions, res.data])
            } else {
                const res = await api.put(`/admin/solutions/${editingId}`, formData)
                setSolutions(solutions.map(s => s.id === editingId ? res.data : s))
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

    return (
        <div className="solution-manager animate-fade-in">
            <div className="admin-table-header">
                <div>
                    <h3 className="neon-text">Quản lý Giải pháp & Dịch vụ</h3>
                    <p className="admin-subtitle">Trình quản lý Card giao diện Neo-Cyberpunk</p>
                </div>
                {!isAdding && !editingId && (
                    <button className="admin-btn admin-btn-primary cyber-button glow" onClick={handleAdd}>
                        <Plus size={18} /> <span style={{marginLeft: '0.5rem'}}>Tạo mới Giải pháp</span>
                    </button>
                )}
            </div>

            {(isAdding || editingId) && (
                <form onSubmit={handleSubmit} className="admin-form-card glass-panel cyber-border">
                    <h4 className="form-title">{isAdding ? 'Thêm Giải pháp mới' : 'Chỉnh sửa Giải pháp ID: '+editingId}</h4>
                    <div className="form-grid">
                        <div className="form-group custom-input-wrapper">
                            <label>Tiêu đề (VI)</label>
                            <input className="cyber-input" name="titleVi" value={formData.titleVi} onChange={handleChange} required />
                        </div>
                        <div className="form-group custom-input-wrapper">
                            <label>Tiêu đề (EN)</label>
                            <input className="cyber-input" name="titleEn" value={formData.titleEn} onChange={handleChange} required />
                        </div>
                        <div className="form-group full-width custom-input-wrapper">
                            <label>Mô tả ngắn (VI) - Hiển thị ngoài Card</label>
                            <textarea className="cyber-input" name="descriptionVi" value={formData.descriptionVi} onChange={handleChange} required />
                        </div>
                        <div className="form-group full-width custom-input-wrapper">
                            <label>Mô tả ngắn (EN)</label>
                            <textarea className="cyber-input" name="descriptionEn" value={formData.descriptionEn} onChange={handleChange} required />
                        </div>
                        
                        <div className="form-group custom-input-wrapper">
                            <label>Icon (Lucide name)</label>
                            <div className="icon-input-preview">
                                <span className="preview-icon-box">
                                    {IconMap[formData.icon] ? React.createElement(IconMap[formData.icon], { size: 18 }) : <Zap size={18} />}
                                </span>
                                <select className="cyber-input" name="icon" value={formData.icon} onChange={handleChange} style={{flex: 1}}>
                                    {Object.keys(IconMap).map(iconName => (
                                        <option key={iconName} value={iconName}>{iconName}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="form-group custom-input-wrapper">
                            <label>Màu sắc chủ đạo (Theme Color)</label>
                            <div className="color-picker-wrapper">
                                {['blue', 'purple', 'pink', 'coral', 'green', 'cyan', 'yellow', 'red'].map(c => (
                                    <div 
                                        key={c} 
                                        className={`color-swatch ${c} ${formData.color === c ? 'selected' : ''}`}
                                        onClick={() => handleChange({ target: { name: 'color', value: c } })}
                                        title={c}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="form-group full-width custom-input-wrapper">
                            <label>Chi tiết Popup Modal (JSON Format)</label>
                            <div className="json-hint">{"Cấu trúc: {\"concept\": \"...\", \"usage\": \"...\", \"application\": \"...\"}"}</div>
                            <textarea 
                                className="cyber-input code-editor" 
                                name="detailJson" 
                                value={formData.detailJson} 
                                onChange={handleChange} 
                                rows={6}
                                spellCheck="false"
                            />
                        </div>

                        <div className="form-group full-width custom-input-wrapper">
                            <label>Phòng Lab liên quan (JSON Array)</label>
                            <div className="json-hint">{"Cấu trúc: [{\"id\": \"xss\", \"name\": \"XSS Lab\", \"path\": \"/lab/xss\"}]"}</div>
                            <textarea 
                                className="cyber-input code-editor" 
                                name="relatedLabsJson" 
                                value={formData.relatedLabsJson} 
                                onChange={handleChange} 
                                rows={4}
                                spellCheck="false"
                            />
                        </div>

                        <div className="form-group custom-input-wrapper">
                            <label>Thứ tự hiển thị (Display Order)</label>
                            <input className="cyber-input" type="number" name="displayOrder" value={formData.displayOrder} onChange={handleChange} />
                        </div>

                        <div className="form-group custom-input-wrapper status-toggle-wrapper">
                            <label>Trạng thái</label>
                            <label className="cyber-switch">
                                <input type="checkbox" name="active" checked={formData.active} onChange={handleChange} />
                                <span className="slider round"></span>
                                <span className="switch-text">{formData.active ? 'Đang bật (Active)' : 'Đã tắt (Inactive)'}</span>
                            </label>
                        </div>
                    </div>
                    <div className="form-actions cyber-actions-fixed">
                        <button type="submit" className="admin-btn admin-btn-primary cyber-button save">
                            <Save size={16} /> Lưu Cấu Hình
                        </button>
                        <button type="button" className="admin-btn admin-btn-secondary cyber-button cancel" onClick={handleCancel}>
                            <X size={16} /> Hủy Bỏ
                        </button>
                    </div>
                </form>
            )}

            {!isAdding && !editingId && (
                <div className="solutions-grid">
                    {solutions.sort((a, b) => a.displayOrder - b.displayOrder).map(sol => {
                        const Icon = IconMap[sol.icon] || Zap;
                        let labsCount = 0;
                        try {
                            if(sol.relatedLabsJson) labsCount = JSON.parse(sol.relatedLabsJson).length;
                        } catch(e) {}

                        return (
                            <div key={sol.id} className={`admin-sol-card ${sol.color} ${!sol.active ? 'inactive-card' : ''}`}>
                                <div className="admin-sol-header">
                                    <div className="admin-sol-icon-box glow-icon">
                                        <Icon size={24} />
                                    </div>
                                    <div className="admin-sol-actions">
                                        <button className="icon-btn action-edit" onClick={() => handleEdit(sol)} title="Sửa"><Edit size={16} /></button>
                                        <button className="icon-btn action-delete" onClick={() => handleDelete(sol.id)} title="Xóa"><Trash2 size={16} /></button>
                                    </div>
                                </div>
                                
                                <div className="admin-sol-body">
                                    <h4 className="sol-title">{sol.titleVi}</h4>
                                    <h5 className="sol-subtitle">{sol.titleEn}</h5>
                                    <p className="sol-desc truncate-text-3">{sol.descriptionVi}</p>
                                </div>

                                <div className="admin-sol-footer">
                                    <div className="sol-meta">
                                        <span className="meta-badge order-badge" title="Thứ tự hiển thị">#{sol.displayOrder}</span>
                                        <span className="meta-badge lab-badge">{labsCount} Labs</span>
                                    </div>
                                    <span className={`admin-status-pill ${sol.active ? 'active' : 'locked'}`}>
                                        {sol.active ? 'Hiển thị' : 'Đã ẩn'}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                    {solutions.length === 0 && !loading && (
                        <div className="empty-state-cyber glass-panel">
                            Không có giải pháp nào trong cơ sở dữ liệu.
                        </div>
                    )}
                </div>
            )}

            <style>{`
                .solutions-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
                    gap: 1.5rem;
                    margin-top: 1rem;
                }
                
                /* Glassmorphism Cyber Card */
                .admin-sol-card {
                    background: rgba(15, 23, 42, 0.7);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 1.5rem;
                    display: flex;
                    flex-direction: column;
                    gap: 1rem;
                    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                    position: relative;
                    overflow: hidden;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }
                .admin-sol-card:hover {
                    transform: translateY(-4px);
                    border-color: rgba(255, 255, 255, 0.2);
                    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
                }
                .admin-sol-card.inactive-card {
                    opacity: 0.6;
                    filter: grayscale(0.5);
                }
                
                /* Color Themes via Pseudo Elements */
                .admin-sol-card::before {
                    content: '';
                    position: absolute;
                    top: 0; left: 0; right: 0; height: 3px;
                    opacity: 0.8;
                    transition: all 0.3s ease;
                }
                .admin-sol-card.blue::before { background: #3b82f6; box-shadow: 0 0 10px #3b82f6; }
                .admin-sol-card.purple::before { background: #8b5cf6; box-shadow: 0 0 10px #8b5cf6; }
                .admin-sol-card.pink::before { background: #ec4899; box-shadow: 0 0 10px #ec4899; }
                .admin-sol-card.coral::before { background: #f43f5e; box-shadow: 0 0 10px #f43f5e; }
                .admin-sol-card.green::before { background: #10b981; box-shadow: 0 0 10px #10b981; }
                .admin-sol-card.cyan::before { background: #06b6d4; box-shadow: 0 0 10px #06b6d4; }
                .admin-sol-card.yellow::before { background: #eab308; box-shadow: 0 0 10px #eab308; }
                .admin-sol-card.red::before { background: #ef4444; box-shadow: 0 0 10px #ef4444; }

                .admin-sol-card:hover::before {
                    height: 4px;
                    opacity: 1;
                }

                .admin-sol-header { display: flex; align-items: flex-start; justify-content: space-between; }
                
                /* Icon Boxes with dynamic color inheritance */
                .admin-sol-icon-box { 
                    width: 54px; height: 54px; 
                    border-radius: 14px; 
                    display: flex; align-items: center; justify-content: center; 
                    background: rgba(255,255,255,0.05);
                    transition: all 0.3s ease;
                    border: 1px solid rgba(255,255,255,0.05);
                }
                .admin-sol-card.blue .admin-sol-icon-box { color: #60a5fa; background: rgba(59, 130, 246, 0.15); border-color: rgba(59, 130, 246, 0.3); }
                .admin-sol-card.purple .admin-sol-icon-box { color: #a78bfa; background: rgba(139, 92, 246, 0.15); border-color: rgba(139, 92, 246, 0.3); }
                .admin-sol-card.pink .admin-sol-icon-box { color: #f472b6; background: rgba(236, 72, 153, 0.15); border-color: rgba(236, 72, 153, 0.3); }
                .admin-sol-card.coral .admin-sol-icon-box { color: #fb7185; background: rgba(244, 63, 94, 0.15); border-color: rgba(244, 63, 94, 0.3); }
                .admin-sol-card.green .admin-sol-icon-box { color: #34d399; background: rgba(16, 185, 129, 0.15); border-color: rgba(16, 185, 129, 0.3); }
                .admin-sol-card.cyan .admin-sol-icon-box { color: #22d3ee; background: rgba(6, 182, 212, 0.15); border-color: rgba(6, 182, 212, 0.3); }
                .admin-sol-card.yellow .admin-sol-icon-box { color: #facc15; background: rgba(234, 179, 8, 0.15); border-color: rgba(234, 179, 8, 0.3); }
                .admin-sol-card.red .admin-sol-icon-box { color: #f87171; background: rgba(239, 68, 68, 0.15); border-color: rgba(239, 68, 68, 0.3); }

                .admin-sol-body { flex: 1; }
                .sol-title { margin: 0 0 0.25rem 0; font-size: 1.1rem; font-weight: 600; color: #f1f5f9; }
                .sol-subtitle { margin: 0 0 0.75rem 0; font-size: 0.85rem; font-weight: 500; color: #94a3b8; text-transform: uppercase; letter-spacing: 0.5px; }
                .sol-desc { margin: 0; color: #cbd5e1; font-size: 0.9rem; line-height: 1.5; }
                .truncate-text-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }

                .admin-sol-footer { 
                    display: flex; align-items: center; justify-content: space-between; 
                    padding-top: 1rem; border-top: 1px solid rgba(255,255,255,0.05); 
                }
                .sol-meta { display: flex; gap: 0.5rem; }
                .meta-badge { 
                    font-size: 0.75rem; padding: 2px 8px; border-radius: 4px; 
                    background: rgba(255,255,255,0.05); color: #94a3b8; font-weight: 500;
                    border: 1px solid rgba(255,255,255,0.1);
                }

                .admin-sol-actions { display: flex; gap: 0.5rem; }
                .icon-btn { 
                    width: 32px; height: 32px; border-radius: 8px; border: none; 
                    display: flex; align-items: center; justify-content: center;
                    cursor: pointer; transition: all 0.2s; background: rgba(255,255,255,0.03); 
                }
                .icon-btn.action-edit { color: #60a5fa; }
                .icon-btn.action-edit:hover { background: rgba(59, 130, 246, 0.2); }
                .icon-btn.action-delete { color: #f87171; }
                .icon-btn.action-delete:hover { background: rgba(239, 68, 68, 0.2); }

                .admin-status-pill {
                    font-size: 0.75rem; padding: 4px 10px; border-radius: 20px; font-weight: 600;
                }
                .admin-status-pill.active { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
                .admin-status-pill.locked { background: rgba(148, 163, 184, 0.15); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.3); }

                /* Form Enhancements */
                .cyber-border { border: 1px solid rgba(102, 126, 234, 0.3); box-shadow: 0 0 15px rgba(102, 126, 234, 0.05); }
                .form-title { color: #ffffff; margin-bottom: 1.5rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 1rem; }
                
                .admin-form-card { padding: 3rem; } /* Tăng khoảng cách nội dung và viền */

                .custom-input-wrapper label { color: #cbd5e1; font-weight: 500; font-size: 0.9rem; margin-bottom: 0.5rem; display: block; }
                .cyber-input {
                    background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.1);
                    color: white; border-radius: 8px; padding: 0.6rem 0.8rem; width: 100%;
                    transition: all 0.2s;
                }
                .cyber-input:focus { outline: none; border-color: #667eea; box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.2); background: rgba(15, 23, 42, 0.8); }
                
                .code-editor { font-family: 'Fira Code', 'Consolas', monospace; font-size: 0.85rem; line-height: 1.5; color: #a5b4fc; }
                .json-hint { font-size: 0.75rem; color: #64748b; margin-bottom: 0.5rem; font-family: monospace; }
                
                .icon-input-preview { display: flex; gap: 0.5rem; align-items: stretch; }
                .preview-icon-box { background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; width: 42px; display: flex; align-items: center; justify-content: center; color: #a5b4fc; }

                /* Color Swatches */
                .color-picker-wrapper { display: flex; gap: 0.5rem; align-items: center; padding: 0.3rem 0; }
                .color-swatch { width: 32px; height: 32px; border-radius: 50%; cursor: pointer; transition: all 0.2s; border: 2px solid transparent; }
                .color-swatch.blue { background: #3b82f6; }
                .color-swatch.purple { background: #8b5cf6; }
                .color-swatch.pink { background: #ec4899; }
                .color-swatch.coral { background: #f43f5e; }
                .color-swatch.green { background: #10b981; }
                .color-swatch.cyan { background: #06b6d4; }
                .color-swatch.yellow { background: #eab308; }
                .color-swatch.red { background: #ef4444; }
                
                .color-swatch:hover { transform: scale(1.1); }
                .color-swatch.selected { transform: scale(1.1); border-color: white; box-shadow: 0 0 10px currentColor; }

                /* Cyber Switch */
                .cyber-switch { position: relative; display: flex; align-items: center; cursor: pointer; border: 1px solid rgba(255,255,255,0.4); padding: 0.8rem 1.4rem; border-radius: 8px; background: rgba(0,0,0,0.5); width: max-content; gap: 1rem; }
                .cyber-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
                .slider { position: relative; width: 44px; height: 24px; background-color: rgba(255,255,255,0.15); border-radius: 24px; transition: .3s; border: 1px solid rgba(255,255,255,0.2); flex-shrink: 0; display: inline-block; }
                .slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 4px; bottom: 3px; background-color: #cbd5e1; transition: .3s; border-radius: 50%; }
                input:checked + .slider { background-color: rgba(16, 185, 129, 0.2); border-color: #34d399; }
                input:checked + .slider:before { transform: translateX(20px); background-color: #34d399; box-shadow: 0 0 8px #34d399; }
                .switch-text { color: #f8fafc; font-weight: 500; font-size: 0.95rem; }
                
                .status-toggle-wrapper { display: flex; flex-direction: column; justify-content: center; }

                .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem; }
                .full-width { grid-column: span 2; }
                
                .cyber-actions-fixed { display: flex; gap: 2rem !important; justify-content: flex-end; margin-top: 2.5rem; }
                .cyber-actions-fixed button { margin: 0 !important; }

                .admin-subtitle { color: #94a3b8; font-size: 0.9rem; margin-top: 0.25rem; }
                .neon-text { color: #ffffff !important; text-shadow: 0 0 5px rgba(255,255,255,0.5); }
            `}</style>
        </div>
    )
}
