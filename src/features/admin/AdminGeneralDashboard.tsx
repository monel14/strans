
import React, { useState, useEffect } from 'react';
import { PageComponentProps, AuditLog, User } from '../../types';
import { formatAmount, timeAgo } from '../../utils/formatters';
import { supabase } from '../../supabaseClient';
import { handleSupabaseError } from '../../utils/errorUtils';

import { PageHeader } from '../../components/common/PageHeader';
import { ActionCard } from '../../components/common/ActionCard';
import { LineChart } from '../../components/charts/LineChart';
import { Card } from '../../components/common/Card';


// A more visually appealing stat card with gradients
const StatCard: React.FC<{ title: string; value: string | number; icon: string; color: string; }> = ({ title, value, icon, color }) => (
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


// A component for workload display
const WorkloadItem: React.FC<{ name: string; taskCount: number; avatar_seed: string | null }> = ({ name, taskCount, avatar_seed }) => (
    <div className="flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md">
        <div className="flex items-center">
            <img src={`https://placehold.co/32x32/E2E8F0/4A5568?text=${avatar_seed}`} alt={name} className="w-8 h-8 rounded-full mr-3"/>
            <span className="font-medium text-gray-700 dark:text-gray-200">{name}</span>
        </div>
        <div className="text-right">
            <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{taskCount}</span>
            <span className="text-sm text-gray-500 dark:text-gray-400"> tâches</span>
        </div>
    </div>
);

type WorkloadUser = {
    id: string;
    name: string;
    avatar_seed: string | null;
    taskCount: number;
}

interface GlobalDashboardStats {
    pending_validations: number;
    pending_requests: number;
    total_volume: number;
    total_users: number;
    total_agencies: number;
    success_rate: number | null;
    workload: WorkloadUser[];
}

export const AdminGeneralDashboard: React.FC<PageComponentProps> = ({ navigateTo, refreshKey }) => {
    const [stats, setStats] = useState({
        pendingValidations: 0,
        pendingRequests: 0,
        totalVolume: 0,
        totalUsers: 0,
        totalAgencies: 0,
        successRate: 'N/A',
        workload: [] as WorkloadUser[],
        recentActivities: [] as AuditLog[],
    });
    const [loading, setLoading] = useState(true);
    const [chartData, setChartData] = useState<any>(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);

            const [statsRes, auditRes] = await Promise.all([
                 supabase.rpc('get_global_dashboard_stats'),
                 supabase.from('audit_logs').select('id, user_id, action, entity_type, entity_id, timestamp, details, user_role, ip_address').order('timestamp', { ascending: false }).limit(4)
            ]);

            if (statsRes.error) handleSupabaseError(statsRes.error, "Chargement des statistiques globales");
            if (auditRes.error) handleSupabaseError(auditRes.error, "Chargement des activités récentes");
            
            // --- Mock chart data generation ---
            const labels = [];
            const data = [];
            for (let i = 6; i >= 0; i--) {
                const d = new Date();
                d.setDate(d.getDate() - i);
                labels.push(d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }));
                data.push(Math.floor(Math.random() * (450000 - 150000 + 1) + 150000));
            }

            setChartData({
                labels,
                datasets: [{
                    label: 'Volume',
                    data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4,
                }],
            });

            if (!statsRes.error) {
                const statsData = statsRes.data as unknown as GlobalDashboardStats;
                 setStats(prev => ({ 
                    ...prev,
                    pendingValidations: statsData.pending_validations || 0,
                    pendingRequests: statsData.pending_requests || 0,
                    totalVolume: statsData.total_volume || 0,
                    totalUsers: statsData.total_users || 0,
                    totalAgencies: statsData.total_agencies || 0,
                    successRate: statsData.success_rate !== null ? `${Number(statsData.success_rate).toFixed(1)}%` : 'N/A',
                    workload: statsData.workload ?? [],
                }));
            }

            if (!auditRes.error && auditRes.data) {
                 const userIds = [...new Set((auditRes.data as any[]).map(log => log.user_id).filter(Boolean))] as string[];
                if (userIds.length > 0) {
                     const { data: usersData, error: usersError } = await supabase
                        .from('profiles')
                        .select('id, name')
                        .in('id', userIds);
                    
                    if (usersError) {
                        handleSupabaseError(usersError, "Chargement des profils pour les journaux d'audit");
                    } else {
                         const userMap = ((usersData as any[]) ?? []).reduce((acc: Record<string, string>, user) => {
                            acc[user.id] = user.name;
                            return acc;
                        }, {});

                        const recentActivities: AuditLog[] = (auditRes.data as any[]).map(log => ({
                            timestamp: log.timestamp,
                            user: log.user_id ? userMap[log.user_id] || "ID: " + log.user_id.substring(0,8) : "Système",
                            role: log.user_role || "N/A",
                            action: log.action,
                            entity: log.entity_id || log.entity_type || "Système",
                            details: log.details ? JSON.stringify(log.details) : '',
                            ip: log.ip_address || '',
                        }));
                        setStats(prev => ({ ...prev, recentActivities }));
                    }
                }
            }
            setLoading(false);
        };

        fetchData();
    }, [refreshKey]);


    if (loading) return <div>Chargement du tableau de bord...</div>;

    return (
        <>
            <PageHeader
                title="Tableau de Bord Global"
                subtitle="Vue d'ensemble de la performance et des opérations de la plateforme."
                icon="fa-globe-americas"
                gradient="from-purple-600 to-indigo-600"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <StatCard title="Volume (Total)" value={formatAmount(stats.totalVolume)} icon="fa-wallet" color="bg-gradient-to-br from-blue-500 to-blue-600" />
                <StatCard title="Taux de Succès" value={stats.successRate} icon="fa-check-circle" color="bg-gradient-to-br from-green-500 to-green-600" />
                <StatCard title="Transactions en Attente" value={stats.pendingValidations} icon="fa-hourglass-half" color="bg-gradient-to-br from-orange-500 to-orange-600" />
                <StatCard title="Requêtes en Attente" value={stats.pendingRequests} icon="fa-envelope-open-text" color="bg-gradient-to-br from-red-500 to-red-600" />
            </div>
            
            <Card title="Volume des transactions (7 derniers jours)" icon="fa-chart-line" className="mb-6">
                 {chartData && <LineChart chartData={chartData} />}
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card title="Accès Rapides" icon="fa-bolt">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ActionCard
                                title="Gestion & Administration"
                                description="Gérez les agences et les comptes sous-admin."
                                icon="fa-users-cog"
                                onClick={() => navigateTo('Gestion & Administration')}
                                colorGradient="from-blue-500 to-purple-500"
                            />
                             <ActionCard
                                title="Configuration & Outils"
                                description="Configurez les commissions, services et auditez le système."
                                icon="fa-tools"
                                onClick={() => navigateTo('Configuration & Outils')}
                                colorGradient="from-teal-500 to-green-500"
                            />
                        </div>
                    </Card>
                </div>
                
                <div className="lg:col-span-1 space-y-6">
                    <Card title="Charge de Travail" icon="fa-users-cog">
                         <div className="space-y-2">
                             {stats.workload.map(sa => <WorkloadItem key={sa.id} name={sa.name} taskCount={sa.taskCount} avatar_seed={sa.avatar_seed} />)}
                             {stats.workload.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 italic p-4">Aucun sous-administrateur à afficher.</p>}
                         </div>
                    </Card>
                    <Card title="Activité Récente" icon="fa-history">
                        <div className="space-y-4">
                           {stats.recentActivities.map(log => (
                               <div key={log.timestamp} className="flex items-start text-sm">
                                   <i className="fas fa-history text-gray-400 dark:text-gray-500 mr-3 mt-1"></i>
                                   <div>
                                       <p className="text-gray-800 dark:text-gray-200" dangerouslySetInnerHTML={{__html: `<strong>${log.user}</strong> a effectué : ${log.action} sur <strong>${log.entity}</strong>`}}></p>
                                       <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(log.timestamp)}</p>
                                   </div>
                               </div>
                           ))}
                           {stats.recentActivities.length === 0 && <p className="text-center text-gray-500 dark:text-gray-400 italic p-4">Aucune activité récente.</p>}
                        </div>
                    </Card>
                </div>
            </div>
        </>
    );
};
