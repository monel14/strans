
import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Request, User } from '../../types';
import { formatDate } from '../../utils/formatters';
import { getBadgeClass } from '../../utils/uiHelpers';
import { supabase } from '../../supabaseClient';
import { handleSupabaseError } from '../../utils/errorUtils';

interface ProcessRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: Request | null;
    onSave: (requestId: string, response: string) => void;
}

export const ProcessRequestModal: React.FC<ProcessRequestModalProps> = ({ isOpen, onClose, request, onSave }) => {
    const [response, setResponse] = useState('');
    const [demandeur, setDemandeur] = useState<User | null>(null);

    useEffect(() => {
        if (!isOpen) {
            setResponse('');
            setDemandeur(null);
        } else if (request) {
            const fetchDemandeur = async () => {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('id, name')
                    .eq('id', request.demandeur_id)
                    .single();
                if(error) handleSupabaseError(error, "Chargement des détails du demandeur");
                else setDemandeur(data as unknown as User);
            };
            fetchDemandeur();
        }
    }, [isOpen, request]);

    if (!request) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(request.id, response);
        onClose();
    };

    return (
        <Modal
            id="process-request-modal"
            title={`Traitement de la Requête ${request.id.substring(0,8)}...`}
            isOpen={isOpen}
            onClose={onClose}
            size="md:max-w-4xl"
            icon={<i className="fas fa-headset text-xl"></i>}
            footer={
                <>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
                    <button type="submit" form="process-request-form" className="btn btn-primary ml-auto">
                        <i className="fas fa-check-circle mr-2"></i>Enregistrer et Marquer comme Résolu
                    </button>
                </>
            }
        >
            <form id="process-request-form" onSubmit={handleSubmit}>
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg mb-4 border dark:border-gray-700">
                    <h4 className="font-bold text-lg text-gray-800 dark:text-gray-100 mb-2">{request.sujet}</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 text-sm mb-3">
                        <p><strong>Demandeur:</strong> {demandeur?.name || 'Chargement...'}</p>
                        <p><strong>Date:</strong> {formatDate(request.created_at)}</p>
                        <p><strong>Type:</strong> <span className="badge badge-purple">{request.type}</span></p>
                        <p><strong>Statut Actuel:</strong> <span className={`badge ${getBadgeClass(request.status)}`}>{request.status}</span></p>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{request.description}</p>
                </div>

                <div className="mb-6">
                    <label htmlFor="requestResponse" className="form-label">Réponse de l'Administrateur</label>
                    <textarea
                        id="requestResponse"
                        className="form-textarea"
                        rows={5}
                        value={response}
                        onChange={e => setResponse(e.target.value)}
                        placeholder="Rédigez ici votre réponse détaillée à l'utilisateur..."
                        required
                    />
                     <p className="text-xs text-gray-500 mt-1">Cette réponse sera enregistrée et la requête sera marquée comme "Traitée".</p>
                </div>
            </form>
        </Modal>
    );
};
