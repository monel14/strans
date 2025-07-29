import { 
  BaseAgency,
  AgencyWithAttributionStats, 
  AgencyMember, 
  AttributionValidationResult, 
  AttributionErrorCodes,
  AgencyStats,
  UserForAttribution,
  BulkAction
} from '../types/agencyAttribution';

/**
 * Validates if a user can be assigned to an agency
 */
export function validateUserAttribution(
  user: any,
  targetAgency: BaseAgency,
  currentMembers: AgencyMember[],
  newRole?: string
): AttributionValidationResult {
  // Check if user is already assigned to this agency
  if (user.agency_id === targetAgency.id) {
    return {
      isValid: false,
      errorCode: AttributionErrorCodes.USER_ALREADY_ASSIGNED,
      message: 'L\'utilisateur est déjà assigné à cette agence'
    };
  }

  // Check if trying to assign a chef when one already exists
  if (newRole === 'chef_agence') {
    const existingChef = currentMembers.find(member => member.role === 'chef_agence');
    if (existingChef) {
      return {
        isValid: false,
        errorCode: AttributionErrorCodes.CHEF_ALREADY_EXISTS,
        message: 'Cette agence a déjà un chef assigné'
      };
    }
  }

  // Check if user role is compatible with assignment
  if (user.role && !['agent', 'chef_agence'].includes(user.role)) {
    return {
      isValid: false,
      errorCode: AttributionErrorCodes.INVALID_ROLE_ASSIGNMENT,
      message: 'Ce type d\'utilisateur ne peut pas être assigné à une agence'
    };
  }

  return { isValid: true };
}

/**
 * Validates if a user can be removed from an agency
 */
export function validateUserRemoval(
  user: AgencyMember,
  currentMembers: AgencyMember[]
): AttributionValidationResult {
  // Check if trying to remove the last chef
  if (user.role === 'chef_agence') {
    const chefs = currentMembers.filter(member => member.role === 'chef_agence');
    if (chefs.length === 1) {
      return {
        isValid: false,
        errorCode: AttributionErrorCodes.CANNOT_REMOVE_LAST_CHEF,
        message: 'Impossible de retirer le dernier chef de l\'agence'
      };
    }
  }

  return { isValid: true };
}

/**
 * Calculates comprehensive statistics for an agency
 */
export function calculateAgencyStats(
  members: AgencyMember[],
  transactions?: any[]
): AgencyStats {
  const activeMembers = members.filter(member => member.status === 'active');
  const totalTransactions = transactions?.length || 0;
  const monthlyVolume = transactions?.reduce((sum, t) => sum + (t.montant_total || 0), 0) || 0;
  const averageTransactionValue = totalTransactions > 0 ? monthlyVolume / totalTransactions : 0;
  
  // Find the most recent activity
  const lastActivityDate = members.reduce((latest, member) => {
    const memberActivity = new Date(member.lastActivity);
    const currentLatest = new Date(latest);
    return memberActivity > currentLatest ? member.lastActivity : latest;
  }, '1970-01-01');

  const hasChef = members.some(member => member.role === 'chef_agence');

  return {
    totalMembers: members.length,
    activeMembers: activeMembers.length,
    totalTransactions,
    monthlyVolume,
    averageTransactionValue,
    lastActivityDate,
    hasChef,
    availableOperations: [] // This would be populated based on agency capabilities
  };
}

/**
 * Transforms a ProfileRow to AgencyMember format
 */
export function profileToAgencyMember(profile: any): AgencyMember {
  return {
    id: profile.id,
    name: profile.name || '',
    email: profile.email || '',
    role: profile.role || '',
    status: profile.status || 'inactive',
    avatar_seed: profile.avatar_seed,
    joinedAt: profile.created_at || new Date().toISOString(),
    lastActivity: profile.updated_at || new Date().toISOString(),
    agency_id: profile.agency_id || undefined
  };
}

/**
 * Transforms an Agency to AgencyWithAttributionStats format
 */
