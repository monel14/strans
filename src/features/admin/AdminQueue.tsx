import React, { useState, useEffect } from 'react';
import { User, Transaction, Request } from '../../types';
import { Card } from '../../components/common/Card';
import { formatAmount } from '../../utils/formatters';
import { IdDisplay } from '../../utils/idFormatters';
import { Pagination } from '../../components/common/Pagination';
import { supabase } from '../../supabaseClient';
import { handleSupabaseError } from '../../utils/errorUtils';
import { useAdminQueue } from '../../hooks/useAdminQueue';
import { AssignTaskModal } from './AssignTaskModal';
import { ProcessRequestModal } from './ProcessRequestModal';
import { RejectTransactionModal } from './RejectTransactionModal';
import { Modal } from '../../components/common/Modal';

interface AdminQueueProps {
    title: string;
    icon: string;
    items: (Transaction | Request)[];
    user: User;
    description?: string;
    onActionSuccess: () => void;
}

type TabKey = 'unassigned' | 'assigned_to_me' | 'all';

interface UserMapValue {
    name: string;
    role: string;
    agency_id: string | null;
}
type UserMap = Record<string, UserMapValue>;
type AgencyMap = Record<string, { name: string }>;
type OpTypeMap = Record<string, { name: string, impacts_balance: boolean }>;

const getOperationIcon = (opTypeId: string): string => {
    if (opTypeId.includes('transfert')) return 'fa-exchange-alt';
    if (opTypeId.includes('sde') || opTypeId.includes('facture')) return 'fa-file-invoice-dollar';
    if (opTypeId.includes('reabo') || opTypeId.includes('canal')) return 'fa-tv';
    if (opTypeId.includes('woyofal')) return 'fa-lightbulb';
    return 'fa-receipt';
};



