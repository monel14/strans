import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageComponentProps, User, SousAdmin } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { supabase } from '../../supabaseClient';
// Supprimer l'import du hook de permissions et de PermissionGuard

// Import des composants admin réutilisables
import { AgencyManagementView } from '../admin/AgencyManagementView';
import { AdminConfigCommissions } from '../admin/AdminConfigCommissions';
import { AdminAuditLog } from '../admin/AdminAuditLog';
import { AdminManageSubAdmins } from '../admin/AdminManageSubAdmins';
import { SousAdminTransactionManagement } from './SousAdminTransactionManagement';
import { SousAdminUserManagement } from './SousAdminUserManagement';

// Composant de protection par permissions
// Supprimer toute logique liée à checkMultiplePermissions, userPermissions, tabsConfig.permission, availableTabs, et PermissionGuard dans le rendu
// Rendre tous les onglets et composants accessibles sans restriction

type MainTabKey = 'transactions' | 'agencies' | 'subadmins' | 'users' | 'operations' | 'reports' | 'system';

interface TabConfig {
    key: MainTabKey;
    label: string;
    icon: string;
    permission?: string;
    component: React.ComponentType<any>;
    description: string;
}

export const SousAdminManagementPage: React.FC<PageComponentProps> = (props) => {
    const { user } = props;
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<MainTabKey>('transactions');
    const [systemStats, setSystemStats] = useState({
        totalUsers: 0,
        totalAgencies: 0,
        totalTransactions: 0,
        activeUsers: 0,
        pendingTransactions: 0,
        systemHealth: 'good'
    });

    // Charger les statistiques système
    useEffect(() => {
        const loadSystemStats = async () => {
            setLoading(true);
            try {
                // Statistiques basiques (toujours accessibles)
                const [usersResult, agenciesResult, transactionsResult] = await Promise.all([
                    supabase.from('profiles').select('id, status').neq('role', 'admin'),
                    supabase.from('agencies').select('id'),
                    supabase.from('transactions').select('id, status')
                ]);

                const totalUsers = usersResult.data?.length || 0;
                const totalAgencies = agenciesResult.data?.length || 0;
                const totalTransactions = transactionsResult.data?.length || 0;
                const activeUsers = usersResult.data?.filter(u => u.status === 'active').length || 0;
                const pendingTransactions = transactionsResult.data?.filter(t => 
                    t.status === 'En attente de validation'
                ).length || 0;

                setSystemStats({
                    totalUsers,
                    totalAgencies,
                    totalTransactions,
                    activeUsers,
                    pendingTransactions,
                    systemHealth: 'good'
                });
            } catch (error) {
                console.error('Erreur chargement statistiques:', error);
            } finally {
                setLoading(false);
            }
        };
        loadSystemStats();
    }, []);

    // Filtrer les onglets disponibles selon les permissions
    const availableTabs = useMemo(() => {
        return [
            {
                key: 'transactions',
                label: 'Transactions',
                icon: 'fa-exchange-alt',
                component: SousAdminTransactionManagement,
                description: 'Validation et gestion des transactions'
            },
            {
                key: 'agencies',
                label: 'Agences',
                icon: 'fa-building',
                component: AgencyManagementView,
                description: 'Gestion des agences et services'
            },
            {
                key: 'users',
                label: 'Utilisateurs',
                icon: 'fa-users',
                component: SousAdminUserManagement,
                description: 'Gestion des utilisateurs'
            },
            {
                key: 'subadmins',
                label: 'Sous-Admins',
                icon: 'fa-user-shield',
                component: AdminManageSubAdmins,
                description: 'Gestion des sous-administrateurs'
            },
            {
                key: 'operations',
                label: 'Opérations',
                icon: 'fa-cogs',
                component: AdminConfigCommissions,
                description: 'Configuration des opérations'
            },
            {
                key: 'reports',
                label: 'Rapports',
                icon: 'fa-chart-bar',
                component: AdminAuditLog,
                description: 'Rapports et analyses'
            }
        ];
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <>
            <PageHeader
                title="Dashboard Sous-Admin"
                subtitle="Centre de contrôle avec permissions granulaires"
                icon="fa-user-shield"
                gradient="from-purple-500 to-indigo-600"
            />

            {/* Statistiques système */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                    <div className="flex items-center">
                        <div className="p-3 bg-white/20 rounded-full mr-3">
                            <i className="fas fa-users text-xl"></i>
                        </div>
                        <div>
                            <p className="text-sm opacity-90">Utilisateurs</p>
                            <p className="text-2xl font-bold">{systemStats.totalUsers}</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                    <div className="flex items-center">
                        <div className="p-3 bg-white/20 rounded-full mr-3">
                            <i className="fas fa-building text-xl"></i>
                        </div>
                        <div>
                            <p className="text-sm opacity-90">Agences</p>
                            <p className="text-2xl font-bold">{systemStats.totalAgencies}</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                    <div className="flex items-center">
                        <div className="p-3 bg-white/20 rounded-full mr-3">
                            <i className="fas fa-exchange-alt text-xl"></i>
                        </div>
                        <div>
                            <p className="text-sm opacity-90">Transactions</p>
                            <p className="text-2xl font-bold">{systemStats.totalTransactions}</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                    <div className="flex items-center">
                        <div className="p-3 bg-white/20 rounded-full mr-3">
                            <i className="fas fa-user-check text-xl"></i>
                        </div>
                        <div>
                            <p className="text-sm opacity-90">Actifs</p>
                            <p className="text-2xl font-bold">{systemStats.activeUsers}</p>
                        </div>
                    </div>
                </div>
                
                <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-4 text-white">
                    <div className="flex items-center">
                        <div className="p-3 bg-white/20 rounded-full mr-3">
                            <i className="fas fa-clock text-xl"></i>
                        </div>
                        <div>
                            <p className="text-sm opacity-90">En attente</p>
                            <p className="text-2xl font-bold">{systemStats.pendingTransactions}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Onglets avec permissions */}
            <div className="tabs mb-6">
                {availableTabs.map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={activeTab === tab.key ? 'active' : ''}
                        title={tab.description}
                    >
                        <i className={`fas ${tab.icon} mr-2`}></i>
                        {tab.label}
                    </button>
                ))}
                
                {availableTabs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <i className="fas fa-lock text-4xl mb-4"></i>
                        <p>Aucune fonctionnalité accessible avec vos permissions actuelles</p>
                        <p className="text-sm mt-2">Contactez un administrateur pour obtenir des permissions</p>
                    </div>
                )}
            </div>

            {/* Contenu des onglets */}
            <div>
                {availableTabs.map(tab => {
                    if (activeTab !== tab.key) return null;
                    
                    const Component = tab.component;
                    
                    return (
                        <div key={tab.key}>
                            {/* Supprimer toute logique liée à checkMultiplePermissions, userPermissions, tabsConfig.permission, availableTabs, et PermissionGuard dans le rendu */}
                            {/* Rendre tous les onglets et composants accessibles sans restriction */}
                            <Component {...props} />
                        </div>
                    );
                })}
            </div>
        </>
    );
};