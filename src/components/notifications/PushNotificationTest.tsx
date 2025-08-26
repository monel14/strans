import React, { useState, useEffect } from 'react';

interface PushNotificationTestProps {
    className?: string;
}

export const PushNotificationTest: React.FC<PushNotificationTestProps> = ({ className = '' }) => {
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isSupported, setIsSupported] = useState(false);
    const [testStatus, setTestStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        // Vérifier le support des notifications
        if ('Notification' in window) {
            setIsSupported(true);
            setPermission(Notification.permission);
        }
    }, []);

    const requestPermission = async () => {
        if (!isSupported) return;

        try {
            const result = await Notification.requestPermission();
            setPermission(result);
            
            if (result === 'granted') {
                setTestStatus('idle');
                setErrorMessage('');
            } else {
                setErrorMessage('Permission refusée. Veuillez autoriser les notifications dans les paramètres de votre navigateur.');
            }
        } catch (error) {
            console.error('Erreur lors de la demande de permission:', error);
            setErrorMessage('Erreur lors de la demande de permission.');
        }
    };

    const sendTestNotification = () => {
        if (!isSupported) {
            setErrorMessage('Les notifications ne sont pas supportées par votre navigateur.');
            return;
        }

        if (permission !== 'granted') {
            setErrorMessage('Permission requise pour envoyer des notifications.');
            return;
        }

        setTestStatus('sending');
        setErrorMessage('');

        try {
            const timestamp = new Date().toLocaleTimeString('fr-FR');
            const notification = new Notification('SecureTrans - Test', {
                body: `Notification de test envoyée à ${timestamp}`,
                icon: '/favicon.ico',
                badge: '/favicon.ico',
                tag: 'test-notification',
                requireInteraction: true
            });

            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            notification.onshow = () => {
                setTestStatus('sent');
                setTimeout(() => {
                    setTestStatus('idle');
                }, 3000);
            };

            notification.onerror = () => {
                setTestStatus('error');
                setErrorMessage('Erreur lors de l\'affichage de la notification.');
            };

        } catch (error) {
            console.error('Erreur lors de l\'envoi de la notification:', error);
            setTestStatus('error');
            setErrorMessage('Erreur lors de l\'envoi de la notification.');
        }
    };

    const getPermissionStatus = () => {
        switch (permission) {
            case 'granted':
                return {
                    icon: 'fa-check-circle',
                    color: 'text-green-600',
                    text: 'Autorisées'
                };
            case 'denied':
                return {
                    icon: 'fa-times-circle',
                    color: 'text-red-600',
                    text: 'Refusées'
                };
            default:
                return {
                    icon: 'fa-question-circle',
                    color: 'text-yellow-600',
                    text: 'Non configurées'
                };
        }
    };

    const permissionStatus = getPermissionStatus();

    if (!isSupported) {
        return (
            <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
                <div className="flex items-center">
                    <i className="fas fa-exclamation-triangle text-red-500 mr-3"></i>
                    <div>
                        <h4 className="font-medium text-red-800">Non supporté</h4>
                        <p className="text-red-700 text-sm mt-1">
                            Votre navigateur ne supporte pas les notifications push.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Statut des permissions */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <i className={`fas ${permissionStatus.icon} ${permissionStatus.color} mr-3`}></i>
                        <div>
                            <h4 className="font-medium text-gray-900">Statut des notifications</h4>
                            <p className="text-sm text-gray-600">
                                Notifications : <span className={permissionStatus.color}>{permissionStatus.text}</span>
                            </p>
                        </div>
                    </div>
                    
                    {permission !== 'granted' && (
                        <button
                            onClick={requestPermission}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                        >
                            Autoriser
                        </button>
                    )}
                </div>
            </div>

            {/* Test de notification */}
            {permission === 'granted' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h4 className="font-medium text-green-800">Test de notification</h4>
                            <p className="text-green-700 text-sm mt-1">
                                Envoyez une notification de test pour vérifier le bon fonctionnement.
                            </p>
                        </div>
                        
                        <button
                            onClick={sendTestNotification}
                            disabled={testStatus === 'sending'}
                            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                        >
                            {testStatus === 'sending' && (
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                            )}
                            {testStatus === 'sending' ? 'Envoi...' : 'Tester'}
                        </button>
                    </div>

                    {/* Messages de statut */}
                    {testStatus === 'sent' && (
                        <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded text-sm text-green-800">
                            <i className="fas fa-check mr-2"></i>
                            Notification de test envoyée avec succès !
                        </div>
                    )}
                </div>
            )}

            {/* Messages d'erreur */}
            {errorMessage && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center">
                        <i className="fas fa-exclamation-circle text-red-500 mr-2"></i>
                        <span className="text-red-700 text-sm">{errorMessage}</span>
                    </div>
                </div>
            )}

            {/* Informations utiles */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">
                    <i className="fas fa-info-circle mr-2"></i>
                    Informations utiles
                </h4>
                <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Les notifications apparaissent même quand l'onglet est fermé</li>
                    <li>• Vous pouvez gérer les permissions dans les paramètres de votre navigateur</li>
                    <li>• Les notifications sont bloquées en mode navigation privée</li>
                    <li>• Cliquez sur la notification pour revenir à l'application</li>
                </ul>
            </div>
        </div>
    );
};

