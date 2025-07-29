import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAgencySuspension } from '../../hooks/useAgencySuspension';

interface Agency {
  id: string;
  name: string;
  status: 'active' | 'suspended';
  chef_id: string | null;
}

export const AgencySuspensionTest: React.FC = () => {
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [loading, setLoading] = useState(true);
  const { suspendAgency, activateAgency, loading: actionLoading } = useAgencySuspension();

  useEffect(() => {
    fetchAgencies();
  }, []);

  const fetchAgencies = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('agencies')
        .select('id, name, status, chef_id')
        .order('name');

      if (error) {
        console.error('Erreur:', error);
      } else {
        setAgencies(data || []);
      }
    } catch (err) {
      console.error('Erreur inattendue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (agency: Agency) => {
    const action = agency.status === 'active' ? suspendAgency : activateAgency;
    const result = await action(agency.id, `Test ${agency.status === 'active' ? 'suspension' : 'réactivation'}`);
    
    if (result.success) {
      alert(`✅ ${result.message}`);
      fetchAgencies(); // Recharger les données
    } else {
      alert(`❌ Erreur: ${result.message}`);
    }
  };

  if (loading) {
    return (
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="text-lg font-semibold mb-4">🧪 Test Suspension d'Agences</h3>
        <p>Chargement des agences...</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">🧪 Test Suspension d'Agences</h3>
      
      <div className="space-y-3">
        {agencies.map((agency) => (
          <div 
            key={agency.id} 
            className={`p-3 rounded-lg border flex justify-between items-center ${
              agency.status === 'suspended' 
                ? 'bg-red-50 border-red-200' 
                : 'bg-green-50 border-green-200'
            }`}
          >
            <div>
              <h4 className="font-medium">{agency.name}</h4>
              <p className={`text-sm ${
                agency.status === 'suspended' ? 'text-red-600' : 'text-green-600'
              }`}>
                <i className={`fas ${
                  agency.status === 'suspended' ? 'fa-pause-circle' : 'fa-check-circle'
                } mr-1`}></i>
                {agency.status === 'suspended' ? 'Suspendue' : 'Active'}
              </p>
            </div>
            
            <button
              onClick={() => handleToggleStatus(agency)}
              disabled={actionLoading}
              className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                agency.status === 'suspended'
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-red-600 hover:bg-red-700 text-white'
              } disabled:opacity-50`}
            >
              {actionLoading ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : (
                <>
                  <i className={`fas ${
                    agency.status === 'suspended' ? 'fa-play' : 'fa-pause'
                  } mr-1`}></i>
                  {agency.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      <div className="mt-4 pt-4 border-t">
        <button
          onClick={fetchAgencies}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          disabled={loading}
        >
          <i className="fas fa-sync-alt mr-2"></i>
          Actualiser
        </button>
      </div>
    </div>
  );
};