// Service Worker pour les notifications push
const CACHE_NAME = 'securetrans-v1';
const urlsToCache = [
    '/',
    '/static/js/bundle.js',
    '/static/css/main.css',
    '/vite.svg',
    '/icons/notification-icons.json'
];

// Configuration VAPID (sera injectée par le build)
const VAPID_PUBLIC_KEY = 'BGW1OxQGAXoQ_5h1JFuWKC7nrAsHo_hY1eRIqdha2a5REUlu7yrC9yHt62kAtbYyFhbaLi0UU804CXRU27KEANU';

// Installation du service worker
self.addEventListener('install', (event) => {
    console.log('🔧 Service Worker: Installation');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('📦 Cache ouvert');
                return cache.addAll(urlsToCache);
            })
    );
});

// Activation du service worker
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker: Activation');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ Suppression ancien cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Gestion des requêtes réseau
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Retourner la réponse du cache si disponible
                if (response) {
                    return response;
                }
                return fetch(event.request);
            }
            )
    );
});

// Gestion des notifications push
self.addEventListener('push', (event) => {
    console.log('📱 Notification push reçue:', event);

    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'SecureTrans', body: event.data.text() };
        }
    }

    // Éviter les notifications en double avec un tag unique
    const notificationTag = data.tag || `notification-${data.id || Date.now()}`;

    // Vérifier si une notification avec ce tag existe déjà
    event.waitUntil(
        self.registration.getNotifications({ tag: notificationTag }).then((existingNotifications) => {
            if (existingNotifications.length > 0) {
                console.log('⚠️ Notification en double évitée:', notificationTag);
                return Promise.resolve();
            }

            return showNotificationWithTemplate(data, notificationTag);
        })
    );
});

// Fonction pour afficher la notification avec template
function showNotificationWithTemplate(data, notificationTag) {

    // Templates de notifications prédéfinis
    const templates = {
        transaction_created: {
            icon: '💰',
            color: '#10B981',
            actions: [
                { action: 'view', title: 'Voir', icon: '/icons/view.png' },
                { action: 'dismiss', title: 'Ignorer', icon: '/icons/dismiss.png' }
            ]
        },
        transaction_validation: {
            icon: '⚠️',
            color: '#F59E0B',
            requireInteraction: true,
            actions: [
                { action: 'validate', title: 'Valider', icon: '/icons/validate.png' },
                { action: 'reject', title: 'Rejeter', icon: '/icons/reject.png' },
                { action: 'view', title: 'Voir', icon: '/icons/view.png' }
            ]
        },
        security_alert: {
            icon: '🔒',
            color: '#EF4444',
            requireInteraction: true,
            actions: [
                { action: 'secure', title: 'Sécuriser', icon: '/icons/secure.png' },
                { action: 'view', title: 'Détails', icon: '/icons/view.png' }
            ]
        }
    };

    // Appliquer le template si disponible
    const template = data.template ? templates[data.template] : {};

    const options = {
        body: data.body || 'Nouvelle notification',
        icon: template.icon ? `/icons/${template.icon}.png` : (data.icon || '/vite.svg'),
        badge: '/vite.svg',
        tag: notificationTag,
        data: {
            ...data.data,
            notificationId: data.id,
            template: data.template,
            timestamp: Date.now()
        },
        requireInteraction: template.requireInteraction || data.requireInteraction || false,
        silent: data.silent || false,
        actions: template.actions || data.actions || [
            {
                action: 'view',
                title: 'Voir',
                icon: '/icons/view.png'
            },
            {
                action: 'dismiss',
                title: 'Ignorer',
                icon: '/icons/dismiss.png'
            }
        ],
        // Propriétés visuelles
        image: data.image,
        timestamp: Date.now(),
        renotify: data.renotify || false,
        sticky: data.sticky || false
    };

    return self.registration.showNotification(data.title || 'SecureTrans', options);
}

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
    console.log('👆 Clic sur notification:', event);

    event.notification.close();

    const action = event.action;
    const data = event.notification.data;

    if (action === 'dismiss') {
        return;
    }

    // Ouvrir ou focuser la fenêtre de l'application
    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // Si une fenêtre est déjà ouverte, la focuser
            for (const client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }

            // Sinon, ouvrir une nouvelle fenêtre
            if (clients.openWindow) {
                const url = data.link || '/';
                return clients.openWindow(url);
            }
        })
    );

    // Envoyer l'action à l'application
    if (action && data.notificationId) {
        event.waitUntil(
            clients.matchAll().then((clientList) => {
                clientList.forEach((client) => {
                    client.postMessage({
                        type: 'NOTIFICATION_ACTION',
                        action: action,
                        notificationId: data.notificationId,
                        data: data
                    });
                });
            })
        );
    }
});

// Gestion de la fermeture des notifications
self.addEventListener('notificationclose', (event) => {
    console.log('❌ Notification fermée:', event.notification.tag);

    // Optionnel: envoyer des analytics
    event.waitUntil(
        clients.matchAll().then((clientList) => {
            clientList.forEach((client) => {
                client.postMessage({
                    type: 'NOTIFICATION_CLOSED',
                    tag: event.notification.tag,
                    data: event.notification.data
                });
            });
        })
    );
});

// Gestion de la synchronisation en arrière-plan
self.addEventListener('sync', (event) => {
    console.log('🔄 Synchronisation en arrière-plan:', event.tag);

    if (event.tag === 'background-sync') {
        event.waitUntil(
            // Ici vous pouvez synchroniser les données hors ligne
            fetch('/api/sync')
                .then((response) => response.json())
                .then((data) => {
                    console.log('✅ Synchronisation réussie:', data);
                })
                .catch((error) => {
                    console.error('❌ Erreur de synchronisation:', error);
                })
        );
    }
});