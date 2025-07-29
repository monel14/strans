
import React, { useState, useRef, useEffect } from 'react';
import { User, Notification, NavLink } from '../../types';
import { timeAgo } from '../../utils/formatters';
import { NotificationHistory } from '../notifications/NotificationHistory';
import { NotificationTemplateManager } from '../notifications/NotificationTemplateManager';
import { PushNotificationSettings } from '../notifications/PushNotificationSettings';

interface HeaderProps {
    currentUser: User;
    notifications: Notification[];
    unreadCount: number;
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onLogout: () => void;
    handleNavigate: (pageKey: string) => void;
    navigationLinks: { [role: string]: NavLink[] };
    currentPageKey: string;
}

// Custom hook to detect clicks outside a component
const useOutsideClick = (ref: React.RefObject<HTMLDivElement>, callback: () => void) => {
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (ref.current && !ref.current.contains(event.target as Node)) {
                callback();
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [ref, callback]);
};

const DropdownMenu: React.FC<{ children: React.ReactNode, className?: string }> = ({ children, className }) => (
    <div className={`absolute right-0 mt-2 w-80 bg-white rounded-md shadow-xl z-20 border origin-top-right transition-transform-opacity duration-300 ease-out transform opacity-100 scale-100 dark:bg-gray-800 dark:border-gray-700 ${className}`}>
        {children}
    </div>
);

