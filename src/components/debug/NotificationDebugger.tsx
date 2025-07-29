import React, { useState, useEffect } from 'react';

interface NotificationDebuggerProps {
    className?: string;
}

export const NotificationDebugger: React.FC<NotificationDebuggerProps> = ({ className = '' }) => {
    const [permissionStatus, setPermissionStatus] = useState<NotificationPermission>('default');
    const [isSupported, setIsSupported] = useState(false);
    const [lastError, setLastError] = useState<string | null>(null);
    const [testResults, setTestResults] = useState<string[]>([]);

    useEffect(() => {
        // Vérifier le support des notifications
        setIsSupported('Notification' in window);
        
        if ('Notification' in window) {
            setPermissionStatus(Notification.permission);
        }
    }, []);

    const addTestResult = (message: string) => {
        setTestResults(prev => [`${new Date().toLocaleTimeString()}: ${message}`, ...prev.slice(0, 9)]);
    };

    const requestPermission = async () => {
        try {
            if (!('Notification' in window)) {
                setLastError('Les notifications ne sont pas supportées par ce navigateur');
                return;
            }

            addTestResult('Demande de permission...');
            const permission = await Notification.requestPermission();
            setPermissionStatus(permission);
            
            if (permission === 'granted') {
                addTestResult('✅ Permission accordée');
                setLastError(null);
            } else if (permission === 'denied') {
                setLastError('Permission refusée par l\'utilisateur');
                addTestResult('❌ Permission refusée');
            } else {
                setLastError('Permission ignorée par l\'utilisateur');
                addTestResult('⚠️ Permission ignorée');
            }
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
            setLastError(`Erreur lors de la demande: ${errorMsg}`);
            addTestResult(`❌ Erreur: ${errorMsg}`);
        }
    };

    const testNotification = () => {
        try {
            if (!('Notification' in window)) {
                setLastError('Notifications non supportées');
                return;
            }

            if (Notification.permission !== 'granted') {
                setLastError('Permission non accordée. Cliquez sur "Demander Permission" d\'abord.');
                return;
            }

            addTestResult('Envoi notification test...');
            
            const notification = new Notification('🧪 Test SecureTrans', {
                body: 'Ceci est une notification de test. Si vous la voyez, tout fonctionne !',
                icon: '/vite.svg',
                tag: 'test-notification',
                badge: '/vite.svg',
                requireInteraction: false,
                silent: false
            });

            notification.onshow = () => {
                addTestResult('✅ Notification affichée avec succès');
                setLastError(null);
            };

            notification.onerror = (error) => {
                addTestResult('❌ Erreur lors de l\'affichage');
                setLastError('Erreur lors de l\'affichage de la notification');
                console.error('Notification error:', error);
            };

            notification.onclick = () => {
                addTestResult('👆 Notification cliquée');
                notification.close();
            };

            // Auto-fermer après 5 secondes
            setTimeout(() => {
                notification.close();
                addTestResult('🔄 Notification fermée automatiquement');
            }, 5000);

        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Erreur inconnue';
            setLastError(`Erreur lors du test: ${errorMsg}`);
            addTestResult(`❌ Erreur test: ${errorMsg}`);
            console.error('Test notification error:', error);
        }
    };

    const checkBrowserSettings = () => {
        const results = [];
        
        // Vérifications de base
        results.push(`Navigateur: ${navigator.userAgent.split(' ')[0]}`);
        results.push(`Support notifications: ${isSupported ? '✅' : '❌'}`);
        results.push(`Permission actuelle: ${permissionStatus}`);
        
        // Vérifications avancées
        if ('Notification' in window) {
            results.push(`API Notification disponible: ✅`);
        } else {
            results.push(`API Notification disponible: ❌`);
        }

        // Vérifier si on est en HTTPS (requis pour les notifications)
        results.push(`HTTPS: ${location.protocol === 'https:' ? '✅' : '❌ (Requis pour les notifications)'}`);
        
        // Vérifier si on est dans un iframe
        results.push(`Dans iframe: ${window !== window.top ? '⚠️ (Peut bloquer les notifications)' : '✅'}`);

        // Vérifier le focus de la page
        results.push(`Page active: ${document.hasFocus() ? '✅' : '⚠️'}`);

        setTestResults(results);
    };

    const resetPermissions = () => {
        addTestResult('ℹ️ Pour réinitialiser les permissions:');
        addTestResult('Chrome: Paramètres > Confidentialité > Notifications');
        addTestResult('Firefox: about:preferences#privacy');
        addTestResult('Safari: Préférences > Sites web > Notifications');
    };

    const getPermissionStatusColor = () => {
        switch (permissionStatus) {
            case 'granted': return 'text-green-600 bg-green-50';
            case 'denied': return 'text-red-600 bg-red-50';
            default: return 'text-yellow-600 bg-yellow-50';
        }
    };

    const getPermissionStatusText = () => {
        switch (permissionStatus) {
            case 'granted': return '✅ Accordée';
            case 'denied': return '❌ Refusée';
            default: return '⚠️ Non demandée';
        }
    };

    return (
        <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
            <h2 className="text-xl font-bold mb-4 flex items-center">
                <i className="fas fa-bug mr-2 text-blue-600"></i>
                Diagnostic des Notifications
            </h2>

            {/* Statut actuel */}
            <div className="mb-6">
                <h3 className="font-semibold mb-2">Statut Actuel</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 border rounded">
                        <p className="text-sm text-gray-600">Support Navigateur</p>
                        <p className={`font-semibold ${isSupported ? 'text-green-600' : 'text-red-600'}`}>
                            {isSupported ? '✅ Supporté' : '❌ Non supporté'}
                        </p>
                    </div>
                    <div className="p-3 border rounded">
                        <p className="text-sm text-gray-600">Permission</p>
                        <p className={`font-semibold px-2 py-1 rounded ${getPermissionStatusColor()}`}>
                            {getPermissionStatusText()}
                        </p>
                    </div>
                </div>
            </div>

            {/* Erreur actuelle */}
            {lastError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-red-700">
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        {lastError}
                    </p>
                </div>
            )}

            {/* Actions */}
            <div className="mb-6">
                <h3 className="font-semibold mb-3">Actions de Test</h3>
                <div className="flex flex-wrap gap-2">
                    <button
                        onClick={requestPermission}
                        disabled={permissionStatus === 'granted'}
                        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        <i className="fas fa-key mr-2"></i>
                        Demander Permission
                    </button>
                    
                    <button
                        onClick={testNotification}
                        disabled={permissionStatus !== 'granted'}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
                    >
                        <i className="fas fa-bell mr-2"></i>
                        Test Notification
                    </button>
                    
                    <button
                        onClick={checkBrowserSettings}
                        className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                    >
                        <i className="fas fa-cog mr-2"></i>
                        Vérifier Config
                    </button>
                    
                    <button
                        onClick={resetPermissions}
                        className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
                    >
                        <i className="fas fa-redo mr-2"></i>
                        Aide Reset
                    </button>
                </div>
            </div>

            {/* Résultats des tests */}
            <div>
                <h3 className="font-semibold mb-3">Journal des Tests</h3>
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
                            Aucun test effectué. Cliquez sur les boutons ci-dessus pour commencer.
                        </p>
                    )}
                </div>
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded">
                <h4 className="font-semibold text-blue-800 mb-2">
                    <i className="fas fa-info-circle mr-2"></i>
                    Instructions de Dépannage
                </h4>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Assurez-vous d'être en HTTPS (requis pour les notifications)</li>
                    <li>• Vérifiez que les notifications ne sont pas bloquées dans les paramètres du navigateur</li>
                    <li>• Testez dans un onglet normal (pas en navigation privée)</li>
                    <li>• Rechargez la page après avoir accordé les permissions</li>
                    <li>• Vérifiez les paramètres de notification de votre système d'exploitation</li>
                </ul>
            </div>
        </div>
    );
};

export default NotificationDebugger;