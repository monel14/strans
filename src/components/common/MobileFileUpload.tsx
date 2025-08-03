import React, { useRef, useState, useCallback, useEffect } from 'react';

interface MobileFileUploadProps {
    onFileSelect: (file: File | null) => void;
    accept?: string;
    required?: boolean;
    currentFile?: File | null;
    previewUrl?: string | null;
    className?: string;
    disabled?: boolean;
}

export const MobileFileUpload: React.FC<MobileFileUploadProps> = ({
    onFileSelect,
    accept = "image/*,application/pdf",
    required = false,
    currentFile = null,
    previewUrl = null,
    className = "",
    disabled = false
}) => {
    // Détecter si on est sur mobile - DOIT ÊTRE EN PREMIER
    const isMobile = typeof navigator !== 'undefined' && 
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [restoredPreview, setRestoredPreview] = useState<string | null>(null);
    const [clickAttempts, setClickAttempts] = useState(0);
    const [showFallback, setShowFallback] = useState(false);

    // Restaurer le fichier depuis localStorage après remount
    useEffect(() => {
        try {
            const stored = localStorage.getItem("MOBILE_MODAL_LAST_FILE");
            if (stored && !currentFile && !previewUrl) {
                const parsed = JSON.parse(stored);
                if (parsed?.dataUrl) {
                    console.log('📁 Restauration fichier depuis localStorage:', parsed.name);
                    setRestoredPreview(parsed.dataUrl);
                }
            }
        } catch (e) {
            console.error('Erreur restauration localStorage:', e);
        }
    }, [currentFile, previewUrl]);

    // Gestion du changement de fichier - VERSION ROBUSTE
    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        console.log("📁 handleFileChange déclenché, files:", e.target.files?.length || 0);
        
        const file = e.target.files?.[0];
        if (!file) {
            console.log("📁 Aucun fichier sélectionné");
            onFileSelect(null);
            return;
        }

        console.log("📁 Fichier sélectionné:", file.name, file.size, file.type);
        
        // Debug mobile
        if (isMobile) {
            console.log("📁 MOBILE - Traitement fichier:", {
                name: file.name,
                size: file.size,
                type: file.type,
                lastModified: file.lastModified
            });
        }
        
        setIsProcessing(true);

        const reader = new FileReader();
        reader.onload = () => {
            const fileData = {
                name: file.name,
                type: file.type,
                dataUrl: reader.result,
            };

            try {
                // Stockage pour mobile (persistence entre remounts)
                localStorage.setItem("MOBILE_MODAL_LAST_FILE", JSON.stringify(fileData));
                setRestoredPreview(null); // Clear restored preview
            } catch (e) {
                console.error('Erreur sauvegarde localStorage:', e);
            }

            // Réinitialiser les tentatives et cacher le fallback
            setClickAttempts(0);
            setShowFallback(false);

            // Action principale
            onFileSelect(file);
            setIsProcessing(false);
        };
        
        reader.onerror = () => {
            console.error('Erreur lecture fichier');
            setIsProcessing(false);
        };
        
        reader.readAsDataURL(file);
    }, [onFileSelect]);

    // Click handler ULTRA-ROBUSTE avec détection d'échec
    const handleClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (disabled || isProcessing) return;
        
        const newAttempts = clickAttempts + 1;
        setClickAttempts(newAttempts);
        
        console.log(`📁 Tentative ${newAttempts} de déclenchement sélection fichier`);
        
        // Après 3 tentatives échouées, montrer le fallback
        if (newAttempts >= 3 && isMobile) {
            console.log('📁 Activation du mode fallback après 3 tentatives');
            setShowFallback(true);
            return;
        }
        
        // Approche multiple pour mobile
        const triggerFileInput = () => {
            if (fileInputRef.current) {
                try {
                    // Méthode 1: Click direct
                    fileInputRef.current.click();
                    console.log('📁 Click direct réussi');
                    
                    // Détecter si le click a fonctionné (timeout pour vérifier)
                    setTimeout(() => {
                        if (!isProcessing && newAttempts >= 2) {
                            console.log('📁 Click semble avoir échoué, activation fallback');
                            setShowFallback(true);
                        }
                    }, 1000);
                    
                } catch (error) {
                    console.error('📁 Click direct échoué:', error);
                    
                    // Méthode 2: Dispatch event
                    try {
                        const event = new MouseEvent('click', {
                            view: window,
                            bubbles: true,
                            cancelable: true,
                        });
                        fileInputRef.current.dispatchEvent(event);
                        console.log('📁 Dispatch event réussi');
                    } catch (dispatchError) {
                        console.error('📁 Dispatch event échoué:', dispatchError);
                        if (isMobile) setShowFallback(true);
                    }
                }
            } else {
                console.error('📁 fileInputRef.current est null');
                if (isMobile) setShowFallback(true);
            }
        };
        
        // Essayer immédiatement puis avec délai
        triggerFileInput();
        setTimeout(triggerFileInput, 50);
        setTimeout(triggerFileInput, 150);
    }, [disabled, isProcessing, clickAttempts, isMobile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!disabled) {
            setIsDragOver(true);
        }
    }, [disabled]);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
        
        if (disabled || isProcessing) return;
        
        const files = e.dataTransfer.files;
        if (files && files[0]) {
            setIsProcessing(true);
            setTimeout(() => {
                onFileSelect(files[0]);
                setIsProcessing(false);
            }, 100);
        }
    }, [disabled, isProcessing, onFileSelect]);

    const removeFile = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (disabled) return;
        
        // Nettoyer localStorage et état
        try {
            localStorage.removeItem('MOBILE_MODAL_LAST_FILE');
        } catch (e) {}
        
        setRestoredPreview(null);
        onFileSelect(null);
        
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [disabled, onFileSelect]);

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    // Déterminer l'aperçu à afficher
    const displayPreview = previewUrl || restoredPreview;
    const hasFile = currentFile || displayPreview;

    return (
        <div className={`relative ${className}`}>
            {/* Input TOUJOURS présent dans le DOM - VERSION ULTRA-ROBUSTE */}
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                style={isMobile ? {
                    // Sur mobile: input visible mais transparent
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0,
                    cursor: 'pointer',
                    zIndex: 10
                } : { 
                    // Sur desktop: input caché
                    position: 'absolute', 
                    left: '-9999px',
                    opacity: 0,
                    pointerEvents: 'none'
                }}
                required={required}
                disabled={disabled}
                tabIndex={isMobile ? 0 : -1}
            />

            {/* Zone de drop/click avec fallback mobile */}
            <div
                onClick={!isMobile ? handleClick : undefined}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200
                    ${isDragOver 
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${isProcessing ? 'opacity-75' : ''}
                `}
            >
                {hasFile ? (
                    // Fichier sélectionné, DataURL restaurée, ou DataURL locale
                    <div className="space-y-3">
                        <div className="flex flex-col items-center justify-center space-y-2">
                            {/* Aperçu image si possible */}
                            {displayPreview && (
                                <img
                                    src={displayPreview}
                                    alt="Aperçu"
                                    className="max-h-32 max-w-full rounded shadow border"
                                    style={{ objectFit: 'contain' }}
                                />
                            )}
                            {currentFile && (
                                <div className="flex items-center justify-center space-x-2">
                                    <i className="fas fa-file-alt text-green-500 text-2xl"></i>
                                    <div className="text-left">
                                        <p className="font-medium text-gray-900 dark:text-gray-100 truncate max-w-48">
                                            {currentFile.name}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {formatFileSize(currentFile.size)}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                        {!disabled && (
                            <button
                                type="button"
                                onClick={removeFile}
                                className="inline-flex items-center px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm hover:bg-red-200 transition-colors"
                            >
                                <i className="fas fa-times mr-1"></i>
                                Supprimer
                            </button>
                        )}
                    </div>
                ) : (
                    // Zone de sélection
                    <div className="space-y-3">
                        {isProcessing ? (
                            <div className="flex items-center justify-center space-x-2">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                                <span className="text-sm text-gray-600">Traitement...</span>
                            </div>
                        ) : (
                            <>
                                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center mx-auto">
                                    <i className="fas fa-cloud-upload-alt text-blue-500 text-xl"></i>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 dark:text-gray-100">
                                        <span className="hidden sm:inline">Cliquez pour télécharger</span>
                                        <span className="sm:hidden">Télécharger un fichier</span>
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">
                                        <span className="hidden sm:inline">ou glissez-déposez votre fichier ici</span>
                                        <span className="sm:hidden">Images et PDF acceptés</span>
                                    </p>
                                    
                                    {/* Bouton fallback pour mobile */}
                                    {isMobile && (
                                        <div className="mt-3 space-y-2">
                                            <button
                                                type="button"
                                                onClick={handleClick}
                                                className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                                            >
                                                📁 Choisir un fichier
                                            </button>
                                            
                                            {showFallback && (
                                                <div className="text-xs text-orange-600 bg-orange-50 p-2 rounded">
                                                    ⚠️ Si le bouton ne fonctionne pas, utilisez l'input ci-dessous :
                                                    <input
                                                        type="file"
                                                        accept={accept}
                                                        onChange={handleFileChange}
                                                        className="block w-full mt-2 text-xs"
                                                        disabled={disabled}
                                                    />
                                                </div>
                                            )}
                                            
                                            {clickAttempts > 0 && !showFallback && (
                                                <div className="text-xs text-gray-500">
                                                    Tentative {clickAttempts}/3...
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    
                                    {required && (
                                        <p className="text-xs text-red-500 mt-1">
                                            * Fichier requis
                                        </p>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MobileFileUpload;