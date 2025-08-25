
import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Transaction } from '../../types';
import { formatAmount } from '../../utils/formatters';
import { formatShortId } from '../../utils/idFormatters';

interface RejectTransactionModalProps {
    isOpen: boolean;
    onClose: () => void;
    transaction: Transaction | null;
    onConfirm: (transaction: Transaction, reason: string) => void;
}

export const RejectTransactionModal: React.FC<RejectTransactionModalProps> = ({ isOpen, onClose, transaction, onConfirm }) => {
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setReason('');
            setError('');
        }
    }, [isOpen]);

    if (!transaction) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!reason.trim()) {
            setError('Le motif du rejet est obligatoire.');
            return;
        }
        onConfirm(transaction, reason);
        onClose();
    };

    return (
        <Modal
            id="reject-transaction-modal"
            title={`Rejeter la transaction ${formatShortId(transaction.id, 'transaction')}`}
            isOpen={isOpen}
            onClose={onClose}
            icon={<i className="fas fa-times-circle text-xl text-red-500"></i>}
            footer={
                <>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
                    <button type="submit" form="reject-tx-form" className="btn btn-danger ml-auto">
                         <i className="fas fa-times-circle mr-2"></i>Confirmer le Rejet
                    </button>
                </>
            }
        >
            <form id="reject-tx-form" onSubmit={handleSubmit}>
                <p className="mb-4">
                    Vous êtes sur le point de rejeter la transaction de <span className="font-bold">{formatAmount(transaction.montant_principal)}</span>.
                    Veuillez fournir un motif clair pour le rejet. Le montant total sera remboursé à l'agent.
                </p>

                <div className="mb-6">
                    <label htmlFor="rejectionReason" className="form-label">Motif du rejet</label>
                    <textarea
                        id="rejectionReason"
                        className="form-textarea"
                        rows={4}
                        value={reason}
                        onChange={(e) => {
                            setReason(e.target.value);
                            if (error) setError('');
                        }}
                        placeholder="Ex: Preuve de paiement illisible, informations bénéficiaire incorrectes..."
                        required
                    />
                    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                </div>
            </form>
        </Modal>
    );
};
