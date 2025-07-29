import React from 'react';
import { useRealtimeData, useDashboardStats, useUserBalance } from '../../hooks/useRealtimeData';
import { useNotifications } from '../../context/NotificationContext';
import { User } from '../../types';
import { supabase } from '../../supabaseClient';

interface RealtimeDashboardExampleProps {
    user: User;
}

/**
 * Exemple d'utilisation du nouveau système de notifications temps réel
 * Ce composant montre comment intégrer les hooks dans vos dashboards existants
 */
export const RealtimeDashboardExample: React.FC<RealtimeDashboardExampleProps> = ({ user }) => {
    const { connectionStatus, systemEvents, triggerRefresh } = useNotifications();
    
    // Utilisation des hooks spécialisés
    const { data: balance, loading: balanceLoading, error: balanceError } = useUserBalance(user.id);
    const { data: stats, loading: statsLoading, error: statsError } = useDashboardStats(user.id, user.role);
    
    // Exemple d'utilisation du hook générique
    const { data: recentActivity, loading: activityLoading } = useRealtimeData(
        ['transactions', 'recharge_requests'], // Cibles à écouter
        async () => {
            // Votre logique de récupération des données
            const { data } = await supabase
                .from('transactions')
                .select('*')
                .eq('agent_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);
            return data || [];
        },
        [user.id] // Dépendances
    );

    // Indicateur de statut de connexion
    const getConnectionStatusColor = () => {
        switch (connectionStatus) {
            case 'connected': return 'text-green-500';
            case 'reconnecting': return 'text-yellow-500';
            case 'disconnected': return 'text-red-500';
            default: return 'text-gray-500';
        }
    };

    const getConnectionStatusText = () => {
        switch (connectionStatus) {
            case 'connected': return 'Connecté';
            case 'reconnecting': return 'Reconnexion...';
            case 'disconnected': return 'Déconnecté';
            default: return 'Inconnu';
        }
    };

    return (
        <div className="space-y-6">
            {/* Indicateur de statut temps réel */}
            <div className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Statut Temps Réel</h3>
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'reconnecting' ? 'bg-yellow-500' : 'bg-red-500'}`}></div>
                        <span className={`text-sm font-medium ${getConnectionStatusColor()}`}>
                            {getConnectionStatusText()}
                        </span>
                    </div>
                </div>
                
                {/* Bouton de rafraîchissement manuel */}
                <div className="mt-4 flex space-x-2">
                    <button
                        onClick={() => triggerRefresh('balance')}
                        className="px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
                    >
                        Actualiser Solde
                    </button>
                    <button
                        onClick={() => triggerRefresh('dashboard')}
                        className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
                    >
                        Actualiser Dashboard
                    </button>
                </div>
            </div>

            {/* Solde avec actualisation temps réel */}
            <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold mb-4">Solde (Temps Réel)</h3>
                {balanceLoading ? (
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-32"></div>
                    </div>
                ) : balanceError ? (
                    <div className="text-red-500">Erreur: {balanceError}</div>
                ) : balance ? (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Solde Principal</p>
                            <p className="text-2xl font-bold text-green-600">
                                {balance.solde?.toLocaleString()} XOF
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Commissions</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {balance.commissions_dues?.toLocaleString()} XOF
                            </p>
                        </div>
                    </div>
                ) : null}
            </div>

            {/* Statistiques avec actualisation temps réel */}
            <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold mb-4">Statistiques (Temps Réel)</h3>
                {statsLoading ? (
                    <div className="animate-pulse space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                    </div>
                ) : statsError ? (
                    <div className="text-red-500">Erreur: {statsError}</div>
                ) : stats ? (
                    <div className="space-y-2">
                        {Object.entries(stats).map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                                <span className="text-gray-600 capitalize">
                                    {key.replace(/_/g, ' ')}:
                                </span>
                                <span className="font-semibold">
                                    {typeof value === 'number' ? value.toLocaleString() : String(value)}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>

            {/* Activité récente avec actualisation temps réel */}
            <div className="bg-white rounded-lg shadow p-4">
                <h3 className="text-lg font-semibold mb-4">Activité Récente (Temps Réel)</h3>
                {activityLoading ? (
                    <div className="animate-pulse space-y-2">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-12 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                ) : recentActivity && recentActivity.length > 0 ? (
                    <div className="space-y-2">
                        {recentActivity.map((activity: any) => (
                            <div key={activity.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <div>
                                    <p className="font-medium">{activity.montant_principal} XOF</p>
                                    <p className="text-sm text-gray-600">{activity.status}</p>
                                </div>
                                <span className="text-xs text-gray-500">
                                    {new Date(activity.created_at).toLocaleDateString()}
                                </span>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-gray-500">Aucune activité récente</p>
                )}
            </div>

            {/* Debug: Événements système récents */}
            <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-lg font-semibold mb-4">Événements Système (Debug)</h3>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                    {systemEvents.slice(0, 10).map((event, index) => (
                        <div key={index} className="text-xs font-mono bg-white p-2 rounded">
                            <span className="text-blue-600">{event.timestamp.toLocaleTimeString()}</span>
                            {' '}
                            <span className="text-green-600">{event.action}</span>
                            {' '}
                            <span className="text-purple-600">{event.target}</span>
                            {event.data && (
                                <span className="text-gray-600"> - {JSON.stringify(event.data)}</span>
                            )}
                        </div>
                    ))}
                    {systemEvents.length === 0 && (
                        <p className="text-gray-500 text-sm">Aucun événement système récent</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RealtimeDashboardExample;