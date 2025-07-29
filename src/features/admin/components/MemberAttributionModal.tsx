import React, { useState, useMemo } from 'react';
import { UserForAttribution } from '../../../types/agencyAttribution';

interface MemberAttributionModalProps {
  isOpen: boolean;
  agencyId: string;
  agencyName: string;
  availableUsers: UserForAttribution[];
  onClose: () => void;
  onAttributeUsers: (userIds: string[], role?: string) => Promise<void>;
  isProcessing?: boolean;
}

// User card component for selection
const UserCard: React.FC<{
  user: UserForAttribution;
  isSelected: boolean;
  onToggleSelect: (userId: string) => void;
  selectedRole?: string;
}> = ({ user, isSelected, onToggleSelect, selectedRole }) => {
  const canBeChef = user.can_be_chef && selectedRole === 'chef_agence';
  const isAssigned = user.attribution_status === 'assigned';
  const isDisabled = isAssigned && !canBeChef;

  return (
    <div 
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected 
          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
          : isDisabled
            ? 'border-gray-200 bg-gray-50 dark:bg-gray-800 opacity-50 cursor-not-allowed'
            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
      }`}
      onClick={() => !isDisabled && onToggleSelect(user.id)}
    >
      <div className="flex items-center space-x-3">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => !isDisabled && onToggleSelect(user.id)}
          disabled={isDisabled}
          className="text-blue-600 rounded"
        />
        
        <img
          src={`https://placehold.co/32x32/E2E8F0/4A5568?text=${user.avatar_seed || user.name?.slice(0, 2).toUpperCase() || 'U'}`}
          alt={user.name || 'Utilisateur'}
          className="w-8 h-8 rounded-full"
        />
        
        <div className="flex-1">
          <h4 className="font-medium text-gray-900 dark:text-gray-100">
            {user.name || 'Nom non disponible'}
          </h4>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {user.email}
          </p>
          
          <div className="flex items-center space-x-2 mt-1">
            {/* Role badge */}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              user.role === 'chef_agence' 
                ? 'bg-purple-100 text-purple-800' 
                : 'bg-blue-100 text-blue-800'
            }`}>
              {user.role === 'chef_agence' ? 'Chef d\'Agence' : 'Agent'}
            </span>
            
            {/* Status badge */}
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              user.attribution_status === 'available'
                ? 'bg-green-100 text-green-800'
                : user.attribution_status === 'assigned'
                  ? 'bg-orange-100 text-orange-800'
                  : 'bg-gray-100 text-gray-800'
            }`}>
              {user.attribution_status === 'available' && 'Disponible'}
              {user.attribution_status === 'assigned' && 'Déjà assigné'}
              {user.attribution_status === 'pending' && 'En attente'}
            </span>
          </div>
          
          {user.current_agency_name && (
            <p className="text-xs text-gray-400 mt-1">
              Agence actuelle: {user.current_agency_name}
            </p>
          )}
        </div>
      </div>
      
      {isDisabled && (
        <div className="mt-2 text-xs text-gray-500">
          Cet utilisateur est déjà assigné à une autre agence
        </div>
      )}
    </div>
  );
};

