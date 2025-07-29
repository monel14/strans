import React, { useState, useEffect } from 'react';
import { pushNotificationManager, PushNotificationPayload } from '../../utils/pushNotifications';
import { useAuth } from '../../context/AuthContext';

const PushNotificationTest: React.FC = () => {
  const { currentUser } = useAuth();
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Vérifier le support
    setIsSupported(pushNotificationManager.isSupported());

    // Vérifier l'abonnement existant
    checkSubscription();
  }, []);

  const checkSubscription = async () => {
    try {
      const sub = await pushNotificationManager.getSubscription();
      setSubscription(sub);
      setIsSubscribed(!!sub);
    } catch (error) {
      console.error('Erreur lors de la vérification de l\'abonnement:', error);
    }
  };

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      await pushNotificationManager.initialize();
      const sub = await pushNotificationManager.subscribe();
      setSubscription(sub);
      setIsSubscribed(!!sub);
      alert('✅ Notifications push activées !');
    } catch (error) {
      console.error('Erreur lors de l\'abonnement:', error);
      alert('❌ Erreur lors de l\'activation des notifications push');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsubscribe = async () => {
    setLoading(true);
    try {
      const success = await pushNotificationManager.unsubscribe();
      if (success) {
        setSubscription(null);
        setIsSubscribed(false);
        alert('✅ Notifications push désactivées !');
      }
    } catch (error) {
      console.error('Erreur lors du désabonnement:', error);
      alert('❌ Erreur lors de la désactivation des notifications push');
    } finally {
      setLoading(false);
    }
  };

  const sendTestNotification = async (template: string) => {
    if (!currentUser) {
      alert('Vous devez être connecté pour envoyer une notification');
      return;
    }

    setLoading(true);
    try {
      const payloads: Record<string, PushNotificationPayload> = {
        transaction_created: {
          title: '💰 Nouvelle Transaction',
          body: 'Transaction de 1,500€ créée par Jean Dupont',
          template: 'transaction_created',
          data: {
            transactionId: 'test-123',
            amount: 1500,
            link: '/transactions/test-123'
          }
        },
        transaction_validation: {
          title: '⚠️ Validation Requise',
          body: 'Transaction de 2,000€ nécessite votre validation',
          template: 'transaction_validation',
          requireInteraction: true,
          data: {
            transactionId: 'test-456',
            amount: 2000,
            link: '/transactions/test-456/validate'
          }
        },
        security_alert: {
          title: '🔒 Alerte Sécurité',
          body: 'Tentative de connexion suspecte détectée',
          template: 'security_alert',
          requireInteraction: true,
          data: {
            alertType: 'suspicious_login',
            ip: '192.168.1.100',
            link: '/security'
          }
        },
        system_update: {
          title: '🔄 Mise à jour Système',
          body: 'Une nouvelle version est disponible',
          template: 'system_update',
          data: {
            version: '2.1.0',
            link: '/updates'
          }
        },
        message: {
          title: '💬 Nouveau Message',
          body: 'Marie Martin vous a envoyé un message',
          template: 'message',
          data: {
            senderId: 'user-789',
            messageId: 'msg-123',
            link: '/messages/msg-123'
          }
        }
      };

      const payload = payloads[template];
      if (!payload) {
        alert('Template de notification non trouvé');
        return;
      }

      const success = await pushNotificationManager.sendNotification(currentUser.id, payload);
      if (success) {
        alert('✅ Notification de test envoyée !');
      } else {
        alert('❌ Erreur lors de l\'envoi de la notification');
      }
    } catch (error) {
      console.error('Erreur lors de l\'envoi de la notification test:', error);
      alert('❌ Erreur lors de l\'envoi de la notification');
    } finally {
      setLoading(false);
    }
  };

  if (!isSupported) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-lg font-semibold text-red-800 mb-2">
          ❌ Notifications Push Non Supportées
        </h3>
        <p className="text-red-600">
          Votre navigateur ne supporte pas les notifications push.
          Veuillez utiliser un navigateur moderne comme Chrome, Firefox ou Safari.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        🔔 Test des Notifications Push
      </h3>

      {/* Statut de l'abonnement */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-700">
              Statut: {isSubscribed ? (
                <span className="text-green-600">✅ Activé</span>
              ) : (
                <span className="text-red-600">❌ Désactivé</span>
              )}
            </p>
            {subscription && (
              <p className="text-xs text-gray-500 mt-1">
                Endpoint: {subscription.endpoint.substring(0, 50)}...
              </p>
            )}
          </div>
          
          <div className="flex gap-2">
            {!isSubscribed ? (
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? 'Activation...' : 'Activer'}
              </button>
            ) : (
              <button
                onClick={handleUnsubscribe}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Désactivation...' : 'Désactiver'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tests de notifications */}
      {isSubscribed && (
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-3">
            Tester les Templates de Notifications
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              onClick={() => sendTestNotification('transaction_created')}
              disabled={loading}
              className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="font-medium text-gray-900">💰 Transaction Créée</div>
              <div className="text-sm text-gray-600">Notification standard</div>
            </button>

            <button
              onClick={() => sendTestNotification('transaction_validation')}
              disabled={loading}
              className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="font-medium text-gray-900">⚠️ Validation Requise</div>
              <div className="text-sm text-gray-600">Notification urgente avec actions</div>
            </button>

            <button
              onClick={() => sendTestNotification('security_alert')}
              disabled={loading}
              className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="font-medium text-gray-900">🔒 Alerte Sécurité</div>
              <div className="text-sm text-gray-600">Notification critique</div>
            </button>

            <button
              onClick={() => sendTestNotification('system_update')}
              disabled={loading}
              className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="font-medium text-gray-900">🔄 Mise à jour</div>
              <div className="text-sm text-gray-600">Notification système</div>
            </button>

            <button
              onClick={() => sendTestNotification('message')}
              disabled={loading}
              className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              <div className="font-medium text-gray-900">💬 Nouveau Message</div>
              <div className="text-sm text-gray-600">Notification de communication</div>
            </button>
          </div>

          {loading && (
            <div className="mt-4 text-center">
              <div className="inline-flex items-center px-4 py-2 text-sm text-blue-600">
                <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Traitement en cours...
              </div>
            </div>
          )}
        </div>
      )}

      {/* Instructions */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h5 className="font-medium text-blue-800 mb-2">📋 Instructions</h5>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Activez d'abord les notifications push</li>
          <li>• Testez les différents templates de notifications</li>
          <li>• Les notifications urgentes nécessitent une interaction</li>
          <li>• Cliquez sur les notifications pour tester les actions</li>
        </ul>
      </div>
    </div>
  );
};

export default PushNotificationTest;