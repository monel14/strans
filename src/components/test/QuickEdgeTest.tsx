import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

export const QuickEdgeTest: React.FC = () => {
    const [result, setResult] = useState<string>('');
    const [loading, setLoading] = useState(false);

    const testEdgeFunction = async () => {
        setLoading(true);
        setResult('');

        try {
            console.log('Test de la Edge Function create-user...');
            
            const timestamp = Date.now();
            const testData = {
                name: `Test Quick User ${timestamp}`,
                email: `test.quick.${timestamp}@securetrans.dev`,
                password: 'password',
                role: 'agent'
            };

            console.log('Données de test:', testData);

            const { data, error } = await supabase.functions.invoke('create-user', {
                body: JSON.stringify(testData)
            });

            console.log('Réponse Edge Function:', { data, error });

            if (error) {
                setResult(`❌ Erreur Edge Function: ${error.message}`);
                return;
            }

            if (data.error) {
                setResult(`❌ Erreur dans la réponse: ${data.error}\nDétails: ${data.details || 'Aucun'}`);
                return;
            }

            if (data.success && data.user) {
                setResult(`✅ Succès!\nUtilisateur créé: ${data.user.id}\nEmail: ${data.user.email}\nIl peut maintenant se connecter avec le mot de passe: password`);
                
                // Vérifier dans la base de données
                setTimeout(async () => {
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', data.user.id)
                        .single();
                    
                    console.log('Profil créé:', profile);
                }, 1000);
            } else {
                setResult(`⚠️ Réponse inattendue: ${JSON.stringify(data)}`);
            }

        } catch (err: any) {
            console.error('Erreur test:', err);
            setResult(`❌ Erreur inattendue: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const testOrphanList = async () => {
        setLoading(true);
        setResult('');

        try {
            console.log('Test de listage des orphelins...');

            const { data, error } = await supabase.functions.invoke('migrate-orphan-users-v2', {
                body: JSON.stringify({ action: 'list_orphans' })
            });

            console.log('Réponse orphelins:', { data, error });

            if (error) {
                setResult(`❌ Erreur: ${error.message}`);
                return;
            }

            if (data.error) {
                setResult(`❌ Erreur dans la réponse: ${data.error}`);
                return;
            }

            const orphans = data.orphans || [];
            setResult(`📋 Orphelins trouvés: ${orphans.length}\n\n${orphans.map((o: any) => `• ${o.name} (${o.email}) - ${o.role}`).join('\n')}`);

        } catch (err: any) {
            console.error('Erreur test orphelins:', err);
            setResult(`❌ Erreur: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const testMigrateFirst = async () => {
        setLoading(true);
        setResult('');

        try {
            console.log('Test de migration du premier orphelin...');

            // D'abord lister les orphelins
            const { data: listData, error: listError } = await supabase.functions.invoke('migrate-orphan-users-v2', {
                body: JSON.stringify({ action: 'list_orphans' })
            });

            if (listError || listData.error) {
                setResult(`❌ Erreur lors du listage: ${listError?.message || listData.error}`);
                return;
            }

            const orphans = listData.orphans || [];
            if (orphans.length === 0) {
                setResult(`ℹ️ Aucun orphelin à migrer`);
                return;
            }

            const firstOrphan = orphans[0];
            console.log('Migration de:', firstOrphan.email);

            // Migrer le premier orphelin
            const { data: migrateData, error: migrateError } = await supabase.functions.invoke('migrate-orphan-users-v2', {
                body: JSON.stringify({ 
                    action: 'migrate',
                    email: firstOrphan.email
                })
            });

            console.log('Réponse migration:', { migrateData, migrateError });

            if (migrateError) {
                setResult(`❌ Erreur migration: ${migrateError.message}`);
                return;
            }

            if (migrateData.error) {
                setResult(`❌ Erreur dans la réponse: ${migrateData.error}`);
                return;
            }

            if (migrateData.success) {
                setResult(`✅ Migration réussie!\n\nUtilisateur: ${migrateData.email}\nNouveau ID: ${migrateData.user_id}\nMot de passe temporaire: ${migrateData.temp_password}\n\nL'utilisateur peut maintenant se connecter!`);
            } else {
                setResult(`⚠️ Réponse inattendue: ${JSON.stringify(migrateData)}`);
            }

        } catch (err: any) {
            console.error('Erreur test migration:', err);
            setResult(`❌ Erreur: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-4 bg-white rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">🧪 Test Rapide Edge Functions</h3>
            
            <div className="space-y-3 mb-4">
                <button
                    onClick={testEdgeFunction}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                    {loading ? '⏳ Test en cours...' : '🚀 Tester create-user'}
                </button>
                
                <button
                    onClick={testOrphanList}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50"
                >
                    {loading ? '⏳ Test en cours...' : '📋 Lister les orphelins'}
                </button>
                
                <button
                    onClick={testMigrateFirst}
                    disabled={loading}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                    {loading ? '⏳ Test en cours...' : '🔄 Migrer le premier orphelin'}
                </button>
            </div>

            {result && (
                <div className="p-3 bg-gray-100 rounded-md">
                    <pre className="text-sm whitespace-pre-wrap">{result}</pre>
                </div>
            )}
        </div>
    );
};