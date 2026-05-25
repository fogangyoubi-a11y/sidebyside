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
    // Le point initial active le wildcard sous-domaine.
    allowedHosts: ['.trycloudflare.com', '.loca.lt', '.ngrok.io', '.ngrok-free.app'],
  },
});
