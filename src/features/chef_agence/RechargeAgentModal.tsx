
import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Agent, ChefAgence } from '../../types';
import { formatAmount } from '../../utils/formatters';

interface RechargeAgentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (agentId: string, amount: number) => void;
    agent: Agent | null;
    chef: ChefAgence | null;
}

export const RechargeAgentModal: React.FC<RechargeAgentModalProps> = ({ isOpen, onClose, onConfirm, agent, chef }) => {
    const [amount, setAmount] = useState<number | ''>('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) {
            setAmount('');
            setError('');
        }
    }, [isOpen]);

    if (!agent || !chef) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (typeof amount !== 'number' || amount <= 0) {
            setError('Veuillez saisir un montant valide.');
            return;
        }
        if (amount > (chef.solde || 0)) {
            setError('Votre solde est insuffisant pour cette opération.');
            return;
        }
        onConfirm(agent.id, amount);
        onClose();
    };

    const chefBalanceAfter = typeof amount === 'number' ? (chef.solde || 0) - amount : (chef.solde || 0);
    const agentBalanceAfter = typeof amount === 'number' ? (agent.solde || 0) + amount : (agent.solde || 0);

    return (
        <Modal
            id="recharge-agent-modal"
            title={`Recharger le solde de ${agent.name}`}
            isOpen={isOpen}
            onClose={onClose}
            icon={<i className="fas fa-wallet text-xl"></i>}
            footer={
                <>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
                    <button type="submit" form="recharge-agent-form" className="btn btn-primary ml-auto">
                        <i className="fas fa-check-circle mr-2"></i>Confirmer
                    </button>
                </>
            }
        >
            <form id="recharge-agent-form" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                    <div className="p-3 bg-gray-100 rounded-lg">
                        <p className="text-sm text-gray-600">Votre Solde</p>
                        <p className="text-lg font-bold text-gray-800">{formatAmount(chef.solde)}</p>
                    </div>
                     <div className="p-3 bg-gray-100 rounded-lg">
                        <p className="text-sm text-gray-600">Solde de l'agent</p>
                        <p className="text-lg font-bold text-gray-800">{formatAmount(agent.solde)}</p>
                    </div>
                     <div className="p-3 bg-red-100 rounded-lg">
                        <p className="text-sm text-red-700">Votre Solde (Après)</p>
                        <p className="text-lg font-bold text-red-800">{formatAmount(chefBalanceAfter)}</p>
                    </div>
                     <div className="p-3 bg-green-100 rounded-lg">
                        <p className="text-sm text-green-700">Solde Agent (Après)</p>
                        <p className="text-lg font-bold text-green-800">{formatAmount(agentBalanceAfter)}</p>
                    </div>
                </div>

                <div className="mb-4">
                    <label htmlFor="rechargeAmountAgent" className="form-label">Montant à recharger</label>
                    <input
                        type="number"
                        id="rechargeAmountAgent"
                        className="form-input"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Ex: 50000"
                        required
                    />
                    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                </div>
            </form>
        </Modal>
    );
};
