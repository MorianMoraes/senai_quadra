import type { DemoState, Team } from '../types/models';
import { audit, requireActor } from './auth';
import { requireName } from '../utils/validation';
import { uid } from '../utils/format';

export function teamPlayers(state: DemoState, team: Team): string[] {
  return team.memberIds.filter(id => state.users.some(user => user.id === id && user.role !== 'director'));
}
export function createTeam(state: DemoState, actorId: string, name: string, teacherId: string): Team {
  const actor = requireActor(state, actorId);
  if (actor.role === 'director') throw new Error('Esta ação está disponível para alunos e professores.');
  if (actor.role === 'student' && state.teams.some(team => team.creatorId === actorId)) throw new Error('Cada aluno pode criar no máximo uma equipe.');
  if (!state.users.some(user => user.id === teacherId && user.role === 'teacher' && !user.suspended)) throw new Error('Selecione um professor responsável ativo.');
  const team: Team = { id: uid('t'), name: requireName(name), status: actor.role === 'student' ? 'pendente' : 'ativa', creatorId: actorId, teacherIds: [teacherId], memberIds: [actorId], reserveIds: [], wins: 0, losses: 0, pointsFor: 0, pointsAgainst: 0 };
  state.teams.push(team); audit(state, actorId, `criou a equipe ${team.name}`); return team;
}
export function saveRoster(state: DemoState, actorId: string, teamId: string, memberIds: string[], reserveIds: string[]): void {
  const actor = requireActor(state, actorId), team = state.teams.find(item => item.id === teamId);
  if (!team || (team.creatorId !== actorId && !(actor.role === 'teacher' && team.teacherIds.includes(actorId)))) throw new Error('Somente o líder ou professor responsável pode montar o time.');
  if (state.tournaments.some(tournament => tournament.teamIds.includes(teamId))) throw new Error('O elenco está fechado porque o time já está inscrito em campeonato.');
  const all = [...memberIds, ...reserveIds];
  if (memberIds.length > 6 || reserveIds.length > 4 || new Set(all).size !== all.length || !memberIds.includes(team.creatorId)) throw new Error('Selecione até 6 titulares incluindo o líder e até 4 reservas diferentes.');
  if (all.some(id => !state.users.some(user => user.id === id && user.role !== 'director' && !user.suspended))) throw new Error('Selecione apenas alunos ou professores ativos.');
  team.memberIds = [...memberIds]; team.reserveIds = [...reserveIds]; audit(state, actorId, `atualizou o elenco de ${team.name}`);
}
export function approveTeam(state: DemoState, actorId: string, teamId: string): void {
  const actor = requireActor(state, actorId), team = state.teams.find(item => item.id === teamId);
  if (!team || actor.role !== 'teacher' || !team.teacherIds.includes(actorId)) throw new Error('Somente o professor responsável pode aprovar esta equipe.');
  team.status = 'ativa'; audit(state, actorId, `aprovou a equipe ${team.name}`);
}
export function deleteTeam(state: DemoState, actorId: string, teamId: string): void {
  const actor = requireActor(state, actorId);
  if (actor.role === 'student') throw new Error('Acesso negado.');
  if (state.tournaments.some(item => item.teamIds.includes(teamId))) throw new Error('Uma equipe inscrita em campeonato não pode ser excluída.');
  state.teams = state.teams.filter(team => team.id !== teamId); audit(state, actorId, 'excluiu uma equipe');
}
