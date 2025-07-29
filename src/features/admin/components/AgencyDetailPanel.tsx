import React, { useState } from 'react';
import { AgencyWithAttributionStats, AgencyMember } from '../../../types/agencyAttribution';
import { formatDate } from '../../../utils/formatters';

interface AgencyDetailPanelProps {
  agency: AgencyWithAttributionStats;
  members: AgencyMember[];
  onAddMembers: () => void;
  onRemoveMember: (memberId: string) => void;
  onChangeRole: (memberId: string, newRole: string) => void;
  onBack: () => void;
  isLoading?: boolean;
}

// Member card component
const MemberCard: React.FC<{
  member: AgencyMember;
  onRemove: (memberId: string) => void;
  onChangeRole: (memberId: string, newRole: string) => void;
}> = ({ member, onRemove, onChangeRole }) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  
  const isChef = member.role === 'chef_agence';
  const isActive = member.status === 'active';

  const handleRoleChange = (newRole: string) => {
    if (newRole !== member.role) {
      onChangeRole(member.id, newRole);
    }
    setShowRoleMenu(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <img
            src={`https://placehold.co/40x40/E2E8F0/4A5568?text=${member.avatar_seed || member.name.slice(0, 2).toUpperCase()}`}
            alt={member.name}
            className="w-10 h-10 rounded-full"
          />
          
          {/* Member info */}
          <div>
            <h4 className="font-medium text-gray-900 dark:text-gray-100">
              {member.name}
            </h4>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {member.email}
            </p>
            <div className="flex items-center space-x-2 mt-1">
              {/* Role badge */}
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                isChef 
                  ? 'bg-purple-100 text-purple-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {isChef ? (
                  <>
                    <i className="fas fa-crown mr-1"></i>
                    Chef d'Agence
                  </>
                ) : (
                  <>
                    <i className="fas fa-user mr-1"></i>
                    Agent
                  </>
                )}
              </span>
              
              {/* Status badge */}
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                isActive 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
        </div>

        {/* Actions menu */}
        <div className="relative">
          <button
            onClick={() => setShowRoleMenu(!showRoleMenu)}
            className="text-gray-400 hover:text-gray-600 p-1"
            title="Actions"
          >
            <i className="fas fa-ellipsis-v"></i>
          </button>
          
          {showRoleMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700 z-10">
              <div className="py-1">
                <div className="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                  Changer le rôle
                </div>
                
                <button
                  onClick={() => handleRoleChange('agent')}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    member.role === 'agent' ? 'bg-blue-50 text-blue-700' : 'text-gray-700 dark:text-gray-300'
                  }`}
                  disabled={member.role === 'agent'}
                >
                  <i className="fas fa-user mr-2"></i>
                  Agent
                </button>
                
                <button
                  onClick={() => handleRoleChange('chef_agence')}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    member.role === 'chef_agence' ? 'bg-purple-50 text-purple-700' : 'text-gray-700 dark:text-gray-300'
                  }`}
                  disabled={member.role === 'chef_agence'}
                >
                  <i className="fas fa-crown mr-2"></i>
                  Chef d'Agence
                </button>
                
                <div className="border-t border-gray-200 dark:border-gray-700 mt-1">
                  <button
                    onClick={() => {
                      setShowRoleMenu(false);
                      onRemove(member.id);
                    }}
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <i className="fas fa-user-minus mr-2"></i>
                    Retirer de l'agence
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Additional member info */}
      <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Rejoint le:</span>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {formatDate(member.joinedAt)}
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Dernière activité:</span>
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {formatDate(member.lastActivity)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Statistics card component
const StatCard: React.FC<{
  title: string;
  value: string | number;
  icon: string;
  color: string;
  subtitle?: string;
}> = ({ title, value, icon, color, subtitle }) => (
  <div className={`bg-gradient-to-r ${color} rounded-lg p-4 text-white`}>
    <div className="flex items-center">
      <div className="p-2 bg-white/20 rounded-lg mr-3">
        <i className={`fas ${icon}`}></i>
      </div>
      <div>
        <p className="text-sm opacity-90">{title}</p>
        <p className="text-xl font-bold">{value}</p>
        {subtitle && <p className="text-xs opacity-75">{subtitle}</p>}
      </div>
    </div>
  </div>
);

export const AgencyDetailPanel: React.FC<AgencyDetailPanelProps> = ({
  agency,
  members,
  onAddMembers,
  onRemoveMember,
  onChangeRole,
  onBack,
  isLoading = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Filter members based on search and filters
  const filteredMembers = members.filter(member => {
    const matchesSearch = !searchTerm || 
      member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    
    return matchesSearch && matchesRole && matchesStatus;
  });

  const chefMember = members.find(member => member.role === 'chef_agence');
  const agentMembers = members.filter(member => member.role === 'agent');
  const activeMembers = members.filter(member => member.status === 'active');

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Chargement des détails de l'agence...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Retour à la liste"
          >
            <i className="fas fa-arrow-left"></i>
          </button>
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {agency.name}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              Gestion détaillée de l'agence
            </p>
          </div>
        </div>
        
        <button
          onClick={onAddMembers}
          className="btn-primary"
        >
          <i className="fas fa-user-plus mr-2"></i>
          Ajouter des membres
        </button>
      </div>

      {/* Agency Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Membres"
          value={members.length}
          icon="fa-users"
          color="from-blue-500 to-blue-600"
        />
        <StatCard
          title="Membres Actifs"
          value={activeMembers.length}
          icon="fa-user-check"
          color="from-green-500 to-green-600"
          subtitle={`${Math.round((activeMembers.length / members.length) * 100)}%`}
        />
        <StatCard
          title="Transactions (30j)"
          value={agency.total_transactions}
          icon="fa-exchange-alt"
          color="from-purple-500 to-purple-600"
        />
        <StatCard
          title="Volume Mensuel"
          value={new Intl.NumberFormat('fr-FR', { 
            style: 'currency', 
            currency: 'XOF',
            notation: 'compact'
          }).format(agency.monthly_volume)}
          icon="fa-chart-line"
          color="from-orange-500 to-orange-600"
        />
      </div>

      {/* Chef Information */}
      {chefMember ? (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <img
                src={`https://placehold.co/48x48/E2E8F0/4A5568?text=${chefMember.avatar_seed || chefMember.name.slice(0, 2).toUpperCase()}`}
                alt={chefMember.name}
                className="w-12 h-12 rounded-full"
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {chefMember.name}
                </h3>
                <p className="text-purple-600 dark:text-purple-400 font-medium">
                  <i className="fas fa-crown mr-1"></i>
                  Chef d'Agence
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {chefMember.email}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">En poste depuis</p>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {formatDate(chefMember.joinedAt)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-6 border border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
                <i className="fas fa-exclamation-triangle text-orange-600"></i>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  Aucun chef assigné
                </h3>
                <p className="text-orange-600 dark:text-orange-400">
                  Cette agence nécessite l'assignation d'un chef
                </p>
              </div>
            </div>
            <button
              onClick={onAddMembers}
              className="btn-warning"
            >
              <i className="fas fa-crown mr-2"></i>
              Assigner un chef
            </button>
          </div>
        </div>
      )}

      {/* Members Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Membres de l'agence ({filteredMembers.length})
            </h3>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                placeholder="Rechercher un membre..."
                className="form-input pl-10 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="form-select"
            >
              <option value="all">Tous les rôles</option>
              <option value="chef_agence">Chef d'agence</option>
              <option value="agent">Agents</option>
            </select>
            
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actifs</option>
              <option value="inactive">Inactifs</option>
              <option value="suspended">Suspendus</option>
            </select>
          </div>
        </div>

        {/* Members List */}
        <div className="p-6">
          {filteredMembers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredMembers.map((member) => (
                <MemberCard
                  key={member.id}
                  member={member}
                  onRemove={onRemoveMember}
                  onChangeRole={onChangeRole}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-4">
                <i className="fas fa-users text-4xl"></i>
              </div>
              <p className="text-gray-500 text-lg">
                {searchTerm || roleFilter !== 'all' || statusFilter !== 'all'
                  ? 'Aucun membre ne correspond aux critères de recherche'
                  : 'Cette agence n\'a pas encore de membres'
                }
              </p>
              {(!searchTerm && roleFilter === 'all' && statusFilter === 'all') && (
                <button
                  onClick={onAddMembers}
                  className="btn-primary mt-4"
                >
                  <i className="fas fa-user-plus mr-2"></i>
                  Ajouter des membres
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Métriques de Performance
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {agency.total_transactions}
            </div>
            <p className="text-sm text-gray-500">Transactions (30 jours)</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {new Intl.NumberFormat('fr-FR', { 
                style: 'currency', 
                currency: 'XOF',
                notation: 'compact'
              }).format(agency.monthly_volume)}
            </div>
            <p className="text-sm text-gray-500">Volume mensuel</p>
          </div>
          
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600 mb-1">
              {agency.total_transactions > 0 
                ? Math.round(agency.monthly_volume / agency.total_transactions)
                : 0
              } XOF
            </div>
            <p className="text-sm text-gray-500">Transaction moyenne</p>
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500">
            Dernière activité: {formatDate(agency.last_activity)}
          </p>
        </div>
      </div>
    </div>
  );
};