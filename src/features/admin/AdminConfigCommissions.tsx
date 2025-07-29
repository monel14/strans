import React, { useState, useMemo, useEffect } from 'react';
import { PageComponentProps, OperationType, CommissionTier, CommissionConfig, FormField, Json } from '../../types';
import { Card } from '../../components/common/Card';
import { formatAmount } from '../../utils/formatters';
import { supabase } from '../../supabaseClient';
import { handleSupabaseError } from '../../utils/errorUtils';
import { Database } from '../../types/database.types';

// Helper function to get a summary of the commission
const getCommissionSummary = (opType: OperationType): string => {
    const config = opType.commission_config;
    if (!config) return 'Non configurée';

    switch (config.type) {
        case 'none': return 'Aucune';
        case 'fixed': return `Fixe: ${formatAmount(config.amount)}`;
        case 'percentage': return `Pourcentage: ${config.rate}%`;
        case 'tiers': return `Paliers (${config.tiers?.length || 0})`;
        default: return 'Non configurée';
    }
};

interface AdminConfigCommissionsProps extends PageComponentProps {}

export const AdminConfigCommissions: React.FC<AdminConfigCommissionsProps> = () => {
    const [operationTypes, setOperationTypes] = useState<OperationType[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOpId, setSelectedOpId] = useState<string | null>(null);
    const [editingConfig, setEditingConfig] = useState<OperationType | null>(null);

    useEffect(() => {
        const fetchOpTypes = async () => {
            setLoading(true);
            const { data, error } = await supabase.from('operation_types').select('id, name, description, impacts_balance, proof_is_required, status, fields, commission_config');
            if (error) {
                console.error("Failed to fetch operation types", error);
                handleSupabaseError(error, "Chargement des types d'opérations");
            } else {
                const mappedData = (data as any[] || []).map(op => ({
                    ...op,
                    fields: (op.fields as FormField[] | null) || [],
                    commission_config: (op.commission_config as CommissionConfig | null) || { type: 'none' }
                }));
                setOperationTypes(mappedData);
                if (mappedData.length > 0 && !selectedOpId) {
                    setSelectedOpId(mappedData[0].id);
                }
            }
            setLoading(false);
        };
        fetchOpTypes();
    }, []);

    useEffect(() => {
        if (selectedOpId) {
            const originalOp = operationTypes.find(op => op.id === selectedOpId);
            if (originalOp) {
                // Deep copy to prevent direct mutation
                setEditingConfig(JSON.parse(JSON.stringify(originalOp)));
            }
        } else {
            setEditingConfig(null);
        }
    }, [selectedOpId, operationTypes]);
    
    const filteredOperationTypes = useMemo(() =>
        operationTypes.filter(op =>
            (op.name || '').toLowerCase().includes(searchTerm.toLowerCase())
        ), [operationTypes, searchTerm]
    );

    const handleConfigChange = (field: keyof CommissionConfig, value: any) => {
        if (!editingConfig) return;
        setEditingConfig(prev => {
            if (!prev) return null;
            const newCommissionConfig = { ...prev.commission_config, [field]: value };
            return { ...prev, commission_config: newCommissionConfig };
        });
    };
    
    const handleTierChange = (index: number, field: keyof CommissionTier, value: string) => {
        if (!editingConfig) return;

        setEditingConfig(prev => {
            if (!prev) return null;
            const commissionConfig = prev.commission_config;
            if (!commissionConfig.tiers) return prev;

            const newTiers = [...commissionConfig.tiers];
            const tierToUpdate = { ...newTiers[index] };

            if (field === 'from') {
                tierToUpdate.from = Number(value);
            } else if (field === 'to') {
                tierToUpdate.to = value === '' ? null : Number(value);
            } else if (field === 'commission') {
                tierToUpdate.commission = value;
            }

            newTiers[index] = tierToUpdate;

            return {
                ...prev,
                commission_config: {
                    ...prev.commission_config,
                    tiers: newTiers,
                },
            };
        });
    };

    const addTier = () => {
        if (!editingConfig) return;
        const newTier: CommissionTier = { from: 0, to: null, commission: 0 };
        setEditingConfig(prev => {
            if (!prev) return null;
            const commissionConfig = prev.commission_config;
            const newTiers = [...(commissionConfig.tiers || []), newTier];
            return {
                ...prev,
                commission_config: { ...commissionConfig, tiers: newTiers }
            }
        });
    };

    const removeTier = (index: number) => {
        if (!editingConfig) return;
        const commissionConfig = editingConfig.commission_config;
        if (!commissionConfig.tiers) return;

        const newTiers = commissionConfig.tiers.filter((_: any, i: number) => i !== index);
        setEditingConfig(prev => {
            if (!prev) return null;
            return {
                ...prev,
                commission_config: { ...prev.commission_config, tiers: newTiers }
            }
        });
    };

    const handleSave = async () => {
        if (!editingConfig) return;
        const updatePayload: Database['public']['Tables']['operation_types']['Update'] = {
            commission_config: editingConfig.commission_config as unknown as Json
        };
        const { error } = await supabase.from('operation_types').update(updatePayload).eq('id', editingConfig.id);

        if (error) {
            handleSupabaseError(error, "Sauvegarde de la configuration des commissions");
        } else {
            console.log('Configuration sauvegardée !');
            // Refresh local state to match DB
            setOperationTypes(prev => prev.map(op => op.id === editingConfig!.id ? editingConfig! : op));
        }
    };
    
    const hasChanges = useMemo(() => {
        if (!editingConfig || !selectedOpId) return false;
        const originalOp = operationTypes.find(op => op.id === selectedOpId);
        return JSON.stringify(originalOp) !== JSON.stringify(editingConfig);
    }, [editingConfig, selectedOpId, operationTypes]);
    
    const currentCommissionConfig = editingConfig?.commission_config;

    if (loading) {
        return <Card title="Configuration des Commissions" icon="fa-cogs"><div>Chargement...</div></Card>
    }

    return (
        <Card title="Configuration des Commissions" icon="fa-cogs">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[65vh]">
                {/* Left Panel: Operation List */}
                <div className="lg:col-span-1 bg-gray-50 p-4 rounded-lg border flex flex-col">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Opérations</h3>
                    <input
                        type="text"
                        placeholder="Rechercher une opération..."
                        className="form-input mb-3"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <div className="flex-grow overflow-y-auto -mx-2">
                        <ul className="space-y-1 px-2">
                            {filteredOperationTypes.map(op => (
                                <li key={op.id}>
                                    <button
                                        onClick={() => setSelectedOpId(op.id)}
                                        className={`w-full text-left p-3 rounded-md transition-colors duration-200 ${selectedOpId === op.id ? 'bg-blue-600 text-white shadow-md' : 'hover:bg-gray-200 text-gray-800'}`}
                                    >
                                        <p className="font-semibold">{op.name}</p>
                                        <p className={`text-sm ${selectedOpId === op.id ? 'text-blue-200' : 'text-gray-500'}`}>
                                            {getCommissionSummary(op)}
                                        </p>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Right Panel: Configuration Form */}
                <div className="lg:col-span-2 bg-white p-4 rounded-lg border flex flex-col">
                    {!editingConfig || !currentCommissionConfig ? (
                         <div className="flex-grow flex items-center justify-center text-center text-gray-500">
                             <div>
                                <i className="fas fa-mouse-pointer fa-3x mb-4 text-gray-400"></i>
                                <p>Sélectionnez une opération pour la configurer.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            <h3 className="text-xl font-bold text-gray-800 mb-4">{editingConfig.name}</h3>
                            
                            <div className="flex-grow space-y-6 overflow-y-auto pr-2">
                                <div>
                                    <label htmlFor="commissionType" className="form-label">Type de Commission</label>
                                    <select
                                        id="commissionType"
                                        className="form-select"
                                        value={currentCommissionConfig.type}
                                        onChange={e => handleConfigChange('type', e.target.value)}
                                    >
                                        <option value="none">Aucune</option>
                                        <option value="fixed">Fixe</option>
                                        <option value="percentage">Pourcentage</option>
                                        <option value="tiers">Paliers</option>
                                    </select>
                                </div>

                                {currentCommissionConfig.type === 'fixed' && (
                                    <div>
                                        <label htmlFor="fixedAmount" className="form-label">Montant Fixe (XOF)</label>
                                        <input
                                            type="number"
                                            id="fixedAmount"
                                            className="form-input"
                                            value={currentCommissionConfig.amount || ''}
                                            onChange={e => handleConfigChange('amount', Number(e.target.value))}
                                        />
                                    </div>
                                )}

                                {currentCommissionConfig.type === 'percentage' && (
                                     <div>
                                        <label htmlFor="percentageRate" className="form-label">Taux de Pourcentage (%)</label>
                                        <input
                                            type="number"
                                            id="percentageRate"
                                            className="form-input"
                                            step="0.1"
                                            value={currentCommissionConfig.rate || ''}
                                            onChange={e => handleConfigChange('rate', Number(e.target.value))}
                                        />
                                    </div>
                                )}
                                
                                {currentCommissionConfig.type === 'tiers' && (
                                    <div className="space-y-3 p-4 border rounded-md bg-gray-50">
                                        <p className="font-medium text-gray-700">Définir les Paliers</p>
                                        <div className="grid grid-cols-10 gap-x-2 pb-1 border-b">
                                            <label className="col-span-3 text-xs font-semibold text-gray-500">De (XOF)</label>
                                            <label className="col-span-3 text-xs font-semibold text-gray-500">À (XOF)</label>
                                            <label className="col-span-3 text-xs font-semibold text-gray-500">Commission</label>
                                        </div>
                                        <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                            {currentCommissionConfig.tiers?.map((tier, index) => (
                                                <div key={index} className="grid grid-cols-10 gap-x-2 items-center">
                                                    <input type="number" value={tier.from} onChange={e => handleTierChange(index, 'from', e.target.value)} className="form-input form-input-sm col-span-3" />
                                                    <input type="number" value={tier.to === null ? '' : tier.to} onChange={e => handleTierChange(index, 'to', e.target.value)} className="form-input form-input-sm col-span-3" placeholder="Infini"/>
                                                    <input type="text" value={tier.commission as string} onChange={e => handleTierChange(index, 'commission', e.target.value)} className="form-input form-input-sm col-span-3" placeholder="500 ou 1.5%"/>
                                                    <button type="button" onClick={() => removeTier(index)} className="btn btn-danger btn-xs"><i className="fas fa-trash"></i></button>
                                                </div>
                                            ))}
                                        </div>
                                        <button type="button" onClick={addTier} className="btn btn-sm btn-outline-secondary mt-2"><i className="fas fa-plus mr-1"></i>Ajouter Palier</button>
                                    </div>
                                )}
                            </div>

                            <div className="pt-4 mt-auto border-t flex justify-end">
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSave}
                                    disabled={!hasChanges}
                                >
                                    <i className="fas fa-save mr-2"></i>Enregistrer
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};