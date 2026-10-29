import { z } from 'zod';
import { stateSchema, type DemoState } from '../types/models';
import { seed } from './seed';

// Adaptador TEMPORÁRIO da Etapa 1. Não é autenticação nem banco de produção.
// A chave antiga é apenas lida; permanece intacta para permitir voltar à demo anterior.
export const DEMO_KEY = 'senaiSportsReactDemoV1';
export const SESSION_KEY = 'senaiSportsReactSessionV1';
const legacySchema = z.object({ users: z.array(z.object({ role: z.string() }).passthrough()) }).passthrough();
const roles: Record<string, string> = { aluno: 'student', professor: 'teacher', diretor: 'director' };

export function loadDemo(storage: Pick<Storage, 'getItem'>): DemoState {
  const raw = storage.getItem(DEMO_KEY) ?? storage.getItem('senaiSportsDemoV1');
  if (!raw) return structuredClone(seed);
  const parsed = legacySchema.parse(JSON.parse(raw) as unknown);
  const state = stateSchema.parse({ ...parsed, users: parsed.users.map(user => ({ ...user, role: roles[user.role] ?? user.role })) });
  const extra = seed.users.find(user => user.id === 'u9');
  if (extra && !state.users.some(user => user.id === extra.id)) state.users.push(structuredClone(extra));
  return state;
}
export function saveDemo(state: DemoState): void {
  try { localStorage.setItem(DEMO_KEY, JSON.stringify(state)); }
  catch { throw new Error('Não foi possível salvar neste navegador. Verifique o espaço disponível e a permissão de armazenamento.'); }
}
export function loadSession(): string | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY) ?? localStorage.getItem('senaiSportsSessionV1');
    return raw ? z.object({ userId: z.string() }).parse(JSON.parse(raw) as unknown).userId : null;
  } catch { return null; }
}
export function saveSession(userId: string | null): void {
  if (userId) localStorage.setItem(SESSION_KEY, JSON.stringify({ userId }));
  else {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('senaiSportsSessionV1');
  }
}
