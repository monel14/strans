import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { handleSupabaseError } from '../utils/errorUtils';
import { Database } from '../types/database.types';

type Notification = Database['public']['Tables']['notifications']['Row'];
import { useAuth } from './AuthContext';

// Types étendus pour supporter les nouvelles fonctionnalités
export interface ExtendedNotification extends Notification {
    type?: string;
    action?: string;
    target?: string;
    silent?: boolean;
    entity_id?: string;
    template?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    category?: string;
    metadata?: Record<string, any>;
}

export interface NotificationTemplate {
    id: string;
    type: string;
    title: string;
    body: string;
    icon?: string;
    color?: string;
    sound?: string;
    vibration?: number[];
    actions?: NotificationAction[];
}

export interface NotificationAction {
    action: string;
    title: string;
    icon?: string;
}

export interface NotificationSearchFilters {
    query?: string;
    type?: string;
    category?: string;
    priority?: string;
    dateFrom?: Date;
    dateTo?: Date;
    read?: boolean;
}

export interface SystemEvent {
    type: string;
    action: string;
    target: string;
    data?: any;
    timestamp: Date;
}

export interface NotificationContextState {
    notifications: ExtendedNotification[];
    unreadCount: number;
    systemEvents: SystemEvent[];
    connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
    markAsRead: (notificationId: string) => void;
    markAllAsRead: () => void;
    // Nouvelles fonctions pour les événements système
    onSystemEvent: (callback: (event: SystemEvent) => void) => () => void;
    triggerRefresh: (target: string, data?: any) => void;
    // Nouvelles fonctionnalités
    searchNotifications: (filters: NotificationSearchFilters) => ExtendedNotification[];
    getNotificationHistory: (page?: number, limit?: number) => Promise<{ notifications: ExtendedNotification[], total: number }>;
    templates: Record<string, NotificationTemplate>;
    registerPushNotifications: () => Promise<boolean>;
    isPushSupported: boolean;
    pushSubscription: PushSubscription | null;
}

