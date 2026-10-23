import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api/opensky': {
        target: 'https://opensky-network.org',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/opensky/, '/api'),
      },
      '/api/wateroffice': {
        target: 'https://dd.weather.gc.ca',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/wateroffice/, '/today/hydrometric'),
      },
      '/api/511': {
        target: 'https://511on.ca',
        changeOrigin: true,
        headers: {
          Referer: 'https://511on.ca/',
        },
        rewrite: (path) => path.replace(/^\/api\/511/, ''),
      },
    },
  },
});
