import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { DemoState, User } from '../types/models';
import { DEMO_KEY, loadDemo, loadSession, saveDemo, saveSession } from '../demo/storage';
import { authenticate } from '../services/auth';
import { supabase } from '../lib/supabaseClient';
import { stateSchema } from '../types/models';
import { passwordScore, requireName } from '../utils/validation';
import { uid } from '../utils/format';

interface AppContextValue {
  state: DemoState; user: User | null; message: { text: string; error: boolean } | null;
  loading: boolean; remote: boolean; dismiss: () => void; notify: (text: string, error?: boolean) => void;
  act: (action: (draft: DemoState, actorId: string) => void, success?: string) => boolean;
  actAsync: (action: (draft: DemoState, actorId: string) => void, success?: string) => Promise<boolean>;
  login: (email: string, password: string) => Promise<boolean>; signUp: (name: string, email: string, turma: string, password: string, confirm: string) => Promise<boolean>; reviewTeacherRequest: (userId: string, approve: boolean) => Promise<boolean>; logout: () => void;
  migrateLocalData: () => Promise<boolean>;
}
const AppContext = createContext<AppContextValue | null>(null);
const emptyState: DemoState = { users: [], teams: [], games: [], tournaments: [], stats: [], standings: [], cards: [], scorers: [], tournamentNotes: [], players: [], logs: [], accountRequests: [] };

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'object' && error !== null && 'message' in error && typeof error.message === 'string') {
    const details = 'details' in error && typeof error.details === 'string' ? error.details : '';
    const hint = 'hint' in error && typeof error.hint === 'string' ? error.hint : '';
    return [error.message, details, hint].filter(Boolean).join(' ');
  }
  return fallback;
}

function localizeAuthError(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('invalid login credentials')) return 'E-mail ou senha inválidos.';
  if (lower.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (lower.includes('user already registered')) return 'Este e-mail já está cadastrado.';
  if (lower.includes('over_email_send_rate_limit') || lower.includes('rate limit')) return 'Muitas solicitações em sequência. Aguarde um pouco e tente novamente.';
  return msg;
}

