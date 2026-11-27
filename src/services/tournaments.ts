import type { DemoState, Team, Tournament } from '../types/models';
import { audit, requireActor, requireDirector, requireSesi } from './auth';
import { requireName } from '../utils/validation';
import { todayISO, uid } from '../utils/format';

export function registrationError(state: DemoState, actorId: string, tournament: Tournament, team: Team): string {
  const actor = state.users.find(user => user.id === actorId);
  if (!actor || actor.suspended || team.creatorId !== actorId) return 'Somente o líder que criou o time pode inscrevê-lo.';
  if (tournament.status !== 'inscricoes' || tournament.date < todayISO()) return 'As inscrições deste campeonato estão encerradas.';
  if (tournament.rounds.length) return 'As inscrições estão fechadas porque o chaveamento já foi gerado.';
  if (tournament.teamIds.includes(team.id)) return 'Este time já está inscrito.';
  if (tournament.teamLimit !== null && tournament.teamIds.length >= tournament.teamLimit) return 'O campeonato atingiu o limite de equipes.';
  if (team.status !== 'ativa') return 'A equipe precisa estar aprovada e ativa.';
  if (!team.teacherIds.some(id => state.users.some(user => user.id === id && user.role === 'teacher' && !user.suspended))) return 'Selecione um professor responsável ativo.';
  if (team.memberIds.length < 1 || new Set(team.memberIds).size !== team.memberIds.length || !team.memberIds.includes(team.creatorId)) return 'Inclua o responsável e verifique se não há jogadores repetidos.';
  if (team.memberIds.some(id => !state.users.some(user => user.id === id && !user.suspended && user.role !== 'director'))) return 'Todos os jogadores inscritos devem ser alunos ou professores ativos.';
  const occupied = tournament.registrations.flatMap(item => item.memberIds);
  if (team.memberIds.some(id => occupied.includes(id))) return 'Um jogador já está inscrito por outro time neste campeonato.';
  return '';
}
type NewTournament = { name: string; sport: Tournament['sport']; gender: Tournament['gender']; tieBreak: Tournament['tieBreak']; teamLimit: number | null; startDate: string; endDate: string; banner?: string };
export function createTournament(state: DemoState, actorId: string, input: NewTournament): void;
/** Compatibility for older local callers; new UI uses the configurable object form. */
export function createTournament(state: DemoState, actorId: string, name: string, date: string): void;
export function createTournament(state: DemoState, actorId: string, inputOrName: NewTournament | string, legacyDate?: string): void {
  const input: NewTournament = typeof inputOrName === 'string' ? { name: inputOrName, sport: 'volei', gender: 'Misto', tieBreak: 'saldo', teamLimit: null, startDate: legacyDate ?? '', endDate: '' } : inputOrName;
  requireDirector(state, actorId);
  const { name, startDate, endDate } = input;
  const date = startDate;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || date < todayISO()) throw new Error('Informe uma data a partir de hoje.');
  if (endDate && endDate < startDate) throw new Error('A data de encerramento deve ser igual ou posterior ao início.');
  if (input.teamLimit !== null && (!Number.isInteger(input.teamLimit) || input.teamLimit < 1)) throw new Error('Informe um limite de equipes válido.');
  const tournament: Tournament = { id: uid('tr'), name: requireName(name), date, startDate, endDate, sport: input.sport, gender: input.gender, tieBreak: input.tieBreak, teamLimit: input.teamLimit, banner: input.banner ?? '', pdfUrl: '', pdfName: '', regulationUrl: '', regulationName: '', edition: '', createdBy: actorId, teamIds: [], registrations: [], status: 'inscricoes', rounds: [] };
  state.tournaments.push(tournament); audit(state, actorId, `criou o campeonato ${tournament.name}`);
}
export function registerTeam(state: DemoState, actorId: string, tournamentId: string, teamId: string): void {
  requireActor(state, actorId);
  const tournament = state.tournaments.find(item => item.id === tournamentId), team = state.teams.find(item => item.id === teamId);
  if (!tournament || !team) throw new Error('Campeonato ou equipe não encontrado.');
  const error = registrationError(state, actorId, tournament, team); if (error) throw new Error(error);
  tournament.teamIds.push(teamId);
  tournament.registrations.push({ teamId, leaderId: actorId, memberIds: [...team.memberIds], createdAt: new Date().toISOString() });
  audit(state, actorId, `inscreveu a equipe ${team.name} no campeonato ${tournament.name}`);
}
export function registerTeamByDirector(state: DemoState, actorId: string, tournamentId: string, teamId: string): void {
  requireDirector(state, actorId);
  const tournament = state.tournaments.find(item => item.id === tournamentId), team = state.teams.find(item => item.id === teamId);
  if (!tournament || !team || team.status !== 'ativa') throw new Error('Selecione uma equipe ativa e um campeonato válido.');
  if (tournament.rounds.length || tournament.status !== 'inscricoes') throw new Error('As inscrições deste campeonato estão encerradas.');
  if (tournament.teamIds.includes(team.id)) throw new Error('Esta equipe já está inscrita.');
  if (tournament.teamLimit !== null && tournament.teamIds.length >= tournament.teamLimit) throw new Error('O campeonato atingiu o limite de equipes.');
  tournament.teamIds.push(team.id);
  tournament.registrations.push({ teamId: team.id, leaderId: team.creatorId, memberIds: [...team.memberIds], createdAt: new Date().toISOString() });
  audit(state, actorId, `inscreveu a equipe ${team.name} no campeonato ${tournament.name}`);
}

