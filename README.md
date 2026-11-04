# SENAI Sports — React, TypeScript, Vite e Supabase

## Executar

Copie `.env.example` para `.env.local`, preencha as variáveis públicas do Supabase e rode:

```sh
npm install
npm run dev
npm run typecheck
npm test
npm run build
npm run verify:pages
```

Sem as variáveis do Supabase, o app mantém o modo de demonstração local. Com elas, usa Supabase Auth e lê/escreve os dados remotos.

## Supabase

O projeto já possui `public.profiles` com as colunas `id`, `nome`, `email`, `avatar_url` e `created_at`. A migration `20261104000100_senai_sports.sql` acrescenta os campos de perfil e autorização necessários sem recriar esse cadastro. Ela também cria `sports_state`, `activity_logs`, a view `public_profiles`, funções e policies RLS. Essa migration foi aplicada no projeto indicado pelo responsável.

Aplique, nesta ordem, `supabase/migrations/20261104000200_player_actions.sql`, `supabase/migrations/20261104000300_public_profile_minimization.sql` e `supabase/migrations/20261104000400_non_null_role_guard.sql` no SQL Editor. A migration 002 libera as RPCs de entrada de jogadores em jogos/equipes e montagem de elenco, restritas ao perfil `student`, sem conceder atualização geral de `sports_state`. A migration 003 limita a view pública aos nomes, funções e fotos necessários para mostrar participantes, ocultando e-mail, turma, matrícula, idade e perfis suspensos. A migration 004 faz as funções SQL rejeitarem explicitamente usuários anônimos e perfis suspensos.

Em Supabase Authentication, habilite e-mail/senha e configure os URLs de retorno para desenvolvimento e para o domínio de produção. As contas são criadas no Supabase Auth. O trigger cria novos perfis como `student`; um administrador deve conferir e promover representantes no SQL Editor:

```sql
update public.profiles set role = 'teacher' where email = 'representante@exemplo.edu.br';
update public.profiles set role = 'director' where email = 'administrador@exemplo.edu.br';
```

Use somente a publishable key no navegador. Nunca coloque uma secret/service-role key em `.env.local` do Vite nem nos secrets de publicação.

## Dados e permissões

- Papéis internos: `student` (jogador), `teacher` (representante) e `director` (administrador).
- Visitantes podem consultar calendário, jogos, equipes, campeonatos e resultados publicados. Ações de inscrição e administração exigem sessão e são validadas também pelas policies/RPCs do banco.
- `public_profiles` expõe somente nome, função e foto de perfis ativos; e-mail, turma, matrícula e idade ficam privados.
- `activity_logs` só pode ser lido por administradores. O documento de estado esportivo não inclui contas, senhas nem logs administrativos.
- O ranking público é somente de equipes; modalidades têm ícones centralizados em `src/components/SportIcon.tsx` e categorias em `src/utils/sports.ts`.

**Limite de esquema:** para preservar a aplicação existente, equipes, jogos, campeonatos, participantes, resultados e estatísticas ainda são persistidos juntos em `sports_state.payload` (JSONB), e não em tabelas relacionais individuais. As migrations protegem o documento com RLS e RPCs estreitas, mas relatórios relacionais, constraints por jogador e catálogo persistente de unidades exigem uma migração de modelo posterior. A interface permite informar unidades e reaproveita opções já existentes nos eventos.

## Migração dos dados locais

No navegador que contém os dados locais, entre como administrador e use **Gestão de usuários → Migrar dados locais preservados**. Primeiro crie no Supabase Auth cada conta local e confira o papel correspondente em `profiles`. A rotina valida as contas antes de enviar, converte referências para IDs Auth, usa IDs `legacy_` estáveis para evitar repetição e mantém os dados originais no `localStorage`; ela não migra senhas. Faça backup do banco e do navegador antes da operação.

## GitHub Pages e Vercel

No GitHub Actions, cadastre `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` como secrets/variables e publique via GitHub Actions. O caminho-base de Pages permanece `/senai_quadra/`. O app segue como site Vite estático e também pode ser servido pela Vercel; configure as mesmas duas variáveis de ambiente no projeto Vercel.

## Demonstração local

Sem configuração remota, o modo anterior usa as chaves locais `senaiSportsReactDemoV1` e `senaiSportsDemoV1`. Não use contas fictícias da demonstração em produção. Arquivos `.env*` locais são ignorados pelo Git, exceto `.env.example`.
