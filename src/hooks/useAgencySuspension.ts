import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { handleSupabaseError } from '../utils/errorUtils';
// useSousAdminPermissions supprimé - système simplifié

// Types pour la suspension d'agence
export interface AgencySuspensionResult {
    success: boolean;
    message: string;
    agency_id: string;
    agency_name?: string;
    affected_members?: number;
    suspended_at?: string;
    activated_at?: string;
    error?: string;
}

export interface AgencyStatusDetails {
    agency_id: string;
    agency_name: string;
    status: 'active' | 'suspended';
    chef?: {
        id: string;
        name: string;
        status: string;
    };
    members?: Array<{
        id: string;
        name: string;
        role: string;
        status: string;
    }>;
    total_members: number;
    active_members: number;
    suspended_members: number;
    last_updated: string;
}

export const useAgencySuspension = (currentUser?: any) => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // checkPermission supprimé - système simplifié

    // Suspendre une agence
    const suspendAgency = useCallback(async (
        agencyId: string,
        reason?: string
    ): Promise<AgencySuspensionResult> => {
        setLoading(true);
        setError(null);

        try {
            console.log(`Suspension de l'agence ${agencyId}...`);

            const { data, error: rpcError } = await supabase.rpc('suspend_agency', {
                p_agency_id: agencyId,
                p_reason: reason || 'Suspension administrative'
            });

            if (rpcError) {
                console.error('Erreur RPC suspension:', rpcError);
                setError(rpcError.message);
                return {
                    success: false,
                    message: rpcError.message,
                    agency_id: agencyId,
                    error: rpcError.message
                };
            }

            if (!data.success) {
                setError(data.error);
                return data;
            }

            console.log('Agence suspendue avec succès:', data);
            return data;

        } catch (err: any) {
            console.error('Erreur inattendue lors de la suspension:', err);
            const errorMessage = err.message || 'Erreur inattendue lors de la suspension';
            setError(errorMessage);
            return {
                success: false,
                message: errorMessage,
                agency_id: agencyId,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, []);

    // Réactiver une agence
    const activateAgency = useCallback(async (
        agencyId: string,
        reason?: string
    ): Promise<AgencySuspensionResult> => {
        setLoading(true);
        setError(null);

        try {
            console.log(`Réactivation de l'agence ${agencyId}...`);

            const { data, error: rpcError } = await supabase.rpc('activate_agency', {
                p_agency_id: agencyId,
                p_reason: reason || 'Réactivation administrative'
            });

            if (rpcError) {
                console.error('Erreur RPC réactivation:', rpcError);
                setError(rpcError.message);
                return {
                    success: false,
                    message: rpcError.message,
                    agency_id: agencyId,
                    error: rpcError.message
                };
            }

            if (!data.success) {
                setError(data.error);
                return data;
            }

            console.log('Agence réactivée avec succès:', data);
            return data;

        } catch (err: any) {
            console.error('Erreur inattendue lors de la réactivation:', err);
            const errorMessage = err.message || 'Erreur inattendue lors de la réactivation';
            setError(errorMessage);
            return {
                success: false,
                message: errorMessage,
                agency_id: agencyId,
                error: errorMessage
            };
        } finally {
            setLoading(false);
        }
    }, []);

    // Obtenir les détails du statut d'une agence
    const getAgencyStatusDetails = useCallback(async (
        agencyId: string
    ): Promise<AgencyStatusDetails | null> => {
        setLoading(true);
        setError(null);

        try {
            // Récupérer les informations de l'agence directement depuis les tables
            const { data: agencyData, error: agencyError } = await supabase
                .from('agencies')
                .select('id, name, chef_id')
                .eq('id', agencyId)
                .single();

            if (agencyError) {
                console.error('Erreur lors de la récupération de l\'agence:', agencyError);
                setError(agencyError.message);
                return null;
            }

            // Récupérer les membres de l'agence
            const { data: membersData, error: membersError } = await supabase
                .from('profiles')
                .select('id, name, role, status')
                .eq('agency_id', agencyId);

            if (membersError) {
                console.error('Erreur lors de la récupération des membres:', membersError);
                setError(membersError.message);
                return null;
            }

            // Récupérer les informations du chef
            let chef = null;
            if (agencyData.chef_id) {
                const { data: chefData } = await supabase
                    .from('profiles')
                    .select('id, name, status')
                    .eq('id', agencyData.chef_id)
                    .single();
                
                if (chefData) {
                    chef = {
                        id: chefData.id,
                        name: chefData.name,
                        status: chefData.status
                    };
                }
            }

            const members = (membersData || []).map(member => ({
                id: member.id,
                name: member.name,
                role: member.role,
                status: member.status
            }));

            const activeMembers = members.filter(m => m.status === 'active').length;
            const suspendedMembers = members.filter(m => m.status === 'suspended').length;

            return {
                agency_id: agencyData.id,
                agency_name: agencyData.name,
                status: 'active' as const, // Default to active since status field doesn't exist
                chef,
                members,
                total_members: members.length,
                active_members: activeMembers,
                suspended_members: suspendedMembers,
                last_updated: new Date().toISOString()
            };

        } catch (err: any) {
            console.error('Erreur lors de la récupération des détails:', err);
            setError(err.message || 'Erreur inattendue');
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    // Basculer le statut d'une agence (suspend si active, active si suspendue)
    const toggleAgencyStatus = useCallback(async (
        agencyId: string,
        currentStatus: 'active' | 'suspended',
        reason?: string
    ): Promise<AgencySuspensionResult> => {
        if (currentStatus === 'active') {
            return suspendAgency(agencyId, reason);
        } else {
            return activateAgency(agencyId, reason);
        }
    }, [suspendAgency, activateAgency]);

    // Vérifier si une agence peut être suspendue/activée
    const canToggleAgencyStatus = useCallback((
        agencyStatus: 'active' | 'suspended',
        userRole?: string
    ): { canToggle: boolean; reason?: string } => {
        // Seuls les admins peuvent suspendre/activer
        if (!userRole || !['admin_general', 'sous_admin'].includes(userRole)) {
            return {
                canToggle: false,
                reason: 'Permissions insuffisantes pour cette action'
            };
        }

        return { canToggle: true };
    }, []);

    // Obtenir le libellé d'action approprié
    const getActionLabel = useCallback((status: 'active' | 'suspended'): string => {
        return status === 'active' ? 'Suspendre' : 'Réactiver';
    }, []);

    // Obtenir l'icône appropriée
    const getStatusIcon = useCallback((status: 'active' | 'suspended'): string => {
        return status === 'active' ? 'fa-pause-circle' : 'fa-play-circle';
    }, []);

    // Obtenir la couleur appropriée
    const getStatusColor = useCallback((status: 'active' | 'suspended'): string => {
        return status === 'active' ? 'text-green-600' : 'text-red-600';
    }, []);

    return {
        // État
        loading,
        error,

        // Actions principales
        suspendAgency,
        activateAgency,
        toggleAgencyStatus,
        getAgencyStatusDetails,

        // Utilitaires
        canToggleAgencyStatus,
        getActionLabel,
        getStatusIcon,
        getStatusColor,

        // Helpers
        clearError: () => setError(null)
    };
};