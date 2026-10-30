import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
  const appScope = isGitHubPages ? '/senai_quadra/' : '/';

  if (process.env.VERCEL === '1' && (!supabaseUrl || !supabasePublishableKey)) {
    throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no ambiente da Vercel.');
  }

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'SENAI Quadra',
          short_name: 'SENAI Quadra',
          description: 'Organize jogos, equipes e campeonatos do SENAI.',
          lang: 'pt-BR',
          start_url: appScope,
          scope: appScope,
          display: 'standalone',
          theme_color: '#10171b',
          background_color: '#10171b',
          icons: [
            { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
          ],
        },
        includeAssets: ['apple-touch-icon.png'],
        workbox: {
          cleanupOutdatedCaches: true,
          clientsClaim: true,
          skipWaiting: true,
          runtimeCaching: [],
        },
      }),
    ],
    base: isGitHubPages ? appScope : './',
    test: { include: ['src/**/*.test.ts'] },
  };
});
