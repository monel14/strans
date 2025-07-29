
import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Agent, AgentRechargeRequest } from '../../types';
import { formatAmount, formatDate } from '../../utils/formatters';
import { getBadgeClass } from '../../utils/uiHelpers';
import { supabase } from '../../supabaseClient';
import { handleSupabaseError } from '../../utils/errorUtils';

interface RequestRechargeModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: Agent;
    onSave: (data: { amount: number, reason: string | null }) => void;
    rechargeHistory: AgentRechargeRequest[]; // This prop is kept for structure but we will fetch fresh data
}

export const RequestRechargeModal: React.FC<RequestRechargeModalProps> = ({ isOpen, onClose, user, onSave }) => {
    const [amount, setAmount] = useState<number | ''>('');
    const [reason, setReason] = useState('');
    const [history, setHistory] = useState<AgentRechargeRequest[]>([]);
    const [loadingHistory, setLoadingHistory] = useState(true);

    useEffect(() => {
        const fetchHistory = async () => {
            if (isOpen) {
                setLoadingHistory(true);
                const { data, error } = await supabase
                    .from('agent_recharge_requests')
                    .select('id, created_at, amount, status')
                    .eq('agent_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(5);

                if (error) {
                    handleSupabaseError(error, "Chargement de l'historique des recharges");
                } else {
                    setHistory((data as unknown as AgentRechargeRequest[]) || []);
                }
                setLoadingHistory(false);
            }
        };

        fetchHistory();

        if (!isOpen) {
            setAmount('');
            setReason('');
        }
    }, [isOpen, user.id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (typeof amount === 'number' && amount > 0) {
            onSave({ amount, reason });
            onClose();
        }
    };

    return (
        <Modal
            id="agent-request-recharge-modal"
            title="Demande de Recharge de Solde"
            isOpen={isOpen}
            onClose={onClose}
            icon={<i className="fas fa-wallet text-xl"></i>}
            footer={
                <>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
                    <button type="submit" form="recharge-request-form" className="btn btn-primary ml-auto">Envoyer la Demande</button>
                </>
            }
        >
            <form id="recharge-request-form" onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label className="form-label" htmlFor="rechargeAmount">Montant Souhaité</label>
                    <input
                        type="number"
                        id="rechargeAmount"
                        className="form-input"
                        value={amount}
                        onChange={e => setAmount(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Entrez le montant en XOF"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label className="form-label" htmlFor="rechargeReason">Motif/Commentaire (Optionnel)</label>
                    <textarea
                        id="rechargeReason"
                        className="form-textarea"
                        rows={3}
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        placeholder="Une brève justification..."
                    ></textarea>
                </div>
                <div className="mt-6">
                    <h4 className="text-md font-semibold mb-2 text-gray-700 dark:text-gray-200">Historique de vos 5 dernières demandes</h4>
                    <div className="max-h-48 overflow-y-auto border rounded-lg dark:border-gray-700">
                        <table className="w-full table table-sm">
                            <thead className="bg-gray-50 dark:bg-gray-900/50">
                                <tr>
                                    <th>Date</th>
                                    <th>Montant</th>
                                    <th>Statut</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loadingHistory ? (
                                    <tr><td colSpan={3} className="text-center text-gray-500 py-4">Chargement...</td></tr>
                                ) : history.length > 0 ? (
                                    history.map(req => (
                                        <tr key={req.id}>
                                            <td>{formatDate(req.created_at).split(' ')[0]}</td>
                                            <td>{formatAmount(req.amount)}</td>
                                            <td><span className={`badge ${getBadgeClass(req.status)}`}>{req.status}</span></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr><td colSpan={3} className="text-center text-gray-500 py-4">Aucune demande d'historique.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </form>
        </Modal>
    );
};
