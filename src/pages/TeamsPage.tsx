import { useState, type FormEvent } from 'react';
import type { Team } from '../types/models';
import { useApp } from '../contexts/AppContext';
import { Button, Empty, Field, Metric, Modal, SelectField, Status } from '../components/ui';
import { TeamCard } from '../components/TeamCard';
import { approveTeam, createTeam, deleteTeam, joinTeam, saveRoster, teamPlayers } from '../services/teams';
import { roleLabel, userName } from '../utils/format';
import { field } from '../utils/validation';
import { SportChoiceGroup, SportLabel } from '../components/SportIcon';

function NewTeamModal({ onClose }: { onClose: () => void }) {
  const { state, user, act } = useApp();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    act((draft, actor) => { createTeam(draft, actor, field(data, 'name'), field(data, 'teacher'), field(data, 'sport') as Team['sport']); }, 'Equipe criada. Ela ficará pendente até a aprovação do representante.');
    onClose();
  }
  return <Modal title="Criar equipe" onClose={onClose}><form onSubmit={submit}><p className="muted">Jogadores podem cadastrar uma equipe para o evento. Ela ficará pendente até a aprovação de um representante.</p><Field label="Nome da equipe" name="name" required maxLength={100} /><SportChoiceGroup name="sport" />{user?.role === 'teacher' && <SelectField label="Professor responsável" name="teacher" required><option value="">Selecione</option>{state.users.filter(item => item.role === 'teacher' && !item.suspended).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField>}<div className="modal-footer"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit">Criar equipe</Button></div></form></Modal>;
}
function RosterModal({ team, onClose }: { team: Team; onClose: () => void }) {
  const { state, act } = useApp(), [members, setMembers] = useState(team.memberIds), [reserves, setReserves] = useState(team.reserveIds);
  const locked = state.tournaments.some(tournament => tournament.teamIds.includes(team.id));
  const players = state.users.filter(user => user.role !== 'director' && !user.suspended);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (act((draft, actor) => saveRoster(draft, actor, team.id, members, reserves), members.length === 6 ? 'Elenco completo salvo.' : 'Elenco salvo. Complete os 6 titulares para se inscrever.')) onClose();
  }
  return <Modal title={`Montar time: ${team.name}`} onClose={onClose}>{locked ? <p className="notice">O elenco está fechado porque o time já está inscrito em campeonato.</p> : <form onSubmit={submit}><p className="notice">Selecione 6 titulares, incluindo o líder. Alunos e professores podem jogar. Até 4 reservas ficam separados dos titulares.</p><div className="roster-options">{players.map(player => <div className="roster-option" key={player.id}><span>{player.name}<small>{roleLabel(player.role)}{player.id === team.creatorId ? ' • Líder' : ''}</small></span><select aria-label={`Posição de ${player.name}`} value={members.includes(player.id) ? 'member' : reserves.includes(player.id) ? 'reserve' : ''} disabled={player.id === team.creatorId} onChange={event => { const role = event.target.value; setMembers([...members.filter(id => id !== player.id), ...(role === 'member' ? [player.id] : [])]); setReserves([...reserves.filter(id => id !== player.id), ...(role === 'reserve' ? [player.id] : [])]); }}><option value="">Não selecionado</option><option value="member" disabled={members.length >= 6 && !members.includes(player.id)}>Titular</option><option value="reserve" disabled={reserves.length >= 4 && !reserves.includes(player.id)}>Reserva</option></select></div>)}</div><p aria-live="polite">{members.length}/6 titulares • {reserves.length}/4 reservas</p><div className="modal-footer"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit">Salvar elenco</Button></div></form>}</Modal>;
}
function TeamDetails({ team, onClose }: { team: Team; onClose: () => void }) {
  const { state } = useApp();
  return <Modal title={team.name} onClose={onClose}><SportLabel sport={team.sport} /> <Status color={team.status === 'ativa' ? 'green' : 'yellow'}>{team.status}</Status><p><strong>Representante:</strong> {userName(state, team.creatorId)}</p><p><strong>Responsável:</strong> {team.teacherIds.map(id => userName(state, id)).join(', ') || 'A definir'}</p><p><strong>Jogadores confirmados ({teamPlayers(state, team).length}/6):</strong></p><ul>{team.memberIds.map(id => <li key={id}>{userName(state, id)}{id === team.creatorId ? ' · Representante' : ''}</li>)}</ul><p><strong>Reservas:</strong> {team.reserveIds.map(id => userName(state, id)).join(', ') || 'Nenhuma'}</p><div className="cards compact-metrics"><Metric label="Vitórias" value={team.wins} /><Metric label="Derrotas" value={team.losses} /><Metric label="Pontos" value={team.pointsFor} /></div></Modal>;
}
export function TeamsPage() {
  const { state, user, act } = useApp(), [search, setSearch] = useState(''), [dialog, setDialog] = useState<{ kind: 'new' | 'detail' | 'roster'; id?: string } | null>(null);
  const selected = state.teams.find(team => team.id === dialog?.id), teams = state.teams.filter(team => team.name.toLowerCase().includes(search.toLowerCase()));
  return <><div className="section-title"><h2>Equipes</h2>{user?.role === 'student' && !state.teams.some(team => team.creatorId === user.id) && <Button onClick={() => setDialog({ kind: 'new' })}>＋ Criar equipe do evento</Button>}</div><div className="searchbar"><input aria-label="Pesquisar equipe" placeholder="Pesquisar equipe..." value={search} onChange={event => setSearch(event.target.value)} /></div><div className="team-grid">{teams.map(team => <TeamCard key={team.id} team={team} onDetails={() => setDialog({ kind: 'detail', id: team.id })} onRoster={() => setDialog({ kind: 'roster', id: team.id })} onJoin={() => act((draft, actor) => joinTeam(draft, actor, team.id), 'Entrada na equipe solicitada.')} onApprove={() => act((draft, actor) => approveTeam(draft, actor, team.id), 'Equipe aprovada.')} onDelete={() => { if (confirm('Tem certeza que deseja excluir esta equipe?')) act((draft, actor) => deleteTeam(draft, actor, team.id), 'Equipe excluída.'); }} />)}</div>{!teams.length && <Empty>Nenhuma equipe encontrada.</Empty>}{dialog?.kind === 'new' && <NewTeamModal onClose={() => setDialog(null)} />}{selected && dialog?.kind === 'detail' && <TeamDetails team={selected} onClose={() => setDialog(null)} />}{selected && dialog?.kind === 'roster' && <RosterModal key={selected.id} team={selected} onClose={() => setDialog(null)} />}</>;
}
