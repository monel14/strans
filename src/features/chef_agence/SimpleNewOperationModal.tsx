import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal } from '../../components/common/Modal';
import { MobileFileUpload } from '../../components/common/MobileFileUpload';
import { useStableFormState } from '../../hooks/useStableFormState';
import { supabase } from '../../supabaseClient';
import { handleSupabaseError } from '../../utils/errorUtils';
import { OperationType, FormField, CommissionConfig, ChefAgence } from '../../types';

interface SimpleNewOperationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: { opTypeId: string; formData: Record<string, any>; proofFile: File | null }) => Promise<void>;
    user: ChefAgence;
}

export const SimpleNewOperationModal: React.FC<SimpleNewOperationModalProps> = ({
    isOpen,
    onClose,
    onSave,
    user
}) => {
    const [availableOpTypes, setAvailableOpTypes] = useState<OperationType[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
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
    } = useStableFormState(`chef_op_${user.id}`, isOpen, {
        resetOnClose: false
    });

    // Dériver selectedOpType de selectedOpTypeId
    const selectedOpType = availableOpTypes.find(op => op.id === selectedOpTypeId) || null;

    useEffect(() => {
        const fetchOpTypes = async () => {
            if (!user.agency_id) return;

            setIsLoading(true);
            try {
                const { data, error } = await supabase.rpc('get_available_op_types_for_agency', {
                    p_agency_id: user.agency_id,
                });

                if (error) {
                    handleSupabaseError(error, "Chargement des types d'opérations disponibles");
                } else {
                    const mappedData = (Array.isArray(data) ? data : []).map(op => ({
                        ...op,
                        fields: (op.fields as FormField[] | null) || [],
                        commission_config: (op.commission_config as CommissionConfig | null) || { type: 'none' }
                    }));
                    setAvailableOpTypes(mappedData as OperationType[]);
                }
            } catch (error) {
                console.error('Erreur lors du chargement des types d\'opérations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchOpTypes();
    }, [user.agency_id]);

    // Vérifier que le type sélectionné existe toujours après le chargement
    useEffect(() => {
        if (selectedOpTypeId && availableOpTypes.length > 0) {
            const typeExists = availableOpTypes.some(op => op.id === selectedOpTypeId);
            if (!typeExists) {
                console.log('Type d\'opération sélectionné n\'existe plus, réinitialisation');
                setSelectedOpTypeId(null);
                setFormData({});
                setProofFile(null);
            }
        }
    }, [selectedOpTypeId, availableOpTypes, setSelectedOpTypeId, setFormData, setProofFile]);

    useEffect(() => {
        if (!selectedOpType || !Array.isArray(selectedOpType.fields)) {
            setIsFormValid(false);
            return;
        }

        const requiredFields = selectedOpType.fields.filter((field: FormField) => field.required);
        const allRequiredFieldsFilled = requiredFields.every((field: FormField) =>
            formData[field.name] && formData[field.name] !== ''
        );

        // Correction : valide si File OU DataURL
        const isProofValid = !selectedOpType.proof_is_required || !!proofFile || !!proofFileDataUrl;
        
        // DEBUG MOBILE - Validation améliorée
        const mobileFileExists = (() => {
            try {
                const mobileFile = localStorage.getItem('MOBILE_MODAL_LAST_FILE');
                return !!(mobileFile && JSON.parse(mobileFile)?.dataUrl);
            } catch (e) {
                return false;
            }
        })();
        
        const enhancedProofValid = !selectedOpType.proof_is_required || 
                                   !!proofFile || 
                                   !!proofFileDataUrl || 
                                   mobileFileExists;
        
        const finalValid = allRequiredFieldsFilled && enhancedProofValid;
        
        console.log('🔍 MOBILE DEBUG - Validation:', {
            opType: selectedOpType.name,
            fieldsValid: allRequiredFieldsFilled,
            proofRequired: selectedOpType.proof_is_required,
            hasFile: !!proofFile,
            hasDataUrl: !!proofFileDataUrl,
            hasMobileFile: mobileFileExists,
            proofValid: enhancedProofValid,
            FINAL_VALID: finalValid,
            formData
        });
        
        setIsFormValid(finalValid);
    }, [selectedOpType, formData, proofFile, proofFileDataUrl, setIsFormValid]);

    const handleOpTypeChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
        const opTypeId = e.target.value;
        setSelectedOpTypeId(opTypeId || null);
        
        // Réinitialiser les données du formulaire quand on change de type
        if (opTypeId !== selectedOpTypeId) {
            setFormData({});
            setProofFile(null);
        }
    }, [selectedOpTypeId, setSelectedOpTypeId, setFormData, setProofFile]);

    const handleFieldChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        updateField(name, value);
    }, [updateField]);

    const handleFileSelect = useCallback((file: File | null) => {
        console.log('📁 Fichier sélectionné dans modal:', file?.name || 'null');
        // Préserver l'état du formulaire pendant l'upload
        preserveState();
        setProofFile(file);
    }, [setProofFile, preserveState]);

    const handleSubmit = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!isFormValid || !selectedOpType || isSubmitting) {
            return;
        }

        setIsSubmitting(true);

        // Fallback : convertir la DataURL en Blob si File absent
        let fileToSend: File | null = proofFile;
        
        // MOBILE DEBUG - État initial
        console.log('📁 MOBILE DEBUG - État fichiers:', {
            proofFile: !!proofFile,
            proofFileDataUrl: !!proofFileDataUrl,
            localStorage: !!localStorage.getItem('MOBILE_MODAL_LAST_FILE')
        });
        if (!fileToSend && proofFileDataUrl) {
            try {
                const arr = proofFileDataUrl.split(',');
                const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
                const bstr = atob(arr[1]);
                let n = bstr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bstr.charCodeAt(n);
                }
                fileToSend = new File([u8arr], 'preuve_mobile.png', { type: mime });
            } catch (e) {
                console.error('Erreur conversion proofFileDataUrl:', e);
                fileToSend = null;
            }
        }
        
        // MOBILE FIX - Fallback localStorage si toujours pas de fichier
        if (!fileToSend) {
            try {
                const mobileFileData = localStorage.getItem('MOBILE_MODAL_LAST_FILE');
                if (mobileFileData) {
                    const parsed = JSON.parse(mobileFileData);
                    if (parsed && parsed.dataUrl) {
                        const arr = parsed.dataUrl.split(',');
                        const mime = arr[0].match(/:(.*?);/)?.[1] || parsed.type || 'image/png';
                        const bstr = atob(arr[1]);
                        let n = bstr.length;
                        const u8arr = new Uint8Array(n);
                        while (n--) {
                            u8arr[n] = bstr.charCodeAt(n);
                        }
                        fileToSend = new File([u8arr], parsed.name || 'preuve_mobile.png', { type: mime });
                        console.log('📁 MOBILE SUCCESS - Fichier récupéré depuis localStorage:', fileToSend.name, fileToSend.size);
                    }
                }
            } catch (e) {
                console.error('Erreur récupération fichier mobile localStorage:', e);
            }
        }
        
        console.log('📁 MOBILE DEBUG - Fichier final à envoyer:', fileToSend ? {
            name: fileToSend.name,
            size: fileToSend.size,
            type: fileToSend.type
        } : 'null');

        try {
            await onSave({
                opTypeId: selectedOpType.id,
                formData,
                proofFile: fileToSend
            });
            clearFormState();
            onClose();
        } catch (error) {
            console.error('Erreur lors de la soumission:', error);
        } finally {
            setIsSubmitting(false);
        }
    }, [isFormValid, selectedOpType, isSubmitting, onSave, formData, proofFile, proofFileDataUrl, onClose, clearFormState]);

    const handleClose = useCallback(() => {
        if (!isSubmitting) {
            clearFormState();
            onClose();
        }
    }, [isSubmitting, onClose, clearFormState]);

    const { opFields, amountInput, currentAmount, balanceAfter } = useMemo(() => {
        const fields = selectedOpType?.fields || [];
        const amountField = fields.find((f: FormField) => f.name.includes('montant'));
        const amount = amountField ? Number(formData[amountField.name]) || 0 : 0;
        const balance = selectedOpType?.impacts_balance ? (user.solde ?? 0) - amount : (user.solde ?? 0);

        return {
            opFields: fields,
            amountInput: amountField,
            currentAmount: amount,
            balanceAfter: balance
        };
    }, [selectedOpType, formData, user.solde]);

    return (
        <Modal
            id="chef-new-operation-modal"
            title="Initier une nouvelle opération"
            isOpen={isOpen}
            onClose={handleClose}
            size="md:max-w-2xl"
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                        <span className="ml-2 text-gray-600">Chargement...</span>
                    </div>
                ) : (
                    <>
                        <div>
                            <label htmlFor="opType" className="form-label">
                                Type d'opération *
                            </label>
                            <select
                                id="opType"
                                value={selectedOpTypeId || ''}
                                onChange={handleOpTypeChange}
                                className="form-select"
                                required
                                disabled={isSubmitting}
                            >
                                <option value="">Sélectionnez un type d'opération</option>
                                {availableOpTypes.map(opType => (
                                    <option key={opType.id} value={opType.id}>
                                        {opType.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {selectedOpType && opFields.length > 0 && (
                            <div className="space-y-4">
                                <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                                    Informations de l'opération
                                </h3>
                                
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {opFields.map((field: FormField) => (
                                        <div key={field.name} className={field.name.includes('montant') ? 'sm:col-span-2' : ''}>
                                            <label htmlFor={field.name} className="form-label">
                                                {field.label} {field.required && '*'}
                                            </label>
                                            
                                            {field.type === 'select' ? (
                                                <select
                                                    id={field.name}
                                                    name={field.name}
                                                    value={formData[field.name] || ''}
                                                    onChange={handleFieldChange}
                                                    className="form-select"
                                                    required={field.required}
                                                    disabled={isSubmitting}
                                                >
                                                    <option value="">Sélectionnez...</option>
                                                    {field.options?.map(option => (
                                                        <option key={option} value={option}>
                                                            {option}
                                                        </option>
                                                    ))}
                                                </select>
                                            ) : (
                                                <input
                                                    type={field.type}
                                                    id={field.name}
                                                    name={field.name}
                                                    value={formData[field.name] || ''}
                                                    onChange={handleFieldChange}
                                                    className="form-input"
                                                    placeholder={field.placeholder}
                                                    required={field.required}
                                                    disabled={isSubmitting}
                                                    min={field.type === 'number' ? field.min : undefined}
                                                    max={field.type === 'number' ? field.max : undefined}
                                                />
                                            )}
                                        </div>
                                    ))}
                                </div>

                                {amountInput && selectedOpType.impacts_balance && (
                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                        <div className="flex justify-between items-center text-sm">
                                            <span>Solde actuel:</span>
                                            <span className="font-semibold">{user.solde?.toLocaleString()} XOF</span>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span>Montant de l'opération:</span>
                                            <span className="font-semibold">{currentAmount.toLocaleString()} XOF</span>
                                        </div>
                                        <hr className="my-2 border-blue-200 dark:border-blue-700" />
                                        <div className="flex justify-between items-center text-sm font-bold">
                                            <span>Solde après opération:</span>
                                            <span className={balanceAfter >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                {balanceAfter.toLocaleString()} XOF
                                            </span>
                                        </div>
                                        {balanceAfter < 0 && (
                                            <p className="text-red-600 text-xs mt-2">
                                                ⚠️ Solde insuffisant pour cette opération
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {selectedOpType && selectedOpType.proof_is_required && (
                            <div>
                                <label className="form-label">
                                    Preuve de paiement *
                                </label>
                                <MobileFileUpload
                                    onFileSelect={handleFileSelect}
                                    accept="image/*,application/pdf"
                                    required={selectedOpType.proof_is_required}
                                    currentFile={proofFile}
                                    previewUrl={proofFileDataUrl}
                                    disabled={isSubmitting}
                                    className="mt-2"
                                />
                            </div>
                        )}



                        <div className="flex flex-col sm:flex-row gap-3 pt-4">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={isSubmitting}
                                className="w-full sm:w-auto px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 order-2 sm:order-1"
                            >
                                Annuler
                            </button>
                            <button
                                type="button"
                                disabled={!isFormValid || isSubmitting || (selectedOpType?.impacts_balance && balanceAfter < 0)}
                                onClick={async (e) => {
                                    e.preventDefault();
                                    await handleSubmit(e as any);
                                }}
                                className={`w-full sm:w-auto flex-1 px-6 py-3 rounded-lg flex items-center justify-center order-1 sm:order-2 transition-all ${
                                    isFormValid && !isSubmitting && (!selectedOpType?.impacts_balance || balanceAfter >= 0)
                                        ? 'bg-green-600 text-white hover:bg-green-700 cursor-pointer'
                                        : 'bg-gray-400 text-gray-200 cursor-not-allowed opacity-50'
                                }`}
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Traitement...
                                    </>
                                ) : (
                                    '✅ Initier opération'
                                )}
                            </button>
                        </div>
                    </>
                )}
            </form>
        </Modal>
    );
};
