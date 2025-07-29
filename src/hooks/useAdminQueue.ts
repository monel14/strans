import { useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { handleSupabaseError } from '../utils/errorUtils';
import { Request, User } from '../types';
import { Database } from '../types/database.types';

export const useAdminQueue = (currentUser: User | null, onActionSuccess: () => void) => {

    const assignTask = useCallback(async (taskData: { id: string; type: 'transactions' | 'requests', targetUserId: string | null }) => {
        const { id, type, targetUserId } = taskData;
        let error;

        if (type === 'transactions') {
             const newStatus = targetUserId ? 'Assignée (validation en cours)' : 'En attente de validation';
             const update: Database['public']['Tables']['transactions']['Update'] = { assigned_to: targetUserId, status: newStatus };
             ({ error } = await supabase.from('transactions').update(update).eq('id', id));
        } else {
             const newStatus = targetUserId ? 'En cours de traitement' : 'En attente';
             const update: Database['public']['Tables']['requests']['Update'] = { assigned_to: targetUserId, status: newStatus };
             ({ error } = await supabase.from('requests').update(update).eq('id', id));
        }
        
        if (error) {
            handleSupabaseError(error, "Assignation de la tâche");
        } else {
            console.log("Tâche assignée.");
            onActionSuccess();
        }
    }, [onActionSuccess]);
    
    const processRequest = useCallback(async (request: Request, response: string) => {
        if (!currentUser) return;

        const update: Database['public']['Tables']['requests']['Update'] = { 
            reponse: response, 
            status: 'Résolue', 
            resolved_by_id: currentUser.id, 
            resolution_date: new Date().toISOString() 
        };

        const { error } = await supabase
            .from('requests')
            .update(update)
            .eq('id', request.id);

        if (error) {
            handleSupabaseError(error, "Traitement de la requête");
        } else {
            console.log("Requête traitée.");
            onActionSuccess();
        }
    }, [currentUser, onActionSuccess]);

    const updateTransactionStatus = useCallback(async (transactionId: string, newStatus: 'Validé' | 'Rejeté', reason: string | null = null) => {
        if (!currentUser) return;
        
        const { error } = await supabase.rpc('update_transaction_status', {
            p_transaction_id: transactionId,
            p_new_status: newStatus,
            p_validator_id: currentUser.id,
            p_rejection_reason: reason
        });
        
        if (error) {
            handleSupabaseError(error, "Mise à jour statut transaction");
        } else {
            console.log(`Transaction ${newStatus.toLowerCase()}e avec succès.`);
            onActionSuccess();
        }
    }, [currentUser, onActionSuccess]);

    return {
        assignTask,
        processRequest,
        updateTransactionStatus,
    };
};