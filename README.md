## Modelo de acesso nesta etapa

A interface abre em modo público para consulta do calendário, próximos jogos, equipes e informações gerais dos campeonatos. O histórico detalhado e os rankings aparecem somente após o login. O botão **Entrar** aceita administradores ou contas autorizadas vinculadas como representantes de equipe; não há cadastro público.

**Limite de segurança:** este repositório ainda é uma demonstração local. `src/demo/storage.ts` persiste o estado e a sessão em `localStorage`, `src/demo/seed.ts` inclui usuários e credenciais fictícias de exemplo e não existem tabelas, API de escrita ou políticas RLS conectadas. A restrição do histórico nesta versão é feita na interface e não protege dados no servidor. A criação segura de contas de representantes também depende de um backend. Não use credenciais ou dados reais até migrar usuários e dados esportivos, configurar autenticação e aplicar políticas de acesso no banco.
# SENAI Quadra — React + TypeScript + Vite

**Acesso público e privado:** calendário, próximos jogos e informações gerais permanecem públicos; o histórico detalhado exige login. Ações de equipe e administração aparecem conforme o perfil autorizado no aplicativo.

O projeto ainda não possui backend de dados nem políticas RLS. Consulte “Modelo de acesso nesta etapa” antes de usar fora de uma demonstração local.

## Executar

No Windows desta máquina, abra **`iniciar.cmd`**. Ele usa o Node instalado ou a cópia portátil em `.tools/`. Mantenha o terminal aberto e acesse o endereço indicado pelo Vite, normalmente `http://127.0.0.1:5173`.

### Acesso de demonstração

Para testar as telas administrativas, use a conta fictícia incluída no seed local:

- E-mail: `diretor@senai.local`
- Senha: `Senai@123`

Essa conta existe somente na demonstração salva no navegador (`localStorage`); ela não é uma conta do Supabase Auth e não deve ser usada em produção. Cada navegador mantém seus próprios dados de demonstração.

Em outra máquina, instale Node.js 22.12 ou superior, entre na raiz deste repositório e execute:

```sh
npm install
npm run dev
```

## Publicação no GitHub Pages

O workflow `.github/workflows/pages.yml` compila o app, valida os caminhos dos arquivos e publica a pasta `dist` quando há push na branch `main`. Em **Settings → Pages**, selecione **GitHub Actions** como origem de publicação. O endereço do projeto será `https://morianmoraes.github.io/senai_quadra/`.

Em **Settings → Secrets and variables → Actions**, cadastre os repository secrets `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`. O workflow os injeta somente durante o build. Se não estiverem cadastrados, o site ainda abre em modo de demonstração local e informa que a conexão com Supabase está indisponível. Use apenas a chave publicável; nunca use `service_role` no frontend.

## Publicação na Vercel

O `vercel.json` fixa o framework Vite, `npm install`, `npm run build` e a saída `dist`. O diretório raiz do repositório contém o app. A Production Branch não pode ser definida por esse arquivo: configure `main` em **Project Settings → Git → Production Branch**.

A consulta pública não exige variáveis de ambiente.

Este repositório não está conectado ao painel da Vercel por este ambiente; configure a Production Branch como `main`.

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

- Consulta pública de jogos, calendário, equipes, campeonatos e histórico; login restrito a contas existentes e sem cadastro público.
- Exibição de senha na tela de login.
- Navegação, calendário, partidas, ranking, histórico e perfil.
- Professor cria jogos de 90 minutos com antecedência mínima de 24 horas e validação local de conflito da quadra.
- Professor cria campeonatos; somente o líder/criador inscreve o time completo.
- 6 titulares, incluindo o líder; alunos e professores podem jogar, conforme o pedido anexado. Até 4 reservas ficam separados.
- Equipes novas de aluno ficam pendentes; professor responsável pode aprová-las. Equipes já ativas permanecem ativas.
- Inscrição guarda cópia dos 6 titulares e bloqueia equipe incompleta, conta suspensa, ausência de professor responsável e jogador duplicado no campeonato.
- Registro manual de placar preservado. Regravar o mesmo resultado não duplica os totais da equipe.
- Administrador gerencia usuários, equipes, jogos, campeonatos, placares e logs; líderes só alteram a equipe própria.
- Tema claro/escuro e layout responsivo, sem aba nem sino de notificações.

Sorteio de novos confrontos, avanço automático, regras completas dos sets, placar ao vivo, MVP, temporadas e novos rankings pertencem às etapas seguintes. Campeonatos antigos preservam os confrontos salvos.

## Dados e limites

O adaptador `src/demo/storage.ts` isola temporariamente a persistência anterior. Dados de `senaiSportsDemoV1` são lidos e convertidos para os perfis `student`, `teacher` e `director`. Novas alterações usam `senaiSportsReactDemoV1`, preservando a chave anterior. Dados inválidos geram mensagem e não são apagados silenciosamente.

O navegador separa dados por origem. O endereço do Vite não acessa automaticamente dados de `file://` ou de outra porta do Live Server; nesses casos a demo inicia com o seed. Não existe importação para Supabase nesta etapa.

As senhas e permissões do login tradicional, além dos dados esportivos locais, **não são segurança de produção**. A autenticação Supabase ainda não está integrada ao fluxo de login. O bloqueio de tentativas no fluxo tradicional é demonstrativo, em memória, e reinicia ao recarregar. Recuperação de senha não envia e-mail. Para dados reais compartilhados e permissões seguras, é necessário migrar os perfis e dados esportivos para tabelas protegidas por RLS.

## Supabase

Com os dois valores configurados, o cliente Supabase é inicializado e verifica a sessão de autenticação ao abrir o app. A autenticação do aplicativo e os dados esportivos ainda usam a demonstração local no navegador; o cliente Supabase não substitui uma migração de usuários e dados para tabelas protegidas por RLS.

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






