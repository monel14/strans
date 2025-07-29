import { supabase } from '../supabaseClient';

/**
 * @deprecated Storage initialization is now handled via database migrations.
 * The `initializeStorageBuckets` function has been removed as it cannot be run from the client
 * with an anonymous key. Please refer to SECTION 5 in `supabase/migrations/001_notifications_logic.md`.
 */

/**
 * Checks if the required storage buckets ('proofs', 'attachments') exist.
 * This may fail if RLS policies on `storage.buckets` are not permissive enough for the current user role.
 * @returns {Promise<boolean>} True if buckets seem to exist, false otherwise.
 */
export const checkStorageBuckets = async (): Promise<boolean> => {
  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error("Erreur lors de la vérification des buckets (probablement un problème de RLS sur `storage.buckets`):", error.message);
      return false;
    }

    const existingNames = buckets.map(b => b.name);
    const requiredBuckets = ['proofs', 'attachments'];
    
    const allExist = requiredBuckets.every(name => existingNames.includes(name));
    if (!allExist) {
        console.warn('Buckets manquants:', requiredBuckets.filter(name => !existingNames.includes(name)));
    } else {
        console.log('Vérification des buckets réussie, tous les buckets requis sont présents.');
    }
    return allExist;

  } catch (error) {
    console.error("Erreur inattendue lors de la vérification des buckets:", error);
    return false;
  }
};
