
import React from 'react';
import { User } from '../../types';

interface BottomNavProps {
    currentUser: User;
    currentPageKey: string;
    handleNavigate: (pageKey: string) => void;
}

const navLinksConfig: { [role: string]: { key: string, label: string, icon: string }[] } = {
    agent: [
        { key: 'Tableau de Bord', label: 'Dashboard', icon: 'fa-chart-pie' },
        { key: 'Opérations', label: 'Opérations', icon: 'fa-exchange-alt' },
        { key: 'Requêtes', label: 'Requêtes', icon: 'fa-headset' },
    ],
    chef_agence: [
        { key: 'Tableau de Bord', label: 'Dashboard', icon: 'fa-chart-line' },
        { key: 'Gestion des Agents', label: 'Agents', icon: 'fa-users-cog' },
        { key: 'Historique Agence', label: 'Historique', icon: 'fa-landmark' },
        { key: 'Mes Commissions', label: 'Commissions', icon: 'fa-percent' },
        { key: 'Mes Requêtes', label: 'Requêtes', icon: 'fa-headset' },
    ],
    admin_general: [
        { key: 'Tableau de Bord Global', label: 'Dashboard', icon: 'fa-globe-americas' },
        { key: 'Gestion des Transactions', label: 'Validations', icon: 'fa-cogs' },
        { key: 'Gestion & Administration', label: 'Gestion', icon: 'fa-users-cog' },
        { key: 'Gestion des Requêtes', label: 'Requêtes', icon: 'fa-envelope-open-text' },
    ],
    sous_admin: [
        { key: 'Gestion des Transactions', label: 'Validations', icon: 'fa-check-square' },
        { key: 'Gestion des Requêtes', label: 'Requêtes', icon: 'fa-headset' },
    ],
    developpeur: [
        { key: 'Dashboard Technique', label: 'Dashboard', icon: 'fa-server' },
        { key: 'Types d\'Opérations', label: 'Opérations', icon: 'fa-cogs' },
        { key: 'Configuration Globale', label: 'Config', icon: 'fa-tools' },
        { key: 'Journaux d\'Erreurs', label: 'Logs', icon: 'fa-bug' },
    ],
};

export const BottomNav: React.FC<BottomNavProps> = ({ currentUser, currentPageKey, handleNavigate }) => {
    const links = navLinksConfig[currentUser.role] || [];

    return (
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 shadow-t-lg z-40">
            <div className="flex justify-around items-center h-16">
                {links.map(link => {
                    const isActive = currentPageKey === link.key;
                    return (
                        <button
                            key={link.key}
                            onClick={() => handleNavigate(link.key)}
                            className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400 hover:text-blue-500'}`}
                        >
                            <i className={`fas ${link.icon} text-xl`}></i>
                            <span className={`text-xs mt-1 font-medium ${isActive ? 'font-bold' : ''}`}>{link.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
};