function profileFromRow(row: Record<string, unknown>): User {
  return {
    id: String(row.id), role: row.role === 'sesi' || row.role === 'director' || row.role === 'teacher' ? row.role : 'student',
    name: String(row.name ?? row.nome ?? ''), email: String(row.email ?? ''), password: '', turma: String(row.turma ?? ''),
    idade: Number(row.idade ?? 0), matricula: String(row.matricula ?? ''), photo: String(row.photo ?? row.avatar_url ?? ''), suspended: Boolean(row.suspended),
    approvalStatus: row.approval_status === 'pending' || row.approval_status === 'rejected' ? row.approval_status : 'approved',
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
  const report = (error: unknown): false => {
    notify(localizeAuthError(errorMessage(error, 'Não foi possível concluir esta ação.')), true);
    return false;
  };

  async function loadRemoteState() {
    if (!supabase) return;
    const [sports, profiles, authResult] = await Promise.all([
      supabase.from('sports_state').select('payload').eq('id', 1).maybeSingle(),
      supabase.from('public_profiles').select('*'),
      supabase.auth.getUser(),
    ]);
    if (sports.error) throw sports.error;
    if (profiles.error) throw profiles.error;
    // Logs and full profile records are deliberately private; only directors can read them.
    let profileRows = (profiles.data ?? []) as Record<string, unknown>[];
    let logRows: Record<string, unknown>[] = [];
    const authUser = authResult.data.user;
    if (authUser) {
      const own = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle();
      if (!own.error && own.data) {
        const mergedOwn = { ...own.data, email: authUser.email };
        const exists = profileRows.some(row => row.id === own.data.id);
        profileRows = exists
          ? profileRows.map(row => row.id === own.data.id ? { ...row, ...mergedOwn } : row)
          : [...profileRows, mergedOwn];
      if (own.data.role === 'director' || own.data.role === 'sesi') {
          const [allProfiles, logsResult] = await Promise.all([
            supabase.from('profiles').select('*'),
            supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(500),
          ]);
          if (!allProfiles.error) profileRows = (allProfiles.data ?? []).map(row => ({ ...row, email: row.email }));
          if (!logsResult.error) logRows = (logsResult.data ?? []) as Record<string, unknown>[];
        }
      }
    }
    const remoteProfiles = profileRows.map(row => profileFromRow(row));
    const payload = (sports.data?.payload ?? {}) as Record<string, unknown>;
    const [playerResult, noteResult] = authUser ? await Promise.all([
      supabase.from('team_players_private').select('*'),
      supabase.from('tournament_team_notes').select('*'),
    ]) : [{ data: [], error: null }, { data: [], error: null }];
    if (playerResult.error) throw playerResult.error;
    if (noteResult.error) throw noteResult.error;
    let accountRequests: Record<string, unknown>[] = [];
    if (authUser && profileRows.find(row => row.id === authUser.id)?.role === 'director') {
      const requestResult = await supabase.from('account_requests').select('*').order('created_at', { ascending: false });
      if (requestResult.error) throw requestResult.error;
      accountRequests = (requestResult.data ?? []) as Record<string, unknown>[];
    }
    const next = stateSchema.parse({
      ...emptyState,
      ...payload,
      users: remoteProfiles,
      players: (playerResult.data ?? []).map(row => ({ id: String(row.id), teamId: String(row.team_id), fullName: String(row.full_name), birthDate: String(row.birth_date), cpf: String(row.cpf), enrollment: String(row.enrollment), createdBy: String(row.created_by) })),
      tournamentNotes: (noteResult.data ?? []).map(row => ({ id: String(row.id), tournamentId: String(row.tournament_id), teamId: String(row.team_id), authorId: String(row.author_id), text: String(row.note), createdAt: String(row.created_at), updatedAt: String(row.updated_at) })),
      logs: logRows.map(row => ({ id: String(row.id), actorId: String(row.actor_id), action: String(row.action), createdAt: String(row.created_at) })),
      accountRequests: accountRequests.map(row => ({ id: String(row.id), userId: String(row.user_id), name: String(row.responsible_name), teamName: String(row.team_name), email: String(row.email), status: String(row.status), createdAt: String(row.created_at), reviewedAt: String(row.reviewed_at ?? ''), reviewedBy: String(row.reviewed_by ?? '') })),
    });
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
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUserId(session?.user.id ?? null);
      if (event === 'SIGNED_OUT' || !session?.user) {
        window.setTimeout(() => { void loadRemoteState().catch(error => notify(errorMessage(error, 'Erro ao atualizar sessão.'), true)); }, 0);
      } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        window.setTimeout(() => { void loadRemoteState().catch(error => notify(errorMessage(error, 'Erro ao carregar dados.'), true)); }, 0);
      }
    });
    const stateChannel = supabase.channel('sports-state-live-sync').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'sports_state' }, () => {
      window.setTimeout(() => { void loadRemoteState().catch(error => notify(errorMessage(error, 'Erro ao sincronizar os dados.'))); }, 80);
    }).on('postgres_changes', { event: '*', schema: 'public', table: 'team_players_private' }, () => {
      window.setTimeout(() => { void loadRemoteState().catch(error => notify(errorMessage(error, 'Erro ao sincronizar jogadores.'))); }, 80);
    }).on('postgres_changes', { event: '*', schema: 'public', table: 'tournament_team_notes' }, () => {
      window.setTimeout(() => { void loadRemoteState().catch(error => notify(errorMessage(error, 'Erro ao sincronizar observações.'))); }, 80);
    }).subscribe();
    return () => { alive = false; subscription.unsubscribe(); void supabase!.removeChannel(stateChannel); };
  }, []);

  const user = useMemo(() => state.users.find(item => item.id === userId) ?? null, [state.users, userId]);

  function runAction(action: (draft: DemoState, actorId: string) => void, success?: string): { ok: boolean; pending: Promise<boolean> } {
    try {
      if (!user || user.suspended) throw new Error('Sua conta não pode executar esta ação.');
      const draft = structuredClone(state); action(draft, user.id);
      if (!supabase) { saveDemo(draft); setState(draft); if (success) notify(success); return { ok: true, pending: Promise.resolve(true) }; }
      const same = (left: unknown, right: unknown) => JSON.stringify(left) === JSON.stringify(right);
      const executeRemote = async (): Promise<boolean> => {
        if (user.role === 'student') {
          const newTeams = draft.teams.filter(team => !state.teams.some(old => old.id === team.id));
          const otherStateSame = same(draft.games, state.games) && same(draft.tournaments, state.tournaments) && same(draft.stats, state.stats) && same(draft.standings, state.standings) && same(draft.cards, state.cards) && same(draft.scorers, state.scorers);
          if (newTeams.length === 1 && draft.teams.length === state.teams.length + 1 && otherStateSame && state.teams.every(old => same(draft.teams.find(item => item.id === old.id), old)) && newTeams[0]?.creatorId === user.id) {
            const newTeam = newTeams[0];
            const { error } = await supabase!.rpc('player_create_team', { team_id: newTeam.id, team_name: newTeam.name, team_sport: newTeam.sport });
            if (error) throw error; await loadRemoteState(); if (success) notify(success); return true;
          }
          if (otherStateSame && same(draft.teams, state.teams) && draft.games.length === state.games.length) {
            const changedGames = state.games.filter(old => !same(draft.games.find(item => item.id === old.id), old));
            if (changedGames.length === 1) {
              const before = changedGames[0]!, after = draft.games.find(item => item.id === before.id)!;
              const { participantIds: _beforeIds, ...beforeGame } = before; const { participantIds: _afterIds, ...afterGame } = after;
              const added = after.participantIds.filter(id => !before.participantIds.includes(id));
              const removed = before.participantIds.filter(id => !after.participantIds.includes(id));
              if ((same(beforeGame, afterGame) && added.length === 1 && added[0] === user.id && removed.length === 0) || (same(beforeGame, afterGame) && removed.length === 1 && removed[0] === user.id && added.length === 0)) {
                const procedure = added.length ? 'player_join_game' : 'player_leave_game';
                const { error } = await supabase!.rpc(procedure, { target_game_id: before.id });
                if (error) throw error; await loadRemoteState(); if (success) notify(success); return true;
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
                const { error } = await supabase!.rpc('player_join_team', { target_team_id: before.id });
                if (error) throw error; await loadRemoteState(); if (success) notify(success); return true;
              }
              if (same(beforeTeam, afterTeam) && before.creatorId === user.id && (!same(before.memberIds, after.memberIds) || !same(before.reserveIds, after.reserveIds))) {
                const { error } = await supabase!.rpc('player_set_team_roster', { target_team_id: before.id, requested_members: after.memberIds, requested_reserves: after.reserveIds });
                if (error) throw error; await loadRemoteState(); if (success) notify(success); return true;
              }
            }
          }
        }
        const changedAccount = draft.users.find(item => {
          const previous = state.users.find(old => old.id === item.id);
          return previous && (previous.suspended !== item.suspended || previous.role !== item.role);
        });
        if (changedAccount) {
          if ((user.role !== 'director' && user.role !== 'sesi') || (changedAccount.role !== 'student' && changedAccount.role !== 'teacher')) throw new Error('Somente administradores podem alterar o acesso desta conta.');
          const { error } = await supabase!.rpc('set_profile_suspension', { target_id: changedAccount.id, next_suspended: changedAccount.suspended });
          if (error) throw error;
          const logAction = draft.logs[0]?.action ?? success ?? 'Alterou o acesso de uma conta';
          const logResult = await supabase!.from('activity_logs').insert({ actor_id: user.id, action: logAction });
          if (logResult.error) throw logResult.error;
          await loadRemoteState();
          if (success) notify(success);
          return true;
        }
        const changedUser = draft.users.find(item => item.id === user.id);
        if (changedUser && (changedUser.name !== user.name || changedUser.turma !== user.turma || changedUser.photo !== user.photo)) {
          const { error } = await supabase!.rpc('update_own_profile', { next_name: changedUser.name, next_turma: changedUser.turma, next_photo: changedUser.photo });
          if (error) throw error;
          setState(current => ({ ...current, users: current.users.map(item => item.id === user.id ? { ...item, ...changedUser } : item) }));
          if (success) notify(success);
          return true;
        }
        const sportsUnchanged = same(draft.teams, state.teams) && same(draft.games, state.games) && same(draft.tournaments, state.tournaments) && same(draft.stats, state.stats) && same(draft.standings, state.standings) && same(draft.cards, state.cards) && same(draft.scorers, state.scorers);
        if (!same(draft.players, state.players)) {
          const removed = state.players.filter(player => !draft.players.some(item => item.id === player.id));
          if (removed.length) {
            const { error } = await supabase!.from('team_players_private').delete().in('id', removed.map(player => player.id));
            if (error) throw error;
          }
          const changed = draft.players.filter(player => !same(state.players.find(item => item.id === player.id), player));
          if (changed.length) {
            const { error } = await supabase!.from('team_players_private').upsert(changed.map(player => ({ id: player.id, team_id: player.teamId, full_name: player.fullName, birth_date: player.birthDate, cpf: player.cpf, enrollment: player.enrollment, created_by: player.createdBy })));
            if (error) throw error;
          }
        }
        if (!same(draft.tournamentNotes, state.tournamentNotes)) {
          const removed = state.tournamentNotes.filter(note => !draft.tournamentNotes.some(item => item.id === note.id));
          if (removed.length) {
            const { error } = await supabase!.from('tournament_team_notes').delete().in('id', removed.map(note => note.id));
            if (error) throw error;
          }
          const changed = draft.tournamentNotes.filter(note => !same(state.tournamentNotes.find(item => item.id === note.id), note));
          if (changed.length) {
            const { error } = await supabase!.from('tournament_team_notes').upsert(changed.map(note => ({ id: note.id, tournament_id: note.tournamentId, team_id: note.teamId, author_id: note.authorId, note: note.text, updated_at: note.updatedAt })));
            if (error) throw error;
          }
        }
        if (sportsUnchanged) {
          if (!same(draft.players, state.players) || !same(draft.tournamentNotes, state.tournamentNotes)) await loadRemoteState();
          if (success) notify(success);
          return true;
        }
        // Never persist authentication credentials or administrative logs in the shared sports document.
        const { users: _users, logs: _logs, players: _players, ...payload } = draft;
        const { error } = await supabase!.rpc('save_sports_state', { next_payload: payload });
        if (error) throw error;
        const logAction = draft.logs[0]?.action ?? success ?? 'Atualizou dados esportivos';
        const logResult = await supabase!.from('activity_logs').insert({ actor_id: user.id, action: logAction });
        if (logResult.error && (user.role === 'director' || user.role === 'sesi')) notify(logResult.error.message, true);
        if (user.role === 'director' || user.role === 'sesi') await loadRemoteState();
        else setState(draft);
        if (success) notify(success);
        return true;
      };
      return { ok: true, pending: executeRemote().catch((error: unknown) => report(error)) };
    } catch (error) {
      report(error);
      return { ok: false, pending: Promise.resolve(false) };
    }
  }
  function act(action: (draft: DemoState, actorId: string) => void, success?: string): boolean {
    return runAction(action, success).ok;
  }
  function actAsync(action: (draft: DemoState, actorId: string) => void, success?: string): Promise<boolean> {
    return runAction(action, success).pending;
  }

  async function login(email: string, password: string): Promise<boolean> {
    const key = email.trim().toLowerCase(), attempt = attempts[key] ?? { count: 0, until: 0 };
    try {
      if (attempt.until > Date.now()) throw new Error('Muitas tentativas. Tente novamente em 15 minutos.');
      if (!supabase) {
        const account = authenticate(state, email, password); saveSession(account.id); setUserId(account.id); setMessage(null);
        setAttempts(current => ({ ...current, [key]: { count: 0, until: 0 } }));
        return true;
      }
      const { data, error } = await supabase.auth.signInWithPassword({ email: key, password });
      if (error) throw error;
      if (!data.user) throw new Error('O Supabase não retornou uma sessão válida.');
      const { data: row, error: profileError } = await supabase.from('profiles').select('*').eq('id', data.user.id).single();
      if (profileError) throw profileError;
      const account = profileFromRow({ ...row, email: data.user.email });
      if (account.suspended) { await supabase.auth.signOut(); throw new Error('Esta conta está suspensa.'); }
      if (account.approvalStatus === 'pending') { await supabase.auth.signOut(); throw new Error('Sua solicitação ainda aguarda aprovação do diretor.'); }
      if (account.approvalStatus === 'rejected') { await supabase.auth.signOut(); throw new Error('Sua solicitação de acesso foi recusada. Entre em contato com a organização.'); }
      setState(current => ({ ...current, users: [...current.users.filter(item => item.id !== account.id), account] }));
      setUserId(account.id);
      await loadRemoteState();
      setMessage(null);
      setAttempts(current => ({ ...current, [key]: { count: 0, until: 0 } }));
      return true;
    } catch (error) {
      const count = attempt.count + 1;
      setAttempts(current => ({ ...current, [key]: { count, until: count >= 5 ? Date.now() + 15 * 60_000 : 0 } }));
      return report(error);
    }
  }
  async function signUp(name: string, email: string, turma: string, password: string, confirm: string): Promise<boolean> {
    try {
      if (password !== confirm) throw new Error('As senhas não coincidem.');
      if (!passwordScore(password).valid) throw new Error('A senha ainda não atende a todos os requisitos.');
      const cleanName = requireName(name), cleanEmail = email.trim().toLowerCase(), cleanTurma = turma.trim();
      if (!cleanEmail || !cleanEmail.includes('@')) throw new Error('Informe um e-mail válido.');
      if (!cleanTurma) throw new Error('Informe a equipe ou empresa.');
      if (!supabase) {
        const draft = structuredClone(state);
        if (draft.users.some(item => item.email.toLowerCase() === cleanEmail)) throw new Error('Este e-mail já está cadastrado.');
        const account: User = { id: uid('u'), role: 'student', name: cleanName, email: cleanEmail, password, turma: cleanTurma, idade: 0, matricula: '', photo: '', suspended: false, approvalStatus: 'pending' };
        draft.users.push(account);
        draft.accountRequests.unshift({ id: uid('request'), userId: account.id, name: cleanName, teamName: cleanTurma, email: cleanEmail, status: 'pending', createdAt: new Date().toISOString(), reviewedAt: '', reviewedBy: '' });
        saveDemo(draft); setState(draft); setMessage({ text: 'Solicitação criada. Aguarde a aprovação do diretor.', error: false });
        return true;
      }
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail, password,
        options: { data: { name: cleanName, turma: cleanTurma, registration_type: 'teacher' }, emailRedirectTo: `${window.location.origin}${import.meta.env.BASE_URL}?email-confirmed=1` },
      });
      if (error) throw error;
      if (!data.user) throw new Error('O Supabase não confirmou a criação da conta.');
      if (data.session) {
        await supabase.auth.signOut();
        setUserId(null);
        await loadRemoteState();
        notify('Solicitação criada. Aguarde a aprovação do diretor.');
      } else {
        notify('Solicitação criada. Confirme seu e-mail; depois, aguarde a aprovação do diretor.');
      }
      return true;
    } catch (error) { return report(error); }
  }
  async function reviewTeacherRequest(targetUserId: string, approve: boolean): Promise<boolean> {
    if (user?.role !== 'director') return report(new Error('Somente o diretor pode aprovar ou recusar solicitações.'));
    try {
      if (!supabase) {
        const draft = structuredClone(state), request = draft.accountRequests.find(item => item.userId === targetUserId && item.status === 'pending');
        const account = draft.users.find(item => item.id === targetUserId);
        if (!request || !account) throw new Error('Solicitação pendente não encontrada.');
        request.status = approve ? 'approved' : 'rejected'; request.reviewedAt = new Date().toISOString(); request.reviewedBy = user.id;
        account.role = approve ? 'teacher' : 'student'; account.approvalStatus = approve ? 'approved' : 'rejected';
        draft.logs.unshift({ id: uid('log'), actorId: user.id, action: `${approve ? 'Aprovou' : 'Recusou'} acesso de ${account.name}`, createdAt: new Date().toISOString() });
        saveDemo(draft); setState(draft); notify(approve ? 'Acesso de representante aprovado.' : 'Solicitação recusada.'); return true;
      }
      const { error } = await supabase.rpc('review_teacher_request', { target_user: targetUserId, decision: approve ? 'approved' : 'rejected' });
      if (error) throw error;
      await loadRemoteState();
      if (!approve) { notify('Solicitação recusada.'); return true; }
      const email = await supabase.functions.invoke('notify-account-approved', { body: { user_id: targetUserId } });
      if (email.error) notify('Acesso aprovado. O e-mail não foi enviado; confira a configuração da função de e-mail.', true);
      else notify('Acesso de representante aprovado e e-mail enviado.');
      return true;
    } catch (error) { return report(error); }
  }
  function logout() {
    if (supabase) {
      void supabase.auth.signOut();
      setState(current => ({ ...current, logs: [] }));
    } else {
      saveSession(null);
    }
    setUserId(null);
    setMessage(null);
  }
  async function migrateLocalData(): Promise<boolean> {
    if (!supabase || user?.role !== 'sesi') return report(new Error('Somente um administrador conectado ao Supabase pode migrar dados locais.'));
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
  return <AppContext.Provider value={{ state, user, message, loading, remote, dismiss: () => setMessage(null), notify, act, actAsync, login, signUp, reviewTeacherRequest, logout, migrateLocalData }}>{children}</AppContext.Provider>;
}
export function useApp(): AppContextValue { const context = useContext(AppContext); if (!context) throw new Error('AppProvider não encontrado.'); return context; }
