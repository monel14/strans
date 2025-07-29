import { Database } from './database.types';

// Types pour les nouvelles tables de notifications
export type NotificationTemplate = Database['public']['Tables']['notification_templates']['Row'];
export type NotificationTemplateInsert = Database['public']['Tables']['notification_templates']['Insert'];
export type NotificationTemplateUpdate = Database['public']['Tables']['notification_templates']['Update'];

export type PushSubscription = Database['public']['Tables']['push_subscriptions']['Row'];
export type PushSubscriptionInsert = Database['public']['Tables']['push_subscriptions']['Insert'];
export type PushSubscriptionUpdate = Database['public']['Tables']['push_subscriptions']['Update'];

export type UserNotificationSettings = Database['public']['Tables']['user_notification_settings']['Row'];
export type UserNotificationSettingsInsert = Database['public']['Tables']['user_notification_settings']['Insert'];
export type UserNotificationSettingsUpdate = Database['public']['Tables']['user_notification_settings']['Update'];

// Types étendus pour les notifications avec les nouvelles colonnes
export type ExtendedNotification = Database['public']['Tables']['notifications']['Row'] & {
  template?: string;
  priority?: 'low' | 'normal' | 'high' | 'urgent';
  category?: string;
  metadata?: Record<string, any>;
};

// Types pour les actions de notifications
export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Types pour les filtres de recherche
export interface NotificationSearchFilters {
  query?: string;
  type?: string;
  category?: string;
  priority?: string;
  dateFrom?: Date;
  dateTo?: Date;
  read?: boolean;
}

// Types pour les événements système
export interface SystemEvent {
  type: string;
  action: string;
  target: string;
  data?: any;
  timestamp: Date;
}

// Types pour les options de création de notifications
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

// Types pour les paramètres de notifications push
export interface PushNotificationSettings {
  enabled: boolean;
  transactions: boolean;
  security: boolean;
  system: boolean;
  messages: boolean;
  quietHours: {
    enabled: boolean;
    start: string;
    end: string;
  };
  vibration: boolean;
  sound: boolean;
}

// Types pour les statistiques de notifications
export interface NotificationStats {
  total: number;
  unread: number;
  byPriority: {
    urgent: number;
    high: number;
    normal: number;
    low: number;
  };
  byType: Record<string, number>;
  grouped: number;
  filtered: number;
}

// Types pour les recommandations
export interface NotificationRecommendation {
  type: string;
  title: string;
  description: string;
  action: string;
}

// Types pour l'historique paginé
export interface NotificationHistoryResponse {
  notifications: ExtendedNotification[];
  total: number;
}

// Types pour le contexte de notifications étendu
export interface NotificationContextState {
  notifications: ExtendedNotification[];
  unreadCount: number;
  systemEvents: SystemEvent[];
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  onSystemEvent: (callback: (event: SystemEvent) => void) => () => void;
  triggerRefresh: (target: string, data?: any) => void;
  searchNotifications: (filters: NotificationSearchFilters) => ExtendedNotification[];
  getNotificationHistory: (page?: number, limit?: number) => Promise<NotificationHistoryResponse>;
  templates: Record<string, NotificationTemplate>;
  registerPushNotifications: () => Promise<boolean>;
  isPushSupported: boolean;
  pushSubscription: globalThis.PushSubscription | null;
}

// Types pour les templates avec actions typées
export interface NotificationTemplateWithActions extends NotificationTemplate {
  actions?: NotificationAction[];
  vibration?: number[];
}

// Types pour les données de notification enrichies
export interface EnrichedNotification extends ExtendedNotification {
  templateData?: NotificationTemplateWithActions;
  formattedText?: string;
  iconUrl?: string;
  colorCode?: string;
  isGrouped?: boolean;
  groupCount?: number;
}

// Types pour les paramètres de groupement
export interface NotificationGroupingOptions {
  enabled: boolean;
  maxAge: number; // en minutes
  maxCount: number;
  groupBy: ('type' | 'entity_id' | 'category')[];
}

// Types pour les métriques de performance
export interface NotificationMetrics {
  deliveryRate: number;
  clickThroughRate: number;
  averageResponseTime: number;
  errorRate: number;
  mostActiveHours: number[];
  popularTypes: Array<{ type: string; count: number }>;
}

// Types pour l'export de données
export interface NotificationExportOptions {
  format: 'json' | 'csv';
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: NotificationSearchFilters;
  includeMetadata?: boolean;
}

// Types pour les webhooks (future extension)
export interface NotificationWebhook {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  secret?: string;
  headers?: Record<string, string>;
}

// Types pour les canaux de notification
export type NotificationChannel = 'browser' | 'push' | 'email' | 'sms' | 'webhook';

// Types pour la configuration des canaux
export interface ChannelConfig {
  channel: NotificationChannel;
  enabled: boolean;
  priority: number;
  fallback?: NotificationChannel;
  settings?: Record<string, any>;
}

// Types pour les règles de routage
export interface NotificationRoutingRule {
  id: string;
  name: string;
  conditions: Array<{
    field: string;
    operator: 'equals' | 'contains' | 'startsWith' | 'endsWith' | 'regex';
    value: string;
  }>;
  actions: Array<{
    type: 'route' | 'transform' | 'filter' | 'delay';
    config: Record<string, any>;
  }>;
  priority: number;
  active: boolean;
}