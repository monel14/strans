import React, { useRef, useState, useCallback } from 'react';

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
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [isDragOver, setIsDragOver] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Utiliser useCallback pour éviter les re-renders
    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        e.stopPropagation();

        setIsProcessing(true);

        setTimeout(() => {
            const files = e.target.files;
            if (files && files[0]) {
                // LOG DEBUG MOBILE
                // alert('Fichier sélectionné: ' + files[0].name + ' (' + files[0].size + ' octets, type: ' + files[0].type + ')');
                console.log('📁 Fichier sélectionné:', files[0].name, files[0].size, files[0].type, files[0]);
                // Sauvegarde DataURL dans localStorage pour le remount mobile
                const reader = new FileReader();
                reader.onload = () => {
                    try {
                        localStorage.setItem('MOBILE_MODAL_LAST_FILE', JSON.stringify({
                            name: files[0].name,
                            type: files[0].type,
                            dataUrl: reader.result
                        }));
                    } catch (e) {}
                    onFileSelect(files[0]);
                };
                reader.readAsDataURL(files[0]);
            } else {
                // alert('Aucun fichier sélectionné');
                onFileSelect(null);
            }
            setIsProcessing(false);
        }, 100);
    }, [onFileSelect]);

    const handleClick = useCallback((e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (disabled || isProcessing) return;
        
        // Sur mobile, ajouter un petit délai pour éviter les conflits
        setTimeout(() => {
            fileInputRef.current?.click();
        }, 50);
    }, [disabled, isProcessing]);

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

    return (
        <div className={`relative ${className}`}>
            {/* Input caché */}
            <input
                ref={fileInputRef}
                type="file"
                accept={accept}
                onChange={handleFileChange}
                className="hidden"
                required={required}
                disabled={disabled}
                // Empêcher la propagation des événements
                onClick={(e) => e.stopPropagation()}
            />

            {/* Zone de drop/click */}
            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
                    border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all duration-200
                    ${isDragOver 
                        ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-300 dark:border-gray-600 hover:border-blue-400'
                    }
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    ${isProcessing ? 'opacity-75' : ''}
                `}
            >
                {(currentFile || previewUrl || (() => {
                    try {
                        const lastFile = localStorage.getItem('MOBILE_MODAL_LAST_FILE');
                        if (lastFile) {
                            const parsed = JSON.parse(lastFile);
                            return !!parsed.dataUrl;
                        }
                    } catch (e) {}
                    return false;
                })()) ? (
                    // Fichier sélectionné, DataURL restaurée, ou DataURL locale
                    <div className="space-y-3">
                        <div className="flex flex-col items-center justify-center space-y-2">
                            {/* Aperçu image si possible */}
                            {(previewUrl ||
                                (() => {
                                    try {
                                        const lastFile = localStorage.getItem('MOBILE_MODAL_LAST_FILE');
                                        if (lastFile) {
                                            const parsed = JSON.parse(lastFile);
                                            return parsed.dataUrl;
                                        }
                                    } catch (e) {}
                                    return null;
                                })()
                            ) && (
                                <img
                                    src={previewUrl ||
                                        (() => {
                                            try {
                                                const lastFile = localStorage.getItem('MOBILE_MODAL_LAST_FILE');
                                                if (lastFile) {
                                                    const parsed = JSON.parse(lastFile);
                                                    return parsed.dataUrl;
                                                }
                                            } catch (e) {}
                                            return undefined;
                                        })()
                                    }
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