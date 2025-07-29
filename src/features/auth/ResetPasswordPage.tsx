import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { usePasswordReset } from '../../hooks/usePasswordReset';

export const ResetPasswordPage: React.FC = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isValidSession, setIsValidSession] = useState(false);
    const [validationError, setValidationError] = useState<string | null>(null);
    
    const { loading, message, error, updatePassword } = usePasswordReset();

    useEffect(() => {
        // Vérifier si nous avons une session valide pour la réinitialisation
        const checkSession = async () => {
            try {
                // Vérifier d'abord les paramètres d'URL pour les tokens de récupération
                const urlParams = new URLSearchParams(window.location.search);
                const hashParams = new URLSearchParams(window.location.hash.substring(1));
                
                const accessToken = urlParams.get('access_token') || hashParams.get('access_token');
                const refreshToken = urlParams.get('refresh_token') || hashParams.get('refresh_token');
                const type = urlParams.get('type') || hashParams.get('type');
                
                if (type === 'recovery' && accessToken && refreshToken) {
                    // Définir la session avec les tokens de récupération
                    const { data, error } = await supabase.auth.setSession({
                        access_token: accessToken,
                        refresh_token: refreshToken
                    });
                    
                    if (!error && data.session) {
                        setIsValidSession(true);
                        return;
                    }
                }
                
                // Vérifier la session existante
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    setIsValidSession(true);
                } else {
                    setError('Lien de réinitialisation invalide ou expiré. Veuillez demander un nouveau lien.');
                }
            } catch (err) {
                console.error('Erreur lors de la vérification de session:', err);
                setError('Lien de réinitialisation invalide ou expiré. Veuillez demander un nouveau lien.');
            }
        };

        checkSession();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setValidationError(null);

        if (password !== confirmPassword) {
            setValidationError('Les mots de passe ne correspondent pas.');
            return;
        }

        if (password.length < 6) {
            setValidationError('Le mot de passe doit contenir au moins 6 caractères.');
            return;
        }

        const success = await updatePassword(password);
        
        if (success) {
            setPassword('');
            setConfirmPassword('');
            
            // Rediriger vers la page de login après 3 secondes
            setTimeout(() => {
                window.location.href = '/';
            }, 3000);
        }
    };

    if (!isValidSession && !error) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4">
                <div className="bg-gray-800 border border-gray-700 p-8 rounded-2xl shadow-2xl w-full max-w-md">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
                        <p className="text-gray-300">Vérification du lien de réinitialisation...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-72 h-72 bg-blue-600/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-600/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
            
            <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 p-8 sm:p-12 rounded-2xl shadow-2xl w-full max-w-md z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-4">
                        <i className="fas fa-key text-4xl text-white"></i>
                    </div>
                    <h1 className="text-3xl font-bold text-white mt-2">Nouveau mot de passe</h1>
                    <p className="text-gray-400">Définissez votre nouveau mot de passe</p>
                </div>

                {error && !isValidSession ? (
                    <div className="text-center">
                        <div className="p-4 bg-red-900/50 border border-red-700 rounded-md mb-4">
                            <div className="flex items-center justify-center mb-2">
                                <i className="fas fa-exclamation-triangle text-red-400 mr-2"></i>
                                <span className="text-red-300">{error}</span>
                            </div>
                            <p className="text-gray-400 text-sm">
                                Les liens de réinitialisation expirent après quelques minutes pour des raisons de sécurité.
                            </p>
                        </div>
                        <div className="flex gap-3 justify-center">
                            <button 
                                onClick={() => window.location.href = '/'}
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
                            >
                                <i className="fas fa-sign-in-alt mr-2"></i>
                                Retour à la connexion
                            </button>
                        </div>
                        <p className="text-gray-400 text-xs mt-3">
                            Utilisez "Mot de passe oublié" sur la page de connexion pour recevoir un nouveau lien.
                        </p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <div className="mb-6">
                            <label htmlFor="password" className="form-label text-gray-300">Nouveau mot de passe</label>
                            <input 
                                type="password" 
                                id="password" 
                                className="form-input" 
                                value={password} 
                                onChange={e => setPassword(e.target.value)} 
                                placeholder="Minimum 6 caractères"
                                required 
                            />
                        </div>
                        
                        <div className="mb-6">
                            <label htmlFor="confirmPassword" className="form-label text-gray-300">Confirmer le mot de passe</label>
                            <input 
                                type="password" 
                                id="confirmPassword" 
                                className="form-input" 
                                value={confirmPassword} 
                                onChange={e => setConfirmPassword(e.target.value)} 
                                placeholder="Répétez le mot de passe"
                                required 
                            />
                        </div>

                        {message && (
                            <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-md">
                                <div className="flex items-center">
                                    <i className="fas fa-check-circle text-green-400 mr-2"></i>
                                    <span className="text-green-300 text-sm">{message}</span>
                                </div>
                            </div>
                        )}
                        
                        {(error || validationError) && (
                            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-md">
                                <div className="flex items-center">
                                    <i className="fas fa-exclamation-triangle text-red-400 mr-2"></i>
                                    <span className="text-red-300 text-sm">{error || validationError}</span>
                                </div>
                            </div>
                        )}
                        
                        <button 
                            type="submit" 
                            className="w-full text-lg font-semibold text-white px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-70 disabled:cursor-not-allowed" 
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline-block"></div>
                                    Mise à jour...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-save mr-2"></i>
                                    Mettre à jour le mot de passe
                                </>
                            )}
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
};