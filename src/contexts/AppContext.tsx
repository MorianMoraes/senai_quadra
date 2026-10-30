import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { User as SupabaseUser } from '@supabase/supabase-js';
import type { DemoState, User } from '../types/models';
import { loadDemo, loadSession, saveDemo, saveSession } from '../demo/storage';
import { authenticate, registerGoogleStudent, registerStudent, type Registration } from '../services/auth';
import { supabase } from '../lib/supabaseClient';

interface AppContextValue {
  state: DemoState;
  user: User | null;
  message: { text: string; error: boolean } | null;
  dismiss: () => void;
  notify: (text: string, error?: boolean) => void;
  act: (action: (draft: DemoState, actorId: string) => void, success?: string) => boolean;
  login: (email: string, password: string) => boolean;
  loginWithGoogle: () => Promise<boolean>;
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
  const stateRef = useRef(state);
  const activeOAuthUserId = useRef<string | null>(null);
  const processedOAuthUserId = useRef<string | null>(null);
  const suppressOAuthSession = useRef(false);
  stateRef.current = state;

  function notify(text: string, error = false) { setMessage({ text, error }); }
  function report(error: unknown): false { notify(error instanceof Error ? error.message : 'Não foi possível concluir esta ação.', true); return false; }

  useEffect(() => {
    function applyGoogleUser(authUser: SupabaseUser) {
      if (suppressOAuthSession.current) return;
      if (processedOAuthUserId.current === authUser.id) return;
      const isGoogle = authUser.app_metadata.provider === 'google' || authUser.identities?.some(identity => identity.provider === 'google');
      const isVerified = Boolean(authUser.email_confirmed_at || authUser.user_metadata.email_verified === true);
      if (!isGoogle || !isVerified || !authUser.email || !stateRef.current) {
        activeOAuthUserId.current = null;
        processedOAuthUserId.current = null;
        suppressOAuthSession.current = true;
        saveSession(null);
        setUserId(null);
        notify(!isGoogle ? 'Esta sessão não foi autenticada pelo Google.' : 'O Google não confirmou um e-mail válido para esta conta.', true);
        queueMicrotask(() => { void supabase.auth.signOut(); });
        return;
      }

      try {
        const draft = structuredClone(stateRef.current);
        const name = authUser.user_metadata.full_name ?? authUser.user_metadata.name;
        const photo = authUser.user_metadata.avatar_url ?? authUser.user_metadata.picture;
        const account = registerGoogleStudent(draft, {
          id: authUser.id,
          email: authUser.email,
          name: typeof name === 'string' ? name : undefined,
          photo: typeof photo === 'string' ? photo : undefined,
        });
        saveDemo(draft);
        saveSession(account.id);
        stateRef.current = draft;
        setState(draft);
        setUserId(account.id);
        activeOAuthUserId.current = authUser.id;
        processedOAuthUserId.current = authUser.id;
        setMessage(null);
      } catch (error) {
        activeOAuthUserId.current = null;
        processedOAuthUserId.current = null;
        suppressOAuthSession.current = true;
        saveSession(null);
        setUserId(null);
        report(error);
        queueMicrotask(() => { void supabase.auth.signOut(); });
      }
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user && ['INITIAL_SESSION', 'SIGNED_IN', 'TOKEN_REFRESHED', 'USER_UPDATED'].includes(event)) {
        applyGoogleUser(session.user);
      } else if (event === 'SIGNED_OUT' && activeOAuthUserId.current) {
        activeOAuthUserId.current = null;
        processedOAuthUserId.current = null;
        saveSession(null);
        setUserId(null);
      }
    });

    const callbackParams = new URLSearchParams(window.location.search.slice(1));
    new URLSearchParams(window.location.hash.slice(1)).forEach((value, key) => callbackParams.set(key, value));
    const oauthError = callbackParams.get('error_code') ?? callbackParams.get('error');
    if (oauthError) {
      const description = (callbackParams.get('error_description') ?? '').toLowerCase();
      const cancelled = oauthError === 'access_denied' || description.includes('cancel');
      notify(cancelled ? 'Login com Google cancelado.' : 'Não foi possível autenticar com o Google. Tente novamente.', true);
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(url.hash.slice(1));
      for (const key of ['error', 'error_code', 'error_description', 'error_uri']) {
        url.searchParams.delete(key);
        hashParams.delete(key);
      }
      url.hash = hashParams.toString();
      window.history.replaceState(window.history.state, '', url);
    }

    return () => subscription.unsubscribe();
  }, []);

  if (!state) return <main className="auth-card-wrap"><div className="card"><h1>Dados indisponíveis</h1><p role="alert">{initial.error}</p><button className="btn btn-primary" onClick={() => location.reload()}>Tentar novamente</button></div></main>;
  const currentState = state;
  const user = state.users.find(item => item.id === userId) ?? null;

  function discardOAuthSession() {
    suppressOAuthSession.current = true;
    activeOAuthUserId.current = null;
    processedOAuthUserId.current = null;
    void supabase.auth.signOut();
  }

  function act(action: (draft: DemoState, actorId: string) => void, success?: string): boolean {
    try {
      if (!user || user.suspended) throw new Error('Sua conta não pode executar esta ação.');
      const draft = structuredClone(currentState); action(draft, user.id); saveDemo(draft); stateRef.current = draft; setState(draft);
      if (success) notify(success); return true;
    } catch (error) { return report(error); }
  }
  function login(email: string, password: string): boolean {
    const key = email.trim().toLowerCase(), attempt = attempts[key] ?? { count: 0, until: 0 };
    try {
      if (attempt.until > Date.now()) throw new Error('Muitas tentativas. Tente novamente em 15 minutos.');
      const account = authenticate(currentState, email, password);
      discardOAuthSession(); saveSession(account.id); setUserId(account.id); setMessage(null);
      setAttempts({ ...attempts, [key]: { count: 0, until: 0 } }); return true;
    } catch (error) {
      const count = attempt.count + 1;
      setAttempts({ ...attempts, [key]: { count, until: count >= 5 ? Date.now() + 15 * 60_000 : 0 } }); return report(error);
    }
  }
  async function loginWithGoogle(): Promise<boolean> {
    try {
      suppressOAuthSession.current = false;
      const redirectTo = new URL(import.meta.env.BASE_URL, window.location.origin).href;
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo } });
      if (error) throw error;
      return true;
    } catch (error) { return report(error); }
  }
  function register(input: Registration): boolean {
    try {
      const draft = structuredClone(currentState), account = registerStudent(draft, input);
      discardOAuthSession(); saveDemo(draft); saveSession(account.id); stateRef.current = draft; setState(draft); setUserId(account.id); notify('Conta de aluno criada com sucesso.'); return true;
    } catch (error) { return report(error); }
  }
  function logout() {
    try {
      suppressOAuthSession.current = true;
      activeOAuthUserId.current = null;
      processedOAuthUserId.current = null;
      saveSession(null); setUserId(null); setMessage(null);
      void supabase.auth.signOut();
    } catch (error) { report(error); }
  }
  return <AppContext.Provider value={{ state, user, message, dismiss: () => setMessage(null), notify, act, login, loginWithGoogle, register, logout }}>{children}</AppContext.Provider>;
}
export function useApp(): AppContextValue {
  const context = useContext(AppContext);
  if (!context) throw new Error('AppProvider não encontrado.');
  return context;
}
