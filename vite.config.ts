import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    host: true,
    port: 5173,
    // Autorise les previews via Cloudflare Tunnel (URLs *.trycloudflare.com)
    allowedHosts: ['.trycloudflare.com', '.loca.lt', '.ngrok.io', '.ngrok-free.app'],
    // Proxy : tout ce qui part en /api/* est routé vers le backend Express
    // (localhost:3000), en retirant le préfixe /api. Ainsi le frontend appelle
    // /api/auth/login et le backend reçoit /auth/login. Marche aussi via tunnel.
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api/, ''),
      },
    },
  },
});
