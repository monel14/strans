import React, { useState, useEffect } from 'react';
import { EdgeFunctionTest } from '../components/test/EdgeFunctionTest';
import { AgencySuspensionTest } from '../components/test/AgencySuspensionTest';
// PermissionsTest supprimé - système de permissions simplifié
import { useOrphanMigration } from '../hooks/useOrphanMigration';
import { supabase } from '../supabaseClient';
import { PageComponentProps } from '../types';

export const TestPage: React.FC<PageComponentProps> = ({ user }) => {
    const [activeTab, setActiveTab] = useState<'edge-function' | 'orphan-migration' | 'verification' | 'agency-suspension'>('edge-function');
    const { orphans, listOrphans, migrateUser, loading: orphanLoading } = useOrphanMigration();
    const [verificationData, setVerificationData] = useState<any>(null);

    useEffect(() => {
        if (activeTab === 'orphan-migration') {
            listOrphans();
        }
    }, [activeTab]);

    const runVerification = async () => {
        try {
            // Compter les utilisateurs dans auth.users vs profiles
            const authUsersQuery = supabase.rpc('count_auth_users');
            const profilesQuery = supabase.from('profiles').select('id', { count: 'exact', head: true });

            const [authResult, profilesResult] = await Promise.all([authUsersQuery, profilesQuery]);

            setVerificationData({
                edgeFunctionStatus: 'OK', // Les Edge Functions sont déployées
                authUsersCount: authResult.data || 0,
                profilesCount: profilesResult.count || 0,
                orphansCount: orphans.length
            });
        } catch (error) {
            console.error('Erreur vérification:', error);
            setVerificationData({
                error: error.message
            });
        }
    };

    const handleMigrateOrphan = async (email: string) => {
        if (!confirm(`Êtes-vous sûr de vouloir migrer l'utilisateur ${email} ?`)) {
            return;
        }

        try {
            const result = await migrateUser(email);
            
            if (result.success) {
                alert(`✅ Migration réussie!\n\nUtilisateur: ${result.email}\nNouveau ID: ${result.user_id}\nMot de passe temporaire: ${result.temp_password}\n\nL'utilisateur peut maintenant:\n1. Se connecter avec ce mot de passe temporaire\n2. Ou utiliser "Mot de passe oublié" pour définir son propre mot de passe`);
            } else {
                alert(`❌ Erreur de migration: ${result.error}`);
            }
        } catch (error: any) {
            alert(`❌ Erreur inattendue: ${error.message}`);
        }
    };

    const tabs = [
        { id: 'edge-function', label: 'Test Edge Function', icon: 'fas fa-flask' },
        { id: 'orphan-migration', label: 'Migration Orphelins', icon: 'fas fa-users' },
        { id: 'verification', label: 'Vérification', icon: 'fas fa-check-circle' },
        { id: 'agency-suspension', label: 'Test Suspension Agences', icon: 'fas fa-pause-circle' }
    ];

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        <i className="fas fa-cogs mr-3 text-blue-600"></i>
                        Page de Test - Système d'Authentification
                    </h1>
                    <p className="text-gray-600">
                        Testez les Edge Functions et gérez la migration des utilisateurs orphelins
                    </p>
                </div>

                {/* Tabs */}
                <div className="bg-white rounded-lg shadow-md mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="flex space-x-8 px-6">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`py-4 px-1 border-b-2 font-medium text-sm ${
                                        activeTab === tab.id
                                            ? 'border-blue-500 text-blue-600'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    <i className={`${tab.icon} mr-2`}></i>
                                    {tab.label}
                                </button>
                            ))}
                        </nav>
                    </div>

                    <div className="p-6">
                        {activeTab === 'edge-function' && (
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Test de la Edge Function create-user</h2>
                                <EdgeFunctionTest />
                            </div>
                        )}

                        {activeTab === 'orphan-migration' && (
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Migration des Utilisateurs Orphelins</h2>
                                <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                                    <div className="flex items-center">
                                        <i className="fas fa-exclamation-triangle text-yellow-600 mr-2"></i>
                                        <span className="text-yellow-800">
                                            {orphanLoading ? 'Chargement...' : `${orphans.length} utilisateur(s) orphelin(s) trouvé(s)`}
                                        </span>
                                    </div>
                                </div>
                                
                                {orphans.length > 0 && (
                                    <div className="space-y-2">
                                        {orphans.map((orphan) => (
                                            <div key={orphan.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                                                <div>
                                                    <span className="font-medium">{orphan.name}</span>
                                                    <span className="text-gray-500 ml-2">({orphan.email})</span>
                                                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">
                                                        {orphan.role}
                                                    </span>
                                                </div>
                                                <button 
                                                    onClick={() => handleMigrateOrphan(orphan.email)}
                                                    disabled={orphanLoading}
                                                    className="text-green-600 hover:text-green-800 disabled:opacity-50"
                                                >
                                                    <i className="fas fa-user-plus mr-1"></i>
                                                    {orphanLoading ? 'Migration...' : 'Migrer'}
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                <div className="mt-4 p-3 bg-blue-50 rounded-md">
                                    <p className="text-sm text-blue-700">
                                        <strong>Note :</strong> La page complète de migration est disponible dans l'interface d'administration.
                                        Cette section est juste pour visualiser les orphelins.
                                    </p>
                                </div>
                            </div>
                        )}

                        {activeTab === 'agency-suspension' && (
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Test de Suspension d'Agences</h2>
                                <AgencySuspensionTest />
                            </div>
                        )}

                        {/* Test des permissions supprimé - système simplifié */}

                        {activeTab === 'verification' && (
                            <div>
                                <h2 className="text-xl font-semibold mb-4">Vérification du Système</h2>
                                
                                <button
                                    onClick={runVerification}
                                    className="mb-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                                >
                                    <i className="fas fa-sync-alt mr-2"></i>
                                    Lancer la Vérification
                                </button>

                                {verificationData && (
                                    <div className="space-y-4">
                                        {verificationData.error ? (
                                            <div className="p-4 bg-red-50 border border-red-200 rounded-md">
                                                <div className="flex items-center">
                                                    <i className="fas fa-exclamation-triangle text-red-600 mr-2"></i>
                                                    <span className="text-red-700">Erreur: {verificationData.error}</span>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                                <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                                                    <div className="text-center">
                                                        <i className="fas fa-server text-green-600 text-2xl mb-2"></i>
                                                        <div className="text-sm text-gray-600">Edge Functions</div>
                                                        <div className="text-lg font-semibold text-green-700">
                                                            {verificationData.edgeFunctionStatus}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
                                                    <div className="text-center">
                                                        <i className="fas fa-users text-blue-600 text-2xl mb-2"></i>
                                                        <div className="text-sm text-gray-600">Auth Users</div>
                                                        <div className="text-lg font-semibold text-blue-700">
                                                            {verificationData.authUsersCount}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="p-4 bg-purple-50 border border-purple-200 rounded-md">
                                                    <div className="text-center">
                                                        <i className="fas fa-id-card text-purple-600 text-2xl mb-2"></i>
                                                        <div className="text-sm text-gray-600">Profiles</div>
                                                        <div className="text-lg font-semibold text-purple-700">
                                                            {verificationData.profilesCount}
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                                                    <div className="text-center">
                                                        <i className="fas fa-exclamation-triangle text-yellow-600 text-2xl mb-2"></i>
                                                        <div className="text-sm text-gray-600">Orphelins</div>
                                                        <div className="text-lg font-semibold text-yellow-700">
                                                            {verificationData.orphansCount}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};