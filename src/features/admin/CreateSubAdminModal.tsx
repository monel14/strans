
import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';

interface CreateSubAdminModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { name: string; email: string; password: string; }) => void;
}

export const CreateSubAdminModal: React.FC<CreateSubAdminModalProps> = ({ isOpen, onClose, onSave }) => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({ name, email, password });
        onClose();
        setName('');
        setEmail('');
        setPassword('');
    };

    return (
        <Modal
            id="create-subadmin-modal"
            title="Créer un Nouveau Sous-Administrateur"
            isOpen={isOpen}
            onClose={onClose}
            icon={<i className="fas fa-user-shield text-xl"></i>}
            footer={
                <>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
                    <button type="submit" form="create-subadmin-form" className="btn btn-primary ml-auto">
                        <i className="fas fa-save mr-2"></i> Créer le Sous-Admin
                    </button>
                </>
            }
        >
            <form id="create-subadmin-form" onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="subAdminName" className="form-label">Nom complet</label>
                    <input type="text" id="subAdminName" className="form-input" value={name} onChange={e => setName(e.target.value)} required />
                </div>
                <div className="mb-4">
                    <label htmlFor="subAdminEmail" className="form-label">Adresse Email</label>
                    <input type="email" id="subAdminEmail" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required />
                </div>
                <div className="mb-6">
                    <label htmlFor="subAdminPassword" className="form-label">Mot de passe</label>
                    <input type="password" id="subAdminPassword" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
            </form>
        </Modal>
    );
};
