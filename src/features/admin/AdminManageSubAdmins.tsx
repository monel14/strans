import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../../components/common/Card';
import { Pagination } from '../../components/common/Pagination';
import { supabase } from '../../supabaseClient';

interface SubAdminWithStats {
  id: string;
  name: string;
  email: string;
  status: string;
  avatar_seed: string | null;
  suspension_reason: string | null;
  assigned_tasks: number;
}

const StatCard: React.FC<{ 
  title: string; 
  value: string | number; 
  icon: string; 
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => (
  <div className={`bg-gradient-to-r ${color} rounded-xl p-6 text-white shadow-lg hover:shadow-xl transition-all duration-300`}>
    <div className="flex items-center">
      <div className="p-3 bg-white/20 rounded-full mr-4">
        <i className={`fas ${icon} text-2xl`}></i>
      </div>
      <div>
        <p className="text-sm opacity-90 font-medium">{title}</p>
        <p className="text-3xl font-bold">{value}</p>
        {subtitle && <p className="text-xs opacity-75 mt-1">{subtitle}</p>}
      </div>
    </div>
  </div>
);

// Composant simplifié pour afficher le rôle
const RoleDisplay: React.FC<{ role: string }> = ({ role }) => {
    return (
        <div className="text-center py-4">
            <div className="flex items-center justify-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <i className="fas fa-user-shield text-blue-600 mr-2"></i>
                <span className="text-sm font-medium text-blue-800">
                    Gestion des Transactions et Requêtes
                </span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Rôle: {role}</p>
        </div>
    );
};

const SubAdminCard: React.FC<{
    subAdmin: SubAdminWithStats;
    onOpenSuspend: () => void;
}> = ({ subAdmin, onOpenSuspend }) => {
    const isActive = subAdmin.status === 'active';
    
    return (
        <div className={`bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-6 hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 ${
            !isActive ? 'opacity-75 bg-gradient-to-br from-gray-50 to-gray-100' : 'hover:scale-105'
        }`}>
            {/* Header avec avatar et statut */}
            <div className="flex items-start justify-between mb-6">
                <div className="flex items-center">
                    <div className="relative">
                        <img 
                            src={`https://placehold.co/56x56/E2E8F0/4A5568?text=${subAdmin.avatar_seed || subAdmin.name?.charAt(0) || 'SA'}`} 
                            alt={subAdmin.name} 
                            className="w-14 h-14 rounded-full border-4 border-white shadow-lg"
                        />
                        <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white ${
                            isActive ? 'bg-green-500' : 'bg-red-500'
                        }`}></div>
                    </div>
                    <div className="ml-4">
                        <h4 className="text-xl font-bold text-gray-800 dark:text-gray-100">
                            {subAdmin.name || 'Nom non défini'}
                        </h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-48">
                            {subAdmin.email || 'Email non défini'}
                        </p>
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold mt-2 ${
                            isActive 
                                ? 'bg-green-100 text-green-800 border border-green-200' 
                                : 'bg-red-100 text-red-800 border border-red-200'
                        }`}>
                            <i className={`fas ${isActive ? 'fa-check-circle' : 'fa-ban'} mr-1`}></i>
                            {isActive ? 'Actif' : 'Suspendu'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Statistiques des tâches */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tâches assignées</p>
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{subAdmin.assigned_tasks || 0}</p>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-800/30 rounded-full">
                        <i className="fas fa-tasks text-blue-600 dark:text-blue-400 text-xl"></i>
                    </div>
                </div>
            </div>

            {/* Rôle */}
            <div className="mb-6">
                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
                    <i className="fas fa-user-tag mr-2 text-blue-600"></i>
                    Rôle et Responsabilités
                </p>
                <RoleDisplay role="sous_admin" />
            </div>

            {/* Motif de suspension si suspendu */}
            {!isActive && subAdmin.suspension_reason && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl dark:bg-red-900/20 dark:border-red-700">
                    <p className="text-sm font-semibold text-red-800 dark:text-red-400 mb-2 flex items-center">
                        <i className="fas fa-exclamation-triangle mr-2"></i>
                        Motif de suspension
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300">{subAdmin.suspension_reason}</p>
                </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={onOpenSuspend}
                    className={`w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 shadow-md hover:shadow-lg ${
                        isActive 
                            ? 'bg-red-600 hover:bg-red-700 text-white' 
                            : 'bg-green-600 hover:bg-green-700 text-white'
                    }`}
                    title={isActive ? 'Suspendre' : 'Réactiver'}
                >
                    <i className={`fas ${isActive ? 'fa-ban' : 'fa-check'} mr-2`}></i>
                    {isActive ? 'Suspendre' : 'Réactiver'}
                </button>
            </div>
        </div>
    );
};


interface AdminManageSubAdminsProps {
    currentUser?: any;
}

export const AdminManageSubAdmins: React.FC<AdminManageSubAdminsProps> = ({ currentUser }) => {
    const [subAdmins, setSubAdmins] = useState<SubAdminWithStats[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 6;

    // Modal States
    const [isSuspendModalOpen, setSuspendModalOpen] = useState(false);
    const [selectedSubAdmin, setSelectedSubAdmin] = useState<SubAdminWithStats | null>(null);

    // Charger les sous-admins
    useEffect(() => {
        loadSubAdmins();
    }, []);

    const loadSubAdmins = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, name, email, status, avatar_seed, suspension_reason')
                .eq('role', 'sous_admin');
            
            if (error) throw error;
            
            // Transform data to match expected interface
            const subAdminsWithStats: SubAdminWithStats[] = (data || []).map(profile => ({
                ...profile,
                assigned_tasks: 0 // For now, set to 0 since we don't have this data yet
            }));
            
            setSubAdmins(subAdminsWithStats);
        } catch (error) {
            console.error('Erreur lors du chargement des sous-admins:', error);
        } finally {
            setLoading(false);
        }
    };
    

    const filteredSubAdmins = useMemo(() => {
        if (!searchTerm) return subAdmins;
        return subAdmins.filter(sa =>
            (sa.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (sa.email || '').toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [searchTerm, subAdmins]);
    
    const paginatedSubAdmins = useMemo(() => {
        return filteredSubAdmins.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
    }, [filteredSubAdmins, currentPage]);

    const totalPages = Math.ceil(filteredSubAdmins.length / ITEMS_PER_PAGE);

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        setCurrentPage(1);
    }
    
    // Modal Handlers
    const handleOpenSuspendModal = (sa: SubAdminWithStats) => {
        setSelectedSubAdmin(sa);
        setSuspendModalOpen(true);
    };
    const closeModal = () => {
        setSuspendModalOpen(false);
        setSelectedSubAdmin(null);
    };

    const handleConfirmSuspend = async (user: SubAdminWithStats, reason: string | null) => {
        try {
            const newStatus = user.status === 'active' ? 'suspended' : 'active';
            const { error } = await supabase.rpc('update_user_status', {
                p_target_user_id: user.id,
                p_new_status: newStatus,
                p_reason: reason
            });
            
            if (error) throw error;
            
            // Recharger la liste
            await loadSubAdmins();
            closeModal();
        } catch (error) {
            console.error('Erreur lors de la suspension/réactivation:', error);
        }
    };

    if (loading) return <Card title="Gestion des Sous-Administrateurs" icon="fa-users-cog">Chargement...</Card>;
    
    const totalAssignedTasks = subAdmins.reduce((sum, sa) => sum + (sa.assigned_tasks || 0), 0);

    const activeSubAdmins = subAdmins.filter(sa => sa.status === 'active').length;
    const suspendedSubAdmins = subAdmins.filter(sa => sa.status === 'suspended').length;

    return (
        <>
            {/* Statistiques modernes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <StatCard 
                    title="Total Sous-Admins" 
                    value={subAdmins.length} 
                    icon="fa-user-shield" 
                    color="from-blue-500 to-blue-600"
                />
                <StatCard 
                    title="Actifs" 
                    value={activeSubAdmins} 
                    icon="fa-user-check" 
                    color="from-green-500 to-green-600"
                    subtitle={`${Math.round((activeSubAdmins / subAdmins.length) * 100) || 0}% actifs`}
                />
                <StatCard 
                    title="Suspendus" 
                    value={suspendedSubAdmins} 
                    icon="fa-user-times" 
                    color="from-red-500 to-red-600"
                />
                <StatCard 
                    title="Tâches Assignées" 
                    value={totalAssignedTasks} 
                    icon="fa-tasks" 
                    color="from-purple-500 to-purple-600"
                />
            </div>

            <Card title="Liste des Sous-Administrateurs" icon="fa-users-cog">
                {/* Barre de recherche et actions améliorée */}
                <div className="mb-8">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                        <div className="relative flex-grow max-w-md">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <i className="fas fa-search text-gray-400"></i>
                            </div>
                            <input
                                type="text"
                                placeholder="Rechercher par nom ou email..."
                                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-xl leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                value={searchTerm}
                                onChange={handleSearchChange}
                            />
                        </div>
                        <div className="text-sm text-gray-600 bg-blue-50 px-4 py-2 rounded-lg">
                            <i className="fas fa-info-circle mr-2"></i>
                            Les sous-admins gèrent uniquement les transactions et requêtes
                        </div>
                    </div>
                </div>
                
                {/* Grille des cartes */}
                {paginatedSubAdmins.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
                        {paginatedSubAdmins.map(sa => (
                            <SubAdminCard 
                                key={sa.id} 
                                subAdmin={sa} 
                                onOpenSuspend={() => handleOpenSuspendModal(sa)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-16">
                        <div className="bg-gray-100 dark:bg-gray-800 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                            <i className="fas fa-user-shield text-4xl text-gray-400"></i>
                        </div>
                        <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                            Aucun sous-administrateur trouvé
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 mb-6">
                            {searchTerm 
                                ? "Aucun sous-administrateur ne correspond à votre recherche." 
                                : "Commencez par créer votre premier sous-administrateur."
                            }
                        </p>
                        <div className="text-center text-gray-500">
                            <p>Les sous-admins sont créés par l'administrateur principal</p>
                        </div>
                    </div>
                )}

                {/* Pagination améliorée */}
                {totalPages > 1 && (
                    <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
                    </div>
                )}
            </Card>

            {/* Modal de suspension simplifié */}
            {isSuspendModalOpen && selectedSubAdmin && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                        <h3 className="text-lg font-semibold mb-4">
                            {selectedSubAdmin.status === 'active' ? 'Suspendre' : 'Réactiver'} le sous-admin
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Êtes-vous sûr de vouloir {selectedSubAdmin.status === 'active' ? 'suspendre' : 'réactiver'} {selectedSubAdmin.name} ?
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleConfirmSuspend(selectedSubAdmin, null)}
                                className={`flex-1 px-4 py-2 rounded-lg font-medium ${
                                    selectedSubAdmin.status === 'active'
                                        ? 'bg-red-600 hover:bg-red-700 text-white'
                                        : 'bg-green-600 hover:bg-green-700 text-white'
                                }`}
                            >
                                Confirmer
                            </button>
                            <button
                                onClick={closeModal}
                                className="flex-1 px-4 py-2 rounded-lg font-medium bg-gray-300 hover:bg-gray-400 text-gray-700"
                            >
                                Annuler
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};