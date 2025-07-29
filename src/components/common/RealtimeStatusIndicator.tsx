import React, { useState } from 'react';
import { useNotifications } from '../../context/NotificationContext';

interface RealtimeStatusIndicatorProps {
    showDetails?: boolean;
    className?: string;
}

export const RealtimeStatusIndicator: React.FC<RealtimeStatusIndicatorProps> = ({ 
    showDetails = false, 
    className = '' 
}) => {
    const { connectionStatus, systemEvents, triggerRefresh } = useNotifications();
    const [showDropdown, setShowDropdown] = useState(false);

    const getStatusConfig = () => {
        switch (connectionStatus) {
            case 'connected':
                return {
                    color: 'bg-green-500',
                    textColor: 'text-green-600',
                    text: 'Temps réel actif',
                    icon: 'fa-wifi'
                };
            case 'reconnecting':
                return {
                    color: 'bg-yellow-500 animate-pulse',
                    textColor: 'text-yellow-600',
                    text: 'Reconnexion...',
                    icon: 'fa-sync fa-spin'
                };
            case 'disconnected':
                return {
                    color: 'bg-red-500',
                    textColor: 'text-red-600',
                    text: 'Hors ligne',
                    icon: 'fa-wifi-slash'
                };
            default:
                return {
                    color: 'bg-gray-500',
                    textColor: 'text-gray-600',
                    text: 'Inconnu',
                    icon: 'fa-question'
                };
        }
    };

    const status = getStatusConfig();
    const recentEvents = systemEvents.slice(0, 5);

    if (!showDetails) {
        // Version simple - juste l'indicateur
        return (
            <div className={`flex items-center space-x-2 ${className}`}>
                <div className={`w-2 h-2 rounded-full ${status.color}`}></div>
                <span className={`text-xs ${status.textColor} hidden sm:inline`}>
                    {status.text}
                </span>
            </div>
        );
    }

    // Version détaillée avec dropdown
    return (
        <div className={`relative ${className}`}>
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center space-x-2 px-2 py-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                title="Statut temps réel"
            >
                <div className={`w-3 h-3 rounded-full ${status.color}`}></div>
                <i className={`fas ${status.icon} text-xs ${status.textColor}`}></i>
                <span className={`text-xs ${status.textColor} hidden md:inline`}>
                    {status.text}
                </span>
                <i className="fas fa-chevron-down text-xs text-gray-400"></i>
            </button>

            {showDropdown && (
                <>
                    {/* Overlay pour fermer le dropdown */}
                    <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setShowDropdown(false)}
                    ></div>
                    
                    {/* Dropdown content */}
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 z-20">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                                    Statut Temps Réel
                                </h3>
                                <div className="flex items-center space-x-2">
                                    <div className={`w-2 h-2 rounded-full ${status.color}`}></div>
                                    <span className={`text-sm ${status.textColor}`}>
                                        {status.text}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Actions rapides */}
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Actions rapides :
                            </p>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={() => {
                                        triggerRefresh('balance');
                                        setShowDropdown(false);
                                    }}
                                    className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600 transition-colors"
                                >
                                    <i className="fas fa-wallet mr-1"></i>
                                    Actualiser Solde
                                </button>
                                <button
                                    onClick={() => {
                                        triggerRefresh('dashboard');
                                        setShowDropdown(false);
                                    }}
                                    className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600 transition-colors"
                                >
                                    <i className="fas fa-chart-bar mr-1"></i>
                                    Actualiser Dashboard
                                </button>
                                <button
                                    onClick={() => {
                                        triggerRefresh('transactions');
                                        setShowDropdown(false);
                                    }}
                                    className="px-2 py-1 bg-purple-500 text-white text-xs rounded hover:bg-purple-600 transition-colors"
                                >
                                    <i className="fas fa-exchange-alt mr-1"></i>
                                    Actualiser Transactions
                                </button>
                            </div>
                        </div>

                        {/* Événements récents */}
                        <div className="px-4 py-3">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                Événements récents :
                            </p>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                                {recentEvents.length > 0 ? (
                                    recentEvents.map((event, index) => (
                                        <div 
                                            key={index} 
                                            className="text-xs font-mono bg-gray-50 dark:bg-gray-700 p-2 rounded"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-blue-600 dark:text-blue-400">
                                                    {event.timestamp.toLocaleTimeString()}
                                                </span>
                                                <span className="text-gray-500">
                                                    {event.type}
                                                </span>
                                            </div>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <span className="text-green-600 dark:text-green-400 font-semibold">
                                                    {event.action}
                                                </span>
                                                <span className="text-purple-600 dark:text-purple-400">
                                                    {event.target}
                                                </span>
                                            </div>
                                            {event.data && (
                                                <div className="text-gray-600 dark:text-gray-400 mt-1 truncate">
                                                    {JSON.stringify(event.data)}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-gray-500 dark:text-gray-400 text-xs italic">
                                        Aucun événement récent
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Footer avec info */}
                        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700 rounded-b-lg">
                            <p className="text-xs text-gray-600 dark:text-gray-400">
                                <i className="fas fa-info-circle mr-1"></i>
                                Les données se mettent à jour automatiquement
                            </p>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default RealtimeStatusIndicator;