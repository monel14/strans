import React, { useState, useMemo } from 'react';
import { PageComponentProps } from '../../types';
import { Card } from '../../components/common/Card';
import { PageHeader } from '../../components/common/PageHeader';
import { Pagination } from '../../components/common/Pagination';
import { useUnifiedAgencyManagement } from '../../hooks/useUnifiedAgencyManagement';
import { useAgencyAttribution } from '../../hooks/useAgencyAttribution';
import { AgencyWithAttributionStats } from '../../types/agencyAttribution';

// Import components
import { AgencyDetailPanel } from './components/AgencyDetailPanel';
// import { MemberAttributionModal } from './components/MemberAttributionModal';
// import { BulkAttributionModal } from './components/BulkAttributionModal';

const ITEMS_PER_PAGE = 12;

// Statistics card component
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => (
  <div className={`bg-gradient-to-r ${color} rounded-xl p-4 text-white shadow-lg`}>
    <div className="flex items-center">
      <div className="p-3 bg-white/20 rounded-full mr-3">
        <i className={`fas ${icon} text-xl`}></i>
      </div>
      <div>
        <p className="text-sm opacity-90">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && <p className="text-xs opacity-75">{subtitle}</p>}
      </div>
    </div>
  </div>
);

// Agency card component for list view
const AgencyCard: React.FC<{
  agency: AgencyWithAttributionStats;
  onSelect: (agencyId: string) => void;
  onAddMembers: (agencyId: string) => void;
  isSelected?: boolean;
}> = ({ agency, onSelect, onAddMembers, isSelected = false }) => {
  const hasChef = !!agency.chef_name;
  const isActive = agency.active_agents > 0;

  return (
    <div
      className={`bg-white dark:bg-gray-900 rounded-xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border-2 ${isSelected ? 'border-blue-500' : 'border-transparent hover:border-blue-200'
        } ${!hasChef ? 'ring-2 ring-orange-200' : ''}`}
      onClick={() => onSelect(agency.id)}
    >
      {/* Header with agency name and status indicators */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <h4 className="text-lg font-bold text-gray-800 dark:text-gray-100 mb-1">
            {agency.name}
          </h4>
          <div className="flex items-center space-x-2">
            {!hasChef && (
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                <i className="fas fa-exclamation-triangle mr-1"></i>
                Sans chef
              </span>
            )}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-gray-100 text-gray-800'
              }`}>
              {isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddMembers(agency.id);
          }}
          className="text-gray-400 hover:text-blue-600 transition-colors p-2"
          title="Gérer les membres"
        >
          <i className="fas fa-user-plus"></i>
        </button>
      </div>

      {/* Chef information */}
      {hasChef ? (
        <div className="flex items-center mb-4">
          <img
            src={`https://placehold.co/32x32/E2E8F0/4A5568?text=${agency.chef_avatar_seed || 'CH'}`}
            alt={agency.chef_name}
            className="w-8 h-8 rounded-full mr-3"
          />
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {agency.chef_name}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Chef d'Agence
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center mb-4 text-sm text-orange-600 italic">
          <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 mr-3 flex items-center justify-center">
            <i className="fas fa-user-slash text-xs"></i>
          </div>
          <p>Aucun chef assigné</p>
        </div>
      )}

      {/* Statistics */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Membres totaux:</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            {agency.agent_count}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Membres actifs:</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            {agency.active_agents}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-400">Transactions (30j):</span>
          <span className="font-semibold text-gray-800 dark:text-gray-200">
            {agency.total_transactions}
          </span>
        </div>
        {agency.monthly_volume > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">Volume mensuel:</span>
            <span className="font-semibold text-green-600">
              {new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'XOF'
              }).format(agency.monthly_volume)}
            </span>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-500">
            Dernière activité: {new Date(agency.last_activity).toLocaleDateString('fr-FR')}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSelect(agency.id);
            }}
            className="text-xs text-blue-600 hover:text-blue-800 font-medium"
          >
            Voir détails →
          </button>
        </div>
      </div>
    </div>
  );
};

