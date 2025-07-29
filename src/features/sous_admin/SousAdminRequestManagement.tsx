import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { User, Request } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { Pagination } from '../../components/common/Pagination';
import { formatDate } from '../../utils/formatters';
import { getBadgeClass } from '../../utils/uiHelpers';
import { supabase } from '../../supabaseClient';
import { handleSupabaseError } from '../../utils/errorUtils';
// Supprimer l'import du hook de permissions
// Supprimer toute logique liée à checkPermission, hasReportAccess, permissionsLoading, etc.
// Rendre toutes les actions accessibles

const getRequestIcon = (type: string): string => {
    if (type.includes('technique')) return 'fa-cog';
    if (type.includes('compte')) return 'fa-user';
    if (type.includes('transaction')) return 'fa-exchange-alt';
    if (type.includes('bug')) return 'fa-bug';
    if (type.includes('feature')) return 'fa-lightbulb';
    return 'fa-question-circle';
};

type MainTabKey = 'management' | 'history';
type ManagementTabKey = 'unassigned' | 'assigned_to_me' | 'all_pending';

interface SousAdminRequestManagementProps {
    user: User;
    navigateTo: (pageKey: string, data?: any) => void;
}

export const SousAdminRequestManagement: React.FC<SousAdminRequestManagementProps> = ({ user }) => {
    const [requests, setRequests] = useState<Request[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Vérification des permissions
    // Supprimer l'import du hook de permissions
    // Supprimer toute logique liée à checkPermission, hasReportAccess, permissionsLoading, etc.
    // Rendre toutes les actions accessibles
    const [mainTab, setMainTab] = useState<MainTabKey>('management');
    const [managementTab, setManagementTab] = useState<ManagementTabKey>('unassigned');
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState({ 
        status: 'all', 
        searchTerm: '', 
        startDate: '', 
        endDate: '',
        type: 'all'
    });
    
    // Related data
    const [users, setUsers] = useState<Record<string, User>>({});
    
    const ITEMS_PER_PAGE = 10;

    // Vérifier les permissions au chargement
    useEffect(() => {
        const checkUserPermissions = async () => {
            if (user?.id) {
                // Supprimer l'import du hook de permissions
                // Supprimer toute logique liée à checkPermission, hasReportAccess, permissionsLoading, etc.
                // Rendre toutes les actions accessibles
                console.log('Permission gestion requêtes:', true); // Always true now
            }
        };
        checkUserPermissions();
    }, [user?.id]);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        
        let query = supabase.from('requests').select('*');
        
        if (mainTab === 'management') {
            const pendingStatuses = [
                'En attente', 'Assignée', 'En cours de traitement',
                'en_attente', 'assignée', 'en_cours'
            ];
            query = query.in('status', pendingStatuses);
        }
        
        const { data, error } = await query.order('created_at', { ascending: false });
        
        if (error) {
            handleSupabaseError(error, "Chargement des requêtes");
            setRequests([]);
        } else {
            console.log(`Requêtes ${mainTab} trouvées (sous-admin):`, data?.length || 0);
            setRequests((data as unknown as Request[]) || []);
        }
        setLoading(false);
    }, [mainTab]);

    const fetchUsers = useCallback(async () => {
        const { data, error } = await supabase.from('profiles').select('id, name, role');
        
        if (!error) {
            const userMap = (data || []).reduce((acc, p) => {
                acc[p.id] = p as User;
                return acc;
            }, {} as Record<string, User>);
            setUsers(userMap);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
        fetchUsers();
    }, [fetchRequests, fetchUsers]);

    useEffect(() => {
        fetchRequests();
        setCurrentPage(1);
    }, [mainTab, fetchRequests]);

    const handleFilterChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setCurrentPage(1);
    };

    const filteredRequests = useMemo(() => {
        let filtered = requests;

        if (mainTab === 'management') {
            switch (managementTab) {
                case 'unassigned':
                    filtered = filtered.filter(r => !r.assigned_to);
                    break;
                case 'assigned_to_me':
                    filtered = filtered.filter(r => r.assigned_to === user.id);
                    break;
                case 'all_pending':
                    break;
            }
        }

        if (filters.status !== 'all') {
            filtered = filtered.filter(r => r.status === filters.status);
        }

        if (filters.type !== 'all') {
            filtered = filtered.filter(r => r.type === filters.type);
        }

        if (filters.searchTerm) {
            const searchLower = filters.searchTerm.toLowerCase();
            filtered = filtered.filter(r => {
                const demandeur = users[r.demandeur_id];
                return (
                    r.sujet.toLowerCase().includes(searchLower) ||
                    (r.description || '').toLowerCase().includes(searchLower) ||
                    r.type.toLowerCase().includes(searchLower) ||
                    (demandeur?.name || '').toLowerCase().includes(searchLower)
                );
            });
        }

        if (filters.startDate) {
            const startDate = new Date(filters.startDate);
            filtered = filtered.filter(r => new Date(r.created_at) >= startDate);
        }

        if (filters.endDate) {
            const endDate = new Date(filters.endDate);
            endDate.setHours(23, 59, 59, 999);
            filtered = filtered.filter(r => new Date(r.created_at) <= endDate);
        }

        return filtered;
    }, [requests, mainTab, managementTab, filters, user.id, users]);

    const paginatedRequests = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredRequests.slice(startIndex, startIndex + ITEMS_PER_PAGE);
    }, [filteredRequests, currentPage]);

    const totalPages = Math.ceil(filteredRequests.length / ITEMS_PER_PAGE);

    const handleAction = async (action: string, request: Request) => {
        try {
            switch (action) {
                case 'assign-self':
                    await supabase
                        .from('requests')
                        .update({ assigned_to: user.id, status: 'En cours de traitement' })
                        .eq('id', request.id);
                    break;
                case 'unassign':
                    await supabase
                        .from('requests')
                        .update({ assigned_to: null, status: 'En attente' })
                        .eq('id', request.id);
                    break;
                case 'resolve':
                    const response = prompt('Réponse à la requête:');
                    if (response) {
                        await supabase
                            .from('requests')
                            .update({ 
                                status: 'Résolue', 
                                reponse: response,
                                resolved_by_id: user.id,
                                resolution_date: new Date().toISOString()
                            })
                            .eq('id', request.id);
                    }
                    break;
                case 'close':
                    const closeReason = prompt('Motif de fermeture:');
                    if (closeReason) {
                        await supabase
                            .from('requests')
                            .update({ 
                                status: 'Fermée', 
                                reponse: closeReason,
                                resolved_by_id: user.id,
                                resolution_date: new Date().toISOString()
                            })
                            .eq('id', request.id);
                    }
                    break;
            }
            fetchRequests();
        } catch (error) {
            console.error('Erreur lors de l\'action:', error);
        }
    };

    const getStatistics = () => {
        if (mainTab === 'management') {
            const unassigned = requests.filter(r => !r.assigned_to).length;
            const assignedToMe = requests.filter(r => r.assigned_to === user.id).length;
            const total = requests.length;
            return { unassigned, assignedToMe, total, resolved: 0 };
        } else {
            const resolved = requests.filter(r => r.status === 'Résolue' || r.status === 'résolue').length;
            const closed = requests.filter(r => r.status === 'Fermée' || r.status === 'fermée').length;
            const pending = requests.filter(r => 
                r.status === 'En attente' || 
                r.status === 'en_attente' ||
                r.status === 'Assignée' ||
                r.status === 'assignée' ||
                r.status === 'En cours de traitement' ||
                r.status === 'en_cours'
            ).length;
            const total = requests.length;
            return { resolved, closed, pending, total };
        }
    };

    const stats = getStatistics();
    const uniqueTypes = [...new Set(requests.map(r => r.type))];

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                <span className="ml-3 text-gray-600">
                    Chargement des requêtes...
                </span>
            </div>
        );
    }

    // Vérification des permissions
    // Supprimer l'import du hook de permissions
    // Supprimer toute logique liée à checkPermission, hasReportAccess, permissionsLoading, etc.
    // Rendre toutes les actions accessibles

    return (
        <>
            <PageHeader
                title="Gestion des Requêtes"
                subtitle="Centre unifié pour la gestion et l'historique des requêtes (Sous-Admin)"
                icon="fa-headset"
                gradient="from-purple-500 to-pink-600"
            />

            <Card title="Centre de Support" icon="fa-life-ring">
                {/* Onglets principaux */}
                <div className="tabs mb-6">
                    <button 
                        onClick={() => setMainTab('management')} 
                        className={mainTab === 'management' ? 'active' : ''}
                    >
                        <i className="fas fa-tasks mr-2"></i>
                        Gestion ({stats.total})
                    </button>
                    <button 
                        onClick={() => setMainTab('history')} 
                        className={mainTab === 'history' ? 'active' : ''}
                    >
                        <i className="fas fa-archive mr-2"></i>
                        Historique Complet
                    </button>
                </div>

                {/* Statistiques dynamiques */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg">
                    {mainTab === 'management' ? (
                        <>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-orange-600">{stats.unassigned}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">Non assignées</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-purple-600">{stats.assignedToMe}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">Mes tâches</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-pink-600">{stats.total}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">En cours</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-600">{filteredRequests.length}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">Affichées</div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">Résolues</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-red-600">{stats.closed}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">Fermées</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">En cours</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold text-gray-600">{stats.total}</div>
                                <div className="text-sm text-gray-600 dark:text-gray-300">Total</div>
                            </div>
                        </>
                    )}
                </div>

                {/* Sous-onglets pour la gestion */}
                {mainTab === 'management' && (
                    <div className="tabs mb-6 bg-gray-50 dark:bg-gray-800/50 rounded-lg p-1">
                        <button 
                            onClick={() => { setManagementTab('unassigned'); setCurrentPage(1); }} 
                            className={managementTab === 'unassigned' ? 'active' : ''}
                        >
                            <i className="fas fa-exclamation-triangle mr-2"></i>
                            Non assignées ({stats.unassigned})
                        </button>
                        <button 
                            onClick={() => { setManagementTab('assigned_to_me'); setCurrentPage(1); }} 
                            className={managementTab === 'assigned_to_me' ? 'active' : ''}
                        >
                            <i className="fas fa-user-check mr-2"></i>
                            Mes tâches ({stats.assignedToMe})
                        </button>
                        <button 
                            onClick={() => { setManagementTab('all_pending'); setCurrentPage(1); }} 
                            className={managementTab === 'all_pending' ? 'active' : ''}
                        >
                            <i className="fas fa-list mr-2"></i>
                            Toutes ({stats.total})
                        </button>
                    </div>
                )}

                {/* Filtres et recherche */}
                <div className="mb-6 space-y-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                                <input
                                    type="text"
                                    name="searchTerm"
                                    placeholder="Rechercher par sujet, description, demandeur..."
                                    className="form-input pl-10"
                                    value={filters.searchTerm}
                                    onChange={handleFilterChange}
                                />
                            </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-3">
                            <select
                                name="status"
                                className="form-select form-select-sm min-w-[140px]"
                                value={filters.status}
                                onChange={handleFilterChange}
                            >
                                <option value="all">Tous les statuts</option>
                                {mainTab === 'management' ? (
                                    <>
                                        <option value="En attente">En attente</option>
                                        <option value="Assignée">Assignée</option>
                                        <option value="En cours de traitement">En cours</option>
                                    </>
                                ) : (
                                    <>
                                        <option value="Résolue">Résolue</option>
                                        <option value="Fermée">Fermée</option>
                                        <option value="En attente">En attente</option>
                                        <option value="En cours de traitement">En cours</option>
                                    </>
                                )}
                            </select>

                            <select
                                name="type"
                                className="form-select form-select-sm min-w-[140px]"
                                value={filters.type}
                                onChange={handleFilterChange}
                            >
                                <option value="all">Tous les types</option>
                                {uniqueTypes.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                            
                            <input
                                type="date"
                                name="startDate"
                                className="form-input form-input-sm"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                                title="Date de début"
                            />
                            
                            <input
                                type="date"
                                name="endDate"
                                className="form-input form-input-sm"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                                title="Date de fin"
                            />
                        </div>
                    </div>
                </div>

                {/* Liste des requêtes */}
                {filteredRequests.length === 0 ? (
                    <div className="text-center py-12">
                        <i className={`fas ${mainTab === 'management' ? 'fa-tasks text-purple-300' : 'fa-archive text-pink-300'} text-4xl mb-4`}></i>
                        <p className="text-gray-500 mb-2">
                            {mainTab === 'management' ? 'Aucune requête à traiter' : 'Aucune requête dans l\'historique'}
                        </p>
                        {(filters.searchTerm || filters.status !== 'all' || filters.type !== 'all') && (
                            <button
                                onClick={() => setFilters({ status: 'all', searchTerm: '', startDate: '', endDate: '', type: 'all' })}
                                className="text-blue-500 hover:underline text-sm"
                            >
                                Réinitialiser les filtres
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="space-y-4">
                            {paginatedRequests.map(request => {
                                const demandeur = users[request.demandeur_id];
                                const assignedUser = request.assigned_to ? users[request.assigned_to] : null;
                                const resolver = request.resolved_by_id ? users[request.resolved_by_id] : null;
                                
                                return (
                                    <div key={request.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                                        <div className={`px-4 py-3 border-l-4 ${
                                            request.status === 'Résolue' ? 'border-green-500 bg-green-50 dark:bg-green-900/20' :
                                            request.status === 'Fermée' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' :
                                            !request.assigned_to ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 
                                            request.assigned_to === user.id ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 
                                            'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
                                        }`}>
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-3 flex-1">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                                                        request.status === 'Résolue' ? 'bg-green-100 text-green-600' :
                                                        request.status === 'Fermée' ? 'bg-red-100 text-red-600' :
                                                        !request.assigned_to ? 'bg-orange-100 text-orange-600' : 
                                                        request.assigned_to === user.id ? 'bg-purple-100 text-purple-600' : 
                                                        'bg-gray-100 text-gray-600'
                                                    }`}>
                                                        <i className={`fas ${getRequestIcon(request.type)} text-xs`}></i>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate mb-1">
                                                            {request.sujet}
                                                        </h3>
                                                        <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                                                            <span className="font-medium">{request.type}</span> • 
                                                            <span className="ml-1">{demandeur?.name || 'Utilisateur inconnu'}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-700 dark:text-gray-200 line-clamp-2">
                                                            {request.description}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end space-y-2 ml-4">
                                                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getBadgeClass(request.status)}`}>
                                                        {request.status === 'Résolue' && <i className="fas fa-check-circle mr-1"></i>}
                                                        {request.status === 'Fermée' && <i className="fas fa-times-circle mr-1"></i>}
                                                        {request.status === 'En attente' && <i className="fas fa-clock mr-1"></i>}
                                                        {request.status === 'En cours de traitement' && <i className="fas fa-cog mr-1"></i>}
                                                        {request.status}
                                                    </span>
                                                    <div className="text-xs text-gray-500 text-right">
                                                        {formatDate(request.created_at)}
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            {(assignedUser || resolver) && (
                                                <div className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                                                    {assignedUser && `Assigné à: ${assignedUser.name}`}
                                                    {resolver && ` • Résolu par: ${resolver.name}`}
                                                </div>
                                            )}
                                        </div>
                                        
                                        <div className="px-4 py-3">
                                            <div className="flex flex-wrap gap-2">
                                                {mainTab === 'management' && (
                                                    request.assigned_to === user.id ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleAction('resolve', request)}
                                                                className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-green-100 hover:bg-green-200 text-green-700 rounded-md transition-colors text-sm"
                                                            >
                                                                <i className="fas fa-check mr-1"></i>
                                                                Résoudre
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction('close', request)}
                                                                className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors text-sm"
                                                            >
                                                                <i className="fas fa-times mr-1"></i>
                                                                Fermer
                                                            </button>
                                                            <button
                                                                onClick={() => handleAction('unassign', request)}
                                                                className="inline-flex items-center px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors text-sm"
                                                            >
                                                                <i className="fas fa-user-minus mr-1"></i>
                                                                Se désassigner
                                                            </button>
                                                        </>
                                                    ) : !request.assigned_to ? (
                                                        <button
                                                            onClick={() => handleAction('assign-self', request)}
                                                            className="flex-1 inline-flex items-center justify-center px-3 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-md transition-colors text-sm"
                                                        >
                                                            <i className="fas fa-user-plus mr-1"></i>
                                                            S'assigner
                                                        </button>
                                                    ) : (
                                                        <div className="text-sm text-gray-500 italic">
                                                            Assigné à {assignedUser?.name}
                                                        </div>
                                                    )
                                                )}

                                                {request.reponse && (
                                                    <div className="w-full mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded text-sm">
                                                        <strong className="text-blue-800 dark:text-blue-200">Réponse:</strong>
                                                        <p className="text-blue-700 dark:text-blue-300 mt-1">{request.reponse}</p>
                                                        {request.resolution_date && (
                                                            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                                                                Résolu le {formatDate(request.resolution_date)}
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

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
                    </>
                )}
            </Card>
        </>
    );
};