import React, { useState, useEffect } from 'react';

export const QuickNotificationTest: React.FC = () => {
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
    const [testResults, setTestResults] = useState<string[]>([]);

    useEffect(() => {
        if ('Notification' in window) {
            setPermissionStatus(Notification.permission);
            addResult(`🔍 Permission actuelle: ${Notification.permission}`);
            addResult(`🌐 Protocole: ${window.location.protocol}`);
            addResult(`📍 Host: ${window.location.host}`);
        } else {
            addResult('❌ API Notification non supportée');
        }
    }, []);

    const addResult = (message: string) => {
        const timestamp = new Date().toLocaleTimeString();
        setTestResults(prev => [`[${timestamp}] ${message}`, ...prev.slice(0, 19)]);
    };

    const testStep1_RequestPermission = async () => {
        addResult('🔔 Étape 1: Demande de permission...');
        
        if (!('Notification' in window)) {
            addResult('❌ Notifications non supportées par ce navigateur');
            return;
        }

        try {
            const permission = await Notification.requestPermission();
            setPermissionStatus(permission);
            
            if (permission === 'granted') {
                addResult('✅ Permission accordée !');
            } else if (permission === 'denied') {
                addResult('❌ Permission refusée par l\'utilisateur');
            } else {
                addResult('⚠️ Permission ignorée');
            }
        } catch (error) {
            addResult(`❌ Erreur: ${error}`);
        }
    };

    const testStep2_SimpleNotification = () => {
        addResult('🔔 Étape 2: Test notification simple...');
        
        if (Notification.permission !== 'granted') {
            addResult('❌ Permission non accordée. Faites l\'étape 1 d\'abord.');
            return;
        }

        try {
            const notification = new Notification('🧪 Test Simple', {
                body: 'Si vous voyez ceci, les notifications de base fonctionnent !',
                icon: '/vite.svg'
            });

            notification.onshow = () => addResult('✅ Notification simple affichée');
            notification.onerror = (error) => addResult(`❌ Erreur affichage: ${error}`);
            notification.onclick = () => {
                addResult('👆 Notification cliquée');
                notification.close();
            };

            setTimeout(() => notification.close(), 3000);
            
        } catch (error) {
            addResult(`❌ Erreur création: ${error}`);
        }
    };

    const testStep3_AdvancedNotification = () => {
        addResult('🔔 Étape 3: Test notification avancée...');
        
        if (Notification.permission !== 'granted') {
            addResult('❌ Permission non accordée');
            return;
        }

        try {
            const notification = new Notification('SecureTrans', {
                body: 'Nouvelle transaction à valider : Transfert (50000 XOF)',
                icon: '/vite.svg',
                badge: '/vite.svg',
                tag: 'test-transaction',
                requireInteraction: true,
                silent: false,
            });

            notification.onshow = () => addResult('✅ Notification avancée affichée');
            notification.onerror = (error) => addResult(`❌ Erreur: ${error}`);
            notification.onclick = () => {
                addResult('👆 Notification avancée cliquée');
                notification.close();
            };

        } catch (error) {
            addResult(`❌ Erreur notification avancée: ${error}`);
        }
    };

    const testStep4_RealtimeSimulation = async () => {
        addResult('🔔 Étape 4: Simulation temps réel...');
        
        // Simuler ce qui se passe dans le NotificationContext
        const mockNotification = {
            id: 'test-' + Date.now(),
            text: 'Simulation: Nouvelle transaction à valider',
            icon: 'fa-clipboard-check',
            type: 'transaction_validation',
            silent: false,
            created_at: new Date().toISOString()
        };

        addResult(`📨 Notification simulée: ${mockNotification.text}`);

        if ('Notification' in window && Notification.permission === 'granted') {
            try {
                const browserNotification = new Notification('SecureTrans', {
                    body: mockNotification.text,
                    icon: '/vite.svg',
                    tag: mockNotification.id,
                    badge: '/vite.svg',
                    requireInteraction: mockNotification.type === 'transaction_validation'
                });

                browserNotification.onshow = () => addResult('✅ Simulation temps réel réussie');
                browserNotification.onerror = (error) => addResult(`❌ Erreur simulation: ${error}`);
                
                setTimeout(() => browserNotification.close(), 5000);
                
            } catch (error) {
                addResult(`❌ Erreur simulation: ${error}`);
            }
        } else {
            addResult('❌ Conditions non remplies pour la simulation');
        }
    };

    const clearResults = () => {
        setTestResults([]);
    };

    const getPermissionColor = () => {
        switch (permissionStatus) {
            case 'granted': return 'text-green-600 bg-green-50';
            case 'denied': return 'text-red-600 bg-red-50';
            default: return 'text-yellow-600 bg-yellow-50';
        }
    };

    return (
        <div className="bg-white rounded-lg shadow p-6 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold mb-4 flex items-center">
                <i className="fas fa-flask mr-2 text-blue-600"></i>
                Test Rapide des Notifications (Localhost)
            </h2>

            {/* Statut actuel */}
            <div className="mb-6 p-4 border rounded">
                <h3 className="font-semibold mb-2">Statut Actuel</h3>
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span>Support navigateur:</span>
                        <span className={`px-2 py-1 rounded text-sm ${
                            'Notification' in window ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
                        }`}>
                            {'Notification' in window ? '✅ Supporté' : '❌ Non supporté'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Permission:</span>
                        <span className={`px-2 py-1 rounded text-sm ${getPermissionColor()}`}>
                            {permissionStatus === 'granted' ? '✅ Accordée' :
                             permissionStatus === 'denied' ? '❌ Refusée' :
                             '⚠️ Non demandée'}
                        </span>
                    </div>
                    <div className="flex justify-between">
                        <span>Protocole:</span>
                        <span className="text-sm text-gray-600">{window.location.protocol}</span>
                    </div>
                </div>
            </div>

            {/* Tests étape par étape */}
            <div className="mb-6">
                <h3 className="font-semibold mb-3">Tests Étape par Étape</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                        onClick={testStep1_RequestPermission}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                        1️⃣ Demander Permission
                    </button>
                    
                    <button
                        onClick={testStep2_SimpleNotification}
                        disabled={permissionStatus !== 'granted'}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 text-sm"
                    >
                        2️⃣ Test Simple
                    </button>
                    
                    <button
                        onClick={testStep3_AdvancedNotification}
                        disabled={permissionStatus !== 'granted'}
                        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300 text-sm"
                    >
                        3️⃣ Test Avancé
                    </button>
                    
                    <button
                        onClick={testStep4_RealtimeSimulation}
                        disabled={permissionStatus !== 'granted'}
                        className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 disabled:bg-gray-300 text-sm"
                    >
                        4️⃣ Simulation Temps Réel
                    </button>
                </div>
            </div>

            {/* Résultats */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <h3 className="font-semibold">Résultats des Tests</h3>
                    <button
                        onClick={clearResults}
                        className="px-3 py-1 bg-gray-500 text-white rounded text-sm hover:bg-gray-600"
                    >
                        Effacer
                    </button>
                </div>
                <div className="bg-gray-50 rounded p-3 max-h-64 overflow-y-auto">
                    {testResults.length > 0 ? (
                        <div className="space-y-1">
                            {testResults.map((result, index) => (
                                <div key={index} className="text-sm font-mono">
                                    {result}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-gray-500 text-sm italic">
                            Cliquez sur les boutons ci-dessus pour commencer les tests.
                        </p>
                    )}
                </div>
            </div>

            {/* Instructions spécifiques localhost */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded">
                <h4 className="font-semibold text-blue-800 mb-2">
                    <i className="fas fa-info-circle mr-2"></i>
                    Instructions Localhost
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• En localhost, HTTPS n'est pas requis</li>
                    <li>• Commencez par l'étape 1 pour demander la permission</li>
                    <li>• Si l'étape 2 fonctionne mais pas votre app, le problème est dans le code</li>
                    <li>• Ouvrez la console (F12) pour voir les messages de debug</li>
                </ul>
            </div>
        </div>
    );
};

export default QuickNotificationTest;