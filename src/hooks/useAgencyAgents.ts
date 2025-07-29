
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Agent } from '../types';
import { handleSupabaseError } from '../utils/errorUtils';
import { Database } from '../types/database.types';
import { useUserCreation } from './useUserCreation';

export const useAgencyAgents = (agencyId: string | null) => {
    const [agents, setAgents] = useState<Agent[]>([]);
    const [loading, setLoading] = useState(true);
    const { createUserWithFeedback } = useUserCreation();

    const fetchAgents = useCallback(async () => {
        if (!agencyId) {
            setAgents([]);
            setLoading(false);
            return;
        }
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('id, name, email, avatar_seed, role, agency_id, solde, status, suspension_reason, commissions_dues')
            .eq('role', 'agent')
            .eq('agency_id', agencyId);
        
        if (error) {
            handleSupabaseError(error, "Chargement de la liste des agents");
            setAgents([]);
        } else {
            setAgents((data as unknown as Agent[]) ?? []);
        }
        setLoading(false);
    }, [agencyId]);

    useEffect(() => {
        fetchAgents();
    }, [fetchAgents]);

    const saveAgent = async (agentData: Partial<Agent>, password?: string) => {
        setLoading(true);
        if (agentData.id) { // Update existing agent
            const update: Database['public']['Tables']['profiles']['Update'] = { name: agentData.name, solde: agentData.solde };
            const { error } = await supabase.from('profiles').update(update).eq('id', agentData.id);
            if (error) {
                handleSupabaseError(error, `Mise à jour de l'agent`);
            } else {
                console.log(`Agent mis à jour.`);
                if (password) {
                    // Updating another user's password from the client is not possible for security reasons.
                    // This should be done via a secure backend function (e.g., Supabase Edge Function).
                    console.warn("Note: La mise à jour du mot de passe pour un utilisateur existant n'est pas supportée dans cette interface.");
                }
            }
        } else { // Create new agent
            if (!password || !agentData.email || !agentData.name) {
                console.error("Nom, email et mot de passe sont requis.");
                setLoading(false);
                return;
            }
            
            const result = await createUserWithFeedback({
                name: agentData.name,
                email: agentData.email,
                password,
                role: 'agent',
                agency_id: agentData.agency_id
            });
            
            if (!result.success) {
                console.error(`Échec création agent: ${result.error}`);
            } else {
                console.log(`Agent créé avec ID: ${result.user_id}`);
            }
        }
        setLoading(false);
        fetchAgents(); // Refetch after saving
    };
    
    const toggleAgentStatus = async (agent: Agent, reason: string | null) => {
        const isSuspending = agent.status === 'active';
        const newStatus = isSuspending ? 'suspended' : 'active';
        
        const { error } = await supabase.rpc('update_user_status', { 
            p_target_user_id: agent.id, 
            p_new_status: newStatus, 
            p_reason: reason 
        });

        if (error) {
            handleSupabaseError(error, "Suspension/Réactivation de l'agent");
        } else {
            console.log(`Agent ${isSuspending ? 'suspendu' : 'réactivé'}.`);
        }
        fetchAgents(); // Refetch after status change
    };

    return {
        agents,
        loading,
        saveAgent,
        toggleAgentStatus,
        refetchAgents: fetchAgents,
    };
};
