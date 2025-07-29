import { supabase } from '../supabaseClient';

export interface PushNotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
  silent?: boolean;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  template?: string;
  image?: string;
  renotify?: boolean;
  sticky?: boolean;
}

export class PushNotificationManager {
  private static instance: PushNotificationManager;
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  private constructor() {}

  static getInstance(): PushNotificationManager {
    if (!PushNotificationManager.instance) {
      PushNotificationManager.instance = new PushNotificationManager();
    }
    return PushNotificationManager.instance;
  }

  // Vérifier le support des notifications push
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  }

  // Initialiser le service worker
  async initialize(): Promise<boolean> {
    if (!this.isSupported()) {
      console.log('❌ Notifications push non supportées');
      return false;
    }

    try {
      // Enregistrer le service worker
      this.registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/'
      });

      console.log('✅ Service Worker enregistré:', this.registration);

      // Attendre que le service worker soit prêt
      await navigator.serviceWorker.ready;

      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation du service worker:', error);
      return false;
    }
  }

  // Demander la permission pour les notifications
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications non supportées');
    }

    const permission = await Notification.requestPermission();
    console.log('🔔 Permission notifications:', permission);
    return permission;
  }

  // S'abonner aux notifications push
  async subscribe(): Promise<PushSubscription | null> {
    if (!this.registration) {
      throw new Error('Service worker non initialisé');
    }

    try {
      // Vérifier la permission
      const permission = await this.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permission refusée pour les notifications');
      }

      // Obtenir la clé VAPID depuis les variables d'environnement
      const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        throw new Error('Clé VAPID publique manquante');
      }

      // S'abonner aux notifications push
      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(vapidKey)
      });

      console.log('✅ Abonnement push créé:', this.subscription);

      // Enregistrer l'abonnement côté serveur
      await this.registerSubscription(this.subscription);

      return this.subscription;
    } catch (error) {
      console.error('❌ Erreur lors de l\'abonnement push:', error);
      throw error;
    }
  }

  // Se désabonner des notifications push
  async unsubscribe(): Promise<boolean> {
    if (!this.subscription) {
      return true;
    }

    try {
      const success = await this.subscription.unsubscribe();
      if (success) {
        // Désactiver l'abonnement côté serveur
        await this.deactivateSubscription(this.subscription.endpoint);
        this.subscription = null;
        console.log('✅ Désabonnement push réussi');
      }
      return success;
    } catch (error) {
      console.error('❌ Erreur lors du désabonnement push:', error);
      return false;
    }
  }

  // Obtenir l'abonnement actuel
  async getSubscription(): Promise<PushSubscription | null> {
    if (!this.registration) {
      return null;
    }

    try {
      this.subscription = await this.registration.pushManager.getSubscription();
      return this.subscription;
    } catch (error) {
      console.error('❌ Erreur lors de la récupération de l\'abonnement:', error);
      return null;
    }
  }

  // Envoyer une notification push (côté serveur)
  async sendNotification(userId: string, payload: PushNotificationPayload): Promise<boolean> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Non authentifié');
      }

      const response = await supabase.functions.invoke('send-push-notification', {
        body: { userId, payload },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw response.error;
      }

      console.log('✅ Notification push envoyée:', response.data);
      return true;
    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi de la notification push:', error);
      return false;
    }
  }

  // Enregistrer l'abonnement côté serveur
  private async registerSubscription(subscription: PushSubscription): Promise<void> {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Non authentifié');
      }

      const response = await supabase.functions.invoke('register-push-subscription', {
        body: {
          subscription: subscription.toJSON(),
          userAgent: navigator.userAgent
        },
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (response.error) {
        throw response.error;
      }

      console.log('✅ Abonnement enregistré côté serveur:', response.data);
    } catch (error) {
      console.error('❌ Erreur lors de l\'enregistrement de l\'abonnement:', error);
      throw error;
    }
  }

  // Désactiver l'abonnement côté serveur
  private async deactivateSubscription(endpoint: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('push_subscriptions')
        .update({ active: false })
        .eq('endpoint', endpoint);

      if (error) {
        throw error;
      }

      console.log('✅ Abonnement désactivé côté serveur');
    } catch (error) {
      console.error('❌ Erreur lors de la désactivation de l\'abonnement:', error);
    }
  }

  // Convertir la clé VAPID base64 en Uint8Array
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  // Écouter les messages du service worker
  setupMessageListener(): void {
    if (!('serviceWorker' in navigator)) {
      return;
    }

    navigator.serviceWorker.addEventListener('message', (event) => {
      const { type, action, notificationId, data } = event.data;

      switch (type) {
        case 'NOTIFICATION_ACTION':
          this.handleNotificationAction(action, notificationId, data);
          break;
        case 'NOTIFICATION_CLOSED':
          this.handleNotificationClosed(data);
          break;
        default:
          console.log('Message du service worker:', event.data);
      }
    });
  }

  // Gérer les actions sur les notifications
  private handleNotificationAction(action: string, notificationId: string, data: any): void {
    console.log('🎯 Action notification:', { action, notificationId, data });

    // Émettre un événement personnalisé pour que l'application puisse réagir
    window.dispatchEvent(new CustomEvent('notification-action', {
      detail: { action, notificationId, data }
    }));

    // Actions spécifiques
    switch (action) {
      case 'validate':
        // Rediriger vers la page de validation
        window.location.href = `/transactions/${data.transactionId}/validate`;
        break;
      case 'reject':
        // Ouvrir le modal de rejet
        window.dispatchEvent(new CustomEvent('open-reject-modal', {
          detail: { transactionId: data.transactionId }
        }));
        break;
      case 'secure':
        // Rediriger vers les paramètres de sécurité
        window.location.href = '/security';
        break;
      case 'view':
        // Rediriger vers la page appropriée
        if (data.link) {
          window.location.href = data.link;
        }
        break;
    }
  }

  // Gérer la fermeture des notifications
  private handleNotificationClosed(data: any): void {
    console.log('❌ Notification fermée:', data);
    
    // Émettre un événement pour les analytics
    window.dispatchEvent(new CustomEvent('notification-closed', {
      detail: data
    }));
  }
}

// Instance globale
export const pushNotificationManager = PushNotificationManager.getInstance();