import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { useAgencySuspension, AgencyStatusDetails } from '../../hooks/useAgencySuspension';

interface AgencySuspensionModalProps {
  isOpen: boolean;
  onClose: () => void;
  agencyId: string;
  agencyName: string;
  currentStatus: 'active' | 'suspended';
  onSuccess: () => void;
}

export const AgencySuspensionModal: React.FC<AgencySuspensionModalProps> = ({
  isOpen,
  onClose,
  agencyId,
  agencyName,
  currentStatus,
  onSuccess
}) => {
  const {
    loading,
    error,
    toggleAgencyStatus,
    getAgencyStatusDetails,
    getActionLabel,
    getStatusIcon,
    clearError
  } = useAgencySuspension();

  const [reason, setReason] = useState('');
  const [agencyDetails, setAgencyDetails] = useState<AgencyStatusDetails | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const isSuspending = currentStatus === 'active';
  const actionLabel = getActionLabel(currentStatus);
  const actionIcon = getStatusIcon(currentStatus === 'active' ? 'suspended' : 'active');

  // Charger les détails de l'agence quand le modal s'ouvre
  useEffect(() => {
    if (isOpen && agencyId) {
      loadAgencyDetails();
      clearError();
      setReason('');
      setShowConfirmation(false);
    }
  }, [isOpen, agencyId]);

  const loadAgencyDetails = async () => {
    const details = await getAgencyStatusDetails(agencyId);
    setAgencyDetails(details);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reason.trim()) {
      alert('Veuillez fournir une raison pour cette action.');
      return;
    }

    setShowConfirmation(true);
  };

  const handleConfirm = async () => {
    const result = await toggleAgencyStatus(agencyId, currentStatus, reason);
    
    if (result.success) {
      alert(result.message);
      onSuccess();
      onClose();
    } else {
      alert(`Erreur: ${result.message}`);
    }
  };

  const handleCancel = () => {
    setShowConfirmation(false);
    setReason('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal
      id="agency-suspension-modal"
      title={`${actionLabel} l'agence`}
      isOpen={isOpen}
      onClose={handleCancel}
      icon={<i className={`fas ${actionIcon} text-xl ${isSuspending ? 'text-red-500' : 'text-green-500'}`}></i>}
      footer={
        !showConfirmation ? (
          <>
            <button type="button" className="btn btn-secondary" onClick={handleCancel}>
              Annuler
            </button>
            <button 
              type="submit" 
              form="suspension-form" 
              className={`btn ${isSuspending ? 'btn-danger' : 'btn-success'} ml-auto`}
              disabled={loading}
            >
              <i className={`fas ${loading ? 'fa-spinner fa-spin' : actionIcon} mr-2`}></i>
              {loading ? 'Traitement...' : actionLabel}
            </button>
          </>
        ) : (
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setShowConfirmation(false)}>
              Retour
            </button>
            <button 
              type="button" 
              className={`btn ${isSuspending ? 'btn-danger' : 'btn-success'} ml-auto`}
              onClick={handleConfirm}
              disabled={loading}
            >
              <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-check'} mr-2`}></i>
              {loading ? 'Traitement...' : 'Confirmer'}
            </button>
          </>
        )
      }
    >
      {!showConfirmation ? (
        <form id="suspension-form" onSubmit={handleSubmit}>
          {/* Informations de l'agence */}
          <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
              Informations de l'agence
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Nom:</span>
                <span className="font-medium">{agencyName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Statut actuel:</span>
                <span className={`font-medium ${currentStatus === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                  <i className={`fas ${currentStatus === 'active' ? 'fa-check-circle' : 'fa-pause-circle'} mr-1`}></i>
                  {currentStatus === 'active' ? 'Active' : 'Suspendue'}
                </span>
              </div>
              {agencyDetails && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Membres totaux:</span>
                    <span className="font-medium">{agencyDetails.total_members}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Membres actifs:</span>
                    <span className="font-medium text-green-600">{agencyDetails.active_members}</span>
                  </div>
                  {agencyDetails.suspended_members > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Membres suspendus:</span>
                      <span className="font-medium text-red-600">{agencyDetails.suspended_members}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Avertissement */}
          <div className={`mb-4 p-4 rounded-lg border-l-4 ${
            isSuspending 
              ? 'bg-red-50 border-red-400 text-red-700 dark:bg-red-900/20 dark:text-red-300' 
              : 'bg-green-50 border-green-400 text-green-700 dark:bg-green-900/20 dark:text-green-300'
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                <i className={`fas ${isSuspending ? 'fa-exclamation-triangle' : 'fa-info-circle'} text-lg`}></i>
              </div>
              <div className="ml-3">
                <h4 className="font-medium mb-2">
                  {isSuspending ? 'Attention - Suspension d\'agence' : 'Réactivation d\'agence'}
                </h4>
                <div className="text-sm">
                  {isSuspending ? (
                    <ul className="list-disc list-inside space-y-1">
                      <li>Tous les membres de l'agence seront automatiquement suspendus</li>
                      <li>Aucune opération ne pourra être effectuée par cette agence</li>
                      <li>L'accès aux services sera bloqué pour tous les membres</li>
                      <li>Cette action peut être annulée en réactivant l'agence</li>
                    </ul>
                  ) : (
                    <ul className="list-disc list-inside space-y-1">
                      <li>Tous les membres suspendus seront automatiquement réactivés</li>
                      <li>L'agence pourra reprendre ses opérations normalement</li>
                      <li>L'accès aux services sera restauré pour tous les membres</li>
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Raison */}
          <div className="mb-4">
            <label htmlFor="reason" className="form-label">
              Raison de {isSuspending ? 'la suspension' : 'la réactivation'} *
            </label>
            <textarea
              id="reason"
              className="form-input"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Expliquez pourquoi vous ${isSuspending ? 'suspendez' : 'réactivez'} cette agence...`}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Cette raison sera enregistrée dans l'historique d'audit.
            </p>
          </div>

          {/* Erreur */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
              <i className="fas fa-exclamation-circle mr-2"></i>
              {error}
            </div>
          )}
        </form>
      ) : (
        /* Confirmation */
        <div className="text-center">
          <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${
            isSuspending ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'
          } mb-4`}>
            <i className={`fas ${actionIcon} text-xl`}></i>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            Confirmer {isSuspending ? 'la suspension' : 'la réactivation'}
          </h3>
          
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <p className="mb-2">
              Vous êtes sur le point de <strong>{actionLabel.toLowerCase()}</strong> l'agence :
            </p>
            <p className="font-medium text-gray-800 dark:text-gray-200">"{agencyName}"</p>
            {agencyDetails && (
              <p className="mt-2">
                Cela affectera <strong>{agencyDetails.total_members} membre(s)</strong> de l'agence.
              </p>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Raison :</p>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-200">"{reason}"</p>
          </div>

          <p className="text-xs text-gray-500">
            Cette action sera enregistrée dans l'historique d'audit.
          </p>
        </div>
      )}
    </Modal>
  );
};