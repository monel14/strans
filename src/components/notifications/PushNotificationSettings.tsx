import React, { useState, useEffect } from 'react';
import { useNotifications } from '../../context/NotificationContext';

interface PushNotificationSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PushNotificationSettings: React.FC<PushNotificationSettingsProps> = ({ isOpen, onClose }) => {
  const { registerPushNotifications, isPushSupported, pushSubscription } = useNotifications();
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [pushSettings, setPushSettings] = useState({
    enabled: false,
    transactions: true,
    security: true,
    system: false,
    messages: true,
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    },
    vibration: true,
    sound: true
  });

  useEffect(() => {
    // Charger les paramètres depuis le localStorage
    const savedSettings = localStorage.getItem('pushNotificationSettings');
    if (savedSettings) {
      setPushSettings(JSON.parse(savedSettings));
    }

    // Vérifier si les notifications push sont déjà activées
    if (pushSubscription) {
      setPushSettings(prev => ({ ...prev, enabled: true }));
    }
  }, [pushSubscription]);

  const handleEnablePush = async () => {
    setIsRegistering(true);
    setRegistrationStatus('idle');
    setErrorMessage('');

    try {
      const success = await registerPushNotifications();
      if (success) {
        setRegistrationStatus('success');
        setPushSettings(prev => ({ ...prev, enabled: true }));
        // Sauvegarder les paramètres
        localStorage.setItem('pushNotificationSettings', JSON.stringify({ ...pushSettings, enabled: true }));
      } else {
        setRegistrationStatus('error');
        setErrorMessage('Impossible d\'activer les notifications push. Vérifiez vos paramètres de navigateur.');
      }
    } catch (error) {
      setRegistrationStatus('error');
      setErrorMessage('Erreur lors de l\'activation des notifications push.');
      console.error('Erreur push:', error);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleDisablePush = async () => {
    try {
      if (pushSubscription) {
        await pushSubscription.unsubscribe();
        setPushSettings(prev => ({ ...prev, enabled: false }));
        setRegistrationStatus('idle');
        localStorage.setItem('pushNotificationSettings', JSON.stringify({ ...pushSettings, enabled: false }));
      }
    } catch (error) {
      console.error('Erreur lors de la désactivation:', error);
    }
  };

  const handleSettingChange = (key: string, value: any) => {
    const newSettings = { ...pushSettings, [key]: value };
    setPushSettings(newSettings);
    localStorage.setItem('pushNotificationSettings', JSON.stringify(newSettings));
  };

  const handleQuietHoursChange = (key: string, value: any) => {
    const newQuietHours = { ...pushSettings.quietHours, [key]: value };
    const newSettings = { ...pushSettings, quietHours: newQuietHours };
    setPushSettings(newSettings);
    localStorage.setItem('pushNotificationSettings', JSON.stringify(newSettings));
  };

  const testNotification = () => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Test SecureTrans', {
        body: 'Ceci est une notification de test',
        icon: '/vite.svg',
        tag: 'test'
      });
    }
  };

  const testAdvancedNotification = async () => {
    try {
      const { pushNotificationManager } = await import('../../utils/pushNotifications');
      
      if (!pushSubscription) {
        alert('Veuillez d\'abord activer les notifications push');
        return;
      }

      // Test avec template de transaction
      const success = await pushNotificationManager.sendNotification(
        'current-user', // Remplacer par l'ID utilisateur réel
        {
          title: '💰 Test Transaction',
          body: 'Transaction de test de 1,500€ créée',
          template: 'transaction_created',
          data: {
            transactionId: 'test-123',
            amount: 1500,
            link: '/transactions/test-123'
          }
        }
      );

      if (success) {
        alert('✅ Notification avancée envoyée !');
      } else {
        alert('❌ Erreur lors de l\'envoi de la notification');
      }
    } catch (error) {
      console.error('Erreur test notification:', error);
      alert('❌ Erreur lors du test de notification avancée');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Notifications Push</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="fas fa-times text-xl"></i>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Support Check */}
          {!isPushSupported ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center">
                <i className="fas fa-exclamation-triangle text-red-500 mr-3"></i>
                <div>
                  <h3 className="font-medium text-red-800">Non supporté</h3>
                  <p className="text-red-700 text-sm mt-1">
                    Votre navigateur ne supporte pas les notifications push.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Enable/Disable Push */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-blue-900">Notifications Push</h3>
                    <p className="text-blue-700 text-sm mt-1">
                      Recevez des notifications même quand l'application est fermée
                    </p>
                  </div>
                  <div className="flex items-center space-x-3">
                    {pushSettings.enabled && (
                      <div className="flex space-x-2">
                        <button
                          onClick={testNotification}
                          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                          Test Simple
                        </button>
                        <button
                          onClick={() => testAdvancedNotification()}
                          className="px-3 py-1 text-sm bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                        >
                          Test Avancé
                        </button>
                      </div>
                    )}
                    <button
                      onClick={pushSettings.enabled ? handleDisablePush : handleEnablePush}
                      disabled={isRegistering}
                      className={`px-4 py-2 rounded-md font-medium transition-colors ${
                        pushSettings.enabled
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isRegistering ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Activation...
                        </>
                      ) : pushSettings.enabled ? (
                        'Désactiver'
                      ) : (
                        'Activer'
                      )}
                    </button>
                  </div>
                </div>

                {/* Status Messages */}
                {registrationStatus === 'success' && (
                  <div className="mt-3 p-3 bg-green-100 border border-green-200 rounded-md">
                    <div className="flex items-center">
                      <i className="fas fa-check-circle text-green-500 mr-2"></i>
                      <span className="text-green-800 text-sm">Notifications push activées avec succès !</span>
                    </div>
                  </div>
                )}

                {registrationStatus === 'error' && (
                  <div className="mt-3 p-3 bg-red-100 border border-red-200 rounded-md">
                    <div className="flex items-center">
                      <i className="fas fa-exclamation-circle text-red-500 mr-2"></i>
                      <span className="text-red-800 text-sm">{errorMessage}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Settings (only if push is enabled) */}
              {pushSettings.enabled && (
                <>
                  {/* Notification Types */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Types de notifications</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={pushSettings.transactions}
                          onChange={(e) => handleSettingChange('transactions', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">
                          <i className="fas fa-money-bill-wave text-green-500 mr-2"></i>
                          Transactions
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={pushSettings.security}
                          onChange={(e) => handleSettingChange('security', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">
                          <i className="fas fa-shield-alt text-red-500 mr-2"></i>
                          Alertes de sécurité
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={pushSettings.messages}
                          onChange={(e) => handleSettingChange('messages', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">
                          <i className="fas fa-comment text-blue-500 mr-2"></i>
                          Messages
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={pushSettings.system}
                          onChange={(e) => handleSettingChange('system', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">
                          <i className="fas fa-cog text-gray-500 mr-2"></i>
                          Notifications système
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Quiet Hours */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Heures silencieuses</h3>
                    <div className="space-y-4">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={pushSettings.quietHours.enabled}
                          onChange={(e) => handleQuietHoursChange('enabled', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">Activer les heures silencieuses</span>
                      </label>

                      {pushSettings.quietHours.enabled && (
                        <div className="ml-6 grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Début
                            </label>
                            <input
                              type="time"
                              value={pushSettings.quietHours.start}
                              onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Fin
                            </label>
                            <input
                              type="time"
                              value={pushSettings.quietHours.end}
                              onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Audio & Vibration */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-4">Audio et vibration</h3>
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={pushSettings.sound}
                          onChange={(e) => handleSettingChange('sound', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">
                          <i className="fas fa-volume-up text-blue-500 mr-2"></i>
                          Son
                        </span>
                      </label>

                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={pushSettings.vibration}
                          onChange={(e) => handleSettingChange('vibration', e.target.checked)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-3 text-gray-700">
                          <i className="fas fa-mobile-alt text-purple-500 mr-2"></i>
                          Vibration (mobile)
                        </span>
                      </label>
                    </div>
                  </div>

                  {/* Subscription Info */}
                  {pushSubscription && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Informations d'abonnement</h4>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p><strong>Endpoint:</strong> {pushSubscription.endpoint.substring(0, 50)}...</p>
                        <p><strong>Statut:</strong> <span className="text-green-600">Actif</span></p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-4 border-t">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
};