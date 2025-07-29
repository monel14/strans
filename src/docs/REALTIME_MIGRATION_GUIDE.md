# Guide de Migration vers le Système Temps Réel

Ce guide vous explique comment migrer vos composants existants pour utiliser le nouveau système de notifications temps réel.

## 🚀 Étapes de Migration

### 1. Mise à jour du Provider Principal

Assurez-vous que votre `App.tsx` utilise le nouveau `NotificationProvider` :

```tsx
// App.tsx
import { NotificationProvider } from './context/NotificationContext';

export const App: React.FC = () => {
    return (
        <AuthProvider>
            <NotificationProvider> {/* Nouveau provider amélioré */}
                <NavigationProvider>
                    <UIProvider>
                        {/* Votre application */}
                    </UIProvider>
                </NavigationProvider>
            </NotificationProvider>
        </AuthProvider>
    );
};
```

### 2. Migration des Dashboards

#### Avant (Ancien système)
```tsx
// AgentDashboard.tsx - AVANT
export const AgentDashboard: React.FC<PageComponentProps> = ({ user, refreshKey }) => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            const { data } = await supabase.rpc('get_agent_dashboard_stats', { p_agent_id: user.id });
            setStats(data);
            setLoading(false);
        };
        fetchData();
    }, [user.id, refreshKey]); // Dépendant de refreshKey

    // ... reste du composant
};
```

#### Après (Nouveau système)
```tsx
// AgentDashboard.tsx - APRÈS
import { useDashboardStats, useUserBalance } from '../../hooks/useRealtimeData';

export const AgentDashboard: React.FC<PageComponentProps> = ({ user }) => {
    // Plus besoin de refreshKey !
    const { data: stats, loading: statsLoading } = useDashboardStats(user.id, user.role);
    const { data: balance, loading: balanceLoading } = useUserBalance(user.id);

    // Les données se mettent à jour automatiquement !
    // ... reste du composant
};
```

### 3. Migration des Listes de Données

#### Avant
```tsx
// ChefManageAgents.tsx - AVANT
export const ChefManageAgents: React.FC<PageComponentProps> = ({ user, refreshCurrentUser }) => {
    const [agents, setAgents] = useState([]);
    const [rechargeRequests, setRechargeRequests] = useState([]);

    const fetchAgents = async () => {
        const { data } = await supabase.from('profiles').select('*').eq('agency_id', user.agency_id);
        setAgents(data || []);
    };

    const fetchRechargeRequests = async () => {
        const { data } = await supabase.from('agent_recharge_requests').select('*').eq('chef_agence_id', user.id);
        setRechargeRequests(data || []);
    };

    useEffect(() => {
        fetchAgents();
        fetchRechargeRequests();
    }, []);

    // Après chaque action, refetch manuel
    const handleApproveRecharge = async (requestId) => {
        await supabase.rpc('approve_agent_recharge', { p_request_id: requestId });
        fetchRechargeRequests(); // Refetch manuel
        refreshCurrentUser(); // Refetch manuel
    };
};
```

#### Après
```tsx
// ChefManageAgents.tsx - APRÈS
import { useRealtimeData, useRechargeRequests } from '../../hooks/useRealtimeData';

export const ChefManageAgents: React.FC<PageComponentProps> = ({ user }) => {
    // Données automatiquement synchronisées
    const { data: agents, loading: agentsLoading } = useRealtimeData(
        ['agency_members'],
        async () => {
            const { data } = await supabase.from('profiles').select('*').eq('agency_id', user.agency_id);
            return data || [];
        },
        [user.agency_id]
    );

    const { data: rechargeRequests, loading: requestsLoading } = useRechargeRequests(user.id, user.role);

    // Plus besoin de refetch manuel !
    const handleApproveRecharge = async (requestId) => {
        await supabase.rpc('approve_agent_recharge', { p_request_id: requestId });
        // Les données se mettent à jour automatiquement via les triggers SQL !
    };
};
```

### 4. Gestion des Événements Personnalisés

Pour des cas spéciaux, vous pouvez écouter des événements système spécifiques :

```tsx
import { useNotifications } from '../context/NotificationContext';

export const CustomComponent: React.FC = () => {
    const { onSystemEvent } = useNotifications();

    useEffect(() => {
        const unsubscribe = onSystemEvent((event) => {
            if (event.target === 'custom_target') {
                console.log('Événement personnalisé reçu:', event);
                // Votre logique personnalisée
            }
        });

        return unsubscribe; // Nettoyage automatique
    }, [onSystemEvent]);
};
```

### 5. Indicateur de Statut de Connexion

Ajoutez un indicateur de statut temps réel dans vos composants :

```tsx
import { useNotifications } from '../context/NotificationContext';

export const StatusIndicator: React.FC = () => {
    const { connectionStatus } = useNotifications();

    return (
        <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${
                connectionStatus === 'connected' ? 'bg-green-500' : 
                connectionStatus === 'reconnecting' ? 'bg-yellow-500' : 'bg-red-500'
            }`}></div>
            <span className="text-xs text-gray-600">
                {connectionStatus === 'connected' ? 'Temps réel actif' : 
                 connectionStatus === 'reconnecting' ? 'Reconnexion...' : 'Hors ligne'}
            </span>
        </div>
    );
};
```

## 🎯 Hooks Disponibles

### `useRealtimeData<T>(targets, fetchFunction, dependencies)`
Hook générique pour toute donnée avec actualisation temps réel.

### `useUserBalance(userId)`
Hook spécialisé pour les soldes utilisateur.

### `useDashboardStats(userId, role)`
Hook spécialisé pour les statistiques de dashboard.

### `useTransactions(userId, role, limit?)`
Hook spécialisé pour les transactions.

### `useRechargeRequests(userId, role)`
Hook spécialisé pour les demandes de recharge.

## 🔧 Personnalisation

### Créer un Hook Personnalisé

```tsx
export const useCustomData = (customParam: string) => {
    return useRealtimeData(
        ['custom_target'], // Cibles à écouter
        async () => {
            // Votre logique de récupération
            const { data } = await supabase.from('custom_table').select('*').eq('param', customParam);
            return data;
        },
        [customParam] // Dépendances
    );
};
```

### Déclencher des Événements Manuels

```tsx
const { triggerRefresh } = useNotifications();

const handleManualRefresh = () => {
    triggerRefresh('custom_target', { additionalData: 'value' });
};
```

## 🚨 Points d'Attention

1. **Supprimez les `refreshKey`** : Plus besoin avec le système temps réel
2. **Supprimez les `refetch` manuels** : Les triggers SQL s'en chargent
3. **Testez la reconnexion** : Le système gère automatiquement les déconnexions
4. **Surveillez les performances** : Les hooks limitent automatiquement les données

## 🧪 Test du Système

Pour tester que le système fonctionne :

1. Ouvrez deux onglets de votre application
2. Effectuez une action dans un onglet (ex: transaction)
3. Vérifiez que l'autre onglet se met à jour automatiquement
4. Vérifiez les événements système dans la console de développement

## 📊 Debug et Monitoring

Utilisez le composant `RealtimeDashboardExample` pour voir les événements système en temps réel et déboguer votre implémentation.