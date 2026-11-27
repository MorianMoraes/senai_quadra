import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
  if (request.method !== 'POST') return respond({ error: 'Método inválido.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const resendKey = Deno.env.get('RESEND_API_KEY');
  const fromEmail = Deno.env.get('APPROVAL_FROM_EMAIL');
  if (!supabaseUrl || !anonKey || !serviceKey || !resendKey || !fromEmail) {
    return respond({ error: 'A função de e-mail não está configurada.' }, 500);
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return respond({ error: 'Sessão necessária.' }, 401);
  const callerClient = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: { user: caller }, error: userError } = await callerClient.auth.getUser();
  if (userError || !caller) return respond({ error: 'Sessão inválida.' }, 401);

  const serviceClient = createClient(supabaseUrl, serviceKey);
  const { data: director, error: directorError } = await serviceClient.from('profiles')
    .select('role,approval_status,suspended').eq('id', caller.id).maybeSingle();
  if (directorError || director?.role !== 'director' || director.approval_status !== 'approved' || director.suspended) {
    return respond({ error: 'Somente o diretor ativo pode solicitar o envio.' }, 403);
  }

  let targetUserId = '';
  try {
    const body = await request.json();
    targetUserId = typeof body.user_id === 'string' ? body.user_id : '';
  } catch { return respond({ error: 'Solicitação inválida.' }, 400); }
  if (!targetUserId) return respond({ error: 'Conta aprovada não informada.' }, 400);

  const { data: accountRequest, error: requestError } = await serviceClient.from('account_requests')
    .select('responsible_name,email,status').eq('user_id', targetUserId).maybeSingle();
  if (requestError || !accountRequest || accountRequest.status !== 'approved') {
    return respond({ error: 'A conta não possui uma aprovação válida.' }, 404);
  }

  const name = accountRequest.responsible_name;
  const message = `Olá, ${name}!\n\nSua solicitação de acesso ao Jogos do SESI + Saúde foi aprovada.\n\nSua conta já está liberada e você poderá acessar o sistema com a permissão de Treinador/Empresa.\n\nAcesse a plataforma e aproveite as funcionalidades disponíveis.\n\nEquipe Jogos do SESI + Saúde.`;
  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: fromEmail,
      to: [accountRequest.email],
      subject: 'Sua conta no Jogos do SESI + Saúde foi aprovada!',
      text: message,
    }),
  });
  if (!emailResponse.ok) {
    const details = await emailResponse.text();
    console.error('Falha no provedor de e-mail:', details);
    return respond({ error: 'O provedor de e-mail recusou o envio.' }, 502);
  }
  return respond({ sent: true });
});
