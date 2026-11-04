import type { Team } from '../types/models';
import { useApp } from '../contexts/AppContext';
import { teamPlayers } from '../services/teams';
import { userName } from '../utils/format';
import { Button, Status } from './ui';
import { SportLabel } from './SportIcon';

export function TeamCard({ team, onDetails, onRoster, onDelete, onApprove }: { team: Team; onDetails: () => void; onRoster: () => void; onDelete: () => void; onApprove: () => void }) {
  const { state, user } = useApp(), count = teamPlayers(state, team).length;
  return <article className="team-card"><div className="team-head"><div><h3>{team.name}</h3><SportLabel sport={team.sport} /><div className="muted">{user ? team.teacherIds.map(id => userName(state, id)).join(', ') : 'Equipe escolar'}</div></div><Status color={team.status === 'ativa' ? 'green' : 'yellow'}>{team.status}</Status></div>{user && <><div className="progress"><span style={{ width: `${Math.min(100, count / 6 * 100)}%` }} /></div><div><strong>{count}/6 {count === 6 ? '— TIME COMPLETO' : 'jogadores'}</strong> • {team.reserveIds.length} reserva(s)</div><p className="muted">Representante: {userName(state, team.creatorId)}<br />{team.wins} vitórias • {team.losses} derrotas • {team.pointsFor} pontos feitos</p></>}<div className="btn-row"><Button variant="secondary" onClick={onDetails}>Ver equipe</Button>{user && (team.creatorId === user.id || (user.role === 'teacher' && team.teacherIds.includes(user.id))) && <Button onClick={onRoster}>Montar time</Button>}{user?.role === 'director' && team.status !== 'ativa' && <Button variant="success" onClick={onApprove}>Aprovar</Button>}{user?.role === 'director' && <Button variant="danger" onClick={onDelete}>Excluir</Button>}</div></article>;
}
