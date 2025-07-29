import { useState, useRef, useCallback, useEffect } from 'react';

interface UsePersistentFormStateOptions {
    onFormDataChange?: (data: Record<string, any>) => void;
    onFileChange?: (file: File | null) => void;
}

/**
 * Hook pour maintenir l'état du formulaire même en cas de re-render forcé
 * Utilise des refs pour persister les données et des états pour déclencher les re-renders
 */
export const usePersistentFormState = (isOpen: boolean, options: UsePersistentFormStateOptions = {}) => {
    // Refs pour persister les données (ne causent pas de re-render)
    const formDataRef = useRef<Record<string, any>>({});
    const proofFileRef = useRef<File | null>(null);
    const selectedOpTypeRef = useRef<any>(null);
    const isFormValidRef = useRef<boolean>(false);
    
    // États pour déclencher les re-renders quand nécessaire
    const [, forceUpdate] = useState({});
    const [formData, setFormDataState] = useState<Record<string, any>>({});
    const [proofFile, setProofFileState] = useState<File | null>(null);
    const [selectedOpType, setSelectedOpTypeState] = useState<any>(null);
    const [isFormValid, setIsFormValidState] = useState<boolean>(false);

    // Fonction pour forcer un re-render
    const triggerRerender = useCallback(() => {
        setFormDataState({ ...formDataRef.current });
        setProofFileState(proofFileRef.current);
        setSelectedOpTypeState(selectedOpTypeRef.current);
        setIsFormValidState(isFormValidRef.current);
        forceUpdate({});
    }, []);

    // Setters qui mettent à jour les refs ET les états
    const setFormData = useCallback((newData: Record<string, any> | ((prev: Record<string, any>) => Record<string, any>)) => {
        const updatedData = typeof newData === 'function' ? newData(formDataRef.current) : newData;
        
        console.log('📝 setFormData appelé:', Object.keys(updatedData));
        
        formDataRef.current = updatedData;
        setFormDataState(updatedData);
        
        options.onFormDataChange?.(updatedData);
    }, [options]);

    const setProofFile = useCallback((file: File | null) => {
        console.log('📁 setProofFile appelé:', file?.name || 'null');
        console.log('📋 FormData préservé:', Object.keys(formDataRef.current));
        
        proofFileRef.current = file;
        setProofFileState(file);
        
        options.onFileChange?.(file);
        
        // Force un re-render pour s'assurer que l'UI est à jour
        setTimeout(() => {
            triggerRerender();
        }, 50);
    }, [options, triggerRerender]);

    const setSelectedOpType = useCallback((opType: any) => {
        console.log('🔧 setSelectedOpType appelé:', opType?.name || 'null');
        
        selectedOpTypeRef.current = opType;
        setSelectedOpTypeState(opType);
    }, []);

    const setIsFormValid = useCallback((valid: boolean) => {
        isFormValidRef.current = valid;
        setIsFormValidState(valid);
    }, []);

    // Fonction pour mettre à jour un champ spécifique
    const updateField = useCallback((fieldName: string, value: any) => {
        console.log('🔄 updateField:', fieldName, value);
        
        const newData = { ...formDataRef.current, [fieldName]: value };
        formDataRef.current = newData;
        setFormDataState(newData);
        
        options.onFormDataChange?.(newData);
    }, [options]);

    // Fonction pour réinitialiser complètement
    const resetForm = useCallback(() => {
        console.log('🔄 resetForm appelé');
        
        formDataRef.current = {};
        proofFileRef.current = null;
        selectedOpTypeRef.current = null;
        isFormValidRef.current = false;
        
        setFormDataState({});
        setProofFileState(null);
        setSelectedOpTypeState(null);
        setIsFormValidState(false);
    }, []);

    // Fonction pour récupérer l'état actuel (toujours à jour)
    const getCurrentState = useCallback(() => {
        return {
            formData: formDataRef.current,
            proofFile: proofFileRef.current,
            selectedOpType: selectedOpTypeRef.current,
            isFormValid: isFormValidRef.current
        };
    }, []);

    // Fonction pour restaurer l'état depuis les refs
    const restoreFromRefs = useCallback(() => {
        console.log('🔄 Restauration depuis refs');
        
        setFormDataState({ ...formDataRef.current });
        setProofFileState(proofFileRef.current);
        setSelectedOpTypeState(selectedOpTypeRef.current);
        setIsFormValidState(isFormValidRef.current);
    }, []);

    // Gestion de l'ouverture/fermeture
    useEffect(() => {
        if (!isOpen) {
            // Délai plus long pour éviter la réinitialisation pendant l'upload
            const timer = setTimeout(() => {
                resetForm();
            }, 500);
            
            return () => clearTimeout(timer);
        } else {
            // Quand on ouvre, restaurer depuis les refs au cas où
            restoreFromRefs();
        }
    }, [isOpen, resetForm, restoreFromRefs]);

    // Protection contre les re-renders inattendus
    useEffect(() => {
        const interval = setInterval(() => {
            // Vérifier si l'état UI est synchronisé avec les refs
            const currentFormDataKeys = Object.keys(formData);
            const refFormDataKeys = Object.keys(formDataRef.current);
            
            if (currentFormDataKeys.length !== refFormDataKeys.length || 
                proofFile !== proofFileRef.current) {
                console.log('⚠️ Désynchronisation détectée, restauration...');
                restoreFromRefs();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [formData, proofFile, restoreFromRefs]);

    return {
        // États réactifs pour l'UI
        formData,
        proofFile,
        selectedOpType,
        isFormValid,
        
        // Setters persistants
        setFormData,
        setProofFile,
        setSelectedOpType,
        setIsFormValid,
        updateField,
        
        // Utilitaires
        resetForm,
        getCurrentState,
        restoreFromRefs,
        triggerRerender,
        
        // Refs pour accès direct
        formDataRef,
        proofFileRef,
        selectedOpTypeRef,
        isFormValidRef
    };
};

export default usePersistentFormState;