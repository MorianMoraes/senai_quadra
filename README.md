# SENAI Sports — React + TypeScript + Vite

**Etapa 1 implementada:** telas convertidas em componentes React, TypeScript estrito e Vite, preservando o layout, a paleta SENAI e os fluxos existentes.

O login social com Google usa Supabase Auth. O login tradicional e os dados esportivos continuam locais e demonstrativos; ainda não há tabelas, migrations ou schema de banco neste repositório. Contas Google recebem perfil local de aluno, sem privilégios administrativos.

## Executar

No Windows desta máquina, abra **`iniciar.cmd`**. Ele usa o Node instalado ou a cópia portátil em `.tools/`. Mantenha o terminal aberto e acesse o endereço indicado pelo Vite, normalmente `http://127.0.0.1:5173`.

Em outra máquina, instale Node.js 22.12 ou superior, entre na raiz deste repositório e execute:

```sh
npm install
npm run dev
```

## Publicação no GitHub Pages

O workflow `.github/workflows/pages.yml` compila o app e publica a pasta `dist` quando há push na branch `main`. Em **Settings → Pages**, selecione **GitHub Actions** como origem de publicação. O endereço do projeto será `https://morianmoraes.github.io/senai_quadra/`.

## Publicação na Vercel

O `vercel.json` fixa o framework Vite, `npm install`, `npm run build` e a saída `dist`. O diretório raiz do repositório contém o app. A Production Branch não pode ser definida por esse arquivo: configure `main` em **Project Settings → Git → Production Branch**.

Em **Project Settings → Environment Variables**, habilite a exposição das variáveis de sistema e configure `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` para Production, Preview e Development. Com `VERCEL=1`, o build falha com uma mensagem clara se essas variáveis estiverem ausentes. Valores `VITE_*` são incorporados ao JavaScript do navegador; use apenas a publishable key, nunca uma chave `service_role` ou `secret`.

O `.env.local` desta máquina contém os valores locais e está ignorado pelo Git. Este repositório não está conectado ao painel da Vercel por este ambiente; a Production Branch e as variáveis precisam ser confirmadas no painel.

O `index.html` principal agora carrega TypeScript pelo Vite. Abrir esse arquivo diretamente, ou por Live Server, não executa a aplicação React.

## Arquivos criados e alterados

- `package.json`, `package-lock.json`: dependências e comandos.
- `vercel.json`: framework e comandos de build da Vercel.
- `tsconfig.json`: `strict`, `noUncheckedIndexedAccess` e verificação sem emissão.
- `vite.config.ts`, `playwright.config.ts`: build e testes.
- `index.html`: entrada alterada para `src/main.tsx`.
- `src/App.tsx`: navegação por perfil.
- `src/components/`: campos, botões, cards, modal, toast e componentes esportivos.
- `src/layouts/`: menu e cabeçalho.
- `src/pages/`: cadastro, dashboard, calendário, jogos, equipes, campeonatos, histórico com ranking integrado, perfil, usuários e logs.
- `src/services/`: regras de cadastro, equipes, jogos e campeonatos.
- `src/types/models.ts`: tipos e validação dos dados locais.
- `src/contexts/`, `src/hooks/`: estado e tema.
- `src/utils/`: datas, formatação e validações.
- `src/styles/app.css`: estilos migrados e fontes Barlow/Barlow Condensed fornecidas localmente.
- `src/demo/`: seed fictício e armazenamento temporário isolados.
- `tests/`: fluxos completos no Chrome.
- `.env.local`, `.env.example`: nomes das variáveis públicas do Supabase. Arquivos `.env*` locais são ignorados pelo Git, exceto `.env.example`.

As telas React não utilizam `any`, `@ts-ignore`, `@ts-nocheck` ou `dangerouslySetInnerHTML`.

## Fluxos desta etapa

- Login tradicional de demonstração, cadastro público **somente como aluno** e login/cadastro Google via Supabase Auth.
- Mostrar/ocultar senha e validação de senha e matrícula.
- Navegação, calendário, partidas, ranking, histórico e perfil.
- Professor cria jogos de 90 minutos com antecedência mínima de 24 horas e validação local de conflito da quadra.
- Professor cria campeonatos; somente o líder/criador inscreve o time completo.
- 6 titulares, incluindo o líder; alunos e professores podem jogar, conforme o pedido anexado. Até 4 reservas ficam separados.
- Equipes novas de aluno ficam pendentes; professor responsável pode aprová-las. Equipes já ativas permanecem ativas.
- Inscrição guarda cópia dos 6 titulares e bloqueia equipe incompleta, conta suspensa, ausência de professor responsável e jogador duplicado no campeonato.
- Registro manual de placar preservado. Regravar o mesmo resultado não duplica os totais da equipe.
- Diretor gerencia suspensão e consulta logs. Somente professor cria jogos.
- Tema claro/escuro e layout responsivo, sem aba nem sino de notificações.

