import React, { useState, useEffect } from 'react';
import { PageComponentProps } from '../../types';
import { Card } from '../../components/common/Card';
import { ToggleSwitch } from '../../components/common/ToggleSwitch';
import { PageHeader } from '../../components/common/PageHeader';

// Mock data for initial state. In a real app, this would be fetched from an API.
const initialConfig = {
    appName: "SecureTrans",
    defaultCurrency: "XOF",
    defaultTimezone: "GMT",
    maxUploadSize: 2,
    passwordComplexityRegex: "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)[a-zA-Z\\d]{8,}$",
    sessionTimeout: 15,
    smtpHost: "smtp.example.com",
    smtpPort: 587,
    maintenanceMode: false,
    maintenanceMessage: "La plateforme est actuellement en maintenance. Nous serons de retour bientôt.",
};

type ConfigState = typeof initialConfig;

export const DevSystemConfig: React.FC<PageComponentProps> = () => {
    const [activeTab, setActiveTab] = useState('general');
    const [config, setConfig] = useState<ConfigState>(initialConfig);
    const [changes, setChanges] = useState<Partial<ConfigState>>({});
    const [showSaved, setShowSaved] = useState(false);

    useEffect(() => {
        // Fetch config from API here in a real app
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'number' ? Number(value) : value;
        setChanges(prev => ({...prev, [name]: val}));
    };

    const handleToggleChange = (name: keyof ConfigState, value: boolean) => {
        setChanges(prev => ({...prev, [name]: value}));
    };

    const handleSave = (e: React.FormEvent, section: string) => {
        e.preventDefault();
        // Here you would send 'changes' to your backend API to save.
        console.log(`Saving changes for section ${section}:`, changes);
        
        // Update the main config state
        setConfig(prev => ({...prev, ...changes}));
        
        // Reset changes for the next edit
        setChanges({});

        // Show "Saved!" message
        setShowSaved(true);
        setTimeout(() => setShowSaved(false), 2000);
    };

    const isDirty = Object.keys(changes).length > 0;

    const getConfigValue = (key: keyof ConfigState) => changes[key] !== undefined ? changes[key] : config[key];
    
    const renderSection = (section: string) => {
        switch (section) {
            case 'general': return (
                <div className="space-y-4">
                    <div><label className="form-label">Nom de l'application</label><input type="text" name="appName" value={getConfigValue('appName') as string} onChange={handleInputChange} className="form-input" /></div>
                    <div><label className="form-label">Devise par défaut</label><input type="text" name="defaultCurrency" value={getConfigValue('defaultCurrency') as string} onChange={handleInputChange} className="form-input" /></div>
                    <div><label className="form-label">Fuseau horaire par défaut</label><input type="text" name="defaultTimezone" value={getConfigValue('defaultTimezone') as string} onChange={handleInputChange} className="form-input" /></div>
                    <div><label className="form-label">Taille max. des fichiers (MB)</label><input type="number" name="maxUploadSize" value={getConfigValue('maxUploadSize') as number} onChange={handleInputChange} className="form-input" /></div>
                </div>
            );
            case 'security': return (
                <div className="space-y-4">
                    <div><label className="form-label">Complexité mot de passe (regex)</label><input type="text" name="passwordComplexityRegex" value={getConfigValue('passwordComplexityRegex') as string} onChange={handleInputChange} className="form-input" /></div>
                    <div><label className="form-label">Timeout session (minutes)</label><input type="number" name="sessionTimeout" value={getConfigValue('sessionTimeout') as number} onChange={handleInputChange} className="form-input" /></div>
                </div>
            );
            case 'notifications': return (
                <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-gray-600 mb-2">Serveur SMTP</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div><label className="form-label">Hôte SMTP</label><input type="text" name="smtpHost" value={getConfigValue('smtpHost') as string} onChange={handleInputChange} className="form-input" /></div>
                        <div><label className="form-label">Port SMTP</label><input type="number" name="smtpPort" value={getConfigValue('smtpPort') as number} onChange={handleInputChange} className="form-input" /></div>
                    </div>
                </div>
            );
            case 'maintenance': return (
                <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 border border-yellow-300 bg-yellow-50 rounded-lg">
                        <div>
                            <h4 className="font-semibold text-yellow-800">Activer le mode maintenance</h4>
                            <p className="text-sm text-yellow-700">Bloquera l'accès à l'application pour tous les utilisateurs sauf les développeurs.</p>
                        </div>
                        <ToggleSwitch checked={getConfigValue('maintenanceMode') as boolean} onChange={(checked) => handleToggleChange('maintenanceMode', checked)} />
                    </div>
                    <div>
                        <label className="form-label">Message de maintenance</label>
                        <textarea name="maintenanceMessage" value={getConfigValue('maintenanceMessage') as string} onChange={handleInputChange} className="form-textarea" rows={3}></textarea>
                    </div>
                </div>
            );
            default: return null;
        }
    };
    
    return (
        <>
            <PageHeader
                title="Configuration Globale"
                subtitle="Gérez les paramètres critiques de la plateforme."
                icon="fa-tools"
                gradient="from-gray-700 to-gray-900"
            />
            
            <Card title="Paramètres Système" icon="fa-sliders-h">
                <div className="tabs">
                    <button type="button" onClick={() => setActiveTab('general')} className={activeTab === 'general' ? 'active' : ''}>Général</button>
                    <button type="button" onClick={() => setActiveTab('security')} className={activeTab === 'security' ? 'active' : ''}>Sécurité</button>
                    <button type="button" onClick={() => setActiveTab('notifications')} className={activeTab === 'notifications' ? 'active' : ''}>Notifications</button>
                    <button type="button" onClick={() => setActiveTab('maintenance')} className={activeTab === 'maintenance' ? 'active' : ''}>Maintenance</button>
                </div>
                
                <form onSubmit={(e) => handleSave(e, activeTab)}>
                    <div className="p-4 min-h-[250px]">
                        {renderSection(activeTab)}
                    </div>
                    <div className="flex justify-end items-center p-4 border-t mt-4">
                        {showSaved && <span className="text-green-600 mr-4 transition-opacity duration-300">Modifications enregistrées !</span>}
                        <button type="submit" className="btn btn-primary" disabled={!isDirty}>
                            <i className="fas fa-save mr-2"></i> Enregistrer les changements
                        </button>
                    </div>
                </form>
            </Card>
        </>
    );
};
