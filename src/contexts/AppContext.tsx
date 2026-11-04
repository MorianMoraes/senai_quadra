import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DemoState, User } from '../types/models';
import { DEMO_KEY, loadDemo, loadSession, saveDemo, saveSession } from '../demo/storage';
import { authenticate, registerStudent } from '../services/auth';
import { supabase } from '../lib/supabaseClient';
import { stateSchema } from '../types/models';
import { passwordScore, requireName } from '../utils/validation';

interface AppContextValue {
  state: DemoState; user: User | null; message: { text: string; error: boolean } | null;
  loading: boolean; remote: boolean; dismiss: () => void; notify: (text: string, error?: boolean) => void;
  act: (action: (draft: DemoState, actorId: string) => void, success?: string) => boolean;
  login: (email: string, password: string) => Promise<boolean>; signUp: (name: string, email: string, turma: string, password: string, confirm: string) => Promise<boolean>; logout: () => void;
  migrateLocalData: () => Promise<boolean>;
}
const AppContext = createContext<AppContextValue | null>(null);
const emptyState: DemoState = { users: [], teams: [], games: [], tournaments: [], stats: [], logs: [] };

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    const details = 'details' in error && typeof error.details === 'string' ? error.details : '';
    const hint = 'hint' in error && typeof error.hint === 'string' ? error.hint : '';
    return [error.message, details, hint].filter(Boolean).join(' ');
  }
  return fallback;
}

