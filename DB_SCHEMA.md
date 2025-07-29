# Structure de la Base de Données Supabase

Ce document contient les définitions TypeScript complètes pour la base de données, générées par `supabase gen types typescript`. Il sert de référence pour la structure des tables, des vues, des fonctions et de leurs relations.

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
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
        Relationships: [
          {
            foreignKeyName: "agencies_chef_id_fkey"
            columns: ["chef_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "agency_operation_access_agency_id_fkey"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agency_operation_access_op_type_id_fkey"
            columns: ["op_type_id"]
            isOneToOne: false
            referencedRelation: "operation_types"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_recharge_requests: {
        Row: {
          agent_id: string
          amount: number
          chef_agence_id: string
          created_at: string
          id: string
          motif: string | null
          processing_date: string | null
          rejection_reason: string | null
          status: string
        }
        Insert: {
          agent_id: string
          amount: number
          chef_agence_id: string
          created_at?: string
          id?: string
          motif?: string | null
          processing_date?: string | null
          rejection_reason?: string | null
          status?: string
        }
        Update: {
          agent_id?: string
          amount?: number
          chef_agence_id?: string
          created_at?: string
          id?: string
          motif?: string | null
          processing_date?: string | null
          rejection_reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_recharge_requests_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "agent_recharge_requests_chef_agence_id_fkey"
            columns: ["chef_agence_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: number
          ip_address: unknown | null
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
          ip_address?: unknown | null
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
          ip_address?: unknown | null
          timestamp?: string
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action: string | null
          created_at: string
          entity_id: string | null
          icon: string
          id: string
          link: string | null
          read: boolean
          silent: boolean | null
          target: string | null
          text: string
          type: string | null
          user_id: string | null
        }
        Insert: {
          action?: string | null
          created_at?: string
          entity_id?: string | null
          icon: string
          id?: string
          link?: string | null
          read?: boolean
          silent?: boolean | null
          target?: string | null
          text: string
          type?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string | null
          created_at?: string
          entity_id?: string | null
          icon?: string
          id?: string
          link?: string | null
          read?: boolean
          silent?: boolean | null
          target?: string | null
          text?: string
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
      }
      profiles: {
        Row: {
          agency_id: string | null
          avatar_seed: string | null
          commissions_dues: number
          created_at: string | null
          email: string
          id: string
          name: string
          role: string
          solde: number | null
          status: string
          suspension_reason: string | null
          updated_at: string | null
        }
        Insert: {
          agency_id?: string | null
          avatar_seed?: string | null
          commissions_dues?: number
          created_at?: string | null
          email: string
          id?: string
          name: string
          role?: string
          solde?: number | null
          status?: string
          suspension_reason?: string | null
          updated_at?: string | null
        }
        Update: {
          agency_id?: string | null
          avatar_seed?: string | null
          commissions_dues?: number
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          role?: string
          solde?: number | null
          status?: string
          suspension_reason?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_agency"
            columns: ["agency_id"]
            isOneToOne: false
            referencedRelation: "agencies"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_demandeur_id_fkey"
            columns: ["demandeur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requests_resolved_by_id_fkey"
            columns: ["resolved_by_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: [
          {
            foreignKeyName: "transactions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_op_type_id_fkey"
            columns: ["op_type_id"]
            isOneToOne: false
            referencedRelation: "operation_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_validateur_id_fkey"
            columns: ["validateur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_agent_recharge: {
        Args: { p_request_id: string; p_approving_chef_id: string }
        Returns: undefined
      }
      cleanup_old_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      count_auth_users: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      create_chef_profile: {
        Args: { p_name: string; p_email: string; p_avatar_seed: string }
        Returns: Json
      }
      create_profile_without_auth: {
        Args: {
          p_email: string
          p_name: string
          p_role?: string
          p_agency_id?: string
        }
        Returns: Json
      }
      create_secure_transaction: {
        Args: {
          p_agent_id: string
          p_op_type_id: string
          p_data: Json
          p_proof_url: string
        }
        Returns: string
      }
      create_user_complete_flow: {
        Args: {
          p_email: string
          p_name: string
          p_role?: string
          p_agency_id?: string
        }
        Returns: Json
      }
      create_user_with_profile: {
        Args: {
          p_email: string
          p_name: string
          p_role?: string
          p_agency_id?: string
        }
        Returns: Json
      }
      direct_recharge_agent: {
        Args: {
          p_agent_id: string
          p_chef_id: string
          p_recharge_amount: number
        }
        Returns: undefined
      }
      formatamount: {
        Args: { amount: number }
        Returns: string
      }
      get_agent_dashboard_stats: {
        Args: { p_agent_id: string }
        Returns: Json
      }
      get_available_op_types_for_agency: {
        Args: { p_agency_id: string }
        Returns: {
          commission_config: Json | null
          description: string | null
          fields: Json | null
          id: string
          impacts_balance: boolean
          name: string
          proof_is_required: boolean
          status: string
        }[]
      }
      get_chef_dashboard_stats: {
        Args: { p_chef_id: string }
        Returns: Json
      }
      get_global_dashboard_stats: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_my_agency_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_my_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_orphan_profiles_simple: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          email: string
          name: string
          role: string
          created_at: string
        }[]
      }
      get_sous_admin_dashboard_stats: {
        Args: { p_sous_admin_id: string }
        Returns: Json
      }
      notify_admins_new_request: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      signup: {
        Args: { email: string; password: string; metadata: Json }
        Returns: Json
      }
      transfer_commissions_to_balance: {
        Args: { p_user_id: string; p_amount: number }
        Returns: undefined
      }
      update_agency_op_access: {
        Args: { p_agency_id: string; p_op_type_ids: string[] }
        Returns: undefined
      }
      update_transaction_status: {
        Args: {
          p_transaction_id: string
          p_new_status: string
          p_validator_id: string
          p_rejection_reason?: string
        }
        Returns: Json
      }
      update_user_status: {
        Args: {
          p_target_user_id: string
          p_new_status: string
          p_reason?: string
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

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
```