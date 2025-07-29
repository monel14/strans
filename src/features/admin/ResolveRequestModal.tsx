import React, { useState } from 'react';
import { Request } from '../../types';
import { Modal } from '../../components/common/Modal';

interface ResolveRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: Request | null;
    onConfirm: (request: Request, response: string) => void;
}

export const ResolveRequestModal: React.FC<ResolveRequestModalProps> = ({
    isOpen,
    onClose,
    request,
    onConfirm
}) => {
    const [response, setResponse] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!request || !response.trim()) return;

        setIsSubmitting(true);
        try {
            await onConfirm(request, response.trim());
            setResponse('');
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setResponse('');
        onClose();
    };

    if (!request) return null;

    return (
        <Modal
            id="resolve-request-modal"
            title={`Résoudre la requête ${request.id.substring(0, 8)}...`}
            isOpen={isOpen}
            onClose={handleClose}
            size="md:max-w-2xl"
            icon={<i className="fas fa-check-circle text-xl text-green-500"></i>}
            footer={
                <>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleClose}
                        disabled={isSubmitting}
                    >
                        Annuler
                    </button>
                    <button
                        type="submit"
                        form="resolve-form"
                        className="btn btn-success ml-auto"
                        disabled={!response.trim() || isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Résolution...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-check mr-2"></i>
                                Marquer comme résolue
                            </>
                        )}
                    </button>
                </>
            }
        >
            <form id="resolve-form" onSubmit={handleSubmit}>
                {/* Informations de la requête */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
                    <h4 className="font-semibold text-gray-800 mb-2">{request.sujet}</h4>
                    <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium">Type:</span> {request.type}
                    </p>
                    <p className="text-sm text-gray-700">
                        <span className="font-medium">Description:</span> {request.description}
                    </p>
                </div>

                {/* Champ de réponse */}
                <div className="mb-4">
                    <label htmlFor="response" className="block text-sm font-medium text-gray-700 mb-2">
                        Réponse à la requête <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        id="response"
                        rows={6}
                        className="form-textarea w-full"
                        placeholder="Décrivez la solution apportée ou les actions effectuées..."
                        value={response}
                        onChange={(e) => setResponse(e.target.value)}
                        required
                    />
                    <p className="mt-1 text-xs text-gray-500">
                        Cette réponse sera visible par l'utilisateur qui a soumis la requête.
                    </p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start">
                        <i className="fas fa-info-circle text-blue-500 mt-0.5 mr-2"></i>
                        <div className="text-sm text-blue-700">
                            <p className="font-medium mb-1">Action à effectuer :</p>
                            <p>La requête sera marquée comme "Traité" et une notification sera envoyée à l'utilisateur.</p>
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    );
};