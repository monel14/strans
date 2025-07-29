import React, { useState } from 'react';
import { useEdgeUserCreation } from '../../hooks/useEdgeUserCreation';

export const EdgeFunctionTest: React.FC = () => {
    const [testEmail, setTestEmail] = useState('test.edge@securetrans.dev');
    const [testName, setTestName] = useState('Test Edge User');
    const [testPassword, setTestPassword] = useState('password');
    const [testRole, setTestRole] = useState<'agent' | 'chef_agence' | 'sous_admin'>('agent');
    
    const { loading, error, message, createUser, clearMessages } = useEdgeUserCreation();

    const handleTest = async () => {
        clearMessages();
        
        const result = await createUser({
            name: testName,
            email: testEmail,
            password: testPassword,
            role: testRole
        });

        if (result.success) {
            alert(`✅ Succès!\nUtilisateur créé avec ID: ${result.user_id}\nIl peut maintenant se connecter normalement.`);
        } else {
            alert(`❌ Erreur: ${result.error}\nDétails: ${result.details || 'Aucun détail'}`);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md max-w-md mx-auto">
            <h2 className="text-xl font-bold mb-4 text-gray-900">
                <i className="fas fa-flask mr-2 text-blue-600"></i>
                Test Edge Function
            </h2>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nom
                    </label>
                    <input
                        type="text"
                        value={testName}
                        onChange={(e) => setTestName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
                    <input
                        type="email"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mot de passe
                    </label>
                    <input
                        type="password"
                        value={testPassword}
                        onChange={(e) => setTestPassword(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Rôle
                    </label>
                    <select
                        value={testRole}
                        onChange={(e) => setTestRole(e.target.value as any)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="agent">Agent</option>
                        <option value="chef_agence">Chef d'agence</option>
                        <option value="sous_admin">Sous-admin</option>
                    </select>
                </div>
                
                {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                        <div className="flex items-center">
                            <i className="fas fa-exclamation-triangle text-red-600 mr-2"></i>
                            <span className="text-red-700 text-sm">{error}</span>
                        </div>
                    </div>
                )}
                
                {message && (
                    <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                        <div className="flex items-center">
                            <i className="fas fa-check-circle text-green-600 mr-2"></i>
                            <span className="text-green-700 text-sm">{message}</span>
                        </div>
                    </div>
                )}
                
                <button
                    onClick={handleTest}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {loading ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                            Test en cours...
                        </>
                    ) : (
                        <>
                            <i className="fas fa-play mr-2"></i>
                            Tester Edge Function
                        </>
                    )}
                </button>
            </div>
            
            <div className="mt-4 p-3 bg-gray-50 rounded-md">
                <p className="text-xs text-gray-600">
                    <strong>Ce test va :</strong><br/>
                    1. Appeler la Edge Function create-user<br/>
                    2. Créer l'utilisateur dans auth.users<br/>
                    3. Le trigger créera automatiquement le profil<br/>
                    4. L'utilisateur pourra se connecter normalement
                </p>
            </div>
        </div>
    );
};