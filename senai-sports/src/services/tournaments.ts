import type { DemoState, Team, Tournament } from '../types/models';
import { audit, requireActor, requireTeacher } from './auth';
import { requireName } from '../utils/validation';
import { todayISO, uid } from '../utils/format';

export function registrationError(state: DemoState, actorId: string, tournament: Tournament, team: Team): string {
  const actor = state.users.find(user => user.id === actorId);
  if (!actor || actor.suspended || team.creatorId !== actorId) return 'Somente o líder que criou o time pode inscrevê-lo.';
  if (tournament.status !== 'inscricoes' || tournament.date < todayISO()) return 'As inscrições deste campeonato estão encerradas.';
  if (tournament.teamIds.includes(team.id)) return 'Este time já está inscrito.';
  if (team.status !== 'ativa') return 'A equipe precisa estar aprovada e ativa.';
  if (!team.teacherIds.some(id => state.users.some(user => user.id === id && user.role === 'teacher' && !user.suspended))) return 'Selecione um professor responsável ativo.';
  if (team.memberIds.length !== 6 || new Set(team.memberIds).size !== 6 || !team.memberIds.includes(team.creatorId)) return 'Sua equipe ainda não pode participar. Complete os 6 jogadores, incluindo o líder.';
  if (team.memberIds.some(id => !state.users.some(user => user.id === id && !user.suspended && user.role !== 'director'))) return 'Os 6 jogadores devem ser alunos ou professores ativos.';
  const occupied = tournament.registrations.flatMap(item => item.memberIds);
  if (team.memberIds.some(id => occupied.includes(id))) return 'Um jogador já está inscrito por outro time neste campeonato.';
  return '';
}
export function createTournament(state: DemoState, actorId: string, name: string, date: string): void {
  requireTeacher(state, actorId);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || date < todayISO()) throw new Error('Informe uma data a partir de hoje.');
  const tournament: Tournament = { id: uid('tr'), name: requireName(name), date, createdBy: actorId, teamIds: [], registrations: [], status: 'inscricoes', rounds: [] };
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
