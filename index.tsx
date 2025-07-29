
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './src/App';
import { AuthProvider } from './src/context/AuthContext';
import { NotificationProvider } from './src/context/NotificationContext';
import { UIProvider } from './src/context/UIContext';
import { NavigationProvider } from './src/context/NavigationContext';

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('root');
    if (container) {
        const root = createRoot(container);
        try {
            root.render(
                <React.StrictMode>
                    <AuthProvider>
                        <NavigationProvider>
                            <NotificationProvider>
                                <UIProvider>
                                    <App />
                                </UIProvider>
                            </NotificationProvider>
                        </NavigationProvider>
                    </AuthProvider>
                </React.StrictMode>
            );
        } catch (error) {
            console.error('Erreur lors du rendu de l\'application:', error);
            const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
            container.innerHTML = `
                <div style="padding: 2rem; font-family: sans-serif; background-color: #fff3f3; border: 2px solid #ff0000; margin: 2rem; border-radius: 8px;">
                    <h1 style="color: #ff0000; font-size: 1.5rem;">Erreur de Rendu</h1>
                    <pre style="white-space: pre-wrap; word-wrap: break-word; font-size: 1rem;">
                        Une erreur s'est produite lors du chargement de l'application.
                        Erreur: ${errorMessage}
                    </pre>
                    <button onclick="window.location.reload()" style="margin-top: 1rem; padding: 0.5rem 1rem; background-color: #3b82f6; color: white; border: none; border-radius: 0.375rem; cursor: pointer;">
                        Réessayer
                    </button>
                </div>
            `;
        }
    }
});
