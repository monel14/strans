# 🚀 Guide de déploiement Vercel

## Prérequis

1. **Compte Vercel** : [vercel.com](https://vercel.com)
2. **Projet Supabase** configuré et migrations appliquées
3. **Repository Git** (GitHub, GitLab, ou Bitbucket)

## Étapes de déploiement

### 1. Préparation locale

```bash
# Vérifier que tout fonctionne localement
npm run dev

# Vérifier la configuration
node scripts/deploy.js
```

### 2. Installation Vercel CLI

```bash
npm install -g vercel
```

### 3. Connexion à Vercel

```bash
vercel login
```

### 4. Premier déploiement

```bash
# Déploiement initial (preview)
vercel

# Déploiement en production
vercel --prod
```

### 5. Configuration des variables d'environnement

Dans le dashboard Vercel (Settings > Environment Variables) :

```
VITE_SUPABASE_URL = https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY = your-anon-key
NODE_ENV = production
```

**Optionnel (pour les notifications push)** :
```
VITE_VAPID_PUBLIC_KEY = your-vapid-public-key
```

### 6. Redéploiement avec les variables

```bash
vercel --prod
```

## Configuration automatique via GitHub

### 1. Connecter le repository

1. Aller sur [vercel.com/dashboard](https://vercel.com/dashboard)
2. Cliquer "New Project"
3. Importer votre repository GitHub
4. Vercel détectera automatiquement Vite

### 2. Configuration du projet

- **Framework Preset** : Vite
- **Build Command** : `npm run build`
- **Output Directory** : `dist`
- **Install Command** : `npm install`

### 3. Variables d'environnement

Ajouter dans Settings > Environment Variables :
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `NODE_ENV=production`

## Vérifications post-déploiement

### ✅ Checklist

- [ ] L'application se charge sans erreurs
- [ ] La connexion Supabase fonctionne
- [ ] Les notifications s'affichent
- [ ] Le service worker est enregistré
- [ ] Les templates de notifications fonctionnent
- [ ] L'historique des notifications fonctionne
- [ ] Les paramètres push se sauvegardent

### 🔧 Tests rapides

```javascript
// Dans la console du navigateur sur votre site déployé
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);

// Tester une notification
await testNotifications.createTestNotification(await getCurrentUserId());
```

## Domaine personnalisé (optionnel)

1. **Aller dans Settings > Domains**
2. **Ajouter votre domaine**
3. **Configurer les DNS** selon les instructions Vercel

## Notifications Push en production

### Générer les clés VAPID

```bash
npx web-push generate-vapid-keys
```

### Configurer les clés

1. **Clé publique** → `VITE_VAPID_PUBLIC_KEY` (Vercel)
2. **Clé privée** → À garder secrète pour le backend

## Monitoring et logs

- **Logs de déploiement** : Dashboard Vercel > Functions
- **Analytics** : Dashboard Vercel > Analytics
- **Erreurs** : Dashboard Vercel > Functions > View Function Logs

## Dépannage courant

### Erreur "Supabase non configuré"
- Vérifier les variables d'environnement dans Vercel
- Redéployer après ajout des variables

### Service Worker ne fonctionne pas
- Vérifier que l'app est servie en HTTPS
- Vérifier les headers dans `vercel.json`

### Notifications push ne fonctionnent pas
- Vérifier la clé VAPID
- Tester d'abord les notifications navigateur classiques

## Commandes utiles

```bash
# Voir les déploiements
vercel ls

# Voir les logs
vercel logs

# Supprimer un déploiement
vercel rm deployment-url

# Voir les variables d'environnement
vercel env ls
```

## Support

- **Documentation Vercel** : [vercel.com/docs](https://vercel.com/docs)
- **Support Vercel** : [vercel.com/support](https://vercel.com/support)
- **Documentation Supabase** : [supabase.com/docs](https://supabase.com/docs)