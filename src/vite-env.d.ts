/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_SUPABASE_URL: string;
    readonly VITE_SUPABASE_ANON_KEY: string;
    // Ajoutez d'autres variables d'environnement ici si nécessaire
}

interface ImportMeta {
    readonly env: ImportMetaEnv;
}