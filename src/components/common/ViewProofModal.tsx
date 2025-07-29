
import React, { useEffect, useState } from 'react';
import { Modal } from './Modal';
import { supabase } from '../../supabaseClient';

interface ViewProofModalProps {
    isOpen: boolean;
    onClose: () => void;
    imageUrl: string | null;
}

export const ViewProofModal: React.FC<ViewProofModalProps> = ({ isOpen, onClose, imageUrl }) => {
    const [imageSrc, setImageSrc] = useState<string | null>(null);
    const [imageError, setImageError] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen && imageUrl) {
            setIsLoading(true);
            setImageError(false);
            setImageSrc(null);

            let objectUrl: string | null = null;

            const fetchImage = async () => {
                try {
                    const url = new URL(imageUrl);
                    const pathParts = url.pathname.split('/');
                    const publicIndex = pathParts.indexOf('public');
                    
                    if (publicIndex === -1 || publicIndex + 1 >= pathParts.length) {
                        throw new Error('Format d\'URL de stockage invalide');
                    }
                    
                    const bucketName = pathParts[publicIndex + 1];
                    const filePath = pathParts.slice(publicIndex + 2).join('/');
                    
                    if (!bucketName || !filePath) {
                        throw new Error('URL d\'image invalide ou chemin de fichier manquant.');
                    }
                    
                    const { data, error } = await supabase.storage
                        .from(bucketName)
                        .download(filePath);
                    
                    if (error) {
                        throw error;
                    }

                    if (data) {
                        objectUrl = URL.createObjectURL(data);
                        setImageSrc(objectUrl);
                    } else {
                        throw new Error('Aucune donnée d\'image reçue');
                    }

                } catch (error) {
                    console.error('Erreur de chargement de l\'image depuis Supabase Storage:', error);
                    setImageError(true);
                } finally {
                    setIsLoading(false);
                }
            };
            
            fetchImage();

            // Cleanup function
            return () => {
                if (objectUrl) {
                    URL.revokeObjectURL(objectUrl);
                }
            };
        }
    }, [isOpen, imageUrl]);

    return (
        <Modal
            id="view-proof-modal"
            title="Preuve de Transaction"
            isOpen={isOpen}
            onClose={onClose}
            size="md:max-w-4xl"
            icon={<i className="fas fa-image text-xl"></i>}
            footer={
                <div className="flex justify-between w-full">
                    <div className="text-xs text-gray-500 flex items-center">
                        {imageUrl && (
                            <span className="truncate max-w-md" title={imageUrl}>URL: {imageUrl}</span>
                        )}
                    </div>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Fermer</button>
                </div>
            }
        >
            <div className="relative min-h-[200px]">
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="ml-2 text-gray-600">Chargement de l'image...</span>
                    </div>
                )}
                
                {imageError && !isLoading && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                        <i className="fas fa-exclamation-triangle text-red-500 text-3xl mb-3"></i>
                        <h3 className="text-lg font-semibold text-red-700 mb-2">Image non accessible</h3>
                        <p className="text-red-600 mb-4">L'image ne peut pas être chargée. Vérifiez la configuration du stockage et les permissions (RLS).</p>
                        <div className="bg-gray-100 p-3 rounded text-xs text-left break-all">
                            <strong>URL:</strong> {imageUrl}
                        </div>
                        <div className="flex gap-2 mt-4 justify-center flex-col sm:flex-row">
                            <a 
                                href={imageUrl || '#'}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 inline-block"
                            >
                                Ouvrir dans un nouvel onglet
                            </a>
                            <div className="p-3 bg-yellow-100 text-yellow-800 text-sm rounded-lg text-left">
                                <p>
                                    <i className="fas fa-info-circle mr-2"></i>
                                    <strong>Pour l'administrateur :</strong> Assurez-vous que les politiques de sécurité (RLS) sur le bucket de stockage autorisent l'accès en lecture aux utilisateurs authentifiés.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
                
                {imageSrc && !isLoading && !imageError && (
                    <img 
                        src={imageSrc} 
                        alt="Preuve de transaction" 
                        className="w-full h-auto rounded-md max-h-[70vh] object-contain"
                    />
                )}
            </div>
        </Modal>
    );
};
