import React, { useState, useMemo, useEffect } from 'react';
import { PageComponentProps, Transaction, OperationType, Agent, FormField, CommissionConfig } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Table } from '../../components/common/Table';
import { formatDate, formatAmount } from '../../utils/formatters';
import { getBadgeClass } from '../../utils/uiHelpers';
import { Pagination } from '../../components/common/Pagination';
import { supabase } from '../../supabaseClient';
import { handleSupabaseError } from '../../utils/errorUtils';
import { PageLoader, SectionLoader } from '../../components/common/Loader';

const getOperationIcon = (opTypeId: string): string => {
    if (opTypeId.includes('transfert')) return 'fa-exchange-alt';
    if (opTypeId.includes('sde') || opTypeId.includes('facture')) return 'fa-file-invoice-dollar';
    if (opTypeId.includes('reabo') || opTypeId.includes('canal')) return 'fa-tv';
    if (opTypeId.includes('woyofal')) return 'fa-lightbulb';
    return 'fa-receipt';
};

export const AgentTransactionHistory: React.FC<PageComponentProps> = ({ user, openModal, refreshCurrentUser }) => {
    const agentUser = user as Agent;
    // Common state
    const [activeTab, setActiveTab] = useState('history');

    // History Tab State
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [profiles, setProfiles] = useState<Record<string, { name: string }>>({});
    const [loadingHistory, setLoadingHistory] = useState(true);
    const [historyPage, setHistoryPage] = useState(1);
    const [filters, setFilters] = useState({ status: 'all', opTypeId: 'all', startDate: '', endDate: '', searchTerm: '' });
    const HISTORY_ITEMS_PER_PAGE = 10;

    // Create Tab State
    const [availableOpTypes, setAvailableOpTypes] = useState<OperationType[]>([]);
    const [loadingOpTypes, setLoadingOpTypes] = useState(true);
    const [selectedOpType, setSelectedOpType] = useState<OperationType | null>(null);
    const [formData, setFormData] = useState<Record<string, any>>({});
    const [proofFile, setProofFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // --- Data Fetching ---

    useEffect(() => {
        // Fetch data for both tabs
        const fetchHistoryData = async () => {
            setLoadingHistory(true);
            const { data: trxData, error: trxError } = await supabase.from('transactions').select('*').eq('agent_id', user.id).order('created_at', { ascending: false });
            if (trxError) handleSupabaseError(trxError, "Chargement de l'historique");
            else setTransactions((trxData as unknown as Transaction[]) ?? []);
            setLoadingHistory(false);
        };

        const fetchOpTypes = async () => {
            setLoadingOpTypes(true);
            if (!agentUser.agency_id) { setLoadingOpTypes(false); return; }
            const { data, error } = await supabase.rpc('get_available_op_types_for_agency', { p_agency_id: agentUser.agency_id });
            if (error) handleSupabaseError(error, "Chargement des types d'opérations");
            else {
                const mappedData = (Array.isArray(data) ? data : []).map(op => ({
                    ...op,
                    fields: (op.fields as FormField[] | null) || [],
                    commission_config: (op.commission_config as CommissionConfig | null) || { type: 'none' }
                }));
                setAvailableOpTypes(mappedData as OperationType[]);
            }
            setLoadingOpTypes(false);
        };

        fetchHistoryData();
        fetchOpTypes();
    }, [user.id, agentUser.agency_id]);


    // --- History Tab Logic ---
    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setHistoryPage(1);
    };

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            // Filtre par statut
            if (filters.status !== 'all' && t.status !== filters.status) return false;

            // Filtre par type d'opération
            if (filters.opTypeId !== 'all' && t.op_type_id !== filters.opTypeId) return false;

            // Filtre par terme de recherche
            if (filters.searchTerm) {
                const searchLower = filters.searchTerm.toLowerCase();
                const opType = availableOpTypes.find(ot => ot.id === t.op_type_id);
                const matchesId = t.id.toLowerCase().includes(searchLower);
                const matchesType = opType?.name.toLowerCase().includes(searchLower);
                if (!matchesId && !matchesType) return false;
            }

            // Filtre par date de début
            if (filters.startDate) {
                const transactionDate = new Date(t.created_at);
                const startDate = new Date(filters.startDate);
                if (transactionDate < startDate) return false;
            }

            // Filtre par date de fin
            if (filters.endDate) {
                const transactionDate = new Date(t.created_at);
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999); // Inclure toute la journée
                if (transactionDate > endDate) return false;
            }

            return true;
        });
    }, [filters, transactions, availableOpTypes]);
    const paginatedTransactions = useMemo(() => filteredTransactions.slice((historyPage - 1) * HISTORY_ITEMS_PER_PAGE, historyPage * HISTORY_ITEMS_PER_PAGE), [historyPage, filteredTransactions]);
    const totalHistoryPages = Math.ceil(filteredTransactions.length / HISTORY_ITEMS_PER_PAGE);
    const uniqueStatuses = useMemo(() => Array.from(new Set(transactions.map(t => t.status))), [transactions]);


    // --- Create Tab Logic ---
    const handleOpTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const opTypeId = e.target.value;
        const opType = availableOpTypes.find(ot => ot.id === opTypeId) || null;
        setSelectedOpType(opType);
        setFormData(opType?.fields?.reduce((acc, field) => ({ ...acc, [field.name]: field.defaultValue ?? '' }), {}) ?? {});
    };

    const handleFieldChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => setProofFile(e.target.files ? e.target.files[0] : null);

    const handleFormSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOpType) return;
        setIsSubmitting(true);

        let proofUrl: string | null = null;
        if (proofFile) {
            const filePath = `${user.id}/${Date.now()}_${proofFile.name}`;
            const { error: uploadError } = await supabase.storage.from('proofs').upload(filePath, proofFile);
            if (uploadError) { handleSupabaseError(uploadError, "Téléversement de la preuve"); setIsSubmitting(false); return; }
            const { data: urlData } = supabase.storage.from('proofs').getPublicUrl(filePath);
            proofUrl = urlData.publicUrl;
        }

        const { error: rpcError } = await supabase.rpc('create_secure_transaction', { p_agent_id: user.id, p_op_type_id: selectedOpType.id, p_data: formData, p_proof_url: proofUrl });
        setIsSubmitting(false);
        if (rpcError) { handleSupabaseError(rpcError, "Création d'une nouvelle transaction"); }
        else {
            console.log('Transaction soumise avec succès !');
            setSelectedOpType(null);
            setFormData({});
            setProofFile(null);
            refreshCurrentUser?.(); // Refresh balances etc.
            setActiveTab('history'); // Switch to history view
        }
    };

    const opFields = selectedOpType?.fields || [];
    const amountInput = opFields.find((f) => f.name.includes('montant'));
    const currentAmount = amountInput ? Number(formData[amountInput.name]) || 0 : 0;
    const balanceAfter = selectedOpType?.impacts_balance ? (agentUser.solde ?? 0) - currentAmount : (agentUser.solde ?? 0);
    const isFormInvalid = isSubmitting || !selectedOpType || (selectedOpType.proof_is_required && !proofFile) || opFields.some(f => f.required && !formData[f.name]);

    return (
        <>
            <PageHeader title="Opérations" subtitle="Créez une nouvelle transaction ou consultez votre historique." icon="fa-exchange-alt" gradient="from-blue-500 to-indigo-500" />
            <div className="tabs">
                <button onClick={() => setActiveTab('history')} className={activeTab === 'history' ? 'active' : ''}>Historique ({transactions.length})</button>
                <button onClick={() => setActiveTab('create')} className={activeTab === 'create' ? 'active' : ''}>Nouvelle Opération</button>
            </div>

            {activeTab === 'history' && (
                <Card title="Historique des Opérations" icon="fa-history">
                    {/* Filtres et Recherche */}
                    <div className="mb-6 space-y-4">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Barre de recherche */}
                            <div className="flex-1">
                                <div className="relative">
                                    <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                    <input
                                        type="text"
                                        name="searchTerm"
                                        placeholder="Rechercher par ID, type d'opération..."
                                        className="form-input pl-10"
                                        value={filters.searchTerm}
                                        onChange={handleFilterChange}
                                    />
                                </div>
                            </div>

                            {/* Filtres */}
                            <div className="flex flex-col sm:flex-row gap-3">
                                <select
                                    name="status"
                                    className="form-select form-select-sm min-w-[140px]"
                                    value={filters.status}
                                    onChange={handleFilterChange}
                                >
                                    <option value="all">Tous les statuts</option>
                                    {uniqueStatuses.map(status => (
                                        <option key={status} value={status}>{status}</option>
                                    ))}
                                </select>

                                <select
                                    name="opTypeId"
                                    className="form-select form-select-sm min-w-[160px]"
                                    value={filters.opTypeId}
                                    onChange={handleFilterChange}
                                >
                                    <option value="all">Tous les types</option>
                                    {availableOpTypes.map(opType => (
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

                        {/* Statistiques rapides */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                            <div className="text-center">
                                <div className="text-2xl font-bold text-blue-600">{filteredTransactions.length}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">Total</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">
                                    {filteredTransactions.filter(t => t.status === 'validé').length}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">Validées</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600">
                                    {filteredTransactions.filter(t => t.status === 'en_attente_validation').length}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">En attente</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">
                                    {filteredTransactions.filter(t => t.status === 'rejeté').length}
                                </div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">Rejetées</div>
                            </div>
                        </div>
                    </div>

                    {loadingHistory ? (
                        <PageLoader text="Chargement de l'historique..." />
                    ) : filteredTransactions.length === 0 ? (
                        <div className="text-center py-12">
                            <i className="fas fa-inbox text-4xl text-gray-300 mb-4"></i>
                            <p className="text-gray-500">Aucune transaction trouvée</p>
                            {(filters.searchTerm || filters.status !== 'all' || filters.opTypeId !== 'all') && (
                                <button
                                    onClick={() => setFilters({ status: 'all', opTypeId: 'all', startDate: '', endDate: '', searchTerm: '' })}
                                    className="mt-2 text-blue-500 hover:underline text-sm"
                                >
                                    Réinitialiser les filtres
                                </button>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Version Desktop - Tableau moderne */}
                            <div className="hidden lg:block overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-200 dark:border-gray-700">
                                            <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-200">Opération</th>
                                            <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-200">Type</th>
                                            <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-200">Montant</th>
                                            <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-200">Statut</th>
                                            <th className="text-left py-4 px-4 font-semibold text-gray-700 dark:text-gray-200">Date</th>
                                            <th className="text-center py-4 px-4 font-semibold text-gray-700 dark:text-gray-200">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {paginatedTransactions.map((transaction, index) => {
                                            const opType = availableOpTypes.find(ot => ot.id === transaction.op_type_id);
                                            return (
                                                <tr key={transaction.id} className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${index % 2 === 0 ? 'bg-white dark:bg-gray-900' : 'bg-gray-50/50 dark:bg-gray-800/30'}`}>
                                                    <td className="py-4 px-4">
                                                        <div className="flex items-center space-x-3">
                                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${transaction.status === 'validé' ? 'bg-green-100 text-green-600' : transaction.status === 'rejeté' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                                <i className={`fas ${getOperationIcon(transaction.op_type_id)} text-sm`}></i>
                                                            </div>
                                                            <div>
                                                                <div className="font-medium text-gray-900 dark:text-gray-100">
                                                                    #{transaction.id.substring(0, 8)}...
                                                                </div>
                                                                <div className="text-sm text-gray-500">
                                                                    ID: {transaction.id.substring(0, 12)}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="font-medium text-gray-900 dark:text-gray-100">
                                                            {opType?.name || 'Type inconnu'}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="font-bold text-lg text-gray-900 dark:text-gray-100">
                                                            {formatAmount(transaction.montant_principal)}
                                                        </div>
                                                        {transaction.frais > 0 && (
                                                            <div className="text-sm text-gray-500">
                                                                Frais: {formatAmount(transaction.frais)}
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getBadgeClass(transaction.status)}`}>
                                                            {transaction.status === 'validé' && <i className="fas fa-check-circle mr-1"></i>}
                                                            {transaction.status === 'rejeté' && <i className="fas fa-times-circle mr-1"></i>}
                                                            {transaction.status === 'en_attente_validation' && <i className="fas fa-clock mr-1"></i>}
                                                            {transaction.status.replace('_', ' ')}
                                                        </span>
                                                    </td>
                                                    <td className="py-4 px-4">
                                                        <div className="text-gray-900 dark:text-gray-100">
                                                            {formatDate(transaction.created_at)}
                                                        </div>
                                                    </td>
                                                    <td className="py-4 px-4 text-center">
                                                        <div className="flex items-center justify-center space-x-2">
                                                            {transaction.proof_url && (
                                                                <button
                                                                    onClick={() => openModal('viewProof', transaction.proof_url)}
                                                                    className="inline-flex items-center px-3 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-md transition-colors text-sm"
                                                                    title="Voir la preuve"
                                                                >
                                                                    <i className="fas fa-eye mr-1"></i>
                                                                    Preuve
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Version Mobile - Cartes améliorées compactes */}
                            <div className="lg:hidden grid grid-cols-1 md:grid-cols-2 gap-4">
                                {paginatedTransactions.map(transaction => {
                                    const opType = availableOpTypes.find(ot => ot.id === transaction.op_type_id);
                                    return (
                                        <div key={transaction.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                            {/* Header de la carte */}
                                            <div className={`px-3 py-2 border-l-4 ${transaction.status === 'validé' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : transaction.status === 'rejeté' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center space-x-2">
                                                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${transaction.status === 'validé' ? 'bg-green-100 text-green-600' : transaction.status === 'rejeté' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
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
                                                        {transaction.status === 'validé' && <i className="fas fa-check-circle mr-1"></i>}
                                                        {transaction.status === 'rejeté' && <i className="fas fa-times-circle mr-1"></i>}
                                                        {transaction.status === 'en_attente_validation' && <i className="fas fa-clock mr-1"></i>}
                                                        {transaction.status.replace('_', ' ')}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Contenu de la carte */}
                                            <div className="px-3 py-2">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                                                        {formatAmount(transaction.montant_principal)}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-xs text-gray-500">
                                                            {formatDate(transaction.created_at).split(' ')[0]}
                                                        </div>
                                                        {transaction.frais > 0 && (
                                                            <div className="text-xs text-gray-400">
                                                                Frais: {formatAmount(transaction.frais)}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                {transaction.proof_url && (
                                                    <div className="flex justify-end">
                                                        <button
                                                            onClick={() => openModal('viewProof', transaction.proof_url)}
                                                            className="inline-flex items-center px-2 py-1 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded text-xs"
                                                            title="Voir la preuve"
                                                        >
                                                            <i className="fas fa-eye mr-1"></i>
                                                            Preuve
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Pagination */}
                            {totalHistoryPages > 1 && (
                                <div className="mt-6">
                                    <Pagination
                                        currentPage={historyPage}
                                        totalPages={totalHistoryPages}
                                        onPageChange={setHistoryPage}
                                    />
                                </div>
                            )}
                        </>
                    )}
                </Card>
            )}

            {activeTab === 'create' && (
                <Card title="Créer une Opération" icon="fa-paper-plane">
                    {loadingOpTypes ? (
                        <SectionLoader text="Chargement des types d'opérations..." />
                    ) : availableOpTypes.length === 0 ? (
                        <div className="text-center py-12">
                            <i className="fas fa-exclamation-triangle text-4xl text-yellow-400 mb-4"></i>
                            <p className="text-gray-500 mb-2">Aucun type d'opération disponible</p>
                            <p className="text-sm text-gray-400">Contactez votre administrateur pour configurer les opérations.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {/* Informations du solde actuel */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/50 rounded-full flex items-center justify-center">
                                            <i className="fas fa-wallet text-blue-600 text-xl"></i>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">Solde actuel</p>
                                            <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                                {formatAmount(agentUser.solde ?? 0)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-xs text-gray-500">Dernière mise à jour</p>
                                        <p className="text-sm font-medium text-gray-700 dark:text-gray-200">Maintenant</p>
                                    </div>
                                </div>
                            </div>

                            <form onSubmit={handleFormSubmit} className="space-y-6">
                                {/* Sélection du type d'opération */}
                                <div className="space-y-3">
                                    <label className="form-label flex items-center" htmlFor="opType">
                                        <i className="fas fa-list-alt mr-2 text-blue-500"></i>
                                        Type d'Opération
                                    </label>
                                    <div className="relative">
                                        <select
                                            id="opType"
                                            className="form-select pl-10"
                                            onChange={handleOpTypeChange}
                                            defaultValue=""
                                        >
                                            <option value="" disabled>-- Choisir une opération --</option>
                                            {availableOpTypes.map(op => (
                                                <option key={op.id} value={op.id}>
                                                    {op.name}
                                                </option>
                                            ))}
                                        </select>
                                        <i className="fas fa-chevron-down absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"></i>
                                    </div>
                                </div>

                                {selectedOpType && (
                                    <>
                                        {/* Informations sur l'opération sélectionnée */}
                                        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                                            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-4 py-3">
                                                <div className="flex items-center space-x-3">
                                                    <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                                        <i className={`fas ${getOperationIcon(selectedOpType.id)} text-white text-sm`}></i>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-white">{selectedOpType.name}</h3>
                                                        <p className="text-sm text-indigo-100">
                                                            {selectedOpType.description || 'Remplissez les informations ci-dessous'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Champs du formulaire */}
                                            <div className="p-6 space-y-4">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                                    {opFields.map(field => (
                                                        <div key={field.id} className="space-y-2">
                                                            <label className="form-label form-label-sm flex items-center" htmlFor={field.id}>
                                                                {field.label}
                                                                {field.required && <span className="text-red-500 ml-1">*</span>}
                                                            </label>
                                                            {field.type === 'select' ? (
                                                                <select
                                                                    id={field.id}
                                                                    name={field.name}
                                                                    className="form-select form-select-sm"
                                                                    value={formData[field.name] || ''}
                                                                    onChange={handleFieldChange}
                                                                    required={field.required}
                                                                >
                                                                    <option value="" disabled>-- Sélectionner --</option>
                                                                    {field.options?.map(opt => (
                                                                        <option key={opt} value={opt}>{opt}</option>
                                                                    ))}
                                                                </select>
                                                            ) : (
                                                                <input
                                                                    type={field.type}
                                                                    id={field.id}
                                                                    name={field.name}
                                                                    className="form-input form-input-sm"
                                                                    placeholder={field.placeholder}
                                                                    value={formData[field.name] || ''}
                                                                    onChange={handleFieldChange}
                                                                    required={field.required}
                                                                />
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Upload de preuve */}
                                        <div className="space-y-3">
                                            <label className="form-label flex items-center" htmlFor="opProofAgent">
                                                <i className="fas fa-camera mr-2 text-green-500"></i>
                                                Preuve de Transaction
                                                {selectedOpType.proof_is_required && <span className="text-red-500 ml-1">*</span>}
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="file"
                                                    id="opProofAgent"
                                                    className="form-input"
                                                    onChange={handleFileChange}
                                                    accept="image/*,application/pdf"
                                                    required={selectedOpType.proof_is_required}
                                                />
                                                <div className="mt-2 text-sm text-gray-500">
                                                    <i className="fas fa-info-circle mr-1"></i>
                                                    Formats acceptés: Images (JPG, PNG) ou PDF
                                                </div>
                                            </div>
                                            {proofFile && (
                                                <div className="flex items-center space-x-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                                    <i className="fas fa-check-circle text-green-500"></i>
                                                    <span className="text-sm text-green-700 dark:text-green-300">
                                                        Fichier sélectionné: {proofFile.name}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Résumé et validation */}
                                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                                            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
                                                <i className="fas fa-calculator mr-2 text-blue-500"></i>
                                                Résumé de l'opération
                                            </h4>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-300">Montant:</span>
                                                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                            {formatAmount(currentAmount)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-300">Solde actuel:</span>
                                                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                                                            {formatAmount(agentUser.solde ?? 0)}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-600 dark:text-gray-300">Impact:</span>
                                                        <span className={`font-semibold ${selectedOpType.impacts_balance ? 'text-red-600' : 'text-gray-500'}`}>
                                                            {selectedOpType.impacts_balance ? `- ${formatAmount(currentAmount)}` : 'Aucun'}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between border-t pt-2">
                                                        <span className="font-semibold text-gray-700 dark:text-gray-200">Solde après:</span>
                                                        <span className={`font-bold text-lg ${balanceAfter < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                            {formatAmount(balanceAfter)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {balanceAfter < 0 && (
                                                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                                    <div className="flex items-center">
                                                        <i className="fas fa-exclamation-triangle text-red-500 mr-2"></i>
                                                        <span className="text-sm text-red-700 dark:text-red-300">
                                                            Attention: Cette opération dépassera votre solde disponible
                                                        </span>
                                                    </div>
                                                </div>
                                            )}

                                            <div className="flex flex-col sm:flex-row gap-3 justify-end">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedOpType(null);
                                                        setFormData({});
                                                        setProofFile(null);
                                                    }}
                                                    className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                                >
                                                    <i className="fas fa-times mr-2"></i>
                                                    Annuler
                                                </button>
                                                <button
                                                    type="submit"
                                                    className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-lg hover:from-blue-600 hover:to-indigo-700 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                                    disabled={isFormInvalid}
                                                >
                                                    <i className={`fas ${isSubmitting ? 'fa-spinner animate-spin' : 'fa-paper-plane'} mr-2`}></i>
                                                    {isSubmitting ? 'Envoi en cours...' : 'Soumettre l\'opération'}
                                                </button>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </form>
                        </div>
                    )}
                </Card>
            )}
        </>
    );
};