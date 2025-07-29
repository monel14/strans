



import React, { useState, useEffect } from 'react';
import { PageComponentProps, SousAdmin } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { supabase } from '../../supabaseClient';
import { handleSupabaseError } from '../../utils/errorUtils';

const StatCard: React.FC<{ title: string; value: string | number; icon: string, actionText: string; onClick: () => void, color: string }> = ({ title, value, icon, actionText, onClick, color }) => (
    <div className={`rounded-xl shadow-lg p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:scale-105 ${color}`}>
        <div>
            <div className="flex items-center text-white mb-2">
                <i className={`fas ${icon} fa-lg mr-3`}></i>
                <h3 className="font-semibold">{title}</h3>
            </div>
            <p className="text-4xl font-bold text-white">{value}</p>
            <p className="text-sm text-white opacity-80">en attente</p>
        </div>
        <button className="mt-4 bg-white/20 text-white font-semibold py-2 px-4 rounded-lg hover:bg-white/30 transition-colors w-full" onClick={onClick}>
            {actionText} <i className="fas fa-arrow-right ml-2 text-xs"></i>
        </button>
    </div>
);

interface SousAdminDashboardStats {
    my_assigned_transactions_count: number;
    my_assigned_requests_count: number;
    unassigned_transactions_count: number;
    unassigned_requests_count: number;
}


export const SousAdminDashboard: React.FC<PageComponentProps> = ({ user, navigateTo, refreshKey }) => {
    const [stats, setStats] = useState({
        myAssignedTransactions: 0,
        myAssignedRequests: 0,
        unassignedTransactions: 0,
        unassignedRequests: 0,
    });
    const [loading, setLoading] = useState(true);
    const sousAdminUser = user as SousAdmin;
    
    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .rpc('get_sous_admin_dashboard_stats', { p_sous_admin_id: user.id });

            if (error) {
                console.error("Error fetching sous-admin stats:", error);
                handleSupabaseError(error, "Chargement des statistiques du sous-administrateur")
            } else {
                const statsData = data as unknown as SousAdminDashboardStats;
                setStats({
                    myAssignedTransactions: statsData.my_assigned_transactions_count || 0,
                    myAssignedRequests: statsData.my_assigned_requests_count || 0,
                    unassignedTransactions: statsData.unassigned_transactions_count || 0,
                    unassignedRequests: statsData.unassigned_requests_count || 0,
                });
            }
            setLoading(false);
        };
        fetchStats();
    }, [user.id, refreshKey]);

    const totalMyTasks = stats.myAssignedTransactions + stats.myAssignedRequests;
    const totalUnassignedTasks = stats.unassignedTransactions + stats.unassignedRequests;
    
    const canViewTransactions = (sousAdminUser.permissions as any)?.can_validate_transactions ?? false;
    const canViewRequests = (sousAdminUser.permissions as any)?.can_manage_requests ?? false;

    if (loading) return <div>Chargement...</div>;

    return (
        <>
            <PageHeader
                title={`Bienvenue, ${user.name}`}
                subtitle="Voici un aperçu de vos tâches et des files d'attente."
                icon="fa-user-check"
                gradient="from-indigo-600 to-purple-600"
            />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                <div className="lg:col-span-1 bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg">
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Mes Tâches Assignées</h3>
                    <div className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-500 mb-2">{totalMyTasks}</div>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">Total des transactions et requêtes qui vous sont assignées.</p>
                     <div className="space-y-2">
                        {canViewTransactions && <p className="text-sm">Transactions: <span className="font-bold">{stats.myAssignedTransactions}</span></p>}
                        {canViewRequests && <p className="text-sm">Requêtes: <span className="font-bold">{stats.myAssignedRequests}</span></p>}
                     </div>
                </div>

                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {canViewTransactions && (
                         <StatCard 
                            title="Transactions à Valider" 
                            value={stats.unassignedTransactions} 
                            icon="fa-check-double"
                            actionText="Traiter la file"
                            onClick={() => navigateTo('Validation Transactions')}
                            color="bg-gradient-to-br from-blue-500 to-cyan-500"
                        />
                    )}
                     {canViewRequests && (
                        <StatCard 
                            title="Requêtes à Gérer" 
                            value={stats.unassignedRequests} 
                            icon="fa-headset"
                            actionText="Voir les requêtes"
                            onClick={() => navigateTo('Gestion des Requêtes')}
                            color="bg-gradient-to-br from-purple-500 to-pink-500"
                        />
                     )}
                     {!canViewTransactions && !canViewRequests && (
                        <div className="md:col-span-2 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl p-6 text-center text-gray-500">
                           <p>Vous n'avez actuellement aucune permission pour voir les files d'attente.</p>
                        </div>
                     )}
                </div>

            </div>
        </>
    );
};
