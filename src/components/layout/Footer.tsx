
import React from 'react';

export const Footer: React.FC = () => (
    <footer className="app-footer">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 max-w-7xl mx-auto">
            <p className="text-sm">
                &copy; {new Date().getFullYear()} <span className="font-semibold text-blue-400">SecureTrans</span>. Tous droits réservés.
            </p>
            <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>Version 1.0.0</span>
                <span>•</span>
                <span>Plateforme sécurisée</span>
            </div>
        </div>
    </footer>
);
