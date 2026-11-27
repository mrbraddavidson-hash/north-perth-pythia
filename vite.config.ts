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
      '/api/commodities': {
        target: 'https://query1.finance.yahoo.com',
        changeOrigin: true,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        },
        rewrite: (path) => path.replace(/^\/api\/commodities/, ''),
      },
      '/api/adsb': {
        target: 'https://opendata.adsb.fi',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/adsb/, '/api/v2'),
      },
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
      '/api/hpsts': {
        target: 'https://hpsts.mybusplanner.ca',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/hpsts/, ''),
      },
      // These two do their work inside Pages Functions (tile walking, RSS parsing), so in dev they use the
      // deployed functions; run `wrangler pages dev dist` to test local changes to them.
      '/api/outages': { target: 'https://north-perth-pythia.pages.dev', changeOrigin: true },
      '/api/burn-status': { target: 'https://north-perth-pythia.pages.dev', changeOrigin: true },
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