function applyTournamentMatchTotals(state: DemoState, match: Tournament['rounds'][number][number], multiplier: number): void {
  if (match.scoreA === null || match.scoreB === null || !match.winner) return;
  const a = state.teams.find(team => team.id === match.a), b = state.teams.find(team => team.id === match.b);
  if (!a || !b) return;
  a.pointsFor += multiplier * match.scoreA; a.pointsAgainst += multiplier * match.scoreB;
  b.pointsFor += multiplier * match.scoreB; b.pointsAgainst += multiplier * match.scoreA;
  const winner = match.winner === match.a ? a : b, loser = winner === a ? b : a;
  winner.wins += multiplier; loser.losses += multiplier;
}

export function generateTournamentBracket(state: DemoState, actorId: string, tournamentId: string): void {
  requireSesi(state, actorId);
  const tournament = state.tournaments.find(item => item.id === tournamentId);
  if (!tournament || tournament.teamIds.length < 2) throw new Error('Inscreva pelo menos duas equipes para gerar o chaveamento.');
  for (const round of tournament.rounds) for (const match of round) applyTournamentMatchTotals(state, match, -1);
  const size = 2 ** Math.ceil(Math.log2(tournament.teamIds.length));
  const rounds: Tournament['rounds'] = [];
  let entrants = Array.from({ length: size / 2 }, (_, index) => ({ a: tournament.teamIds[index] ?? '', b: tournament.teamIds[size - 1 - index] ?? '', scoreA: null, scoreB: null, winner: '' }));
  rounds.push(entrants);
  while (entrants.length > 1) {
    entrants = Array.from({ length: entrants.length / 2 }, () => ({ a: '', b: '', scoreA: null, scoreB: null, winner: '' }));
    rounds.push(entrants);
  }
  // Give an automatic advance to teams whose first-round opponent is a bye.
  for (const match of rounds[0] ?? []) if (match.a && !match.b) match.winner = match.a;
  advanceTournamentByes(rounds);
  tournament.rounds = rounds;
  tournament.status = 'em_andamento';
  audit(state, actorId, `gerou o chaveamento do campeonato ${tournament.name}`);
}

function advanceTournamentByes(rounds: Tournament['rounds']): void {
  const firstRound = rounds[0] ?? [], secondRound = rounds[1] ?? [];
  firstRound.forEach((match, index) => {
    const destination = secondRound[Math.floor(index / 2)];
    if (!destination || !match.winner) return;
    if (index % 2 === 0) destination.a = match.winner; else destination.b = match.winner;
  });
}

export function saveTournamentMatchResult(state: DemoState, actorId: string, tournamentId: string, roundIndex: number, matchIndex: number, scoreA: number, scoreB: number): void {
  requireSesi(state, actorId);
  const tournament = state.tournaments.find(item => item.id === tournamentId), match = tournament?.rounds[roundIndex]?.[matchIndex];
  if (!tournament || !match || !match.a || !match.b) throw new Error('Este confronto ainda não está disponível.');
  if (!Number.isInteger(scoreA) || !Number.isInteger(scoreB) || scoreA < 0 || scoreB < 0 || scoreA === scoreB) throw new Error('Informe placares inteiros diferentes para definir o vencedor.');
  applyTournamentMatchTotals(state, match, -1);
  match.scoreA = scoreA; match.scoreB = scoreB; match.winner = scoreA > scoreB ? match.a : match.b;
  applyTournamentMatchTotals(state, match, 1);
  for (let index = roundIndex; index < tournament.rounds.length - 1; index++) {
    const current = tournament.rounds[index] ?? [], next = tournament.rounds[index + 1] ?? [];
    current.forEach((item, itemIndex) => {
      const destination = next[Math.floor(itemIndex / 2)];
      if (!destination) return;
      const side = itemIndex % 2 === 0 ? 'a' : 'b';
      const entrant = item.winner || '';
      if (destination[side] !== entrant) {
        applyTournamentMatchTotals(state, destination, -1);
        destination[side] = entrant; destination.scoreA = null; destination.scoreB = null; destination.winner = '';
      }
    });
  }
  const finalMatch = tournament.rounds.at(-1)?.[0];
  tournament.status = finalMatch?.winner ? 'finalizado' : 'em_andamento';
  audit(state, actorId, `atualizou o confronto ${roundIndex + 1}.${matchIndex + 1} do campeonato ${tournament.name}`);
}

export function updateTournament(state: DemoState, actorId: string, tournamentId: string, changes: Partial<Pick<Tournament, 'name' | 'sport' | 'gender' | 'tieBreak' | 'teamLimit' | 'startDate' | 'endDate' | 'banner' | 'pdfUrl' | 'pdfName' | 'regulationUrl' | 'regulationName'>>): void {
  requireDirector(state, actorId);
  const tournament = state.tournaments.find(item => item.id === tournamentId);
  if (!tournament) throw new Error('Campeonato não encontrado.');
  if (changes.teamLimit !== undefined && changes.teamLimit !== null && (!Number.isInteger(changes.teamLimit) || changes.teamLimit < tournament.teamIds.length)) throw new Error('O limite não pode ser menor que o número de equipes já inscritas.');
  const startDate = changes.startDate ?? tournament.startDate ?? tournament.date, endDate = changes.endDate ?? tournament.endDate;
  if (endDate && startDate && endDate < startDate) throw new Error('A data de encerramento deve ser igual ou posterior ao início.');
  Object.assign(tournament, changes, { date: startDate });
  audit(state, actorId, `editou o campeonato ${tournament.name}`);
}
