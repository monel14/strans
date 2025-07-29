

import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { Agency, ChefAgence, User } from '../../types';
import { supabase } from '../../supabaseClient';
import { handleSupabaseError } from '../../utils/errorUtils';

interface EditAgencyModalProps {
    isOpen: boolean;
    onClose: () => void;
    agencyId: string | null;
    onSave: (agency: Agency) => void;
}

const EditAgencyModal: React.FC<EditAgencyModalProps> = ({ isOpen, onClose, agencyId, onSave }) => {
    const [name, setName] = useState('');
    const [chef_id, setChefId] = useState<string | null>('');
    const [availableChefs, setAvailableChefs] = useState<ChefAgence[]>([]);
    const [allUsers, setAllUsers] = useState<Record<string, User>>({});

    useEffect(() => {
        const fetchPrerequisites = async () => {
            if (isOpen) {
                // Fetch all users to display the currently assigned chef even if they manage another agency
                const { data: usersData, error: usersError } = await supabase.from('profiles').select('id, name, email, role, agency_id, avatar_seed, solde, status');
                 if(usersError) { handleSupabaseError(usersError, "Chargement de tous les utilisateurs"); return; }
                 const usersMap = ((usersData || []) as any[]).reduce((acc, u) => { acc[u.id] = u as User; return acc; }, {} as Record<string, User>);
                 setAllUsers(usersMap);

                // Fetch available chefs (those with no agency_id or assigned to the current agency)
                const { data: chefsData, error: chefsError } = await supabase.from('profiles').select('id, name, email, role, agency_id, avatar_seed, solde, status').eq('role', 'chef_agence');
                if (chefsError) { handleSupabaseError(chefsError, "Chargement des chefs d'agence disponibles"); return; }
                const chefs = (chefsData as unknown as ChefAgence[]) || [];
                const unassignedOrCurrent = chefs.filter(c => !c.agency_id || c.agency_id === agencyId);
                setAvailableChefs(unassignedOrCurrent);

                if (agencyId) {
                    const { data: agency, error } = await supabase.from('agencies').select('id, name, chef_id').eq('id', agencyId).single();
                    if (error) { handleSupabaseError(error, "Chargement des détails de l'agence"); }
                    else if (agency) {
                        setName((agency as any).name);
                        setChefId((agency as any).chef_id);
                    }
                } else {
                    // Reset for creation
                    setName('');
                    setChefId('');
                }
            }
        };
        fetchPrerequisites();
    }, [isOpen, agencyId]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const finalAgencyData: Agency = {
            id: agencyId || '', // Laisser vide pour les nouvelles agences, Supabase générera l'UUID
            name,
            chef_id: chef_id,
        };
        onSave(finalAgencyData);
        onClose();
    };

    return (
        <Modal 
            id="edit-agency-modal" 
            title={agencyId ? "Modifier l'Agence" : "Créer une Nouvelle Agence"} 
            isOpen={isOpen} 
            onClose={onClose}
            icon={<i className="fas fa-building text-xl"></i>}
            footer={
                <>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
                    <button type="submit" form="edit-agency-form" className="btn btn-primary ml-auto">
                        <i className="fas fa-save mr-2"></i>
                        {agencyId ? 'Enregistrer les modifications' : 'Créer l\'agence'}
                    </button>
                </>
            }
        >
            <form id="edit-agency-form" onSubmit={handleSubmit}>
                <div className="mb-4">
                    <label htmlFor="agencyName" className="form-label">Nom de l'agence</label>
                    <input
                        type="text"
                        id="agencyName"
                        className="form-input"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        required
                    />
                </div>
                <div className="mb-6">
                    <label htmlFor="chef_id" className="form-label">Chef d'agence</label>
                    <select
                        id="chef_id"
                        className="form-select"
                        value={chef_id || ''}
                        onChange={e => setChefId(e.target.value)}
                    >
                        <option value="">-- Aucun --</option>
                        {availableChefs.map(chef => (
                            <option key={chef.id} value={chef.id}>{chef.name}</option>
                        ))}
                         {/* Ensure the currently assigned chef is in the list even if they are not "available" */}
                         {chef_id && !availableChefs.some(c => c.id === chef_id) && allUsers[chef_id] && (
                            <option key={chef_id} value={chef_id}>{allUsers[chef_id].name}</option>
                         )}
                    </select>
                    <p className="text-xs text-gray-500 mt-1">La liste contient les chefs d'agences disponibles ou celui déjà assigné.</p>
                </div>
            </form>
        </Modal>
    );
};

export default EditAgencyModal;
