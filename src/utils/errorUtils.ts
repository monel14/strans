import { PostgrestError } from '@supabase/supabase-js';

export interface AppError {
    context: string;
    message: string;
    details?: string | null;
    hint?: string | null;
    code?: string | null;
}

export const showError = (error: AppError) => {
    let fullMessage = `Erreur : ${error.context}\n\n`;
    fullMessage += `Message : ${error.message}\n`;
    if (error.details) fullMessage += `Détails : ${error.details}\n`;
    if (error.hint) fullMessage += `Suggestion : ${error.hint}\n`;
    if (error.code) fullMessage += `Code d'erreur : ${error.code}\n`;
    
    console.error(fullMessage);
};

export const handleSupabaseError = (error: PostgrestError | { message: string; details?: string | null; hint?: string | null; code?: string | null; } | null, context: string) => {
    if (!error) return;

    // Specific check for the schema query error, which is often an RLS issue.
    if (error.message.includes("Database error querying schema")) {
        const schemaError: AppError = {
            context: context,
            message: "Impossible de lire la structure (le schéma) de la base de données.",
            details: "Cette erreur se produit souvent lorsque les permissions sur la base de données sont incorrectes pour le rôle 'anon'.",
            hint: "Veuillez vérifier que le rôle 'anon' a bien les droits USAGE sur le schéma 'public' et les droits SELECT sur les tables nécessaires. Consultez la documentation Supabase sur les politiques RLS (Row Level Security).",
            code: error.code || 'schema-permission-error',
        };
        console.error(`Supabase Schema Error [${context}]:`, error);
        showError(schemaError);
        return;
    }

    const appError: AppError = {
        context,
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
    };
    
    console.error(`Supabase Error [${context}]:`, error);
    showError(appError);
};

export const handleGenericError = (error: any, context: string) => {
    console.error(`Generic Error [${context}]:`, error);
    if (error instanceof Error) {
        showError({ context, message: error.message });
    } else {
        showError({ context, message: "Une erreur inattendue est survenue." });
    }
}