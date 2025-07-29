import React, { useState, useCallback } from 'react';
import { Agent } from '../types';
import { NewOperationModal } from '../features/agent/NewOperationModal';
import { RequestRechargeModal } from '../features/agent/RequestRechargeModal';
import { supabase } from '../supabaseClient';
import { handleSupabaseError } from '../utils/errorUtils';
import { uploadFile, validateFile } from '../utils/storageUtils';
import { Database } from '../types/database.types';

export const useAgentActions = (
    currentUser: Agent | null, 
    onActionSuccess: () => void
) => {
    const [isNewOperationModalOpen, setNewOperationModalOpen] = useState(false);
    const [isRechargeModalOpen, setRechargeModalOpen] = useState(false);

    const handleSaveNewOperation = useCallback(async (opData: { opTypeId: string, formData: Record<string, any>, proofFile: File | null }) => {
        if (!currentUser) return;
        
        let proofUrl: string | null = null;
        if (opData.proofFile) {
            const validation = validateFile(opData.proofFile);
            if (!validation.valid) {
                handleSupabaseError({ message: validation.error } as any, "Validation du fichier");
                throw new Error(validation.error); // Throw to stop execution and show error in modal
            }

            const uploadResult = await uploadFile('proofs', opData.proofFile, currentUser.id);
            if (!uploadResult.success) {
                handleSupabaseError({ message: uploadResult.error } as any, "Téléversement de la preuve");
                throw new Error(uploadResult.error); // Throw to stop execution
            }
            proofUrl = uploadResult.url!;
        }

        const { error } = await supabase.rpc('create_secure_transaction', { p_agent_id: currentUser.id, p_op_type_id: opData.opTypeId, p_data: opData.formData, p_proof_url: proofUrl });
        
        if (error) {
            handleSupabaseError(error, "Création d'une nouvelle transaction");
            throw error; // Propagate error
        } else {
            console.log('Transaction soumise !');
            setNewOperationModalOpen(false);
            onActionSuccess();
        }
    }, [currentUser, onActionSuccess]);

    const handleRequestRecharge = useCallback(async (data: { amount: number, reason: string | null }) => {
        if (!currentUser || !currentUser.agency_id) {
            handleSupabaseError({ message: "Vous n'êtes assigné à aucune agence." } as any, "Demande de recharge");
            return;
        }

        const { data: agencyData, error: agencyError } = await supabase.from('agencies').select('chef_id').eq('id', currentUser.agency_id).single();
        if (agencyError || !agencyData) {
            handleSupabaseError(agencyError, "Recherche du chef de votre agence");
            return;
        }
        
        const chefId = (agencyData as any).chef_id;
        if (!chefId) {
            handleSupabaseError({ message: "Votre agence n'a pas de chef assigné. Impossible de faire une demande." } as any, "Demande de recharge");
            return;
        }

        const newRequest: Database['public']['Tables']['agent_recharge_requests']['Insert'] = { 
            agent_id: currentUser.id, 
            chef_agence_id: chefId, 
            amount: data.amount, 
            motif: data.reason 
        };
        const { error } = await supabase.from('agent_recharge_requests').insert([newRequest] as any);
        
        if (error) {
            handleSupabaseError(error, "Envoi de la demande de recharge");
        } else {
            console.log('Demande de recharge envoyée.');
            setRechargeModalOpen(false);
            onActionSuccess();
        }
    }, [currentUser, onActionSuccess]);

    const AgentModals: React.FC = useCallback(() => {
        if (!currentUser) return null;
        return (
            <>
                <NewOperationModal
                    isOpen={isNewOperationModalOpen}
                    onClose={() => setNewOperationModalOpen(false)}
                    user={currentUser}
                    onSave={handleSaveNewOperation}
                />
                <RequestRechargeModal
                    isOpen={isRechargeModalOpen}
                    onClose={() => setRechargeModalOpen(false)}
                    user={currentUser}
                    onSave={handleRequestRecharge}
                    rechargeHistory={[]}
                />
            </>
        );
    }, [currentUser, isNewOperationModalOpen, isRechargeModalOpen, handleSaveNewOperation, handleRequestRecharge]);


    return {
        openNewOperationModal: () => setNewOperationModalOpen(true),
        openRechargeModal: () => setRechargeModalOpen(true),
        AgentModals,
    };
};