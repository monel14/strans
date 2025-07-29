# Configuration des Notifications Push

Ce guide vous explique comment configurer les notifications push dans SecureTrans.

## 🔧 Prérequis

- Supabase CLI installé : `npm install -g supabase`
- Clés VAPID générées (déjà fait)
- Projet Supabase configuré

## 📋 Étapes de Configuration

### 1. Variables d'Environnement

#### Frontend (.env)
```bash
# Copiez .env.example vers .env et configurez :
VITE_VAPID_PUBLIC_KEY=BGW1OxQGAXoQ_5h1JFuWKC7nrAsHo_hY1eRIqdha2a5REUlu7yrC9yHt62kAtbYyFhbaLi0UU804CXRU27KEANU
```

#### Supabase Edge Functions
Dans le dashboard Supabase, allez dans Settings > Edge Functions et ajoutez :

```bash
VAPID_PUBLIC_KEY=BGW1OxQGAXoQ_5h1JFuWKC7nrAsHo_hY1eRIqdha2a5REUlu7yrC9yHt62kAtbYyFhbaLi0UU804CXRU27KEANU
VAPID_PRIVATE_KEY=WKHqI1J79AwDTm5lBnckkh9n5UbUFH6e4S3Gyuf7sfQ
VAPID_SUBJECT=mailto:admin@securetrans.com
APP_BASE_URL=https://votre-domaine.com
```

### 2. Base de Données

Appliquez la migration pour créer la table des abonnements push :

```bash
supabase db push
```

### 3. Edge Functions

Déployez les Edge Functions :

```bash
# Windows PowerShell
.\scripts\deploy-edge-functions.ps1

# Ou manuellement :
supabase functions deploy send-push-notification
supabase functions deploy register-push-subscription
```

### 4. Service Worker

Le service worker (`public/sw.js`) est déjà configuré avec :
- Gestion des notifications push
- Templates de notifications
- Actions personnalisées
- Cache des ressources

## 🧪 Tests

### Test Simple
1. Allez dans les paramètres de notifications
2. Activez les notifications push
3. Cliquez sur "Test Simple"

### Test Avancé
1. Utilisez le composant `PushNotificationTest`
2. Testez différents templates :
   - Transaction créée
   - Validation requise
   - Alerte sécurité
   - Mise à jour système
   - Nouveau message

### Test Manuel avec curl

```bash
# Tester l'envoi de notification
curl -X POST 'https://your-project.supabase.co/functions/v1/send-push-notification' \
  -H 'Authorization: Bearer YOUR_ACCESS_TOKEN' \
  -H 'Content-Type: application/json' \
  -d '{
    "userId": "user-id",
    "payload": {
      "title": "Test Notification",
      "body": "Ceci est un test",
      "template": "transaction_created"
    }
  }'
```

## 🔍 Debugging

### Vérifier les Logs
```bash
# Logs des Edge Functions
supabase functions logs send-push-notification
supabase functions logs register-push-subscription

# Logs en temps réel
supabase functions logs --follow
```

### Console du Navigateur
- Ouvrez les DevTools (F12)
- Onglet Console pour voir les logs du service worker
- Onglet Application > Service Workers pour vérifier l'état
- Onglet Application > Storage > IndexedDB pour les abonnements

### Vérifications Communes

1. **Permission refusée** : Vérifiez les paramètres du navigateur
2. **Service worker non enregistré** : Vérifiez le chemin `/sw.js`
3. **Clés VAPID invalides** : Vérifiez la configuration
4. **Edge Functions en erreur** : Vérifiez les logs Supabase

## 📱 Templates de Notifications

### Transaction Créée
```javascript
{
  title: '💰 Nouvelle Transaction',
  body: 'Transaction de 1,500€ créée par Jean Dupont',
  template: 'transaction_created',
  data: { transactionId: '123', amount: 1500 }
}
```

### Validation Requise
```javascript
{
  title: '⚠️ Validation Requise',
  body: 'Transaction de 2,000€ nécessite votre validation',
  template: 'transaction_validation',
  requireInteraction: true,
  data: { transactionId: '456', amount: 2000 }
}
```

### Alerte Sécurité
```javascript
{
  title: '🔒 Alerte Sécurité',
  body: 'Tentative de connexion suspecte détectée',
  template: 'security_alert',
  requireInteraction: true,
  data: { alertType: 'suspicious_login', ip: '192.168.1.100' }
}
```

## 🔐 Sécurité

- Les clés VAPID privées ne doivent jamais être exposées côté client
- Les abonnements sont liés aux utilisateurs authentifiés
- RLS (Row Level Security) activé sur la table `push_subscriptions`
- Nettoyage automatique des abonnements inactifs après 30 jours

## 🚀 Déploiement en Production

1. Configurez les variables d'environnement de production
2. Mettez à jour `APP_BASE_URL` avec votre domaine
3. Testez sur différents navigateurs et appareils
4. Configurez la surveillance des Edge Functions
5. Mettez en place des alertes pour les erreurs

## 📚 Ressources

- [Web Push Protocol](https://tools.ietf.org/html/rfc8030)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [VAPID Specification](https://tools.ietf.org/html/rfc8292)