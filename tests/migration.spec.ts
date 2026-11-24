import { test, expect, type Page } from '@playwright/test';

async function login(page: Page, email: string, password: string) {
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.locator('.topbar h1')).toHaveText(/Início|Jogos/);
}

async function startLogin(page: Page) {
  await page.locator('.topbar-status').getByRole('button', { name: 'Entrar', exact: true }).click();
}

async function openMenu(page: Page) {
  const menu = page.getByRole('button', { name: 'Abrir menu' });
  if (await menu.isVisible() && await menu.getAttribute('aria-expanded') === 'false') await menu.click();
}

async function navigate(page: Page, route: string) {
  await openMenu(page);
  await page.locator(`[data-route="${route}"]`).click();
}

async function logout(page: Page) {
  await openMenu(page);
  await page.locator('.user-mini').getByRole('button', { name: 'Sair', exact: true }).click();
}

async function expectNoHorizontalOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

test('visitantes consultam jogos, equipes, participantes e histórico sem login', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Próximos jogos' })).toBeVisible();
  await expect(page.locator('[data-route="history"]')).toBeVisible();
  await navigate(page, 'history');
  await expect(page.getByRole('heading', { name: 'Histórico de partidas' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ranking de alunos' })).toHaveCount(0);
  await expect(page.getByText('Fênix Azul × Titãs')).toBeVisible();

  await navigate(page, 'howItWorks');
  await expect(page.getByRole('heading', { name: 'Acompanhe sem cadastro' })).toBeVisible();
  await expect(page.getByText('REPRESENTANTE', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Organize os eventos' })).toBeVisible();

  await navigate(page, 'calendar');
  await page.getByRole('button', { name: 'Lista', exact: true }).click();
  const finishedGame = page.locator('.game-table tr').filter({ hasText: 'finalizado' }).first();
  await finishedGame.getByRole('button', { name: 'Detalhes' }).click();
  await expect(page.getByText('Set 1')).toBeVisible();
  await page.getByRole('button', { name: 'Fechar janela' }).click();

  await navigate(page, 'teams');
  await page.getByRole('button', { name: 'Ver equipe e jogadores' }).first().click();
  await expect(page.getByText('Jogadores confirmados (')).toBeVisible();
  await page.getByRole('button', { name: 'Fechar janela' }).click();

  await navigate(page, 'howItWorks');
  await page.getByRole('button', { name: 'Consultar histórico' }).click();
  await expect(page.getByRole('heading', { name: 'Histórico de partidas' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('visitante pode criar uma conta de jogador', async ({ page }) => {
  await page.goto('/');
  await startLogin(page);
  await page.getByRole('button', { name: 'Criar conta de jogador' }).click();
  await expect(page.getByText('Pelo menos 8 caracteres')).toBeVisible();
  await page.getByLabel('Nome completo').fill('Novo Jogador');
  await page.getByLabel('Turma').fill('1º A');
  await page.getByLabel('E-mail', { exact: true }).fill(`jogador-${Date.now()}@senai.local`);
  await page.getByLabel('Senha', { exact: true }).fill('NovoJogador@123');
  await expect(page.locator('.password-strength strong')).toHaveText('Forte');
  await page.locator('input[name=confirm]').fill('NovoJogador@123');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page.locator('.topbar h1')).toHaveText('Jogos');
  await expect(page.getByText('Jogador', { exact: true })).toBeVisible();
});
test('tela de confirmação de e-mail oferece retorno seguro ao login', async ({ page }) => {
  await page.goto('/?email-confirmed=1');
  await expect(page.getByRole('heading', { name: 'E-mail confirmado' })).toBeVisible();
  await page.getByRole('button', { name: 'Ir para entrar' }).click();
  await expect(page.getByLabel('E-mail', { exact: true })).toBeVisible();
});
test('jogador acessa a agenda personalizada e representante cria calendário e gerencia placares', async ({ page }) => {
  await page.goto('/');
  await startLogin(page);
  await login(page, 'aluno@senai.local', 'Aluno@123');
  await navigate(page, 'calendar');
  await page.getByRole('button', { name: 'Lista', exact: true }).click();
  await page.getByRole('button', { name: 'Ver minha agenda' }).click();
  await expect(page.getByRole('button', { name: 'Minha agenda ✓' })).toBeVisible();
  await expect(page.locator('.game-table')).toContainText('Fênix Azul');

  await logout(page);
  await startLogin(page);
  await login(page, 'professor@senai.local', 'Professor@123');
  await navigate(page, 'teams');
  await expect(page.getByRole('button', { name: '＋ Criar equipe do evento' })).toBeVisible();

  await navigate(page, 'createGame');
  await page.getByRole('button', { name: 'Mesa e tabuleiro' }).click();
  await expect(page.locator('select[name="sport"]')).toHaveValue('xadrez');
  await expect(page.locator('input[name="duration"]')).toHaveValue('');
  await expect(page.locator('input[name="limit"]')).toHaveValue('2');
  await page.getByRole('button', { name: 'Jogos de quadra' }).click();
  await expect(page.locator('select[name="sport"]')).toHaveValue('volei');
  await expect(page.locator('input[name="limit"]')).toHaveValue('20');

  await page.getByLabel('Unidade do SENAI').fill('Unidade de teste');
  await page.getByLabel('Local ou espaço').fill('Quadra e2e');
  await page.getByLabel('Data', { exact: true }).fill(new Date(Date.now() + 4 * 86400000).toISOString().slice(0, 10));
  await page.getByLabel('Horário', { exact: true }).fill('18:00');
  await page.locator('select[name="calendar"]').selectOption('__novo__');
  await page.getByLabel('Nome do novo calendário (se selecionado)').fill('Interclasses e2e');
  await page.getByRole('button', { name: 'Salvar atividade' }).click();
  await expect(page.getByRole('button', { name: 'Lista', exact: true })).toBeVisible();
  await expect(page.getByLabel('Filtrar calendário')).toBeVisible();
  await page.getByRole('button', { name: 'Lista', exact: true }).click();
  await expect(page.locator('.game-table')).toContainText('Interclasses e2e');
  await page.getByRole('button', { name: 'Mesa e tabuleiro' }).click();
  await expect(page.getByText('Nenhuma atividade corresponde aos filtros.')).toBeVisible();
  await page.getByRole('group', { name: 'Categoria do calendário' }).getByRole('button', { name: 'Todas' }).click();

  await navigate(page, 'management');
  await page.locator('.management-nav').getByRole('button', { name: /Placar e pontuação/ }).click();
  await expect(page.getByRole('heading', { name: 'Placar e pontuação' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Resultado' }).first()).toBeVisible();
  await navigate(page, 'games');
  await page.getByRole('button', { name: 'Resultado' }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.locator('input[name="a0"]').fill('25');
  await page.locator('input[name="b0"]').fill('20');
  await page.locator('input[name="a1"]').fill('25');
  await page.locator('input[name="b1"]').fill('18');
  await page.getByRole('button', { name: 'Salvar resultado' }).click();
  await expect(page.locator('.toast')).toContainText('Resultado salvo.');
});
test('jogador autenticado pode inscrever-se e gerenciar o próprio perfil', async ({ page }) => {
  await page.goto('/');
  await startLogin(page);
  await login(page, 'aluno@senai.local', 'Aluno@123');
  await expect(page.getByText('Jogador', { exact: true })).toBeVisible();
  await expect(page.locator('[data-route="profile"]')).toBeVisible();
  await navigate(page, 'games');
  await expect(page.getByRole('button', { name: /Inscrever-se/ }).first()).toBeVisible();
  await expect(page.locator('[data-route="tournaments"]')).toBeVisible();
  await expect(page.locator('[data-route="history"]')).toBeVisible();
  await navigate(page, 'profile');
  await expect(page.getByRole('heading', { name: 'Dados da conta' })).toBeVisible();
  await page.getByRole('button', { name: 'Salvar perfil' }).click();
  await expect(page.locator('.toast')).toContainText('Perfil atualizado.');
  await expectNoHorizontalOverflow(page);
});

test('chaveamento de campeonato exibe os dois placares visíveis e não antecipa campeão', async ({ page }) => {
  await page.goto('/');
  await startLogin(page);
  await login(page, 'professor@senai.local', 'Professor@123');
  await navigate(page, 'tournaments');
  await page.getByRole('button', { name: '＋ Criar campeonato' }).click();
  await page.getByLabel('Nome', { exact: true }).fill('Copa Visível');
  await page.getByLabel('Data do campeonato').fill(new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10));
  await page.getByRole('button', { name: 'Criar e abrir inscrições' }).click();
  await page.evaluate(() => {
    const st = JSON.parse(localStorage.getItem('senaiSportsReactDemoV1')!);
    st.tournaments[0].teamIds = ['t1', 't2', 't3'];
    localStorage.setItem('senaiSportsReactDemoV1', JSON.stringify(st));
  });
  await page.reload();
  await navigate(page, 'tournaments');
  await page.getByRole('button', { name: 'Gerar chaveamento' }).click();
  await expect(page.locator('.tournament-card .status').first()).toHaveText('Em andamento');
  await expect(page.locator('.round').last().locator('.match-row.winner')).toHaveCount(0);
  const scoreB = page.locator('input[name="scoreB"]').first();
  await expect(scoreB).toBeVisible();
  expect(await scoreB.evaluate(el => getComputedStyle(el.parentElement!).clip)).toBe('auto');
  await page.locator('input[name="scoreA"]').first().fill('2');
  await scoreB.fill('1');
  await page.locator('.bracket-score button[type="submit"]').first().click();
  await expect(page.locator('.toast')).toContainText('Resultado do confronto salvo.');
});

test('professor e administrador entram e podem abrir as ferramentas de organização', async ({ page }) => {
  await page.goto('/');
  await startLogin(page);
  await login(page, 'professor@senai.local', 'Professor@123');
  await expect(page.locator('[data-route="createGame"]')).toBeVisible();
  await navigate(page, 'createGame');
  await expect(page.getByRole('heading', { name: 'Novo jogo ou atividade' })).toBeVisible();
  await navigate(page, 'management');
  await page.locator('.management-nav').getByRole('button', { name: 'Campeonatos' }).click();
  await expect(page.getByRole('button', { name: '＋ Criar campeonato' })).toBeVisible();

  await logout(page);
  await startLogin(page);
  await login(page, 'diretor@senai.local', 'Senai@123');
  await navigate(page, 'users');
  await expect(page.getByRole('heading', { name: 'Gestão de usuários' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
});

test('páginas principais cabem na largura do computador e do celular', async ({ page }, testInfo) => {
  await page.goto('/');
  if (testInfo.project.name === 'desktop') {
    await page.locator('.collapse-btn').click();
    await expect(page.locator('.sidebar-utility .btn svg')).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.locator('.collapse-btn').click();
  }
  for (const route of ['dashboard', 'games', 'calendar', 'teams', 'tournaments', 'history', 'howItWorks']) {
    await navigate(page, route);
    await expectNoHorizontalOverflow(page);
  }
  await navigate(page, 'calendar');
  await page.getByRole('button', { name: 'Mês', exact: true }).click();
  await expectNoHorizontalOverflow(page);

  if (testInfo.project.name === 'mobile') {
    await page.getByRole('button', { name: 'Lista', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Jogos', exact: true })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }

  await navigate(page, 'dashboard');
  await startLogin(page);
  await expectNoHorizontalOverflow(page);
  await login(page, 'diretor@senai.local', 'Senai@123');
  for (const route of ['dashboard', 'games', 'calendar', 'createGame', 'management', 'teams', 'tournaments', 'history', 'users', 'logs']) {
    await navigate(page, route);
    await expectNoHorizontalOverflow(page);
  }
  await navigate(page, 'management');
  for (const section of ['Perfil', 'Equipes', 'Campeonatos']) {
    await page.locator('.management-nav').getByRole('button', { name: new RegExp(section) }).click();
    await expectNoHorizontalOverflow(page);
  }
});
