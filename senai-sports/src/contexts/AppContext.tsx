import { createContext, useContext, useState, type ReactNode } from 'react';
import type { DemoState, User } from '../types/models';
import { loadDemo, loadSession, saveDemo, saveSession } from '../demo/storage';
import { authenticate, registerStudent, type Registration } from '../services/auth';

interface AppContextValue {
  state: DemoState;
  user: User | null;
  message: { text: string; error: boolean } | null;
  dismiss: () => void;
  notify: (text: string, error?: boolean) => void;
  act: (action: (draft: DemoState, actorId: string) => void, success?: string) => boolean;
  login: (email: string, password: string) => boolean;
  register: (input: Registration) => boolean;
  logout: () => void;
}
const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [initial] = useState(() => {
    try { return { state: loadDemo(localStorage), error: '' }; }
    catch { return { state: null, error: 'Não foi possível ler os dados locais. Eles foram preservados. Verifique o armazenamento do navegador ou restaure um backup válido.' }; }
  });
  const [state, setState] = useState(initial.state);
  const [userId, setUserId] = useState(loadSession);
  const [message, setMessage] = useState<AppContextValue['message']>(null);
  const [attempts, setAttempts] = useState<Record<string, { count: number; until: number }>>({});
  function notify(text: string, error = false) { setMessage({ text, error }); }
  function report(error: unknown): false { notify(error instanceof Error ? error.message : 'Não foi possível concluir esta ação.', true); return false; }
  if (!state) return <main className="auth-card-wrap"><div className="card"><h1>Dados indisponíveis</h1><p role="alert">{initial.error}</p><button className="btn btn-primary" onClick={() => location.reload()}>Tentar novamente</button></div></main>;
  const currentState = state;
  const user = state.users.find(item => item.id === userId) ?? null;
  function act(action: (draft: DemoState, actorId: string) => void, success?: string): boolean {
    try {
      if (!user || user.suspended) throw new Error('Sua conta não pode executar esta ação.');
      const draft = structuredClone(currentState); action(draft, user.id); saveDemo(draft); setState(draft);
      if (success) notify(success); return true;
    } catch (error) { return report(error); }
  }
  function login(email: string, password: string): boolean {
    const key = email.trim().toLowerCase(), attempt = attempts[key] ?? { count: 0, until: 0 };
    try {
      if (attempt.until > Date.now()) throw new Error('Muitas tentativas. Tente novamente em 15 minutos.');
      const account = authenticate(currentState, email, password); saveSession(account.id); setUserId(account.id); setMessage(null);
      setAttempts({ ...attempts, [key]: { count: 0, until: 0 } }); return true;
    } catch (error) {
      const count = attempt.count + 1;
      setAttempts({ ...attempts, [key]: { count, until: count >= 5 ? Date.now() + 15 * 60_000 : 0 } }); return report(error);
    }
  }
  function register(input: Registration): boolean {
    try {
      const draft = structuredClone(currentState), account = registerStudent(draft, input);
      saveDemo(draft); saveSession(account.id); setState(draft); setUserId(account.id); notify('Conta de aluno criada com sucesso.'); return true;
    } catch (error) { return report(error); }
  }
  function logout() {
    try { saveSession(null); setUserId(null); setMessage(null); }
    catch (error) { report(error); }
  }
  return <AppContext.Provider value={{ state, user, message, dismiss: () => setMessage(null), notify, act, login, register, logout }}>{children}</AppContext.Provider>;
}
export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('AppProvider não encontrado.');
  return context;
}
