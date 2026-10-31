import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { supabaseConfigurationError } from './supabaseConfig';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase: SupabaseClient | null = supabaseConfigurationError
  ? null
  : createClient(supabaseUrl!, supabasePublishableKey!);

export async function testarConexaoSupabase(): Promise<void> {
  if (!supabase) return;

  try {
    const { error } = await supabase.auth.getUser();

    if (error?.message === 'Auth session missing!') {
      console.info('No active Supabase session.');
      return;
    }

    if (error) {
      console.error('Could not query the Supabase session:', error.message);
      return;
    }

    console.info('Supabase session queried.');
  } catch (error) {
    console.error('Could not query the Supabase session:', error instanceof Error ? error.message : 'unknown error');
  }
}
