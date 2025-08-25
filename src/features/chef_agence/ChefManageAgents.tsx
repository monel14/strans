import React, { useState, useMemo, useEffect } from 'react';
import { PageComponentProps, ChefAgence, Agent, AgentRechargeRequest } from '../../types';
import { Card } from '../../components/common/Card';
import { formatAmount, timeAgo } from '../../utils/formatters';
import { Pagination } from '../../components/common/Pagination';
import { useAgencyAgents } from '../../hooks/useAgencyAgents';
import { CreateEditAgentModal } from './CreateEditAgentModal';
import { SuspendUserModal } from '../admin/SuspendUserModal';
import { getBadgeClass } from '../../utils/uiHelpers';
import { PageHeader } from '../../components/common/PageHeader';
import { supabase } from '../../supabaseClient';
import { handleSupabaseError } from '../../utils/errorUtils';
import { useChefActions } from '../../hooks/useChefActions';

const StatCard: React.FC<{ title: string; value: string | number; icon: string, color: string }> = ({ title, value, icon, color }) => (
    <div className={`bg-white dark:bg-gray-800 p-5 rounded-xl shadow-lg flex items-center space-x-4 border-l-4 ${color}`}>
        <div className={`text-3xl ${color.replace('border-', 'text-')}`}><i className={`fas ${icon}`}></i></div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        </div>
    </div>
);

const RechargeRequestCard: React.FC<{ request: AgentRechargeRequest, agent?: Agent, onApprove: (request: AgentRechargeRequest) => void, onReject: (request: AgentRechargeRequest) => void }> = ({ request, agent, onApprove, onReject }) => (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md flex items-center justify-between flex-wrap gap-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
            <img src={`https://placehold.co/40x40/E2E8F0/4A5568?text=${agent?.avatar_seed}`} alt={agent?.name} className="w-10 h-10 rounded-full"/>
            <div>
                <p className="font-semibold text-gray-700 dark:text-gray-200">{agent?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(request.created_at)}</p>
            </div>
        </div>
        <div className="text-right">
            <p className="font-bold text-lg text-green-600 dark:text-green-400">{formatAmount(request.amount)}</p>
            {request.motif && <p className="text-xs text-gray-500 italic truncate max-w-[150px]" title={request.motif}>"{request.motif}"</p>}
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
            <button className="btn btn-sm btn-danger flex-1" onClick={() => onReject(request)}>
                <i className="fas fa-times mr-1"></i> Rejeter
            </button>
            <button className="btn btn-sm btn-success flex-1" onClick={() => onApprove(request)}>
                <i className="fas fa-check mr-1"></i> Approuver
            </button>
        </div>
    </div>
);

const AgentCard: React.FC<{ agent: Agent; onEdit: () => void; onSuspend: () => void; onRecharge: () => void; }> = ({ agent, onEdit, onSuspend, onRecharge }) => {
    const isActive = agent.status === 'active';
    return (
        <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-lg p-5 flex flex-col justify-between hover:shadow-xl transition-all duration-300 h-full hover:scale-[1.02] group ${!isActive ? 'opacity-70' : ''}`}>
            <div>
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                         <div className="relative">
                            <img src={`https://placehold.co/48x48/E2E8F0/4A5568?text=${agent.avatar_seed}`} alt={agent.name} className="w-12 h-12 rounded-full"/>
                            <span className={`absolute -bottom-1 -right-1 block h-4 w-4 rounded-full border-2 border-white ${isActive ? 'bg-green-500' : 'bg-red-500'}`}></span>
                         </div>
                        <div>
                            <h4 className="font-bold text-gray-800 dark:text-gray-100 group-hover:text-blue-600 transition-colors">{agent.name}</h4>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-xs">{agent.email}</p>
                        </div>
                    </div>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-gray-500">Solde:</span>
                        <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{formatAmount(agent.solde)}</span>
                    </div>
                    {agent.status === 'suspended' && agent.suspension_reason && (
                        <div className="pt-2">
                            <p className="text-xs text-red-600 bg-red-50 p-2 rounded-md"><i className="fas fa-info-circle mr-1"></i>{agent.suspension_reason}</p>
                        </div>
                    )}
                </div>
            </div>
            <div className="pt-4 mt-4 flex items-center justify-end space-x-2">
                <button className="btn btn-sm btn-outline-secondary" onClick={onRecharge} disabled={!isActive} title="Recharger directement"><i className="fas fa-wallet"></i></button>
                <button className="btn btn-sm btn-outline-secondary" onClick={onEdit} title="Modifier l'agent"><i className="fas fa-edit"></i></button>
                <button className={`btn btn-sm ${isActive ? 'btn-outline-danger' : 'btn-outline-success'}`} onClick={onSuspend} title={isActive ? 'Suspendre' : 'Réactiver'}>
                    <i className={`fas ${isActive ? 'fa-ban' : 'fa-check'}`}></i>
                </button>
            </div>
        </div>
    )
};

