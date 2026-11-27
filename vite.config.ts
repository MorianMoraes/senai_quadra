import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  const isGitHubPages = process.env.GITHUB_ACTIONS === 'true';
  const appScope = isGitHubPages ? '/senai_quadra/' : '/';

  return {
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: {
          name: 'Jogos do SESI + Saúde',
          short_name: 'Jogos SESI',
          description: 'Organize jogos, equipes e campeonatos dos Jogos do SESI + Saúde.',
          lang: 'pt-BR',
          start_url: appScope,
          scope: appScope,
          display: 'standalone',
          theme_color: '#6339bd',
          background_color: '#f3f5f4',
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
    build: { emptyOutDir: true },
    test: { include: ['src/**/*.test.ts'] },
  };
});
