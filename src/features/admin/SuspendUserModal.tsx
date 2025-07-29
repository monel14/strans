
import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Agent, SousAdmin } from '../../types';

interface SuspendUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: Agent | SousAdmin | null;
    onConfirm: (user: Agent | SousAdmin, reason: string | null) => void;
}

export const SuspendUserModal: React.FC<SuspendUserModalProps> = ({ isOpen, onClose, user, onConfirm }) => {
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setReason('');
        }
    }, [isOpen]);

    if (!user) return null;

    const isSuspending = user.status === 'active';
    const title = isSuspending ? `Suspendre ${user.name}` : `Réactiver ${user.name}`;
    const icon = isSuspending ? <i className="fas fa-ban text-xl text-red-500"></i> : <i className="fas fa-check-circle text-xl text-green-500"></i>;
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(user, isSuspending ? reason : null);
        onClose();
    };

    return (
        <Modal
            id="suspend-user-modal"
            title={title}
            isOpen={isOpen}
            onClose={onClose}
            icon={icon}
            footer={
                <>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
                    <button type="submit" form="suspend-user-form" className={`btn ${isSuspending ? 'btn-danger' : 'btn-success'} ml-auto`}>
                        {isSuspending ? 'Confirmer la Suspension' : 'Confirmer la Réactivation'}
                    </button>
                </>
            }
        >
            <form id="suspend-user-form" onSubmit={handleSubmit}>
                <p className="mb-4">
                    {isSuspending 
                        ? `Êtes-vous sûr de vouloir suspendre le compte de ${user.name} ? L'utilisateur ne pourra plus se connecter.`
                        : `Êtes-vous sûr de vouloir réactiver le compte de ${user.name} ? L'utilisateur pourra de nouveau se connecter.`
                    }
                </p>

                {isSuspending && (
                    <div className="mb-6">
                        <label htmlFor="suspensionReason" className="form-label">Motif de la suspension (optionnel)</label>
                        <textarea
                            id="suspensionReason"
                            className="form-textarea"
                            rows={3}
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Ex: Violation des politiques de sécurité..."
                        ></textarea>
                    </div>
                )}
            </form>
        </Modal>
    );
};