export function agencyToAgencyWithStats(
  agency: BaseAgency,
  stats: AgencyStats,
  chefInfo?: { name?: string; email?: string; avatar_seed?: string }
): AgencyWithAttributionStats {
  return {
    ...agency,
    chef_name: chefInfo?.name,
    chef_email: chefInfo?.email,
    chef_avatar_seed: chefInfo?.avatar_seed,
    agent_count: stats.totalMembers,
    active_agents: stats.activeMembers,
    total_transactions: stats.totalTransactions,
    monthly_volume: stats.monthlyVolume,
    last_activity: stats.lastActivityDate,
    available_operations: stats.availableOperations
  };
}

/**
 * Filters users available for attribution to a specific agency
 */
export function filterAvailableUsers(
  users: any[],
  currentMembers: AgencyMember[]
): UserForAttribution[] {
  return users
    .filter(user => ['agent', 'chef_agence'].includes(user.role || ''))
    .map(user => {
      const attribution_status = user.agency_id ? 'assigned' : 'available';
      const can_be_chef = user.role === 'chef_agence' && 
        !currentMembers.some(member => member.role === 'chef_agence');
      
      return {
        ...user,
        attribution_status,
        current_agency_name: user.agency_id ? 'Agence assignée' : undefined,
        can_be_chef
      } as UserForAttribution;
    });
}

/**
 * Validates a bulk action before execution
 */
export function validateBulkAction(
  action: BulkAction,
  selectedUsers: UserForAttribution[],
  targetAgency?: BaseAgency,
  currentMembers?: AgencyMember[]
): AttributionValidationResult {
  if (action.type === 'assign' && !targetAgency) {
    return {
      isValid: false,
      errorCode: AttributionErrorCodes.INVALID_ROLE_ASSIGNMENT,
      message: 'Agence de destination requise pour l\'attribution'
    };
  }

  if (action.type === 'assign' && action.newRole === 'chef_agence') {
    const chefsToAssign = selectedUsers.filter(() => action.newRole === 'chef_agence').length;
    const existingChefs = currentMembers?.filter(member => member.role === 'chef_agence').length || 0;
    
    if (chefsToAssign + existingChefs > 1) {
      return {
        isValid: false,
        errorCode: AttributionErrorCodes.CHEF_ALREADY_EXISTS,
        message: 'Impossible d\'assigner plusieurs chefs à une agence'
      };
    }
  }

  return { isValid: true };
}

/**
 * Formats error messages for user display
 */
export function formatAttributionError(errorCode: AttributionErrorCodes): string {
  const errorMessages = {
    [AttributionErrorCodes.USER_ALREADY_ASSIGNED]: 'L\'utilisateur est déjà assigné à cette agence',
    [AttributionErrorCodes.AGENCY_AT_CAPACITY]: 'L\'agence a atteint sa capacité maximale',
    [AttributionErrorCodes.INVALID_ROLE_ASSIGNMENT]: 'Attribution de rôle invalide',
    [AttributionErrorCodes.CHEF_ALREADY_EXISTS]: 'Cette agence a déjà un chef assigné',
    [AttributionErrorCodes.CANNOT_REMOVE_LAST_CHEF]: 'Impossible de retirer le dernier chef de l\'agence',
    [AttributionErrorCodes.INSUFFICIENT_PERMISSIONS]: 'Permissions insuffisantes pour cette action'
  };

  return errorMessages[errorCode] || 'Erreur d\'attribution inconnue';
}

/**
 * Generates a summary of bulk action results
 */
export function generateBulkActionSummary(
  action: BulkAction,
  successCount: number,
  failureCount: number
): string {
  const actionLabels = {
    assign: 'attribution',
    unassign: 'désattribution',
    changeRole: 'changement de rôle'
  };

  const actionLabel = actionLabels[action.type];
  let summary = `${actionLabel} terminée: ${successCount} succès`;
  
  if (failureCount > 0) {
    summary += `, ${failureCount} échecs`;
  }

  return summary;
}

/**
 * Sorts agencies by priority (agencies without chef first, then by name)
 */
export function sortAgenciesByPriority(agencies: AgencyWithAttributionStats[]): AgencyWithAttributionStats[] {
  return [...agencies].sort((a, b) => {
    // Agencies without chef come first
    if (!a.chef_name && b.chef_name) return -1;
    if (a.chef_name && !b.chef_name) return 1;
    
    // Then sort by name
    return a.name.localeCompare(b.name);
  });
}

/**
 * Debounce function for search inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}