export const ChefManageAgents: React.FC<PageComponentProps> = ({ user, refreshCurrentUser }) => {
    const chefUser = user as ChefAgence;
    const { agents, loading: agentsLoading, saveAgent, toggleAgentStatus, refetchAgents } = useAgencyAgents(chefUser.agency_id);
    const { openRechargeAgentModal, openApproveRechargeModal, openRejectRechargeModal } = useChefActions(chefUser, refreshCurrentUser!);
    
    const [rechargeRequests, setRechargeRequests] = useState<AgentRechargeRequest[]>([]);
    const [rechargeLoading, setRechargeLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [currentPage, setCurrentPage] = useState(1);
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isSuspendModalOpen, setSuspendModalOpen] = useState(false);
    const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

    const fetchRechargeRequests = async () => {
        if (!chefUser.agency_id) return;
        setRechargeLoading(true);
        const { data, error } = await supabase
            .from('agent_recharge_requests')
            .select('*')
            .eq('chef_agence_id', chefUser.id)
            .order('created_at', { ascending: false });
        
        if (error) handleSupabaseError(error, "Chargement des demandes de recharge");
        else setRechargeRequests((data as unknown as AgentRechargeRequest[]) ?? []);
        setRechargeLoading(false);
    };

    useEffect(() => {
        fetchRechargeRequests();
    }, [chefUser.id]);

    const openEditModal = (agent: Agent | null) => { setSelectedAgent(agent); setEditModalOpen(true); };
    const openSuspendModal = (agent: Agent) => { setSelectedAgent(agent); setSuspendModalOpen(true); };
    
    const closeModal = () => {
        setSelectedAgent(null);
        setEditModalOpen(false);
        setSuspendModalOpen(false);
        refetchAgents();
        fetchRechargeRequests();
    };

    const handleSaveAgent = async (agentData: Partial<Agent>, password?: string) => { await saveAgent(agentData, password); closeModal(); };
    const handleConfirmSuspend = async (agent: Agent, reason: string | null) => { await toggleAgentStatus(agent, reason); closeModal(); };
    const handleRechargeAgent = (agent: Agent) => openRechargeAgentModal(agent);
    const handleApprove = (request: AgentRechargeRequest) => openApproveRechargeModal({ request, agent: agents.find(a => a.id === request.agent_id)! });
    const handleReject = (request: AgentRechargeRequest) => openRejectRechargeModal(request);

    const agentStats = useMemo(() => {
        const totalBalance = agents.reduce((sum, agent) => sum + (agent.solde || 0), 0);
        const activeAgents = agents.filter(a => a.status === 'active').length;
        const pendingRequests = rechargeRequests.filter(r => ['En attente', 'en attente'].includes(r.status)).length;
        return { totalBalance, activeAgents, pendingRequests };
    }, [agents, rechargeRequests]);

    const filteredAgents = useMemo(() => {
        return agents.filter(agent => {
            const matchesSearch = (agent.name || '').toLowerCase().includes(searchTerm.toLowerCase()) || (agent.email || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'all' || agent.status === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [agents, searchTerm, statusFilter]);

    const ITEMS_PER_PAGE_AGENTS = 6;
    const totalPagesAgents = Math.ceil(filteredAgents.length / ITEMS_PER_PAGE_AGENTS);
    const paginatedAgents = useMemo(() => filteredAgents.slice((currentPage - 1) * ITEMS_PER_PAGE_AGENTS, currentPage * ITEMS_PER_PAGE_AGENTS), [filteredAgents, currentPage]);
    
    const pendingRechargeRequests = useMemo(() => rechargeRequests.filter(r => ['En attente', 'en attente'].includes(r.status)), [rechargeRequests]);
    const processedRechargeRequests = useMemo(() => rechargeRequests.filter(r => !['En attente', 'en attente'].includes(r.status)), [rechargeRequests]);

    if (agentsLoading || rechargeLoading) return <div>Chargement de la gestion des agents...</div>;
    if (!chefUser.agency_id) return <Card title="Équipe" icon="fa-users-cog"><p>Vous n'êtes assigné à aucune agence.</p></Card>;

    return (
        <>
            <PageHeader title="Équipe" subtitle="Supervisez les comptes, les soldes et les demandes de vos agents." icon="fa-users-cog" gradient="from-green-500 to-teal-500" />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard title="Nombre d'Agents" value={`${agentStats.activeAgents} / ${agents.length}`} icon="fa-users" color="border-blue-500" />
                <StatCard title="Solde Total Agents" value={formatAmount(agentStats.totalBalance)} icon="fa-coins" color="border-green-500" />
                <StatCard title="Demandes en Attente" value={agentStats.pendingRequests} icon="fa-hourglass-half" color="border-orange-500" />
                <StatCard title="Ma Commission (Dues)" value={formatAmount(user.commissions_dues)} icon="fa-percent" color="border-purple-500" />
            </div>

            {pendingRechargeRequests.length > 0 && (
                <Card title="Demandes de Recharge en Attente" icon="fa-hourglass-half" className="mb-6">
                    <div className="space-y-4">
                        {pendingRechargeRequests.map(req => (
                            <RechargeRequestCard key={req.id} request={req} agent={agents.find(a => a.id === req.agent_id)} onApprove={handleApprove} onReject={handleReject} />
                        ))}
                    </div>
                </Card>
            )}

            <Card title="Tous les Agents" icon="fa-users">
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <div className="flex items-center gap-4">
                        <input type="text" placeholder="Rechercher un agent..." className="form-input max-w-xs" value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }} />
                        <select className="form-select" value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
                            <option value="all">Tous les statuts</option>
                            <option value="active">Actif</option>
                            <option value="suspended">Suspendu</option>
                        </select>
                    </div>
                    <button className="btn btn-primary" onClick={() => openEditModal(null)}>
                        <i className="fas fa-plus-circle mr-2"></i>Créer un Agent
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {paginatedAgents.map(agent => <AgentCard key={agent.id} agent={agent} onEdit={() => openEditModal(agent)} onSuspend={() => openSuspendModal(agent)} onRecharge={() => handleRechargeAgent(agent)} />)}
                </div>
                {filteredAgents.length === 0 && <p className="text-center py-8 text-gray-500">Aucun agent trouvé.</p>}

                <Pagination currentPage={currentPage} totalPages={totalPagesAgents} onPageChange={setCurrentPage} />
            </Card>
            
             <Card title="Historique des Demandes Récentes" icon="fa-history" className="mt-6">
                <div className="overflow-x-auto">
                     <table className="w-full table table-sm">
                        <thead><tr><th>Agent</th><th>Date</th><th>Montant</th><th>Statut</th></tr></thead>
                        <tbody>
                            {processedRechargeRequests.slice(0, 5).map(req => (
                                <tr key={req.id}>
                                    <td>{agents.find(a => a.id === req.agent_id)?.name || 'N/A'}</td>
                                    <td>{timeAgo(req.created_at)}</td>
                                    <td>{formatAmount(req.amount)}</td>
                                    <td><span className={`badge ${getBadgeClass(req.status)}`}>{req.status}</span></td>
                                </tr>
                            ))}
                            {processedRechargeRequests.length === 0 && <tr><td colSpan={4} className="text-center p-4">Aucune demande traitée.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </Card>

            <CreateEditAgentModal isOpen={isEditModalOpen} onClose={closeModal} agentToEdit={selectedAgent} onSave={handleSaveAgent} agencyId={chefUser.agency_id!} />
            <SuspendUserModal isOpen={isSuspendModalOpen} onClose={closeModal} user={selectedAgent} onConfirm={(user, reason) => handleConfirmSuspend(user as Agent, reason)} />
        </>
    );
};
