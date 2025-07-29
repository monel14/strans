import { useState, useEffect, useCallback } from 'react';

// Utility to convert File to a serializable object
const fileToSerializable = (file: File): Promise<{ name: string, type: string, dataUrl: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({
            name: file.name,
            type: file.type,
            dataUrl: reader.result as string,
        });
        reader.onerror = error => reject(error);
        reader.readAsDataURL(file);
    });
};

// Utility to convert a serializable object back to a File
const serializableToFile = (serializableFile: { name: string, type: string, dataUrl: string }): File => {
    const byteString = atob(serializableFile.dataUrl.split(',')[1]);
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
        ia[i] = byteString.charCodeAt(i);
    }
    const blob = new Blob([ab], { type: serializableFile.type });
    return new File([blob], serializableFile.name, { type: serializableFile.type });
};

interface UseStableFormStateOptions {
    resetOnClose?: boolean;
}

export const useStableFormState = (formId: string, isOpen: boolean, options: UseStableFormStateOptions = {}) => {
    const { resetOnClose = false } = options;
    const storageKey = `formState_${formId}`;

    // Initialisation robuste depuis localStorage
    const getInitialState = () => {
        try {
            const savedStateJSON = localStorage.getItem(storageKey);
            if (savedStateJSON) {
                const savedState = JSON.parse(savedStateJSON);
                return {
                    formData: savedState.formData || {},
                    proofFile: savedState.proofFile ? serializableToFile(savedState.proofFile) : null,
                    selectedOpTypeId: savedState.selectedOpTypeId || null
                };
            }
        } catch (e) {}
        return { formData: {}, proofFile: null, selectedOpTypeId: null };
    };
    const initial = getInitialState();
    const [formData, setFormData] = useState<Record<string, any>>(initial.formData);
    const [proofFile, setProofFile] = useState<File | null>(initial.proofFile);

    // DEBUG: log chaque fois que proofFile change
    useEffect(() => {
        if (proofFile) {
            // alert('proofFile changé: ' + proofFile.name + ' (' + proofFile.size + ' octets, type: ' + proofFile.type + ')');
            console.log('proofFile changé:', proofFile);
        }
    }, [proofFile]);
    const [proofFileDataUrl, setProofFileDataUrl] = useState<string | null>(
        initial.proofFile
            ? null // sera généré plus bas par le useEffect
            : null
    );

    // Récupération DataURL mobile à chaque ouverture du modal si pas de fichier
    useEffect(() => {
        if (isOpen && !proofFile) {
            try {
                const lastFile = localStorage.getItem('MOBILE_MODAL_LAST_FILE');
                if (lastFile) {
                    const parsed = JSON.parse(lastFile);
                    if (parsed && parsed.dataUrl) {
                        setProofFileDataUrl(parsed.dataUrl);
                    }
                }
            } catch (e) {}
        }
    }, [isOpen, proofFile]);
    const [isFormValid, setIsFormValid] = useState<boolean>(false);
    const [selectedOpTypeId, setSelectedOpTypeId] = useState<string | null>(initial.selectedOpTypeId);

    // Générer la DataURL pour l'aperçu à chaque changement de fichier
    useEffect(() => {
        if (proofFile) {
            const reader = new FileReader();
            reader.onload = () => {
                setProofFileDataUrl(reader.result as string);
                // DEBUG MOBILE
                // alert('DataURL générée: ' + (typeof reader.result === 'string' ? reader.result.substring(0, 40) + '...' : 'non string'));
                console.log('DataURL générée:', reader.result);
            };
            reader.readAsDataURL(proofFile);
        } else {
            setProofFileDataUrl(null);
        }
    }, [proofFile]);

    // Restore state from localStorage on open (pour forcer la synchro si storage change)
    useEffect(() => {
        if (isOpen) {
            try {
                const savedStateJSON = localStorage.getItem(storageKey);
                if (savedStateJSON) {
                    const savedState = JSON.parse(savedStateJSON);
                    setFormData(savedState.formData || {});
                    setSelectedOpTypeId(savedState.selectedOpTypeId || null);
                    if (savedState.proofFile) {
                        setProofFile(serializableToFile(savedState.proofFile));
                    }
                }
            } catch (error) {
                // Ne rien faire, l'init a déjà été tentée
            }
        }
    }, [isOpen, storageKey, formId]);

    // Save state to sessionStorage on change
    useEffect(() => {
        if (isOpen) {
            const saveState = async () => {
                try {
                    const serializableProofFile = proofFile ? await fileToSerializable(proofFile) : null;
                    const stateToSave = {
                        formData,
                        selectedOpTypeId,
                        proofFile: serializableProofFile,
                    };
                    localStorage.setItem(storageKey, JSON.stringify(stateToSave));
                } catch (error) {
                    console.error("Failed to save form state to localStorage", error);
                }
            };
            saveState();
        }
    }, [formData, proofFile, selectedOpTypeId, isOpen, storageKey]);
    
    // Clear state on close
    const clearFormState = useCallback(() => {
        setFormData({});
        setProofFile(null);
        setIsFormValid(false);
        setSelectedOpTypeId(null);
        localStorage.removeItem(storageKey);
        localStorage.removeItem('MOBILE_MODAL_LAST_FILE');
        console.log(`Cleared form state for ${formId}`);
    }, [storageKey, formId]);
    
    useEffect(() => {
        if (!isOpen && resetOnClose) {
            const timer = setTimeout(() => {
                clearFormState();
            }, 300); // Small delay to allow modal close animation
            return () => clearTimeout(timer);
        }
    }, [isOpen, resetOnClose, clearFormState]);
    
    const updateField = useCallback((fieldName: string, value: any) => {
        setFormData(prev => ({ ...prev, [fieldName]: value }));
    }, []);
    
    const preserveState = () => {
        // This function was part of a previous fix attempt.
        // With sessionStorage, it's no longer necessary as state is always preserved.
        // Kept as a no-op for API compatibility with components that might still call it.
    };

    return {
        formData,
        proofFile,
        proofFileDataUrl,
        isFormValid,
        selectedOpTypeId,
        setFormData,
        setProofFile,
        setIsFormValid,
        setSelectedOpTypeId,
        updateField,
        preserveState,
        clearFormState
    };
};
