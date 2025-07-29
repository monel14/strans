import React, { useState } from 'react';
import { usePasswordReset } from '../../hooks/usePasswordReset';

interface LoginPageProps {
    onLogin: (email: string, password: string) => Promise<boolean>;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
    const [email, setEmail] = useState('david@securetrans.dev');
    const [password, setPassword] = useState('password');
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    
    const { 
        loading: resetLoading, 
        message: resetMessage, 
        error: resetError, 
        sendResetEmail, 
        clearMessages 
    } = usePasswordReset();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const success = await onLogin(email, password);
        if (!success) {
            setLoading(false); // Reset button only on failure
        }
        // On success, button remains in loading state while app transitions
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const success = await sendResetEmail(resetEmail);
        
        if (success) {
            setResetEmail('');
            // Fermer le modal après 3 secondes
            setTimeout(() => {
                setShowForgotPassword(false);
                clearMessages();
            }, 3000);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-900 p-4 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-72 h-72 bg-blue-600/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 right-0 w-72 h-72 bg-purple-600/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
            
            <div className="bg-gray-800/50 backdrop-blur-lg border border-gray-700 p-8 sm:p-12 rounded-2xl shadow-2xl w-full max-w-md z-10">
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-4">
                        <i className="fas fa-shield-alt text-4xl text-white"></i>
                    </div>
                    <h1 className="text-3xl font-bold text-white mt-2">SecureTrans</h1>
                    <p className="text-gray-400">Connectez-vous à votre compte sécurisé</p>
                </div>
                <form onSubmit={handleSubmit}>
                    <div className="mb-6">
                        <label htmlFor="email" className="form-label text-gray-300">Email</label>
                        <input type="email" id="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div className="mb-6">
                        <label htmlFor="password" className="form-label text-gray-300">Mot de passe</label>
                        <input type="password" id="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required placeholder="'password' for demo" />
                    </div>
                    <button type="submit" className="w-full text-lg font-semibold text-white px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-[1.02] shadow-lg disabled:opacity-70 disabled:cursor-not-allowed" disabled={loading}>
                        {loading ? 'Connexion...' : <><i className="fas fa-sign-in-alt mr-2"></i>Se connecter</>}
                    </button>
                </form>
                
                <div className="text-center mt-4">
                    <button 
                        type="button"
                        onClick={() => setShowForgotPassword(true)}
                        className="text-blue-400 hover:text-blue-300 text-sm transition-colors duration-200"
                    >
                        Mot de passe oublié ?
                    </button>
                </div>
                <div className="text-center text-xs text-gray-500 mt-6 bg-gray-900/50 p-2 rounded-md border border-gray-700">
                    <strong>Note :</strong> Seuls les comptes existants peuvent se connecter. Le rôle est déterminé selon votre profil.
                    <br />
                    <strong>Nouveau compte créé ?</strong> Utilisez "Mot de passe oublié" pour activer votre authentification.
                </div>
            </div>

            {/* Modal Mot de passe oublié */}
            {showForgotPassword && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-gray-800 border border-gray-700 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-white">Mot de passe oublié</h2>
                            <button 
                                onClick={() => {
                                    setShowForgotPassword(false);
                                    clearMessages();
                                    setResetEmail('');
                                }}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <i className="fas fa-times text-lg"></i>
                            </button>
                        </div>
                        
                        <p className="text-gray-300 text-sm mb-4">
                            Entrez votre adresse email pour recevoir un lien de réinitialisation de mot de passe.
                        </p>
                        
                        <form onSubmit={handleForgotPassword}>
                            <div className="mb-4">
                                <label htmlFor="resetEmail" className="form-label text-gray-300">Email</label>
                                <input 
                                    type="email" 
                                    id="resetEmail" 
                                    className="form-input" 
                                    value={resetEmail} 
                                    onChange={e => setResetEmail(e.target.value)} 
                                    placeholder="votre@email.com"
                                    required 
                                />
                            </div>
                            
                            {resetMessage && (
                                <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-md">
                                    <div className="flex items-center">
                                        <i className="fas fa-check-circle text-green-400 mr-2"></i>
                                        <span className="text-green-300 text-sm">{resetMessage}</span>
                                    </div>
                                </div>
                            )}
                            
                            {resetError && (
                                <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-md">
                                    <div className="flex items-center">
                                        <i className="fas fa-exclamation-triangle text-red-400 mr-2"></i>
                                        <span className="text-red-300 text-sm">{resetError}</span>
                                    </div>
                                </div>
                            )}
                            
                            <div className="flex gap-3">
                                <button 
                                    type="button"
                                    onClick={() => {
                                        setShowForgotPassword(false);
                                        clearMessages();
                                        setResetEmail('');
                                    }}
                                    className="flex-1 px-4 py-2 border border-gray-600 text-gray-300 rounded-lg hover:bg-gray-700 transition-colors"
                                    disabled={resetLoading}
                                >
                                    Annuler
                                </button>
                                <button 
                                    type="submit"
                                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                    disabled={resetLoading}
                                >
                                    {resetLoading ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                                            Envoi...
                                        </>
                                    ) : (
                                        <>
                                            <i className="fas fa-paper-plane mr-2"></i>
                                            Envoyer
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};