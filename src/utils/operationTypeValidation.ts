import { supabase } from '../supabaseClient';

/**
 * Valide qu'un type d'opération est actif avant de permettre une transaction
 */
export const validateOperationTypeActive = async (opTypeId: string): Promise<{
    isValid: boolean;
    status: string;
    message: string;
}> => {
    try {
        const { data, error } = await supabase
            .rpc('get_operation_type_status', { op_type_id: opTypeId });

        if (error) {
            console.error('Erreur validation type opération:', error);
            return {
                isValid: false,
                status: 'error',
                message: 'Erreur lors de la validation du type d\'opération'
            };
        }

        const status = data as string;

        switch (status) {
            case 'active':
                return {
                    isValid: true,
                    status: 'active',
                    message: 'Type d\'opération valide'
                };
            case 'inactive':
                return {
                    isValid: false,
                    status: 'inactive',
                    message: 'Ce service est temporairement indisponible pour maintenance'
                };
            case 'archived':
                return {
                    isValid: false,
                    status: 'archived',
                    message: 'Ce service n\'est plus disponible'
                };
            case 'not_found':
                return {
                    isValid: false,
                    status: 'not_found',
                    message: 'Type d\'opération introuvable'
                };
            default:
                return {
                    isValid: false,
                    status: 'unknown',
                    message: 'Statut du service inconnu'
                };
        }
    } catch (error) {
        console.error('Erreur validation type opération:', error);
        return {
            isValid: false,
            status: 'error',
            message: 'Erreur lors de la validation'
        };
    }
};

/**
 * Hook pour valider un type d'opération en temps réel
 */
export const useOperationTypeValidation = () => {
    const validateBeforeSubmit = async (opTypeId: string): Promise<boolean> => {
        const validation = await validateOperationTypeActive(opTypeId);
        
        if (!validation.isValid) {
            alert(`❌ ${validation.message}`);
            return false;
        }
        
        return true;
    };

    return { validateBeforeSubmit };
};