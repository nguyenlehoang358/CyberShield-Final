import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAISuggestions } from '../../hooks/useAISuggestions';
import { Sparkles, Loader2, ChevronRight, Zap } from 'lucide-react';

const AIInput = ({ labType, value, onChange, placeholder = "Nhập payload...", style: customStyle, as: Component = "input", ...props }) => {
    const { suggestions, isLoading } = useAISuggestions(labType, value);
    const [isFocused, setIsFocused] = useState(false);
    const wrapperRef = useRef(null);

    // 🚀 CLIENT-SIDE FILTERING: Improve responsiveness (Immediate feedback)
    const filteredSuggestions = useMemo(() => {
        if (!value || value.length < 1) return suggestions.slice(0, 5);
        
        // Filter suggestions that contain user's current input
        const filtered = suggestions.filter(s => 
            s.toLowerCase().includes(value.toLowerCase())
        );

        // If no match found but AI is currently loading, show nothing but wait for AI to finish
        if (filtered.length === 0 && !isLoading) {
            // Keep common suggestions just in case if nothing matches
            return suggestions.slice(0, 3);
        }
        
        return filtered.slice(0, 5);
    }, [value, suggestions, isLoading]);

    // Close on outside click
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsFocused(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSuggestionClick = (text) => {
        if (onChange) {
            onChange({ target: { value: text } });
        }
        setIsFocused(false);
    };

    const showDropdown = isFocused && filteredSuggestions.length > 0;

    return (
        <div className="ai-input-wrapper" style={{ position: 'relative', width: '100%' }} ref={wrapperRef}>
            {/* Main Input Component */}
            <Component
                value={value}
                onChange={onChange}
                onFocus={() => setIsFocused(true)}
                placeholder={placeholder}
                className={`ai-interactive-input ${isFocused ? 'focused' : ''}`}
                style={{
                    width: '100%',
                    padding: '0.75rem 2.8rem 0.75rem 1rem',
                    background: 'rgba(13, 17, 23, 0.65)',
                    border: '1px solid rgba(48, 54, 61, 0.8)',
                    borderRadius: '14px',
                    fontSize: '0.95rem',
                    color: '#f0f6fc',
                    outline: 'none',
                    transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                    boxShadow: isFocused ? '0 0 15px rgba(88, 166, 255, 0.1), 0 0 0 2px rgba(88, 166, 255, 0.2)' : 'none',
                    fontFamily: Component === 'textarea' ? 'var(--font-mono)' : 'inherit',
                    resize: Component === 'textarea' ? 'vertical' : 'none',
                    minHeight: Component === 'textarea' ? '120px' : 'auto',
                    ...customStyle
                }}
                {...props}
            />

            {/* AI Status Indicator with animated feedback */}
            <div style={{
                position: 'absolute', right: '14px', top: Component === 'textarea' ? '18px' : '50%', 
                transform: Component === 'textarea' ? 'none' : 'translateY(-50%)',
                display: 'flex', alignItems: 'center', gap: '4px', pointerEvents: 'none',
                opacity: (suggestions.length > 0 || isLoading) ? 1 : 0.2,
                transition: 'all 0.3s'
            }}>
                {isLoading ? (
                    <Loader2 size={18} className="animate-spin text-blue-400" />
                ) : (
                    <div className={isFocused && !value ? "animate-pulse" : ""}>
                        <Sparkles size={20} className={suggestions.length > 0 ? "text-blue-400 drop-shadow-[0_0_5px_rgba(88,166,255,0.4)]" : "text-gray-500"} />
                    </div>
                )}
            </div>

            {/* AI Autocomplete Dropdown */}
            {showDropdown && (
                <div className="ai-suggestions-dropdown shadow-2xl" id="ai-autocomplete" style={{
                    position: 'absolute', zIndex: 1000, marginTop: '8px', width: '100%',
                    background: '#0d1117', border: '1px solid rgba(88, 166, 255, 0.2)',
                    borderRadius: '14px', overflow: 'hidden', left: 0,
                    animation: 'dropdownFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                    backdropFilter: 'blur(12px)',
                    boxShadow: '0 12px 24px -6px rgba(0, 0, 0, 0.5), 0 4px 12px -4px rgba(88, 166, 255, 0.1)'
                }}>
                    <div style={{
                        padding: '10px 14px', fontSize: '0.7rem', fontWeight: 600,
                        color: '#58a6ff', background: 'rgba(56, 139, 253, 0.08)', 
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        borderBottom: '1px solid rgba(48, 54, 61, 0.5)',
                        letterSpacing: '0.05em', textTransform: 'uppercase'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Zap size={13} fill="currentColor" />
                            GỢI Ý AI COPILOT
                        </div>
                        {isLoading && <span className="animate-pulse">Thinking...</span>}
                    </div>
                    
                    <ul style={{ listStyle: 'none', margin: 0, padding: '6px 0', maxHeight: '300px', overflowY: 'auto' }}>
                        {filteredSuggestions.map((suggestion, index) => (
                            <li 
                                key={index}
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="suggestion-item group"
                                style={{
                                    padding: '12px 16px', fontSize: '0.9rem', color: '#8b949e',
                                    cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px',
                                    transition: 'all 0.2s ease', position: 'relative'
                                }}
                                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(56, 139, 253, 0.1)'; e.currentTarget.style.color = '#f0f6fc'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#8b949e'; }}
                            >
                                <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity text-blue-400" />
                                <code style={{ 
                                    background: 'transparent', color: 'inherit', 
                                    wordBreak: 'break-all', outline: 'none',
                                    fontFamily: 'var(--font-mono)', fontSize: '0.85rem'
                                }}>
                                    {/* Highlight the matching part in the suggestion */}
                                    {suggestion.includes(value) ? (
                                        <>
                                            {suggestion.split(value)[0]}
                                            <span style={{ color: '#58a6ff', textDecoration: 'underline' }}>{value}</span>
                                            {suggestion.split(value)[1]}
                                        </>
                                    ) : suggestion}
                                </code>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <style>{`
                @keyframes dropdownFadeIn {
                    from { transform: translateY(-12px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
                .ai-interactive-input:focus {
                    border-color: rgba(88, 166, 255, 0.6) !important;
                    background: rgba(22, 27, 34, 0.8) !important;
                }
                .ai-interactive-input::placeholder {
                    color: rgba(139, 148, 158, 0.5);
                }
                .suggestion-item:hover {
                    padding-left: 20px !important;
                }
                #ai-autocomplete::-webkit-scrollbar {
                    width: 4px;
                }
                #ai-autocomplete::-webkit-scrollbar-thumb {
                    background: rgba(48, 54, 61, 1);
                    border-radius: 10px;
                }
            `}</style>
        </div>
    );
};

export default AIInput;
