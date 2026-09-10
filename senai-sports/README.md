# SENAI Sports — Demo funcional

Protótipo funcional em HTML, CSS e JavaScript puro, criado a partir da especificação do SENAI Sports.

## Como executar

Opção 1: abra `index.html` diretamente no navegador.

Opção 2 (recomendado): rode um servidor local simples:

```bash
python -m http.server 8000
```

Depois acesse `http://localhost:8000`.

## Contas de teste

- Aluno: `aluno@senai.local` / `Aluno@123`
- Professor: `professor@senai.local` / `Professor@123`
- Diretor: `diretor@senai.local` / `Senai@123`

## O que já funciona na demo

- Login e criação de conta
- Regras de senha forte
- Bloqueio após 5 tentativas incorretas por 15 minutos
- Perfis Aluno, Professor e Diretor
- Dashboards diferentes por perfil
- Calendário mensal com navegação por ano/mês
- Criação de jogos para professor/diretor
- Validação de conflito de horário da única quadra
- Inscrição individual de aluno em jogo
- Cancelamento de participação até 15 minutos antes
- Criação e visualização de equipes
- Limite de 1 equipe criada por aluno
- Professor obrigatório na equipe
- Filtro básico contra nomes inadequados e variações com números
- Campeonatos mata-mata quando há 3+ equipes no mesmo dia
- Sorteio automático inicial de confrontos
- Registro de placar por sets
- Ranking de alunos e equipes
- Notificações
- Histórico
- Gestão de usuários pelo diretor
- Suspensão e reativação
- Logs de auditoria
- Tema claro/escuro
- Layout responsivo
- Persistência dos dados no navegador via `localStorage`

## Importante

Esta versão é uma **demo front-end funcional**. Os dados são armazenados no navegador com `localStorage` para que o sistema possa ser testado sem instalar banco de dados.

Para produção, a próxima etapa é substituir o armazenamento local por um backend real, por exemplo:

- Next.js + TypeScript
- Supabase/PostgreSQL
- Supabase Auth
- Google OAuth
- Row Level Security (RLS)
- serviço de e-mail para redefinição de senha e notificações

Não use a autenticação desta demo em produção, pois as senhas ficam apenas no armazenamento local do navegador.
