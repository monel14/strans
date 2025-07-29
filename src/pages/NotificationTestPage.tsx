import React from 'react';
import { NotificationDebugger } from '../components/debug/NotificationDebugger';
import { useNotifications } from '../context/NotificationContext';
import { supabase } from '../supabaseClient';

export const NotificationTestPage: React.FC = () => {
    const { notifications, connectionStatus, triggerRefresh } = useNotifications();

    const simulateTransaction = async () => {
        try {
            // Simuler l'insertion d'une notification de test directement en base
            
            const testNotification = {
                user_id: 'current-user-id', // Remplacer par l'ID utilisateur actuel
                text: '🧪 Test: Nouvelle transaction à valider (50000 XOF)',
                icon: 'fa-clipboard-check',
                link: '/admin/validations',
                type: 'transaction_validation',
                read: false,
                silent: false
            };

            const { data, error } = await supabase
                .from('notifications')
                .insert([testNotification])
                .select();

            if (error) {
                console.error('Erreur lors de la création de la notification test:', error);
                alert('Erreur: ' + error.message);
            } else {
                console.log('✅ Notification test créée:', data);
                alert('Notification test créée ! Vérifiez si elle s\'affiche.');
            }
        } catch (error) {
            console.error('Erreur:', error);
            alert('Erreur lors du test: ' + (error as Error).message);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        🧪 Test des Notifications
                    </h1>
                    <p className="text-gray-600">
                        Utilisez cette page pour diagnostiquer et tester le système de notifications.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Diagnostic des notifications navigateur */}
                    <div>
                        <NotificationDebugger />
                    </div>

                    {/* Statut du système temps réel */}
                    <div className="bg-white rounded-lg shadow-lg p-6">
                        <h2 className="text-xl font-bold mb-4 flex items-center">
                            <i className="fas fa-satellite-dish mr-2 text-green-600"></i>
                            Système Temps Réel
                        </h2>

                        <div className="space-y-4">
                            {/* Statut de connexion */}
                            <div className="p-4 border rounded">
                                <h3 className="font-semibold mb-2">Statut de Connexion</h3>
                                <div className="flex items-center space-x-2">
                                    <div className={`w-3 h-3 rounded-full ${
                                        connectionStatus === 'connected' ? 'bg-green-500' : 
                                        connectionStatus === 'reconnecting' ? 'bg-yellow-500 animate-pulse' : 
                                        'bg-red-500'
                                    }`}></div>
                                    <span className={`font-medium ${
                                        connectionStatus === 'connected' ? 'text-green-600' : 
                                        connectionStatus === 'reconnecting' ? 'text-yellow-600' : 
                                        'text-red-600'
                                    }`}>
                                        {connectionStatus === 'connected' ? 'Connecté' :
                                         connectionStatus === 'reconnecting' ? 'Reconnexion...' :
                                         'Déconnecté'}
                                    </span>
                                </div>
                            </div>

                            {/* Notifications récentes */}
                            <div className="p-4 border rounded">
                                <h3 className="font-semibold mb-2">Notifications Récentes</h3>
                                <div className="space-y-2 max-h-40 overflow-y-auto">
                                    {notifications.slice(0, 5).map((notif, index) => (
                                        <div key={notif.id || index} className="text-sm p-2 bg-gray-50 rounded">
                                            <div className="flex items-start space-x-2">
                                                <i className={`fas ${notif.icon} mt-1 text-blue-600`}></i>
                                                <div className="flex-1">
                                                    <p className="text-gray-800">{notif.text}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {new Date(notif.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                {!notif.read && (
                                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    {notifications.length === 0 && (
                                        <p className="text-gray-500 text-sm italic">
                                            Aucune notification récente
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Actions de test */}
                            <div className="p-4 border rounded">
                                <h3 className="font-semibold mb-3">Tests du Système</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={simulateTransaction}
                                        className="w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                    >
                                        <i className="fas fa-plus mr-2"></i>
                                        Simuler Nouvelle Transaction
                                    </button>
                                    
                                    <button
                                        onClick={() => triggerRefresh('test')}
                                        className="w-full px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                                    >
                                        <i className="fas fa-sync mr-2"></i>
                                        Test Événement Système
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Instructions de dépannage */}
                <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
                    <h2 className="text-xl font-bold mb-4 flex items-center">
                        <i className="fas fa-tools mr-2 text-orange-600"></i>
                        Guide de Dépannage
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold mb-3 text-red-600">❌ Problèmes Courants</h3>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start space-x-2">
                                    <span className="text-red-500">•</span>
                                    <span>Notifications bloquées dans les paramètres du navigateur</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="text-red-500">•</span>
                                    <span>Site pas en HTTPS (requis pour les notifications)</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="text-red-500">•</span>
                                    <span>Navigation privée/incognito active</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="text-red-500">•</span>
                                    <span>Notifications système désactivées (OS)</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="text-red-500">•</span>
                                    <span>Page dans un iframe</span>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-3 text-green-600">✅ Solutions</h3>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start space-x-2">
                                    <span className="text-green-500">•</span>
                                    <span>Cliquer sur l'icône 🔒 dans la barre d'adresse</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="text-green-500">•</span>
                                    <span>Autoriser les notifications pour ce site</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="text-green-500">•</span>
                                    <span>Recharger la page après avoir accordé les permissions</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="text-green-500">•</span>
                                    <span>Vérifier les paramètres de notification de l'OS</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="text-green-500">•</span>
                                    <span>Tester dans un onglet normal (pas privé)</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
                        <h4 className="font-semibold text-yellow-800 mb-2">
                            <i className="fas fa-lightbulb mr-2"></i>
                            Astuce Pro
                        </h4>
                        <p className="text-yellow-700 text-sm">
                            Ouvrez les outils de développement (F12) et regardez la console pour voir les messages de debug 
                            des notifications. Cela vous aidera à identifier le problème exact.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationTestPage;