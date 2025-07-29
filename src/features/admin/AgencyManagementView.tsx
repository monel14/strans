import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { PageComponentProps, OperationType, Agency, FormField, CommissionConfig } from '../../types';
import { Card } from '../../components/common/Card';
import { useAgencies } from '../../hooks/useAgencies';
import EditAgencyModal from './EditAgencyModal';
import { CreateChefModal } from './CreateChefModal';
import { AgencySuspensionModal } from './AgencySuspensionModal';
import { supabase } from '../../supabaseClient';
import { handleSupabaseError } from '../../utils/errorUtils';
import { ToggleSwitch } from '../../components/common/ToggleSwitch';

export const AgencyManagementView: React.FC<PageComponentProps> = ({ refreshKey }) => {
    const { agencies, loading: agenciesLoading, saveAgency, createChef } = useAgencies();
    
    // State for services/operations
    const [opTypes, setOpTypes] = useState<OperationType[]>([]);
    const [loadingOpTypes, setLoadingOpTypes] = useState(true);
    const [initialAccess, setInitialAccess] = useState<string[]>([]);
    const [currentAccess, setCurrentAccess] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // State for UI
    const [selectedAgencyId, setSelectedAgencyId] = useState<string>('');
    const [agencySearch, setAgencySearch] = useState('');
    const [opTypeSearch, setOpTypeSearch] = useState('');

    // Modal states
    const [isEditModalOpen, setEditModalOpen] = useState(false);
    const [isCreateChefModalOpen, setCreateChefModalOpen] = useState(false);
    const [isSuspensionModalOpen, setSuspensionModalOpen] = useState(false);
    const [selectedAgencyIdForEdit, setSelectedAgencyIdForEdit] = useState<string | null>(null);
    const [selectedAgencyForSuspension, setSelectedAgencyForSuspension] = useState<{
        id: string;
        name: string;
        status: 'active' | 'suspended';
    } | null>(null);

    // Fetch all operation types once
    useEffect(() => {
        const fetchOpTypes = async () => {
            setLoadingOpTypes(true);
            const { data, error } = await supabase.from('operation_types').select('*');
            if (error) {
                handleSupabaseError(error, "Chargement des types d'opérations");
            } else {
                const mappedData = (data as any[] || []).map(op => ({
                    ...op,
                    fields: (op.fields as FormField[] | null) || [],
                    commission_config: (op.commission_config as CommissionConfig | null) || { type: 'none' }
                }));
                setOpTypes(mappedData);
            }
            setLoadingOpTypes(false);
        };
        fetchOpTypes();
    }, []);

    // Set initial selected agency
    useEffect(() => {
        if (agencies.length > 0 && !selectedAgencyId) {
            setSelectedAgencyId(agencies[0].id);
        }
    }, [agencies, selectedAgencyId]);

    // Fetch access rights when agency changes
    const fetchAccessForAgency = useCallback(async (agencyId: string) => {
        if (!agencyId) return;
        const { data, error } = await supabase
            .from('agency_operation_access')
            .select('op_type_id')
            .eq('agency_id', agencyId);

        if (error) {
            handleSupabaseError(error, "Chargement des accès de l'agence");
            setInitialAccess([]);
            setCurrentAccess([]);
        } else {
            const allowedIds = data.map(item => item.op_type_id);
            setInitialAccess(allowedIds);
            setCurrentAccess(allowedIds);
        }
    }, []);

    useEffect(() => {
        fetchAccessForAgency(selectedAgencyId);
    }, [selectedAgencyId, fetchAccessForAgency]);

    const handleToggleAccess = (opTypeId: string) => {
        setCurrentAccess(prev =>
            prev.includes(opTypeId)
                ? prev.filter(id => id !== opTypeId)
                : [...prev, opTypeId]
        );
    };

    const handleSaveAccess = async () => {
        if (!selectedAgencyId) return;
        setIsSaving(true);
        const { error } = await supabase.rpc('update_agency_op_access', {
            p_agency_id: selectedAgencyId,
            p_op_type_ids: currentAccess
        });

        if (error) {
            handleSupabaseError(error, "Sauvegarde des accès de l'agence");
        } else {
            console.log("Accès mis à jour !");
            await fetchAccessForAgency(selectedAgencyId); // Refresh state
        }
        setIsSaving(false);
    };
    
    const openEditModal = (id: string | null) => {
        setSelectedAgencyIdForEdit(id);
        setEditModalOpen(true);
    };

    const handleSaveAgency = async (agencyData: Agency) => {
        await saveAgency(agencyData);
        setEditModalOpen(false);
    };

    const handleCreateChef = async (chefData: { name: string; email: string; password: string; }) => {
        try {
            await createChef(chefData);
            // Le modal se fermera automatiquement depuis CreateChefModal en cas de succès
        } catch (error) {
            // En cas d'erreur, on laisse le modal ouvert pour permettre à l'utilisateur de réessayer
            console.error('Erreur lors de la création du chef:', error);
            throw error; // Propager l'erreur pour que CreateChefModal puisse la gérer
        }
    };

    const handleToggleAgencyStatus = (agencyId: string, agencyName: string, currentStatus: 'active' | 'suspended') => {
        setSelectedAgencyForSuspension({
            id: agencyId,
            name: agencyName,
            status: currentStatus
        });
        setSuspensionModalOpen(true);
    };

    const handleSuspensionSuccess = () => {
        // Recharger les données des agences
        window.location.reload();
    };

    const filteredAgencies = useMemo(() =>
        agencies.filter(a => (a.name || '').toLowerCase().includes(agencySearch.toLowerCase())),
        [agencies, agencySearch]
    );
    
    const filteredOpTypes = useMemo(() =>
        opTypes.filter(op => (op.name || '').toLowerCase().includes(opTypeSearch.toLowerCase())),
        [opTypes, opTypeSearch]
    );

    const selectedAgency = useMemo(() => agencies.find(a => a.id === selectedAgencyId), [agencies, selectedAgencyId]);

    const hasChanges = useMemo(() =>
        JSON.stringify(initialAccess.sort()) !== JSON.stringify(currentAccess.sort()),
        [initialAccess, currentAccess]
    );

    if (agenciesLoading) return <Card title="Gestion des Agences & Services" icon="fa-building">Chargement des agences...</Card>;

    return (
        <>
            <Card title="Gestion des Agences & Services" icon="fa-building">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[70vh]">
                    {/* Left Panel: Agency List */}
                    <div className="lg:col-span-1 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border dark:border-gray-700 flex flex-col">
                        <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-3">Agences ({filteredAgencies.length})</h3>
                        <div className="relative mb-3">
                            <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                            <input type="text" placeholder="Rechercher une agence..." className="form-input pl-10" value={agencySearch} onChange={e => setAgencySearch(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-2 mb-3">
                            <button className="btn btn-sm btn-outline-secondary w-full" onClick={() => setCreateChefModalOpen(true)}>
                                <i className="fas fa-user-plus mr-2"></i>Créer Chef
                            </button>
                            <button className="btn btn-sm btn-primary w-full" onClick={() => openEditModal(null)}>
                                <i className="fas fa-plus-circle mr-2"></i>Créer Agence
                            </button>
                        </div>
                        <div className="flex-grow overflow-y-auto -mx-2">
                            <ul className="space-y-1 px-2">
                                {filteredAgencies.map(agency => {
                                    const isSuspended = agency.status === 'suspended';
                                    const isSelected = selectedAgencyId === agency.id;
                                    return (
                                        <li key={agency.id}>
                                            <div className={`relative rounded-md transition-colors duration-200 ${
                                                isSelected 
                                                    ? 'bg-blue-600 text-white shadow-md' 
                                                    : isSuspended 
                                                        ? 'bg-red-50 hover:bg-red-100 border border-red-200' 
                                                        : 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
                                            }`}>
                                                <button 
                                                    onClick={() => setSelectedAgencyId(agency.id)} 
                                                    className="w-full text-left p-3 pr-12"
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <p className={`font-semibold ${isSuspended && !isSelected ? 'text-red-700' : ''}`}>
                                                            {agency.name}
                                                        </p>
                                                        {isSuspended && (
                                                            <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${
                                                                isSelected 
                                                                    ? 'bg-red-200 text-red-800' 
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                <i className="fas fa-pause-circle mr-1"></i>
                                                                Suspendue
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className={`text-sm ${
                                                        isSelected 
                                                            ? 'text-blue-200' 
                                                            : isSuspended 
                                                                ? 'text-red-600' 
                                                                : 'text-gray-500'
                                                    }`}>
                                                        Chef: {agency.chef_name || 'N/A'}
                                                    </p>
                                                </button>
                                                
                                                {/* Bouton de suspension/activation */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleToggleAgencyStatus(agency.id, agency.name, agency.status);
                                                    }}
                                                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded transition-colors ${
                                                        isSuspended
                                                            ? 'text-green-600 hover:text-green-800 hover:bg-green-100'
                                                            : 'text-red-600 hover:text-red-800 hover:bg-red-100'
                                                    }`}
                                                    title={isSuspended ? 'Réactiver l\'agence' : 'Suspendre l\'agence'}
                                                >
                                                    <i className={`fas ${isSuspended ? 'fa-play-circle' : 'fa-pause-circle'} text-sm`}></i>
                                                </button>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    </div>

                    {/* Right Panel: Details & Services */}
                    <div className="lg:col-span-2 bg-white dark:bg-gray-900 p-4 rounded-lg border dark:border-gray-700 flex flex-col">
                        {selectedAgency ? (
                            <>
                                {/* Agency Details */}
                                <div className="pb-4 border-b dark:border-gray-700 flex justify-between items-start">
                                    <div>
                                        <div className="flex items-center gap-3 mb-2">
                                            <h3 className={`text-xl font-bold ${
                                                selectedAgency.status === 'suspended' 
                                                    ? 'text-red-600' 
                                                    : 'text-gray-800 dark:text-gray-100'
                                            }`}>
                                                {selectedAgency.name}
                                            </h3>
                                            {selectedAgency.status === 'suspended' && (
                                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                    <i className="fas fa-pause-circle mr-1"></i>
                                                    Agence Suspendue
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center mt-2 text-sm text-gray-600 dark:text-gray-300">
                                            <div className="flex items-center mr-6"><i className="fas fa-user-tie mr-2 text-purple-500"></i>Chef: <span className="font-medium ml-1">{selectedAgency.chef_name || 'Non assigné'}</span></div>
                                            <div className="flex items-center mr-6"><i className="fas fa-users mr-2 text-cyan-500"></i>Agents: <span className="font-medium ml-1">{selectedAgency.agent_count}</span></div>
                                            <div className="flex items-center">
                                                <i className={`fas ${selectedAgency.status === 'suspended' ? 'fa-pause-circle text-red-500' : 'fa-check-circle text-green-500'} mr-2`}></i>
                                                Statut: <span className={`font-medium ml-1 ${selectedAgency.status === 'suspended' ? 'text-red-600' : 'text-green-600'}`}>
                                                    {selectedAgency.status === 'suspended' ? 'Suspendue' : 'Active'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button 
                                            onClick={() => handleToggleAgencyStatus(selectedAgency.id, selectedAgency.name, selectedAgency.status)}
                                            className={`btn btn-sm ${
                                                selectedAgency.status === 'suspended'
                                                    ? 'btn-success'
                                                    : 'btn-danger'
                                            }`}
                                        >
                                            <i className={`fas ${selectedAgency.status === 'suspended' ? 'fa-play' : 'fa-pause'} mr-2`}></i>
                                            {selectedAgency.status === 'suspended' ? 'Réactiver' : 'Suspendre'}
                                        </button>
                                        <button className="btn btn-sm btn-outline-secondary" onClick={() => openEditModal(selectedAgency.id)}>
                                            <i className="fas fa-edit mr-2"></i>Modifier
                                        </button>
                                    </div>
                                </div>
                                
                                {/* Services Section */}
                                <div className="flex flex-col flex-grow mt-4">
                                    <div className="flex justify-between items-center mb-3">
                                        <h4 className="text-lg font-semibold text-gray-700 dark:text-gray-200">Attribution des Services</h4>
                                        <div className="relative w-full max-w-xs">
                                             <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
                                            <input type="text" placeholder="Rechercher un service..." className="form-input form-input-sm pl-10" value={opTypeSearch} onChange={e => setOpTypeSearch(e.target.value)} />
                                        </div>
                                    </div>
                                    
                                    {loadingOpTypes ? <p>Chargement des services...</p> : (
                                        <div className="flex-grow overflow-y-auto pr-2 -mr-2 space-y-2">
                                            {filteredOpTypes.map(opType => (
                                                <div key={opType.id} className="flex justify-between items-center p-3 rounded-md bg-gray-50 dark:bg-gray-800/50 border dark:border-gray-700">
                                                    <div>
                                                        <p className="font-medium text-gray-800 dark:text-gray-100">{opType.name}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{opType.description}</p>
                                                    </div>
                                                    <ToggleSwitch
                                                        checked={currentAccess.includes(opType.id)}
                                                        onChange={() => handleToggleAccess(opType.id)}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {hasChanges && (
                                        <div className="pt-4 mt-auto border-t flex justify-end">
                                            <button className="btn btn-primary" onClick={handleSaveAccess} disabled={isSaving}>
                                                <i className={`fas ${isSaving ? 'fa-spinner fa-spin' : 'fa-save'} mr-2`}></i>
                                                {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <div className="flex-grow flex items-center justify-center text-center text-gray-500">
                                <div>
                                    <i className="fas fa-mouse-pointer fa-3x mb-4 text-gray-400"></i>
                                    <p>Veuillez sélectionner une agence pour voir ses détails.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            <EditAgencyModal
                isOpen={isEditModalOpen}
                onClose={() => setEditModalOpen(false)}
                agencyId={selectedAgencyIdForEdit}
                onSave={handleSaveAgency}
            />
            <CreateChefModal
                isOpen={isCreateChefModalOpen}
                onClose={() => setCreateChefModalOpen(false)}
                onSave={handleCreateChef}
            />
            {selectedAgencyForSuspension && (
                <AgencySuspensionModal
                    isOpen={isSuspensionModalOpen}
                    onClose={() => {
                        setSuspensionModalOpen(false);
                        setSelectedAgencyForSuspension(null);
                    }}
                    agencyId={selectedAgencyForSuspension.id}
                    agencyName={selectedAgencyForSuspension.name}
                    currentStatus={selectedAgencyForSuspension.status}
                    onSuccess={handleSuspensionSuccess}
                />
            )}
        </>
    );
};