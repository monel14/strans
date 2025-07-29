import React from 'react';
import { User, NavLink } from '../../types';

interface SidebarProps {
    currentUser: User;
    navigationLinks: { [role: string]: NavLink[] };
    currentPageKey: string;
    handleNavigate: (pageKey: string) => void;
    handleAction: (actionKey: string, data?: any) => void;
    handleLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentUser, navigationLinks, currentPageKey, handleNavigate, handleAction, handleLogout }) => {
    return (
        <aside
            className="sidebar w-64 bg-gray-900 text-gray-100 p-4 space-y-2 flex flex-col fixed inset-y-0 left-0 z-40 transform -translate-x-full transition-transform duration-300 ease-in-out md:translate-x-0 dark:bg-gray-900 dark:border-r dark:border-gray-800"
        >
            <div className="text-2xl font-bold text-center py-4 border-b border-gray-700 flex items-center justify-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center rounded-lg shadow-lg">
                    <i className="fas fa-shield-alt text-white text-lg"></i>
                </div>
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-400">SecureTrans</span>
            </div>
            <nav className="mt-2 flex-grow overflow-y-auto space-y-1 pr-2">
                {navigationLinks[currentUser.role].map(link => {
                    const isActive = link.key === currentPageKey;
                    return (
                        <a key={link.key} href="#" onClick={(e) => {
                            e.preventDefault();
                            if (link.component) handleNavigate(link.key);
                            if (link.action) handleAction(link.action);
                        }} className={`flex items-center space-x-3 px-3 py-2.5 rounded-md transition-all duration-200 text-sm group ${isActive ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md' : 'hover:bg-gray-800 text-gray-300'}`}>
                            <i className={`fas ${link.icon} w-5 text-center ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}></i>
                            <span className={`group-hover:text-white ${isActive ? 'font-semibold' : ''}`}>{link.label}</span>
                        </a>
                    )
                })}
            </nav>
            <div className="mt-auto pt-2 border-t border-gray-700">
                <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 rounded-md font-semibold bg-red-800/50 text-red-400 hover:bg-red-700/70 hover:text-white transition-colors duration-200">
                    <i className="fas fa-sign-out-alt"></i>
                    <span>Déconnexion</span>
                </button>
            </div>
        </aside>
    );
};