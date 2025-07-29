import { useState } from 'react';
import { supabase } from '../supabaseClient';
import { handleSupabaseError } from '../utils/errorUtils';
import { useEdgeUserCreation } from './useEdgeUserCreation';

export interface CreateUserData {
    name: string;
    email: string;
    password: string;
    role: 'agent' | 'chef_agence' | 'sous_admin';
    agency_id?: string;
    // permissions supprimées - système simplifié
}

export interface CreateUserResult {
    success: boolean;
    user_id?: string;
    method?: string;
    error?: string;
}

export const useUserCreation = () => {
    const { createUser: createUserViaEdge } = useEdgeUserCreation();
    
    const createUser = async (userData: CreateUserData): Promise<CreateUserResult> => {
        console.log(`Création utilisateur ${userData.role}:`, userData.email);
        
        try {
            // 1. Méthode principale : Edge Function (recommandée)
            console.log('Tentative avec Edge Function create-user...');
            const edgeResult = await createUserViaEdge({
                name: userData.name,
                email: userData.email,
                password: userData.password,
                role: userData.role,
                agency_id: userData.agency_id
            });

            if (edgeResult.success) {
                console.log(`${userData.role} créé via Edge Function:`, edgeResult.user_id);
                return {
                    success: true,
                    user_id: edgeResult.user_id,
                    method: 'edge_function'
                };
            }

            console.log('Edge Function échouée:', edgeResult.error);
            console.log('Tentative avec admin.createUser...');
            const { data: adminData, error: adminError } = await supabase.auth.admin.createUser({
                email: userData.email,
                password: userData.password,
                user_metadata: {
                    name: userData.name,
                    role: userData.role,
                    avatar_seed: userData.name.slice(0, 2).toUpperCase(),
                    agency_id: userData.agency_id
                    // permissions supprimées
                },
                email_confirm: true
            });

            if (!adminError && adminData.user) {
                console.log(`${userData.role} créé via Admin:`, adminData.user.id);
                return {
                    success: true,
                    user_id: adminData.user.id,
                    method: 'admin_create'
                };
            }

            console.log('Admin createUser échoué:', adminError?.message);
            
            // 2. Méthode de secours : Fonction SQL sans contrainte auth
            console.log('Tentative avec fonction SQL create_profile_without_auth...');
            const { data: sqlResult, error: sqlError } = await supabase
                .rpc('create_profile_without_auth', {
                    p_email: userData.email,
                    p_name: userData.name,
                    p_role: userData.role,
                    p_agency_id: userData.agency_id
                });

            if (!sqlError && sqlResult?.success) {
                console.log(`${userData.role} créé via fonction SQL:`, sqlResult.user_id);
                return {
                    success: true,
                    user_id: sqlResult.user_id,
                    method: 'sql_function'
                };
            }

            console.log('Fonction SQL échouée:', sqlError?.message);
            
            // 3. Dernier recours : Insertion directe en base
            console.log('Tentative avec insertion directe...');
            const { data: insertData, error: insertError } = await supabase
                .from('profiles')
                .insert({
                    name: userData.name,
                    email: userData.email,
                    role: userData.role,
                    avatar_seed: userData.name.slice(0, 2).toUpperCase(),
                    agency_id: userData.agency_id,
                    // permissions supprimées
                    status: 'active'
                })
                .select('id')
                .single();
                
            if (!insertError && insertData) {
                console.log(`${userData.role} créé via insertion directe:`, insertData.id);
                return {
                    success: true,
                    user_id: insertData.id,
                    method: 'direct_insert'
                };
            }

            // Si tout échoue
            const finalError = insertError || sqlError || adminError;
            console.error('Toutes les méthodes de création ont échoué:', finalError);
            
            return {
                success: false,
                error: finalError?.message || 'Échec de création utilisateur'
            };
            
        } catch (err: any) {
            console.error('Erreur dans createUser:', err);
            return {
                success: false,
                error: err.message || 'Erreur inattendue'
            };
        }
    };

    const createUserWithFeedback = async (userData: CreateUserData): Promise<CreateUserResult> => {
        const result = await createUser(userData);
        
        if (result.success) {
            const methodMessages = {
                'edge_function': 'Utilisateur créé avec authentification complète via Edge Function.',
                'admin_create': 'Utilisateur créé avec authentification complète.',
                'sql_function': 'Profil créé avec succès. L\'utilisateur devra utiliser "Mot de passe oublié" pour se connecter.',
                'direct_insert': 'Profil créé directement. L\'utilisateur devra utiliser "Mot de passe oublié" pour se connecter.'
            };
            
            const message = methodMessages[result.method as keyof typeof methodMessages] || 'Utilisateur créé.';
            alert(message);
        } else {
            handleSupabaseError(new Error(result.error), `Création ${userData.role}`);
        }
        
        return result;
    };

    const createUserSilent = async (userData: CreateUserData): Promise<CreateUserResult> => {
        const result = await createUser(userData);
        
        if (result.success) {
            console.log(`${userData.role} créé avec succès via ${result.method}`);
        } else {
            console.error(`Échec création ${userData.role}:`, result.error);
        }
        
        return result;
    };

    return {
        createUser,
        createUserWithFeedback,
        createUserSilent
    };
};