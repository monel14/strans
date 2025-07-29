import React, { useState, useEffect, useMemo } from 'react';
import { PageComponentProps, User } from '../../types';
import { Card } from '../../components/common/Card';
import { Pagination } from '../../components/common/Pagination';
import { formatDate } from '../../utils/formatters';
import { supabase } from '../../supabaseClient';
import { handleSupabaseError } from '../../utils/errorUtils';
// Supprimer l'import de PermissionButton et du hook de permissions
// Supprimer toute logique liée à checkPermission, permissions.canSuspendUsers, etc.
// Rendre toutes les actions accessibles

interface UserWithStats extends User {
    transaction_count: number;
    last_activity: string;
}

export const SousAdminUserManagement: React.FC<PageComponentProps> = ({ user }) => {
    const [users, setUsers] = useState<UserWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterRole, setFilterRole] = useState<string>('all');
    
    // Supprimer l'import de PermissionButton et du hook de permissions
    // Supprimer toute logique liée à checkPermission, permissions.canSuspendUsers, etc.
    // Rendre toutes les actions accessibles

    const ITEMS_PER_PAGE = 10;

    // Charger les utilisateurs
    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                // Requête pour récupérer les utilisateurs avec statistiques
                const { data: usersData, error: usersError } = await supabase
                    .from('profiles')
                    .select(`
                        id, name, email, role, status, created_at, agency_id,
                        suspension_reason, avatar_seed
                    `)
                    .neq('role', 'admin'); // Exclure les admins principaux

                if (usersError) {
                    handleSupabaseError(usersError, "Chargement des utilisateurs");
                    return;
                }

                // Enrichir avec les statistiques de transactions
                const enrichedUsers = await Promise.all(
                    (usersData || []).map(async (userData) => {
                        const { data: transactionCount } = await supabase
                            .from('transactions')
                            .select('id', { count: 'exact' })
                            .eq('agent_id', userData.id);

                        return {
                            ...userData,
                            transaction_count: transactionCount?.length || 0,
                            last_activity: userData.created_at // Placeholder
                        } as UserWithStats;
                    })
                );

                setUsers(enrichedUsers);
            } catch (error) {
                console.error('Erreur chargement utilisateurs:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // Filtrer les utilisateurs
    const filteredUsers = useMemo(() => {
        return users.filter(u => {
            const matchesSearch = !searchTerm || 
                u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.email?.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = filterStatus === 'all' || u.status === filterStatus;
            const matchesRole = filterRole === 'all' || u.role === filterRole;
            
            return matchesSearch && matchesStatus && matchesRole;
        });
    }, [users, searchTerm, filterStatus, filterRole]);

    // Pagination
    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredUsers, currentPage]);

    const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);

    // Actions sur les utilisateurs
    const handleUserAction = async (userId: string, action: 'suspend' | 'activate', reason?: string) => {
        try {
            const newStatus = action === 'suspend' ? 'suspended' : 'active';
            
            const { error } = await supabase.rpc('update_user_status', {
                p_target_user_id: userId,
                p_new_status: newStatus,
                p_reason: reason || null
            });

            if (error) {
                handleSupabaseError(error, `${action === 'suspend' ? 'Suspension' : 'Activation'} utilisateur`);
            } else {
                // Recharger les utilisateurs
                const updatedUsers = users.map(u => 
                    u.id === userId 
                        ? { ...u, status: newStatus as any, suspension_reason: reason || null }
                        : u
                );
                setUsers(updatedUsers);
                
                alert(`✅ Utilisateur ${action === 'suspend' ? 'suspendu' : 'activé'} avec succès`);
            }
        } catch (error) {
            console.error(`Erreur ${action} utilisateur:`, error);
            alert(`❌ Erreur lors de l'${action === 'suspend' ? 'suspension' : 'activation'}`);
        }
    };

    const getRoleLabel = (role: string) => {
        const labels: Record<string, string> = {
            'agent': 'Agent',
            'chef_agence': 'Chef d\'Agence',
            'sous_admin': 'Sous-Admin',
            'admin': 'Administrateur'
        };
        return labels[role] || role;
    };

    const getStatusBadge = (status: string) => {
        const badges: Record<string, string> = {
            'active': 'bg-green-100 text-green-800',
            'suspended': 'bg-red-100 text-red-800',
            'inactive': 'bg-gray-100 text-gray-800'
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };

    if (loading) {
        return (
            <Card title="Gestion des Utilisateurs" icon="fa-users">
                <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                    <span className="ml-3">Chargement des utilisateurs...</span>
                </div>
            </Card>
        );
    }

    return (
        <Card title="Gestion des Utilisateurs" icon="fa-users">
            {/* Filtres et recherche */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                    <input
                        type="text"
                        placeholder="Rechercher un utilisateur..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-input w-full"
                    />
                </div>
                
                <div>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="form-select w-full"
                    >
                        <option value="all">Tous les statuts</option>
                        <option value="active">Actif</option>
                        <option value="suspended">Suspendu</option>
                        <option value="inactive">Inactif</option>
                    </select>
                </div>
                
                <div>
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="form-select w-full"
                    >
                        <option value="all">Tous les rôles</option>
                        <option value="agent">Agents</option>
                        <option value="chef_agence">Chefs d'Agence</option>
                        <option value="sous_admin">Sous-Admins</option>
                    </select>
                </div>
                
                <div className="text-sm text-gray-600 flex items-center">
                    <i className="fas fa-info-circle mr-2"></i>
                    {filteredUsers.length} utilisateur(s)
                </div>
            </div>

            {/* Statistiques rapides */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                        {users.filter(u => u.status === 'active').length}
                    </div>
                    <div className="text-sm text-gray-600">Actifs</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                        {users.filter(u => u.status === 'suspended').length}
                    </div>
                    <div className="text-sm text-gray-600">Suspendus</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                        {users.filter(u => u.role === 'agent').length}
                    </div>
                    <div className="text-sm text-gray-600">Agents</div>
                </div>
                <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                        {users.filter(u => u.role === 'chef_agence').length}
                    </div>
                    <div className="text-sm text-gray-600">Chefs</div>
                </div>
            </div>

            {/* Liste des utilisateurs */}
            {paginatedUsers.length === 0 ? (
                <div className="text-center py-8">
                    <i className="fas fa-users text-4xl text-gray-400 mb-4"></i>
                    <p className="text-gray-600">Aucun utilisateur trouvé</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {paginatedUsers.map(userData => (
                        <div key={userData.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <img
                                        src={`https://placehold.co/48x48/E2E8F0/4A5568?text=${userData.avatar_seed || userData.name?.charAt(0) || 'U'}`}
                                        alt={userData.name}
                                        className="w-12 h-12 rounded-full"
                                    />
                                    
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{userData.name}</h3>
                                        <p className="text-sm text-gray-600">{userData.email}</p>
                                        <div className="flex items-center space-x-2 mt-1">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(userData.status)}`}>
                                                {userData.status === 'active' ? 'Actif' : userData.status === 'suspended' ? 'Suspendu' : 'Inactif'}
                                            </span>
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                                                {getRoleLabel(userData.role)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex items-center space-x-2">
                                    <div className="text-right text-sm text-gray-600 mr-4">
                                        <div>{userData.transaction_count} transactions</div>
                                        <div>Créé le {formatDate(userData.created_at)}</div>
                                    </div>
                                    
                                    {userData.status === 'active' ? (
                                        <button
                                            onClick={() => {
                                                const reason = prompt('Motif de suspension (optionnel):');
                                                if (reason !== null) {
                                                    handleUserAction(userData.id, 'suspend', reason);
                                                }
                                            }}
                                            className="btn btn-sm btn-danger"
                                        >
                                            <i className="fas fa-user-times mr-1"></i>
                                            Suspendre
                                        </button>
                                    ) : userData.status === 'suspended' ? (
                                        <button
                                            onClick={() => handleUserAction(userData.id, 'activate')}
                                            className="btn btn-sm btn-success"
                                        >
                                            <i className="fas fa-user-check mr-1"></i>
                                            Activer
                                        </button>
                                    ) : null}
                                </div>
                            </div>
                            
                            {userData.suspension_reason && (
                                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
                                    <p className="text-sm text-red-800">
                                        <i className="fas fa-exclamation-triangle mr-2"></i>
                                        Motif de suspension: {userData.suspension_reason}
                                    </p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="mt-6">
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </Card>
    );
};