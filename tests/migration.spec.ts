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
  await page.getByRole('button', { name: 'Sair', exact: true }).click();
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
  await page.getByLabel('Nome completo').fill('Novo Jogador');
  await page.getByLabel('Turma').fill('1º A');
  await page.getByLabel('E-mail', { exact: true }).fill(`jogador-${Date.now()}@senai.local`);
  await page.getByLabel('Senha', { exact: true }).fill('NovoJogador@123');
  await page.locator('input[name=confirm]').fill('NovoJogador@123');
  await page.getByRole('button', { name: 'Criar conta', exact: true }).click();
  await expect(page.locator('.topbar h1')).toHaveText('Jogos');
  await expect(page.getByText('Jogador', { exact: true })).toBeVisible();
});
test('jogador autenticado pode inscrever-se e gerenciar o próprio perfil', async ({ page }) => {
  await page.goto('/');
  await startLogin(page);
  await login(page, 'aluno@senai.local', 'Aluno@123');
  await expect(page.getByText('Jogador', { exact: true })).toBeVisible();
  await expect(page.locator('[data-route="profile"]')).toBeVisible();
  await navigate(page, 'games');
  await expect(page.getByRole('button', { name: /Inscrever-se/ }).first()).toBeVisible();
  await navigate(page, 'profile');
  await expect(page.getByRole('heading', { name: 'Dados da conta' })).toBeVisible();
  await expectNoHorizontalOverflow(page);
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
