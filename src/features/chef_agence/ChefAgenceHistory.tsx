import React, { useState, useMemo, useEffect } from 'react';
import { PageComponentProps, ChefAgence, Agent, Transaction, OperationType, FormField, CommissionConfig } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { formatDate, formatAmount } from '../../utils/formatters';
import { getBadgeClass } from '../../utils/uiHelpers';
import { Pagination } from '../../components/common/Pagination';
import { supabase } from '../../supabaseClient';
import { handleSupabaseError } from '../../utils/errorUtils';

const getOperationIcon = (opTypeId: string): string => {
    if (opTypeId.includes('transfert')) return 'fa-exchange-alt';
    if (opTypeId.includes('sde') || opTypeId.includes('facture')) return 'fa-file-invoice-dollar';
    if (opTypeId.includes('reabo') || opTypeId.includes('canal')) return 'fa-tv';
    if (opTypeId.includes('woyofal')) return 'fa-lightbulb';
    return 'fa-receipt';
};

const ExpandedDetails: React.FC<{ transaction: Transaction, opType?: OperationType }> = ({ transaction, opType }) => {
    const fields = opType?.fields || [];
    
    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div>
                <h5 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Détails de la Transaction</h5>
                <div className="text-sm space-y-1">
                    {fields.map((field: any) => (
                        <div key={field.id} className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-300">{field.label}:</span>
                            <span className="font-medium text-gray-800 dark:text-gray-100">{((transaction.data as Record<string, any>)?.[field.name]) ?? 'N/A'}</span>
                        </div>
                    ))}
                </div>
            </div>
             <div>
                <h5 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Détails Financiers</h5>
                 <div className="text-sm space-y-1">
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">Montant Principal:</span><span className="font-medium text-gray-800 dark:text-gray-100">{formatAmount(transaction.montant_principal)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">Frais:</span><span className="font-medium text-gray-800 dark:text-gray-100">{formatAmount(transaction.frais)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">Total Débité:</span><span className="font-bold text-red-600">{formatAmount(transaction.montant_total)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-600 dark:text-gray-300">Commission Générée:</span><span className="font-bold text-green-600">{formatAmount(transaction.commission_generee)}</span></div>
                </div>
            </div>
            {transaction.motif_rejet && (
                <div className="md:col-span-2 mt-2">
                    <h5 className="font-semibold text-red-700 mb-1">Motif du Rejet</h5>
                    <p className="text-sm p-2 bg-red-100 text-red-800 rounded-md">{transaction.motif_rejet}</p>
                </div>
            )}
        </div>
    );
}

