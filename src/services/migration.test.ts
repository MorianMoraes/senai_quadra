import { describe, expect, it } from 'vitest';
import { seed } from '../demo/seed';
import { DEMO_KEY, loadDemo } from '../demo/storage';
import { createTournament, generateTournamentBracket, registerTeam, saveTournamentMatchResult } from './tournaments';
import { registerGoogleStudent, registerStudent } from './auth';
import { cancelGame, createGame, joinGame, saveScore } from './games';
import { joinTeam, saveRoster } from './teams';
import { addDays, userName } from '../utils/format';
import { stateSchema } from '../types/models';
import { inappropriateName, passwordScore } from '../utils/validation';

function addTestTournament(state: typeof seed, sport: 'volei' | 'xadrez' = 'volei') {
  state.tournaments.push({ id: 'tour-test', name: 'Campeonato de teste', date: addDays(4), startDate: addDays(4), endDate: addDays(20), createdBy: 'u1', sport, gender: 'Misto', tieBreak: 'saldo', teamLimit: 8, banner: '', pdfUrl: '', pdfName: '', regulationUrl: '', regulationName: '', edition: '', teamIds: ['t1','t2'], status: 'inscricoes', rounds: [], registrations: [] });
}

describe('Migração da demonstração', () => {
  it('exibe requisitos de senha e bloqueia nomes com conteúdo impróprio', () => {
    expect(passwordScore('Senha@123')).toMatchObject({ valid: true, level: 3 });
    expect(passwordScore('senha')).toMatchObject({ valid: false, level: 1 });
    expect(inappropriateName('Racista')).toBe(true);
    expect(inappropriateName('Ana Lima')).toBe(false);
  });
  it('valida os dados e preserva os perfis antigos sem sobrescrever a chave anterior', () => {
    expect(stateSchema.safeParse(seed).success).toBe(true);
    const legacy = { ...seed, users: seed.users.map(user => ({ ...user, role: ({ student: 'aluno', teacher: 'professor', director: 'diretor', sesi: 'sesi' })[user.role] })) };
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
    expect(() => registerStudent(state, { ...input, email: 'outro@example.com' })).toThrow('matr');
  });
  it('professor e administrador podem organizar campeonatos; alunos não recebem esse acesso', () => {
    const state = structuredClone(seed);
    expect(() => createTournament(state, 'u4', 'Copa', addDays(2))).toThrow('administradores');
    createTournament(state, 'u1', 'Copa', addDays(2));
    createTournament(state, 'u1', 'Copa administrativa', addDays(3));
    expect(state.tournaments[0]?.teamIds).toEqual([]);
  });
  it('valida responsável, duplicidade e snapshot do elenco flexível', () => {
    const state = structuredClone(seed); createTournament(state, 'u1', 'Copa', addDays(2));
    const tournament = state.tournaments[0]!, team = state.teams[0]!;
    team.memberIds = ['u4'];
    expect(() => registerTeam(state, 'u5', tournament.id, team.id)).toThrow('líder');
    registerTeam(state, 'u4', tournament.id, team.id);
    expect(tournament.registrations[0]?.memberIds).toEqual(team.memberIds);
    expect(tournament.registrations[0]?.memberIds).not.toBe(team.memberIds);
    expect(() => registerTeam(state, 'u4', tournament.id, team.id)).toThrow('já está inscrito');
    expect(() => saveRoster(state, 'u4', team.id, team.memberIds, [])).toThrow('fechado');
    state.teams[1]!.memberIds = ['u5', ...team.memberIds];
    expect(() => registerTeam(state, 'u5', tournament.id, state.teams[1]!.id)).toThrow('outro time');
  });
  it('professores podem ocupar vagas de titulares sem contar como reservas', () => {
    const state = structuredClone(seed); createTournament(state, 'u1', 'Copa', addDays(2));
    state.teams[0]!.memberIds = ['u4', 'u5', 'u6', 'u7', 'u8', 'u2'];
    state.teams[0]!.reserveIds = ['u9'];
    registerTeam(state, 'u4', state.tournaments[0]!.id, 't1');
    expect(state.tournaments[0]!.registrations[0]!.memberIds).toHaveLength(6);
    expect(state.tournaments[0]!.registrations[0]!.memberIds).not.toContain('u9');
  });
  it('gera chaveamento e avança os vencedores, com edição restrita a representantes', () => {
    const state = structuredClone(seed); createTournament(state, 'u1', 'Copa', addDays(12));
    const tournament = state.tournaments[0]!; tournament.teamIds = ['t1', 't2', 't3'];
    const beforeT1 = { wins: state.teams[0]!.wins, losses: state.teams[0]!.losses, pointsFor: state.teams[0]!.pointsFor };
    const beforeT2 = { wins: state.teams[1]!.wins, losses: state.teams[1]!.losses, pointsFor: state.teams[1]!.pointsFor };
    expect(() => generateTournamentBracket(state, 'u4', tournament.id)).toThrow('SESI');
    generateTournamentBracket(state, 'u10', tournament.id);
    expect(tournament.status).toBe('em_andamento');
    expect(tournament.rounds.map(round => round.length)).toEqual([2, 1]);
    expect(tournament.rounds[1]?.[0]?.a).toBe('t1');
    expect(tournament.rounds[1]?.[0]?.winner).toBe('');
    expect(() => saveTournamentMatchResult(state, 'u4', tournament.id, 0, 1, 2, 1)).toThrow('SESI');
    saveTournamentMatchResult(state, 'u10', tournament.id, 0, 1, 2, 1);
    expect(tournament.rounds[1]?.[0]?.b).toBe('t2');
    saveTournamentMatchResult(state, 'u10', tournament.id, 1, 0, 3, 0);
    expect(tournament.rounds[1]?.[0]?.winner).toBe('t1');
    expect(tournament.status).toBe('finalizado');
    expect(state.teams[0]!.wins).toBe(beforeT1.wins + 1);
    expect(state.teams[0]!.pointsFor).toBe(beforeT1.pointsFor + 3);
    saveTournamentMatchResult(state, 'u10', tournament.id, 1, 0, 1, 4);
    expect(tournament.rounds[1]?.[0]?.winner).toBe('t2');
    expect(state.teams[0]!.wins).toBe(beforeT1.wins);
    expect(state.teams[1]!.wins).toBe(beforeT2.wins + 2);
    generateTournamentBracket(state, 'u10', tournament.id);
    expect(tournament.status).toBe('em_andamento');
    expect(state.teams[1]!.wins).toBe(beforeT2.wins);
    expect(state.teams[1]!.pointsFor).toBe(beforeT2.pointsFor);
  });
  it('não declara vencedor antecipado em chaveamento de 5 equipes', () => {
    const state = structuredClone(seed); createTournament(state, 'u1', 'Copa 5', addDays(12));
    const tournament = state.tournaments[0]!;
    tournament.teamIds = ['t1', 't2', 't3', 't4', 't5'];
    generateTournamentBracket(state, 'u10', tournament.id);
    expect(tournament.rounds.map(round => round.length)).toEqual([4, 2, 1]);
    expect(tournament.rounds[1]?.[1]?.a).toBe('t3');
    expect(tournament.rounds[1]?.[1]?.b).toBe('');
    expect(tournament.rounds[1]?.[1]?.winner).toBe('');
    expect(tournament.rounds[2]?.[0]?.a).toBe('');
    expect(tournament.rounds[2]?.[0]?.b).toBe('');
    expect(tournament.rounds[2]?.[0]?.winner).toBe('');
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
    const state = structuredClone(seed); addTestTournament(state); const input = { tournamentId: 'tour-test', date: addDays(8), time: '14:00', team1: 't1', team2: 't2', description: '', notes: '', limit: 18, status: 'inscricoes' as const, unit: 'Unidade de teste', court: 'Quadra de teste', duration: 60 };
    expect(() => createGame(state, 'u4', input)).toThrow('diretor');
    createGame(state, 'u1', input);
    createGame(state, 'u1', { ...input, date: addDays(9) });
    expect(() => createGame(state, 'u1', { ...input, time: '14:30' })).toThrow('espaço e horário');
    expect(() => createGame(state, 'u1', { ...input, time: '15:30' })).not.toThrow();
  });
  it('limita partidas a 20 jogadores e usa 60 minutos como duração mínima inicial', () => {
    const state = structuredClone(seed); addTestTournament(state); const input = { tournamentId: 'tour-test', date: addDays(10), time: '14:00', team1: 't1', team2: 't2', description: '', notes: '', limit: 20, status: 'inscricoes' as const, unit: 'Unidade de teste', court: 'Quadra de teste', duration: 60 };
    expect(() => createGame(state, 'u1', { ...input, limit: 21 })).toThrow('20 jogadores');
    createGame(state, 'u1', input);
    const game = state.games[state.games.length - 1]!;
    expect(game.limit).toBe(20);
    expect(game.duration).toBe(60);
  });
  it('permite jogos de tabuleiro sem duração fixa e exige 60 minutos na quadra', () => {
    const state = structuredClone(seed); addTestTournament(state, 'xadrez'); const input = { tournamentId: 'tour-test', date: addDays(10), time: '14:00', team1: 't1', team2: 't2', description: '', notes: '', limit: 2, status: 'inscricoes' as const, unit: 'Unidade de teste', court: 'Sala de teste' };
    createGame(state, 'u1', { ...input, sport: 'xadrez', duration: 0 });
    expect(state.games.at(-1)?.duration).toBe(0);
    state.tournaments[0]!.sport = 'volei';
    expect(() => createGame(state, 'u1', { ...input, duration: 59 })).toThrow('60 minutos');
  });
  it('contabiliza empates no ranking de equipes sem duplicá-los ao editar o placar', () => {
    const state = structuredClone(seed), draw = [{ a: 1, b: 0 }, { a: 0, b: 1 }];
    saveScore(state, 'u1', 'g1', draw);
    expect(state.teams.find(team => team.id === 't1')?.draws).toBe(1);
    expect(state.teams.find(team => team.id === 't1')?.pointsFor).toBeGreaterThan(seed.teams.find(team => team.id === 't1')!.pointsFor);
    const snapshot = structuredClone(state.teams);
    saveScore(state, 'u1', 'g1', draw);
    expect(state.teams).toEqual(snapshot);
  });
  it('permite ao jogador entrar em equipe ativa sem ultrapassar o limite nem repetir vínculo', () => {
    const state = structuredClone(seed); state.teams[0]!.memberIds = ['u4'];
    joinTeam(state, 'u9', 't1');
    expect(state.teams[0]!.memberIds).toContain('u9');
    expect(() => joinTeam(state, 'u9', 't1')).toThrow('já faz parte');
  });
  it('não permite ultrapassar 20 participantes em registros antigos com limite maior', () => {
    const state = structuredClone(seed), game = state.games.find(item => item.id === 'g1')!;
    game.limit = 25;
    game.participantIds = Array.from({ length: 20 }, (_, index) => `legacy-${index}`);
    expect(() => joinGame(state, 'u4', game.id)).toThrow('limite de participantes');
  });
  it('editar placar não acumula as mesmas estatísticas duas vezes', () => {
    const state = structuredClone(seed), sets = [{ a: 25, b: 15 }, { a: 25, b: 10 }];
    saveScore(state, 'u1', 'g1', sets); const previous = structuredClone(state.teams);
    saveScore(state, 'u1', 'g1', sets); expect(state.teams).toEqual(previous);
  });
  it('preserva o calendário personalizado no jogo criado', () => {
    const state = structuredClone(seed); addTestTournament(state);
    createGame(state, 'u1', { tournamentId: 'tour-test', date: addDays(13), time: '14:00', team1: 't1', team2: 't2', description: '', notes: '', limit: 8, status: 'inscricoes', unit: 'Unidade de teste', court: 'Quadra de teste', calendar: 'Interclasses', duration: 60 });
    expect(state.games.at(-1)?.calendar).toBe('Interclasses');
  });
  it('não permite cancelar partida já finalizada e usa fallback de nome vazio', () => {
    const state = structuredClone(seed);
    expect(() => cancelGame(state, 'u1', 'g3')).toThrow('finalizadas');
    state.users[0]!.name = '';
    expect(userName(state, state.users[0]!.id)).toBe('Usuário');
  });
});
