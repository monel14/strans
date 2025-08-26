
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
        // Force light theme - Solution robuste pour mobile
        const forceTheme = () => {
            document.documentElement.classList.add('light');
            document.documentElement.classList.remove('dark');
            
            // Force le color-scheme pour les navigateurs mobiles
            document.documentElement.style.colorScheme = 'light';
            document.body.style.colorScheme = 'light';
        };
        
        // Application initiale
        forceTheme();
        
        // Observateur pour détecter les changements de classe sur mobile
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    const target = mutation.target as HTMLElement;
                    if (target === document.documentElement && target.classList.contains('dark')) {
                        // Supprime immédiatement la classe dark si elle est ajoutée
                        setTimeout(() => forceTheme(), 0);
                    }
                }
            });
        });
        
        // Surveille les changements sur l'élément racine
        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class', 'style']
        });
        
        // Vérification périodique pour les cas edge sur mobile
        const intervalId = setInterval(forceTheme, 1000);
        
        localStorage.removeItem('theme'); // Clean up old setting
        
        return () => {
            observer.disconnect();
            clearInterval(intervalId);
        };
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
