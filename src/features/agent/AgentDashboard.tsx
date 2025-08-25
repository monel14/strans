import React, { useState, useEffect } from 'react';
import { PageComponentProps, Agent, Transaction, OperationType, CommissionConfig, FormField } from '../../types';
import { formatAmount, timeAgo } from '../../utils/formatters';
import { supabase } from '../../supabaseClient';
import { handleSupabaseError } from '../../utils/errorUtils';
import { PageHeader } from '../../components/common/PageHeader';
import { ActionCard } from '../../components/common/ActionCard';

interface AgentDashboardStats {
    transactions_this_month: number;
    commissions_mois_estimees: number;
}

const StatCard: React.FC<{ title: string; value: string | number; icon: string; color: string }> = ({ title, value, icon, color }) => (
    <div className={`rounded-2xl p-5 text-white relative overflow-hidden shadow-lg transition-transform transform hover:-translate-y-1 ${color}`}>
        <div className="relative z-10">
            <div className="flex items-center text-sm font-medium opacity-90 mb-2">
                <i className={`fas ${icon} mr-2`}></i>
                <span>{title}</span>
            </div>
            <p className="text-3xl font-bold">{value}</p>
        </div>
        <div className="absolute -bottom-6 -right-6 w-20 h-20 bg-white/10 rounded-full"></div>
    </div>
);


const TransactionListItem: React.FC<{ transaction: Transaction, opType?: OperationType }> = ({ transaction, opType }) => {
    let details = '';
    if (transaction.data && typeof transaction.data === 'object' && transaction.data !== null && !Array.isArray(transaction.data)) {
        const dataObj = transaction.data as Record<string, any>;
        if (opType?.id === 'op_transfert_nat') {
            // Support des anciens et nouveaux formats de données
            const beneficiaire = dataObj.nom_beneficiaire || dataObj.destinataire;
            const lieu = dataObj.lieu;
            if (beneficiaire) {
                details = `vers ${beneficiaire}`;
            } else if (lieu) {
                details = `vers ${lieu}`;
            }
        }
        else if (opType?.id === 'op_paiement_sde') details = `Facture ${dataObj.num_facture_sde || dataObj.numero_facture || ''}`;
        else if (opType?.id === 'op_reabo_canal') details = `Décodeur ${dataObj.num_decodeur_canal || dataObj.numero_decodeur || ''}`;
        else if (opType?.id === 'op_paiement_woyofal') details = `Client ${dataObj.nom_client || dataObj.client || ''}`;
    }

    const getIcon = () => {
        const name = opType?.name || '';
        if (name.includes('Transfert')) return 'fa-exchange-alt';
        if (name.includes('Paiement')) return 'fa-file-invoice-dollar';
        if (name.includes('abonnement')) return 'fa-tv';
        return 'fa-receipt';
    };

    return (
        <div className="flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 rounded-lg transition-colors duration-200">
            <div className="flex items-center truncate">
                <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mr-4 flex-shrink-0">
                    <i className={`fas ${getIcon()} text-gray-500 dark:text-gray-400`}></i>
                </div>
                <div className="truncate">
                    <p className="font-semibold text-gray-800 dark:text-gray-100 truncate">{opType?.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{details}</p>
                </div>
            </div>
            <div className="text-right flex-shrink-0 ml-2">
                <p className={`font-bold ${opType?.impacts_balance ? 'text-red-500 dark:text-red-400' : 'text-green-500 dark:text-green-400'}`}>
                    {opType?.impacts_balance ? '-' : '+'} {formatAmount(transaction.montant_principal)}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(transaction.created_at)}</p>
            </div>
        </div>
    );
};

export const AgentDashboard: React.FC<PageComponentProps> = ({ user, navigateTo, refreshCurrentUser, refreshKey, agentActions }) => {
    const agentUser = user as Agent;
    const { openNewOperationModal, openRechargeModal } = agentActions!;
    
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [opTypes, setOpTypes] = useState<OperationType[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ transactionsThisMonth: 0, commissionsMoisEstimees: 0 });

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            const { data: statsData, error: statsError } = await supabase.rpc('get_agent_dashboard_stats', { p_agent_id: agentUser.id });
            const { data: trxData, error: trxError } = await supabase.from('transactions').select('id, created_at, agent_id, op_type_id, data, montant_principal, frais, montant_total, status, proof_url, commission_generee, validateur_id, motif_rejet, assigned_to').eq('agent_id', agentUser.id).order('created_at', { ascending: false }).limit(5);
            const { data: opTypesData, error: opTypesError } = await supabase.from('operation_types').select('id, name, description, impacts_balance, proof_is_required, status, fields, commission_config');
            
            if (statsError) {
                handleSupabaseError(statsError, "Chargement des statistiques du tableau de bord");
            } else if (statsData) {
                 const data = statsData as unknown as AgentDashboardStats;
                 setStats({
                    transactionsThisMonth: data.transactions_this_month || 0,
                    commissionsMoisEstimees: data.commissions_mois_estimees || 0,
                });
            }

            if (trxError) {
                handleSupabaseError(trxError, "Chargement des transactions récentes");
            } else {
                setRecentTransactions((trxData as unknown as Transaction[]) ?? []);
            }

            if (opTypesError) {
                handleSupabaseError(opTypesError, "Chargement des types d'opérations");
            } else {
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
    }, [agentUser.id, refreshKey]);

    if (loading) return <div>Chargement du tableau de bord...</div>;

    return (
        <>
            <PageHeader 
                title={`Accueil, ${user.name}`}
                subtitle="Bienvenue sur votre espace personnel. Gérez vos opérations et suivez vos performances."
                icon="fa-chart-pie"
                gradient="from-blue-600 to-cyan-600"
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                <StatCard title="Solde Actuel" value={formatAmount(agentUser.solde)} icon="fa-wallet" color="bg-gradient-to-br from-blue-500 to-blue-600" />
                <StatCard title="Transactions (Mois)" value={stats.transactionsThisMonth} icon="fa-chart-bar" color="bg-gradient-to-br from-green-500 to-green-600" />
                 
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 flex items-center">
                            <i className="fas fa-history mr-3 text-blue-500"></i>Activité Récente
                        </h3>
                         <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('Opérations'); }} className="text-blue-600 dark:text-blue-400 hover:underline text-sm font-semibold">
                            Voir tout <i className="fas fa-arrow-right text-xs"></i>
                         </a>
                     </div>
                     <div className="space-y-2">
                        {recentTransactions.length > 0 ? 
                            recentTransactions.map(op => <TransactionListItem key={op.id} transaction={op} opType={opTypes.find(ot => ot.id === op.op_type_id)} />) :
                            <p className="text-center text-gray-500 dark:text-gray-400 py-4">Aucune transaction récente.</p>
                        }
                     </div>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6">
                        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center">
                            <i className="fas fa-bolt mr-3 text-blue-500"></i>Actions Rapides
                        </h3>
                        <div className="space-y-4">
                            <ActionCard 
                                title="Initier une Opération"
                                description="Effectuez un transfert, payez une facture, et plus encore."
                                icon="fa-paper-plane"
                                onClick={openNewOperationModal}
                                colorGradient="from-blue-500 to-purple-500"
                            />
                            <ActionCard 
                                title="Demander une Recharge"
                                description="Augmentez votre solde pour continuer vos opérations."
                                icon="fa-wallet"
                                onClick={openRechargeModal}
                                colorGradient="from-green-500 to-teal-500"
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};