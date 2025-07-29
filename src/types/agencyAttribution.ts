// Types are defined locally to avoid database dependency issues

// Base agency interface for attribution system
export interface BaseAgency {
  id: string;
  name: string;
  chef_id?: string | null;
}

// Extended agency interface with statistics for attribution
export interface AgencyWithAttributionStats extends BaseAgency {
  chef_name?: string;
  chef_email?: string;
  chef_avatar_seed?: string;
  agent_count: number;
  active_agents: number;
  total_transactions: number;
  monthly_volume: number;
  last_activity: string;
  available_operations: string[];
}

// Agency member interface with extended information
export interface AgencyMember {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  avatar_seed: string | null;
  joinedAt: string;
  lastActivity: string;
  agency_id?: string;
}

// Attribution history for audit trail
export interface AttributionHistory {
  id: string;
  user_id: string;
  agency_id: string;
  action: 'assigned' | 'unassigned' | 'role_changed';
  previous_agency_id?: string;
  previous_role?: string;
  new_role?: string;
  performed_by: string;
  performed_at: string;
  reason?: string;
}

// Bulk action types
export type BulkAction = {
  type: 'assign' | 'unassign' | 'changeRole';
  targetAgencyId?: string;
  newRole?: string;
  reason?: string;
};

// Attribution error codes
export enum AttributionErrorCodes {
  USER_ALREADY_ASSIGNED = 'USER_ALREADY_ASSIGNED',
  AGENCY_AT_CAPACITY = 'AGENCY_AT_CAPACITY',
  INVALID_ROLE_ASSIGNMENT = 'INVALID_ROLE_ASSIGNMENT',
  CHEF_ALREADY_EXISTS = 'CHEF_ALREADY_EXISTS',
  CANNOT_REMOVE_LAST_CHEF = 'CANNOT_REMOVE_LAST_CHEF',
  INSUFFICIENT_PERMISSIONS = 'INSUFFICIENT_PERMISSIONS'
}

// Attribution validation result
export interface AttributionValidationResult {
  isValid: boolean;
  errorCode?: AttributionErrorCodes;
  message?: string;
}

// Agency statistics calculation result
export interface AgencyStats {
  totalMembers: number;
  activeMembers: number;
  totalTransactions: number;
  monthlyVolume: number;
  averageTransactionValue: number;
  lastActivityDate: string;
  hasChef: boolean;
  availableOperations: string[];
}

// User attribution status
export type UserAttributionStatus = 'available' | 'assigned' | 'pending';

// Extended user interface for attribution context
export interface UserForAttribution {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
  agency_id?: string | null;
  created_at?: string;
  updated_at?: string;
  avatar_seed?: string | null;
  attribution_status: UserAttributionStatus;
  current_agency_name?: string;
  can_be_chef?: boolean;
}