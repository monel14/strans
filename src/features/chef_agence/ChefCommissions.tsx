
import React, { useState, useEffect } from 'react';
import { PageComponentProps, ChefAgence, Transaction, OperationType, Agent } from '../../types';
import { Card } from '../../components/common/Card';
import { Table } from '../../components/common/Table';
import { formatAmount, formatDate } from '../../utils/formatters';
import { formatShortId } from '../../utils/idFormatters';
import { supabase } from '../../supabaseClient';
import { handleSupabaseError } from '../../utils/errorUtils';
import { useChefActions } from '../../hooks/useChefActions';

const AgentCommissionLeaderboard: React.FC<{ agencyId: string }> = ({ agencyId }) => {
    const [leaderboard, setLeaderboard] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            setLoading(true);
            const { data: agentsData, error: agentsError } = await supabase
                .from('profiles')
                .select('id, name, avatar_seed, role, agency_id')
                .eq('role', 'agent')
                .eq('agency_id', agencyId);
            
            if (agentsError) {
                handleSupabaseError(agentsError, "Chargement des agents pour le classement");
                setLoading(false);
                return;
            }

            const agents = ((agentsData as unknown as Agent[]) ?? []);
            const agentIds = agents.map((a) => a.id);
            if (agentIds.length === 0) {
                setLeaderboard([]);
                setLoading(false);
                return;
            }

            const { data: transactionsData, error: txError } = await supabase
                .from('transactions')
                .select('agent_id, commission_generee')
                .in('agent_id', agentIds)
                .eq('status', 'Validé');

            if (txError) {
                handleSupabaseError(txError, "Chargement des transactions pour le classement des commissions");
                setLoading(false);
                return;
            }

            const transactions = ((transactionsData as unknown as Transaction[]) ?? []);
            const commissionsByAgent = transactions.reduce((acc: Record<string, number>, tx) => {
                if (tx.agent_id) {
                    acc[tx.agent_id] = (acc[tx.agent_id] || 0) + tx.commission_generee;
                }
                return acc;
            }, {} as Record<string, number>);

            const agentsWithCommissions = agents.map((agent) => ({
                ...agent,
                commissionsGenerated: commissionsByAgent[agent.id] || 0
            })).sort((a,b) => b.commissionsGenerated - a.commissionsGenerated).slice(0, 5);

            setLeaderboard(agentsWithCommissions);
            setLoading(false);
        };
        fetchLeaderboard();
    }, [agencyId]);

    if (loading) return <div>Chargement du classement...</div>;

    return (
        <div className="space-y-3">
            {leaderboard.length > 0 ? leaderboard.map((agent, index) => (
                <div key={agent.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                        <span className="font-bold text-gray-500 w-6 mr-2">#{index + 1}</span>
                        <img src={`https://placehold.co/40x40/E2E8F0/4A5568?text=${agent.avatar_seed}`} alt={agent.name} className="w-10 h-10 rounded-full mr-3"/>
                        <p className="font-semibold text-gray-800">{agent.name}</p>
                    </div>
                    <p className="font-bold text-green-600">{formatAmount(agent.commissionsGenerated)}</p>
                </div>
            )) : <p className="text-center text-gray-500 py-4">Aucune commission générée par les agents ce mois-ci.</p>}
        </div>
    );
};


export const ChefCommissions: React.FC<PageComponentProps> = ({ user, refreshCurrentUser }) => {
    const chefUser = user as ChefAgence;
    const { openTransferCommissionsModal } = useChefActions(chefUser, refreshCurrentUser!);
    const [personalTxs, setPersonalTxs] = useState<Transaction[]>([]);
    const [opTypes, setOpTypes] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPersonalTxs = async () => {
            setLoading(true);
            
            const { data, error } = await supabase
                .from('transactions')
                .select('id, created_at, op_type_id, montant_principal, commission_generee')
                .eq('agent_id', chefUser.id)
                .eq('status', 'Validé')
                .gt('commission_generee', 0)
                .order('created_at', { ascending: false });

            if (error) {
                handleSupabaseError(error, "Chargement des transactions personnelles");
            } else {
                setPersonalTxs((data as unknown as Transaction[]) ?? []);
            }

            const { data: opTypesData, error: opTypesError } = await supabase
                .from('operation_types')
                .select('id, name');

            if (opTypesError) {
                handleSupabaseError(opTypesError, "Chargement des types d'opérations");
            } else {
                const opTypesMap = ((opTypesData as unknown as {id: string, name: string}[]) ?? []).reduce((acc, op) => {
                    acc[op.id] = op.name;
                    return acc;
                }, {} as Record<string, string>);
                setOpTypes(opTypesMap);
            }
            setLoading(false);
        };
        fetchPersonalTxs();
    }, [chefUser.id]);

    const headers = ['Date Op.', 'ID Op.', 'Type Op.', 'Montant Op.', 'Commission Générée'];
    const rows = personalTxs.map(t => [
        formatDate(t.created_at).split(' ')[0],
        formatShortId(t.id, 'transaction'),
        opTypes[t.op_type_id] || t.op_type_id,
        formatAmount(t.montant_principal),
        formatAmount(t.commission_generee)
    ]);
    
    if (loading) return <div>Chargement...</div>;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
                <Card title="Mes Commissions Personnelles" icon="fa-coins">
                    <div className="p-4 mb-4 bg-purple-50 border border-purple-200 rounded-lg flex justify-between items-center">
                        <p className="text-lg">Commissions Personnelles Dues : <span className="font-bold text-purple-600">{formatAmount(chefUser.commissions_dues || 0)}</span></p>
                        <button className="btn btn-primary" onClick={openTransferCommissionsModal}>
                            <i className="fas fa-exchange-alt mr-2"></i>Virer vers Solde
                        </button>
                    </div>
                    <Table headers={headers} rows={rows} caption="Détail de vos commissions personnelles" tableClasses="w-full table table-sm" />
                </Card>
            </div>
            <div className="lg:col-span-1">
                 <Card title="Top Agents (Commissions)" icon="fa-trophy">
                    {chefUser.agency_id ? 
                        <AgentCommissionLeaderboard agencyId={chefUser.agency_id} /> :
                        <p>Vous n'êtes assigné à aucune agence.</p>
                    }
                </Card>
            </div>
        </div>
    );
};
