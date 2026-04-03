import React, { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext();

export function useTheme() {
    return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
    const [isDark, setIsDark] = useState(false);
    
    // Check system preference and localStorage on initial mount
    useEffect(() => {
        const applyTheme = (dark) => {
            setIsDark(dark);
            if (dark) {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
        };

        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)');

        // Priority 1: Manual Override from localStorage
        if (savedTheme) {
            applyTheme(savedTheme === 'dark');
        } else {
            // Priority 2: System Preference
            applyTheme(systemPrefersDark.matches);
        }

        // Listener for Real-time System Theme Changes
        const handleChange = (e) => {
            // If the user has manually set a theme, don't overwrite it with system changes
            if (!localStorage.getItem('theme')) {
                applyTheme(e.matches);
            }
        };
        
        // Add event listener (using addEventListener for modern browsers)
        systemPrefersDark.addEventListener('change', handleChange);
        
        return () => {
            systemPrefersDark.removeEventListener('change', handleChange);
        };
    }, []);

    // Function to manually toggle theme
    const toggleTheme = () => {
        setIsDark(prev => {
            const newTheme = !prev ? 'dark' : 'light';
            localStorage.setItem('theme', newTheme);
            if (newTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
            return !prev;
        });
    };

    const value = {
        isDark,
        toggleTheme
    };

    return (
        <ThemeContext.Provider value={value}>
            {children}
        </ThemeContext.Provider>
    );
}
