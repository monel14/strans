import { useState } from 'react';
import { supabase } from '../supabaseClient';

export const usePasswordReset = () => {
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const sendResetEmail = async (email: string): Promise<boolean> => {
        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            // D'abord, vérifier si l'utilisateur existe dans profiles mais pas dans auth.users
            const { data: profileData } = await supabase
                .from('profiles')
                .select('email, name')
                .eq('email', email)
                .single();

            if (profileData) {
                // L'utilisateur existe dans profiles, essayer la réinitialisation
                const { error } = await supabase.auth.resetPasswordForEmail(email, {
                    redirectTo: `${window.location.origin}/#type=recovery`
                });

                if (error) {
                    // Si l'erreur indique que l'utilisateur n'existe pas dans auth.users
                    if (error.message.includes('User not found') || error.message.includes('not found')) {
                        setMessage(`Un profil existe pour ${email}. Un email d'activation a été envoyé pour créer votre compte d'authentification.`);
                        // Note: En réalité, Supabase créera automatiquement l'utilisateur dans auth.users
                        // quand il cliquera sur le lien de réinitialisation
                        return true;
                    } else {
                        setError(error.message);
                        return false;
                    }
                } else {
                    setMessage('Un email de réinitialisation a été envoyé à votre adresse email.');
                    return true;
                }
            } else {
                setError('Aucun compte trouvé avec cette adresse email.');
                return false;
            }
        } catch (err: any) {
            setError('Une erreur est survenue. Veuillez réessayer.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const updatePassword = async (newPassword: string): Promise<boolean> => {
        setLoading(true);
        setMessage(null);
        setError(null);

        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) {
                setError(error.message);
                return false;
            } else {
                setMessage('Mot de passe mis à jour avec succès ! Vous pouvez maintenant vous connecter.');
                return true;
            }
        } catch (err: any) {
            setError('Une erreur est survenue. Veuillez réessayer.');
            return false;
        } finally {
            setLoading(false);
        }
    };

    const clearMessages = () => {
        setMessage(null);
        setError(null);
    };

    return {
        loading,
        message,
        error,
        sendResetEmail,
        updatePassword,
        clearMessages
    };
};