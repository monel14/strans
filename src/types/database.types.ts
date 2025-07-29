export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      agent_recharge_requests: {
        Row: {
          id: string
          created_at: string
          agent_id: string
          chef_agence_id: string
          amount: number
          status: string
          motif: string | null
          rejection_reason: string | null
          processing_date: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          agent_id: string
          chef_agence_id: string
          amount: number
          status?: string
          motif?: string | null
          rejection_reason?: string | null
          processing_date?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          agent_id?: string
          chef_agence_id?: string
          amount?: number
          status?: string
          motif?: string | null
          rejection_reason?: string | null
          processing_date?: string | null
        }
      }
      agencies: {
        Row: {
          chef_id: string | null
          id: string
          name: string
        }
        Insert: {
          chef_id?: string | null
          id?: string
          name: string
        }
        Update: {
          chef_id?: string | null
          id?: string
          name?: string
        }
      }
      audit_logs: {
        Row: {
          action: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: number
          ip_address: string | null
          timestamp: string
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: number
          ip_address?: string | null
          timestamp?: string
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: number
          ip_address?: string | null
          timestamp?: string
          user_id?: string | null
          user_role?: string | null
        }
      }
      agency_operation_access: {
        Row: {
          agency_id: string
          created_at: string
          op_type_id: string
        }
        Insert: {
          agency_id: string
          created_at?: string
          op_type_id: string
        }
        Update: {
          agency_id?: string
          created_at?: string
          op_type_id?: string
        }
      }
      notifications: {
        Row: {
          created_at: string
          icon: string
          id: string
          link: string | null
          read: boolean
          text: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          icon: string
          id?: string
          link?: string | null
          read?: boolean
          text: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          icon?: string
          id?: string
          link?: string | null
          read?: boolean
          text?: string
          user_id?: string | null
        }
      }
      operation_types: {
        Row: {
          commission_config: Json | null
          description: string | null
          fields: Json | null
          id: string
          impacts_balance: boolean
          name: string
          proof_is_required: boolean
          status: string
        }
        Insert: {
          commission_config?: Json | null
          description?: string | null
          fields?: Json | null
          id: string
          impacts_balance?: boolean
          name: string
          proof_is_required?: boolean
          status?: string
        }
        Update: {
          commission_config?: Json | null
          description?: string | null
          fields?: Json | null
          id?: string
          impacts_balance?: boolean
          name?: string
          proof_is_required?: boolean
          status?: string
        }
      }
      profiles: {
        Row: {
          agency_id: string | null
          avatar_seed: string | null
          commissions_dues: number
          email: string
          id: string
          name: string
          permissions: Json | null
          role: string
          solde: number | null
          status: string
          suspension_reason: string | null
        }
        Insert: {
          agency_id?: string | null
          avatar_seed?: string | null
          commissions_dues?: number
          email: string
          id: string
          name: string
          permissions?: Json | null
          role?: string
          solde?: number | null
          status?: string
          suspension_reason?: string | null
        }
        Update: {
          agency_id?: string | null
          avatar_seed?: string | null
          commissions_dues?: number
          email?: string
          id?: string
          name?: string
          permissions?: Json | null
          role?: string
          solde?: number | null
          status?: string
          suspension_reason?: string | null
        }
      }
      requests: {
        Row: {
          assigned_to: string | null
          attachment_url: string | null
          created_at: string
          demandeur_id: string
          description: string | null
          id: string
          reponse: string | null
          resolution_date: string | null
          resolved_by_id: string | null
          status: string
          sujet: string
          type: string
        }
        Insert: {
          assigned_to?: string | null
          attachment_url?: string | null
          created_at?: string
          demandeur_id: string
          description?: string | null
          id?: string
          reponse?: string | null
          resolution_date?: string | null
          resolved_by_id?: string | null
          status?: string
          sujet: string
          type: string
        }
        Update: {
          assigned_to?: string | null
          attachment_url?: string | null
          created_at?: string
          demandeur_id?: string
          description?: string | null
          id?: string
          reponse?: string | null
          resolution_date?: string | null
          resolved_by_id?: string | null
          status?: string
          sujet?: string
          type?: string
        }
      }
      transactions: {
        Row: {
          agent_id: string
          assigned_to: string | null
          commission_generee: number
          created_at: string
          data: Json | null
          frais: number
          id: string
          montant_principal: number
          montant_total: number
          motif_rejet: string | null
          op_type_id: string
          proof_url: string | null
          status: string
          validateur_id: string | null
        }
        Insert: {
          agent_id: string
          assigned_to?: string | null
          commission_generee?: number
          created_at?: string
          data?: Json | null
          frais?: number
          id?: string
          montant_principal: number
          montant_total: number
          motif_rejet?: string | null
          op_type_id: string
          proof_url?: string | null
          status?: string
          validateur_id?: string | null
        }
        Update: {
          agent_id?: string
          assigned_to?: string | null
          commission_generee?: number
          created_at?: string
          data?: Json | null
          frais?: number
          id?: string
          montant_principal?: number
          montant_total?: number
          motif_rejet?: string | null
          op_type_id?: string
          proof_url?: string | null
          status?: string
          validateur_id?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_agent_recharge: {
        Args: {
          p_request_id: string
          p_approving_chef_id: string
        }
        Returns: undefined
      }
      create_secure_transaction: {
        Args: {
          p_agent_id: string
          p_op_type_id: string
          p_data: Json
          p_proof_url: string | null
        }
        Returns: string
      }
      direct_recharge_agent: {
        Args: {
          p_agent_id: string
          p_chef_id: string
          p_recharge_amount: number
        }
        Returns: undefined
      }
      get_agent_dashboard_stats: {
        Args: {
          p_agent_id: string
        }
        Returns: {
          transactions_this_month: number
          commissions_mois_estimees: number
        }
      }
      get_agency_list_with_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          chef_id: string | null
          chef_name: string | null
          chef_avatar_seed: string | null
          agent_count: number
        }[]
      }
      get_available_op_types_for_agency: {
        Args: {
          p_agency_id: string
        }
        Returns: {
          id: string
          name: string
          description: string | null
          status: string
          impacts_balance: boolean
          proof_is_required: boolean
          fields: Json | null
          commission_config: Json | null
        }[]
      }
      get_chef_dashboard_stats: {
        Args: {
          p_chef_id: string
        }
        Returns: {
          commissions_dues: number
          agents_actifs: number
          volume_agence_mois: number
          commissions_agence_mois: number
          pending_recharge_count: number
        }
      }
      get_global_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          pending_validations: number
          pending_requests: number
          total_volume: number
          total_users: number
          total_agencies: number
          success_rate: number | null
          workload: {
            id: string
            name: string
            avatar_seed: string | null
            taskCount: number
          }[]
        }
      }
      get_my_agency_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_sous_admin_dashboard_stats: {
        Args: {
          p_sous_admin_id: string
        }
        Returns: {
          my_assigned_transactions_count: number
          my_assigned_requests_count: number
          unassigned_transactions_count: number
          unassigned_requests_count: number
        }
      }
      get_sub_admin_list_with_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          name: string
          email: string
          avatar_seed: string | null
          status: string
          suspension_reason: string | null
          permissions: Json | null
          assigned_tasks: number
        }[]
      }
      transfer_commissions_to_balance: {
        Args: {
          p_user_id: string
          p_amount: number
        }
        Returns: undefined
      }
      update_agency_op_access: {
        Args: {
          p_agency_id: string
          p_op_type_ids: string[]
        }
        Returns: undefined
      }
      update_transaction_status: {
        Args: {
          p_transaction_id: string
          p_new_status: string
          p_validator_id: string
          p_rejection_reason?: string | null
        }
        Returns: undefined
      }
      update_user_status: {
        Args: {
          p_target_user_id: string
          p_new_status: string
          p_reason?: string | null
        }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}