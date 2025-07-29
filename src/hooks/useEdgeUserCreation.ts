import { useState } from 'react';
import { supabase } from '../supabaseClient';

export interface EdgeCreateUserData {
    name: string;
    email: string;
    password: string;
    role: 'agent' | 'chef_agence' | 'admin_general' | 'sous_admin';
    agency_id?: string;
}

export interface EdgeCreateUserResult {
    success: boolean;
    user_id?: string;
    error?: string;
    details?: string;
}

export const useEdgeUserCreation = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);

    const createUser = async (userData: EdgeCreateUserData): Promise<EdgeCreateUserResult> => {
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            console.log(`Création utilisateur via Edge Function: ${userData.email} (${userData.role})`);

            const { data, error: functionError } = await supabase.functions.invoke('create-user', {
                body: JSON.stringify(userData)
            });

            if (functionError) {
                console.error('Erreur Edge Function:', functionError);
                setError(functionError.message || 'Erreur lors de l\'appel de la fonction');
                return {
                    success: false,
                    error: functionError.message || 'Erreur lors de l\'appel de la fonction'
                };
            }

            if (data.error) {
                console.error('Erreur dans la réponse:', data.error);
                setError(data.error);
                return {
                    success: false,
                    error: data.error,
                    details: data.details
                };
            }

            console.log(`Utilisateur créé avec succès:`, data.user?.id);
            setMessage('Utilisateur créé avec succès avec authentification complète');

            return {
                success: true,
                user_id: data.user?.id
            };

        } catch (err: any) {
            console.error('Erreur inattendue:', err);
            setError(err.message || 'Erreur inattendue');
            return {
                success: false,
                error: err.message || 'Erreur inattendue'
            };
        } finally {
            setLoading(false);
        }
    };

    const createUserWithFeedback = async (userData: EdgeCreateUserData): Promise<EdgeCreateUserResult> => {
        const result = await createUser(userData);
        
        if (result.success) {
            alert('Utilisateur créé avec succès ! Il peut maintenant se connecter normalement.');
        } else {
            alert(`Erreur lors de la création: ${result.error}`);
        }
        
        return result;
    };

    const clearMessages = () => {
        setError(null);
        setMessage(null);
    };

    return {
        loading,
        error,
        message,
        createUser,
        createUserWithFeedback,
        clearMessages
    };
};