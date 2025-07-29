import { useEffect, useCallback, useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { supabase } from '../supabaseClient';

/**
 * Hook pour gérer les données avec actualisation temps réel
 * @param targets - Liste des cibles à écouter (ex: ['balance', 'dashboard'])
 * @param fetchFunction - Fonction pour récupérer les données
 * @param dependencies - Dépendances pour le useEffect
 */
export const useRealtimeData = <T>(
    targets: string[],
    fetchFunction: () => Promise<T>,
    dependencies: any[] = []
) => {
    const { onSystemEvent } = useNotifications();
    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fonction pour charger les données
    const loadData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await fetchFunction();
            setData(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erreur lors du chargement');
            console.error('Erreur dans useRealtimeData:', err);
        } finally {
            setLoading(false);
        }
    }, [fetchFunction]);

    // Chargement initial
    useEffect(() => {
        loadData();
    }, [loadData, ...dependencies]);

    // Écouter les événements système
    useEffect(() => {
        const unsubscribe = onSystemEvent((event) => {
            if (targets.includes(event.target)) {
                console.log(`🔄 Actualisation temps réel pour ${event.target}:`, event);
                loadData();
            }
        });

        return unsubscribe;
    }, [onSystemEvent, targets, loadData]);

    return {
        data,
        loading,
        error,
        refetch: loadData
    };
};

/**
 * Hook spécialisé pour les soldes utilisateur
 */
export const useUserBalance = (userId: string) => {
    return useRealtimeData(
        ['balance'],
        async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('solde, commissions_dues')
                .eq('id', userId)
                .single();
            
            if (error) throw error;
            return data;
        },
        [userId]
    );
};

/**
 * Hook spécialisé pour les statistiques de dashboard
 */
export const useDashboardStats = (userId: string, role: string) => {
    return useRealtimeData(
        ['dashboard', 'balance'],
        async () => {
            let rpcFunction = '';
            switch (role) {
                case 'agent':
                    rpcFunction = 'get_agent_dashboard_stats';
                    break;
                case 'chef_agence':
                    rpcFunction = 'get_chef_dashboard_stats';
                    break;
                case 'sous_admin':
                    rpcFunction = 'get_sous_admin_dashboard_stats';
                    break;
                case 'admin_general':
                    rpcFunction = 'get_global_dashboard_stats';
                    break;
                default:
                    throw new Error(`Rôle non supporté: ${role}`);
            }

            const { data, error } = await supabase.rpc(rpcFunction, 
                role === 'admin_general' ? {} : { [`p_${role.replace('_', '_')}_id`]: userId }
            );
            
            if (error) throw error;
            return data;
        },
        [userId, role]
    );
};

/**
 * Hook spécialisé pour les transactions
 */
export const useTransactions = (userId: string, role: string, limit: number = 10) => {
    return useRealtimeData(
        ['transactions', 'validation_queue'],
        async () => {
            let query = supabase
                .from('transactions')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(limit);

            // Filtrer selon le rôle
            if (role === 'agent') {
                query = query.eq('agent_id', userId);
            } else if (role === 'sous_admin' || role === 'admin_general') {
                query = query.or(`assigned_to.eq.${userId},assigned_to.is.null`);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        },
        [userId, role, limit]
    );
};

/**
 * Hook spécialisé pour les demandes de recharge
 */
export const useRechargeRequests = (userId: string, role: string) => {
    return useRealtimeData(
        ['recharge_requests'],
        async () => {
            let query = supabase
                .from('agent_recharge_requests')
                .select('*')
                .order('created_at', { ascending: false });

            if (role === 'agent') {
                query = query.eq('agent_id', userId);
            } else if (role === 'chef_agence') {
                query = query.eq('chef_agence_id', userId);
            }

            const { data, error } = await query;
            if (error) throw error;
            return data;
        },
        [userId, role]
    );
};