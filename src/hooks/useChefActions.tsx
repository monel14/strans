import React, { useState, useCallback } from 'react';
import { ChefAgence, Agent, AgentRechargeRequest } from '../types';
import { supabase } from '../supabaseClient';
import { handleSupabaseError } from '../utils/errorUtils';
import { uploadFile, validateFile } from '../utils/storageUtils';
import { Database } from '../types/database.types';

import { SimpleNewOperationModal } from '../features/chef_agence/SimpleNewOperationModal';
import { RechargeAgentModal } from '../features/chef_agence/RechargeAgentModal';
import { ApproveRechargeModal } from '../features/chef_agence/ApproveRechargeModal';
import { RejectRechargeModal } from '../features/chef_agence/RejectRechargeModal';
import { ChefSelfRechargeModal } from '../features/chef_agence/ChefSelfRechargeModal';
import { TransferCommissionsModal } from '../features/chef_agence/TransferCommissionsModal';

export const useChefActions = (
    currentUser: ChefAgence | null,
    onActionSuccess: () => void
) => {
    const [modalState, setModalState] = useState<{ type: string; data?: any } | null>(null);

    const closeModal = () => setModalState(null);

    const openModal = (type: string, data?: any) => setModalState({ type, data });

    const handleSaveNewOperation = useCallback(async (opData: { opTypeId: string, formData: Record<string, any>, proofFile: File | null }) => {
        if (!currentUser) return;
        
        let proofUrl: string | null = null;
        if (opData.proofFile) {
            const validation = validateFile(opData.proofFile);
            if (!validation.valid) {
                handleSupabaseError({ message: validation.error } as any, "Validation du fichier");
                return;
            }

            const uploadResult = await uploadFile('proofs', opData.proofFile, currentUser.id);
            if (!uploadResult.success) {
                handleSupabaseError({ message: uploadResult.error } as any, "Téléversement de la preuve");
                return;
            }
            proofUrl = uploadResult.url!;
        }

        const { error } = await supabase.rpc('create_secure_transaction', { p_agent_id: currentUser.id, p_op_type_id: opData.opTypeId, p_data: opData.formData, p_proof_url: proofUrl });
        
        if (error) {
            handleSupabaseError(error, "Création d'une nouvelle transaction");
        } else {
            console.log('Transaction soumise !');
            closeModal();
            onActionSuccess();
        }
    }, [currentUser, onActionSuccess]);
    
    const handleRechargeAgent = useCallback(async (agentId: string, amount: number) => {
        if (!currentUser) return;
        const { error } = await supabase.rpc('direct_recharge_agent', { p_agent_id: agentId, p_chef_id: currentUser.id, p_recharge_amount: amount });
        if (error) {
            handleSupabaseError(error, "Recharge directe d'un agent");
        } else {
            console.log("Recharge effectuée.");
            closeModal();
            onActionSuccess();
        }
    }, [currentUser, onActionSuccess]);

    const handleApproveRecharge = useCallback(async (request: AgentRechargeRequest) => {
        if (!currentUser) return;
        const { error } = await supabase.rpc('approve_agent_recharge', { p_request_id: request.id, p_approving_chef_id: currentUser.id });
        if (error) {
            handleSupabaseError(error, "Approbation de la demande de recharge");
        } else {
            console.log("Demande de recharge approuvée.");
            closeModal();
            onActionSuccess();
        }
    }, [currentUser, onActionSuccess]);

    const handleRejectRecharge = useCallback(async (request: AgentRechargeRequest, reason: string) => {
        const update: Database['public']['Tables']['agent_recharge_requests']['Update'] = { status: 'Rejetée', rejection_reason: reason, processing_date: new Date().toISOString() };
        const { error } = await supabase.from('agent_recharge_requests').update(update).eq('id', request.id);
        if (error) {
            handleSupabaseError(error, "Rejet de la demande de recharge");
        } else {
            console.log("Demande rejetée.");
            closeModal();
            onActionSuccess();
        }
    }, [onActionSuccess]);
    
    const handleChefSelfRecharge = useCallback(async (amount: number) => {
        if (!currentUser) return;
        const update: Database['public']['Tables']['profiles']['Update'] = { solde: (currentUser.solde || 0) + amount };
        const { error } = await supabase.from('profiles').update(update).eq('id', currentUser.id);

        if (error) {
            handleSupabaseError(error, "Recharge du solde personnel");
        } else {
            console.log("Solde rechargé.");
            closeModal();
            onActionSuccess();
        }
    }, [currentUser, onActionSuccess]);
    
    const handleTransferCommissions = useCallback(async (amount: number) => {
        if (!currentUser) return;
        const { error } = await supabase.rpc('transfer_commissions_to_balance', { p_user_id: currentUser.id, p_amount: amount });
        if (error) {
            handleSupabaseError(error, "Virement des commissions");
        } else {
            console.log("Virement effectué !");
            closeModal();
            onActionSuccess();
        }
    }, [currentUser, onActionSuccess]);
    
    const ChefModals: React.FC = useCallback(() => {
        if (!currentUser) return null;
        
        return (
            <>
                <SimpleNewOperationModal 
                    isOpen={modalState?.type === 'openNewOperationModal'} 
                    onClose={closeModal} 
                    user={currentUser} 
                    onSave={handleSaveNewOperation} 
                />
                <RechargeAgentModal 
                    isOpen={modalState?.type === 'openRechargeAgentModal'} 
                    onClose={closeModal} 
                    agent={modalState?.data as Agent | null} 
                    chef={currentUser} 
                    onConfirm={handleRechargeAgent} 
                />
                <ApproveRechargeModal 
                    isOpen={modalState?.type === 'openApproveRechargeModal'}
                    onClose={closeModal} 
                    request={modalState?.data?.request as AgentRechargeRequest | null} 
                    agent={modalState?.data?.agent as Agent | null} 
                    chef={currentUser} 
                    onConfirm={handleApproveRecharge} 
                />
                <RejectRechargeModal 
                    isOpen={modalState?.type === 'openRejectRechargeModal'} 
                    onClose={closeModal} 
                    request={modalState?.data as AgentRechargeRequest | null} 
                    onConfirm={(request, reason) => handleRejectRecharge(request, reason)} 
                />
                <ChefSelfRechargeModal 
                    isOpen={modalState?.type === 'openSelfRechargeModal'} 
                    onClose={closeModal} 
                    currentUser={currentUser} 
                    onSave={handleChefSelfRecharge} 
                />
                <TransferCommissionsModal 
                    isOpen={modalState?.type === 'openTransferCommissionsModal'} 
                    onClose={closeModal} 
                    chef={currentUser} 
                    onConfirm={handleTransferCommissions} 
                />
            </>
        );
    }, [currentUser, modalState, handleSaveNewOperation, handleRechargeAgent, handleApproveRecharge, handleRejectRecharge, handleChefSelfRecharge, handleTransferCommissions]);

    return {
        openNewOperationModal: () => openModal('openNewOperationModal'),
        openRechargeAgentModal: (agent: Agent) => openModal('openRechargeAgentModal', agent),
        openApproveRechargeModal: (data: {request: AgentRechargeRequest, agent: Agent}) => openModal('openApproveRechargeModal', data),
        openRejectRechargeModal: (request: AgentRechargeRequest) => openModal('openRejectRechargeModal', request),
        openSelfRechargeModal: () => openModal('openSelfRechargeModal'),
        openTransferCommissionsModal: () => openModal('openTransferCommissionsModal'),
        ChefModals
    };
};