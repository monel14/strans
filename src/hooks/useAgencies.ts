import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { Agency, User } from '../types';
import { handleSupabaseError } from '../utils/errorUtils';
import { Database } from '../types/database.types';
import { useUserCreation } from './useUserCreation';

type AgencyWithStats = {
    id: string;
    name: string;
    chef_id: string | null;
    chef_name: string | null;
    chef_avatar_seed: string | null;
    agent_count: number;
    status: 'active' | 'suspended';
};


export const useAgencies = () => {
    const [agencies, setAgencies] = useState<AgencyWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const { createUserSilent } = useUserCreation();

    const fetchAgencies = useCallback(async () => {
        setLoading(true);
        
        const { data: agenciesData, error: agenciesError } = await supabase.from('agencies').select('id, name, chef_id, status');
        if (agenciesError) {
            handleSupabaseError(agenciesError, "Chargement des agences");
            setLoading(false);
            return;
        }

        const { data: profilesData, error: profilesError } = await supabase.from('profiles').select('id, name, avatar_seed, role, agency_id');
        if (profilesError) {
            handleSupabaseError(profilesError, "Chargement des profils pour les statistiques des agences");
            setLoading(false);
            return;
        }

        const profiles = profilesData || [];
        
        const chefMap = new Map<string, { name: string; avatar_seed: string | null }>();
        const agentCountMap = new Map<string, number>();

        for (const profile of profiles) {
            if (profile.role === 'chef_agence') {
                chefMap.set(profile.id, { name: profile.name, avatar_seed: profile.avatar_seed });
            }
            if (profile.role === 'agent' && profile.agency_id) {
                agentCountMap.set(profile.agency_id, (agentCountMap.get(profile.agency_id) || 0) + 1);
            }
        }
        
        const agenciesWithStats = (agenciesData || []).map(agency => {
            const chef = agency.chef_id ? chefMap.get(agency.chef_id) : null;
            return {
                id: agency.id,
                name: agency.name,
                chef_id: agency.chef_id,
                chef_name: chef ? chef.name : null,
                chef_avatar_seed: chef ? chef.avatar_seed : null,
                agent_count: agentCountMap.get(agency.id) || 0,
                status: (agency.status as 'active' | 'suspended') || 'active',
            };
        });

        setAgencies(agenciesWithStats);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchAgencies();
    }, [fetchAgencies]);

    const saveAgency = async (agency: Agency) => {
        let upsertData: Database['public']['Tables']['agencies']['Insert'];
        
        if (agency.id && agency.id !== '') {
            // Modification d'une agence existante
            upsertData = {
                id: agency.id,
                name: agency.name,
                chef_id: agency.chef_id
            };
        } else {
            // Création d'une nouvelle agence - laisser Supabase générer l'UUID
            upsertData = {
                name: agency.name,
                chef_id: agency.chef_id
            };
        }

        const { data: savedAgency, error } = await supabase.from('agencies').upsert(upsertData).select('id').single();
        if (error) { 
            handleSupabaseError(error, "Sauvegarde de l'agence"); 
        } else {
            if (agency.chef_id && savedAgency) {
                const profileUpdate: Database['public']['Tables']['profiles']['Update'] = { agency_id: savedAgency.id };
                const { error: profileError } = await supabase.from('profiles').update(profileUpdate).eq('id', agency.chef_id);
                if (profileError) { 
                    handleSupabaseError(profileError, "Assignation de l'agence au chef"); 
                    return; 
                }
            }
            console.log("Agence sauvegardée.");
            fetchAgencies();
        }
    };

    const createChef = async (chefData: { name: string; email: string; password: string; }) => {
        const result = await createUserSilent({
            name: chefData.name,
            email: chefData.email,
            password: chefData.password,
            role: 'chef_agence'
        });

        if (result.success) {
            fetchAgencies();
            return { id: result.user_id };
        }
        
        throw new Error(result.error || 'Échec de création du chef');
    };

    return {
        agencies,
        loading,
        saveAgency,
        createChef,
        refetchAgencies: fetchAgencies,
    };
};