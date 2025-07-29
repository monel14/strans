import React, { useState, useEffect, useMemo } from 'react';
import { PageComponentProps, ChefAgence, Agent, Transaction, OperationType, FormField, CommissionConfig } from '../../types';
import { formatAmount, timeAgo } from '../../utils/formatters';
import { supabase } from '../../supabaseClient';
import { PageHeader } from '../../components/common/PageHeader';
import { handleSupabaseError } from '../../utils/errorUtils';
import { ActionCard } from '../../components/common/ActionCard';
import { Card } from '../../components/common/Card';
import { LineChart } from '../../components/charts/LineChart';
import { DoughnutChart } from '../../components/charts/DoughnutChart';

const StatCard: React.FC<{ title: string; value: string | number; icon: string, className?: string, iconBgColor?: string }> = ({ title, value, icon, className, iconBgColor = 'bg-blue-100 dark:bg-blue-900/50' }) => (
    <div className={`bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 flex items-center transition-all duration-300 hover:shadow-xl hover:scale-105 ${className}`}>
        <div className={`p-3 rounded-lg ${iconBgColor} text-blue-600 dark:text-blue-300 mr-4`}>
            <i className={`fas ${icon} fa-lg`}></i>
        </div>
        <div>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{title}</p>
            <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{value}</p>
        </div>
    </div>
);

interface ChefDashboardStats {
    commissions_dues: number;
    agents_actifs: number;
    volume_agence_mois: number;
    commissions_agence_mois: number;
    pending_recharge_count: number;
}

const chartColors = [
  '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#f97316', '#f59e0b', '#14b8a6'
];

