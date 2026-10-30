import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const supabaseUrl = process.env.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL;
  const supabasePublishableKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (process.env.VERCEL === '1' && (!supabaseUrl || !supabasePublishableKey)) {
    throw new Error('Configure VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY no ambiente da Vercel.');
  }

  return {
    plugins: [react()],
    base: process.env.GITHUB_ACTIONS === 'true' ? '/senai_quadra/' : './',
    test: { include: ['src/**/*.test.ts'] },
  };
});
