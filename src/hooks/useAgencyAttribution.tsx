import { useState, useCallback } from 'react';
import { supabase } from '../supabaseClient';
import { handleSupabaseError } from '../utils/errorUtils';
import {
  AgencyMember,
  UserForAttribution,
  BulkAction,
  AttributionHistory,
  AttributionValidationResult,
  AttributionErrorCodes
} from '../types/agencyAttribution';
import {
  validateUserAttribution,
  validateUserRemoval,
  validateBulkAction,
  formatAttributionError,
  generateBulkActionSummary
} from '../utils/agencyAttributionUtils';

// Attribution operation result
interface AttributionResult {
  success: boolean;
  message: string;
  errorCode?: AttributionErrorCodes;
  affectedUsers?: string[];
}

// Bulk operation result
interface BulkAttributionResult {
  totalProcessed: number;
  successCount: number;
  failureCount: number;
  failures: Array<{
    userId: string;
    userName: string;
    error: string;
  }>;
  summary: string;
}

// Hook state interface
interface AgencyAttributionState {
  isProcessing: boolean;
  lastOperation: string | null;
  operationHistory: AttributionHistory[];
}

export const useAgencyAttribution = (currentUser?: any) => {
  const [state, setState] = useState<AgencyAttributionState>({
    isProcessing: false,
    lastOperation: null,
    operationHistory: []
  });

  // Log attribution action for audit trail
  const logAttributionAction = useCallback(async (
    action: AttributionHistory['action'],
    userId: string,
    agencyId: string,
    additionalData?: {
      previousAgencyId?: string;
      previousRole?: string;
      newRole?: string;
      reason?: string;
    }
  ) => {
    if (!currentUser?.id) return;

    try {
      const logEntry: Omit<AttributionHistory, 'id'> = {
        user_id: userId,
        agency_id: agencyId,
        action,
        previous_agency_id: additionalData?.previousAgencyId,
        previous_role: additionalData?.previousRole,
        new_role: additionalData?.newRole,
        performed_by: currentUser.id,
        performed_at: new Date().toISOString(),
        reason: additionalData?.reason
      };

      // In a real implementation, this would be stored in an audit table
      console.log('Attribution action logged:', logEntry);
      
      setState(prev => ({
        ...prev,
        operationHistory: [logEntry as AttributionHistory, ...prev.operationHistory.slice(0, 49)]
      }));
    } catch (error) {
      console.error('Failed to log attribution action:', error);
    }
  }, [currentUser?.id]);

  // Assign a single user to an agency
  const assignUserToAgency = useCallback(async (
    userId: string,
    agencyId: string,
    role?: string,
    reason?: string
  ): Promise<AttributionResult> => {
    setState(prev => ({ ...prev, isProcessing: true, lastOperation: 'assign_single' }));

    try {
      // Get user current data for validation
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, name, email, role, agency_id')
        .eq('id', userId)
        .single();

      if (userError) {
        handleSupabaseError(userError, "Récupération des données utilisateur");
        return {
          success: false,
          message: "Impossible de récupérer les données de l'utilisateur"
        };
      }

      // Get current agency members for validation
      const { data: membersData, error: membersError } = await supabase
        .from('profiles')
        .select('id, name, email, role, status, avatar_seed, agency_id, created_at, updated_at')
        .eq('agency_id', agencyId);

      if (membersError) {
        handleSupabaseError(membersError, "Récupération des membres de l'agence");
        return {
          success: false,
          message: "Impossible de récupérer les membres de l'agence"
        };
      }

      // Validate the attribution
      const validation = validateUserAttribution(
        userData,
        { id: agencyId, name: '', chef_id: null },
        (membersData || []).map(member => ({
          id: member.id,
          name: member.name || '',
          email: member.email || '',
          role: member.role || '',
          status: member.status || '',
          avatar_seed: member.avatar_seed,
          joinedAt: member.created_at || '',
          lastActivity: member.updated_at || '',
          agency_id: member.agency_id || undefined
        })),
        role
      );

      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message || formatAttributionError(validation.errorCode!),
          errorCode: validation.errorCode
        };
      }

      // Perform the attribution
      const updateData: any = {
        agency_id: agencyId,
        updated_at: new Date().toISOString()
      };

      if (role && role !== userData.role) {
        updateData.role = role;
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId);

      if (updateError) {
        handleSupabaseError(updateError, "Attribution de l'utilisateur à l'agence");
        return {
          success: false,
          message: "Échec de l'attribution de l'utilisateur"
        };
      }

      // Log the action
      await logAttributionAction('assigned', userId, agencyId, {
        previousAgencyId: userData.agency_id,
        previousRole: userData.role,
        newRole: role || userData.role,
        reason
      });

      return {
        success: true,
        message: `Utilisateur ${userData.name} assigné avec succès à l'agence`,
        affectedUsers: [userId]
      };

    } catch (error) {
      console.error('Error in assignUserToAgency:', error);
      return {
        success: false,
        message: "Erreur inattendue lors de l'attribution"
      };
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [logAttributionAction]);

  // Remove a user from an agency
  const removeUserFromAgency = useCallback(async (
    userId: string,
    reason?: string
  ): Promise<AttributionResult> => {
    setState(prev => ({ ...prev, isProcessing: true, lastOperation: 'remove_single' }));

    try {
      // Get user current data
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, name, email, role, agency_id')
        .eq('id', userId)
        .single();

      if (userError) {
        handleSupabaseError(userError, "Récupération des données utilisateur");
        return {
          success: false,
          message: "Impossible de récupérer les données de l'utilisateur"
        };
      }

      if (!userData.agency_id) {
        return {
          success: false,
          message: "L'utilisateur n'est assigné à aucune agence"
        };
      }

      // Get current agency members for validation
      const { data: membersData, error: membersError } = await supabase
        .from('profiles')
        .select('id, name, email, role, status, avatar_seed, agency_id, created_at, updated_at')
        .eq('agency_id', userData.agency_id);

      if (membersError) {
        handleSupabaseError(membersError, "Récupération des membres de l'agence");
        return {
          success: false,
          message: "Impossible de récupérer les membres de l'agence"
        };
      }

      // Validate the removal
      const userAsMember: AgencyMember = {
        id: userData.id,
        name: userData.name || '',
        email: userData.email || '',
        role: userData.role || '',
        status: 'active',
        avatar_seed: null,
        joinedAt: '',
        lastActivity: ''
      };

      const validation = validateUserRemoval(
        userAsMember,
        (membersData || []).map(member => ({
          id: member.id,
          name: member.name || '',
          email: member.email || '',
          role: member.role || '',
          status: member.status || '',
          avatar_seed: member.avatar_seed,
          joinedAt: member.created_at || '',
          lastActivity: member.updated_at || ''
        }))
      );

      if (!validation.isValid) {
        return {
          success: false,
          message: validation.message || formatAttributionError(validation.errorCode!),
          errorCode: validation.errorCode
        };
      }

      // Perform the removal
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          agency_id: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        handleSupabaseError(updateError, "Retrait de l'utilisateur de l'agence");
        return {
          success: false,
          message: "Échec du retrait de l'utilisateur"
        };
      }

      // Log the action
      await logAttributionAction('unassigned', userId, userData.agency_id, {
        previousAgencyId: userData.agency_id,
        previousRole: userData.role,
        reason
      });

      return {
        success: true,
        message: `Utilisateur ${userData.name} retiré avec succès de l'agence`,
        affectedUsers: [userId]
      };

    } catch (error) {
      console.error('Error in removeUserFromAgency:', error);
      return {
        success: false,
        message: "Erreur inattendue lors du retrait"
      };
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [logAttributionAction]);

  // Change user role within their current agency
  const changeUserRole = useCallback(async (
    userId: string,
    newRole: string,
    reason?: string
  ): Promise<AttributionResult> => {
    setState(prev => ({ ...prev, isProcessing: true, lastOperation: 'change_role' }));

    try {
      // Get user current data
      const { data: userData, error: userError } = await supabase
        .from('profiles')
        .select('id, name, email, role, agency_id')
        .eq('id', userId)
        .single();

      if (userError) {
        handleSupabaseError(userError, "Récupération des données utilisateur");
        return {
          success: false,
          message: "Impossible de récupérer les données de l'utilisateur"
        };
      }

      if (!userData.agency_id) {
        return {
          success: false,
          message: "L'utilisateur n'est assigné à aucune agence"
        };
      }

      if (userData.role === newRole) {
        return {
          success: false,
          message: "L'utilisateur a déjà ce rôle"
        };
      }

      // Get current agency members for validation
      const { data: membersData, error: membersError } = await supabase
        .from('profiles')
        .select('id, name, email, role, status, avatar_seed, agency_id, created_at, updated_at')
        .eq('agency_id', userData.agency_id);

      if (membersError) {
        handleSupabaseError(membersError, "Récupération des membres de l'agence");
        return {
          success: false,
          message: "Impossible de récupérer les membres de l'agence"
        };
      }

      // Validate role change (similar to attribution validation)
      if (newRole === 'chef_agence') {
        const existingChefs = (membersData || []).filter(member => 
          member.role === 'chef_agence' && member.id !== userId
        );
        if (existingChefs.length > 0) {
          return {
            success: false,
            message: "Cette agence a déjà un chef assigné",
            errorCode: AttributionErrorCodes.CHEF_ALREADY_EXISTS
          };
        }
      }

      // Perform the role change
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (updateError) {
        handleSupabaseError(updateError, "Changement de rôle de l'utilisateur");
        return {
          success: false,
          message: "Échec du changement de rôle"
        };
      }

      // Log the action
      await logAttributionAction('role_changed', userId, userData.agency_id, {
        previousRole: userData.role,
        newRole,
        reason
      });

      return {
        success: true,
        message: `Rôle de ${userData.name} changé avec succès vers ${newRole}`,
        affectedUsers: [userId]
      };

    } catch (error) {
      console.error('Error in changeUserRole:', error);
      return {
        success: false,
        message: "Erreur inattendue lors du changement de rôle"
      };
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [logAttributionAction]); 
 // Perform bulk attribution operations
  const performBulkAttribution = useCallback(async (
    action: BulkAction,
    selectedUsers: UserForAttribution[],
    targetAgencyId?: string
  ): Promise<BulkAttributionResult> => {
    setState(prev => ({ ...prev, isProcessing: true, lastOperation: 'bulk_operation' }));

    const result: BulkAttributionResult = {
      totalProcessed: selectedUsers.length,
      successCount: 0,
      failureCount: 0,
      failures: [],
      summary: ''
    };

    try {
      // Validate bulk action
      const validation = validateBulkAction(action, selectedUsers);
      if (!validation.isValid) {
        result.failureCount = selectedUsers.length;
        result.failures = selectedUsers.map(user => ({
          userId: user.id,
          userName: user.name || user.email || 'Utilisateur inconnu',
          error: validation.message || formatAttributionError(validation.errorCode!)
        }));
        result.summary = `Validation échouée: ${validation.message}`;
        return result;
      }

      // Process each user individually
      for (const user of selectedUsers) {
        try {
          let operationResult: AttributionResult;

          switch (action.type) {
            case 'assign':
              if (!targetAgencyId) {
                throw new Error('ID d\'agence cible requis pour l\'attribution');
              }
              operationResult = await assignUserToAgency(
                user.id,
                targetAgencyId,
                action.newRole,
                action.reason
              );
              break;

            case 'unassign':
              operationResult = await removeUserFromAgency(user.id, action.reason);
              break;

            case 'changeRole':
              if (!action.newRole) {
                throw new Error('Nouveau rôle requis pour le changement de rôle');
              }
              operationResult = await changeUserRole(user.id, action.newRole, action.reason);
              break;

            default:
              throw new Error(`Type d'action non supporté: ${action.type}`);
          }

          if (operationResult.success) {
            result.successCount++;
          } else {
            result.failureCount++;
            result.failures.push({
              userId: user.id,
              userName: user.name || user.email || 'Utilisateur inconnu',
              error: operationResult.message
            });
          }
        } catch (error) {
          result.failureCount++;
          result.failures.push({
            userId: user.id,
            userName: user.name || user.email || 'Utilisateur inconnu',
            error: error instanceof Error ? error.message : 'Erreur inconnue'
          });
        }
      }

      result.summary = generateBulkActionSummary(action, result.successCount, result.failureCount);
      return result;

    } catch (error) {
      console.error('Error in performBulkAttribution:', error);
      result.failureCount = selectedUsers.length;
      result.failures = selectedUsers.map(user => ({
        userId: user.id,
        userName: user.name || user.email || 'Utilisateur inconnu',
        error: 'Erreur système lors de l\'opération en lot'
      }));
      result.summary = 'Échec de l\'opération en lot';
      return result;
    } finally {
      setState(prev => ({ ...prev, isProcessing: false }));
    }
  }, [assignUserToAgency, removeUserFromAgency, changeUserRole]);

  // Assign multiple users to an agency
  const assignMultipleUsers = useCallback(async (
    userIds: string[],
    agencyId: string,
    role?: string,
    reason?: string
  ): Promise<BulkAttributionResult> => {
    // Convert user IDs to UserForAttribution objects
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, email, role, status, avatar_seed, agency_id')
      .in('id', userIds);

    if (usersError) {
      handleSupabaseError(usersError, "Récupération des utilisateurs pour attribution multiple");
      return {
        totalProcessed: userIds.length,
        successCount: 0,
        failureCount: userIds.length,
        failures: userIds.map(id => ({
          userId: id,
          userName: 'Utilisateur inconnu',
          error: 'Impossible de récupérer les données utilisateur'
        })),
        summary: 'Échec de la récupération des données utilisateur'
      };
    }

    const users: UserForAttribution[] = (usersData || []).map(user => ({
      ...user,
      attribution_status: user.agency_id ? 'assigned' : 'available',
      can_be_chef: user.role === 'chef_agence'
    }));

    const action: BulkAction = {
      type: 'assign',
      targetAgencyId: agencyId,
      newRole: role,
      reason
    };

    return performBulkAttribution(action, users, agencyId);
  }, [performBulkAttribution]);

  // Remove multiple users from their agencies
  const removeMultipleUsers = useCallback(async (
    userIds: string[],
    reason?: string
  ): Promise<BulkAttributionResult> => {
    // Convert user IDs to UserForAttribution objects
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, email, role, status, avatar_seed, agency_id')
      .in('id', userIds);

    if (usersError) {
      handleSupabaseError(usersError, "Récupération des utilisateurs pour retrait multiple");
      return {
        totalProcessed: userIds.length,
        successCount: 0,
        failureCount: userIds.length,
        failures: userIds.map(id => ({
          userId: id,
          userName: 'Utilisateur inconnu',
          error: 'Impossible de récupérer les données utilisateur'
        })),
        summary: 'Échec de la récupération des données utilisateur'
      };
    }

    const users: UserForAttribution[] = (usersData || []).map(user => ({
      ...user,
      attribution_status: user.agency_id ? 'assigned' : 'available',
      can_be_chef: user.role === 'chef_agence'
    }));

    const action: BulkAction = {
      type: 'unassign',
      reason
    };

    return performBulkAttribution(action, users);
  }, [performBulkAttribution]);

  // Change role for multiple users
  const changeMultipleUsersRole = useCallback(async (
    userIds: string[],
    newRole: string,
    reason?: string
  ): Promise<BulkAttributionResult> => {
    // Convert user IDs to UserForAttribution objects
    const { data: usersData, error: usersError } = await supabase
      .from('profiles')
      .select('id, name, email, role, status, avatar_seed, agency_id')
      .in('id', userIds);

    if (usersError) {
      handleSupabaseError(usersError, "Récupération des utilisateurs pour changement de rôle multiple");
      return {
        totalProcessed: userIds.length,
        successCount: 0,
        failureCount: userIds.length,
        failures: userIds.map(id => ({
          userId: id,
          userName: 'Utilisateur inconnu',
          error: 'Impossible de récupérer les données utilisateur'
        })),
        summary: 'Échec de la récupération des données utilisateur'
      };
    }

    const users: UserForAttribution[] = (usersData || []).map(user => ({
      ...user,
      attribution_status: user.agency_id ? 'assigned' : 'available',
      can_be_chef: user.role === 'chef_agence'
    }));

    const action: BulkAction = {
      type: 'changeRole',
      newRole,
      reason
    };

    return performBulkAttribution(action, users);
  }, [performBulkAttribution]);

  // Get attribution history for audit purposes
  const getAttributionHistory = useCallback(async (
    userId?: string,
    agencyId?: string,
    limit: number = 50
  ): Promise<AttributionHistory[]> => {
    try {
      // In a real implementation, this would query an audit table
      // For now, return the in-memory history
      let filteredHistory = state.operationHistory;

      if (userId) {
        filteredHistory = filteredHistory.filter(entry => entry.user_id === userId);
      }

      if (agencyId) {
        filteredHistory = filteredHistory.filter(entry => entry.agency_id === agencyId);
      }

      return filteredHistory.slice(0, limit);
    } catch (error) {
      console.error('Error fetching attribution history:', error);
      return [];
    }
  }, [state.operationHistory]);

  // Validate permissions for attribution operations
  const validateAttributionPermissions = useCallback((
    operation: 'assign' | 'unassign' | 'changeRole' | 'bulk',
    targetUserId?: string
  ): AttributionValidationResult => {
    if (!currentUser) {
      return {
        isValid: false,
        errorCode: AttributionErrorCodes.INSUFFICIENT_PERMISSIONS,
        message: 'Utilisateur non authentifié'
      };
    }

    // Seuls les admins généraux peuvent faire des attributions
    const hasAdminPermissions = currentUser.role === 'admin_general';
    
    if (!hasAdminPermissions) {
      return {
        isValid: false,
        errorCode: AttributionErrorCodes.INSUFFICIENT_PERMISSIONS,
        message: 'Seuls les administrateurs généraux peuvent effectuer cette opération'
      };
    }

    // Système de permissions simplifié - plus de validation spécifique

    return { isValid: true };
  }, [currentUser]);

  return {
    // State
    isProcessing: state.isProcessing,
    lastOperation: state.lastOperation,
    operationHistory: state.operationHistory,

    // Single user operations
    assignUserToAgency,
    removeUserFromAgency,
    changeUserRole,

    // Bulk operations
    performBulkAttribution,
    assignMultipleUsers,
    removeMultipleUsers,
    changeMultipleUsersRole,

    // Utility functions
    getAttributionHistory,
    validateAttributionPermissions,

    // Helper functions for UI
    formatError: formatAttributionError,
    generateSummary: generateBulkActionSummary
  };
};