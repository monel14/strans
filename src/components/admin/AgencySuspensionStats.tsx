import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { Card } from '../common/Card';

interface SuspensionStats {
  total_agencies: number;
  active_agencies: number;
  suspended_agencies: number;
  total_members: number;
  active_members: number;
  suspended_members: number;
  last_updated: string;
}

export const AgencySuspensionStats: React.FC = () => {
  const [stats, setStats] = useState<SuspensionStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.rpc('get_agency_suspension_stats');
      
      if (error) {
        setError(error.message);
        return;
      }
      
      setStats(data);
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement des statistiques');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card title="Statistiques de Suspension" icon="fa-chart-bar">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Chargement des statistiques...</span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Statistiques de Suspension" icon="fa-chart-bar">
        <div className="text-center py-8">
          <div className="text-red-500 mb-4">
            <i className="fas fa-exclamation-triangle text-2xl"></i>
          </div>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={fetchStats}
            className="mt-4 btn btn-sm btn-primary"
          >
            Réessayer
          </button>
        </div>
      </Card>
    );
  }

  if (!stats) return null;

  const suspensionRate = stats.total_agencies > 0 
    ? (stats.suspended_agencies / stats.total_agencies * 100).toFixed(1)
    : '0';

  const memberSuspensionRate = stats.total_members > 0
    ? (stats.suspended_members / stats.total_members * 100).toFixed(1)
    : '0';

  return (
    <Card title="Statistiques de Suspension" icon="fa-chart-bar">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Agences */}
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-blue-700 dark:text-blue-300">
              Agences Totales
            </h4>
            <i className="fas fa-building text-blue-500"></i>
          </div>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {stats.total_agencies}
          </p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-green-700 dark:text-green-300">
              Agences Actives
            </h4>
            <i className="fas fa-check-circle text-green-500"></i>
          </div>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {stats.active_agencies}
          </p>
          <p className="text-xs text-green-600 dark:text-green-400">
            {((stats.active_agencies / stats.total_agencies) * 100).toFixed(1)}% du total
          </p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-red-700 dark:text-red-300">
              Agences Suspendues
            </h4>
            <i className="fas fa-pause-circle text-red-500"></i>
          </div>
          <p className="text-2xl font-bold text-red-900 dark:text-red-100">
            {stats.suspended_agencies}
          </p>
          <p className="text-xs text-red-600 dark:text-red-400">
            {suspensionRate}% du total
          </p>
        </div>

        {/* Membres */}
        <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-purple-700 dark:text-purple-300">
              Membres Totaux
            </h4>
            <i className="fas fa-users text-purple-500"></i>
          </div>
          <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {stats.total_members}
          </p>
        </div>
      </div>

      {/* Détails des membres */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
            Répartition des Membres
          </h5>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <i className="fas fa-user-check text-green-500 mr-2"></i>
                Membres actifs
              </span>
              <span className="font-medium text-green-600">
                {stats.active_members}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <i className="fas fa-user-times text-red-500 mr-2"></i>
                Membres suspendus
              </span>
              <span className="font-medium text-red-600">
                {stats.suspended_members}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
          <h5 className="font-medium text-gray-700 dark:text-gray-300 mb-3">
            Taux de Suspension
          </h5>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Agences</span>
                <span>{suspensionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${suspensionRate}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Membres</span>
                <span>{memberSuspensionRate}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-red-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${memberSuspensionRate}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions rapides */}
      <div className="mt-6 flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-500">
          Dernière mise à jour: {new Date(stats.last_updated).toLocaleString('fr-FR')}
        </div>
        <button 
          onClick={fetchStats}
          className="btn btn-sm btn-outline-primary"
          disabled={loading}
        >
          <i className={`fas ${loading ? 'fa-spinner fa-spin' : 'fa-sync-alt'} mr-2`}></i>
          Actualiser
        </button>
      </div>
    </Card>
  );
};