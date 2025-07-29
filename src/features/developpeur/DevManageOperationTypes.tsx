
import React, { useState, useMemo } from 'react';
import { PageComponentProps, OperationType, FormField, CommissionTier } from '../../types';
import { Card } from '../../components/common/Card';
import { getBadgeClass } from '../../utils/uiHelpers';
import { formatAmount } from '../../utils/formatters';
import { Pagination } from '../../components/common/Pagination';
import { useOperationTypes } from '../../hooks/useOperationTypes';
import { DevEditOperationTypeModal } from './DevEditOperationTypeModal';
import { PageHeader } from '../../components/common/PageHeader';

const DevStatCard: React.FC<{ title: string; value: string | number; icon: string; color: string }> = ({ title, value, icon, color }) => (
    <div className={`rounded-2xl p-4 text-white relative overflow-hidden shadow-lg transition-transform transform hover:-translate-y-1 ${color}`}>
        <div className="relative z-10 flex items-center">
            <i className={`fas ${icon} text-2xl mr-4`}></i>
            <div>
                 <p className="text-sm font-medium opacity-90">{title}</p>
                <p className="text-2xl font-bold">{value}</p>
            </div>
        </div>
    </div>
);

const ExpandedOpTypeDetails: React.FC<{ opType: OperationType }> = ({ opType }) => {
    const renderCommission = () => {
        const config = opType.commission_config;
        if (!config) return <p className="text-sm text-gray-500 italic">Non configurée.</p>;
        
        switch (config.type) {
            case 'none': return <p>Aucune commission</p>;
            case 'fixed': return <p>Fixe: <span className="font-semibold">{formatAmount(config.amount)}</span></p>;
            case 'percentage': return <p>Pourcentage: <span className="font-semibold">{config.rate}%</span></p>;
            case 'tiers':
                return (
                    <div>
                        <table className="w-full table-sm text-sm mt-2">
                            <thead className="bg-gray-200 dark:bg-gray-700">
                                <tr>
                                    <th className="p-2 text-left font-medium">De</th>
                                    <th className="p-2 text-left font-medium">À</th>
                                    <th className="p-2 text-left font-medium">Commission</th>
                                </tr>
                            </thead>
                            <tbody>
                                {config.tiers?.map((tier, i) => (
                                    <tr key={i} className="border-b dark:border-gray-700">
                                        <td className="p-2">{formatAmount(tier.from)}</td>
                                        <td className="p-2">{tier.to === null ? 'Infini' : formatAmount(tier.to)}</td>
                                        <td className="p-2">{typeof tier.commission === 'number' ? formatAmount(tier.commission) : tier.commission}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                    <h5 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Champs du Formulaire</h5>
                    {Array.isArray(opType.fields) && opType.fields.length > 0 ? (
                        <div className="space-y-2 text-sm max-h-48 overflow-y-auto pr-2">
                            {opType.fields.map((field: FormField) => (
                                <div key={field.id} className="p-2 bg-white dark:bg-gray-700 rounded border dark:border-gray-600 flex justify-between items-center">
                                    <div>
                                        <span className="font-medium text-gray-800 dark:text-gray-100">{field.label}</span>
                                        <span className="text-gray-500 dark:text-gray-400 text-xs block">({field.name}, type: {field.type})</span>
                                    </div>
                                    <span className={`badge text-xs ${field.required ? 'badge-danger' : 'badge-gray'}`}>{field.required ? 'Requis' : 'Optionnel'}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500 dark:text-gray-400 italic">Aucun champ de formulaire défini.</p>
                    )}
                </div>
                <div className="space-y-4">
                     <div>
                        <h5 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Règles de Commission</h5>
                        {renderCommission()}
                    </div>
                    <div>
                        <h5 className="font-semibold text-gray-700 dark:text-gray-200 mb-2">Autres Paramètres</h5>
                        <div className="text-sm space-y-1">
                            <div className="flex justify-between"><span>Preuve requise:</span> <span className={`font-semibold ${opType.proof_is_required ? 'text-green-600' : 'text-red-600'}`}>{opType.proof_is_required ? 'Oui' : 'Non'}</span></div>
                            <div className="flex justify-between"><span>Impacte le solde:</span> <span className={`font-semibold ${opType.impacts_balance ? 'text-green-600' : 'text-red-600'}`}>{opType.impacts_balance ? 'Oui' : 'Non'}</span></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const DevManageOperationTypes: React.FC<PageComponentProps> = () => {
    const { operationTypes, loading, saveOpType, duplicateOpType, toggleOpTypeStatus } = useOperationTypes();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [expandedOpId, setExpandedOpId] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 5;

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedOpType, setSelectedOpType] = useState<OperationType | null>(null);

    const filteredOperationTypes = useMemo(() => {
        return operationTypes.filter(opType => {
            const matchesSearch = searchTerm === '' || 
                                  (opType.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                                  (opType.description || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || opType.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [searchTerm, statusFilter, operationTypes]);
    
    const stats = useMemo(() => {
        return operationTypes.reduce((acc, op) => {
            acc.total++;
            if(op.status === 'active') acc.active++;
            else if (op.status === 'inactive') acc.inactive++;
            else if (op.status === 'archived') acc.archived++;
            return acc;
        }, { total: 0, active: 0, inactive: 0, archived: 0 });
    }, [operationTypes]);

    const totalPages = Math.ceil(filteredOperationTypes.length / ITEMS_PER_PAGE);
    const paginatedOpTypes = useMemo(() => {
        return filteredOperationTypes.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    }, [filteredOperationTypes, currentPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        setExpandedOpId(null);
    };

    const handleToggleDetails = (opId: string) => {
        setExpandedOpId(currentId => (currentId === opId ? null : opId));
    };

    const openModal = (opType: OperationType | null) => {
        setSelectedOpType(opType);
        setIsModalOpen(true);
    };

    const handleSaveAndClose = (opTypeData: OperationType) => {
        saveOpType(opTypeData);
        setIsModalOpen(false);
    };

    const handleTableAction = (action: string, id: string) => {
        if (action === 'edit-op-type') {
            const opType = operationTypes.find(op => op.id === id);
            if (opType) openModal(opType);
        }
        if (action === 'duplicateOpType') duplicateOpType(id);
        if (action === 'toggleOpTypeStatus') toggleOpTypeStatus(id);
    };
    
    if (loading) return <Card title="Gestion des Types d'Opérations" icon="fa-list-ul"><div>Chargement...</div></Card>;

    return (
        <>
            <PageHeader
                title="Types d'Opérations"
                subtitle="Créez, configurez et gérez les services disponibles sur la plateforme."
                icon="fa-cogs"
                gradient="from-gray-700 to-gray-900"
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <DevStatCard title="Total" value={stats.total} icon="fa-cogs" color="bg-gradient-to-br from-slate-500 to-slate-600" />
                <DevStatCard title="Actifs" value={stats.active} icon="fa-check-circle" color="bg-gradient-to-br from-green-500 to-green-600" />
                <DevStatCard title="Inactifs" value={stats.inactive} icon="fa-pause-circle" color="bg-gradient-to-br from-orange-500 to-orange-600" />
                <DevStatCard title="Archivés" value={stats.archived} icon="fa-archive" color="bg-gradient-to-br from-gray-500 to-gray-600" />
            </div>

            <Card title="Liste des types d'opérations" icon="fa-list-ul">
                <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
                    <div className="flex gap-4 flex-wrap flex-grow">
                        <input 
                            type="text" 
                            className="form-input flex-grow min-w-[200px]" 
                            placeholder="Rechercher..."
                            value={searchTerm}
                            onChange={(e) => {setSearchTerm(e.target.value); handlePageChange(1);}}
                        />
                        <select 
                            className="form-select flex-grow min-w-[150px]"
                            value={statusFilter}
                            onChange={(e) => {setStatusFilter(e.target.value); handlePageChange(1);}}
                        >
                            <option value="all">Tous les statuts</option>
                            <option value="active">Actif</option>
                            <option value="inactive">Inactif</option>
                            <option value="archived">Archivé</option>
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={() => openModal(null)}>
                        <i className="fas fa-plus mr-2"></i>Créer un Type
                    </button>
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto bg-white dark:bg-gray-800 rounded-lg shadow">
                    <table className="w-full table-auto">
                        <thead className="bg-gray-50 dark:bg-gray-900">
                            <tr>
                                <th className="p-3 w-8"></th>
                                <th className="p-3 text-left">Nom</th>
                                <th className="p-3 text-center">Impacte Solde</th>
                                <th className="p-3 text-center">Preuve Requise</th>
                                <th className="p-3 text-center">Statut</th>
                                <th className="p-3 text-center">Champs</th>
                                <th className="p-3 text-left">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                            {paginatedOpTypes.length > 0 ? paginatedOpTypes.map(opType => (
                                <React.Fragment key={opType.id}>
                                    <tr className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => handleToggleDetails(opType.id)}>
                                        <td className="p-3 text-center"><i className={`fas fa-chevron-right text-gray-400 transition-transform ${expandedOpId === opType.id ? 'rotate-90' : ''}`}></i></td>
                                        <td className="p-3 font-medium text-gray-900 dark:text-gray-100">{opType.name}</td>
                                        <td className="p-3 text-center"><i className={`fas fa-lg ${opType.impacts_balance ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500'}`}></i></td>
                                        <td className="p-3 text-center"><i className={`fas fa-lg ${opType.proof_is_required ? 'fa-check-circle text-green-500' : 'fa-times-circle text-red-500'}`}></i></td>
                                        <td className="p-3 text-center"><span className={`badge ${getBadgeClass(opType.status)}`}>{opType.status}</span></td>
                                        <td className="p-3 text-center">{Array.isArray(opType.fields) ? opType.fields.length : 0}</td>
                                        <td className="p-3">
                                            <div className="flex items-center space-x-2">
                                                <button className="btn btn-xs btn-outline-secondary" onClick={(e) => { e.stopPropagation(); handleTableAction('edit-op-type', opType.id); }}><i className="fas fa-edit mr-1"></i>Éditer</button>
                                                <button className="btn btn-xs btn-outline-secondary" onClick={(e) => { e.stopPropagation(); handleTableAction('duplicateOpType', opType.id); }}><i className="fas fa-copy mr-1"></i>Dupliquer</button>
                                            </div>
                                        </td>
                                    </tr>
                                    {expandedOpId === opType.id && (
                                        <tr><td colSpan={7} className="p-0"><ExpandedOpTypeDetails opType={opType} /></td></tr>
                                    )}
                                </React.Fragment>
                            )) : (
                                <tr><td colSpan={7} className="text-center text-gray-500 py-10">Aucun type d'opération ne correspond à votre recherche.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Card View */}
                <div className="lg:hidden space-y-4">
                    {paginatedOpTypes.map(opType => (
                         <div key={opType.id} className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
                             <div className="p-4 cursor-pointer" onClick={() => handleToggleDetails(opType.id)}>
                                <div className="flex justify-between items-start">
                                    <h4 className="font-bold text-gray-800 dark:text-gray-100 flex-1 pr-4">{opType.name}</h4>
                                    <span className={`badge ${getBadgeClass(opType.status)}`}>{opType.status}</span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 truncate">{opType.description}</p>
                                <div className="flex items-center space-x-4 text-xs mt-3">
                                    <span><i className={`fas ${opType.impacts_balance ? 'fa-check text-green-500' : 'fa-times text-red-500'} mr-1`}></i>Solde</span>
                                    <span><i className={`fas ${opType.proof_is_required ? 'fa-check text-green-500' : 'fa-times text-red-500'} mr-1`}></i>Preuve</span>
                                    <span><i className="fas fa-list-ol mr-1"></i>{Array.isArray(opType.fields) ? opType.fields.length : 0} champs</span>
                                </div>
                             </div>
                             <div className="bg-gray-50 dark:bg-gray-900/50 p-2 flex justify-end space-x-2">
                                <button className="btn btn-xs btn-outline-secondary" onClick={() => handleTableAction('edit-op-type', opType.id)}><i className="fas fa-edit mr-1"></i>Éditer</button>
                                <button className="btn btn-xs btn-outline-secondary" onClick={() => handleTableAction('duplicateOpType', opType.id)}><i className="fas fa-copy mr-1"></i>Dupliquer</button>
                            </div>
                             {expandedOpId === opType.id && <ExpandedOpTypeDetails opType={opType} />}
                         </div>
                    ))}
                </div>

                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
            </Card>

            <DevEditOperationTypeModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                opTypeId={selectedOpType?.id || null}
                initialData={selectedOpType}
                onSave={handleSaveAndClose}
            />
        </>
    );
};
