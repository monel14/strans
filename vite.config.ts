
import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve('.')
        }
    },
    server: {
        host: '0.0.0.0',
        port: 3001,
        strictPort: false,
        hmr: {
            overlay: true
        }
    },
    build: {
        sourcemap: true,
        rollupOptions: {
            input: {
                main: path.resolve('index.html')
            }
        }
    },
    optimizeDeps: {
        include: ['react', 'react-dom', '@supabase/supabase-js']
    }
});