function profileFromRow(row: Record<string, unknown>): User {
  return {
    id: String(row.id), role: row.role === 'director' || row.role === 'teacher' ? row.role : 'student',
    name: String(row.name ?? row.nome ?? ''), email: String(row.email ?? ''), password: '', turma: String(row.turma ?? ''),
    idade: Number(row.idade ?? 0), matricula: String(row.matricula ?? ''), photo: String(row.photo ?? row.avatar_url ?? ''), suspended: Boolean(row.suspended),
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const remote = Boolean(supabase);
  const [localInit] = useState(() => {
    if (remote) return { value: emptyState, error: '' };
    try { return { value: loadDemo(localStorage), error: '' }; }
    catch { return { value: emptyState, error: 'Não foi possível ler os dados locais. Verifique o armazenamento do navegador.' }; }
  });
  const [state, setState] = useState<DemoState>(localInit.value);
  const [userId, setUserId] = useState<string | null>(() => remote ? null : loadSession());
  const [loading, setLoading] = useState(remote);
  const [message, setMessage] = useState<AppContextValue['message']>(null);
  const [initialError, setInitialError] = useState('');
  const [attempts, setAttempts] = useState<Record<string, { count: number; until: number }>>({});

  const notify = (text: string, error = false) => setMessage({ text, error });
  const report = (error: unknown): false => { notify(error instanceof Error ? error.message : 'Não foi possível concluir esta ação.', true); return false; };

  async function loadRemoteState() {
    if (!supabase) return;
    const [sports, profiles, logs] = await Promise.all([
      supabase.from('sports_state').select('payload').eq('id', 1).maybeSingle(),
      supabase.from('public_profiles').select('*'),
      supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(500),
    ]);
    if (sports.error) throw sports.error;
    if (profiles.error) throw profiles.error;
    // Logs are deliberately private; only directors can read them.
    let profileRows = (profiles.data ?? []) as Record<string, unknown>[];
    const { data: authData } = await supabase.auth.getUser();
    if (authData.user) {
      const own = await supabase.from('profiles').select('*').eq('id', authData.user.id).maybeSingle();
      if (!own.error && own.data) profileRows = profileRows.map(row => row.id === own.data.id ? { ...row, ...own.data, email: authData.user!.email } : row);
      if (own.data?.role === 'director') {
        const all = await supabase.from('profiles').select('*');
        if (!all.error) profileRows = (all.data ?? []).map(row => ({ ...row, email: row.email }));
      }
    }
    const remoteProfiles = profileRows.map(row => profileFromRow(row));
    const payload = (sports.data?.payload ?? {}) as Record<string, unknown>;
    const next = stateSchema.parse({ ...emptyState, ...payload, users: remoteProfiles,
      logs: logs.error ? [] : (logs.data ?? []).map(row => ({ id: String(row.id), actorId: row.actor_id, action: row.action, createdAt: row.created_at })) });
    setState(next);
  }

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    let alive = true;
    void (async () => {
      try {
        const { data: { session }, error } = await supabase!.auth.getSession();
        if (error) throw error;
        if (session?.user) setUserId(session.user.id);
        await loadRemoteState();
      } catch (error) {
        console.error('Falha ao carregar dados do Supabase:', error);
        if (alive) setInitialError(errorMessage(error, 'Erro ao carregar dados do Supabase.'));
      }
      finally { if (alive) setLoading(false); }
    })();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user.id ?? null);
      if (session?.user) window.setTimeout(() => { void loadRemoteState().catch(error => notify(error.message, true)); }, 0);
    });
    return () => { alive = false; subscription.unsubscribe(); };
  }, []);

  const user = useMemo(() => state.users.find(item => item.id === userId) ?? null, [state.users, userId]);

  function act(action: (draft: DemoState, actorId: string) => void, success?: string): boolean {
    try {
      if (!user || user.suspended) throw new Error('Sua conta não pode executar esta ação.');
      const draft = structuredClone(state); action(draft, user.id);
      if (!supabase) { saveDemo(draft); setState(draft); if (success) notify(success); return true; }
      const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
      if (user.role === 'student') {
        const newTeams = draft.teams.filter(team => !state.teams.some(old => old.id === team.id));
        const otherStateSame = same(draft.games, state.games) && same(draft.tournaments, state.tournaments) && same(draft.stats, state.stats);
        if (newTeams.length === 1 && draft.teams.length === state.teams.length + 1 && otherStateSame && state.teams.every(old => same(draft.teams.find(item => item.id === old.id), old)) && newTeams[0]?.creatorId === user.id) {
          const newTeam = newTeams[0];
          void (async () => {
            const { error } = await supabase!.rpc('player_create_team', { team_id: newTeam.id, team_name: newTeam.name, team_sport: newTeam.sport });
            if (error) throw error; await loadRemoteState(); if (success) notify(success);
          })().catch((error: unknown) => report(error));
          return true;
        }
        if (otherStateSame && same(draft.teams, state.teams) && draft.games.length === state.games.length) {
          const changedGames = state.games.filter(old => !same(draft.games.find(item => item.id === old.id), old));
          if (changedGames.length === 1) {
            const before = changedGames[0]!, after = draft.games.find(item => item.id === before.id)!;
            const { participantIds: _beforeIds, ...beforeGame } = before; const { participantIds: _afterIds, ...afterGame } = after;
            const added = after.participantIds.filter(id => !before.participantIds.includes(id));
            const removed = before.participantIds.filter(id => !after.participantIds.includes(id));
            if (same(beforeGame, afterGame) && added.length === 1 && added[0] === user.id && removed.length === 0 || same(beforeGame, afterGame) && removed.length === 1 && removed[0] === user.id && added.length === 0) {
              const procedure = added.length ? 'player_join_game' : 'player_leave_game';
              void (async () => { const { error } = await supabase!.rpc(procedure, { target_game_id: before.id }); if (error) throw error; await loadRemoteState(); if (success) notify(success); })().catch((error: unknown) => report(error));
              return true;
            }
          }
        }
        if (same(draft.games, state.games) && same(draft.tournaments, state.tournaments) && same(draft.stats, state.stats) && draft.teams.length === state.teams.length) {
          const changedTeams = state.teams.filter(old => !same(draft.teams.find(item => item.id === old.id), old));
          if (changedTeams.length === 1) {
            const before = changedTeams[0]!, after = draft.teams.find(item => item.id === before.id)!;
            const { memberIds: _beforeIds, reserveIds: _beforeReserves, ...beforeTeam } = before; const { memberIds: _afterIds, reserveIds: _afterReserves, ...afterTeam } = after;
            const added = after.memberIds.filter(id => !before.memberIds.includes(id));
            if (same(beforeTeam, afterTeam) && added.length === 1 && added[0] === user.id && before.memberIds.length + 1 === after.memberIds.length) {
              void (async () => { const { error } = await supabase!.rpc('player_join_team', { target_team_id: before.id }); if (error) throw error; await loadRemoteState(); if (success) notify(success); })().catch((error: unknown) => report(error));
              return true;
            }
            if (same(beforeTeam, afterTeam) && before.creatorId === user.id && (!same(before.memberIds, after.memberIds) || !same(before.reserveIds, after.reserveIds))) {
              void (async () => { const { error } = await supabase!.rpc('player_set_team_roster', { target_team_id: before.id, requested_members: after.memberIds, requested_reserves: after.reserveIds }); if (error) throw error; await loadRemoteState(); if (success) notify(success); })().catch((error: unknown) => report(error));
              return true;
            }
          }
        }
      }
      const changedAccount = draft.users.find(item => {
        const previous = state.users.find(old => old.id === item.id);
        return previous && (previous.suspended !== item.suspended || previous.role !== item.role);
      });
      if (changedAccount) {
        if (user.role !== 'director' || changedAccount.role !== 'student' && changedAccount.role !== 'teacher') throw new Error('Somente administradores podem alterar o acesso desta conta.');
        void (async () => {
          const { error } = await supabase!.rpc('set_profile_suspension', { target_id: changedAccount.id, next_suspended: changedAccount.suspended });
          if (error) throw error;
          const logResult = await supabase!.from('activity_logs').insert({ actor_id: user.id, action: success ?? 'Alterou o acesso de uma conta' });
          if (logResult.error) throw logResult.error;
          setState(current => ({ ...current, users: current.users.map(item => item.id === changedAccount.id ? { ...item, suspended: changedAccount.suspended } : item), logs: draft.logs }));
          if (success) notify(success);
        })().catch((error: unknown) => report(error));
        return true;
      }
      const changedUser = draft.users.find(item => item.id === user.id);
      if (changedUser && (changedUser.name !== user.name || changedUser.turma !== user.turma || changedUser.photo !== user.photo)) {
        void (async () => {
          const { error } = await supabase!.rpc('update_own_profile', { next_name: changedUser.name, next_turma: changedUser.turma, next_photo: changedUser.photo });
          if (error) throw error;
          setState(current => ({ ...current, users: current.users.map(item => item.id === user.id ? { ...item, ...changedUser } : item) }));
          if (success) notify(success);
        })().catch((error: unknown) => report(error));
        return true;
      }
      // Never persist authentication credentials or administrative logs in the shared sports document.
      const { users: _users, logs: _logs, ...payload } = draft;
      void (async () => {
        const { error } = await supabase!.rpc('save_sports_state', { next_payload: payload });
        if (error) throw error;
        setState(draft); if (success) notify(success);
        const logResult = await supabase!.from('activity_logs').insert({ actor_id: user.id, action: success ?? 'Atualizou dados esportivos' });
        if (logResult.error && user.role === 'director') notify(logResult.error.message, true);
      })().catch((error: unknown) => report(error));
      return true;
    } catch (error) { return report(error); }
  }

  async function login(email: string, password: string): Promise<boolean> {
    const key = email.trim().toLowerCase(), attempt = attempts[key] ?? { count: 0, until: 0 };
    try {
      if (attempt.until > Date.now()) throw new Error('Muitas tentativas. Tente novamente em 15 minutos.');
      if (!supabase) {
        const account = authenticate(state, email, password); saveSession(account.id); setUserId(account.id); setMessage(null); return true;
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email: key, password });
      if (error) throw error;
      if (!data.user) throw new Error('O Supabase não retornou uma sessão válida.');
      const { data: row, error: profileError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      if (profileError) throw profileError;
      const account = profileFromRow({ ...row, email: data.user.email });
      setState(current => ({ ...current, users: [...current.users.filter(item => item.id !== account.id), account] }));
      if (account.suspended) { await supabase.auth.signOut(); throw new Error('Esta conta está suspensa.'); }
      setUserId(account.id); setMessage(null); setAttempts({ ...attempts, [key]: { count: 0, until: 0 } }); return true;
    } catch (error) {
      const count = attempt.count + 1;
      setAttempts({ ...attempts, [key]: { count, until: count >= 5 ? Date.now() + 15 * 60_000 : 0 } }); return report(error);
    }
  }
  async function signUp(name: string, email: string, turma: string, password: string, confirm: string): Promise<boolean> {
    try {
      if (password !== confirm) throw new Error('As senhas não coincidem.');
      if (!passwordScore(password).valid) throw new Error('A senha ainda não atende a todos os requisitos.');
      const cleanName = requireName(name), cleanEmail = email.trim().toLowerCase(), cleanTurma = turma.trim();
      if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Informe um e-mail válido.');
      if (!cleanTurma) throw new Error('Informe sua turma.');
      if (!supabase) {
        const draft = structuredClone(state);
        const account = registerStudent(draft, { name, email, turma, password, confirm, photo: '' });
        saveDemo(draft); saveSession(account.id); setState(draft); setUserId(account.id); setMessage({ text: 'Conta de jogador criada.', error: false });
        return true;
      }
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail, password,
        options: { data: { name: cleanName, turma: cleanTurma }, emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}` },
      });
      if (error) throw error;
      if (!data.user) throw new Error('O Supabase não confirmou a criação da conta.');
      if (data.session) {
        setUserId(data.user.id);
        await loadRemoteState();
        notify('Conta de jogador criada.');
      } else {
        notify('Conta criada. Confira seu e-mail para confirmar o cadastro e depois entre no sistema.');
      }
      return true;
    } catch (error) { return report(error); }
  }
  function logout() { if (supabase) void supabase.auth.signOut(); else saveSession(null); setUserId(null); setMessage(null); }
  async function migrateLocalData(): Promise<boolean> {
    if (!supabase || user?.role !== 'director') return report(new Error('Somente um administrador conectado ao Supabase pode migrar dados locais.'));
    try {
      if (!localStorage.getItem(DEMO_KEY) && !localStorage.getItem('senaiSportsDemoV1')) throw new Error('Não há dados locais para migrar neste navegador.');
      const local = loadDemo(localStorage);
      const { data: rows, error } = await supabase.from('profiles').select('id,email,role');
      if (error) throw error;
      const byEmail = new Map((rows ?? []).map(row => [String(row.email).trim().toLowerCase(), String(row.id)]));
      const userIds = new Map<string, string>();
      for (const person of local.users) {
        const mapped = byEmail.get(person.email.trim().toLowerCase());
        if (!mapped) throw new Error(`A conta ${person.email} precisa ser criada no Supabase Auth antes da migração. Nenhum dado local foi removido.`);
        const remoteAccount = rows?.find(row => String(row.id) === mapped);
        if (remoteAccount?.role !== person.role) throw new Error(`A conta ${person.email} precisa receber o perfil ${person.role} no Supabase antes da migração. Nenhum dado local foi removido.`);
        userIds.set(person.id, mapped);
      }
      const prefix = (id: string) => `legacy_${id}`;
      const imported = {
        teams: local.teams.map(team => ({ ...team, id: prefix(team.id), creatorId: userIds.get(team.creatorId)!, teacherIds: team.teacherIds.map(id => userIds.get(id)!), memberIds: team.memberIds.map(id => userIds.get(id)!), reserveIds: team.reserveIds.map(id => userIds.get(id)!) })),
        games: local.games.map(game => ({ ...game, id: prefix(game.id), team1: game.team1 ? prefix(game.team1) : '', team2: game.team2 ? prefix(game.team2) : '', createdBy: userIds.get(game.createdBy)!, participantIds: game.participantIds.map(id => userIds.get(id)!) })),
        tournaments: local.tournaments.map(tournament => ({ ...tournament, id: prefix(tournament.id), createdBy: userIds.get(tournament.createdBy) ?? '', teamIds: tournament.teamIds.map(prefix), rounds: tournament.rounds.map(round => round.map(match => ({ ...match, a: prefix(match.a), b: prefix(match.b), winner: match.winner ? prefix(match.winner) : '' }))), registrations: tournament.registrations.map(registration => ({ ...registration, teamId: prefix(registration.teamId), leaderId: userIds.get(registration.leaderId)!, memberIds: registration.memberIds.map(id => userIds.get(id)!) })) })),
        stats: local.stats.map(stat => ({ ...stat, userId: userIds.get(stat.userId)! })),
      };
      const merged = {
        teams: [...state.teams, ...imported.teams.filter(item => !state.teams.some(current => current.id === item.id))],
        games: [...state.games, ...imported.games.filter(item => !state.games.some(current => current.id === item.id))],
        tournaments: [...state.tournaments, ...imported.tournaments.filter(item => !state.tournaments.some(current => current.id === item.id))],
        stats: [...state.stats, ...imported.stats.filter(item => !state.stats.some(current => current.userId === item.userId))],
        logs: local.logs.map(log => ({ legacyId: log.id, actorId: userIds.get(log.actorId), action: log.action, createdAt: log.createdAt })),
      };
      const result = await supabase.rpc('import_legacy_sports_state', { next_payload: merged });
      if (result.error) throw result.error;
      await loadRemoteState();
      notify('Migração concluída. Os dados locais originais foram preservados.'); return true;
    } catch (error) { return report(error); }
  }

  if (loading) return <main className="auth-card-wrap"><div className="card" role="status">Conectando ao Supabase…</div></main>;
  if (localInit.error) return <main className="auth-card-wrap"><div className="card"><h1>Dados locais indisponíveis</h1><p role="alert">{localInit.error}</p><button className="btn btn-primary" onClick={() => location.reload()}>Tentar novamente</button></div></main>;
  if (initialError) return <main className="auth-card-wrap"><div className="card"><h1>Dados indisponíveis</h1><p role="alert">{initialError}</p><button className="btn btn-primary" onClick={() => location.reload()}>Tentar novamente</button></div></main>;
  return <AppContext.Provider value={{ state, user, message, loading, remote, dismiss: () => setMessage(null), notify, act, login, signUp, logout, migrateLocalData }}>{children}</AppContext.Provider>;
}
export function useApp(): AppContextValue { const context = useContext(AppContext); if (!context) throw new Error('AppProvider não encontrado.'); return context; }
