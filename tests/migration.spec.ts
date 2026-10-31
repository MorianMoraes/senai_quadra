import { test, expect, type Page } from '@playwright/test';

async function login(page: Page, email: string, password: string) {
  await page.getByLabel('E-mail', { exact: true }).fill(email);
  await page.getByLabel('Senha', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.locator('.topbar h1')).toHaveText('Início');
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

test('visitantes consultam a agenda e o histórico direciona para o login', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('status')).toContainText('Supabase não configurado');
  await expect(page.getByRole('heading', { name: 'Próximos jogos' })).toBeVisible();
  await expect(page.locator('[data-route="history"]')).toHaveCount(0);
  await expect(page.getByText('Histórico de partidas')).toHaveCount(0);

  await navigate(page, 'howItWorks');
  await expect(page.getByRole('heading', { name: 'Visitante', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Representante de equipe' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Administrador', exact: true })).toBeVisible();

  await navigate(page, 'calendar');
  await page.getByRole('button', { name: 'Lista', exact: true }).click();
  const finishedGame = page.locator('.game-table tr').filter({ hasText: 'finalizado' }).first();
  await finishedGame.getByRole('button', { name: 'Detalhes' }).click();
  await expect(page.getByText('Placar detalhado disponível após o login.')).toBeVisible();
  await expect(page.getByText('Set 1')).toHaveCount(0);
  await page.getByRole('button', { name: 'Fechar janela' }).click();

  await navigate(page, 'teams');
  await page.getByRole('button', { name: 'Ver equipe' }).first().click();
  await expect(page.getByText('Informações gerais da equipe. Faça login para consultar detalhes do elenco e do desempenho.')).toBeVisible();
  await expect(page.getByText('Jogadores (')).toHaveCount(0);
  await page.getByRole('button', { name: 'Fechar janela' }).click();

  await navigate(page, 'howItWorks');
  await page.getByRole('button', { name: 'Entrar para ver o histórico' }).click();
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
  await expect(page.getByText('Histórico de partidas')).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test('representante autenticado acessa o histórico e só edita a própria equipe', async ({ page }) => {
  await page.goto('/');
  await startLogin(page);
  await login(page, 'aluno@senai.local', 'Aluno@123');
  await expect(page.getByText('Representante de equipe', { exact: true })).toBeVisible();
  await navigate(page, 'history');
  await expect(page.getByRole('heading', { name: 'Histórico de partidas' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ranking de alunos' })).toBeVisible();
  await navigate(page, 'management');
  await page.getByRole('button', { name: /Equipes/ }).click();
  const ownTeam = page.locator('.team-card').filter({ has: page.getByRole('heading', { name: 'Fênix Azul' }) });
  const otherTeam = page.locator('.team-card').filter({ has: page.getByRole('heading', { name: 'Impacto' }) });
  await expect(ownTeam.getByRole('button', { name: 'Montar time' })).toBeVisible();
  await expect(otherTeam.getByRole('button', { name: 'Montar time' })).toHaveCount(0);
  await expectNoHorizontalOverflow(page);
});

test('professor e administrador entram e podem abrir as ferramentas de organização', async ({ page }) => {
  await page.goto('/');
  await startLogin(page);
  await login(page, 'professor@senai.local', 'Professor@123');
  await expect(page.locator('[data-route="createGame"]')).toBeVisible();
  await navigate(page, 'createGame');
  await expect(page.getByRole('heading', { name: 'Novo jogo' })).toBeVisible();
  await navigate(page, 'management');
  await page.getByRole('button', { name: /Campeonatos/ }).click();
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
  for (const route of ['dashboard', 'calendar', 'teams', 'tournaments', 'howItWorks']) {
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
  for (const route of ['dashboard', 'calendar', 'createGame', 'management', 'history', 'howItWorks', 'users', 'logs']) {
    await navigate(page, route);
    await expectNoHorizontalOverflow(page);
  }
  await navigate(page, 'management');
  for (const section of ['Perfil', 'Equipes', 'Campeonatos']) {
    await page.getByRole('button', { name: new RegExp(section) }).click();
    await expectNoHorizontalOverflow(page);
  }
});