Sorteio de novos confrontos, avanço automático, regras completas dos sets, placar ao vivo, MVP, temporadas e novos rankings pertencem às etapas seguintes. Campeonatos antigos preservam os confrontos salvos.

## Dados e limites

O adaptador `src/demo/storage.ts` isola temporariamente a persistência anterior. Dados de `senaiSportsDemoV1` são lidos e convertidos para os perfis `student`, `teacher` e `director`. Novas alterações usam `senaiSportsReactDemoV1`, preservando a chave anterior. Dados inválidos geram mensagem e não são apagados silenciosamente.

O navegador separa dados por origem. O endereço do Vite não acessa automaticamente dados de `file://` ou de outra porta do Live Server; nesses casos a demo inicia com o seed. Não existe importação para Supabase nesta etapa.

As senhas e permissões do login tradicional, além dos dados esportivos locais, **não são segurança de produção**. O login Google é autenticado pelo Supabase; o perfil e as permissões de aluno são espelhados no armazenamento local. O bloqueio de tentativas no fluxo tradicional é demonstrativo, em memória, e reinicia ao recarregar. Recuperação de senha não envia e-mail. Para dados reais compartilhados e permissões seguras, é necessário migrar os perfis e dados esportivos para tabelas protegidas por RLS.

## Contas de teste

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Aluno | aluno@senai.local | Aluno@123 |
| Professor | professor@senai.local | Professor@123 |
| Diretor | diretor@senai.local | Senai@123 |

Teste campeonato: entre como professor e crie um campeonato. Saia e entre como aluno. Em Equipes, monte o elenco da Fênix Azul com 6 titulares. Em Campeonatos, use **Inscrever time com 6 jogadores**. Equipes novas de aluno exigem aprovação pelo professor responsável.

## .env e Supabase

O `.env.local` desta máquina contém os valores locais e está ignorado pelo Git. Em outra máquina, copie `.env.example` para `.env.local`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_PUBLISHABLE_KEY=
```

Preencha com URL e chave **pública** do seu projeto Supabase. Não use `service_role`, chave secreta nem senha do banco. Variáveis `VITE_*` são incluídas no frontend.

O cliente exige as duas variáveis acima. Para habilitar o login Google, configure também o provedor no painel do Supabase:

1. Em **Authentication → Sign In / Providers → Google**, habilite Google e informe o OAuth Client ID e Client Secret criados no Google Cloud. Os segredos ficam somente no painel do Supabase; não os coloque em variáveis `VITE_*`, no `.env.local` ou no Git.
2. No Google Cloud, adicione como **Authorized JavaScript origins** `http://127.0.0.1:5173` e a origem do domínio de produção da Vercel. Em **Authorized redirect URIs**, use o callback do Supabase exibido na configuração do provedor Google (normalmente `https://<project-ref>.supabase.co/auth/v1/callback`).
3. Em **Authentication → URL Configuration**, defina o Site URL de produção e permita os endereços de retorno utilizados. Inclua `http://127.0.0.1:5173/`, a URL raiz real da Vercel e, se usar GitHub Pages, `https://morianmoraes.github.io/senai_quadra/`.

O frontend chama `signInWithOAuth` e recebe o retorno no endereço base atual do site. Não são necessárias novas variáveis de frontend: `.env.example` já lista a URL Supabase e a chave pública. O login tradicional e os dados esportivos continuam demonstrativos e locais; não há schema, migrations nem políticas RLS neste projeto.

## Verificação

```sh
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run preview
```

Testes de navegador usam Chrome instalado em 1440 × 1000 e 390 × 844. A pasta ignorada `test-results/` guarda capturas e traces de falhas. Build gera `dist/`; preview permite revisão local. A autenticação e os dados locais da demo não substituem Supabase Auth e RLS em produção.

## Erros comuns

- `npm` não reconhecido: use `iniciar.cmd` nesta máquina ou instale Node.js e reabra o terminal.
- Tela vazia abrindo HTML: execute `npm run dev` e abra o endereço do Vite.
- Porta ocupada: use a porta indicada pelo Vite. Os testes exigem a porta 5173 livre.
- Dados locais indisponíveis: restaure um backup válido; os dados não foram apagados.
- Chrome ausente: instale Chrome para executar os testes de navegador.
- Alterou `.env.local`: reinicie o Vite para carregar os novos valores.

Referências: [Vite — início](https://vite.dev/guide/) e [React com TypeScript](https://react.dev/learn/typescript).
