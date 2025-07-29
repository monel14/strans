import React, { useState, useEffect, useMemo } from 'react';
import { PageComponentProps } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { useSousAdminPermissions } from '../../hooks/useSousAdminPermissions';
import { PermissionGuard } from '../../components/common/PermissionGuard';

// Configuration centralisée des fonctionnalités
interface FeatureConfig {
  key: string;
  label: string;
  icon: string;
  permission?: string;
  component: React.ComponentType<any>;
  description: string;
  priority: number; // Pour l'ordre d'affichage
}

// Import des composants (réutilisation + spécialisation)
import { SousAdminTransactionManagement } from './SousAdminTransactionManagement';
import { AgencyManagementView } from '../admin/AgencyManagementView';
import { SousAdminUserManagement } from './SousAdminUserManagement';
import { AdminAuditLog } from '../admin/AdminAuditLog';

export const SousAdminDashboardOptimal: React.FC<PageComponentProps> = (props) => {
  const { user } = props;
  const [activeFeature, setActiveFeature] = useState<string>('');
  const { checkMultiplePermissions } = useSousAdminPermissions(user?.id);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // 🎯 Configuration centralisée des fonctionnalités
  const featuresConfig: FeatureConfig[] = [
    {
      key: 'transactions',
      label: 'Transactions',
      icon: 'fa-exchange-alt',
      permission: 'transaction_validate',
      component: SousAdminTransactionManagement,
      description: 'Validation et gestion des transactions',
      priority: 1
    },
    {
      key: 'agencies',
      label: 'Agences',
      icon: 'fa-building',
      permission: 'agency_suspend',
      component: AgencyManagementView,
      description: 'Gestion des agences et services',
      priority: 2
    },
    {
      key: 'users',
      label: 'Utilisateurs',
      icon: 'fa-users',
      permission: 'user_suspend',
      component: SousAdminUserManagement,
      description: 'Gestion des utilisateurs',
      priority: 3
    },
    {
      key: 'reports',
      label: 'Rapports',
      icon: 'fa-chart-bar',
      permission: 'report_access',
      component: AdminAuditLog,
      description: 'Rapports et analyses',
      priority: 4
    }
  ];

  // 🔐 Chargement des permissions
  useEffect(() => {
    const loadPermissions = async () => {
      if (!user?.id) return;
      
      setLoading(true);
      try {
        const permissionTypes = featuresConfig
          .filter(f => f.permission)
          .map(f => f.permission!);
        
        const permissions = await checkMultiplePermissions(permissionTypes as any[]);
        setUserPermissions(permissions);
        
        // Définir la fonctionnalité par défaut
        const firstAvailable = featuresConfig[0];
        if (firstAvailable && !activeFeature) {
          setActiveFeature(firstAvailable.key);
        }
      } catch (error) {
        console.error('Erreur chargement permissions:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPermissions();
  }, [user?.id, checkMultiplePermissions]);

  // 📋 Fonctionnalités disponibles selon les permissions
  const availableFeatures = useMemo(() => {
    return featuresConfig
      .filter(feature => !feature.permission || userPermissions[feature.permission])
      .sort((a, b) => a.priority - b.priority);
  }, [userPermissions]);

  // 🎯 Fonctionnalité active
  const currentFeature = availableFeatures.find(f => f.key === activeFeature);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
        <span className="ml-3">Chargement du dashboard...</span>
      </div>
    );
  }

  // 🚫 Aucune permission
  if (availableFeatures.length === 0) {
    return (
      <div className="text-center py-12">
        <PageHeader
          title="Accès Restreint"
          subtitle="Aucune fonctionnalité accessible"
          icon="fa-lock"
          gradient="from-red-500 to-red-600"
        />
        <div className="mt-8">
          <i className="fas fa-shield-alt text-6xl text-gray-400 mb-4"></i>
          <h2 className="text-2xl font-bold text-gray-700 mb-4">
            Permissions Insuffisantes
          </h2>
          <p className="text-gray-600 mb-6">
            Vous n'avez accès à aucune fonctionnalité du dashboard sous-admin.
          </p>
          <p className="text-sm text-gray-500">
            Contactez un administrateur pour obtenir les permissions nécessaires.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard Sous-Admin"
        subtitle={`${availableFeatures.length} fonctionnalité(s) disponible(s)`}
        icon="fa-user-shield"
        gradient="from-purple-500 to-indigo-600"
      />

      {/* 🎛️ Navigation des fonctionnalités */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-1">
        <div className="flex flex-wrap gap-1">
          {availableFeatures.map(feature => (
            <button
              key={feature.key}
              onClick={() => setActiveFeature(feature.key)}
              className={`
                flex items-center px-4 py-2 rounded-md text-sm font-medium transition-all duration-200
                ${activeFeature === feature.key
                  ? 'bg-purple-100 text-purple-700 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }
              `}
              title={feature.description}
            >
              <i className={`fas ${feature.icon} mr-2`}></i>
              {feature.label}
            </button>
          ))}
        </div>
      </div>

      {/* 📊 Contenu de la fonctionnalité active */}
      {currentFeature && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[600px]">
          <currentFeature.component {...props} />
        </div>
      )}

      {/* 📈 Statistiques rapides */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-4 text-white">
          <div className="flex items-center">
            <i className="fas fa-shield-check text-2xl mr-3"></i>
            <div>
              <p className="text-sm opacity-90">Permissions Actives</p>
              <p className="text-2xl font-bold">{Object.values(userPermissions).filter(Boolean).length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-4 text-white">
          <div className="flex items-center">
            <i className="fas fa-cogs text-2xl mr-3"></i>
            <div>
              <p className="text-sm opacity-90">Fonctionnalités</p>
              <p className="text-2xl font-bold">{availableFeatures.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-4 text-white">
          <div className="flex items-center">
            <i className="fas fa-user-shield text-2xl mr-3"></i>
            <div>
              <p className="text-sm opacity-90">Niveau d'Accès</p>
              <p className="text-lg font-bold">
                {availableFeatures.length >= 4 ? 'Complet' : 
                 availableFeatures.length >= 2 ? 'Partiel' : 'Limité'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};