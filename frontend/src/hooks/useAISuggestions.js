import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

// Fallback suggestions khi AI chưa sẵn sàng hoặc đang loading
const FALLBACK_SUGGESTIONS = {
    sqli: ["' OR 1=1 --", "' UNION SELECT null, user() --", "admin' #", "1' AND 1=2 UNION SELECT table_name FROM information_schema.tables --", "' OR ''='"],
    xss: ["<script>alert('XSS')</script>", "<img src=x onerror=alert(1)>", "javascript:alert(1)", "<svg onload=alert('XSS')>", "\"onfocus=alert(1) autofocus=\""],
    encryption: ["Hello World", "CyberShield2026", "The quick brown fox", "Attack at dawn", "P@ssw0rd!Secure"],
    hashing: ["password123", "admin", "CyberShield", "test123456", "Hello World"],
    password: ["123456", "password", "admin123", "qwerty", "P@$$w0rd!2026#Str0ng"],
    firewall: ["192.168.1.100", "10.0.0.0/8", "0.0.0.0/0", "172.16.0.0/12", "ALLOW TCP 443"],
    https: ["https://example.com", "TLS 1.3", "Certificate SHA-256", "HSTS max-age=31536000", "SSL Pinning"],
    jwt: ["eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJhZG1pbiJ9", '{"alg":"none"}', '{"sub":"admin","role":"ADMIN"}', "Bearer token", "RS256 vs HS256"],
};

export const useAISuggestions = (labType, inputValue = '') => {
    const [suggestions, setSuggestions] = useState(() => FALLBACK_SUGGESTIONS[labType] || []);
    const [isLoading, setIsLoading] = useState(false);
    const { api } = useAuth();
    const lastFetchedQuery = useRef('');
    const abortRef = useRef(null);

    const fetchSuggestions = useCallback(async (query) => {
        if (!labType || !api) return;
        if (query === lastFetchedQuery.current) return;
        
        lastFetchedQuery.current = query;
        setIsLoading(true);

        // Cancel bất kỳ request trước đó
        if (abortRef.current) abortRef.current.abort();
        abortRef.current = new AbortController();

        try {
            const url = `/lab/${labType}/suggestions${query ? `?q=${encodeURIComponent(query)}` : ''}`;
            const response = await api.get(url, {
                signal: abortRef.current.signal,
                timeout: 15000 // 15s timeout cho AI response
            });
            
            if (Array.isArray(response.data) && response.data.length > 0) {
                setSuggestions(response.data.slice(0, 5));
            }
        } catch (error) {
            if (error.name === 'AbortError' || error.name === 'CanceledError') return;
            console.warn("[AI Suggest] Using fallback:", error.message);
            // Giữ suggestions hiện tại (fallback), không xóa
        } finally {
            setIsLoading(false);
        }
    }, [labType, api]);

    // Load ban đầu: dùng fallback ngay + gọi AI nền
    useEffect(() => {
        setSuggestions(FALLBACK_SUGGESTIONS[labType] || []);
        // Gọi AI để lấy suggestions nâng cao
        const timer = setTimeout(() => fetchSuggestions(''), 1000);
        return () => clearTimeout(timer);
    }, [labType, fetchSuggestions]);

    // Reactive fetch khi user gõ (debounce 800ms)
    useEffect(() => {
        if (!inputValue || inputValue.length < 2) return;

        const timer = setTimeout(() => {
            fetchSuggestions(inputValue);
        }, 800);

        return () => clearTimeout(timer);
    }, [inputValue, fetchSuggestions]);

    // Cleanup abort controller
    useEffect(() => {
        return () => { if (abortRef.current) abortRef.current.abort(); };
    }, []);

    return { suggestions, isLoading };
};
