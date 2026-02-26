import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    const geminiApiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || '';
    const apiProxyTarget = env.VITE_API_PROXY_TARGET || 'http://127.0.0.1:8000';
    return {
      server: {
        port: 3000,
        strictPort: true,
        host: '0.0.0.0',
        proxy: {
          // Proxy only real backend API namespaces.
          // Avoid hijacking frontend source modules like /api/client.ts during Vite dev.
          '^/api/(accounts|courses|token|auth|exams|questions|attempts|certificates|notifications|certificate-requests)(/|$)': {
            target: apiProxyTarget,
            changeOrigin: true,
          },
          '^/public(/|$)': {
            target: apiProxyTarget,
            changeOrigin: true,
          },
          '/media': {
            target: apiProxyTarget,
            changeOrigin: true,
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(geminiApiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
