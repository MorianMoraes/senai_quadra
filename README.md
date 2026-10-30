# SENAI Sports — React + TypeScript + Vite

**Etapa 1 implementada:** telas convertidas em componentes React, TypeScript estrito e Vite, preservando o layout, a paleta SENAI e os fluxos existentes.

Esta etapa ainda é uma demonstração local. Supabase, autenticação real, banco, RLS, Storage e Realtime serão implementados nas etapas seguintes. O `.env` está preparado, mas ainda não é consumido pelo código. **Não há migrations nesta etapa.**

## Executar

No Windows desta máquina, abra **`iniciar.cmd`**. Ele usa o Node instalado ou a cópia portátil em `.tools/`. Mantenha o terminal aberto e acesse o endereço indicado pelo Vite, normalmente `http://127.0.0.1:5173`.

Em outra máquina, instale Node.js 22.12 ou superior, entre na raiz deste repositório e execute:

```sh
npm install
npm run dev
```

## Publicação no GitHub Pages

O workflow `.github/workflows/pages.yml` compila o app e publica a pasta `dist` quando há push na branch `main`. Em **Settings → Pages**, selecione **GitHub Actions** como origem de publicação. O endereço do projeto será `https://morianmoraes.github.io/senai_quadra/`.

O `index.html` principal agora carrega TypeScript pelo Vite. Abrir esse arquivo diretamente, ou por Live Server, não executa a aplicação React.

## Arquivos criados e alterados

- `package.json`, `package-lock.json`: dependências e comandos.
- `tsconfig.json`: `strict`, `noUncheckedIndexedAccess` e verificação sem emissão.
- `vite.config.ts`, `playwright.config.ts`: build e testes.
- `index.html`: entrada alterada para `src/main.tsx`.
- `src/App.tsx`: navegação por perfil.
- `src/components/`: campos, botões, cards, modal, toast e componentes esportivos.
- `src/layouts/`: menu e cabeçalho.
- `src/pages/`: cadastro, dashboard, calendário, jogos, equipes, campeonatos, ranking, histórico, perfil, usuários e logs.
- `src/services/`: regras de cadastro, equipes, jogos e campeonatos.
- `src/types/models.ts`: tipos e validação dos dados locais.
- `src/contexts/`, `src/hooks/`: estado e tema.
- `src/utils/`: datas, formatação e validações.
- `src/styles/app.css`: estilos migrados e fontes Barlow/Barlow Condensed fornecidas localmente.
- `src/demo/`: seed fictício e armazenamento temporário isolados.
- `tests/`: fluxos completos no Chrome.
- `.env`, `.env.example`: campos públicos do Supabase. `.env` ignorado pelo Git.

As telas React não utilizam `any`, `@ts-ignore`, `@ts-nocheck` ou `dangerouslySetInnerHTML`.

## Fluxos desta etapa

- Login de demonstração e cadastro público **somente como aluno**.
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

Senhas fictícias, login, sessão e permissões locais **não são segurança de produção**. O bloqueio de tentativas nesta etapa é demonstrativo, em memória, e reinicia ao recarregar. Recuperação de senha não envia e-mail. Supabase Auth e RLS devem substituir esse adaptador antes do uso com dados reais.

## Contas de teste

| Perfil | E-mail | Senha |
| --- | --- | --- |
| Aluno | aluno@senai.local | Aluno@123 |
| Professor | professor@senai.local | Professor@123 |
| Diretor | diretor@senai.local | Senai@123 |

Teste campeonato: entre como professor e crie um campeonato. Saia e entre como aluno. Em Equipes, monte o elenco da Fênix Azul com 6 titulares. Em Campeonatos, use **Inscrever time com 6 jogadores**. Equipes novas de aluno exigem aprovação pelo professor responsável.

## .env e Supabase

O `.env` local já foi criado vazio. Em outra máquina, copie `.env.example` para `.env`:

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Preencha com URL e chave **pública** do seu projeto Supabase. Não use `service_role`, chave secreta nem senha do banco. Variáveis `VITE_*` são incluídas no frontend.

**Configuração Supabase exigida para a Etapa 1: nenhuma. Migrations criadas: nenhuma.** A Etapa 2 configurará o cliente. As etapas de banco e autenticação incluirão migrations, tipos reais do banco, RLS, Auth, Google e Storage. Nenhuma chave ou estrutura de banco foi inventada.

## Verificação

```sh
npm run typecheck
npm test
npm run test:e2e
npm run build
npm run preview
```

Testes de navegador usam Chrome instalado em 1440 × 1000 e 390 × 844. A pasta ignorada `test-results/` guarda capturas e traces de falhas. Build gera `dist/`; preview permite revisão local. Não publique como aplicação final antes de concluir Supabase e RLS.

## Erros comuns

- `npm` não reconhecido: use `iniciar.cmd` nesta máquina ou instale Node.js e reabra o terminal.
- Tela vazia abrindo HTML: execute `npm run dev` e abra o endereço do Vite.
- Porta ocupada: use a porta indicada pelo Vite. Os testes exigem a porta 5173 livre.
- Dados locais indisponíveis: restaure um backup válido; os dados não foram apagados.
- Chrome ausente: instale Chrome para executar os testes de navegador.
- Alterou `.env`: após a futura integração, reinicie Vite. Nesta etapa as variáveis ainda não são consumidas.

Referências: [Vite — início](https://vite.dev/guide/) e [React com TypeScript](https://react.dev/learn/typescript).
