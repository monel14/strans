
import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { navigationLinks } from '../config/navigation';

export interface NavigationContextState {
    currentPageKey: string;
    navigateTo: (pageKey: string) => void;
}

const NavigationContext = createContext<NavigationContextState | undefined>(undefined);

export const NavigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [currentPageKey, setCurrentPageKey] = useState<string>(() => {
        // Récupérer la page sauvegardée depuis localStorage
        try {
            return localStorage.getItem('currentPageKey') || '';
        } catch {
            return '';
        }
    });

    useEffect(() => {
        if (currentUser) {
            // Si on a une page sauvegardée, vérifier qu'elle est valide pour ce rôle
            const userNavLinks = navigationLinks[currentUser.role] || [];
            const savedPageExists = currentPageKey && userNavLinks.some(link => link.key === currentPageKey);
            
            if (!savedPageExists) {
                // Si pas de page sauvegardée valide, prendre la première page du rôle
                const firstPageKey = userNavLinks[0]?.key;
                if (firstPageKey) {
                    setCurrentPageKey(firstPageKey);
                    localStorage.setItem('currentPageKey', firstPageKey);
                }
            }
        } else if (!currentUser) {
            // Si pas d'utilisateur connecté, nettoyer
            setCurrentPageKey('');
            localStorage.removeItem('currentPageKey');
        }
    }, [currentUser, currentPageKey]);
    
    const navigateTo = (pageKey: string) => {
        setCurrentPageKey(pageKey);
        // Sauvegarder la page actuelle dans localStorage
        localStorage.setItem('currentPageKey', pageKey);
    };

    const value: NavigationContextState = {
        currentPageKey,
        navigateTo,
    };

    return <NavigationContext.Provider value={value}>{children}</NavigationContext.Provider>;
};

export const useNavigation = (): NavigationContextState => {
    const context = useContext(NavigationContext);
    if (context === undefined) {
        throw new Error('useNavigation must be used within a NavigationProvider');
    }
    return context;
};
