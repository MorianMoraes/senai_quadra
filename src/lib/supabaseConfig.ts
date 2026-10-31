export function getSupabaseConfigurationError(url: string | undefined, publishableKey: string | undefined): string | null {
  const missing: string[] = [];
  if (!url?.trim()) missing.push('VITE_SUPABASE_URL');
  if (!publishableKey?.trim()) missing.push('VITE_SUPABASE_PUBLISHABLE_KEY');
  if (missing.length) return `Configure ${missing.join(' e ')} para habilitar a conexão com o Supabase.`;

  try {
    const parsed = new URL(url!);
    if (!['http:', 'https:'].includes(parsed.protocol) || !parsed.hostname) {
      return 'VITE_SUPABASE_URL precisa ser uma URL HTTP ou HTTPS válida.';
    }
  } catch {
    return 'VITE_SUPABASE_URL precisa ser uma URL HTTP ou HTTPS válida.';
  }

  return null;
}

export const supabaseConfigurationError = getSupabaseConfigurationError(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);
