import type { Team } from '../types/models';
import { useApp } from '../contexts/AppContext';
import { teamPlayers } from '../services/teams';
import { userName } from '../utils/format';
import { Button, Status } from './ui';
import { SportLabel } from './SportIcon';

export function TeamCard({ team, onDetails, onRoster, onEdit, onDelete, onApprove, onJoin }: { team: Team; onDetails: () => void; onRoster: () => void; onEdit: () => void; onDelete: () => void; onApprove: () => void; onJoin: () => void }) {
  const { state, user } = useApp(), count = teamPlayers(state, team).length;
  const alreadyInTeam = Boolean(user && state.teams.some(item => item.memberIds.includes(user.id) || item.reserveIds.includes(user.id)));
  return <article className="team-card"><div className="team-head">{team.logoUrl&&<img className="team-crest" src={team.logoUrl} alt={`Escudo da equipe ${team.name}`} loading="lazy"/>}<div><h3>{team.name}</h3><SportLabel sport={team.sport} /><div className="muted">{team.teacherIds.length ? team.teacherIds.map(id => userName(state, id)).join(', ') : 'Sem representante vinculado'}</div></div><Status color={team.status === 'ativa' ? 'green' : 'yellow'}>{team.status}</Status></div><div><strong>{count} jogadores</strong> • {team.reserveIds.length} reserva(s)</div><p className="muted">Representante: {userName(state, team.creatorId)}<br />{team.wins} vitórias • {team.losses} derrotas • {team.pointsFor} pontos feitos</p><div className="btn-row"><Button variant="secondary" onClick={onDetails}>Ver equipe e jogadores</Button>{user && (user.role === 'sesi' || user.role === 'director' || team.creatorId === user.id || (user.role === 'teacher' && team.teacherIds.includes(user.id))) && <Button variant="secondary" onClick={onEdit}>Editar equipe</Button>}{user?.role === 'student' && team.status === 'ativa' && team.creatorId !== user.id && !alreadyInTeam && <Button onClick={onJoin}>Entrar na equipe</Button>}{user && (team.creatorId === user.id || (user.role === 'teacher' && team.teacherIds.includes(user.id))) && <Button onClick={onRoster}>Montar time</Button>}{(user?.role === 'director' || user?.role === 'sesi') && team.status !== 'ativa' && <Button variant="success" onClick={onApprove}>Aprovar</Button>}{(user?.role === 'director' || user?.role === 'sesi') && <Button variant="danger" onClick={onDelete}>Excluir</Button>}</div></article>;
}
