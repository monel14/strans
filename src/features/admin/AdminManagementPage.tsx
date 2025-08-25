import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { PageComponentProps, User, SousAdmin } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Pagination } from '../../components/common/Pagination';
import { formatDate } from '../../utils/formatters';
import { supabase } from '../../supabaseClient';
import { AgencyManagementView } from './AgencyManagementView';
import { AdminConfigCommissions } from './AdminConfigCommissions';
import { AdminAuditLog } from './AdminAuditLog';
import { AdminManageSubAdmins } from './AdminManageSubAdmins';
import { PageLoader } from '../../components/common/Loader';


type MainTabKey = 'agencies' | 'subadmins' | 'users' | 'operations' | 'logs';
type SortField = 'name' | 'email' | 'created_at' | 'status';
type SortOrder = 'asc' | 'desc';


type UserWithStats = User & {
    transaction_count: number;
    status: 'active' | 'suspended' | 'inactive';
};

export const AdminManagementPage: React.FC<PageComponentProps> = (props) => {
    const { refreshKey } = props;
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<MainTabKey>('agencies');
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortField] = useState<SortField>('name');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
    const [selectedItems, setSelectedItems] = useState<string[]>([]);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    const [subAdmins, setSubAdmins] = useState<SousAdmin[]>([]);
    const [users, setUsers] = useState<UserWithStats[]>([]);
    const [systemStats, setSystemStats] = useState({
        totalUsers: 0,
        totalAgencies: 0,
        totalTransactions: 0,
        activeUsers: 0,
        pendingTransactions: 0,
        systemHealth: 'good'
    });

    const ITEMS_PER_PAGE = 12;

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const { count: agenciesCount } = await supabase.from('agencies').select('*', { count: 'exact', head: true });
            const { data: subAdminsData } = await supabase.from('profiles').select('*').eq('role', 'sous_admin');
            const { data: usersData } = await supabase.from('profiles').select('*').neq('role', 'admin_general');

            const totalUsers = usersData?.length || 0;
            const activeUsers = usersData?.filter(u => u.status === 'active').length || 0;

            const { count: totalTransactions } = await supabase.from('transactions').select('id', { count: 'exact' });
            const { count: pendingTransactions } = await supabase.from('transactions').select('id', { count: 'exact' }).eq('status', 'pending');

            const processedUsers = (usersData || []).map(userData => ({
                ...(userData as User),
                transaction_count: 0,
                status: (userData.status as 'active' | 'suspended' | 'inactive') || 'active'
            }));

            setSubAdmins(subAdminsData as SousAdmin[] || []);
            setUsers(processedUsers);
            setSystemStats({
                totalUsers,
                totalAgencies: agenciesCount || 0,
                totalTransactions: totalTransactions || 0,
                activeUsers,
                pendingTransactions: pendingTransactions || 0,
                systemHealth: 'good'
            });

        } catch (error) {
            console.error('Erreur lors du chargement:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData, refreshKey]);

    useEffect(() => {
        setCurrentPage(1);
    }, [activeTab, searchTerm]);

    // ... (All action handlers remain the same)

    const filteredData = useMemo(() => {
        let data: any[] = [];

        if (activeTab === 'users') {
            data = users;
        } else {
            return [];
        }

        if (filterStatus !== 'all') {
            data = data.filter(item => item.status === filterStatus);
        }

        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            data = data.filter(item =>
                item.name?.toLowerCase().includes(searchLower) ||
                item.email?.toLowerCase().includes(searchLower)
            );
        }

        data.sort((a, b) => {
            const aValue = a[sortField] || '';
            const bValue = b[sortField] || '';
            if (sortOrder === 'asc') return aValue.toString().localeCompare(bValue.toString());
            else return bValue.toString().localeCompare(aValue.toString());
        });

        return data;
    }, [activeTab, users, searchTerm, filterStatus, sortField, sortOrder]);


    const paginatedData = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredData.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredData, currentPage]);

    const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);

    if (loading && activeTab !== 'agencies') {
        return <PageLoader text="Chargement des données d'administration..." />;
    }

    return (
        <>
            <PageHeader
                title="Administration"
                subtitle="Centre de contrôle pour la gestion des agences, utilisateurs et opérations"
                icon="fa-users-cog"
                gradient="from-purple-500 to-pink-600"
            />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-4 text-white">
                    <div className="flex items-center">
                        <div className="p-3 bg-white/20 rounded-full mr-3"><i className="fas fa-users text-xl"></i></div>
                        <div><p className="text-sm opacity-90">Utilisateurs</p><p className="text-2xl font-bold">{systemStats.totalUsers}</p></div>
                    </div>
                </div>
                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-4 text-white">
                    <div className="flex items-center">
                        <div className="p-3 bg-white/20 rounded-full mr-3"><i className="fas fa-building text-xl"></i></div>
                        <div><p className="text-sm opacity-90">Agences</p><p className="text-2xl font-bold">{systemStats.totalAgencies}</p></div>
                    </div>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-4 text-white">
                    <div className="flex items-center">
                        <div className="p-3 bg-white/20 rounded-full mr-3"><i className="fas fa-exchange-alt text-xl"></i></div>
                        <div><p className="text-sm opacity-90">Transactions</p><p className="text-2xl font-bold">{systemStats.totalTransactions}</p></div>
                    </div>
                </div>
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-4 text-white">
                    <div className="flex items-center">
                        <div className="p-3 bg-white/20 rounded-full mr-3"><i className="fas fa-user-check text-xl"></i></div>
                        <div><p className="text-sm opacity-90">Actifs</p><p className="text-2xl font-bold">{systemStats.activeUsers}</p></div>
                    </div>
                </div>
            </div>

            <div className="tabs mb-6">
                <button onClick={() => setActiveTab('agencies')} className={activeTab === 'agencies' ? 'active' : ''}><i className="fas fa-building mr-2"></i>Agences & Services</button>
                <button onClick={() => setActiveTab('operations')} className={activeTab === 'operations' ? 'active' : ''}><i className="fas fa-cogs mr-2"></i>Opérations</button>
                <button onClick={() => setActiveTab('subadmins')} className={activeTab === 'subadmins' ? 'active' : ''}><i className="fas fa-user-shield mr-2"></i>Sous-Admins ({subAdmins.length})</button>
                <button onClick={() => setActiveTab('users')} className={activeTab === 'users' ? 'active' : ''}><i className="fas fa-users mr-2"></i>Utilisateurs ({users.length})</button>
                <button onClick={() => setActiveTab('logs')} className={activeTab === 'logs' ? 'active' : ''}><i className="fas fa-history mr-2"></i>Journal d'Audit</button>
            </div>

            <div>
                {activeTab === 'agencies' && <AgencyManagementView {...props} />}
                {activeTab === 'operations' && <AdminConfigCommissions {...props} />}
                {activeTab === 'logs' && <AdminAuditLog {...props} />}
                {activeTab === 'subadmins' && <AdminManageSubAdmins />}


                {/* --- Rendu pour l'onglet utilisateurs --- */}
                {activeTab === 'users' && (
                    <Card title="Gestion des Utilisateurs" icon="fa-users">
                        {/* Barre d'outils */}
                        <div className="mb-6 space-y-4">
                            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="relative">
                                        <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                        <input
                                            type="text"
                                            placeholder="Rechercher par nom ou email..."
                                            className="form-input pl-10 w-64"
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                        />
                                    </div>

                                    <select
                                        value={filterStatus}
                                        onChange={(e) => setFilterStatus(e.target.value)}
                                        className="form-select"
                                    >
                                        <option value="all">Tous les statuts</option>
                                        <option value="active">Actifs</option>
                                        <option value="suspended">Suspendus</option>
                                        <option value="inactive">Inactifs</option>
                                    </select>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowCreateModal(true)}
                                        className="btn-primary"
                                    >
                                        <i className="fas fa-plus mr-2"></i>
                                        Ajouter Utilisateur
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Contenu */}
                        {paginatedData.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {paginatedData.map((item) => (
                                    <div key={item.id} className="bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
                                        {/* Header avec avatar et statut */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center">
                                                <img
                                                    src={`https://placehold.co/48x48/E2E8F0/4A5568?text=${item.avatar_seed || item.name?.charAt(0) || 'U'}`}
                                                    alt={item.name}
                                                    className="w-12 h-12 rounded-full mr-3"
                                                />
                                                <div>
                                                    <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100">
                                                        {item.name || 'Nom non défini'}
                                                    </h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">
                                                        {item.role?.replace('_', ' ').toUpperCase()}
                                                    </p>
                                                </div>
                                            </div>
                                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${item.status === 'active'
                                                ? 'bg-green-100 text-green-800'
                                                : item.status === 'suspended'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {item.status === 'active' ? 'Actif' : item.status === 'suspended' ? 'Suspendu' : 'Inactif'}
                                            </span>
                                        </div>

                                        {/* Informations */}
                                        <div className="space-y-2 mb-4">
                                            <div className="flex items-center text-sm">
                                                <i className="fas fa-envelope text-gray-400 mr-2 w-4"></i>
                                                <span className="text-gray-600 dark:text-gray-300 truncate">
                                                    {item.email || 'Email non défini'}
                                                </span>
                                            </div>

                                            {(item as any).phone && (
                                                <div className="flex items-center text-sm">
                                                    <i className="fas fa-phone text-gray-400 mr-2 w-4"></i>
                                                    <span className="text-gray-600 dark:text-gray-300">
                                                        {(item as any).phone}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="flex items-center text-sm">
                                                <i className="fas fa-wallet text-gray-400 mr-2 w-4"></i>
                                                <span className="text-gray-600 dark:text-gray-300">
                                                    Solde: {new Intl.NumberFormat('fr-FR', {
                                                        style: 'currency',
                                                        currency: 'XOF'
                                                    }).format(item.solde || 0)}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Statistiques pour les utilisateurs */}
                                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mb-4">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-600 dark:text-gray-400">Transactions:</span>
                                                <span className="font-semibold text-gray-800 dark:text-gray-200">
                                                    {item.transaction_count || 0}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                                            <span className="text-xs text-gray-500">
                                                Créé: {formatDate((item as any).created_at)}
                                            </span>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => {
                                                        setEditingItem(item);
                                                        setShowEditModal(true);
                                                    }}
                                                    className="text-blue-600 hover:text-blue-800 text-sm"
                                                    title="Modifier"
                                                >
                                                    <i className="fas fa-edit"></i>
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm(`Êtes-vous sûr de vouloir ${item.status === 'active' ? 'suspendre' : 'activer'} cet utilisateur ?`)) {
                                                            // Action de suspension/activation
                                                            console.log('Toggle status for:', item.id);
                                                        }
                                                    }}
                                                    className={`text-sm ${item.status === 'active' ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}`}
                                                    title={item.status === 'active' ? 'Suspendre' : 'Activer'}
                                                >
                                                    <i className={`fas ${item.status === 'active' ? 'fa-ban' : 'fa-check'}`}></i>
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-12">
                                <div className="text-gray-400 mb-4">
                                    <i className="fas fa-users text-4xl"></i>
                                </div>
                                <p className="text-gray-500 text-lg">
                                    Aucun utilisateur ne correspond à vos critères
                                </p>
                                <button
                                    onClick={() => setShowCreateModal(true)}
                                    className="btn-primary mt-4"
                                >
                                    <i className="fas fa-plus mr-2"></i>
                                    Ajouter le premier utilisateur
                                </button>
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-6">
                                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                            </div>
                        )}
                    </Card>
                )}
            </div>

            {/* Modals */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">
                            Ajouter Utilisateur
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Modal de création en cours d'implémentation...
                        </p>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => setShowCreateModal(false)}
                                className="btn-secondary"
                            >
                                Annuler
                            </button>
                            <button className="btn-primary">
                                Créer
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showEditModal && editingItem && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">
                            Modifier {editingItem.name}
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Modal d'édition en cours d'implémentation...
                        </p>
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={() => {
                                    setShowEditModal(false);
                                    setEditingItem(null);
                                }}
                                className="btn-secondary"
                            >
                                Annuler
                            </button>
                            <button className="btn-primary">
                                Sauvegarder
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};