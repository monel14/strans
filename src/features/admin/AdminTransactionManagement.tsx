import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageComponentProps, Transaction, OperationType, User } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Pagination } from '../../components/common/Pagination';
import { formatDate, formatAmount } from '../../utils/formatters';
import { getBadgeClass } from '../../utils/uiHelpers';
import { supabase } from '../../supabaseClient';
import { handleSupabaseError } from '../../utils/errorUtils';
import { useAdminQueue } from '../../hooks/useAdminQueue';
import { RejectTransactionModal } from './RejectTransactionModal';
import { PageLoader } from '../../components/common/Loader';
import { Modal } from '../../components/common/Modal';

const getOperationIcon = (opTypeId: string): string => {
    if (opTypeId.includes('transfert')) return 'fa-exchange-alt';
    if (opTypeId.includes('sde') || opTypeId.includes('facture')) return 'fa-file-invoice-dollar';
    if (opTypeId.includes('reabo') || opTypeId.includes('canal')) return 'fa-tv';
    if (opTypeId.includes('woyofal')) return 'fa-lightbulb';
    return 'fa-receipt';
};

type MainTabKey = 'validation' | 'history';
type ValidationTabKey = 'unassigned' | 'assigned_to_me' | 'all_pending';

export const AdminTransactionManagement: React.FC<PageComponentProps> = ({ user, refreshKey, openModal }) => {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [mainTab, setMainTab] = useState<MainTabKey>('validation');
    const [validationTab, setValidationTab] = useState<ValidationTabKey>('unassigned');
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({ 
        status: 'all', 
        searchTerm: '', 
        startDate: '', 
        endDate: '',
        opType: 'all'
    });
    
    // Related data
    const [users, setUsers] = useState<Record<string, User>>({});
    const [agencies, setAgencies] = useState<Record<string, { name: string }>>({});
    const [opTypes, setOpTypes] = useState<Record<string, OperationType>>({});

    const [isRejectModalOpen, setRejectModalOpen] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isConfirmValidateModalOpen, setConfirmValidateModalOpen] = useState(false);
    const [itemToValidate, setItemToValidate] = useState<Transaction | null>(null);
    
    const ITEMS_PER_PAGE = 10;

    const fetchTransactions = useCallback(async () => {
        setLoading(true);
        
        let query = supabase.from('transactions').select('*');
        
        if (mainTab === 'validation') {
            // Pour la validation, on récupère les transactions en attente
            const pendingStatuses = [
                'En attente de validation', 'Assignée (validation en cours)',
                'en_attente_validation', 'assigné_validation_en_cours'
            ];
            query = query.in('status', pendingStatuses);
        }
        // Pour l'historique, on récupère toutes les transactions
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) {
            handleSupabaseError(error, "Chargement des transactions");
            setTransactions([]);
        } else {
            console.log(`Transactions ${mainTab} trouvées:`, data?.length || 0);
            setTransactions((data as unknown as Transaction[]) || []);
        }
        setLoading(false);
    }, [mainTab]);

    const { updateTransactionStatus, assignTask } = useAdminQueue(user, fetchTransactions);

    const fetchRelatedData = useCallback(async () => {
        const [profilesRes, agenciesRes, opTypesRes] = await Promise.all([
            supabase.from('profiles').select('id, name, role, agency_id'),
            supabase.from('agencies').select('id, name'),
            supabase.from('operation_types').select('*')
        ]);

        if (!profilesRes.error) {
            const userMap = (profilesRes.data || []).reduce((acc, p) => {
                acc[p.id] = p as User;
                return acc;
            }, {} as Record<string, User>);
            setUsers(userMap);
        }

        if (!agenciesRes.error) {
            const agencyMap = (agenciesRes.data || []).reduce((acc, a) => {
                acc[a.id] = { name: a.name };
                return acc;
            }, {} as Record<string, { name: string }>);
            setAgencies(agencyMap);
        }

        if (!opTypesRes.error) {
            const opTypeMap = (opTypesRes.data || []).reduce((acc, o) => {
                acc[o.id] = o as OperationType;
                return acc;
            }, {} as Record<string, OperationType>);
            setOpTypes(opTypeMap);
        }
    }, []);

    useEffect(() => {
        fetchTransactions();
        fetchRelatedData();
    }, [fetchTransactions, fetchRelatedData, refreshKey]);

    useEffect(() => {
        // Recharger les données quand on change d'onglet principal
        fetchTransactions();
        setCurrentPage(1);
    }, [mainTab, fetchTransactions]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setCurrentPage(1);
    };

    const filteredTransactions = useMemo(() => {
        let filtered = transactions;

        // Filtre par sous-onglet de validation
        if (mainTab === 'validation') {
            switch (validationTab) {
                case 'unassigned':
                    filtered = filtered.filter(t => !t.assigned_to);
                    break;
                case 'assigned_to_me':
                    filtered = filtered.filter(t => t.assigned_to === user.id);
                    break;
                case 'all_pending':
                    // Toutes les transactions en attente
                    break;
            }
        }

        // Autres filtres
        if (filters.status !== 'all') {
            filtered = filtered.filter(t => t.status === filters.status);
        }

        if (filters.opType !== 'all') {
            filtered = filtered.filter(t => t.op_type_id === filters.opType);
        }

        if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            filtered = filtered.filter(t => {
                const opType = opTypes[t.op_type_id];
                const agent = users[t.agent_id];
                return (
                    t.id.toLowerCase().includes(searchLower) ||
                    opType?.name.toLowerCase().includes(searchLower) ||
                    agent?.name.toLowerCase().includes(searchLower)
                );
            });
        }

        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            filtered = filtered.filter(t => new Date(t.created_at) >= startDate);
        }

        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(t => new Date(t.created_at) <= endDate);
        }

        return filtered;
    }, [transactions, mainTab, validationTab, filters, user.id, opTypes, users]);

    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredTransactions, currentPage]);

    const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);

    const handleTransactionAction = (action: string, transaction: Transaction) => {
        switch (action) {
            case 'assign-self':
                assignTask({ id: transaction.id, type: 'transactions', targetUserId: user.id });
                break;
            case 'unassign':
                assignTask({ id: transaction.id, type: 'transactions', targetUserId: null });
                break;
            case 'validate':
                setItemToValidate(transaction);
                setConfirmValidateModalOpen(true);
                break;
            case 'reject':
                setSelectedTransaction(transaction);
                setRejectModalOpen(true);
                break;
        }
    };

    const handleConfirmValidate = () => {
        if (itemToValidate) {
            updateTransactionStatus(itemToValidate.id, 'Validé');
            setItemToValidate(null);
            setConfirmValidateModalOpen(false);
        }
    };

    const getStatistics = () => {
        if (mainTab === 'validation') {
            const unassigned = transactions.filter(t => !t.assigned_to).length;
            const assignedToMe = transactions.filter(t => t.assigned_to === user.id).length;
            const total = transactions.length;
            return { unassigned, assignedToMe, total, validated: 0 };
        } else {
            const validated = transactions.filter(t => t.status === 'Validé' || t.status === 'validé').length;
            const rejected = transactions.filter(t => t.status === 'Rejeté' || t.status === 'rejeté').length;
            const pending = transactions.filter(t => 
                t.status === 'En attente de validation' || 
                t.status === 'en_attente_validation' ||
                t.status === 'Assignée (validation en cours)' ||
                t.status === 'assigné_validation_en_cours'
            ).length;
            const total = transactions.length;
            return { validated, rejected, pending, total };
        }
    };

    const stats = getStatistics();

    if (loading) {
        return <PageLoader text="Chargement des transactions..." />;
    }

    return (
        <>
            <PageHeader
                title="Validations"
                subtitle="Centre unifié pour la validation et l'historique des transactions"
                icon="fa-cogs"
                gradient="from-blue-500 to-purple-600"
            />

            <Card title="Centre de Gestion" icon="fa-tasks">
                {/* Onglets principaux */}
                <div className="tabs mb-6">
                    <button 
                        onClick={() => setMainTab('validation')} 
                        className={mainTab === 'validation' ? 'active' : ''}
                    >
                        <i className="fas fa-check-circle mr-2"></i>
                        Validation ({stats.total})
                    </button>
                    <button 
                        onClick={() => setMainTab('history')} 
                        className={mainTab === 'history' ? 'active' : ''}
                    >
                        <i className="fas fa-history mr-2"></i>
                        Historique Complet
                    </button>
                </div>

                {/* Statistiques dynamiques */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                    {mainTab === 'validation' ? (
                        <>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">{stats.unassigned}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">Non assignées</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{stats.assignedToMe}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">Mes tâches</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{stats.total}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">En attente</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-600">{filteredTransactions.length}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">Affichées</div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{stats.validated}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">Validées</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">Rejetées</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">En attente</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">Total</div>
                            </div>
                        </>
                    )}
                </div>

                {/* Sous-onglets pour la validation */}
                {mainTab === 'validation' && (
                    <div className="tabs mb-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-1">
                        <button 
                            onClick={() => { setValidationTab('unassigned'); setCurrentPage(1); }} 
                            className={validationTab === 'unassigned' ? 'active' : ''}
                        >
                            <i className="fas fa-exclamation-triangle mr-2"></i>
                            Non assignées ({stats.unassigned})
                        </button>
                        <button 
                            onClick={() => { setValidationTab('assigned_to_me'); setCurrentPage(1); }} 
                            className={validationTab === 'assigned_to_me' ? 'active' : ''}
                        >
                            <i className="fas fa-user-check mr-2"></i>
                            Mes tâches ({stats.assignedToMe})
                        </button>
                        <button 
                            onClick={() => { setValidationTab('all_pending'); setCurrentPage(1); }} 
                            className={validationTab === 'all_pending' ? 'active' : ''}
                        >
                            <i className="fas fa-list mr-2"></i>
                            Toutes ({stats.total})
                        </button>
                    </div>
                )}

                {/* Filtres et recherche */}
                <div className="mb-6 space-y-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                <input
                                    type="text"
                                    name="searchTerm"
                                    placeholder="Rechercher par ID, type, agent..."
                                    className="form-input pl-10"
                                    value={filters.searchTerm}
                                    onChange={handleFilterChange}
                                />
                            </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                            <select
                                name="status"
                                className="form-select form-select-sm min-w-[140px]"
                                value={filters.status}
                                onChange={handleFilterChange}
                            >
                                <option value="all">Tous les statuts</option>
                                {mainTab === 'validation' ? (
                                    <>
                                        <option value="En attente de validation">En attente</option>
                                        <option value="Assignée (validation en cours)">En cours</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="Validé">Validé</option>
                                        <option value="Rejeté">Rejeté</option>
                                        <option value="En attente de validation">En attente</option>
                                    </>
                                )}
                            </select>

                            <select
                                name="opType"
                                className="form-select form-select-sm min-w-[160px]"
                                value={filters.opType}
                                onChange={handleFilterChange}
                            >
                                <option value="all">Tous les types</option>
                                {Object.values(opTypes).map(opType => (
                                    <option key={opType.id} value={opType.id}>{opType.name}</option>
                                ))}
                            </select>
                            
                            <input
                                type="date"
                                name="startDate"
                                className="form-input form-input-sm"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                title="Date de début"
                            />
                            
                            <input
                                type="date"
                                name="endDate"
                                className="form-input form-input-sm"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                title="Date de fin"
                            />
                        </div>
                    </div>
                </div>

                {/* Liste des transactions */}
                {filteredTransactions.length === 0 ? (
                    <div className="text-center py-12">
                        <i className={`fas ${mainTab === 'validation' ? 'fa-check-circle text-green-300' : 'fa-history text-blue-300'} text-4xl mb-4`}></i>
                        <p className="text-gray-500 mb-2">
                            {mainTab === 'validation' ? 'Aucune transaction à valider' : 'Aucune transaction dans l\'historique'}
                        </p>
                        {(filters.searchTerm || filters.status !== 'all' || filters.opType !== 'all') && (
                            <button
                                onClick={() => setFilters({ status: 'all', searchTerm: '', startDate: '', endDate: '', opType: 'all' })}
                                className="text-blue-500 hover:underline text-sm"
                            >
                                Réinitialiser les filtres
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {paginatedTransactions.map(transaction => {
                                const opType = opTypes[transaction.op_type_id];
                                const agent = users[transaction.agent_id];
                                const agency = agent?.agency_id ? agencies[agent.agency_id] : null;
                                const assignedUser = transaction.assigned_to ? users[transaction.assigned_to] : null;
                                const validator = transaction.validateur_id ? users[transaction.validateur_id] : null;
                                
                                return (
                                    <div key={transaction.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <div className={`px-3 py-2 border-l-4 ${
                                            transaction.status === 'Validé' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                                            transaction.status === 'Rejeté' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                                            !transaction.assigned_to ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 
                                            transaction.assigned_to === user.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 
                                            'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
                                        }`}>
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center space-x-2">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                                        transaction.status === 'Validé' ? 'bg-green-100 text-green-600' :
                                                        transaction.status === 'Rejeté' ? 'bg-red-100 text-red-600' :
                                                        !transaction.assigned_to ? 'bg-orange-100 text-orange-600' : 
                                                        transaction.assigned_to === user.id ? 'bg-blue-100 text-blue-600' : 
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        <i className={`fas ${getOperationIcon(transaction.op_type_id)} text-xs`}></i>
                                                    </div>
                                                    <div className="min-w-0 flex-1">
                                                        <div className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                                                            {opType?.name || 'Type inconnu'}
                                                        </div>
                                                        <div className="text-xs text-gray-500">
                                                            #{transaction.id.substring(0, 8)}...
                                                        </div>
                                                    </div>
                                                </div>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBadgeClass(transaction.status)}`}>
                                                    {transaction.status === 'Validé' && <i className="fas fa-check-circle mr-1"></i>}
                                                    {transaction.status === 'Rejeté' && <i className="fas fa-times-circle mr-1"></i>}
                                                    {(transaction.status === 'En attente de validation' || transaction.status === 'en_attente_validation') && <i className="fas fa-clock mr-1"></i>}
                                                    {(transaction.status === 'Assignée (validation en cours)' || transaction.status === 'assigné_validation_en_cours') && <i className="fas fa-user-check mr-1"></i>}
                                                    {transaction.status.length > 8 ? transaction.status.substring(0, 8) + '...' : transaction.status}
                                                </span>
                                            </div>
                                            {(assignedUser || validator) && (
                                                <div className="mt-1 text-xs text-gray-600 dark:text-gray-300 truncate">
                                                    {assignedUser && `Assigné à: ${assignedUser.name}`}
                                                    {validator && ` • Validé par: ${validator.name}`}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="px-3 py-2">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                    {formatAmount(transaction.montant_principal)}
                                                </div>
                                                <div className="text-right">
                                                    <div className="text-xs text-gray-500">
                                                        {formatDate(transaction.created_at).split(' ')[0]}
                                                    </div>
                                                    <div className="text-xs text-gray-400 truncate max-w-24">
                                                        {agent?.name} • {agency?.name}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {/* Actions selon le mode et le statut - Version compacte */}
                                            <div className="flex flex-wrap gap-1">
                                                {mainTab === 'validation' && (
                                                    transaction.assigned_to === user.id ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleTransactionAction('validate', transaction)}
                                                                className="flex-1 inline-flex items-center justify-center px-2 py-1 bg-green-100 hover:bg-green-200 text-green-700 rounded text-xs"
                                                            >
                                                                <i className="fas fa-check mr-1"></i>
                                                                Valider
                                                            </button>
                                                            <button
                                                                onClick={() => handleTransactionAction('reject', transaction)}
                                                                className="flex-1 inline-flex items-center justify-center px-2 py-1 bg-red-100 hover:bg-red-200 text-red-700 rounded text-xs"
                                                            >
                                                                <i className="fas fa-times mr-1"></i>
                                                                Rejeter
                                                            </button>
                                                            <button
                                                                onClick={() => handleTransactionAction('unassign', transaction)}
                                                                className="inline-flex items-center px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded text-xs"
                                                                title="Se désassigner"
                                                            >
                                                                <i className="fas fa-user-minus"></i>
                                                            </button>
                                                        </>
                                                    ) : !transaction.assigned_to ? (
                                                        <button
                                                            onClick={() => handleTransactionAction('assign-self', transaction)}
                                                            className="flex-1 inline-flex items-center justify-center px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs"
                                                        >
                                                            <i className="fas fa-user-plus mr-1"></i>
                                                            S'assigner
                                                        </button>
                                                    ) : (
                                                        <div className="text-xs text-gray-500 italic truncate">
                                                            Assigné à {assignedUser?.name}
                                                        </div>
                                                    )
                                                )}
                                                
                                                {transaction.proof_url && (
                                                    <button
                                                        onClick={() => openModal('viewProof', transaction.proof_url)}
                                                        className="inline-flex items-center px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs"
                                                        title="Voir la preuve"
                                                    >
                                                        <i className="fas fa-eye"></i>
                                                    </button>
                                                )}
                                            </div>
                                            
                                            {transaction.motif_rejet && (
                                                <div className="w-full mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded text-xs text-red-700 dark:text-red-300">
                                                    <strong>Motif:</strong> {transaction.motif_rejet.length > 50 ? transaction.motif_rejet.substring(0, 50) + '...' : transaction.motif_rejet}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-6">
                                <Pagination 
                                    currentPage={currentPage} 
                                    totalPages={totalPages} 
                                    onPageChange={setCurrentPage} 
                                />
                            </div>
                        )}
                    </>
                )}
            </Card>

            <RejectTransactionModal
                isOpen={isRejectModalOpen}
                onClose={() => setRejectModalOpen(false)}
                transaction={selectedTransaction}
                onConfirm={(tx, reason) => {
                    updateTransactionStatus(tx.id, 'Rejeté', reason);
                    setRejectModalOpen(false);
                }}
            />

            {itemToValidate && (
                <Modal
                    id="confirm-validate-modal"
                    title="Confirmer la Validation"
                    isOpen={isConfirmValidateModalOpen}
                    onClose={() => setConfirmValidateModalOpen(false)}
                    size="md:max-w-lg"
                    icon={<i className="fas fa-check-circle text-xl text-green-500"></i>}
                    footer={
                        <>
                            <button type="button" className="btn btn-secondary" onClick={() => setConfirmValidateModalOpen(false)}>
                                Annuler
                            </button>
                            <button type="button" className="btn btn-success ml-auto" onClick={handleConfirmValidate}>
                                Confirmer la Validation
                            </button>
                        </>
                    }
                >
                    <p>
                        Êtes-vous sûr de vouloir valider cette transaction ?
                    </p>
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border">
                        <div className="flex justify-between"><span>ID:</span> <strong>{itemToValidate.id}</strong></div>
                        <div className="flex justify-between"><span>Montant:</span> <strong>{formatAmount(itemToValidate.montant_principal)}</strong></div>
                    </div>
                    <p className="mt-4 text-sm text-red-600 font-semibold">
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        Cette action est irréversible et affectera les soldes.
                    </p>
                </Modal>
            )}
        </>
    );
};