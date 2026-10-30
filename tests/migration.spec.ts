import { test, expect, type Page } from '@playwright/test';

async function login(page: Page, role: 'aluno' | 'professor' | 'diretor') {
  await expect(page.getByRole('button', { name: 'Continuar com Google' })).toBeVisible();
  await page.getByLabel('E-mail', { exact: true }).fill(`${role}@senai.local`);
  await page.getByLabel('Senha', { exact: true }).fill(({ aluno: 'Aluno@123', professor: 'Professor@123', diretor: 'Senai@123' })[role]);
  await page.getByRole('button', { name: 'Entrar', exact: true }).click();
  await expect(page.locator('.topbar h1')).toHaveText('Início');
}
async function openMenu(page: Page) {
  const menu = page.getByRole('button', { name: 'Abrir menu' });
  if (await menu.isVisible() && await menu.getAttribute('aria-expanded') === 'false') await menu.click();
}
async function navigate(page: Page, route: string) {
  await openMenu(page); await page.locator(`[data-route="${route}"]`).click();
}
async function logout(page: Page) { await openMenu(page); await page.getByRole('button', { name: 'Sair', exact: true }).click(); }
async function managementSection(page: Page, label: string) { await navigate(page, 'management'); await page.getByRole('button', { name: new RegExp(label) }).click(); }

test('professor cria campeonato e líder inscreve seis jogadores; navegação e persistência', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await login(page, 'professor');
  const teacherRoutes = await page.locator('.nav button').evaluateAll(buttons => buttons.map(button => button.getAttribute('data-route')));
  expect(teacherRoutes.indexOf('createGame')).toBe(teacherRoutes.indexOf('calendar') + 1);
  await expect(page.locator('[data-route="ranking"]')).toHaveCount(0);
  await navigate(page, 'createGame');
  const playerLimit = page.getByLabel('Limite de jogadores');
  await expect(playerLimit).toHaveAttribute('max', '20');
  await expect(playerLimit).toHaveValue('20');
  await expect(page.getByLabel('Duração (min)')).toHaveValue('90');
  await expect(page.getByText(/até 20 jogadores e dura no máximo 90 minutos/)).toBeVisible();
  await playerLimit.fill('21');
  expect(await playerLimit.evaluate((input: HTMLInputElement) => input.checkValidity())).toBe(false);
  await navigate(page, 'management');
  await managementSection(page, 'Campeonatos'); await page.getByRole('button', { name: '＋ Criar campeonato' }).click();
  await page.getByLabel('Nome', { exact: true }).fill('Copa SENAI React');
  const date = new Date(); date.setDate(date.getDate() + 7);
  await page.getByLabel('Data do campeonato').fill(date.toISOString().slice(0, 10));
  await page.getByRole('button', { name: 'Criar e abrir inscrições' }).click();
  await expect(page.getByRole('heading', { name: 'Copa SENAI React' })).toBeVisible();
  await logout(page); await login(page, 'aluno');
  await expect(page.locator('[data-route="createGame"]')).toHaveCount(0);
  await managementSection(page, 'Equipes');
  await page.locator('.team-card').filter({ has: page.getByRole('heading', { name: 'Fênix Azul' }) }).getByRole('button', { name: 'Montar time' }).click();
  await page.getByLabel('Posição de Prof. Rafael').selectOption('');
  for (const name of ['Maria Costa', 'Lucas Souza', 'Ana Lima', 'Pedro Alves', 'Beatriz Santos']) await page.getByLabel(`Posição de ${name}`).selectOption('member');
  await page.getByRole('button', { name: 'Salvar elenco' }).click();
  await managementSection(page, 'Campeonatos'); await page.getByRole('button', { name: 'Inscrever time com 6 jogadores' }).click();
  await expect(page.getByRole('button', { name: 'Time inscrito' })).toBeDisabled();
  await expect(page.getByText('6/6 inscritos', { exact: true })).toBeVisible();
  await page.reload(); await managementSection(page, 'Campeonatos');
  await expect(page.getByRole('button', { name: 'Time inscrito' })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('campeonatos.png'), fullPage: true });
  await navigate(page, 'calendar');
  await expect(page.getByRole('heading', { name: 'Uma visão clara de cada partida.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lista', exact: true })).toHaveAttribute('aria-pressed', testInfo.project.name === 'mobile' ? 'true' : 'false');
  await page.getByRole('button', { name: 'Lista' }).click();
  await expect(page.getByRole('heading', { name: 'Jogos e eventos' })).toBeVisible();
  await page.getByLabel('Filtrar por quadra').selectOption('Quadra SENAI');
  await page.getByRole('button', { name: 'Mês', exact: true }).click();
  for (const route of ['dashboard', 'calendar', 'history']) await navigate(page, route);
  await expect(page.getByRole('heading', { name: 'Ranking', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Ranking de alunos' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Histórico de partidas' })).toBeVisible();
  if (testInfo.project.name === 'desktop') {
    await page.getByRole('button', { name: 'Recolher menu' }).click();
    await expect(page.getByRole('button', { name: 'Alternar tema' })).toBeVisible();
    await page.getByRole('button', { name: 'Expandir menu' }).click();
  }
  const currentTheme = await page.locator('html').getAttribute('data-theme');
  await openMenu(page); await page.getByRole('button', { name: 'Alternar tema' }).click();
  const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
  await expect(page.locator('html')).toHaveAttribute('data-theme', nextTheme);
  await page.reload(); await expect(page.locator('html')).toHaveAttribute('data-theme', nextTheme);
  await expect(page.getByRole('button', { name: 'Notificações' })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await logout(page); await login(page, 'diretor');
  await expect(page.locator('[data-route="createGame"]')).toHaveCount(0);
  await navigate(page, 'users'); await expect(page.getByRole('heading', { name: 'Gestão de usuários' })).toBeVisible();
  await navigate(page, 'logs'); await expect(page.getByRole('heading', { name: 'Logs do sistema' })).toBeVisible();
  expect(errors).toEqual([]);
});

test('cadastro somente aluno e perfil editável em React', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: 'Criar conta' }).click();
  await expect(page.getByRole('button', { name: 'Continuar com Google' })).toBeVisible();
  await expect(page.getByLabel('Perfil', { exact: true })).toHaveValue('Aluno');
  await expect(page.getByLabel('Perfil', { exact: true })).toHaveAttribute('readonly', '');
  await page.getByLabel('Nome completo').fill('Aluno de Teste');
  await page.getByLabel('E-mail').fill('teste@example.com');
  await page.getByLabel('Turma').fill('2º A'); await page.getByLabel('Idade').fill('16');
  await page.getByLabel('Matrícula').fill('TESTE001');
  await page.getByLabel('Senha', { exact: true }).fill('Teste@123');
  await page.getByLabel('Confirmar senha', { exact: true }).fill('Teste@123');
  await page.getByRole('button', { name: 'Cadastrar', exact: true }).click();
  await expect(page.locator('.topbar h1')).toHaveText('Início');
  await managementSection(page, 'Perfil'); await page.getByLabel('Nome completo').fill('Aluno Atualizado');
  await page.getByRole('button', { name: 'Salvar perfil' }).click();
  await expect(page.getByRole('heading', { name: 'Aluno Atualizado' })).toBeVisible();
});

test('mostra o cancelamento do retorno OAuth do Google', async ({ page }) => {
  await page.goto('/?error=access_denied&error_description=User%20canceled');
  await expect(page.getByRole('alert')).toContainText('Login com Google cancelado.');
  await expect(page).toHaveURL('/');
});
