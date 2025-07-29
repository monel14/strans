import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { OperationType, Json } from '../types';
import { handleSupabaseError } from '../utils/errorUtils';
import { Database } from '../types/database.types';

export const useOperationTypes = () => {
    const [operationTypes, setOperationTypes] = useState<OperationType[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchOpTypes = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase.from('operation_types').select('id, name, description, impacts_balance, proof_is_required, status, fields, commission_config');
        
        if (error) {
            handleSupabaseError(error, "Chargement des types d'opérations");
            setOperationTypes([]);
        } else {
            const fetchedOpTypes: OperationType[] = (data || []).map((item: any) => ({
                ...item,
                fields: item.fields || [],
                commission_config: item.commission_config || { type: 'none' }
            }));
            setOperationTypes(fetchedOpTypes);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchOpTypes();
    }, [fetchOpTypes]);

    const saveOpType = async (opTypeData: OperationType) => {
        // The client-side OperationType is structurally compatible with an Insert/Update object,
        // but we must cast its complex fields to Json to satisfy TypeScript, preventing deep type errors.
        const dataToSave = {
            ...opTypeData,
            fields: opTypeData.fields as unknown as Json,
            commission_config: opTypeData.commission_config as unknown as Json,
        };
        const { error } = await supabase.from('operation_types').upsert(dataToSave as Database['public']['Tables']['operation_types']['Insert']);
        if (error) {
            handleSupabaseError(error, "Sauvegarde du type d'opération");
        } else {
            console.log("Type d'opération sauvegardé.");
            fetchOpTypes(); // Refetch
        }
    };

    const duplicateOpType = async (opTypeId: string) => {
        const opToDuplicate = operationTypes.find(op => op.id === opTypeId);
        if (!opToDuplicate) {
            console.warn("Type d'opération introuvable.");
            return;
        }
        const newOpType = {
            ...opToDuplicate,
            id: `op_copy_${Date.now()}`,
            name: `${opToDuplicate.name} (Copie)`,
        };
        await saveOpType(newOpType);
    };

    const toggleOpTypeStatus = async (opTypeId: string) => {
        const opToToggle = operationTypes.find(op => op.id === opTypeId);
        if (!opToToggle) {
            console.warn("Type d'opération introuvable.");
            return;
        }
        const statuses = ['active', 'inactive', 'archived'];
        const currentIndex = statuses.indexOf(opToToggle.status as string);
        const nextIndex = (currentIndex + 1) % statuses.length;
        const newStatus = statuses[nextIndex];

        const updatePayload: Database['public']['Tables']['operation_types']['Update'] = { status: newStatus };
        const { error } = await supabase
            .from('operation_types')
            .update(updatePayload)
            .eq('id', opTypeId);
        
        if (error) {
            handleSupabaseError(error, "Changement de statut du type d'opération");
        } else {
            console.log(`Statut changé à : ${newStatus}`);
            fetchOpTypes(); // Refetch
        }
    };

    return {
        operationTypes,
        loading,
        saveOpType,
        duplicateOpType,
        toggleOpTypeStatus,
        refetchOpTypes: fetchOpTypes
    };
};