const NotificationContext = createContext<NotificationContextState | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState<ExtendedNotification[]>([]);
    const [systemEvents, setSystemEvents] = useState<SystemEvent[]>([]);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'reconnecting'>('disconnected');
    const [eventCallbacks, setEventCallbacks] = useState<Set<(event: SystemEvent) => void>>(new Set());
    const [pushSubscription, setPushSubscription] = useState<PushSubscription | null>(null);
    const [allNotifications, setAllNotifications] = useState<ExtendedNotification[]>([]);

    // Templates de notifications prédéfinis
    const [templates] = useState<Record<string, NotificationTemplate>>({
        transaction_created: {
            id: 'transaction_created',
            type: 'transaction',
            title: '💰 Nouvelle Transaction',
            body: 'Une nouvelle transaction a été créée',
            icon: '💰',
            color: '#10B981',
            sound: 'default',
            vibration: [200, 100, 200],
            actions: [
                { action: 'view', title: 'Voir', icon: '👁️' },
                { action: 'dismiss', title: 'Ignorer' }
            ]
        },
        transaction_validation: {
            id: 'transaction_validation',
            type: 'validation',
            title: '⚠️ Validation Requise',
            body: 'Une transaction nécessite votre validation',
            icon: '⚠️',
            color: '#F59E0B',
            sound: 'urgent',
            vibration: [300, 200, 300, 200, 300],
            actions: [
                { action: 'validate', title: 'Valider', icon: '✅' },
                { action: 'reject', title: 'Rejeter', icon: '❌' },
                { action: 'view', title: 'Voir' }
            ]
        },
        security_alert: {
            id: 'security_alert',
            type: 'security',
            title: '🔒 Alerte Sécurité',
            body: 'Activité suspecte détectée',
            icon: '🔒',
            color: '#EF4444',
            sound: 'urgent',
            vibration: [500, 300, 500, 300, 500],
            actions: [
                { action: 'secure', title: 'Sécuriser', icon: '🛡️' },
                { action: 'view', title: 'Détails' }
            ]
        },
        system_update: {
            id: 'system_update',
            type: 'system',
            title: '🔄 Mise à jour',
            body: 'Mise à jour système disponible',
            icon: '🔄',
            color: '#6366F1',
            sound: 'soft',
            vibration: [100],
            actions: [
                { action: 'update', title: 'Mettre à jour', icon: '⬆️' },
                { action: 'later', title: 'Plus tard' }
            ]
        },
        message: {
            id: 'message',
            type: 'communication',
            title: '💬 Nouveau Message',
            body: 'Vous avez reçu un nouveau message',
            icon: '💬',
            color: '#3B82F6',
            sound: 'message',
            vibration: [200, 100, 200],
            actions: [
                { action: 'reply', title: 'Répondre', icon: '↩️' },
                { action: 'view', title: 'Voir' }
            ]
        }
    });

    // Vérifier le support des notifications push
    const isPushSupported = 'serviceWorker' in navigator && 'PushManager' in window;

    // Fonction pour enregistrer les notifications push
    const registerPushNotifications = useCallback(async (): Promise<boolean> => {
        if (!isPushSupported) {
            console.log('❌ Notifications push non supportées');
            return false;
        }

        try {
            const { pushNotificationManager } = await import('../utils/pushNotifications');
            
            // Initialiser le gestionnaire
            const initialized = await pushNotificationManager.initialize();
            if (!initialized) {
                throw new Error('Impossible d\'initialiser le service worker');
            }

            // S'abonner aux notifications push
            const subscription = await pushNotificationManager.subscribe();
            if (!subscription) {
                throw new Error('Impossible de créer l\'abonnement push');
            }

            setPushSubscription(subscription);

            // Configurer l'écoute des messages du service worker
            pushNotificationManager.setupMessageListener();

            console.log('✅ Notifications push activées');
            return true;
        } catch (error) {
            console.error('❌ Erreur lors de l\'activation des notifications push:', error);
            return false;
        }
    }, [isPushSupported]);

    // Fonction de recherche dans les notifications
    const searchNotifications = useCallback((filters: NotificationSearchFilters): ExtendedNotification[] => {
        let filtered = allNotifications;

        // Recherche textuelle
        if (filters.query) {
            const query = filters.query.toLowerCase();
            filtered = filtered.filter(n =>
                n.text?.toLowerCase().includes(query) ||
                n.type?.toLowerCase().includes(query) ||
                n.category?.toLowerCase().includes(query)
            );
        }

        // Filtres par type
        if (filters.type) {
            filtered = filtered.filter(n => n.type === filters.type);
        }

        // Filtres par catégorie
        if (filters.category) {
            filtered = filtered.filter(n => n.category === filters.category);
        }

        // Filtres par priorité
        if (filters.priority) {
            filtered = filtered.filter(n => n.priority === filters.priority);
        }

        // Filtres par date
        if (filters.dateFrom) {
            filtered = filtered.filter(n => new Date(n.created_at) >= filters.dateFrom!);
        }

        if (filters.dateTo) {
            filtered = filtered.filter(n => new Date(n.created_at) <= filters.dateTo!);
        }

        // Filtre par statut de lecture
        if (filters.read !== undefined) {
            filtered = filtered.filter(n => n.read === filters.read);
        }

        return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }, [allNotifications]);

    // Fonction pour récupérer l'historique paginé
    const getNotificationHistory = useCallback(async (page = 1, limit = 20): Promise<{ notifications: ExtendedNotification[], total: number }> => {
        if (!currentUser) {
            return { notifications: [], total: 0 };
        }

        try {
            const offset = (page - 1) * limit;

            const { data, error, count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact' })
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) {
                handleSupabaseError(error, "Récupération de l'historique des notifications");
                return { notifications: [], total: 0 };
            }

            return {
                notifications: (data as ExtendedNotification[]) ?? [],
                total: count ?? 0
            };
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'historique:', error);
            return { notifications: [], total: 0 };
        }
    }, [currentUser]);

    // Fonction pour afficher une notification navigateur avec template
    const showBrowserNotification = useCallback((notification: ExtendedNotification) => {
        try {
            console.log('🔔 Création notification navigateur:', notification.text);

            // Utiliser le template si disponible
            const template = notification.template ? templates[notification.template] : null;
            const title = template?.title || 'SecureTrans';
            const body = notification.text || template?.body || 'Nouvelle notification';
            const icon = template?.icon ? `/icons/${template.icon}.png` : '/vite.svg';

            const browserNotification = new Notification(title, {
                body: body,
                icon: icon,
                tag: notification.id,
                badge: '/vite.svg',
                requireInteraction: notification.priority === 'urgent' || notification.type === 'transaction_validation',
                silent: false,
                data: {
                    notificationId: notification.id,
                    template: template,
                    link: notification.link,
                    actions: template?.actions
                },
                // Vibration pour mobile (si supporté)
                vibrate: template?.vibration || [200, 100, 200],
                // Actions personnalisées (si supportées)
                actions: template?.actions?.map(action => ({
                    action: action.action,
                    title: action.title,
                    icon: action.icon ? `/icons/${action.icon}.png` : undefined
                }))
            });

            // Événements de la notification
            browserNotification.onshow = () => {
                console.log('✅ Notification affichée avec succès');
            };

            browserNotification.onerror = (error) => {
                console.error('❌ Erreur lors de l\'affichage de la notification:', error);
            };

            browserNotification.onclick = () => {
                console.log('👆 Notification cliquée');
                window.focus();
                if (notification.link) {
                    // Navigation sera gérée par les composants qui écoutent
                    window.dispatchEvent(new CustomEvent('notification-click', {
                        detail: { link: notification.link, notification: notification }
                    }));
                }
                browserNotification.close();
            };

            // Auto-fermer après délai (sauf si urgent)
            const autoCloseDelay = notification.type === 'urgent' || notification.type === 'transaction_validation' ? 10000 : 5000;
            setTimeout(() => {
                try {
                    browserNotification.close();
                    console.log('🔄 Notification fermée automatiquement');
                } catch (error) {
                    // Ignore les erreurs de fermeture
                }
            }, autoCloseDelay);

        } catch (error) {
            console.error('❌ Erreur lors de la création de la notification navigateur:', error);
        }
    }, []);

    // Fonction pour déclencher les événements système
    const triggerSystemEvent = useCallback((event: SystemEvent) => {
        // Ajouter à l'historique des événements système
        setSystemEvents(prev => [event, ...prev.slice(0, 49)]); // Garder 50 derniers événements

        // Notifier tous les callbacks enregistrés
        eventCallbacks.forEach(callback => {
            try {
                callback(event);
            } catch (error) {
                console.error('Erreur dans le callback d\'événement système:', error);
            }
        });
    }, [eventCallbacks]);

    useEffect(() => {
        if (!currentUser) {
            setNotifications([]);
            setSystemEvents([]);
            setConnectionStatus('disconnected');
            return;
        }

        const fetchInitialNotifications = async () => {
            try {
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .order('created_at', { ascending: false })
                    .limit(50); // Augmenté pour plus d'historique

                if (error) {
                    handleSupabaseError(error, "Chargement des notifications initiales");
                } else {
                    setNotifications((data as ExtendedNotification[]) ?? []);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des notifications:', error);
            }
        };

        fetchInitialNotifications();

        // Charger toutes les notifications pour la recherche
        const fetchAllNotifications = async () => {
            try {
                const { data, error } = await supabase
                    .from('notifications')
                    .select('*')
                    .eq('user_id', currentUser.id)
                    .order('created_at', { ascending: false });

                if (error) {
                    handleSupabaseError(error, "Chargement de toutes les notifications");
                } else {
                    setAllNotifications((data as ExtendedNotification[]) ?? []);
                }
            } catch (error) {
                console.error('Erreur lors du chargement de toutes les notifications:', error);
            }
        };

        fetchAllNotifications();
        setConnectionStatus('reconnecting');

        const channel = supabase
            .channel('unified_notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${currentUser.id}`
                },
                (payload) => {
                    const newNotification = payload.new as ExtendedNotification;

                    // Vérifier si c'est une notification système silencieuse
                    if (newNotification.silent) {
                        // Traiter comme événement système
                        const systemEvent: SystemEvent = {
                            type: newNotification.type || 'data_refresh',
                            action: newNotification.action || 'refresh',
                            target: newNotification.target || 'unknown',
                            data: newNotification.entity_id ? { entityId: newNotification.entity_id } : undefined,
                            timestamp: new Date()
                        };

                        triggerSystemEvent(systemEvent);
                    } else {
                        // Notification utilisateur normale
                        setNotifications(prev => [newNotification, ...prev.slice(0, 49)]); // Limiter à 50
                        setAllNotifications(prev => [newNotification, ...prev]); // Ajouter à l'historique complet

                        // Notification navigateur native avec gestion d'erreurs améliorée
                        if ('Notification' in window && newNotification.text) {
                            try {
                                // Vérifier et demander la permission si nécessaire
                                if (Notification.permission === 'default') {
                                    console.log('🔔 Demande de permission pour les notifications...');
                                    Notification.requestPermission().then(permission => {
                                        if (permission === 'granted') {
                                            console.log('✅ Permission accordée, nouvelle tentative...');
                                            // Réessayer d'afficher la notification
                                            showBrowserNotification(newNotification);
                                        } else {
                                            console.log('❌ Permission refusée:', permission);
                                        }
                                    });
                                } else if (Notification.permission === 'granted') {
                                    showBrowserNotification(newNotification);
                                } else {
                                    console.log('🚫 Notifications bloquées par l\'utilisateur');
                                }
                            } catch (error) {
                                console.error('❌ Erreur lors de la création de la notification:', error);
                            }
                        } else if (!('Notification' in window)) {
                            console.log('⚠️ API Notification non supportée par ce navigateur');
                        }
                    }
                }
            )
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    setConnectionStatus('connected');
                } else if (status === 'CHANNEL_ERROR') {
                    setConnectionStatus('disconnected');
                    // Tentative de reconnexion après 5 secondes
                    setTimeout(() => {
                        setConnectionStatus('reconnecting');
                    }, 5000);
                }
            });

        return () => {
            supabase.removeChannel(channel);
            setConnectionStatus('disconnected');
        };
    }, [currentUser, triggerSystemEvent, showBrowserNotification]);

    const markAsRead = async (notificationId: string) => {
        // Optimistic update
        setNotifications(prev => prev.map(n => (n.id === notificationId ? { ...n, read: true } : n)));

        try {
            const update: Database['public']['Tables']['notifications']['Update'] = { read: true };
            const { error } = await supabase.from('notifications').update(update).eq('id', notificationId);

            if (error) {
                handleSupabaseError(error, "Marquage d'une notification comme lue");
                // Revert optimistic update on error
                setNotifications(prev => prev.map(n => (n.id === notificationId ? { ...n, read: false } : n)));
            }
        } catch (error) {
            console.error('Erreur lors du marquage comme lu:', error);
            // Revert optimistic update
            setNotifications(prev => prev.map(n => (n.id === notificationId ? { ...n, read: false } : n)));
        }
    };

    const markAllAsRead = async () => {
        if (!currentUser) return;

        const unreadIds = notifications.filter(n => !n.read && !n.silent).map(n => n.id);
        if (unreadIds.length === 0) return;

        // Optimistic update
        setNotifications(prev => prev.map(n => n.silent ? n : { ...n, read: true }));

        try {
            const update: Database['public']['Tables']['notifications']['Update'] = { read: true };
            const { error } = await supabase
                .from('notifications')
                .update(update)
                .eq('user_id', currentUser.id)
                .eq('read', false)
                .neq('silent', true); // Ne pas marquer les notifications silencieuses

            if (error) {
                handleSupabaseError(error, "Marquage de toutes les notifications comme lues");
                // Revert optimistic update on error
                setNotifications(prev => prev.map(n =>
                    unreadIds.includes(n.id) ? { ...n, read: false } : n
                ));
            }
        } catch (error) {
            console.error('Erreur lors du marquage global comme lu:', error);
            // Revert optimistic update
            setNotifications(prev => prev.map(n =>
                unreadIds.includes(n.id) ? { ...n, read: false } : n
            ));
        }
    };

    // Fonction pour s'abonner aux événements système
    const onSystemEvent = useCallback((callback: (event: SystemEvent) => void) => {
        setEventCallbacks(prev => new Set([...prev, callback]));

        // Retourner une fonction de nettoyage
        return () => {
            setEventCallbacks(prev => {
                const newSet = new Set(prev);
                newSet.delete(callback);
                return newSet;
            });
        };
    }, []);

    // Fonction pour déclencher manuellement un rafraîchissement
    const triggerRefresh = useCallback((target: string, data?: any) => {
        const event: SystemEvent = {
            type: 'manual_refresh',
            action: 'refresh',
            target,
            data,
            timestamp: new Date()
        };
        triggerSystemEvent(event);
    }, [triggerSystemEvent]);

    // Calculer le nombre de notifications non lues (exclure les silencieuses)
    const unreadCount = notifications.filter(n => !n.read && !n.silent).length;

    const value: NotificationContextState = {
        notifications: notifications.filter(n => !n.silent), // Filtrer les notifications silencieuses pour l'UI
        unreadCount,
        systemEvents,
        connectionStatus,
        markAsRead,
        markAllAsRead,
        onSystemEvent,
        triggerRefresh,
        searchNotifications,
        getNotificationHistory,
        templates,
        registerPushNotifications,
        isPushSupported,
        pushSubscription,
    };

    return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = (): NotificationContextState => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};