export const Header: React.FC<HeaderProps> = ({ 
    currentUser, notifications, unreadCount, onMarkAsRead, onMarkAllAsRead, onLogout, handleNavigate, navigationLinks, currentPageKey
}) => {
    const [openDropdown, setOpenDropdown] = useState<'notifications' | 'user' | null>(null);
    const [showHistory, setShowHistory] = useState(false);
    const [showTemplateManager, setShowTemplateManager] = useState(false);
    const [showPushSettings, setShowPushSettings] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useOutsideClick(dropdownRef, () => setOpenDropdown(null));

    const handleDropdownToggle = (type: 'notifications' | 'user') => {
        setOpenDropdown(prev => (prev === type ? null : type));
    };

    const handleMenuClick = (key: string) => {
        handleNavigate(key);
        setOpenDropdown(null);
    };

    const links = navigationLinks[currentUser.role] || [];

    return (
        <header className="bg-white dark:bg-gray-900 shadow-md w-full sticky top-0 z-30">
            <div className="max-w-screen-xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo and Desktop Navigation */}
                    <div className="flex items-center">
                        <div className="flex-shrink-0 flex items-center space-x-2">
                            <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center rounded-lg shadow-lg">
                                <i className="fas fa-shield-alt text-white text-lg"></i>
                            </div>
                            <span className="hidden sm:block text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 dark:from-blue-400 dark:to-purple-400">SecureTrans</span>
                        </div>
                        <nav className="hidden md:flex md:ml-10 md:space-x-4 lg:space-x-8">
                            {links.map(link => {
                                const isActive = link.key === currentPageKey;
                                return (
                                    <a
                                        key={link.key}
                                        href="#"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            if (link.component) handleNavigate(link.key);
                                        }}
                                        className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors duration-200 ${
                                            isActive
                                                ? 'border-blue-500 text-gray-900 dark:text-white'
                                                : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white'
                                        }`}
                                    >
                                        <i className={`fas ${link.icon} mr-2 hidden lg:inline-block`}></i>
                                        {link.label}
                                    </a>
                                );
                            })}
                        </nav>
                    </div>

                    {/* Right side: Notifications and User Menu */}
                    <div ref={dropdownRef} className="flex items-center space-x-4">
                        {/* Notifications */}
                        <div className="relative">
                            <button onClick={() => handleDropdownToggle('notifications')} className="text-gray-500 hover:text-gray-700 focus:outline-none dark:text-gray-400 dark:hover:text-white">
                                <i className="fas fa-bell text-xl"></i>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1 -right-1 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center ring-2 ring-white">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                            {openDropdown === 'notifications' && (
                                <DropdownMenu>
                                    <div className="p-3 border-b dark:border-gray-700">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="font-semibold text-sm text-gray-700 dark:text-gray-200">Notifications Récentes</span>
                                            {unreadCount > 0 && <button onClick={onMarkAllAsRead} className="text-xs text-blue-600 hover:underline dark:text-blue-400">Tout marquer comme lu</button>}
                                        </div>
                                        <div className="flex space-x-2">
                                            <button
                                                onClick={() => {
                                                    setShowHistory(true);
                                                    setOpenDropdown(null);
                                                }}
                                                className="text-xs text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                                            >
                                                <i className="fas fa-history mr-1"></i>
                                                Historique
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowPushSettings(true);
                                                    setOpenDropdown(null);
                                                }}
                                                className="text-xs text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                                            >
                                                <i className="fas fa-mobile-alt mr-1"></i>
                                                Push
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setShowTemplateManager(true);
                                                    setOpenDropdown(null);
                                                }}
                                                className="text-xs text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400"
                                            >
                                                <i className="fas fa-palette mr-1"></i>
                                                Templates
                                            </button>
                                        </div>
                                    </div>
                                    <div className="py-1 max-h-80 overflow-y-auto">
                                        {notifications.slice(0, 5).map(notif => (
                                            <a key={notif.id} href={notif.link || '#'} onClick={() => onMarkAsRead(notif.id)} className={`block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 ${!notif.read ? 'bg-blue-50 dark:bg-blue-900/50' : ''}`}>
                                                <div className="flex items-start">
                                                    <i className={`fas ${notif.icon} mr-3 mt-1`}></i>
                                                    <div>
                                                        <p className="text-gray-800 dark:text-gray-200">{notif.text}</p>
                                                        <p className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(notif.created_at)}</p>
                                                    </div>
                                                </div>
                                            </a>
                                        ))}
                                    </div>
                                    <button
                                        onClick={() => {
                                            setShowHistory(true);
                                            setOpenDropdown(null);
                                        }}
                                        className="block w-full text-center p-2 text-sm text-blue-600 hover:bg-gray-100 dark:text-blue-400 dark:hover:bg-gray-700"
                                    >
                                        Voir toutes les notifications
                                    </button>
                                </DropdownMenu>
                            )}
                        </div>

                        {/* User Menu */}
                        <div className="relative">
                            <button onClick={() => handleDropdownToggle('user')} className="flex items-center focus:outline-none">
                                <img src={`https://placehold.co/40x40/E2E8F0/4A5568?text=${currentUser.avatar_seed}`} alt="Avatar" className="w-8 h-8 sm:w-10 sm:h-10 rounded-full mr-2 object-cover"/>
                                <div className="hidden md:block text-left">
                                    <p className="font-medium text-sm text-gray-700 dark:text-gray-200">{currentUser.name}</p>
                                    <p className="text-xs text-gray-500 capitalize dark:text-gray-400">{currentUser.role.replace(/_/g, ' ')}</p>
                                </div>
                            </button>
                            {openDropdown === 'user' && (
                                <DropdownMenu className="!w-56">
                                    <div className="px-4 py-3 border-b dark:border-gray-700">
                                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{currentUser.name}</p>
                                        <p className="text-xs text-gray-500 truncate dark:text-gray-400">{currentUser.email}</p>
                                    </div>
                                    <div className="py-1">
                                        <button onClick={() => handleMenuClick('Mon Profil')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                                            <i className="fas fa-user-circle fa-fw mr-2 text-gray-400"></i>Mon Profil
                                        </button>
                                        <button onClick={() => handleMenuClick('Paramètres')} className="w-full text-left block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700">
                                            <i className="fas fa-cog fa-fw mr-2 text-gray-400"></i>Paramètres
                                        </button>
                                    </div>
                                    <div className="py-1 border-t dark:border-gray-700">
                                        <button onClick={onLogout} className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 dark:text-red-400">
                                            <i className="fas fa-sign-out-alt fa-fw mr-2"></i>Déconnexion
                                        </button>
                                    </div>
                                </DropdownMenu>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <NotificationHistory 
                isOpen={showHistory} 
                onClose={() => setShowHistory(false)} 
            />
            <NotificationTemplateManager 
                isOpen={showTemplateManager} 
                onClose={() => setShowTemplateManager(false)} 
            />
            <PushNotificationSettings 
                isOpen={showPushSettings} 
                onClose={() => setShowPushSettings(false)} 
            />
        </header>
    );
};
