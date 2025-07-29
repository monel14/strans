import React, { useState } from 'react';
import { PageComponentProps, User, Agent, ChefAgence } from '../../types';
import { Card } from '../../components/common/Card';
import { formatAmount } from '../../utils/formatters';

interface UserProfilePageProps extends PageComponentProps {
    onUpdateUser: (user: User) => void;
}

export const UserProfilePage: React.FC<UserProfilePageProps> = ({ user, onUpdateUser }) => {
    const [name, setName] = useState(user.name);
    const [email] = useState(user.email); // Email is not editable for this example
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handleProfileSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onUpdateUser({ ...user, name });
        console.log('Profil mis à jour !');
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            console.warn('Les nouveaux mots de passe ne correspondent pas.');
            return;
        }
        if (newPassword.length < 8) {
             console.warn('Le nouveau mot de passe doit contenir au moins 8 caractères.');
            return;
        }
        console.log('Mot de passe changé avec succès ! (Simulation)');
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
    };

    const renderRoleSpecificInfo = () => {
        if (user.role === 'agent') {
            const agent = user as Agent;
            return (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="font-semibold text-lg text-gray-700 dark:text-gray-200">Informations Agent</h4>
                    <p>Solde: <span className="font-bold">{formatAmount(agent.solde || 0)}</span></p>
                </div>
            );
        }
        if (user.role === 'chef_agence') {
            const chef = user as ChefAgence;
            return (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-slate-800 rounded-lg">
                    <h4 className="font-semibold text-lg text-gray-700 dark:text-gray-200">Informations Chef d'Agence</h4>
                    <p>Solde Opérationnel: <span className="font-bold">{formatAmount(chef.solde || 0)}</span></p>
                    <p>Commissions Dues: <span className="font-bold">{formatAmount(chef.commissions_dues || 0)}</span></p>
                </div>
            );
        }
        return null;
    };


    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">Mon Profil</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card title="Informations Personnelles" icon="fa-user-edit">
                    <form onSubmit={handleProfileSubmit}>
                        <div className="mb-4">
                            <label className="form-label">Nom Complet</label>
                            <input type="text" className="form-input" value={name} onChange={e => setName(e.target.value)} />
                        </div>
                        <div className="mb-4">
                            <label className="form-label">Adresse Email (non modifiable)</label>
                            <input type="email" className="form-input bg-gray-100 dark:bg-gray-700" value={email} readOnly />
                        </div>
                         <div className="mb-4">
                            <label className="form-label">Rôle</label>
                            <input type="text" className="form-input bg-gray-100 dark:bg-gray-700 capitalize" value={user.role.replace(/_/g, ' ')} readOnly />
                        </div>
                        <button type="submit" className="btn btn-primary w-full">Enregistrer les modifications</button>
                    </form>
                    {renderRoleSpecificInfo()}
                </Card>

                <Card title="Changer le Mot de Passe" icon="fa-key">
                    <form onSubmit={handlePasswordSubmit}>
                        <div className="mb-4">
                            <label className="form-label">Ancien mot de passe</label>
                            <input type="password" value={oldPassword} onChange={e => setOldPassword(e.target.value)} className="form-input" />
                        </div>
                        <div className="mb-4">
                            <label className="form-label">Nouveau mot de passe</label>
                            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="form-input" />
                        </div>
                         <div className="mb-4">
                            <label className="form-label">Confirmer le nouveau mot de passe</label>
                            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="form-input" />
                        </div>
                        <button type="submit" className="btn btn-primary w-full">Changer le mot de passe</button>
                    </form>
                </Card>
            </div>
        </div>
    );
};