export const ChefAgenceDashboard: React.FC<PageComponentProps> = ({ user, navigateTo, refreshCurrentUser, refreshKey, chefActions }) => {
    const chefUser = user as ChefAgence;
    const { openSelfRechargeModal, openNewOperationModal } = chefActions!;
    const [stats, setStats] = useState<ChefDashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [lineChartData, setLineChartData] = useState<any>(null);
    const [doughnutChartData, setDoughnutChartData] = useState<any>(null);
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [topAgents, setTopAgents] = useState<{ agent: Agent, volume: number }[]>([]);
    const [agents, setAgents] = useState<Agent[]>([]);
    const [opTypeMap, setOpTypeMap] = useState<Record<string, string>>({});

    useEffect(() => {
        const fetchData = async () => {
            if (!chefUser.agency_id) {
                setLoading(false);
                return;
            }
            setLoading(true);

            // Parallel fetching
            const [statsRes, agentsRes, opTypesRes] = await Promise.all([
                supabase.rpc('get_chef_dashboard_stats', { p_chef_id: user.id }),
                supabase.from('profiles').select('*').eq('agency_id', chefUser.agency_id),
                supabase.from('operation_types').select('id, name')
            ]);
            
            if (statsRes.error) handleSupabaseError(statsRes.error, "Chargement des statistiques");
            else setStats(statsRes.data as unknown as ChefDashboardStats);
            
            if (agentsRes.error) handleSupabaseError(agentsRes.error, "Chargement des agents");
            if (opTypesRes.error) handleSupabaseError(opTypesRes.error, "Chargement des types d'opérations");

            const agentsList = (agentsRes.data as unknown as Agent[]) ?? [];
            setAgents(agentsList);
            const agentIds = agentsList.map(a => a.id);

            const opTypesList = (opTypesRes.data as {id: string, name: string}[]) ?? [];
            const newOpTypeMap = opTypesList.reduce((acc, op) => ({ ...acc, [op.id]: op.name }), {} as Record<string, string>);
            setOpTypeMap(newOpTypeMap);
            
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            
            const { data: txsData, error: txsError } = await supabase
                .from('transactions')
                .select('*')
                .in('agent_id', agentIds)
                .gte('created_at', thirtyDaysAgo.toISOString())
                .order('created_at', { ascending: false });

            if (txsError) handleSupabaseError(txsError, "Chargement des transactions");
            
            if (txsData) {
                const transactions = txsData as Transaction[];
                setRecentTransactions(transactions.slice(0, 5));

                // Process data for Line Chart (Volume last 7 days)
                const last7Days = Array.from({ length: 7 }, (_, i) => {
                    const d = new Date();
                    d.setDate(d.getDate() - i);
                    return d.toISOString().split('T')[0];
                }).reverse();
                
                const volumeByDay = last7Days.reduce((acc, day) => ({ ...acc, [day]: 0 }), {} as Record<string, number>);
                
                transactions.forEach(tx => {
                    const day = tx.created_at.split('T')[0];
                    if (volumeByDay[day] !== undefined) {
                        volumeByDay[day] += Number(tx.montant_total || 0);
                    }
                });
                
                setLineChartData({
                    labels: last7Days.map(d => new Date(d).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' })),
                    datasets: [{
                        label: 'Volume',
                        data: Object.values(volumeByDay),
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        fill: true,
                        tension: 0.4,
                    }]
                });

                // Process data for Doughnut Chart (Operations breakdown)
                const opCount = transactions.reduce((acc: Record<string, number>, tx) => {
                    acc[tx.op_type_id] = (acc[tx.op_type_id] || 0) + 1;
                    return acc;
                }, {});

                setDoughnutChartData({
                    labels: Object.keys(opCount).map(id => newOpTypeMap[id] || 'Inconnu'),
                    datasets: [{
                        label: 'Opérations',
                        data: Object.values(opCount),
                        backgroundColor: chartColors.map(c => `${c}B3`),
                        borderColor: chartColors,
                        borderWidth: 1,
                    }]
                });

                // Process data for Top Agents
                const volumeByAgent = transactions.reduce((acc: Record<string, number>, tx) => {
                    acc[tx.agent_id] = (acc[tx.agent_id] || 0) + Number(tx.montant_total || 0);
                    return acc;
                }, {} as Record<string, number>);

                const sortedAgents = Object.entries(volumeByAgent)
                    .map(([agentId, volume]) => ({ agent: agentsList.find(a => a.id === agentId), volume }))
                    .filter(item => item.agent)
                    .sort((a, b) => Number(b.volume) - Number(a.volume))
                    .slice(0, 3);
                
                setTopAgents(sortedAgents as { agent: Agent, volume: number }[]);
            }
            setLoading(false);
        };
        fetchData();
    }, [user.id, chefUser.agency_id, refreshKey]);

    if (loading) return <div>Chargement du tableau de bord...</div>;

    return (
        <>
            <PageHeader
                title={`Tableau de Bord, ${user.name}`}
                subtitle="Vue d'ensemble de votre activité et de celle de votre agence."
                icon="fa-chart-line"
                gradient="from-blue-600 to-cyan-600"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard title="Mon Solde" value={formatAmount(chefUser.solde)} icon="fa-wallet" />
                <StatCard title="Commissions Dues" value={formatAmount(stats?.commissions_dues)} icon="fa-coins" iconBgColor="bg-purple-100 dark:bg-purple-900/50" />
                <StatCard title="Volume Agence (Mois)" value={formatAmount(stats?.volume_agence_mois)} icon="fa-chart-bar" />
                <StatCard title="Recharges à Approuver" value={stats?.pending_recharge_count || 0} icon="fa-hourglass-half" iconBgColor="bg-orange-100 dark:bg-orange-900/50" />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card title="Volume des transactions (7 derniers jours)" icon="fa-chart-area">
                        {lineChartData ? <LineChart chartData={lineChartData} /> : <p className="text-center p-8 text-gray-500">Données insuffisantes pour le graphique.</p>}
                    </Card>
                    <Card title="Dernières Transactions de l'Agence" icon="fa-history">
                        <div className="space-y-2">
                           {recentTransactions.length > 0 ? recentTransactions.map(tx => (
                               <div key={tx.id} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-md">
                                   <div className="flex items-center">
                                       <img src={`https://placehold.co/32x32/E2E8F0/4A5568?text=${agents.find(a=>a.id === tx.agent_id)?.avatar_seed}`} alt="avatar" className="w-8 h-8 rounded-full mr-3"/>
                                       <div>
                                           <p className="font-medium text-gray-700">{agents.find(a=>a.id === tx.agent_id)?.name}</p>
                                           <p className="text-xs text-gray-500">{opTypeMap[tx.op_type_id]}</p>
                                       </div>
                                   </div>
                                   <div className="text-right">
                                       <p className="font-bold text-gray-800">{formatAmount(tx.montant_total)}</p>
                                       <p className="text-xs text-gray-400">{timeAgo(tx.created_at)}</p>
                                   </div>
                               </div>
                           )) : <p className="text-center p-8 text-gray-500">Aucune transaction récente.</p>}
                        </div>
                    </Card>
                </div>
                <div className="lg:col-span-1 space-y-6">
                    <Card title="Répartition par Service" icon="fa-pie-chart">
                        {doughnutChartData ? <DoughnutChart chartData={doughnutChartData} /> : <p className="text-center p-8 text-gray-500">Aucune donnée à afficher.</p>}
                    </Card>
                    <Card title="Top Agents (Volume)" icon="fa-trophy">
                        <div className="space-y-3">
                            {topAgents.length > 0 ? topAgents.map((item, index) => (
                                <div key={item.agent.id} className="flex items-center">
                                    <span className="font-bold text-lg text-gray-400 w-6">#{index + 1}</span>
                                    <img src={`https://placehold.co/32x32/E2E8F0/4A5568?text=${item.agent.avatar_seed}`} alt="avatar" className="w-8 h-8 rounded-full mx-2"/>
                                    <p className="flex-grow font-medium text-gray-700">{item.agent.name}</p>
                                    <p className="font-semibold text-green-600">{formatAmount(item.volume)}</p>
                                </div>
                            )) : <p className="text-center p-4 text-gray-500">Pas encore de données.</p>}
                        </div>
                    </Card>
                    <Card title="Actions Rapides" icon="fa-bolt">
                        <div className="space-y-3">
                             <ActionCard title="Initier une Opération" description="Effectuez un transfert, payez une facture, etc." icon="fa-paper-plane" onClick={openNewOperationModal} colorGradient="from-blue-500 to-purple-500"/>
                             <ActionCard title="Approuver les Recharges" description="Validez les demandes de vos agents." icon="fa-check-double" onClick={() => navigateTo('Gestion des Agents')} colorGradient="from-orange-500 to-yellow-500"/>
                             <ActionCard title="Recharger mon Solde" description="Créditez votre propre compte." icon="fa-funnel-dollar" onClick={openSelfRechargeModal} colorGradient="from-green-500 to-teal-500"/>
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
};