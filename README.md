# Jogos do SESI + Saúde

Plataforma web responsiva para consultar e organizar jogos, equipes, campeonatos, inscrições, resultados, classificação e galeria de campeões.

## Objetivo

Reunir a agenda esportiva e as ferramentas de organização dos Jogos do SESI + Saúde em um só lugar, com consulta pública e áreas de administração controladas por perfil.

## Tecnologias

- React 19, TypeScript e Vite.
- Supabase Auth, PostgreSQL, Row Level Security (RLS), RPCs e Realtime.
- Vitest e Playwright.
- GitHub Actions e GitHub Pages.
- Resend por Supabase Edge Function para avisos de aprovação.

## Estrutura

- `src/pages`: páginas públicas, autenticação, jogos e administração.
- `src/components` e `src/layouts`: componentes e navegação.
- `src/contexts`: sessão, estado e conexão com Supabase.
- `src/services`: regras de domínio e validação.
- `src/styles`: estilos responsivos e temas.
- `public/assets`: marca, calendário e fotos da galeria.
- `supabase/migrations`: esquema, políticas e funções SQL.
- `supabase/functions`: funções seguras executadas no Supabase.

## Executar localmente

Requer Node.js 22.12 ou superior.

```sh
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite (normalmente `http://127.0.0.1:5173`). No Windows, `iniciar.cmd` também instala dependências ausentes e inicia o servidor.

Verificações locais:

```sh
npm run typecheck
npm test
npm run build
npm run test:e2e
```

## Variáveis de ambiente

Copie `.env.example` para `.env.local` e configure somente os valores públicos:

```env
VITE_SUPABASE_URL=https://SEU-PROJETO.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=SUA_CHAVE_PUBLICAVEL
```

Sem essas variáveis, o app abre em modo de demonstração local. Esse modo não substitui autenticação nem persistência seguras para uso real.

Nunca coloque `service_role`, senha do banco, chave privada ou chave do Resend em variáveis `VITE_*`, no código do navegador ou no README. O OAuth Google, se utilizado, deve ser configurado nos provedores do Supabase Auth.

## Perfis e funcionalidades

- **SESI:** administração institucional, consulta e ferramentas autorizadas para gestão do sistema.
- **Diretor:** jogos, equipes, jogadores, campeonatos, resultados e análise das solicitações de representantes.
- **Treinador/Empresa:** ferramentas de organização permitidas para suas equipes e eventos.
- **Estudante/Jogador:** perfil, equipes, inscrições e consulta à agenda e estatísticas.
- **Visitante:** consulta pública de agenda, equipes, torneios, resultados, documentos e galeria.

Os controles da interface são complementados por políticas RLS e funções SQL. Nunca conceda privilégios alterando somente o estado do navegador.

## Cadastro e aprovação de representantes

1. O responsável informa nome, equipe/empresa, e-mail e senha.
2. O trigger do Supabase cria um perfil pendente e uma solicitação privada.
3. A confirmação do endereço de e-mail não libera o painel.
4. Um diretor ativo aprova ou recusa a solicitação na área **Usuários → Solicitações de Cadastro**.
5. A aprovação muda o perfil para Treinador/Empresa; a recusa mantém o acesso bloqueado. Ambas ficam registradas com data e responsável.
6. Após aprovação, uma Edge Function pode enviar o aviso por e-mail.

O banco e a interface bloqueiam perfis pendentes e recusados. A função de aprovação só aceita chamadas de um diretor ativo; o usuário não pode alterar seu próprio perfil ou papel.

## Configurar Supabase

1. Configure um projeto Supabase e o provedor de e-mail/senha em Authentication.
2. Em Authentication → URL Configuration, inclua os URLs locais e de produção. O app usa `?email-confirmed=1` no retorno de confirmação.
3. No SQL Editor ou via Supabase CLI, aplique as migrations pendentes em `supabase/migrations`, na ordem do nome do arquivo. Não reaplique migrations que já foram executadas.
4. Confirme em especial a migration `20261127000400_teacher_account_approval.sql`: ela cria a tabela de solicitações, restringe os perfis pendentes e instala a RPC segura de decisão.
5. Crie ou promova uma conta de direção de forma administrativa e segura. Não promova contas pelo frontend nem por dados fornecidos pelo próprio usuário.

O estado esportivo legado ainda fica em `sports_state.payload` (JSONB); dados de perfil, solicitações, observações e informações privadas de jogadores têm políticas próprias. Revise e aplique cada migration no projeto Supabase correto antes de publicar a aplicação que depende dela.

## E-mail de aprovação

A função `notify-account-approved` usa Resend no servidor. Com Supabase CLI conectado ao projeto, publique e configure os segredos:

```sh
supabase functions deploy notify-account-approved
supabase secrets set RESEND_API_KEY=VALOR_SEGURO APPROVAL_FROM_EMAIL="Jogos SESI <conta-verificada@seudominio.com>"
```

Use um domínio verificado no Resend. A função valida a sessão do Supabase, confirma no banco que quem chamou é diretor ativo e só envia a uma solicitação já aprovada. Os segredos ficam no Supabase; não os adicione ao `.env.local`, GitHub ou código cliente.

## Contas de demonstração

Não use contas reais ou senhas administrativas em documentação pública. Para testar, crie contas próprias em um projeto Supabase de desenvolvimento e promova somente uma conta de teste a diretor pelo painel seguro do Supabase.

- Diretor: e-mail e senha de uma conta de desenvolvimento configurada pelo responsável do projeto.
- Treinador/Empresa: use o fluxo de cadastro e aprove a solicitação com a conta de diretor de desenvolvimento.
- Estudante: crie uma conta de teste separada conforme os provedores de autenticação habilitados.

Não reutilize essas contas em produção. O modo local pode conter dados de demonstração definidos em `src/demo/seed.ts`; não os use para autenticar usuários reais.

## Testes de layout e publicação

Confira o site em largura de computador e celular pelo navegador local. Antes de publicar, rode os testes e a compilação acima. Para validar os caminhos de assets no GitHub Pages no PowerShell:

```powershell
$env:GITHUB_ACTIONS='true'
npm run build
if ($LASTEXITCODE -eq 0) { npm run verify:pages }
Remove-Item Env:GITHUB_ACTIONS
```

No repositório GitHub, configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` como secrets/variables da Action de deploy. O workflow publica em GitHub Pages usando o caminho-base `/senai_quadra/`. A função de e-mail e seus segredos devem ser publicados/configurados no Supabase separadamente.