export const MemberAttributionModal: React.FC<MemberAttributionModalProps> = ({
  isOpen,
  agencyId,
  agencyName,
  availableUsers,
  onClose,
  onAttributeUsers,
  isProcessing = false
}) => {
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('agent');
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('available');

  // Filter users based on search and filters
  const filteredUsers = useMemo(() => {
    return availableUsers.filter(user => {
      const matchesSearch = !searchTerm || 
        user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      
      const matchesStatus = statusFilter === 'all' || user.attribution_status === statusFilter;
      
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [availableUsers, searchTerm, roleFilter, statusFilter]);

  // Available users for chef role (only chef_agence users who are not already assigned)
  const availableChefs = filteredUsers.filter(user => 
    user.role === 'chef_agence' && user.attribution_status === 'available'
  );

  const handleToggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    const selectableUsers = filteredUsers.filter(user => 
      user.attribution_status === 'available' || 
      (selectedRole === 'chef_agence' && user.can_be_chef)
    );
    
    if (selectedUsers.length === selectableUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(selectableUsers.map(user => user.id));
    }
  };

  const handleSubmit = async () => {
    if (selectedUsers.length === 0) return;

    // Validation for chef role
    if (selectedRole === 'chef_agence' && selectedUsers.length > 1) {
      alert('Vous ne pouvez assigner qu\'un seul chef par agence');
      return;
    }

    try {
      await onAttributeUsers(selectedUsers, selectedRole);
      // Reset form
      setSelectedUsers([]);
      setSearchTerm('');
      setSelectedRole('agent');
    } catch (error) {
      console.error('Erreur lors de l\'attribution:', error);
    }
  };

  const handleClose = () => {
    setSelectedUsers([]);
    setSearchTerm('');
    setSelectedRole('agent');
    onClose();
  };

  if (!isOpen) return null;

  const selectableUsers = filteredUsers.filter(user => 
    user.attribution_status === 'available' || 
    (selectedRole === 'chef_agence' && user.can_be_chef)
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Attribution des membres</h2>
              <p className="text-blue-100 text-sm">
                Agence: {agencyName}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-white hover:text-gray-200 p-2"
              disabled={isProcessing}
            >
              <i className="fas fa-times text-xl"></i>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-full max-h-[calc(90vh-80px)]">
          {/* Controls */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="space-y-4">
              {/* Role Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Rôle à attribuer
                </label>
                <div className="flex space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="agent"
                      checked={selectedRole === 'agent'}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="text-blue-600"
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Agent
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="chef_agence"
                      checked={selectedRole === 'chef_agence'}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      className="text-blue-600"
                      disabled={availableChefs.length === 0}
                    />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      Chef d'Agence
                      {availableChefs.length === 0 && (
                        <span className="text-gray-400 ml-1">(Aucun chef disponible)</span>
                      )}
                    </span>
                  </label>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                  <input
                    type="text"
                    placeholder="Rechercher un utilisateur..."
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
                  <option value="agent">Agents</option>
                  <option value="chef_agence">Chefs d'agence</option>
                </select>
                
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="form-select"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="available">Disponibles</option>
                  <option value="assigned">Déjà assignés</option>
                </select>
              </div>

              {/* Selection Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={handleSelectAll}
                    className="text-sm text-blue-600 hover:text-blue-800"
                    disabled={selectableUsers.length === 0}
                  >
                    {selectedUsers.length === selectableUsers.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                  </button>
                  <span className="text-sm text-gray-500">
                    {selectedUsers.length} utilisateur(s) sélectionné(s)
                  </span>
                </div>
                
                <span className="text-sm text-gray-500">
                  {filteredUsers.length} utilisateur(s) trouvé(s)
                </span>
              </div>
            </div>
          </div>

          {/* Users List */}
          <div className="flex-1 overflow-y-auto p-6">
            {filteredUsers.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredUsers.map((user) => (
                  <UserCard
                    key={user.id}
                    user={user}
                    isSelected={selectedUsers.includes(user.id)}
                    onToggleSelect={handleToggleUser}
                    selectedRole={selectedRole}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <i className="fas fa-users text-4xl"></i>
                </div>
                <p className="text-gray-500 text-lg">
                  Aucun utilisateur ne correspond aux critères de recherche
                </p>
                <p className="text-gray-400 text-sm mt-2">
                  Essayez de modifier vos filtres de recherche
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {selectedRole === 'chef_agence' && selectedUsers.length > 1 && (
                  <span className="text-red-500">
                    <i className="fas fa-exclamation-triangle mr-1"></i>
                    Vous ne pouvez sélectionner qu'un seul chef
                  </span>
                )}
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleClose}
                  className="btn-secondary"
                  disabled={isProcessing}
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmit}
                  className="btn-primary"
                  disabled={selectedUsers.length === 0 || isProcessing || (selectedRole === 'chef_agence' && selectedUsers.length > 1)}
                >
                  {isProcessing ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Attribution en cours...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-user-plus mr-2"></i>
                      Attribuer {selectedUsers.length} utilisateur(s)
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};