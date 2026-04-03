import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

const LabContext = createContext();

export function LabProvider({ children }) {
    // State tập trung cho input của bài Lab
    const [labInputData, setLabInputData] = useState('');
    
    // Action metadata để hiển thị hiệu ứng trên UI nếu cần
    const [lastAction, setLastAction] = useState(null); 

    const autoFill = useCallback((text) => {
        setLabInputData(text);
        setLastAction('AUTO_FILL');
        setTimeout(() => setLastAction(null), 2000);
    }, []);

    return (
        <LabContext.Provider value={{ 
            labInputData, 
            setLabInputData, 
            autoFill,
            lastAction 
        }}>
            {children}
        </LabContext.Provider>
    );
}

export function useLab() {
    const context = useContext(LabContext);
    if (!context) {
        throw new Error('useLab must be used within a LabProvider');
    }
    return context;
}
