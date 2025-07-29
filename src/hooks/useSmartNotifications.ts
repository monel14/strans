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
      // Grouper les notifications similaires
      const grouped = notificationManager.groupNotifications(notifications);
      
      // Trier par priorité
      const sorted = notificationManager.sortByPriority(grouped);
      
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

    // Calculer le délai recommandé
    const delay = notificationManager.getRecommendedDelay(notification);
    
    if (delay > 0) {
      console.log(`Notification reportée de ${delay}ms`);
      setTimeout(() => {
        notificationManager.sendPushNotification(pushSubscription, notification);
      }, delay);
    } else {
      return notificationManager.sendPushNotification(pushSubscription, notification);
    }

    return true;
  }, [pushSubscription, isPushSupported]);

  // Fonction pour créer une notification intelligente
  const createSmartNotification = useCallback((
    userId: string,
    text: string,
    options: any = {}
  ) => {
    return notificationManager.createNotification(userId, text, options);
  }, []);

  // Fonction pour obtenir des statistiques sur les notifications
  const getNotificationStats = useCallback(() => {
    const stats = {
      total: notifications.length,
      unread: notifications.filter(n => !n.read).length,
      byPriority: {
        urgent: notifications.filter(n => n.priority === 'urgent').length,
        high: notifications.filter(n => n.priority === 'high').length,
        normal: notifications.filter(n => n.priority === 'normal').length,
        low: notifications.filter(n => n.priority === 'low').length,
      },
      byType: notifications.reduce((acc, n) => {
        acc[n.type || 'unknown'] = (acc[n.type || 'unknown'] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      grouped: smartNotifications.filter(n => n.metadata?.grouped).length,
      filtered: notifications.length - smartNotifications.length
    };

    return stats;
  }, [notifications, smartNotifications]);

  // Fonction pour obtenir des recommandations
  const getRecommendations = useCallback(() => {
    const stats = getNotificationStats();
    const recommendations = [];

    // Recommandation sur les heures silencieuses
    if (stats.total > 50 && !notificationManager.isInQuietHours()) {
      recommendations.push({
        type: 'quiet_hours',
        title: 'Activez les heures silencieuses',
        description: 'Vous recevez beaucoup de notifications. Configurez des heures silencieuses pour une meilleure expérience.',
        action: 'configure_quiet_hours'
      });
    }

    // Recommandation sur les notifications push
    if (isPushSupported && !pushSubscription) {
      recommendations.push({
        type: 'push_notifications',
        title: 'Activez les notifications push',
        description: 'Recevez des notifications importantes même quand l\'application est fermée.',
        action: 'enable_push'
      });
    }

    // Recommandation sur le filtrage
    if (stats.filtered > stats.total * 0.3) {
      recommendations.push({
        type: 'filtering',
        title: 'Optimisez vos filtres',
        description: 'Beaucoup de notifications sont filtrées. Vérifiez vos paramètres.',
        action: 'review_filters'
      });
    }

    return recommendations;
  }, [getNotificationStats, isPushSupported, pushSubscription]);

  // Fonction pour appliquer une recommandation
  const applyRecommendation = useCallback(async (recommendation: any) => {
    switch (recommendation.action) {
      case 'enable_push':
        return await registerPushNotifications();
      case 'configure_quiet_hours':
        // Ouvrir les paramètres de notifications
        return true;
      case 'review_filters':
        // Ouvrir les paramètres de filtrage
        return true;
      default:
        return false;
    }
  }, [registerPushNotifications]);

  // Fonction pour exporter les données de notifications
  const exportNotifications = useCallback((format: 'json' | 'csv' = 'json') => {
    const data = notifications.map(n => ({
      id: n.id,
      text: n.text,
      type: n.type,
      priority: n.priority,
      category: n.category,
      read: n.read,
      created_at: n.created_at,
      template: n.template
    }));

    if (format === 'csv') {
      const headers = Object.keys(data[0] || {});
      const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => row[header as keyof typeof row]).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notifications_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `notifications_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }
  }, [notifications]);

  return {
    // Notifications traitées intelligemment
    smartNotifications,
    isProcessing,
    
    // Fonctions utilitaires
    sendSmartPushNotification,
    createSmartNotification,
    
    // Statistiques et analyses
    getNotificationStats,
    getRecommendations,
    applyRecommendation,
    
    // Export
    exportNotifications,
    
    // Accès aux fonctions du gestionnaire
    shouldShowNotification: notificationManager.shouldShowNotification.bind(notificationManager),
    formatNotificationText: notificationManager.formatNotificationText.bind(notificationManager),
    getNotificationIcon: notificationManager.getNotificationIcon.bind(notificationManager),
    getNotificationColor: notificationManager.getNotificationColor.bind(notificationManager),
    isInQuietHours: notificationManager.isInQuietHours.bind(notificationManager)
  };
};