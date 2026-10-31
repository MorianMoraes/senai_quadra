import { describe, expect, it } from 'vitest';
import { getSupabaseConfigurationError } from './supabaseConfig';

describe('configuração do Supabase', () => {
  it('explica quais variáveis devem ser definidas sem interromper o build', () => {
    expect(getSupabaseConfigurationError(undefined, undefined)).toContain('VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY');
  });

  it('recusa uma URL inválida com uma mensagem compreensível', () => {
    expect(getSupabaseConfigurationError('not-a-url', 'sb_publishable_example')).toContain('URL HTTP ou HTTPS válida');
  });

  it('aceita URL HTTP(S) e uma chave publicável não vazia', () => {
    expect(getSupabaseConfigurationError('https://example.supabase.co', 'sb_publishable_example')).toBeNull();
  });
});
