import { describe, expect, it } from 'vitest';
import { seed } from '../demo/seed';
import { DEMO_KEY, loadDemo } from '../demo/storage';
import { createTournament, registerTeam } from './tournaments';
import { registerGoogleStudent, registerStudent } from './auth';
import { createGame, joinGame, saveScore } from './games';
import { saveRoster } from './teams';
import { addDays } from '../utils/format';
import { stateSchema } from '../types/models';

describe('Migração da demonstração', () => {
  it('valida os dados e preserva os perfis antigos sem sobrescrever a chave anterior', () => {
    expect(stateSchema.safeParse(seed).success).toBe(true);
    const legacy = { ...seed, users: seed.users.map(user => ({ ...user, role: ({ student: 'aluno', teacher: 'professor', director: 'diretor' })[user.role] })) };
    const reads: string[] = [];
    const state = loadDemo({ getItem(key) { reads.push(key); return key === DEMO_KEY ? null : JSON.stringify(legacy); } });
    expect(state.users.find(user => user.id === 'u2')?.role).toBe('teacher');
    expect(reads).toEqual([DEMO_KEY, 'senaiSportsDemoV1']);
    expect(state.teams).toEqual(seed.teams);
  });
  it('não apaga nem substitui silenciosamente dados inválidos', () => {
    expect(() => loadDemo({ getItem: () => '{invalid' })).toThrow();
  });
  it('cadastro público sempre cria aluno e bloqueia matrícula duplicada', () => {
    const state = structuredClone(seed), input = { name: 'Novo Aluno', email: 'novo@example.com', password: 'Senha@123', confirm: 'Senha@123', turma: '2º A', idade: 16, matricula: 'NOVO001', photo: '', role: 'director' };
    expect(registerStudent(state, input).role).toBe('student');
    expect(() => registerStudent(state, { ...input, email: 'outro@example.com' })).toThrow('matrícula');
  });
  it('somente professor cria campeonato e nenhum time é inscrito automaticamente', () => {
    const state = structuredClone(seed);
    expect(() => createTournament(state, 'u4', 'Copa', addDays(2))).toThrow('professores');
    expect(() => createTournament(state, 'u1', 'Copa', addDays(2))).toThrow('professores');
    createTournament(state, 'u2', 'Copa', addDays(2));
    expect(state.tournaments[0]?.teamIds).toEqual([]);
  });
  it('exige líder, seis titulares, contas ativas e responsável; mantém snapshot', () => {
    const state = structuredClone(seed); createTournament(state, 'u2', 'Copa', addDays(2));
    const tournament = state.tournaments[0]!, team = state.teams[0]!;
    expect(() => registerTeam(state, 'u4', tournament.id, team.id)).toThrow('6 jogadores');
    team.memberIds = ['u4', 'u5', 'u6', 'u7', 'u8', 'u9'];
    expect(() => registerTeam(state, 'u5', tournament.id, team.id)).toThrow('líder');
    state.users.find(user => user.id === 'u9')!.suspended = true;
    expect(() => registerTeam(state, 'u4', tournament.id, team.id)).toThrow('ativos');
    state.users.find(user => user.id === 'u9')!.suspended = false;
    registerTeam(state, 'u4', tournament.id, team.id);
    expect(tournament.registrations[0]?.memberIds).toEqual(team.memberIds);
    expect(tournament.registrations[0]?.memberIds).not.toBe(team.memberIds);
    expect(() => registerTeam(state, 'u4', tournament.id, team.id)).toThrow('já está inscrito');
    expect(() => saveRoster(state, 'u4', team.id, team.memberIds, [])).toThrow('fechado');
    state.teams[1]!.memberIds = [...team.memberIds];
    expect(() => registerTeam(state, 'u5', tournament.id, state.teams[1]!.id)).toThrow('outro time');
  });
  it('professores podem ocupar vagas de titulares sem contar como reservas', () => {
    const state = structuredClone(seed); createTournament(state, 'u2', 'Copa', addDays(2));
    state.teams[0]!.memberIds = ['u4', 'u5', 'u6', 'u7', 'u8', 'u2'];
    state.teams[0]!.reserveIds = ['u9'];
    registerTeam(state, 'u4', state.tournaments[0]!.id, 't1');
    expect(state.tournaments[0]!.registrations[0]!.memberIds).toHaveLength(6);
    expect(state.tournaments[0]!.registrations[0]!.memberIds).not.toContain('u9');
  });
  it('vincula autenticação Google a perfil de aluno e nunca promove contas da equipe', () => {
    const state = structuredClone(seed);
    const created = registerGoogleStudent(state, { id: 'google-user-1', email: 'novo.aluno@example.com', name: 'Novo Aluno' });
    expect(created.role).toBe('student');
    expect(created.id).toBe('google-user-1');
    expect(created.password).toBe('');
    expect(state.stats.some(item => item.userId === created.id)).toBe(true);

    const linked = registerGoogleStudent(state, { id: 'google-user-2', email: 'aluno@senai.local', name: 'Perfil Google' });
    expect(linked.id).toBe('u4');
    expect(linked.role).toBe('student');
    expect(() => registerGoogleStudent(state, { id: 'google-teacher', email: 'professor@senai.local' })).toThrow('conta da equipe');
    expect(() => registerGoogleStudent(state, { id: 'google-director', email: 'diretor@senai.local' })).toThrow('conta da equipe');
  });
  it('valida acesso e conflito da quadra na criação de jogos', () => {
    const state = structuredClone(seed), input = { date: addDays(8), time: '14:00', team1: 't1', team2: 't2', description: '', notes: '', limit: 18, status: 'inscricoes' as const };
    expect(() => createGame(state, 'u1', input)).toThrow('professores');
    createGame(state, 'u2', input);
    expect(() => createGame(state, 'u2', { ...input, time: '15:00' })).toThrow('quadra');
    expect(() => createGame(state, 'u2', { ...input, time: '15:30' })).not.toThrow();
  });
  it('limita partidas a 20 jogadores e define duração de 90 minutos', () => {
    const state = structuredClone(seed), input = { date: addDays(10), time: '14:00', team1: 't1', team2: 't2', description: '', notes: '', limit: 20, status: 'inscricoes' as const };
    expect(() => createGame(state, 'u2', { ...input, limit: 21 })).toThrow('20 jogadores');
    createGame(state, 'u2', input);
    const game = state.games[state.games.length - 1]!;
    expect(game.limit).toBe(20);
    expect(game.duration).toBe(90);
  });
  it('não permite ultrapassar 20 participantes em registros antigos com limite maior', () => {
    const state = structuredClone(seed), game = state.games.find(item => item.id === 'g1')!;
    game.limit = 25;
    game.participantIds = Array.from({ length: 20 }, (_, index) => `legacy-${index}`);
    expect(() => joinGame(state, 'u4', game.id)).toThrow('limite de participantes');
  });
  it('editar placar não acumula as mesmas estatísticas duas vezes', () => {
    const state = structuredClone(seed), sets = [{ a: 25, b: 15 }, { a: 25, b: 10 }];
    saveScore(state, 'u2', 'g1', sets); const previous = structuredClone(state.teams);
    saveScore(state, 'u2', 'g1', sets); expect(state.teams).toEqual(previous);
  });
});
