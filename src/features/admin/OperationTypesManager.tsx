import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { handleSupabaseError } from '../../utils/errorUtils';
import { OperationType } from '../../types';
import { SectionLoader } from '../../components/common/Loader';
import { TestOperationTypesStatus } from './TestOperationTypesStatus';

interface OperationTypeStats {
    total_transactions: number;
    pending_transactions: number;
    completed_transactions: number;
    rejected_transactions: number;
    total_amount: number;
    last_transaction_date: string | null;
}

interface OperationTypeWithStats extends OperationType {
    stats?: OperationTypeStats;
    status_changed_at?: string;
    status_changed_by?: string;
    status_reason?: string;
}

export const OperationTypesManager: React.FC = () => {
    const [operationTypes, setOperationTypes] = useState<OperationTypeWithStats[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedType, setSelectedType] = useState<OperationTypeWithStats | null>(null);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [newStatus, setNewStatus] = useState<'active' | 'inactive' | 'archived'>('active');
    const [statusReason, setStatusReason] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchOperationTypes = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .rpc('get_operation_types_with_stats');

            if (error) {
                handleSupabaseError(error, "Chargement des types d'opération");
                return;
            }

            // Transformer les données pour correspondre à notre interface
            const typesWithStats = (data || []).map((type: any) => ({
                ...type,
                stats: {
                    total_transactions: type.total_transactions,
                    pending_transactions: type.pending_transactions,
                    completed_transactions: type.completed_transactions,
                    rejected_transactions: type.rejected_transactions,
                    total_amount: type.total_amount,
                    last_transaction_date: type.last_transaction_date
                },
                status_changed_by_name: type.status_changed_by_name
            }));

            setOperationTypes(typesWithStats);
        } catch (error) {
            console.error('Erreur lors du chargement:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOperationTypes();
    }, []);

    const getStatusBadge = (status: string) => {
        const badges = {
            active: 'bg-green-100 text-green-800 border-green-200',
            inactive: 'bg-yellow-100 text-yellow-800 border-yellow-200',
            archived: 'bg-gray-100 text-gray-800 border-gray-200'
        };

        const labels = {
            active: '🟢 Actif',
            inactive: '🟡 Inactif',
            archived: '⚫ Archivé'
        };

        return (
            <span className={`px-2 py-1 text-xs font-medium rounded-full border ${badges[status as keyof typeof badges] || badges.active}`}>
                {labels[status as keyof typeof labels] || status}
            </span>
        );
    };

    const handleStatusChange = async () => {
        if (!selectedType) return;

        setIsUpdating(true);
        try {
            const { data: currentUser } = await supabase.auth.getUser();
            
            const { data, error } = await supabase.rpc('change_operation_type_status', {
                op_type_id: selectedType.id,
                new_status: newStatus,
                reason: statusReason || null,
                changed_by: currentUser.user?.id || null
            });

            if (error) {
                handleSupabaseError(error, "Changement de statut");
                return;
            }

            if (data?.success) {
                // Afficher le message de succès
                alert(`✅ ${data.message}${data.warning ? `\n⚠️ ${data.warning}` : ''}`);
                
                // Recharger les données
                await fetchOperationTypes();
                setShowStatusModal(false);
                setSelectedType(null);
                setStatusReason('');
            } else {
                alert(`❌ ${data?.error || 'Erreur inconnue'}`);
            }
        } catch (error) {
            console.error('Erreur lors du changement de statut:', error);
            alert('❌ Erreur lors du changement de statut');
        } finally {
            setIsUpdating(false);
        }
    };

    const openStatusModal = (type: OperationTypeWithStats) => {
        setSelectedType(type);
        setNewStatus(type.status === 'active' ? 'inactive' : 'active');
        setShowStatusModal(true);
    };

    const canDelete = (type: OperationTypeWithStats) => {
        return type.stats?.total_transactions === 0;
    };

    const handleDelete = async (type: OperationTypeWithStats) => {
        if (!canDelete(type)) {
            alert('❌ Impossible de supprimer ce type d\'opération car il a des transactions associées.');
            return;
        }

        const confirmMessage = `Êtes-vous sûr de vouloir supprimer "${type.name}" ?\n\nCette action est irréversible et supprimera :\n- Le type d'opération\n- Tous les accès agences associés\n\nTapez "SUPPRIMER" pour confirmer :`;
        
        const userInput = prompt(confirmMessage);
        if (userInput !== 'SUPPRIMER') {
            return;
        }

        setIsUpdating(true);
        try {
            // Supprimer d'abord les accès agences
            const { error: accessError } = await supabase
                .from('agency_operation_access')
                .delete()
                .eq('op_type_id', type.id);

            if (accessError) {
                handleSupabaseError(accessError, "Suppression des accès agences");
                return;
            }

            // Puis supprimer le type d'opération
            const { error: deleteError } = await supabase
                .from('operation_types')
                .delete()
                .eq('id', type.id);

            if (deleteError) {
                handleSupabaseError(deleteError, "Suppression du type d'opération");
                return;
            }

            alert(`✅ Type d'opération "${type.name}" supprimé avec succès.`);
            await fetchOperationTypes();
        } catch (error) {
            console.error('Erreur lors de la suppression:', error);
            alert('❌ Erreur lors de la suppression');
        } finally {
            setIsUpdating(false);
        }
    };

    if (isLoading) {
        return <SectionLoader text="Chargement des types d'opération..." />;
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Gestion des Types d'Opération
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                    {operationTypes.length} types au total
                </div>
            </div>

            {/* Composant de test pour les développeurs */}
            <TestOperationTypesStatus />

            {/* Statistiques rapides */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="text-green-600 dark:text-green-400 text-sm font-medium">Types Actifs</div>
                    <div className="text-2xl font-bold text-green-700 dark:text-green-300">
                        {operationTypes.filter(t => t.status === 'active').length}
                    </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
                    <div className="text-yellow-600 dark:text-yellow-400 text-sm font-medium">Types Inactifs</div>
                    <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-300">
                        {operationTypes.filter(t => t.status === 'inactive').length}
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg">
                    <div className="text-gray-600 dark:text-gray-400 text-sm font-medium">Types Archivés</div>
                    <div className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                        {operationTypes.filter(t => t.status === 'archived').length}
                    </div>
                </div>
            </div>

            {/* Liste des types d'opération */}
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-gray-700">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Type d'Opération
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Statut
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Transactions
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Dernière Activité
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {operationTypes.map((type) => (
                                <tr key={type.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div>
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {type.name}
                                            </div>
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {type.description}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="space-y-1">
                                            {getStatusBadge(type.status)}
                                            {type.status_reason && (
                                                <div className="text-xs text-gray-500 dark:text-gray-400">
                                                    {type.status_reason}
                                                </div>
                                            )}
                                            {type.status_changed_by_name && (
                                                <div className="text-xs text-gray-400 dark:text-gray-500">
                                                    Par {type.status_changed_by_name}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        {type.stats ? (
                                            <div className="space-y-1">
                                                <div>Total: {type.stats.total_transactions}</div>
                                                {type.stats.pending_transactions > 0 && (
                                                    <div className="text-yellow-600">
                                                        En attente: {type.stats.pending_transactions}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-gray-400">Chargement...</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {type.stats?.last_transaction_date ? (
                                            new Date(type.stats.last_transaction_date).toLocaleDateString('fr-FR')
                                        ) : (
                                            'Aucune'
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                        <button
                                            onClick={() => openStatusModal(type)}
                                            className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                                        >
                                            Changer statut
                                        </button>
                                        {canDelete(type) && (
                                            <button
                                                onClick={() => handleDelete(type)}
                                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                            >
                                                Supprimer
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de changement de statut */}
            {showStatusModal && selectedType && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                            Changer le statut de "{selectedType.name}"
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nouveau statut
                                </label>
                                <select
                                    value={newStatus}
                                    onChange={(e) => setNewStatus(e.target.value as any)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                >
                                    <option value="active">🟢 Actif</option>
                                    <option value="inactive">🟡 Inactif (temporaire)</option>
                                    <option value="archived">⚫ Archivé (obsolète)</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Raison du changement (optionnel)
                                </label>
                                <textarea
                                    value={statusReason}
                                    onChange={(e) => setStatusReason(e.target.value)}
                                    placeholder="Ex: Maintenance, service obsolète, problème technique..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                                    rows={3}
                                />
                            </div>

                            {selectedType.stats && selectedType.stats.total_transactions > 0 && (
                                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-md">
                                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                        ⚠️ Ce type d'opération a {selectedType.stats.total_transactions} transactions associées.
                                        {selectedType.stats.pending_transactions > 0 && (
                                            <div className="mt-1">
                                                {selectedType.stats.pending_transactions} transactions sont encore en attente.
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end space-x-3 mt-6">
                            <button
                                onClick={() => {
                                    setShowStatusModal(false);
                                    setSelectedType(null);
                                    setStatusReason('');
                                }}
                                disabled={isUpdating}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md disabled:opacity-50"
                            >
                                Annuler
                            </button>
                            <button
                                onClick={handleStatusChange}
                                disabled={isUpdating}
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md disabled:opacity-50 flex items-center"
                            >
                                {isUpdating ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                        Mise à jour...
                                    </>
                                ) : (
                                    'Confirmer'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};