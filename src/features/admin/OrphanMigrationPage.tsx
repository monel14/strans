import React, { useEffect, useState } from 'react';
import { useOrphanMigration, OrphanUser, MigrationResult } from '../../hooks/useOrphanMigration';

export const OrphanMigrationPage: React.FC = () => {
    const { loading, orphans, error, listOrphans, migrateUser, migrateAllOrphans } = useOrphanMigration();
    const [migrationResults, setMigrationResults] = useState<MigrationResult[]>([]);
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        listOrphans();
    }, []);

    const handleMigrateUser = async (email: string) => {
        const result = await migrateUser(email);
        
        if (result.success) {
            alert(`Utilisateur ${email} migré avec succès!\nMot de passe temporaire: ${result.temp_password}\n\nL'utilisateur peut maintenant utiliser "Mot de passe oublié" pour définir son propre mot de passe.`);
        } else {
            alert(`Erreur lors de la migration de ${email}: ${result.error}`);
        }
    };

    const handleMigrateAll = async () => {
        if (!confirm(`Êtes-vous sûr de vouloir migrer tous les ${orphans.length} utilisateurs orphelins?`)) {
            return;
        }

        const results = await migrateAllOrphans();
        setMigrationResults(results);
        setShowResults(true);
    };

    return (
        <div className="p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Migration des Utilisateurs Orphelins</h1>
                <p className="text-gray-600">
                    Les utilisateurs orphelins sont des profils qui existent dans la table `profiles` mais pas dans `auth.users`. 
                    Ils ne peuvent pas se connecter et doivent être migrés.
                </p>
            </div>

            {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                    <div className="flex items-center">
                        <i className="fas fa-exclamation-triangle text-red-600 mr-2"></i>
                        <span className="text-red-700">{error}</span>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-lg shadow-md">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Utilisateurs Orphelins ({orphans.length})
                    </h2>
                    <div className="flex gap-2">
                        <button
                            onClick={listOrphans}
                            disabled={loading}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                                    Actualisation...
                                </>
                            ) : (
                                <>
                                    <i className="fas fa-sync-alt mr-2"></i>
                                    Actualiser
                                </>
                            )}
                        </button>
                        {orphans.length > 0 && (
                            <button
                                onClick={handleMigrateAll}
                                disabled={loading}
                                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                            >
                                <i className="fas fa-users mr-2"></i>
                                Migrer Tous
                            </button>
                        )}
                    </div>
                </div>

                <div className="p-4">
                    {orphans.length === 0 ? (
                        <div className="text-center py-8">
                            <i className="fas fa-check-circle text-green-500 text-4xl mb-4"></i>
                            <p className="text-gray-600">Aucun utilisateur orphelin trouvé!</p>
                            <p className="text-sm text-gray-500 mt-2">
                                Tous les profils ont un compte d'authentification correspondant.
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Utilisateur
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Rôle
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Créé le
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {orphans.map((orphan) => (
                                        <tr key={orphan.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="flex-shrink-0 h-10 w-10">
                                                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                                            <span className="text-sm font-medium text-gray-700">
                                                                {orphan.name.slice(0, 2).toUpperCase()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="ml-4">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {orphan.name}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {orphan.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                                    {orphan.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {new Date(orphan.created_at).toLocaleDateString('fr-FR')}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => handleMigrateUser(orphan.email)}
                                                    disabled={loading}
                                                    className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                                >
                                                    <i className="fas fa-user-plus mr-1"></i>
                                                    Migrer
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Résultats de migration en lot */}
            {showResults && (
                <div className="mt-6 bg-white rounded-lg shadow-md">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Résultats de Migration
                        </h2>
                        <button
                            onClick={() => setShowResults(false)}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <i className="fas fa-times"></i>
                        </button>
                    </div>
                    <div className="p-4">
                        <div className="space-y-2">
                            {migrationResults.map((result, index) => (
                                <div
                                    key={index}
                                    className={`p-3 rounded-md ${
                                        result.success 
                                            ? 'bg-green-50 border border-green-200' 
                                            : 'bg-red-50 border border-red-200'
                                    }`}
                                >
                                    <div className="flex items-center">
                                        <i className={`fas ${
                                            result.success ? 'fa-check-circle text-green-600' : 'fa-exclamation-triangle text-red-600'
                                        } mr-2`}></i>
                                        <span className={result.success ? 'text-green-700' : 'text-red-700'}>
                                            {result.success 
                                                ? `${result.email} - Migré avec succès (Mot de passe: ${result.temp_password})`
                                                : `${result.email} - Erreur: ${result.error}`
                                            }
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
                <h3 className="text-sm font-medium text-blue-900 mb-2">
                    <i className="fas fa-info-circle mr-2"></i>
                    Instructions après migration
                </h3>
                <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Les utilisateurs migrés recevront un mot de passe temporaire</li>
                    <li>• Ils peuvent utiliser "Mot de passe oublié" pour définir leur propre mot de passe</li>
                    <li>• Toutes les données liées (transactions, requêtes) sont automatiquement mises à jour</li>
                    <li>• Les anciens profils orphelins sont supprimés après migration réussie</li>
                </ul>
            </div>
        </div>
    );
};