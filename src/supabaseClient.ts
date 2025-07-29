

import { createClient } from '@supabase/supabase-js';
import { Database } from './types/database.types';

// Récupérer les variables d'environnement (Vite ou window.process.env pour compatibilité)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || (window as any).process?.env?.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || (window as any).process?.env?.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('VOTRE_URL_SUPABASE') || supabaseAnonKey.includes('VOTRE_CLE_ANON_SUPABASE')) {
    const errorMsg = "Erreur: Clés Supabase non configurées.\n\n" +
                     "Pour le développement local: Configurez les variables dans le fichier `index.html`\n" +
                     "Pour Vercel: Configurez VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY dans les variables d'environnement\n\n" +
                     "Vous trouverez ces clés dans les paramètres de votre projet sur supabase.com > Project Settings > API.";
    
    // Display a more user-friendly message on the page itself
    const root = document.getElementById('root');
    if (root) {
        root.innerHTML = `<div style="padding: 2rem; font-family: sans-serif; background-color: #fff3f3; border: 2px solid #ff0000; margin: 2rem; border-radius: 8px;">
            <h1 style="color: #ff0000; font-size: 1.5rem;">Erreur de Configuration</h1>
            <pre style="white-space: pre-wrap; word-wrap: break-word; font-size: 1rem;">${errorMsg}</pre>
            <div style="margin-top: 1rem; padding: 1rem; background-color: #f8f9fa; border-radius: 4px;">
                <p style="margin: 0; font-family: monospace;">URL Supabase: ${supabaseUrl || 'Non définie'}</p>
                <p style="margin: 0; font-family: monospace;">Clé Anon: ${supabaseAnonKey ? '****' + supabaseAnonKey.slice(-4) : 'Non définie'}</p>
            </div>
        </div>`;
    }
    
    throw new Error(errorMsg);
}

// Utilise le générique Database pour une auto-complétion et une sécurité de type complètes.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    db: {
        schema: 'public',
    },
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
    }
});