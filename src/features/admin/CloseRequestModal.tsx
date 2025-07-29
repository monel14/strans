import React, { useState } from 'react';
import { Request } from '../../types';
import { Modal } from '../../components/common/Modal';

interface CloseRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    request: Request | null;
    onConfirm: (request: Request, reason: string) => void;
}

export const CloseRequestModal: React.FC<CloseRequestModalProps> = ({
    isOpen,
    onClose,
    request,
    onConfirm
}) => {
    const [reason, setReason] = useState('');
    const [selectedReason, setSelectedReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const predefinedReasons = [
        'Demande non pertinente',
        'Informations insuffisantes',
        'Problème résolu par l\'utilisateur',
        'Demande en double',
        'Hors périmètre de support',
        'Autre (préciser ci-dessous)'
    ];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!request) return;

        const finalReason = selectedReason === 'Autre (préciser ci-dessous)' 
            ? reason.trim() 
            : selectedReason;

        if (!finalReason) return;

        setIsSubmitting(true);
        try {
            await onConfirm(request, finalReason);
            setReason('');
            setSelectedReason('');
            onClose();
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setReason('');
        setSelectedReason('');
        onClose();
    };

    if (!request) return null;

    return (
        <Modal
            id="close-request-modal"
            title={`Fermer la requête ${request.id.substring(0, 8)}...`}
            isOpen={isOpen}
            onClose={handleClose}
            size="md:max-w-2xl"
            icon={<i className="fas fa-times-circle text-xl text-red-500"></i>}
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
                        form="close-form"
                        className="btn btn-danger ml-auto"
                        disabled={!selectedReason || (selectedReason === 'Autre (préciser ci-dessous)' && !reason.trim()) || isSubmitting}
                    >
                        {isSubmitting ? (
                            <>
                                <i className="fas fa-spinner fa-spin mr-2"></i>
                                Fermeture...
                            </>
                        ) : (
                            <>
                                <i className="fas fa-times mr-2"></i>
                                Fermer la requête
                            </>
                        )}
                    </button>
                </>
            }
        >
            <form id="close-form" onSubmit={handleSubmit}>
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

                {/* Sélection du motif */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        Motif de fermeture <span className="text-red-500">*</span>
                    </label>
                    <div className="space-y-2">
                        {predefinedReasons.map((predefinedReason) => (
                            <label key={predefinedReason} className="flex items-start">
                                <input
                                    type="radio"
                                    name="closeReason"
                                    value={predefinedReason}
                                    checked={selectedReason === predefinedReason}
                                    onChange={(e) => setSelectedReason(e.target.value)}
                                    className="mt-1 mr-3"
                                />
                                <span className="text-sm text-gray-700">{predefinedReason}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Champ de texte libre si "Autre" est sélectionné */}
                {selectedReason === 'Autre (préciser ci-dessous)' && (
                    <div className="mb-4">
                        <label htmlFor="customReason" className="block text-sm font-medium text-gray-700 mb-2">
                            Précisez le motif
                        </label>
                        <textarea
                            id="customReason"
                            rows={3}
                            className="form-textarea w-full"
                            placeholder="Décrivez le motif de fermeture..."
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            required
                        />
                    </div>
                )}

                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-start">
                        <i className="fas fa-exclamation-triangle text-red-500 mt-0.5 mr-2"></i>
                        <div className="text-sm text-red-700">
                            <p className="font-medium mb-1">Attention :</p>
                            <p>La requête sera marquée comme "Fermée" et l'utilisateur sera notifié du motif de fermeture.</p>
                        </div>
                    </div>
                </div>
            </form>
        </Modal>
    );
};