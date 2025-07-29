import React, { useState, useEffect } from 'react';
import { PageComponentProps } from '../../types';
import { PageHeader } from '../../components/common/PageHeader';
import { Card } from '../../components/common/Card';
import { useAgencySuspensionWithPermissions } from '../../hooks/useAgencySuspensionWithPermissions';
import { AgencySuspensionModal } from '../admin/AgencySuspensionModal';
import { supabase } from '../../supabaseClient';

interface Agency {
  id: string;
  name: string;
  status: 'active' | 'suspended';
  chef_id: string | null;
  chef_name: string | null;
  agent_count: number;
}

export const SousAdminAgencyManagement: React.FC<PageComponentProps> = ({ user }) => {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAgency, setSelectedAgency] = useState<{
    id: string;
    name: string;
    status: 'active' | 'suspended';
  } | null>(null);
  const [isSuspensionModalOpen, setSuspensionModalOpen] = useState(false);

  const {
    suspendAgency,
    activateAgency,
    canPerformAction,
    loading: actionLoading
  } = useAgencySuspensionWithPermissions(user);

  // Charger les agences
  useEffect(() => {
    const fetchAgencies = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('agencies')
          .select(`
            id,
            name,
            status,
            chef_id,
            profiles!agencies_chef_id_fkey(name)
          `)
          .order('name');

        if (error) {
          console.error('Erreur chargement agences:', error);
        } else {
          const agenciesWithStats = (data || []).map(agency => ({
            id: agency.id,
            name: agency.name,
            status: agency.status || 'active',
            chef_id: agency.chef_id,
            chef_name: (agency.profiles as any)?.name || null,
            agent_count: 0 // À calculer si nécessaire
          }));
          setAgencies(agenciesWithStats);
        }
      } catch (err) {
        console.error('Erreur inattendue:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAgencies();
  }, []);

  const handleToggleAgencyStatus = (agency: Agency) => {
    setSelectedAgency({
      id: agency.id,
      name: agency.name,
      status: agency.status
    });
    setSuspensionModalOpen(true);
  };

  const handleSuspensionSuccess = () => {
    // Recharger les agences
    window.location.reload();
  };

  const AgencyCard: React.FC<{ agency: Agency }> = ({ agency }) => {
    const isSuspended = agency.status === 'suspended';
    
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 border-2 transition-all duration-300 ${
        isSuspended 
          ? 'border-red-200 bg-red-50' 
          : 'border-gray-200 hover:border-blue-200 hover:shadow-xl'
      }`}>
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className={`text-lg font-bold ${
              isSuspended ? 'text-red-700' : 'text-gray-800'
            }`}>
              {agency.name}
            </h3>
            <p className="text-sm text-gray-600">
              Chef: {agency.chef_name || 'Non assigné'}
            </p>
          </div>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
            isSuspended
              ? 'bg-red-100 text-red-800'
              : 'bg-green-100 text-green-800'
          }`}>
            <i className={`fas ${isSuspended ? 'fa-pause-circle' : 'fa-check-circle'} mr-1`}></i>
            {isSuspended ? 'Suspendue' : 'Active'}
          </span>
        </div>

        <div className="flex gap-2">
          {/* Bouton de suspension/activation avec vérification de permissions */}
          <button
            className={`flex-1 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
              isSuspended
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
            onClick={() => handleToggleAgencyStatus(agency)}
            disabled={actionLoading}
          >
            <i className={`fas ${isSuspended ? 'fa-play' : 'fa-pause'} mr-2`}></i>
            {isSuspended ? 'Réactiver' : 'Suspendre'}
          </button>

          {/* Bouton de visualisation (toujours disponible) */}
          <button
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
            onClick={() => alert(`Détails de l'agence ${agency.name}`)}
          >
            <i className="fas fa-eye"></i>
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        <span className="ml-3 text-gray-600">Chargement des agences...</span>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Gestion des Agences"
        subtitle="Gérez les agences selon vos permissions de sous-administrateur"
        icon="fa-building"
        gradient="from-purple-600 to-indigo-600"
      />

      {/* Section protégée par permissions */}
      <Card title="Liste des Agences" icon="fa-building">
          {/* Statistiques rapides */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{agencies.length}</div>
              <div className="text-sm text-blue-800">Total agences</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {agencies.filter(a => a.status === 'active').length}
              </div>
              <div className="text-sm text-green-800">Agences actives</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {agencies.filter(a => a.status === 'suspended').length}
              </div>
              <div className="text-sm text-red-800">Agences suspendues</div>
            </div>
          </div>

          {/* Liste des agences */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agencies.map((agency) => (
              <AgencyCard key={agency.id} agency={agency} />
            ))}
          </div>

          {agencies.length === 0 && (
            <div className="text-center py-12">
              <i className="fas fa-building text-4xl text-gray-300 mb-4"></i>
              <p className="text-gray-600">Aucune agence trouvée</p>
            </div>
          )}
        </Card>

      {/* Actions supplémentaires avec permissions */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card title="Création d'Agences" icon="fa-plus-circle">
            <p className="text-gray-600 mb-4">
              Vous avez les permissions pour créer de nouvelles agences.
            </p>
            <button className="btn btn-primary">
              <i className="fas fa-plus mr-2"></i>
              Créer une agence
            </button>
          </Card>

        <Card title="Rapports d'Agences" icon="fa-chart-bar">
            <p className="text-gray-600 mb-4">
              Consultez les statistiques et rapports des agences.
            </p>
            <button className="btn btn-secondary">
              <i className="fas fa-chart-bar mr-2"></i>
              Voir les rapports
            </button>
          </Card>
      </div>

      {/* Modal de suspension */}
      {selectedAgency && (
        <AgencySuspensionModal
          isOpen={isSuspensionModalOpen}
          onClose={() => {
            setSuspensionModalOpen(false);
            setSelectedAgency(null);
          }}
          agencyId={selectedAgency.id}
          agencyName={selectedAgency.name}
          currentStatus={selectedAgency.status}
          onSuccess={handleSuspensionSuccess}
        />
      )}
    </>
  );
};