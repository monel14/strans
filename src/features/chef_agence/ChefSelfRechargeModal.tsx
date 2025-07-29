
import React, { useState } from 'react';
import { Modal } from '../../components/common/Modal';
import { ChefAgence } from '../../types';
import { formatAmount } from '../../utils/formatters';

interface ChefSelfRechargeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (amount: number) => void;
    currentUser: ChefAgence;
}

export const ChefSelfRechargeModal: React.FC<ChefSelfRechargeModalProps> = ({ isOpen, onClose, onSave, currentUser }) => {
    const [amount, setAmount] = useState<number | ''>('');
    const [error, setError] = useState('');

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setError('');
        if (value === '') {
            setAmount('');
            return;
        }
        const numValue = Number(value);
        if (numValue > 0) {
            setAmount(numValue);
        } else {
            setAmount(0);
        }
    };
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (typeof amount !== 'number' || amount <= 0) {
            setError('Veuillez saisir un montant valide.');
            return;
        }
        onSave(amount);
        setAmount('');
        onClose();
    };

    const balanceAfter = (typeof amount === 'number') ? (currentUser.solde || 0) + amount : currentUser.solde;

    return (
        <Modal
            id="chef-self-recharge-modal"
            title="Recharger mon Solde Opérationnel"
            isOpen={isOpen}
            onClose={onClose}
            icon={<i className="fas fa-funnel-dollar text-xl"></i>}
            footer={
                <>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
                    <button type="submit" form="chef-recharge-form" className="btn btn-primary ml-auto">
                        <i className="fas fa-check-circle mr-2"></i>Confirmer la Recharge
                    </button>
                </>
            }
        >
            <form id="chef-recharge-form" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                    <div className="p-3 bg-gray-100 rounded-lg">
                        <p className="text-sm text-gray-600">Solde Actuel</p>
                        <p className="text-lg font-bold text-gray-800">{formatAmount(currentUser.solde)}</p>
                    </div>
                    <div className="p-3 bg-green-100 rounded-lg">
                        <p className="text-sm text-green-700">Solde Après Recharge</p>
                        <p className="text-lg font-bold text-green-800">{formatAmount(balanceAfter)}</p>
                    </div>
                </div>

                <div className="mb-4">
                    <label htmlFor="rechargeAmount" className="form-label">Montant à recharger</label>
                    <input
                        type="number"
                        id="rechargeAmount"
                        className="form-input"
                        value={amount}
                        onChange={handleAmountChange}
                        placeholder="Ex: 500000"
                        required
                    />
                    {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                </div>
                <p className="text-xs text-gray-500 mb-6">Cette action est irréversible et sera enregistrée dans le journal d'audit.</p>
            </form>
        </Modal>
    );
};
