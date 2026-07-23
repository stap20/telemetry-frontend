// cypod-telemetry
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';

// note: the dev server proxies /api to the backend instead of the app calling http://localhost:3000
// directly. That makes every request same-origin, which is what lets the session cookie work at all:
// the backend sets it `httpOnly; secure; sameSite=strict`, and a strict cookie is withheld from
// cross-site requests. Proxying also means the browser never sends a preflight, so the frontend does
// not depend on the backend's CORS allowlist being right in every environment.
export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [react(), tailwindcss()],
        resolve: {
            alias: {
                '@': fileURLToPath(new URL('./src', import.meta.url)),
            },
        },
        server: {
            port: 5173,
            proxy: {
                '/api': {
                    target: env.VITE_API_TARGET ?? 'http://localhost:3000',
                    changeOrigin: true,
                },
            },
        },
    };
});
