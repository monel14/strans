import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';

export const TestOperationTypesStatus: React.FC = () => {
    const [testResults, setTestResults] = useState<string[]>([]);
    const [isRunning, setIsRunning] = useState(false);

    const addResult = (message: string) => {
        setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    };

    const runTests = async () => {
        setIsRunning(true);
        setTestResults([]);
        
        try {
            addResult('🚀 Début des tests du système de statuts...');

            // Test 1: Vérifier la fonction get_operation_types_with_stats
            addResult('📊 Test 1: Récupération des types avec statistiques...');
            const { data: typesData, error: typesError } = await supabase
                .rpc('get_operation_types_with_stats');
            
            if (typesError) {
                addResult(`❌ Erreur: ${typesError.message}`);
            } else {
                addResult(`✅ ${typesData?.length || 0} types d'opération récupérés avec statistiques`);
            }

            // Test 2: Tester le changement de statut
            if (typesData && typesData.length > 0) {
                const testType = typesData[0];
                addResult(`🔄 Test 2: Changement de statut pour "${testType.name}"...`);
                
                const newStatus = testType.status === 'active' ? 'inactive' : 'active';
                const { data: changeResult, error: changeError } = await supabase
                    .rpc('change_operation_type_status', {
                        op_type_id: testType.id,
                        new_status: newStatus,
                        reason: 'Test automatique du système',
                        changed_by: null
                    });

                if (changeError) {
                    addResult(`❌ Erreur changement: ${changeError.message}`);
                } else if (changeResult?.success) {
                    addResult(`✅ Statut changé: ${changeResult.message}`);
                    
                    // Remettre le statut original
                    await supabase.rpc('change_operation_type_status', {
                        op_type_id: testType.id,
                        new_status: testType.status,
                        reason: 'Restauration après test',
                        changed_by: null
                    });
                    addResult(`🔄 Statut restauré à l'original`);
                } else {
                    addResult(`❌ Échec: ${changeResult?.error || 'Erreur inconnue'}`);
                }
            }

            // Test 3: Vérifier la fonction can_delete_operation_type
            if (typesData && typesData.length > 0) {
                const testType = typesData[0];
                addResult(`🗑️ Test 3: Vérification suppression pour "${testType.name}"...`);
                
                const { data: canDelete, error: deleteError } = await supabase
                    .rpc('can_delete_operation_type', { op_type_id: testType.id });

                if (deleteError) {
                    addResult(`❌ Erreur vérification: ${deleteError.message}`);
                } else {
                    addResult(`✅ Peut être supprimé: ${canDelete ? 'Oui' : 'Non'}`);
                }
            }

            // Test 4: Vérifier les statistiques
            if (typesData && typesData.length > 0) {
                const testType = typesData[0];
                addResult(`📈 Test 4: Statistiques pour "${testType.name}"...`);
                
                const { data: stats, error: statsError } = await supabase
                    .rpc('get_operation_type_stats', { op_type_id: testType.id });

                if (statsError) {
                    addResult(`❌ Erreur stats: ${statsError.message}`);
                } else {
                    addResult(`✅ Stats: ${stats?.total_transactions || 0} transactions, ${stats?.total_amount || 0} XOF`);
                }
            }

            addResult('🎉 Tests terminés avec succès !');
        } catch (error) {
            addResult(`💥 Erreur générale: ${error}`);
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    Test du Système de Statuts
                </h3>
                <button
                    onClick={runTests}
                    disabled={isRunning}
                    className={`px-4 py-2 rounded-md text-white font-medium ${
                        isRunning 
                            ? 'bg-gray-400 cursor-not-allowed' 
                            : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                >
                    {isRunning ? (
                        <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                            Tests en cours...
                        </>
                    ) : (
                        '🧪 Lancer les tests'
                    )}
                </button>
            </div>

            <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-4 max-h-96 overflow-y-auto">
                {testResults.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400 italic">
                        Cliquez sur "Lancer les tests" pour vérifier le système
                    </p>
                ) : (
                    <div className="space-y-1 font-mono text-sm">
                        {testResults.map((result, index) => (
                            <div key={index} className="text-gray-700 dark:text-gray-300">
                                {result}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};