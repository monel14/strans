
import React, { useState, useEffect } from 'react';
import { PageComponentProps } from '../../types';
import { Card } from '../../components/common/Card';
import { mockErrorLogs } from '../../data';
import { timeAgo } from '../../utils/formatters';
import { supabase } from '../../supabaseClient';
import { handleSupabaseError } from '../../utils/errorUtils';

import { PageHeader } from '../../components/common/PageHeader';
import { ActionCard } from '../../components/common/ActionCard';
import { BarChart } from '../../components/charts/BarChart';

// New, more vibrant StatCard for this dashboard
const DevStatCard: React.FC<{ title: string; value: string | number; icon: string; color: string; }> = ({ title, value, icon, color }) => (
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

// Mock data for new charts and metrics
const apiHealthData = {
    labels: ['Auth', 'Profiles', 'Transactions', 'Storage', 'Notifications'],
    datasets: [
      {
        label: 'Temps de réponse',
        data: [80, 120, 150, 90, 75],
        backgroundColor: [
            'rgba(59, 130, 246, 0.6)',
            'rgba(16, 185, 129, 0.6)',
            'rgba(239, 68, 68, 0.6)',
            'rgba(139, 92, 246, 0.6)',
            'rgba(249, 115, 22, 0.6)',
        ],
        borderColor: [
            'rgba(59, 130, 246, 1)',
            'rgba(16, 185, 129, 1)',
            'rgba(239, 68, 68, 1)',
            'rgba(139, 92, 246, 1)',
            'rgba(249, 115, 22, 1)',
        ],
        borderWidth: 1,
      },
    ],
};
const dbMetrics = {
    connections: 27,
    latency: '14ms',
    cacheHitRate: '98.7%',
    size: '154 MB'
};
const lastError = mockErrorLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];


export const DevDashboard: React.FC<PageComponentProps> = ({ navigateTo, refreshKey }) => {
    const [stats, setStats] = useState({
        opTypes: 0,
        agencies: 0,
        users: 0,
    });
    const [loading, setLoading] = useState(true);
    const errorsLast24h = mockErrorLogs.filter(log => new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length;


    useEffect(() => {
        const fetchStats = async () => {
            setLoading(true);
            
            const opTypesRes = await supabase.from('operation_types').select('*', { count: 'exact', head: true });
            const agenciesRes = await supabase.from('agencies').select('*', { count: 'exact', head: true });
            const usersRes = await supabase.from('profiles').select('*', { count: 'exact', head: true });
            
            const { count: opTypes, error: opTypesError } = opTypesRes;
            const { count: agencies, error: agenciesError } = agenciesRes;
            const { count: users, error: usersError } = usersRes;
            
            if (opTypesError) handleSupabaseError(opTypesError, "Comptage des types d'opérations");
            if (agenciesError) handleSupabaseError(agenciesError, "Comptage des agences");
            if (usersError) handleSupabaseError(usersError, "Comptage des utilisateurs");

            setStats({
                opTypes: opTypes || 0,
                agencies: agencies || 0,
                users: users || 0,
            });

            setLoading(false);
        };
        fetchStats();
    }, [refreshKey]);
    
    if (loading) return <div>Chargement du tableau de bord développeur...</div>;

    return (
        <>
            <PageHeader 
                title="Dashboard Technique"
                subtitle="Surveillez la santé du système, les performances et les configurations."
                icon="fa-code"
                gradient="from-slate-700 to-slate-900"
            />
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <DevStatCard title="Types d'Opération" value={stats.opTypes} icon="fa-cogs" color="bg-gradient-to-br from-blue-500 to-blue-600" />
                <DevStatCard title="Agences" value={stats.agencies} icon="fa-building" color="bg-gradient-to-br from-green-500 to-green-600" />
                <DevStatCard title="Utilisateurs" value={stats.users} icon="fa-users" color="bg-gradient-to-br from-purple-500 to-purple-600" />
                <DevStatCard title="Erreurs (24h)" value={errorsLast24h} icon="fa-bug" color={errorsLast24h > 0 ? "bg-gradient-to-br from-red-500 to-red-600" : "bg-gradient-to-br from-gray-500 to-gray-600"} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card title="Santé des API (Simulé)" icon="fa-heartbeat">
                         <BarChart chartData={apiHealthData} />
                    </Card>
                     <Card title="Accès Rapides" icon="fa-bolt">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <ActionCard 
                                title="Gestion des Opérations" 
                                description="Créer et configurer les types de services."
                                icon="fa-cogs" 
                                onClick={() => navigateTo('Types d\'Opérations')}
                                colorGradient="from-sky-500 to-indigo-500"
                            />
                            <ActionCard 
                                title="Configuration Globale" 
                                description="Paramètres critiques du système."
                                icon="fa-tools" 
                                onClick={() => navigateTo('Configuration Globale')}
                                colorGradient="from-slate-500 to-gray-600"
                            />
                        </div>
                    </Card>
                </div>
                
                <div className="lg:col-span-1 space-y-6">
                    <Card title="Métriques Base de Données (Simulé)" icon="fa-database">
                         <div className="space-y-3">
                             <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md"><span>Connexions Actives:</span> <span className="font-bold">{dbMetrics.connections}</span></div>
                             <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md"><span>Latence (p95):</span> <span className="font-bold">{dbMetrics.latency}</span></div>
                             <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md"><span>Taux de Cache:</span> <span className="font-bold">{dbMetrics.cacheHitRate}</span></div>
                             <div className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-800/50 rounded-md"><span>Taille:</span> <span className="font-bold">{dbMetrics.size}</span></div>
                         </div>
                    </Card>
                     <Card title="Dernière Erreur Critique" icon="fa-fire-extinguisher">
                        {lastError ? (
                            <div className="bg-red-50 dark:bg-red-900/50 border-l-4 border-red-500 p-3 rounded-md">
                                <p className="font-semibold text-red-800 dark:text-red-200">{lastError.message}</p>
                                <p className="text-sm text-red-600 dark:text-red-300 mt-1">{timeAgo(lastError.timestamp)}</p>
                                <a href="#" onClick={(e) => { e.preventDefault(); navigateTo('Journaux d\'Erreurs'); }} className="text-red-700 dark:text-red-200 hover:underline text-xs font-semibold mt-2 inline-block">
                                    Voir les logs <i className="fas fa-arrow-right text-xs"></i>
                                </a>
                            </div>
                        ) : (
                            <p className="text-center text-gray-500">Aucune erreur critique récente.</p>
                        )}
                    </Card>
                </div>
            </div>
        </>
    );
};
