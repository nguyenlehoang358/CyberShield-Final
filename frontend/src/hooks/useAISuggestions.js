import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

export const useAISuggestions = (labType, inputValue = '') => {
    const [suggestions, setSuggestions] = useState([]); // Dynamic suggestions from AI
    const [isLoading, setIsLoading] = useState(false);
    const { api } = useAuth();
    const lastFetchedQuery = useRef('');

    const fetchSuggestions = useCallback(async (query) => {
        if (!labType || !api) return;
        if (query === lastFetchedQuery.current) return;
        
        lastFetchedQuery.current = query;
        setIsLoading(true);
        try {
            // Context-aware AI call
            const url = `/lab/${labType}/suggestions${query ? `?q=${encodeURIComponent(query)}` : ''}`;
            const response = await api.get(url);
            
            if (Array.isArray(response.data)) {
                // Combine with existing to avoid sudden empty list if AI response is weird
                setSuggestions(prev => {
                    const newItems = response.data.filter(item => !prev.includes(item));
                    return [...newItems, ...prev].slice(0, 5); // Keep top 5
                });
            }
        } catch (error) {
            console.error("[AI Auto-Suggest] Error:", error);
        } finally {
            setIsLoading(true); // Artificial pause for UX smoothness
            setTimeout(() => setIsLoading(false), 300);
        }
    }, [labType, api]);

    // Initial fetch for base suggestions
    useEffect(() => {
        fetchSuggestions('');
    }, [labType, api, fetchSuggestions]);

    // Advanced: Reactive fetch when user types (debounced)
    useEffect(() => {
        // Only trigger AI for meaningful typing (at least 2 chars)
        if (!inputValue || inputValue.length < 2) return;

        const timer = setTimeout(() => {
            fetchSuggestions(inputValue);
        }, 500); // Fast debounce

        return () => clearTimeout(timer);
    }, [inputValue, fetchSuggestions]);

    return { suggestions, isLoading };
};
