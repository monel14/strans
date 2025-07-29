
import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';

interface CreateChefModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (chefData: { name: string; email: string; password: string; }) => Promise<void>;
}

export const CreateChefModal: React.FC<CreateChefModalProps> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);
        
        try {
            await onSave({ name, email, password });
            // Ne fermer le modal et réinitialiser les champs qu'en cas de succès
            onClose();
            setName('');
            setEmail('');
            setPassword('');
            setError(null);
        } catch (error: any) {
            console.error('Erreur lors de la création du chef:', error);
            setError(error.message || 'Une erreur est survenue lors de la création du chef');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal 
            id="create-chef-modal" 
            title="Créer un Nouveau Chef d'Agence" 
            isOpen={isOpen} 
            onClose={onClose}
            icon={<i className="fas fa-user-tie text-xl"></i>}
            footer={
                <>
                    <button 
                        type="button" 
                        className="btn btn-secondary" 
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Annuler
                    </button>
                    <button 
                        type="submit" 
                        form="create-chef-form" 
                        className="btn btn-primary ml-auto"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Création...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-save mr-2"></i> Créer le Chef d'Agence
                            </>
                        )}
                    </button>
                </>
            }
        >
            <form id="create-chef-form" onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="chefName" className="form-label">Nom complet</label>
                    <input 
                        type="text" 
                        id="chefName" 
                        className="form-input" 
                        value={name} 
                        onChange={e => setName(e.target.value)} 
                        autoComplete="name"
                        disabled={isSubmitting}
                        required 
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="chefEmail" className="form-label">Adresse Email</label>
                    <input 
                        type="email" 
                        id="chefEmail" 
                        className="form-input" 
                        value={email} 
                        onChange={e => setEmail(e.target.value)} 
                        autoComplete="email"
                        disabled={isSubmitting}
                        required 
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="chefPassword" className="form-label">Mot de passe</label>
                    <input 
                        type="password" 
                        id="chefPassword" 
                        className="form-input" 
                        value={password} 
                        onChange={e => setPassword(e.target.value)} 
                        autoComplete="new-password"
                        minLength={6}
                        disabled={isSubmitting}
                        required 
                    />
                    <p className="text-xs text-gray-500 mt-1">Minimum 6 caractères</p>
                </div>
                
                {isSubmitting && (
                    <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                        <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                            <span className="text-blue-700 text-sm">Création du chef d'agence en cours...</span>
                        </div>
                    </div>
                )}
                
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center">
                            <i className="fas fa-exclamation-triangle text-red-600 mr-2"></i>
                            <span className="text-red-700 text-sm">{error}</span>
                        </div>
                    </div>
                )}
            </form>
        </Modal>
    );
};
