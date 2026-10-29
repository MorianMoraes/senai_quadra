import type { DemoState, Game, MatchSet } from '../types/models';
import { audit, requireActor, requireTeacher } from './auth';
import { startTime, uid } from '../utils/format';

export type NewGame = Pick<Game, 'date' | 'time' | 'team1' | 'team2' | 'description' | 'notes' | 'limit' | 'status'>;
export function createGame(state: DemoState, actorId: string, input: NewGame): void {
  requireTeacher(state, actorId);
  const start = startTime(input.date, input.time), end = start + 90 * 60_000;
  if (!Number.isFinite(start) || start < Date.now() + 24 * 60 * 60_000) throw new Error('Crie o jogo com pelo menos 1 dia de antecedência.');
  if (!Number.isInteger(input.limit) || input.limit < 1) throw new Error('Informe um limite de jogadores válido.');
  if (input.team1 && input.team1 === input.team2) throw new Error('Escolha equipes diferentes.');
  if (state.games.some(game => game.status !== 'cancelado' && start < startTime(game.date, game.time) + game.duration * 60_000 && end > startTime(game.date, game.time))) throw new Error('Já existe um jogo ocupando a quadra nesse horário.');
  state.games.push({ ...input, id: uid('g'), duration: 90, court: 'Quadra SENAI', participantIds: [], sets: [], createdBy: actorId });
  audit(state, actorId, `criou um jogo em ${input.date} às ${input.time}`);
}
export function joinGame(state: DemoState, actorId: string, gameId: string): void {
  const actor = requireActor(state, actorId), game = state.games.find(item => item.id === gameId);
  if (!game || actor.role !== 'student' || !['inscricoes', 'agendado'].includes(game.status) || startTime(game.date, game.time) <= Date.now()) throw new Error('As inscrições para este jogo não estão disponíveis.');
  if (game.participantIds.includes(actorId)) throw new Error('Você já está inscrito.');
  if (game.participantIds.length >= game.limit) throw new Error('O jogo atingiu o limite de participantes.');
  game.participantIds.push(actorId);
}
export function leaveGame(state: DemoState, actorId: string, gameId: string): void {
  requireActor(state, actorId); const game = state.games.find(item => item.id === gameId);
  if (!game || startTime(game.date, game.time) - Date.now() <= 15 * 60_000) throw new Error('Não é possível sair faltando 15 minutos ou menos.');
  game.participantIds = game.participantIds.filter(id => id !== actorId);
}
export function cancelGame(state: DemoState, actorId: string, gameId: string): void {
  requireTeacher(state, actorId); const game = state.games.find(item => item.id === gameId);
  if (!game) throw new Error('Jogo não encontrado.');
  game.status = 'cancelado'; audit(state, actorId, `cancelou o jogo de ${game.date} às ${game.time}`);
}
function updateTotals(state: DemoState, game: Game, multiplier: number): void {
  const a = state.teams.find(team => team.id === game.team1), b = state.teams.find(team => team.id === game.team2);
  if (!a || !b || !game.sets.length) return;
  const winsA = game.sets.filter(set => set.a > set.b).length, winsB = game.sets.filter(set => set.b > set.a).length;
  if (winsA === winsB) return;
  const winner = winsA > winsB ? a : b, loser = winsA > winsB ? b : a;
  winner.wins += multiplier; loser.losses += multiplier;
  const pointsA = game.sets.reduce((sum, set) => sum + set.a, 0), pointsB = game.sets.reduce((sum, set) => sum + set.b, 0);
  a.pointsFor += multiplier * pointsA; a.pointsAgainst += multiplier * pointsB;
  b.pointsFor += multiplier * pointsB; b.pointsAgainst += multiplier * pointsA;
}
export function saveScore(state: DemoState, actorId: string, gameId: string, sets: MatchSet[]): void {
  requireTeacher(state, actorId); const game = state.games.find(item => item.id === gameId);
  if (!game || game.status === 'cancelado') throw new Error('Jogo indisponível.');
  if (!sets.length || sets.length > 3) throw new Error('Informe de 1 a 3 sets.');
  if (sets.some(set => !Number.isInteger(set.a) || !Number.isInteger(set.b) || set.a < 0 || set.b < 0)) throw new Error('Informe pontuações inteiras e positivas.');
  // Migração do registro manual existente. Placar ao vivo e regras completas chegam na Etapa 9.
  const before = JSON.stringify(game.sets);
  updateTotals(state, game, -1); game.sets = structuredClone(sets); game.status = 'finalizado'; updateTotals(state, game, 1);
  audit(state, actorId, `registrou o placar do jogo ${game.id}: ${before} → ${JSON.stringify(sets)}`);
}
