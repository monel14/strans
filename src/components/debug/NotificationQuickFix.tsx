import React, { useEffect } from 'react';
import { QuickNotificationTest } from './QuickNotificationTest';

export const NotificationQuickFix: React.FC = () => {
    useEffect(() => {
        // Debug automatique au chargement
        console.log('🔔 DEBUG NOTIFICATIONS - LOCALHOST');
        console.log('- Support:', 'Notification' in window);
        console.log('- Permission:', 'Notification' in window ? Notification.permission : 'N/A');
        console.log('- Protocol:', window.location.protocol);
        console.log('- Host:', window.location.host);
        console.log('- User Agent:', navigator.userAgent);
        
        // Test automatique de permission si pas encore demandée
        if ('Notification' in window && Notification.permission === 'default') {
            console.log('🔔 Permission pas encore demandée, demande automatique...');
            Notification.requestPermission().then(permission => {
                console.log('🔔 Résultat permission:', permission);
                if (permission === 'granted') {
                    console.log('✅ Permission accordée, test automatique...');
                    setTimeout(() => {
                        try {
                            const testNotif = new Notification('🧪 Test Auto SecureTrans', {
                                body: 'Les notifications fonctionnent ! Vous pouvez fermer cette notification.',
                                icon: '/vite.svg'
                            });
                            testNotif.onclick = () => testNotif.close();
                            setTimeout(() => testNotif.close(), 3000);
                        } catch (error) {
                            console.error('❌ Erreur test auto:', error);
                        }
                    }, 1000);
                }
            });
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-4xl mx-auto px-4">
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        🔧 Fix Rapide des Notifications
                    </h1>
                    <p className="text-gray-600">
                        Diagnostic et réparation des notifications en localhost
                    </p>
                </div>

                {/* Test rapide */}
                <div className="mb-8">
                    <QuickNotificationTest />
                </div>

                {/* Instructions spécifiques */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h2 className="text-xl font-bold mb-4">
                        📋 Checklist Localhost
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h3 className="font-semibold mb-3 text-green-600">✅ À Faire</h3>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start space-x-2">
                                    <input type="checkbox" className="mt-1" />
                                    <span>Cliquer sur "1️⃣ Demander Permission" ci-dessus</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <input type="checkbox" className="mt-1" />
                                    <span>Accepter quand le navigateur demande la permission</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <input type="checkbox" className="mt-1" />
                                    <span>Tester avec "2️⃣ Test Simple"</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <input type="checkbox" className="mt-1" />
                                    <span>Vérifier la console (F12) pour les messages</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <input type="checkbox" className="mt-1" />
                                    <span>Si ça marche, tester votre vraie app</span>
                                </li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-semibold mb-3 text-red-600">❌ Problèmes Courants</h3>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-start space-x-2">
                                    <span className="text-red-500">•</span>
                                    <span>Permission refusée → Réinitialiser dans les paramètres</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="text-red-500">•</span>
                                    <span>Onglet en arrière-plan → Les notifications peuvent être limitées</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="text-red-500">•</span>
                                    <span>Extensions bloquantes → Désactiver temporairement</span>
                                </li>
                                <li className="flex items-start space-x-2">
                                    <span className="text-red-500">•</span>
                                    <span>Mode "Ne pas déranger" → Vérifier les paramètres OS</span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Code de test manuel */}
                    <div className="mt-6 p-4 bg-gray-50 rounded">
                        <h4 className="font-semibold mb-2">🧪 Test Manuel (Console)</h4>
                        <p className="text-sm text-gray-600 mb-2">
                            Copiez-collez ce code dans la console (F12) :
                        </p>
                        <pre className="bg-white p-3 rounded border text-xs overflow-x-auto">
{`// Test rapide des notifications
if ('Notification' in window) {
    console.log('✅ Support:', true);
    console.log('📋 Permission:', Notification.permission);
    
    if (Notification.permission === 'granted') {
        new Notification('Test Manuel', { 
            body: 'Ça marche !', 
            icon: '/vite.svg' 
        });
    } else {
        Notification.requestPermission().then(p => {
            console.log('🔔 Nouvelle permission:', p);
            if (p === 'granted') {
                new Notification('Test Manuel', { 
                    body: 'Ça marche maintenant !', 
                    icon: '/vite.svg' 
                });
            }
        });
    }
} else {
    console.log('❌ Notifications non supportées');
}`}
                        </pre>
                    </div>
                </div>

                {/* Aide contextuelle */}
                <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                    <h3 className="font-semibold text-yellow-800 mb-3">
                        <i className="fas fa-lightbulb mr-2"></i>
                        Que Faire Ensuite ?
                    </h3>
                    
                    <div className="text-yellow-700 text-sm space-y-2">
                        <p><strong>Si le test simple fonctionne :</strong></p>
                        <ul className="ml-4 space-y-1">
                            <li>• Le problème est dans votre code d'application</li>
                            <li>• Vérifiez les logs de la console dans votre vraie app</li>
                            <li>• Assurez-vous que les notifications sont bien créées en base</li>
                        </ul>
                        
                        <p className="mt-3"><strong>Si le test simple ne fonctionne pas :</strong></p>
                        <ul className="ml-4 space-y-1">
                            <li>• Le problème est au niveau du navigateur/système</li>
                            <li>• Vérifiez les paramètres de notification du navigateur</li>
                            <li>• Testez dans un autre navigateur</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotificationQuickFix;