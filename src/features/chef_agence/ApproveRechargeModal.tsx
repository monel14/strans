import React from 'react';
import { Modal } from '../../components/common/Modal';
import { AgentRechargeRequest, Agent, ChefAgence } from '../../types';
import { formatAmount } from '../../utils/formatters';

interface ApproveRechargeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (request: AgentRechargeRequest) => void;
    request: AgentRechargeRequest | null;
    agent: Agent | null;
    chef: ChefAgence | null;
}

export const ApproveRechargeModal: React.FC<ApproveRechargeModalProps> = ({ isOpen, onClose, onConfirm, request, agent, chef }) => {
    if (!isOpen || !request || !agent || !chef) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onConfirm(request);
        onClose();
    };

    const chefBalanceAfter = (chef.solde ?? 0) - request.amount;
    const agentBalanceAfter = (agent.solde ?? 0) + request.amount;
    const isBalanceSufficient = chefBalanceAfter >= 0;

    return (
        <Modal 
            id="approve-recharge-modal" 
            title={`Approuver la demande de ${agent.name}`} 
            isOpen={isOpen} 
            onClose={onClose}
            icon={<i className="fas fa-check-circle text-xl text-green-500"></i>}
            footer={
                <>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
                    <button 
                        type="submit" 
                        form="approve-recharge-form"
                        className="btn btn-success ml-auto"
                        disabled={!isBalanceSufficient}
                    >
                        <i className="fas fa-check-circle mr-2"></i>Confirmer l'Approbation
                    </button>
                </>
            }
        >
            <form id="approve-recharge-form" onSubmit={handleSubmit}>
                <p className="text-lg text-center mb-4">
                    Confirmez-vous l'approbation de la recharge de <span className="font-bold text-blue-600">{formatAmount(request.amount)}</span> ?
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                    <div className="p-3 bg-gray-100 rounded-lg">
                        <p className="text-sm text-gray-600">Votre Solde</p>
                        <p className="text-lg font-bold text-gray-800">{formatAmount(chef.solde)}</p>
                    </div>
                     <div className="p-3 bg-gray-100 rounded-lg">
                        <p className="text-sm text-gray-600">Solde de l'agent</p>
                        <p className="text-lg font-bold text-gray-800">{formatAmount(agent.solde)}</p>
                    </div>
                     <div className={`p-3 rounded-lg ${isBalanceSufficient ? 'bg-red-100' : 'bg-red-200 border-2 border-red-500'}`}>
                        <p className={`text-sm ${isBalanceSufficient ? 'text-red-700' : 'text-red-800 font-bold'}`}>Votre Solde (Après)</p>
                        <p className={`text-lg font-bold ${isBalanceSufficient ? 'text-red-800' : 'text-red-900'}`}>{formatAmount(chefBalanceAfter)}</p>
                    </div>
                     <div className="p-3 bg-green-100 rounded-lg">
                        <p className="text-sm text-green-700">Solde Agent (Après)</p>
                        <p className="text-lg font-bold text-green-800">{formatAmount(agentBalanceAfter)}</p>
                    </div>
                </div>
                
                {!isBalanceSufficient && (
                    <div className="p-3 bg-red-100 border-l-4 border-red-500 text-red-800 rounded-md mb-4">
                        <p className="font-bold">Attention: Votre solde est insuffisant pour approuver cette demande.</p>
                    </div>
                )}
            </form>
        </Modal>
    );
};