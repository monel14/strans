import { useEffect, useCallback, useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { notificationManager } from '../utils/notificationUtils';

export const useSmartNotifications = () => {
  const {
    notifications,
    templates,
    registerPushNotifications,
    isPushSupported,
    pushSubscription
  } = useNotifications();

  const [smartNotifications, setSmartNotifications] = useState(notifications);
  const [isProcessing, setIsProcessing] = useState(false);

  // Initialiser le gestionnaire de notifications
  useEffect(() => {
    notificationManager.setTemplates(templates);
  }, [templates]);

  // Traitement intelligent des notifications
  const processNotifications = useCallback(() => {
    setIsProcessing(true);
    
    try {
      // Trier par priorité et date
      const sorted = notificationManager.sortByPriority([...notifications]);
      
      // Filtrer selon les préférences utilisateur
      const filtered = sorted.filter(notification => 
        notificationManager.shouldShowNotification(notification)
      );
      
      setSmartNotifications(filtered);
    } catch (error) {
      console.error('Erreur lors du traitement des notifications:', error);
      setSmartNotifications(notifications);
    } finally {
      setIsProcessing(false);
    }
  }, [notifications]);

  // Retraiter quand les notifications changent
  useEffect(() => {
    processNotifications();
  }, [processNotifications]);

  // Fonction pour envoyer une notification push intelligente
  const sendSmartPushNotification = useCallback(async (notification: any) => {
    if (!pushSubscription || !isPushSupported) {
      return false;
    }

    // Vérifier si on doit envoyer la notification
    if (!notificationManager.shouldShowNotification(notification)) {
      console.log('Notification filtrée par les paramètres utilisateur');
      return false;
    }

    return notificationManager.sendPushNotification(pushSubscription, notification);
  }, [pushSubscription, isPushSupported]);

  return {
    // Notifications traitées intelligemment
    smartNotifications,
    isProcessing,
    
    // Fonctions utilitaires
    sendSmartPushNotification,
    
    // Accès aux fonctions du gestionnaire
    shouldShowNotification: notificationManager.shouldShowNotification.bind(notificationManager),
    formatNotificationText: notificationManager.formatNotificationText.bind(notificationManager),
    getNotificationIcon: notificationManager.getNotificationIcon.bind(notificationManager),
    getNotificationColor: notificationManager.getNotificationColor.bind(notificationManager)
  };
};