export const UnifiedAgencyManagement: React.FC<PageComponentProps> = ({
  user,
  navigateTo,
  refreshCurrentUser
}) => {
  // Hooks
  const {
    selectedAgencyId,
    viewMode,
    searchTerm,
    filterStatus,
    loading,
    agencies,
    selectedAgency,
    selectedAgencyMembers,
    availableUsers,
    setSelectedAgency,
    setViewMode,
    setSearchTerm,
    setFilterStatus,
    refreshData,
    totalAgencies,
    agenciesWithoutChef,
    totalMembers,
    activeMembers
  } = useUnifiedAgencyManagement();

  const {
    isProcessing,
    assignUserToAgency,
    removeUserFromAgency,
    changeUserRole,
    assignMultipleUsers,
    validateAttributionPermissions
  } = useAgencyAttribution(user);

  // Local state
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [showAttributionModal, setShowAttributionModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);

  // Pagination
  const totalPages = Math.ceil(agencies.length / ITEMS_PER_PAGE);
  const paginatedAgencies = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return agencies.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [agencies, currentPage]);

  // Event handlers
  const handleAgencySelect = (agencyId: string) => {
    setSelectedAgency(agencyId);
  };

  const handleBackToList = () => {
    setViewMode('list');
    setSelectedAgency(null);
  };

  const handleAddMembers = (agencyId: string) => {
    setSelectedAgency(agencyId);
    setShowAttributionModal(true);
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir retirer ce membre de l\'agence ?')) {
      return;
    }

    const result = await removeUserFromAgency(memberId, 'Retiré par l\'administrateur');
    if (result.success) {
      refreshData();
      // Show success notification
      console.log(result.message);
    } else {
      // Show error notification
      console.error(result.message);
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string) => {
    const result = await changeUserRole(memberId, newRole, 'Changement de rôle par l\'administrateur');
    if (result.success) {
      refreshData();
      // Show success notification
      console.log(result.message);
    } else {
      // Show error notification
      console.error(result.message);
    }
  };

  const handleAttributeUsers = async (userIds: string[], role?: string) => {
    if (!selectedAgencyId) return;

    const result = await assignMultipleUsers(
      userIds,
      selectedAgencyId,
      role,
      'Attribution par l\'administrateur'
    );

    if (result.successCount > 0) {
      refreshData();
      setShowAttributionModal(false);
      // Show success notification
      console.log(result.summary);
    }

    if (result.failureCount > 0) {
      // Show error notification with details
      console.error('Certaines attributions ont échoué:', result.failures);
    }
  };

  // Check permissions
  const canManageAttributions = validateAttributionPermissions('assign').isValid;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Chargement de la gestion unifiée...</span>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Gestion Unifiée des Agences"
        subtitle="Interface centralisée pour la gestion des agences et l'attribution des membres"
        icon="fa-sitemap"
        gradient="from-indigo-600 to-purple-600"
      />

      {/* Global Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Total Agences"
          value={totalAgencies}
          icon="fa-building"
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Sans Chef"
          value={agenciesWithoutChef}
          icon="fa-exclamation-triangle"
          color="from-orange-500 to-orange-600"
          subtitle={agenciesWithoutChef > 0 ? "Nécessite attention" : "Tout va bien"}
        />
        <StatCard
          title="Total Membres"
          value={totalMembers}
          icon="fa-users"
          color="from-green-500 to-green-600"
        />
        <StatCard
          title="Membres Actifs"
          value={activeMembers}
          icon="fa-user-check"
          color="from-purple-500 to-purple-600"
          subtitle={`${Math.round((activeMembers / totalMembers) * 100)}% actifs`}
        />
      </div>

      <Card title="Gestion des Agences" icon="fa-sitemap">
        {viewMode === 'list' ? (
          <>
            {/* Search and Filter Controls */}
            <div className="mb-6 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative">
                    <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                    <input
                      type="text"
                      placeholder="Rechercher une agence ou un chef..."
                      className="form-input pl-10 w-64"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>

                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="form-select"
                  >
                    <option value="all">Toutes les agences</option>
                    <option value="with_chef">Avec chef</option>
                    <option value="without_chef">Sans chef</option>
                    <option value="active">Actives</option>
                    <option value="inactive">Inactives</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  {canManageAttributions && (
                    <button
                      onClick={() => setShowBulkModal(true)}
                      className="btn-secondary"
                      disabled={isProcessing}
                    >
                      <i className="fas fa-tasks mr-2"></i>
                      Actions en lot
                    </button>
                  )}

                  <button
                    onClick={() => navigateTo('create-agency')}
                    className="btn-primary"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Créer une agence
                  </button>
                </div>
              </div>
            </div>

            {/* Agencies Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedAgencies.map((agency) => (
                <AgencyCard
                  key={agency.id}
                  agency={agency}
                  onSelect={handleAgencySelect}
                  onAddMembers={handleAddMembers}
                  isSelected={selectedAgencyId === agency.id}
                />
              ))}
            </div>

            {agencies.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <i className="fas fa-building text-4xl"></i>
                </div>
                <p className="text-gray-500 text-lg">Aucune agence ne correspond à vos critères</p>
                <button
                  onClick={() => navigateTo('create-agency')}
                  className="btn-primary mt-4"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Créer votre première agence
                </button>
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
          </>
        ) : (
          // Detail View
          selectedAgency && (
            <AgencyDetailPanel
              agency={selectedAgency}
              members={selectedAgencyMembers}
              onAddMembers={() => setShowAttributionModal(true)}
              onRemoveMember={handleRemoveMember}
              onChangeRole={handleChangeRole}
              onBack={handleBackToList}
              isLoading={false}
            />
          )
        )}
      </Card>

      {/* Modals - These will be implemented in subsequent tasks */}
      {showAttributionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Attribution des membres</h3>
            <p className="text-gray-600 mb-4">
              Modal d'attribution en cours d'implémentation...
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowAttributionModal(false)}
                className="btn-secondary"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {showBulkModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Actions en lot</h3>
            <p className="text-gray-600 mb-4">
              Modal d'actions en lot en cours d'implémentation...
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowBulkModal(false)}
                className="btn-secondary"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};