export const ChefAgenceHistory: React.FC<PageComponentProps> = ({ user, openModal }) => {
    const chefUser = user as ChefAgence;
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [myAgents, setMyAgents] = useState<Agent[]>([]);
    const [opTypes, setOpTypes] = useState<OperationType[]>([]);
    const [loading, setLoading] = useState(true);
    const [filters, setFilters] = useState({ 
        agentId: 'all', 
        opTypeId: 'all', 
        status: 'all', 
        searchTerm: '',
        startDate: '',
        endDate: '',
    });
    const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    useEffect(() => {
        const fetchData = async () => {
            if (!chefUser.agency_id) { setLoading(false); return; }
            setLoading(true);

            const { data: agentsData, error: agentsError } = await supabase
                .from('profiles')
                .select('*')
                .eq('agency_id', chefUser.agency_id)
                .eq('role', 'agent');

            if (agentsError) { handleSupabaseError(agentsError, "Chargement des agents de l'agence"); setLoading(false); return; }
            setMyAgents((agentsData as unknown as Agent[]) ?? []);

            const agentIds = (agentsData || []).map((a: any) => a.id);
            agentIds.push(chefUser.id);

            const { data: txsData, error: txsError } = await supabase
                .from('transactions')
                .select('*')
                .in('agent_id', agentIds)
                .order('created_at', { ascending: false });

            const { data: opTypesData, error: opTypesError } = await supabase.from('operation_types').select('*');
            
            if (txsError) handleSupabaseError(txsError, "Chargement des transactions de l'agence");
            if (opTypesError) handleSupabaseError(opTypesError, "Chargement des types d'opérations");

            if (!txsError && !opTypesError) {
                setTransactions((txsData as unknown as Transaction[]) ?? []);
                const loadedOpTypes = ((opTypesData as unknown as OperationType[]) ?? []).map(op => ({
                    ...op,
                    fields: (op.fields as FormField[] | null) || [],
                    commission_config: (op.commission_config as CommissionConfig | null) || {type: 'none'}
                }));
                setOpTypes(loadedOpTypes);
            }
            setLoading(false);
        };
        fetchData();
    }, [chefUser.id, chefUser.agency_id]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(t => {
            const agent = myAgents.find(a => a.id === t.agent_id) || (t.agent_id === chefUser.id ? chefUser : null);
            const opType = opTypes.find(ot => ot.id === t.op_type_id);
            
            const matchesAgent = filters.agentId === 'all' || t.agent_id === filters.agentId;
            const matchesOpType = filters.opTypeId === 'all' || t.op_type_id === filters.opTypeId;
            const matchesStatus = filters.status === 'all' || t.status === filters.status;
            
            const createdAt = new Date(t.created_at);
            const matchesStartDate = !filters.startDate || createdAt >= new Date(filters.startDate);
            const matchesEndDate = !filters.endDate || createdAt <= new Date(filters.endDate + 'T23:59:59');

            const searchTermLower = filters.searchTerm.toLowerCase();
            const matchesSearch = searchTermLower === '' ||
                t.id.toLowerCase().includes(searchTermLower) ||
                (agent?.name.toLowerCase().includes(searchTermLower)) ||
                (opType?.name.toLowerCase().includes(searchTermLower));

            return matchesAgent && matchesOpType && matchesStatus && matchesSearch && matchesStartDate && matchesEndDate;
        });
    }, [transactions, filters, myAgents, opTypes, chefUser]);

    const paginatedTransactions = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredTransactions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredTransactions, currentPage]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({...prev, [e.target.name]: e.target.value}));
        setCurrentPage(1);
    };

    const resetFilters = () => {
        setFilters({ agentId: 'all', opTypeId: 'all', status: 'all', searchTerm: '', startDate: '', endDate: '' });
        setCurrentPage(1);
    };

    const handleViewProof = (e: React.MouseEvent, url: string | null) => {
        e.stopPropagation();
        if (url) {
            openModal('viewProof', url);
        }
    };

    const uniqueStatuses = useMemo(() => Array.from(new Set(transactions.map(t => t.status))), [transactions]);

    if (loading) return <Card title="Historique Détaillé des Opérations" icon="fa-landmark"><div>Chargement...</div></Card>;
    
    return (
        <>
            <PageHeader
                title="Historique des Opérations de l'Agence"
                subtitle="Supervisez, filtrez et analysez toutes les transactions de votre agence."
                icon="fa-landmark"
                gradient="from-indigo-500 to-purple-500"
            />
             <Card title="Filtres et Recherche" icon="fa-filter">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <input type="text" name="searchTerm" placeholder="Rechercher par ID, agent..." className="form-input" value={filters.searchTerm} onChange={handleFilterChange} />
                    <select name="agentId" className="form-select" value={filters.agentId} onChange={handleFilterChange}>
                        <option value="all">Tous les agents</option>
                        {myAgents.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        <option value={chefUser.id}>{chefUser.name} (Moi)</option>
                    </select>
                    <select name="opTypeId" className="form-select" value={filters.opTypeId} onChange={handleFilterChange}>
                        <option value="all">Tous les types</option>
                        {opTypes.map(ot => <option key={ot.id} value={ot.id}>{ot.name}</option>)}
                    </select>
                    <select name="status" className="form-select" value={filters.status} onChange={handleFilterChange}>
                        <option value="all">Tous les statuts</option>
                        {uniqueStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                    <input type="date" name="startDate" className="form-input" value={filters.startDate} onChange={handleFilterChange} />
                    <input type="date" name="endDate" className="form-input" value={filters.endDate} onChange={handleFilterChange} />
                    <button onClick={resetFilters} className="btn btn-secondary md:col-span-2 lg:col-span-2">Réinitialiser</button>
                </div>
            </Card>

            <Card title={`Résultats (${filteredTransactions.length})`} icon="fa-list-ul">
                 {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                    <table className="w-full table-auto">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-8"></th>
                                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID / Date</th>
                                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Agent</th>
                                <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                                <th className="p-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Montant</th>
                                <th className="p-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                                <th className="p-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedTransactions.length === 0 ? (
                                <tr><td colSpan={7} className="text-center text-gray-500 py-10">Aucune transaction à afficher.</td></tr>
                            ) : (
                                paginatedTransactions.map(t => {
                                    const opType = opTypes.find(ot => ot.id === t.op_type_id);
                                    const agent = myAgents.find(a => a.id === t.agent_id) || (t.agent_id === chefUser.id ? chefUser : null);
                                    return (
                                        <React.Fragment key={t.id}>
                                            <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => setExpandedRowId(prevId => prevId === t.id ? null : t.id)}>
                                                <td className="p-3 text-center"><i className={`fas fa-chevron-right text-gray-400 transition-transform ${expandedRowId === t.id ? 'rotate-90' : ''}`}></i></td>
                                                <td className="p-3"><p className="font-mono text-xs text-gray-800 dark:text-gray-100 font-semibold">{t.id}</p><p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(t.created_at)}</p></td>
                                                <td className="p-3 font-medium text-gray-900 dark:text-gray-200">{agent?.name || 'N/A'}</td>
                                                <td className="p-3 text-sm text-gray-600 dark:text-gray-300">{opType ? opType.name : 'N/A'}</td>
                                                <td className="p-3 text-right font-semibold text-gray-700 dark:text-gray-100">{formatAmount(t.montant_principal)}</td>
                                                <td className="p-3 text-center"><span className={`badge ${getBadgeClass(t.status)}`}>{t.status}</span></td>
                                                <td className="p-3 text-center">
                                                    {t.proof_url ? (<button className="btn btn-xs btn-outline-secondary !py-1 !px-2" onClick={(e) => handleViewProof(e, t.proof_url)} title="Voir la preuve"><i className="fas fa-eye"></i></button>) : (<span className="text-gray-400 text-xs">N/A</span>)}
                                                </td>
                                            </tr>
                                            {expandedRowId === t.id && (
                                                <tr className="bg-slate-50 dark:bg-slate-800"><td colSpan={7} className="p-0"><ExpandedDetails transaction={t} opType={opType} /></td></tr>
                                            )}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile List View */}
                <div className="lg:hidden space-y-4">
                    {paginatedTransactions.map(t => {
                        const opType = opTypes.find(ot => ot.id === t.op_type_id);
                        const agent = myAgents.find(a => a.id === t.agent_id) || (t.agent_id === chefUser.id ? chefUser : null);
                        const isExpanded = expandedRowId === t.id;
                        return (
                            <div key={t.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
                                <div className="p-4 cursor-pointer flex items-start space-x-4" onClick={() => setExpandedRowId(isExpanded ? null : t.id)}>
                                    <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-indigo-100 dark:bg-indigo-900/50`}>
                                        <i className={`fas ${getOperationIcon(t.op_type_id)} text-xl text-indigo-600 dark:text-indigo-300`}></i>
                                    </div>
                                    <div className="flex-grow">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-bold text-gray-800 dark:text-gray-100">{opType?.name || 'N/A'}</p>
                                                <p className="text-sm text-gray-600 dark:text-gray-300">Agent: {agent?.name || 'N/A'}</p>
                                            </div>
                                            <span className={`badge ${getBadgeClass(t.status)}`}>{t.status}</span>
                                        </div>
                                        <div className="mt-4 flex justify-between items-center">
                                            <div>
                                                <p className="text-lg font-bold text-gray-700 dark:text-gray-200">{formatAmount(t.montant_principal)}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(t.created_at)}</p>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                {t.proof_url && <button className="btn btn-xs btn-outline-secondary !py-1 !px-2" onClick={(e) => handleViewProof(e, t.proof_url)} title="Voir la preuve"><i className="fas fa-eye"></i></button>}
                                                <i className={`fas fa-chevron-down text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}></i>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {isExpanded && <ExpandedDetails transaction={t} opType={opType} />}
                            </div>
                        );
                    })}
                </div>
                <Pagination currentPage={currentPage} totalPages={Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE)} onPageChange={setCurrentPage} />
            </Card>
        </>
    );
};