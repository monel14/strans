
import React, { createContext, useContext, useState, useEffect } from 'react';

type Theme = 'light' | 'dark';

export interface UIContextState {
    theme: Theme;
    toggleTheme: () => void;
    notificationSettings: { email: boolean; inApp: boolean };
    setNotificationSettings: React.Dispatch<React.SetStateAction<{ email: boolean; inApp: boolean }>>;
    modalState: { type: string; data?: any } | null;
    openModal: (type: string, data?: any) => void;
    closeModal: () => void;
}

const UIContext = createContext<UIContextState | undefined>(undefined);

export const UIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [theme, setTheme] = useState<Theme>('light');
    const [notificationSettings, setNotificationSettings] = useState(() => {
        const saved = localStorage.getItem('notificationSettings');
        return saved ? JSON.parse(saved) : { email: true, inApp: true };
    });
    const [modalState, setModalState] = useState<{ type: string; data?: any } | null>(null);

    const closeModal = () => setModalState(null);
    const openModal = (type: string, data: any) => setModalState({ type, data });

    const toggleTheme = () => { /* No-op, dark mode removed */ };

    useEffect(() => {
        // Force light theme
        document.documentElement.classList.add('light');
        document.documentElement.classList.remove('dark');
        localStorage.removeItem('theme'); // Clean up old setting
    }, []);
    
    useEffect(() => {
        localStorage.setItem('notificationSettings', JSON.stringify(notificationSettings));
    }, [notificationSettings]);

    const value: UIContextState = {
        theme,
        toggleTheme,
        notificationSettings,
        setNotificationSettings,
        modalState,
        openModal,
        closeModal,
    };

    return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
};

export const useUI = (): UIContextState => {
    const context = useContext(UIContext);
    if (context === undefined) {
        throw new Error('useUI must be used within a UIProvider');
    }
    return context;
};
