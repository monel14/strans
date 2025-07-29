import React, { useState, useEffect } from 'react';
import { PageComponentProps, SousAdmin } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { supabase } from '../../supabaseClient';
import { handleSupabaseError } from '../../utils/errorUtils';

const StatCard: React.FC<{ 
  title: string; 
  value: string | number; 
  icon: string; 
  actionText: string; 
  onClick: () => void; 
  color: string;
  disabled?: boolean;
  permissionRequired?: string;
}> = ({ title, value, icon, actionText, onClick, color, disabled = false, permissionRequired }) => (
  <div className={`rounded-xl shadow-lg p-6 flex flex-col justify-between transition-all duration-300 ${
    disabled 
      ? 'opacity-50 cursor-not-allowed bg-gray-300' 
      : `hover:shadow-xl hover:scale-105 ${color}`
  }`}>
    <div>
      <div className="flex items-center text-white mb-2">
        <i className={`fas ${icon} fa-lg mr-3`}></i>
        <h3 className="font-semibold">{title}</h3>
        {permissionRequired && (
          <i className="fas fa-lock text-xs ml-2 opacity-60" title={`Permission requise: ${permissionRequired}`}></i>
        )}
      </div>
      <p className="text-4xl font-bold text-white">{disabled ? '—' : value}</p>
      <p className="text-sm text-white opacity-80">
        {disabled ? 'Accès restreint' : 'en attente'}
      </p>
    </div>
    <button 
      className={`mt-4 font-semibold py-2 px-4 rounded-lg transition-colors w-full ${
        disabled 
          ? 'bg-gray-400 text-gray-600 cursor-not-allowed' 
          : 'bg-white/20 text-white hover:bg-white/30'
      }`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
    >
      {disabled ? 'Accès refusé' : actionText} 
      {!disabled && <i className="fas fa-arrow-right ml-2 text-xs"></i>}
    </button>
  </div>
);

const PermissionCard: React.FC<{
  title: string;
  description: string;
  icon: string;
  hasPermission: boolean;
  onClick?: () => void;
  actionText?: string;
}> = ({ title, description, icon, hasPermission, onClick, actionText }) => (
  <div className={`p-4 rounded-lg border-2 transition-all duration-300 ${
    hasPermission 
      ? 'border-green-200 bg-green-50 hover:bg-green-100' 
      : 'border-gray-200 bg-gray-50'
  }`}>
    <div className="flex items-start">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
        hasPermission ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'
      }`}>
        <i className={`fas ${icon}`}></i>
      </div>
      <div className="flex-1">
        <h4 className={`font-semibold ${hasPermission ? 'text-green-800' : 'text-gray-600'}`}>
          {title}
        </h4>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
        {hasPermission && onClick && actionText && (
          <button
            onClick={onClick}
            className="mt-2 text-sm text-green-600 hover:text-green-800 font-medium"
          >
            {actionText} →
          </button>
        )}
      </div>
      <div className={`ml-2 ${hasPermission ? 'text-green-500' : 'text-gray-300'}`}>
        <i className={`fas ${hasPermission ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
      </div>
    </div>
  </div>
);

interface SousAdminDashboardStats {
  my_assigned_transactions_count: number;
  my_assigned_requests_count: number;
  unassigned_transactions_count: number;
  unassigned_requests_count: number;
}

export const SousAdminDashboardWithPermissions: React.FC<PageComponentProps> = ({ 
  user, 
  navigateTo, 
  refreshKey 
}) => {
  const [stats, setStats] = useState({
    myAssignedTransactions: 0,
    myAssignedRequests: 0,
    unassignedTransactions: 0,
    unassignedRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  // Charger les statistiques
  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .rpc('get_sous_admin_dashboard_stats', { p_sous_admin_id: user.id });

        if (error) {
          console.error("Error fetching sous-admin stats:", error);
          handleSupabaseError(error, "Chargement des statistiques du sous-administrateur");
        } else {
          const statsData = data as unknown as SousAdminDashboardStats;
          setStats({
            myAssignedTransactions: statsData.my_assigned_transactions_count || 0,
            myAssignedRequests: statsData.my_assigned_requests_count || 0,
            unassignedTransactions: statsData.unassigned_transactions_count || 0,
            unassignedRequests: statsData.unassigned_requests_count || 0,
          });
        }
      } catch (err) {
        console.error('Erreur inattendue:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user?.id) {
      fetchStats();
    }
  }, [user?.id, refreshKey]);

  const totalMyTasks = stats.myAssignedTransactions + stats.myAssignedRequests;
  const totalUnassignedTasks = stats.unassignedTransactions + stats.unassignedRequests;

  // Définir les fonctionnalités disponibles avec leurs permissions
  const dashboardFeatures = [
    {
      key: 'transactions',
      title: 'Validation des Transactions',
      description: 'Approuver ou rejeter les opérations financières soumises par les agents',
      icon: 'fa-check-double',
      permission: 'transaction_validate',
      color: 'bg-gradient-to-br from-blue-500 to-cyan-500',
      value: stats.unassignedTransactions,
      actionText: 'Traiter la file',
      onClick: () => navigateTo('Validation Transactions')
    },
    {
      key: 'agencies',
      title: 'Gestion des Agences',
      description: 'Suspendre, réactiver et gérer les agences du système',
      icon: 'fa-building',
      permission: 'agency_suspend',
      color: 'bg-gradient-to-br from-purple-500 to-pink-500',
      value: '—',
      actionText: 'Gérer les agences',
      onClick: () => navigateTo('Gestion des Agences')
    },
    {
      key: 'reports',
      title: 'Rapports et Statistiques',
      description: 'Consulter les rapports de performance et les statistiques du système',
      icon: 'fa-chart-bar',
      permission: 'report_access',
      color: 'bg-gradient-to-br from-green-500 to-teal-500',
      value: '—',
      actionText: 'Voir les rapports',
      onClick: () => navigateTo('Rapports')
    },
    {
      key: 'users',
      title: 'Gestion des Utilisateurs',
      description: 'Suspendre et réactiver les comptes utilisateurs',
      icon: 'fa-users',
      permission: 'user_suspend',
      color: 'bg-gradient-to-br from-orange-500 to-red-500',
      value: '—',
      actionText: 'Gérer les utilisateurs',
      onClick: () => navigateTo('Gestion des Utilisateurs')
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <span className="ml-3 text-gray-600">Chargement du dashboard...</span>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={`Bienvenue, ${user.name}`}
        subtitle="Voici un aperçu de vos tâches et des fonctionnalités disponibles selon vos permissions."
        icon="fa-user-check"
        gradient="from-indigo-600 to-purple-600"
      />

      {/* Résumé des tâches assignées */}
      <div className="mb-8">
        <div className="bg-white dark:bg-gray-900 p-6 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center">
            <i className="fas fa-tasks mr-3 text-purple-600"></i>
            Mes Tâches Assignées
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 mb-2">
                {totalMyTasks}
              </div>
              <p className="text-gray-500 dark:text-gray-400">Total des tâches</p>
            </div>
            {/* Supprimer l'affichage des statistiques basées sur les permissions */}
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">
                {stats.myAssignedTransactions}
              </div>
              <p className="text-gray-500 dark:text-gray-400">Transactions</p>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">
                {stats.myAssignedRequests}
              </div>
              <p className="text-gray-500 dark:text-gray-400">Requêtes</p>
            </div>
          </div>
        </div>
      </div>

      {/* Fonctionnalités disponibles */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
          <i className="fas fa-cogs mr-3 text-indigo-600"></i>
          Fonctionnalités Disponibles
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardFeatures.map((feature) => {
            // Supprimer l'affichage basé sur les permissions
            return (
              <StatCard
                key={feature.key}
                title={feature.title}
                value={feature.value}
                icon={feature.icon}
                actionText={feature.actionText}
                onClick={feature.onClick}
                color={feature.color}
                // Supprimer la propriété disabled
                // permissionRequired={feature.permission}
              />
            );
          })}
        </div>
      </div>

      {/* Détail des permissions */}
      <div className="mb-8">
        <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center">
          <i className="fas fa-shield-alt mr-3 text-green-600"></i>
          Vos Permissions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Supprimer les cartes de permission basées sur les permissions */}
          <PermissionCard
            title="Validation des Transactions"
            description="Approuver ou rejeter les opérations financières"
            icon="fa-check-double"
            hasPermission={true}
            onClick={() => navigateTo('Validation Transactions')}
            actionText="Accéder"
          />
          <PermissionCard
            title="Suspension d'Agences"
            description="Suspendre temporairement des agences"
            icon="fa-pause-circle"
            hasPermission={true}
            onClick={() => navigateTo('Gestion des Agences')}
            actionText="Gérer"
          />
          <PermissionCard
            title="Réactivation d'Agences"
            description="Réactiver des agences suspendues"
            icon="fa-play-circle"
            hasPermission={true}
          />
          <PermissionCard
            title="Accès aux Rapports"
            description="Consulter les statistiques et rapports"
            icon="fa-chart-bar"
            hasPermission={true}
            onClick={() => navigateTo('Rapports')}
            actionText="Consulter"
          />
          <PermissionCard
            title="Création d'Agences"
            description="Créer de nouvelles agences"
            icon="fa-plus-circle"
            hasPermission={true}
          />
          <PermissionCard
            title="Gestion des Utilisateurs"
            description="Suspendre et réactiver des utilisateurs"
            icon="fa-users"
            hasPermission={true}
          />
        </div>
      </div>

      {/* Informations sur le rôle */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-semibold text-blue-900 mb-2 flex items-center">
          <i className="fas fa-info-circle mr-2"></i>
          Informations sur votre rôle
        </h4>
        <div className="text-sm text-blue-800 space-y-2">
          <p>
            <strong>Rôle :</strong> {user?.role || 'Non défini'}
          </p>
          <p>
            <strong>Permissions accordées :</strong> {user?.permissions?.length || 0}
          </p>
          <p>
            <strong>Accès complet :</strong> {user?.has_all_permissions ? 'Oui' : 'Non'}
          </p>
          {!user?.has_all_permissions && (
            <p className="text-xs">
              Vos permissions sont limitées. Contactez un administrateur général pour obtenir des accès supplémentaires.
            </p>
          )}
        </div>
      </div>
    </>
  );
};