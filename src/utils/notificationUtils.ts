import { ExtendedNotification, NotificationTemplate } from '../context/NotificationContext';

export interface NotificationOptions {
  type?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
  template?: string;
  metadata?: Record<string, any>;
  action?: string;
  target?: string;
  entity_id?: string;
  silent?: boolean;
  link?: string;
}

export class NotificationManager {
  private static instance: NotificationManager;
  private templates: Record<string, NotificationTemplate> = {};
  private userSettings: any = {};

  private constructor() {
    this.loadUserSettings();
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  private loadUserSettings() {
    const settings = localStorage.getItem('pushNotificationSettings');
    if (settings) {
      this.userSettings = JSON.parse(settings);
    }
  }

  public setTemplates(templates: Record<string, NotificationTemplate>) {
    this.templates = templates;
  }

  public shouldShowNotification(notification: ExtendedNotification): boolean {
    // Vérifier les paramètres par type
    if (!this.userSettings.push_enabled) {
      return false;
    }

    switch (notification.type) {
      case 'transaction':
        return this.userSettings.push_transactions !== false;
      case 'security':
        return this.userSettings.push_security !== false;
      case 'system':
        return this.userSettings.push_system === true;
      default:
        return true;
    }
  }

  public createNotification(
    userId: string,
    text: string,
    options: NotificationOptions = {}
  ): Partial<ExtendedNotification> {
    const template = options.template ? this.templates[options.template] : null;
    
    return {
      user_id: userId,
      text,
      type: options.type || 'general',
      priority: options.priority || 'normal',
      category: options.category,
      template: options.template,
      metadata: options.metadata || {},
      action: options.action,
      target: options.target,
      entity_id: options.entity_id,
      silent: options.silent || false,
      link: options.link,
      read: false,
      created_at: new Date().toISOString()
    };
  }

  public getPriorityWeight(priority?: string): number {
    switch (priority) {
      case 'urgent': return 4;
      case 'high': return 3;
      case 'normal': return 2;
      case 'low': return 1;
      default: return 2;
    }
  }

  public sortByPriority(notifications: ExtendedNotification[]): ExtendedNotification[] {
    return notifications.sort((a, b) => {
      const priorityDiff = this.getPriorityWeight(b.priority) - this.getPriorityWeight(a.priority);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Si même priorité, trier par date
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }

  public formatNotificationText(notification: ExtendedNotification): string {
    const template = notification.template ? this.templates[notification.template] : null;
    
    if (template && notification.metadata) {
      let text = template.body;
      
      // Remplacer les variables dans le template
      Object.entries(notification.metadata).forEach(([key, value]) => {
        text = text.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
      });
      
      return text;
    }
    
    return notification.text || 'Nouvelle notification';
  }

  public getNotificationIcon(notification: ExtendedNotification): string {
    const template = notification.template ? this.templates[notification.template] : null;
    return template?.icon || '📱';
  }

  public getNotificationColor(notification: ExtendedNotification): string {
    const template = notification.template ? this.templates[notification.template] : null;
    return template?.color || '#6366F1';
  }

  public async sendPushNotification(
    subscription: PushSubscription,
    notification: ExtendedNotification
  ): Promise<boolean> {
    try {
      const template = notification.template ? this.templates[notification.template] : null;
      
      const payload = {
        title: template?.title || 'SecureTrans',
        body: this.formatNotificationText(notification),
        icon: template?.icon || '/vite.svg',
        badge: '/vite.svg',
        tag: notification.id,
        data: {
          notificationId: notification.id,
          link: notification.link,
          action: notification.action,
          template: template
        },
        requireInteraction: notification.priority === 'urgent',
        silent: notification.silent || false,
        vibrate: [200, 100, 200],
        actions: template?.actions?.map(action => ({
          action: action.action,
          title: action.title,
          icon: action.icon ? `/icons/${action.icon}.png` : undefined
        }))
      };

      // Ici vous devriez envoyer la notification via votre serveur push
      // Pour l'instant, on simule l'envoi
      console.log('Envoi notification push:', payload);
      
      return true;
    } catch (error) {
      console.error('Erreur envoi push:', error);
      return false;
    }
  }

  public createSystemEvent(
    type: string,
    action: string,
    target: string,
    data?: any
  ) {
    return {
      type,
      action,
      target,
      data,
      timestamp: new Date()
    };
  }


}

export const notificationManager = NotificationManager.getInstance();