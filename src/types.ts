import React from 'react';
// Import 'Database' and 'Json' from the generated types.
import { Database, Json } from './types/database.types';

export type { Json };


// --- Base Data Model Interfaces ---
// Types are derived directly from the generated Database type to ensure consistency and type safety.
export type ProfileRow = Database['public']['Tables']['profiles']['Row'];
export type Agency = Database['public']['Tables']['agencies']['Row'];
export type Transaction = Database['public']['Tables']['transactions']['Row'];
export type AgentRechargeRequest = Database['public']['Tables']['agent_recharge_requests']['Row'];
export type Request = Database['public']['Tables']['requests']['Row'];
export type Notification = Database['public']['Tables']['notifications']['Row'];


// These interfaces define the structure of JSON fields in the database.
export interface FormField {
  id: string;
  label: string;
  name: string;
  type: 'text' | 'number' | 'tel' | 'select' | 'date';
  required: boolean;
  obsolete: boolean;
  placeholder?: string;
  options?: string[];
  defaultValue?: string | number;
  min?: number;
  max?: number;
}

export interface CommissionTier {
  from: number;
  to: number | null; // Use null for infinity
  commission: string | number;
}

export interface CommissionConfig {
  type: 'none' | 'fixed' | 'percentage' | 'tiers';
  amount?: number;
  rate?: number;
  tiers?: CommissionTier[];
}

// Application-level type for OperationType. It extends the DB row but provides stricter types for JSON fields.
export interface OperationType extends Omit<Database['public']['Tables']['operation_types']['Row'], 'fields' | 'commission_config'> {
  fields: FormField[];
  commission_config: CommissionConfig;
}


// --- Role-Specific User Types ---
// Using intersection types to combine the base ProfileRow with role-specific properties.
export type Agent = ProfileRow & {
  role: 'agent';
  transactions_this_month?: number;
  commissions_mois_estimees?: number;
};

export type ChefAgence = ProfileRow & {
  role: 'chef_agence';
  volume_agence_mois?: number;
  commissions_agence_mois?: number;
  agents_actifs?: number;
};

export type AdminGeneral = ProfileRow & {
  role: 'admin_general';
};

export type SousAdmin = ProfileRow & {
  role: 'sous_admin';
};

export type Developpeur = ProfileRow & {
  role: 'developpeur';
};


// --- Discriminated Union for User ---
export type User = Agent | ChefAgence | AdminGeneral | SousAdmin | Developpeur;


// This type seems to be for display purposes and combines data.
// The original definition is kept as it doesn't directly map to a single DB table.
export interface AuditLog {
  timestamp: string;
  user: string;
  role: string;
  action: string;
  entity: string;
  details: string;
  ip: string;
}

export interface ErrorLog {
  timestamp: string;
  level: 'Erreur' | 'Avertissement' | 'Info';
  message: string;
  trace: string;
}

// --- Navigation and Component Props ---
export interface AgentActions {
  openNewOperationModal: () => void;
  openRechargeModal: () => void;
  AgentModals: React.FC;
}

export interface ChefActions {
  openNewOperationModal: () => void;
  openRechargeAgentModal: (agent: Agent) => void;
  openApproveRechargeModal: (data: { request: AgentRechargeRequest; agent: Agent }) => void;
  openRejectRechargeModal: (request: AgentRechargeRequest) => void;
  openSelfRechargeModal: () => void;
  openTransferCommissionsModal: () => void;
  ChefModals: React.FC;
}

export interface PageComponentProps {
  user: User;
  navigateTo: (pageKey: string, data?: any) => void;
  openModal: (type: string, data?: any) => void;
  refreshCurrentUser?: () => void;
  refreshKey?: number;
  agentActions?: AgentActions;
  chefActions?: ChefActions;
}

export interface NavLink {
  key: string;
  label: string;
  icon: string;
  component?: React.FC<PageComponentProps>;
  action?: string;
}