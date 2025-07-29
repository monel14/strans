import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { handleSupabaseError } from '../utils/errorUtils';
import { useAgencies } from './useAgencies';
import {
  BaseAgency,
  AgencyWithAttributionStats,
  AgencyMember,
  AgencyStats,
  UserForAttribution
} from '../types/agencyAttribution';
import {
  calculateAgencyStats,
  agencyToAgencyWithStats,
  profileToAgencyMember,
  filterAvailableUsers,
  sortAgenciesByPriority
} from '../utils/agencyAttributionUtils';

// View modes for the unified interface
export type ViewMode = 'list' | 'detail';

// Filter status options
export type FilterStatus = 'all' | 'with_chef' | 'without_chef' | 'active' | 'inactive';

// Hook state interface
interface UnifiedAgencyManagementState {
  selectedAgencyId: string | null;
  viewMode: ViewMode;
  searchTerm: string;
  filterStatus: FilterStatus;
  extendedAgencies: AgencyWithAttributionStats[];
  selectedAgencyMembers: AgencyMember[];
  availableUsers: UserForAttribution[];
  loading: boolean;
  membersLoading: boolean;
  usersLoading: boolean;
}

export const useUnifiedAgencyManagement = () => {
  // State management
  const [state, setState] = useState<UnifiedAgencyManagementState>({
    selectedAgencyId: null,
    viewMode: 'list',
    searchTerm: '',
    filterStatus: 'all',
    extendedAgencies: [],
    selectedAgencyMembers: [],
    availableUsers: [],
    loading: true,
    membersLoading: false,
    usersLoading: false
  });

  // Integration with existing useAgencies hook
  const { agencies: baseAgencies, loading: baseLoading, refetchAgencies } = useAgencies();

  // Fetch extended statistics for agencies
  const fetchExtendedAgencyStats = useCallback(async () => {
    if (!baseAgencies.length) return;

    setState(prev => ({ ...prev, loading: true }));

    try {
      // Fetch all profiles for statistics calculation
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, role, status, avatar_seed, agency_id, created_at, updated_at');

      if (profilesError) {
        handleSupabaseError(profilesError, "Chargement des profils pour les statistiques étendues");
        return;
      }

      // Fetch transactions for volume calculations (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data: transactionsData, error: transactionsError } = await supabase
        .from('transactions')
        .select('id, montant_total, created_at, agent_id')
        .gte('created_at', thirtyDaysAgo.toISOString());

      if (transactionsError) {
        handleSupabaseError(transactionsError, "Chargement des transactions pour les statistiques");
      }

      const profiles = profilesData || [];
      const transactions = transactionsData || [];

      // Group profiles by agency
      const profilesByAgency = new Map<string, any[]>();
      profiles.forEach(profile => {
        if (profile.agency_id) {
          if (!profilesByAgency.has(profile.agency_id)) {
            profilesByAgency.set(profile.agency_id, []);
          }
          profilesByAgency.get(profile.agency_id)!.push(profile);
        }
      });

      // Calculate extended statistics for each agency
      const extendedAgencies = baseAgencies.map(baseAgency => {
        const agencyProfiles = profilesByAgency.get(baseAgency.id) || [];
        const agencyMembers = agencyProfiles.map(profileToAgencyMember);
        
        // Filter transactions for this agency
        const agencyTransactions = transactions.filter(t => 
          agencyProfiles.some(p => p.id === t.agent_id)
        );

        const stats = calculateAgencyStats(agencyMembers, agencyTransactions);
        
        // Find chef information
        const chef = agencyProfiles.find(p => p.role === 'chef_agence');
        const chefInfo = chef ? {
          name: chef.name,
          email: chef.email,
          avatar_seed: chef.avatar_seed
        } : undefined;

        return agencyToAgencyWithStats(
          {
            id: baseAgency.id,
            name: baseAgency.name,
            chef_id: baseAgency.chef_id
          },
          stats,
          chefInfo
        );
      });

      setState(prev => ({
        ...prev,
        extendedAgencies: sortAgenciesByPriority(extendedAgencies),
        loading: false
      }));

    } catch (error) {
      console.error('Error fetching extended agency stats:', error);
      setState(prev => ({ ...prev, loading: false }));
    }
  }, [baseAgencies]);

  // Fetch members for selected agency
  const fetchAgencyMembers = useCallback(async (agencyId: string) => {
    setState(prev => ({ ...prev, membersLoading: true }));

    try {
      const { data: membersData, error: membersError } = await supabase
        .from('profiles')
        .select('id, name, email, role, status, avatar_seed, agency_id, created_at, updated_at')
        .eq('agency_id', agencyId);

      if (membersError) {
        handleSupabaseError(membersError, "Chargement des membres de l'agence");
        return;
      }

      const members = (membersData || []).map(profileToAgencyMember);
      setState(prev => ({
        ...prev,
        selectedAgencyMembers: members,
        membersLoading: false
      }));

    } catch (error) {
      console.error('Error fetching agency members:', error);
      setState(prev => ({ ...prev, membersLoading: false }));
    }
  }, []);

  // Fetch available users for attribution
  const fetchAvailableUsers = useCallback(async () => {
    setState(prev => ({ ...prev, usersLoading: true }));

    try {
      const { data: usersData, error: usersError } = await supabase
        .from('profiles')
        .select('id, name, email, role, status, avatar_seed, agency_id, created_at, updated_at')
        .in('role', ['agent', 'chef_agence']);

      if (usersError) {
        handleSupabaseError(usersError, "Chargement des utilisateurs disponibles");
        return;
      }

      const availableUsers = filterAvailableUsers(
        usersData || [],
        state.selectedAgencyMembers
      );

      setState(prev => ({
        ...prev,
        availableUsers,
        usersLoading: false
      }));

    } catch (error) {
      console.error('Error fetching available users:', error);
      setState(prev => ({ ...prev, usersLoading: false }));
    }
  }, [state.selectedAgencyMembers]);

  // Effect to fetch extended stats when base agencies change
  useEffect(() => {
    if (!baseLoading && baseAgencies.length > 0) {
      fetchExtendedAgencyStats();
    }
  }, [baseAgencies, baseLoading, fetchExtendedAgencyStats]);

  // Effect to fetch members when selected agency changes
  useEffect(() => {
    if (state.selectedAgencyId && state.viewMode === 'detail') {
      fetchAgencyMembers(state.selectedAgencyId);
    }
  }, [state.selectedAgencyId, state.viewMode, fetchAgencyMembers]);

  // Effect to fetch available users when in detail view
  useEffect(() => {
    if (state.viewMode === 'detail') {
      fetchAvailableUsers();
    }
  }, [state.viewMode, fetchAvailableUsers]);

  // Filtered agencies based on search and filter criteria
  const filteredAgencies = useMemo(() => {
    let filtered = state.extendedAgencies;

    // Apply search filter
    if (state.searchTerm) {
      const searchLower = state.searchTerm.toLowerCase();
      filtered = filtered.filter(agency =>
        agency.name.toLowerCase().includes(searchLower) ||
        (agency.chef_name && agency.chef_name.toLowerCase().includes(searchLower)) ||
        (agency.chef_email && agency.chef_email.toLowerCase().includes(searchLower))
      );
    }

    // Apply status filter
    switch (state.filterStatus) {
      case 'with_chef':
        filtered = filtered.filter(agency => agency.chef_name);
        break;
      case 'without_chef':
        filtered = filtered.filter(agency => !agency.chef_name);
        break;
      case 'active':
        filtered = filtered.filter(agency => agency.active_agents > 0);
        break;
      case 'inactive':
        filtered = filtered.filter(agency => agency.active_agents === 0);
        break;
      default:
        // 'all' - no additional filtering
        break;
    }

    return filtered;
  }, [state.extendedAgencies, state.searchTerm, state.filterStatus]);

  // Selected agency details
  const selectedAgency = useMemo(() => {
    return state.selectedAgencyId 
      ? state.extendedAgencies.find(agency => agency.id === state.selectedAgencyId)
      : null;
  }, [state.selectedAgencyId, state.extendedAgencies]);

  // Action handlers
  const setSelectedAgency = useCallback((agencyId: string | null) => {
    setState(prev => ({
      ...prev,
      selectedAgencyId: agencyId,
      viewMode: agencyId ? 'detail' : 'list'
    }));
  }, []);

  const setViewMode = useCallback((mode: ViewMode) => {
    setState(prev => ({
      ...prev,
      viewMode: mode,
      selectedAgencyId: mode === 'list' ? null : prev.selectedAgencyId
    }));
  }, []);

  const setSearchTerm = useCallback((term: string) => {
    setState(prev => ({ ...prev, searchTerm: term }));
  }, []);

  const setFilterStatus = useCallback((status: FilterStatus) => {
    setState(prev => ({ ...prev, filterStatus: status }));
  }, []);

  const refreshData = useCallback(async () => {
    await refetchAgencies();
    if (state.selectedAgencyId) {
      await fetchAgencyMembers(state.selectedAgencyId);
    }
    await fetchAvailableUsers();
  }, [refetchAgencies, state.selectedAgencyId, fetchAgencyMembers, fetchAvailableUsers]);

  const refreshAgencyMembers = useCallback(() => {
    if (state.selectedAgencyId) {
      fetchAgencyMembers(state.selectedAgencyId);
    }
  }, [state.selectedAgencyId, fetchAgencyMembers]);

  return {
    // State
    selectedAgencyId: state.selectedAgencyId,
    viewMode: state.viewMode,
    searchTerm: state.searchTerm,
    filterStatus: state.filterStatus,
    loading: state.loading || baseLoading,
    membersLoading: state.membersLoading,
    usersLoading: state.usersLoading,

    // Data
    agencies: filteredAgencies,
    allAgencies: state.extendedAgencies,
    selectedAgency,
    selectedAgencyMembers: state.selectedAgencyMembers,
    availableUsers: state.availableUsers,

    // Actions
    setSelectedAgency,
    setViewMode,
    setSearchTerm,
    setFilterStatus,
    refreshData,
    refreshAgencyMembers,

    // Statistics
    totalAgencies: state.extendedAgencies.length,
    agenciesWithoutChef: state.extendedAgencies.filter(a => !a.chef_name).length,
    totalMembers: state.extendedAgencies.reduce((sum, a) => sum + a.agent_count, 0),
    activeMembers: state.extendedAgencies.reduce((sum, a) => sum + a.active_agents, 0)
  };
};