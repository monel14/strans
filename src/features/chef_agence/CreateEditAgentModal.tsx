

import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Agent } from '../../types';

interface CreateEditAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    agentToEdit: Agent | null;
    onSave: (agent: Partial<Agent>, password?: string) => void;
    agencyId: string;
}

export const CreateEditAgentModal: React.FC<CreateEditAgentModalProps> = ({ isOpen, onClose, agentToEdit, onSave, agencyId }) => {
    const [agentData, setAgentData] = useState<Partial<Agent>>({});
    const [password, setPassword] = useState('');

    useEffect(() => {
        if (isOpen) {
            if (agentToEdit) {
                setAgentData(agentToEdit);
            } else {
                // Default values for new agent
                setAgentData({
                    name: '',
                    email: '',
                    solde: 0,
                    status: 'active',
                    agency_id: agencyId,
                });
            }
            setPassword('');
        }
    }, [isOpen, agentToEdit, agencyId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value, type } = e.target;
        setAgentData(prev => ({
            ...prev,
            [name]: type === 'number' ? Number(value) : value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalPassword = agentToEdit ? (password || undefined) : password;
        onSave(agentData, finalPassword);
        onClose();
    };

    const title = agentToEdit ? `Modifier l'Agent: ${agentToEdit.name}` : "Créer un Nouveau Compte Agent";

    return (
        <Modal
            id="create-edit-agent-modal"
            title={title}
            isOpen={isOpen}
            onClose={onClose}
            icon={<i className="fas fa-user-plus text-xl"></i>}
            footer={
                <>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
                    <button type="submit" form="create-edit-agent-form" className="btn btn-primary ml-auto">
                        <i className="fas fa-save mr-2"></i> Enregistrer
                    </button>
                </>
            }
        >
            <form id="create-edit-agent-form" onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="name" className="form-label">Nom complet</label>
                    <input type="text" id="name" name="name" className="form-input" value={agentData.name || ''} onChange={handleChange} required />
                </div>
                <div className="mb-4">
                    <label htmlFor="email" className="form-label">Adresse Email</label>
                    <input type="email" id="email" name="email" className="form-input" value={agentData.email || ''} onChange={handleChange} required disabled={!!agentToEdit} />
                </div>
                 <div className="mb-4">
                    <label htmlFor="solde" className="form-label">Solde initial</label>
                    <input type="number" id="solde" name="solde" className="form-input" value={agentData.solde || 0} onChange={handleChange} required />
                </div>
                <div className="mb-6">
                    <label htmlFor="password" className="form-label">{agentToEdit ? "Nouveau Mot de passe (optionnel)" : "Mot de passe"}</label>
                    <input type="password" id="password" className="form-input" value={password} onChange={(e) => setPassword(e.target.value)} required={!agentToEdit} />
                </div>
            </form>
        </Modal>
    );
};
