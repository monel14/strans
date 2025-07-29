import { useState } from 'react';
import { supabase } from '../supabaseClient';

export interface OrphanUser {
    id: string;
    email: string;
    name: string;
    role: string;
    created_at: string;
}

export interface MigrationResult {
    success: boolean;
    user_id?: string;
    temp_password?: string;
    email?: string;
    error?: string;
}

export const useOrphanMigration = () => {
    const [loading, setLoading] = useState(false);
    const [orphans, setOrphans] = useState<OrphanUser[]>([]);
    const [error, setError] = useState<string | null>(null);

    const listOrphans = async (): Promise<OrphanUser[]> => {
        setLoading(true);
        setError(null);

        try {
            const { data, error: functionError } = await supabase.functions.invoke('migrate-orphan-users-v2', {
                body: JSON.stringify({ action: 'list_orphans' })
            });

            if (functionError) {
                setError(functionError.message);
                return [];
            }

            if (data.error) {
                setError(data.error);
                return [];
            }

            setOrphans(data.orphans || []);
            return data.orphans || [];

        } catch (err: any) {
            setError(err.message);
            return [];
        } finally {
            setLoading(false);
        }
    };

    const migrateUser = async (email: string): Promise<MigrationResult> => {
        setLoading(true);
        setError(null);

        try {
            const { data, error: functionError } = await supabase.functions.invoke('migrate-orphan-users-v2', {
                body: JSON.stringify({ 
                    action: 'migrate',
                    email: email
                })
            });

            if (functionError) {
                setError(functionError.message);
                return { success: false, error: functionError.message };
            }

            if (data.error) {
                setError(data.error);
                return { success: false, error: data.error };
            }

            // Rafraîchir la liste des orphelins
            await listOrphans();

            return {
                success: true,
                user_id: data.user_id,
                temp_password: data.temp_password,
                email: data.email
            };

        } catch (err: any) {
            setError(err.message);
            return { success: false, error: err.message };
        } finally {
            setLoading(false);
        }
    };

    const migrateAllOrphans = async (): Promise<MigrationResult[]> => {
        const results: MigrationResult[] = [];
        
        for (const orphan of orphans) {
            const result = await migrateUser(orphan.email);
            results.push(result);
            
            // Attendre un peu entre chaque migration
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        return results;
    };

    return {
        loading,
        orphans,
        error,
        listOrphans,
        migrateUser,
        migrateAllOrphans
    };
};