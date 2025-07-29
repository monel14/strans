import React, { useState, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { checkStorageBuckets } from '../../utils/initializeStorage';

export const StorageSetup: React.FC = () => {
  const [bucketsStatus, setBucketsStatus] = useState<boolean | null>(null);
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    checkBucketsStatus();
  }, []);

  const checkBucketsStatus = async () => {
    setMessage('Vérification du statut des buckets...');
    const status = await checkStorageBuckets();
    setBucketsStatus(status);
    setMessage(status ? 'Les buckets sont configurés correctement.' : 'Configuration des buckets manquante ou incorrecte.');
    setTimeout(() => setMessage(''), 3000); // Clear message after 3 seconds
  };

  return (
    <Card title="Configuration du Stockage" icon="fa-database">
      <div className="space-y-6">
        {/* Statut des buckets */}
        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-3 flex items-center">
            <i className="fas fa-info-circle mr-2 text-blue-500"></i>
            Statut des Buckets de Stockage
          </h3>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Bucket 'proofs' (Preuves de transaction)</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                bucketsStatus === null 
                  ? 'bg-gray-100 text-gray-600' 
                  : bucketsStatus 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
              }`}>
                {bucketsStatus === null ? 'Vérification...' : bucketsStatus ? 'Configuré' : 'Manquant'}
              </span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Bucket 'attachments' (Pièces jointes)</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                bucketsStatus === null 
                  ? 'bg-gray-100 text-gray-600' 
                  : bucketsStatus 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
              }`}>
                {bucketsStatus === null ? 'Vérification...' : bucketsStatus ? 'Configuré' : 'Manquant'}
              </span>
            </div>
          </div>
        </div>

        {/* Message d'information */}
        {bucketsStatus === false && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start">
              <i className="fas fa-exclamation-triangle text-yellow-600 mr-3 mt-1"></i>
              <div>
                <h4 className="text-sm font-semibold text-yellow-800 mb-1">
                  Configuration requise
                </h4>
                <p className="text-sm text-yellow-700">
                  Les buckets de stockage Supabase ne sont pas configurés. Cela peut causer des erreurs lors de l'upload de fichiers (preuves de transaction, pièces jointes). Veuillez suivre les instructions ci-dessous.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Bouton d'initialisation */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            disabled={true}
            className={`flex-1 flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-all duration-200 cursor-not-allowed ${
              bucketsStatus === true
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-200 text-gray-500'
            }`}
          >
            {bucketsStatus === true ? (
              <>
                <i className="fas fa-check mr-2"></i>
                Buckets configurés
              </>
            ) : (
              <>
                <i className="fas fa-cog mr-2"></i>
                Initialisation Manuelle Requise
              </>
            )}
          </button>

          <button
            onClick={checkBucketsStatus}
            className="flex items-center justify-center px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-all duration-200"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            Vérifier le statut
          </button>
        </div>

        {/* Message de retour */}
        {message && (
          <div className={`p-3 rounded-lg text-sm ${
            message.includes('succès') || message.includes('correctement')
              ? 'bg-green-50 text-green-700 border border-green-200' 
              : message.includes('manquante')
                ? 'bg-red-50 text-red-700 border border-red-200'
                : 'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
            {message}
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">
            <i className="fas fa-lightbulb mr-2"></i>
            Instructions
          </h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• L'initialisation des buckets de stockage doit être effectuée via les migrations SQL dans votre projet Supabase.</li>
            <li>• Cette action ne peut pas être effectuée depuis l'interface client pour des raisons de sécurité.</li>
            <li>• Si le statut est "Manquant", veuillez exécuter les scripts de migration (par exemple, via l'éditeur SQL de Supabase).</li>
            <li>• Les buckets 'proofs' et 'attachments' doivent exister avec les politiques de sécurité (RLS) appropriées.</li>
          </ul>
        </div>
      </div>
    </Card>
  );
};