import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Configure as variáveis do Supabase no .env.local')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

export async function testarConexaoSupabase() {
  const { data, error } = await supabase.auth.getUser()

  if (error?.message === 'Auth session missing!') {
    console.log('Supabase acessível! Nenhum usuário está logado.')
    return
  }

  if (error) {
    console.error('Erro na conexão com Supabase:', error.message)
    return
  }

  console.log('Conexão funcionando!', data.user?.id)
}