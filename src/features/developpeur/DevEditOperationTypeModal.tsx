
import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/common/Modal';
import { OperationType, FormField, CommissionTier } from '../../types';

interface DevEditOperationTypeModalProps {
    isOpen: boolean;
    onClose: () => void;
    opTypeId: string | null;
    initialData?: OperationType | null;
    onSave: (opTypeData: OperationType) => void;
}

const emptyOpData: OperationType = {
    id: `op_${Date.now()}`,
    name: '',
    description: '',
    impacts_balance: false,
    proof_is_required: false,
    status: 'active',
    fields: [],
    commission_config: { type: 'none' }
};

export const DevEditOperationTypeModal: React.FC<DevEditOperationTypeModalProps> = ({ isOpen, onClose, opTypeId, initialData, onSave }) => {
    const [activeTab, setActiveTab] = useState('info');
    const [opData, setOpData] = useState<OperationType | null>(null);

    useEffect(() => {
        if (isOpen) {
            setActiveTab('info');
            let dataToLoad: OperationType;

            if (initialData) {
                // Deep copy to prevent side effects on the original state
                dataToLoad = JSON.parse(JSON.stringify(initialData));
            } else {
                dataToLoad = { ...emptyOpData, id: `op_${Date.now()}` };
            }

            // Ensure nested objects/arrays exist
            dataToLoad.fields = Array.isArray(dataToLoad.fields) ? dataToLoad.fields : [];
            dataToLoad.commission_config = dataToLoad.commission_config && typeof dataToLoad.commission_config === 'object' 
                ? dataToLoad.commission_config 
                : { type: 'none' };
            if (dataToLoad.commission_config.type === 'tiers' && !Array.isArray(dataToLoad.commission_config.tiers)) {
                dataToLoad.commission_config.tiers = [];
            }
            
            setOpData(dataToLoad);
        }
    }, [isOpen, initialData]);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        if (!opData) return;
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
        setOpData(prev => prev ? { ...prev, [name]: val } : null);
    };
    
    const handleCommissionChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!opData) return;
        const { name, value } = e.target;
        
        setOpData(prev => {
            if (!prev) return null;
            const config = prev.commission_config;
            const newCommissionConfig = { ...config, [name]: value };
            return { ...prev, commission_config: newCommissionConfig };
        });
    };

    const handleFieldChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        if (!opData) return;
        const { name, value, type } = e.target;
        setOpData(prevData => {
            if (!prevData || !Array.isArray(prevData.fields)) return null;
            
            const newFields = [...prevData.fields];
            const fieldToUpdate = { ...newFields[index] } as any;

            if (name === 'options') {
                fieldToUpdate.options = value.split(',').map(opt => opt.trim()).filter(opt => opt);
            } else if (name === 'hasPricing') {
                const checked = (e.target as HTMLInputElement).checked;
                if (checked) {
                    fieldToUpdate.pricing = {};
                } else {
                    delete fieldToUpdate.pricing;
                }
            } else if (name === 'pricingConfig') {
                // Parse pricing config: "Option1:1000,Option2:2000"
                const pricingObj: Record<string, number> = {};
                value.split(',').forEach(pair => {
                    const [key, price] = pair.split(':');
                    if (key && price && !isNaN(Number(price))) {
                        pricingObj[key.trim()] = Number(price);
                    }
                });
                fieldToUpdate.pricing = pricingObj;
            } else if (type === 'checkbox') {
                fieldToUpdate[name as 'required' | 'obsolete'] = (e.target as HTMLInputElement).checked;
            } else {
                fieldToUpdate[name] = value;
            }
            
            newFields[index] = fieldToUpdate;
            return { ...prevData, fields: newFields };
        });
    };
    
    const handleAddField = () => {
        if (!opData) return;
        const newField: FormField = { id: `new_${Date.now()}`, label: '', name: '', type: 'text', required: false, obsolete: false };
        setOpData(prev => {
            if (!prev) return null;
            const currentFields = Array.isArray(prev.fields) ? prev.fields : [];
            return {...prev, fields: [...currentFields, newField]};
        });
    };

    const handleRemoveField = (index: number) => {
        if (!opData || !Array.isArray(opData.fields)) return;
        setOpData(prev => {
             if (!prev || !Array.isArray(prev.fields)) return null;
            return {...prev!, fields: prev!.fields.filter((_, i) => i !== index)};
        });
    };
    
    const handleTierChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
        if (!opData) return;
        const { name, value } = e.target;
        setOpData(prev => {
            if (!prev) return prev;
            const commissionConfig = prev.commission_config;
            if (!commissionConfig.tiers) return prev;
            
            const newTiers = [...commissionConfig.tiers];
            const updatedTier = {...newTiers[index]};

            if (name === 'from') updatedTier.from = Number(value);
            else if (name === 'to') updatedTier.to = value === '' ? null : Number(value);
            else if (name === 'commission') updatedTier.commission = value;
            
            newTiers[index] = updatedTier;

            const newCommissionConfig = {...commissionConfig, tiers: newTiers};
            return {...prev, commission_config: newCommissionConfig};
        });
    };

    const handleAddTier = () => {
        if (!opData) return;
        const newTier: CommissionTier = { from: 0, to: null, commission: 0 };
        setOpData(prev => {
            if (!prev) return null;
            const commissionConfig = prev.commission_config;
            const currentTiers = commissionConfig.tiers || [];
            return { ...prev, commission_config: { ...commissionConfig, tiers: [...currentTiers, newTier]}};
        });
    };

    const handleRemoveTier = (index: number) => {
        if (!opData) return;
        setOpData(prev => {
            if (!prev) return null;
            const commissionConfig = prev.commission_config;
            if (!commissionConfig.tiers) return prev;
            const newTiers = commissionConfig.tiers.filter((_, i) => i !== index);
            return { ...prev, commission_config: { ...commissionConfig, tiers: newTiers}};
        });
    };

    const handleSave = (e: React.FormEvent) => { 
        e.preventDefault(); 
        if (opData) {
            onSave(opData);
        }
        onClose(); 
    };

    if (!isOpen || !opData) return null;
    
    const currentFields = opData.fields;
    const currentCommissionConfig = opData.commission_config;

    return (
        <Modal
            id="dev-op-type-modal"
            title={opTypeId ? `Éditer: ${opData.name}` : "Créer un Type d'Opération"}
            isOpen={isOpen}
            onClose={onClose}
            size="md:max-w-6xl"
            icon={<i className="fas fa-cogs text-xl"></i>}
            footer={
                <>
                    <button type="button" className="btn btn-secondary" onClick={onClose}>Annuler</button>
                    <button type="submit" form="dev-op-type-form" className="btn btn-success ml-auto"><i className="fas fa-save mr-2"></i>Enregistrer</button>
                </>
            }
        >
            <form id="dev-op-type-form" onSubmit={handleSave}>
                 <div className="tabs">
                    <button type="button" onClick={() => setActiveTab('info')} className={activeTab === 'info' ? 'active' : ''}>Informations Générales</button>
                    <button type="button" onClick={() => setActiveTab('fields')} className={activeTab === 'fields' ? 'active' : ''}>Champs du Formulaire</button>
                    <button type="button" onClick={() => setActiveTab('commissions')} className={activeTab === 'commissions' ? 'active' : ''}>Commissions</button>
                </div>
                <div className="tab-content min-h-[350px] py-4">
                    {activeTab === 'info' && <div className="space-y-4">
                        <div><label className="form-label">Nom du Type d'Opération</label><input type="text" name="name" value={opData.name} onChange={handleChange} className="form-input" required/></div>
                        <div><label className="form-label">Description</label><textarea name="description" value={opData.description || ''} onChange={handleChange} className="form-textarea" rows={2}></textarea></div>
                        <div className="flex items-center"><input type="checkbox" name="impacts_balance" checked={opData.impacts_balance} onChange={handleChange} className="h-4 w-4 mr-2"/><label>Cette operation impacte-t-elle les soldes ?</label></div>
                        <div className="flex items-center"><input type="checkbox" name="proof_is_required" checked={opData.proof_is_required} onChange={handleChange} className="h-4 w-4 mr-2" /><label>La preuve de paiement est-elle obligatoire ?</label></div>
                        <div><label className="form-label">Statut</label><select name="status" value={opData.status} onChange={handleChange} className="form-select"><option value="active">Actif</option><option value="inactive">Inactif</option><option value="archived">Archiver</option></select></div>
                    </div>}
                    {activeTab === 'fields' && <div>
                        <div id="devOpTypeFieldsContainer" className="space-y-3 max-h-96 overflow-y-auto p-2 border rounded-md">
                            {currentFields.map((field, index) => <div key={index} className="p-3 border rounded-md bg-gray-50 space-y-3">
                                {/* Ligne 1: Informations de base */}
                                <div className="grid grid-cols-1 md:grid-cols-6 gap-2 items-end">
                                    <div className="md:col-span-2"><label className="form-label text-xs">Libellé</label><input type="text" name="label" value={field.label} onChange={(e) => handleFieldChange(index, e)} className="form-input form-input-sm"/></div>
                                    <div><label className="form-label text-xs">Nom Tech.</label><input type="text" name="name" value={field.name} onChange={(e) => handleFieldChange(index, e)} className="form-input form-input-sm"/></div>
                                    <div><label className="form-label text-xs">Type</label><select name="type" value={field.type} onChange={(e) => handleFieldChange(index, e)} className="form-select form-select-sm"><option value="text">Texte</option><option value="number">Nombre</option><option value="email">Email</option><option value="tel">Téléphone</option><option value="select">Liste</option></select></div>
                                    <div className="flex items-center space-x-2 pt-4"><input type="checkbox" name="required" checked={field.required} onChange={(e) => handleFieldChange(index, e)}/><label className="text-xs">Requis</label><input type="checkbox" name="obsolete" checked={field.obsolete} onChange={(e) => handleFieldChange(index, e)}/><label className="text-xs">Obsolète</label></div>
                                    <button type="button" className="btn btn-danger btn-xs" onClick={() => handleRemoveField(index)}><i className="fas fa-trash"></i></button>
                                </div>
                                
                                {/* Ligne 2: Options et pricing (si select) */}
                                {field.type === 'select' && (
                                    <div className="border-t pt-3 space-y-2">
                                        <div><label className="form-label text-xs">Options (séparées par des virgules)</label><input type="text" name="options" value={field.options?.join(',') || ''} onChange={(e) => handleFieldChange(index, e)} className="form-input form-input-sm" placeholder="Option 1, Option 2, Option 3"/></div>
                                        
                                        <div className="flex items-center space-x-2">
                                            <input type="checkbox" name="hasPricing" checked={!!(field as any).pricing} onChange={(e) => handleFieldChange(index, e)} className="h-4 w-4"/>
                                            <label className="text-xs font-medium">Ce champ détermine le prix de l'opération</label>
                                        </div>
                                        
                                        {(field as any).pricing && (
                                            <div className="bg-blue-50 p-3 rounded border">
                                                <label className="form-label text-xs">Configuration des prix (Format: "Option 1:1000,Option 2:2000")</label>
                                                <input 
                                                    type="text" 
                                                    name="pricingConfig" 
                                                    value={Object.entries((field as any).pricing || {}).map(([key, value]) => `${key}:${value}`).join(',')}
                                                    onChange={(e) => handleFieldChange(index, e)} 
                                                    className="form-input form-input-sm" 
                                                    placeholder="Essentiel - 2500 XOF:2500,Standard - 4500 XOF:4500"
                                                />
                                                <p className="text-xs text-gray-600 mt-1">💡 Exemple: "Formule Basic:1000,Formule Premium:2500"</p>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>)}
                        </div>
                        <button type="button" onClick={handleAddField} className="btn btn-sm btn-outline-secondary mt-3"><i className="fas fa-plus mr-1"></i>Ajouter un Champ</button>
                        
                        {/* Aide pour le système de pricing */}
                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-semibold text-blue-800 mb-2"><i className="fas fa-info-circle mr-2"></i>Système de Pricing</h4>
                            <div className="text-sm text-blue-700 space-y-2">
                                <p><strong>Champs avec pricing :</strong> Permettent de définir des options avec des prix différents (ex: Netflix Basic, Standard, Premium).</p>
                                <p><strong>Format des options :</strong> "Formule Basic - 1000 XOF, Formule Premium - 2500 XOF"</p>
                                <p><strong>Format du pricing :</strong> "Formule Basic - 1000 XOF:1000, Formule Premium - 2500 XOF:2500"</p>
                                <p><strong>⚠️ Important :</strong> Les clés du pricing doivent correspondre exactement aux options.</p>
                            </div>
                        </div>
                    </div>}
                    {activeTab === 'commissions' && <div>
                        <div className="mb-4">
                            <label className="form-label">Type de Commission</label>
                            <select name="type" value={currentCommissionConfig.type} onChange={handleCommissionChange} className="form-select">
                                <option value="none">Aucune</option>
                                <option value="fixed">Fixe</option>
                                <option value="percentage">Pourcentage</option>
                                <option value="tiers">Paliers</option>
                            </select>
                        </div>
                        {currentCommissionConfig.type === 'fixed' && <div><label className="form-label">Montant Fixe (XOF)</label><input type="number" name="amount" value={currentCommissionConfig.amount ?? ''} onChange={handleCommissionChange} className="form-input"/></div>}
                        {currentCommissionConfig.type === 'percentage' && <div><label className="form-label">Pourcentage (%)</label><input type="number" step="0.1" name="rate" value={currentCommissionConfig.rate ?? ''} onChange={handleCommissionChange} className="form-input"/></div>}
                        {currentCommissionConfig.type === 'tiers' && (
                            <div className="space-y-3 mt-4 p-4 border rounded-md bg-gray-50">
                                <p className="font-medium text-gray-700">Définir les Paliers</p>
                                <div id="devOpCommissionTiersList" className="space-y-2 max-h-60 overflow-y-auto pr-2">
                                    {currentCommissionConfig.tiers?.map((tier, index) => (
                                        <div key={index} className="grid grid-cols-10 gap-x-2 items-center">
                                            <input type="number" name="from" value={tier.from ?? ''} onChange={(e) => handleTierChange(index, e)} className="form-input form-input-sm col-span-3" placeholder="Ex: 0" />
                                            <input type="number" name="to" value={tier.to === null ? '' : (tier.to ?? '')} onChange={(e) => handleTierChange(index, e)} className="form-input form-input-sm col-span-3" placeholder="Ex: 50000"/>
                                            <input type="text" name="commission" value={tier.commission ?? ''} onChange={(e) => handleTierChange(index, e)} className="form-input form-input-sm col-span-3" placeholder="Ex: 500 ou 1.5%"/>
                                            <div className="col-span-1 text-center"><button type="button" className="btn btn-danger btn-xs" onClick={() => handleRemoveTier(index)} title="Supprimer le palier"><i className="fas fa-trash"></i></button></div>
                                        </div>
                                    ))}
                                </div>
                                <button type="button" onClick={handleAddTier} className="btn btn-sm btn-outline-secondary mt-2"><i className="fas fa-plus mr-1"></i>Ajouter un Palier</button>
                            </div>
                        )}
                    </div>}
                </div>
            </form>
        </Modal>
    );
};
