

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { SousAdmin, User } from '../types';
import { handleSupabaseError } from '../utils/errorUtils';
import { Database } from '../types/database.types';
import { useUserCreation } from './useUserCreation';

export type SubAdminWithStats = SousAdmin & { assigned_tasks: number };

export const useSubAdmins = () => {
    const [subAdmins, setSubAdmins] = useState<SubAdminWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const { createUserWithFeedback } = useUserCreation();

    const fetchSubAdmins = useCallback(async () => {
        setLoading(true);

        const { data: subAdminsData, error: subAdminsError } = await supabase
            .from('profiles')
            .select('*')
            .eq('role', 'sous_admin');
        
        if (subAdminsError) {
            handleSupabaseError(subAdminsError, "Chargement des profils sous-admin");
            setLoading(false);
            return;
        }

        const sousAdminsList = (subAdminsData || []) as SousAdmin[];
        if (sousAdminsList.length === 0) {
            setSubAdmins([]);
            setLoading(false);
            return;
        }

        const subAdminIds = sousAdminsList.map(sa => sa.id);

        const { data: txData, error: txError } = await supabase
            .from('transactions')
            .select('assigned_to')
            .in('assigned_to', subAdminIds);

        const { data: reqData, error: reqError } = await supabase
            .from('requests')
            .select('assigned_to')
            .in('assigned_to', subAdminIds);
            
        if (txError) handleSupabaseError(txError, "Comptage des transactions assignées");
        if (reqError) handleSupabaseError(reqError, "Comptage des requêtes assignées");
        
        const taskCountMap = new Map<string, number>();
        
        (txData || []).forEach(tx => {
            if (tx.assigned_to) {
                taskCountMap.set(tx.assigned_to, (taskCountMap.get(tx.assigned_to) || 0) + 1);
            }
        });

        (reqData || []).forEach(req => {
            if (req.assigned_to) {
                taskCountMap.set(req.assigned_to, (taskCountMap.get(req.assigned_to) || 0) + 1);
            }
        });

        const subAdminsWithStats: SubAdminWithStats[] = sousAdminsList.map(sa => ({
            ...sa,
            role: 'sous_admin',
            assigned_tasks: taskCountMap.get(sa.id) || 0
        }));
        
        setSubAdmins(subAdminsWithStats);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchSubAdmins();
    }, [fetchSubAdmins]);

    const createSubAdmin = async (subAdminData: { name: string; email: string; password: string; }) => {
        const result = await createUserWithFeedback({
            name: subAdminData.name,
            email: subAdminData.email,
            password: subAdminData.password,
            role: 'sous_admin',
            permissions: { can_validate_transactions: true, can_manage_requests: true }
        });
        
        if (result.success) {
            console.log(`Sous-administrateur créé avec ID: ${result.user_id}`);
            fetchSubAdmins();
        } else {
            console.error(`Échec création sous-admin: ${result.error}`);
        }
    };
    
    const savePermissions = async (userId: string, permissions: SousAdmin['permissions']) => {
        const update: Database['public']['Tables']['profiles']['Update'] = { permissions: permissions };
        const { error } = await supabase.from('profiles').update(update).eq('id', userId);
        if (error) {
            handleSupabaseError(error, "Mise à jour des permissions");
        } else {
            console.log("Permissions mises à jour.");
            fetchSubAdmins();
        }
    };

    const toggleSubAdminStatus = async (userToSuspend: User, reason: string | null) => {
        if (!('status' in userToSuspend)) { 
            console.warn("Cet utilisateur ne peut être suspendu."); 
            return; 
        }
        const isSuspending = userToSuspend.status === 'active';
        const newStatus = isSuspending ? 'suspended' : 'active';
        const { error } = await supabase.rpc('update_user_status', { 
            p_target_user_id: userToSuspend.id, 
            p_new_status: newStatus, 
            p_reason: reason 
        });
        if (error) {
            handleSupabaseError(error, "Suspension/Réactivation de l'utilisateur");
        } else {
            console.log(`Utilisateur ${isSuspending ? 'suspendu' : 'réactivé'}.`);
        }
        fetchSubAdmins();
    };

    return {
        subAdmins,
        loading,
        createSubAdmin,
        savePermissions,
        toggleSubAdminStatus,
        refetchSubAdmins: fetchSubAdmins,
    };
};
