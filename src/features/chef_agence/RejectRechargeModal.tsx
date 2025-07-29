import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { AgentRechargeRequest } from '../../types';
import { formatAmount } from '../../utils/formatters';

interface RejectRechargeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (request: AgentRechargeRequest, reason: string) => void;
    request: AgentRechargeRequest | null;
}

export const RejectRechargeModal: React.FC<RejectRechargeModalProps> = ({ isOpen, onClose, onConfirm, request }) => {
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (!isOpen) setReason('');
    }, [isOpen]);

    if (!request) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(request, reason);
        onClose();
    };

    return (
        <Modal
            id="reject-recharge-modal"
            title={`Rejeter la demande de ${formatAmount(request.amount)}`}
            isOpen={isOpen}
            onClose={onClose}
            icon={<i className="fas fa-times-circle text-xl text-red-500"></i>}
            footer={
                <>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
                    <button type="submit" form="reject-recharge-form" className="btn btn-danger ml-auto">
                        <i className="fas fa-times-circle mr-2"></i>Confirmer le Rejet
                    </button>
                </>
            }
        >
            <form id="reject-recharge-form" onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="rejectionReason" className="form-label">Motif du rejet (obligatoire)</label>
                    <textarea
                        id="rejectionReason"
                        className="form-textarea"
                        rows={3}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Expliquez pourquoi la demande est rejetée..."
                        required
                    ></textarea>
                </div>
            </form>
        </Modal>
    );
};