export const AdminQueue: React.FC<AdminQueueProps> = ({ title, icon, items, user, description, onActionSuccess }) => {
    const [activeTab, setActiveTab] = useState<TabKey>('unassigned');
    const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
    const [currentPages, setCurrentPages] = useState({ unassigned: 1, assigned_to_me: 1, all: 1 });
    const [relatedData, setRelatedData] = useState<{ users: UserMap, agencies: AgencyMap, opTypes: OpTypeMap }>({ users: {}, agencies: {}, opTypes: {} });
    const isAdminGeneral = user.role === 'admin_general';
    const ITEMS_PER_PAGE = 5;

    // Local Modal State
    const [isAssignModalOpen, setAssignModalOpen] = useState(false);
    const [isProcessRequestModalOpen, setProcessRequestModalOpen] = useState(false);
    const [isRejectModalOpen, setRejectModalOpen] = useState(false);
    const [isConfirmValidateModalOpen, setConfirmValidateModalOpen] = useState(false);
    const [selectedItem, setSelectedItem] = useState<Transaction | Request | null>(null);
    const [itemToValidate, setItemToValidate] = useState<Transaction | null>(null);

    const { assignTask, processRequest, updateTransactionStatus } = useAdminQueue(user, () => {
        closeModal();
        onActionSuccess();
    });

    useEffect(() => {
        const fetchRelatedData = async () => {
            const { data: profiles, error: pError } = await supabase.from('profiles').select('id, name, role, agency_id');
            const { data: agencies, error: aError } = await supabase.from('agencies').select('id, name');
            const { data: opTypes, error: oError } = await supabase.from('operation_types').select('id, name, impacts_balance');

            if (pError) handleSupabaseError(pError, "Chargement des profils utilisateurs");
            if (aError) handleSupabaseError(aError, "Chargement des agences");
            if (oError) handleSupabaseError(oError, "Chargement des types d'opérations");

            if (!pError && !aError && !oError) {
                const userMap = ((profiles as any[]) || []).reduce((acc, p) => { acc[p.id] = p as UserMapValue; return acc; }, {} as UserMap);
                const agencyMap = ((agencies as any[]) || []).reduce((acc, a) => { acc[a.id] = { name: a.name }; return acc; }, {} as AgencyMap);
                const opTypeMap = ((opTypes as any[]) || []).reduce((acc, o) => { acc[o.id] = { name: o.name, impacts_balance: o.impacts_balance }; return acc; }, {} as OpTypeMap);
                setRelatedData({ users: userMap, agencies: agencyMap, opTypes: opTypeMap });
            }
        };
        fetchRelatedData();
    }, [items]); // Refetch if items change

    const closeModal = () => {
        setAssignModalOpen(false);
        setProcessRequestModalOpen(false);
        setRejectModalOpen(false);
        setConfirmValidateModalOpen(false);
        setSelectedItem(null);
        setItemToValidate(null);
    };

    const filterItems = (filter: TabKey): (Transaction | Request)[] => {
        switch (filter) {
            case 'unassigned':
                return items.filter(item => !item.assigned_to);
            case 'assigned_to_me':
                return items.filter(item => item.assigned_to === user.id);
            case 'all':
                return items;
            default:
                return [];
        }
    };

    const handleLocalAction = (e: React.MouseEvent) => {
        const button = (e.target as HTMLElement).closest('button[data-action]');
        if (!button) return;

        e.stopPropagation();

        const action = button.getAttribute('data-action');
        const id = button.getAttribute('data-id');

        if (!action || !id) return;

        const item = items.find(i => i.id === id);
        if (!item) return;

        setSelectedItem(item);

        const itemType: 'requests' | 'transactions' = 'demandeur_id' in item ? 'requests' : 'transactions';
        const taskData = { id, type: itemType };

        if (action === 'assign-self') assignTask({ ...taskData, targetUserId: user.id });
        if (action === 'unassign') assignTask({ ...taskData, targetUserId: null });
        if (action === 'assign-other') setAssignModalOpen(true);
        if (action === 'validate' && 'montant_principal' in item) {
            setItemToValidate(item as Transaction);
            setConfirmValidateModalOpen(true);
        }
        if (action === 'reject') setRejectModalOpen(true);
        if (action === 'process-request') setProcessRequestModalOpen(true);
    };

    const handleConfirmValidate = () => {
        if (itemToValidate) {
            console.log('Validation de la transaction:', itemToValidate.id);
            updateTransactionStatus(itemToValidate.id, 'Validé');
        } else {
            console.error('Aucune transaction à valider');
        }
    };

    const handlePageChange = (tab: TabKey, page: number) => {
        setCurrentPages(prev => ({ ...prev, [tab]: page }));
        setExpandedItemId(null);
    };

    const renderQueue = (currentItems: (Transaction | Request)[], tab: TabKey) => {
        const currentPage = currentPages[tab];
        const totalPages = Math.ceil(currentItems.length / ITEMS_PER_PAGE);
        const paginatedItems = currentItems.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

        if (paginatedItems.length === 0) {
            return <div className="text-center py-8 text-gray-500">
                <i className="fas fa-check-circle fa-3x text-green-400 mb-3"></i>
                <p>Aucun élément à traiter dans cette vue.</p>
            </div>;
        }

        return (
            <>
                <div className="space-y-4" onClick={handleLocalAction}>
                    {paginatedItems.map(item => {
                        const isExpanded = expandedItemId === item.id;
                        const isRequest = 'demandeur_id' in item;
                        const assignedUser = item.assigned_to ? relatedData.users[item.assigned_to] : null;

                        const getHeaderInfo = () => {
                            if (!item.assigned_to) return { bgColor: 'bg-amber-500', statusText: 'Non assignée' };
                            if (item.assigned_to === user.id) return { bgColor: 'bg-blue-600', statusText: 'Assignée à moi' };
                            return { bgColor: 'bg-slate-500', statusText: 'Assignée à ' + assignedUser?.name };
                        };

                        const { bgColor, statusText } = getHeaderInfo();

                        const tx = !isRequest ? (item as Transaction) : null;
                        const agent = tx ? relatedData.users[tx.agent_id] : null;
                        const agence = agent && agent.agency_id && relatedData.agencies[agent.agency_id] ? relatedData.agencies[agent.agency_id] : null;
                        const opType = tx ? relatedData.opTypes[tx.op_type_id] : null;
                        const opIcon = isRequest ? 'fa-info-circle' : (tx ? getOperationIcon(tx.op_type_id) : 'fa-receipt');

                        const req = isRequest ? (item as Request) : null;
                        const demandeur = req ? relatedData.users[req.demandeur_id] : null;

                        return (
                            <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden transition-shadow duration-300 hover:shadow-lg">
                                <div className={`p-3 text-white flex justify-between items-center ${bgColor}`}>
                                    <div className="flex items-center">
                                        <i className={`fas ${opIcon} fa-fw mr-3`}></i>
                                        <span className="font-bold">{isRequest ? req!.type : opType?.name}</span>
                                    </div>
                                    <span className="text-sm font-semibold">{statusText}</span>
                                </div>

                                <div className="p-4 cursor-pointer" onClick={(e) => {
                                    if ((e.target as HTMLElement).closest('button')) return;
                                    setExpandedItemId(isExpanded ? null : item.id)
                                }}>
                                    <div className="flex justify-between items-start flex-wrap gap-2">
                                        <div className="flex-grow">
                                            <div className="mb-2">
                                                <IdDisplay 
                                                    id={item.id} 
                                                    type={isRequest ? 'request' : 'transaction'}
                                                    variant="date"
                                                    date={new Date(item.created_at)}
                                                />
                                            </div>
                                            <p className="font-semibold text-gray-800 text-base">{isRequest ? req?.sujet : formatAmount(tx?.montant_principal)}</p>
                                            <p className="text-sm text-gray-600 mt-1">
                                                {isRequest ? `Par: ${demandeur?.name}` : `Par: ${agent?.name} (${agence?.name})`}
                                            </p>
                                        </div>
                                        <div className="flex flex-col items-end flex-shrink-0">
                                            <div className="flex items-center space-x-1 mb-2">
                                                {isRequest ? (
                                                    <button className="btn btn-xs btn-primary" data-action="process-request" data-id={item.id} title="Traiter la requête">Traiter</button>
                                                ) : (
                                                    <>
                                                        <button className="btn btn-xs btn-danger" data-action="reject" data-id={item.id} title="Rejeter">Rejeter</button>
                                                        <button className="btn btn-xs btn-success" data-action="validate" data-id={item.id} title="Valider">Valider</button>
                                                    </>
                                                )}
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                {item.assigned_to === user.id ? (
                                                    <button className="btn btn-xs btn-outline-secondary" data-action="unassign" data-id={item.id}>Se désassigner</button>
                                                ) : (
                                                    <button className="btn btn-xs btn-outline-secondary" data-action="assign-self" data-id={item.id}>S'assigner</button>
                                                )}
                                                {isAdminGeneral && (
                                                    <button className="btn btn-xs btn-outline-secondary" data-action="assign-other" data-id={item.id} title="Assigner à un autre"><i className="fas fa-user-plus"></i></button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    {isExpanded && (
                                        <div className="mt-3 pt-3 border-t">
                                            {isRequest ? (
                                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{req?.description}</p>
                                            ) : (
                                                <div className="text-sm text-gray-600">
                                                    {Object.entries(tx?.data as object || {}).map(([key, value]) => (
                                                        <div key={key} className="flex justify-between">
                                                            <span>{key.replace(/_/g, ' ')}:</span>
                                                            <span className="font-medium text-gray-800">{String(value)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={(p) => handlePageChange(tab, p)} />
            </>
        );
    };

    return (
        <>
            <Card title={title} icon={icon}>
                {description && <p className="mb-4 text-sm text-gray-600">{description}</p>}
                <div className="tabs">
                    <button onClick={() => setActiveTab('unassigned')} className={activeTab === 'unassigned' ? 'active' : ''}>Non Assignées ({filterItems('unassigned').length})</button>
                    <button onClick={() => setActiveTab('assigned_to_me')} className={activeTab === 'assigned_to_me' ? 'active' : ''}>Mes Tâches ({filterItems('assigned_to_me').length})</button>
                    <button onClick={() => setActiveTab('all')} className={activeTab === 'all' ? 'active' : ''}>Tout Voir ({items.length})</button>
                </div>

                <div className="tab-content mt-4">
                    {activeTab === 'unassigned' && renderQueue(filterItems('unassigned'), 'unassigned')}
                    {activeTab === 'assigned_to_me' && renderQueue(filterItems('assigned_to_me'), 'assigned_to_me')}
                    {activeTab === 'all' && renderQueue(filterItems('all'), 'all')}
                </div>
            </Card>

            <AssignTaskModal
                isOpen={isAssignModalOpen}
                onClose={closeModal}
                taskData={selectedItem ? { id: selectedItem.id, type: 'demandeur_id' in selectedItem ? 'requests' : 'transactions' } : null}
                onAssign={(targetUserId) => assignTask({ id: selectedItem!.id, type: 'demandeur_id' in selectedItem! ? 'requests' : 'transactions', targetUserId })}
            />

            <ProcessRequestModal
                isOpen={isProcessRequestModalOpen}
                onClose={closeModal}
                request={selectedItem as Request}
                onSave={(_requestId, response) => processRequest(selectedItem as Request, response)}
            />

            <RejectTransactionModal
                isOpen={isRejectModalOpen}
                onClose={closeModal}
                transaction={selectedItem as Transaction}
                onConfirm={(tx, reason) => updateTransactionStatus(tx.id, 'Rejeté', reason)}
            />

            {itemToValidate && (
                <Modal
                    id="confirm-validate-modal"
                    title="Confirmer la Validation"
                    isOpen={isConfirmValidateModalOpen}
                    onClose={closeModal}
                    size="md:max-w-lg"
                    icon={<i className="fas fa-check-circle text-xl text-green-500"></i>}
                    footer={
                        <>
                            <button type="button" className="btn btn-secondary" onClick={closeModal}>
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
                        <div className="flex justify-between items-center">
                            <span>ID:</span> 
                            <IdDisplay 
                                id={itemToValidate.id} 
                                type="transaction"
                                variant="date"
                                date={new Date(itemToValidate.created_at)}
                            />
                        </div>
                        <div className="flex justify-between mt-2"><span>Montant:</span> <strong>{formatAmount(itemToValidate.montant_principal)}</strong></div>
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