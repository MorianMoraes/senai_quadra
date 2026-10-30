import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local or the deploy environment.');
}

export const supabase = createClient(supabaseUrl, supabasePublishableKey);

export async function testarConexaoSupabase(): Promise<void> {
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
