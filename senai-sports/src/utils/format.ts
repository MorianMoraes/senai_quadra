import type { DemoState, UserRole } from '../types/models';

export function todayISO(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function addDays(days: number): string {
  const date = new Date(); date.setDate(date.getDate() + days); return todayISO(date);
}
export const uid = (prefix: string): string => `${prefix}_${crypto.randomUUID()}`;
export const fmtDate = (date: string): string => new Intl.DateTimeFormat('pt-BR').format(new Date(`${date}T12:00:00`));
export const startTime = (date: string, time: string): number => new Date(`${date}T${time}:00`).getTime();
export const userName = (state: DemoState, id: string): string => state.users.find(user => user.id === id)?.name ?? 'Usuário';
export const teamName = (state: DemoState, id: string): string => state.teams.find(team => team.id === id)?.name ?? 'Equipe aberta';
export const roleLabel = (role: UserRole): string => ({ student: 'Aluno', teacher: 'Professor', director: 'Diretor' })[role];
export function safePhoto(value: string): string {
  try { const url = new URL(value); return ['https:', 'http:'].includes(url.protocol) ? url.href : ''; } catch { return ''; }
}
