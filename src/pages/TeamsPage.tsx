import { useState, type FormEvent } from 'react';
import type { Team } from '../types/models';
import { useApp } from '../contexts/AppContext';
import { Button, Empty, Field, Metric, Modal, SelectField, Status } from '../components/ui';
import { TeamCard } from '../components/TeamCard';
import { approveTeam, createTeam, deleteTeam, joinTeam, saveRoster, teamPlayers, updateTeam } from '../services/teams';
import { roleLabel, userName } from '../utils/format';
import { field } from '../utils/validation';
import { SportChoiceGroup, SportLabel } from '../components/SportIcon';

function NewTeamModal({ onClose }: { onClose: () => void }) {
  const { state, user, actAsync } = useApp();
  const [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    const successText = user?.role === 'teacher' ? 'Equipe criada e ativada.' : 'Equipe criada. Ela ficará pendente até a aprovação do representante.';
    setBusy(true);
    try {
      if (await actAsync((draft, actor) => { createTeam(draft, actor, field(data, 'name'), field(data, 'teacher'), field(data, 'sport') as Team['sport']); }, successText)) onClose();
    } finally { setBusy(false); }
  }
  return <Modal title="Criar equipe" onClose={onClose}><form onSubmit={submit}><p className="muted">{user?.role === 'teacher' ? 'Cadastre uma nova equipe e selecione o professor responsável.' : 'Jogadores podem cadastrar uma equipe para o evento. Ela ficará pendente até a aprovação de um representante.'}</p><Field label="Nome da equipe" name="name" required maxLength={100} /><SportChoiceGroup name="sport" />{user?.role === 'teacher' && <SelectField label="Professor responsável" name="teacher" required><option value="">Selecione</option>{state.users.filter(item => item.role === 'teacher' && !item.suspended).map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField>}<div className="modal-footer"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? 'Criando…' : 'Criar equipe'}</Button></div></form></Modal>;
}
function RosterModal({ team, onClose }: { team: Team; onClose: () => void }) {
  const { state, user, actAsync } = useApp();
  const activeIds = new Set(state.users.filter(item => item.role !== 'director' && !item.suspended).map(item => item.id));
  const [members, setMembers] = useState(() => team.memberIds.filter(id => id === team.creatorId || activeIds.has(id)));
  const [reserves, setReserves] = useState(() => team.reserveIds.filter(id => activeIds.has(id)));
  const [busy, setBusy] = useState(false);
  const locked = state.tournaments.some(tournament => tournament.teamIds.includes(team.id));
  const ownRoster = new Set([...team.memberIds, ...team.reserveIds, team.creatorId]);
  const players = state.users.filter(item => item.role !== 'director' && !item.suspended && (user?.role !== 'teacher' || ownRoster.has(item.id)));
  const otherTeamByPlayer = new Map<string, string>();
  for (const other of state.teams) {
    if (other.id === team.id) continue;
    for (const id of [...other.memberIds, ...other.reserveIds]) otherTeamByPlayer.set(id, other.name);
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    try {
      if (await actAsync((draft, actor) => saveRoster(draft, actor, team.id, members, reserves), 'Elenco atualizado.')) onClose();
    } finally { setBusy(false); }
  }
  return <Modal title={`Montar time: ${team.name}`} onClose={onClose}>{locked ? <p className="notice">O elenco está fechado porque o time já está inscrito em campeonato.</p> : <form onSubmit={submit}><p className="notice">Adicione ou retire jogadores conforme a necessidade. O responsável da equipe deve permanecer no elenco.</p><div className="roster-options">{players.map(player => {
    const otherTeam = otherTeamByPlayer.get(player.id);
    const blockedInStudentMode = user?.role === 'student' && Boolean(otherTeam) && !members.includes(player.id) && !reserves.includes(player.id);
    return <div className="roster-option" key={player.id}><span>{player.name || 'Usuário'}<small>{roleLabel(player.role)}{player.id === team.creatorId ? ' • Líder' : ''}{otherTeam ? ` • em ${otherTeam}` : ''}</small></span><select aria-label={`Posição de ${player.name || 'Usuário'}`} value={members.includes(player.id) ? 'member' : reserves.includes(player.id) ? 'reserve' : ''} disabled={player.id === team.creatorId} onChange={event => { const role = event.target.value; setMembers([...members.filter(id => id !== player.id), ...(role === 'member' ? [player.id] : [])]); setReserves([...reserves.filter(id => id !== player.id), ...(role === 'reserve' ? [player.id] : [])]); }}><option value="">Não selecionado</option><option value="member" disabled={blockedInStudentMode || false}>Titular</option><option value="reserve" disabled={blockedInStudentMode || false}>Reserva</option></select></div>;
  })}</div><p aria-live="polite">{members.length} jogadores • {reserves.length} reservas</p><div className="modal-footer"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar elenco'}</Button></div></form>}</Modal>;
}
function TeamDetails({ team, onClose }: { team: Team; onClose: () => void }) {
  const { state } = useApp();
  return <Modal title={team.name} onClose={onClose}><SportLabel sport={team.sport} /> <Status color={team.status === 'ativa' ? 'green' : 'yellow'}>{team.status}</Status><p><strong>Representante:</strong> {userName(state, team.creatorId)}</p><p><strong>Responsável:</strong> {team.teacherIds.map(id => userName(state, id)).join(', ') || 'A definir'}</p><p><strong>Jogadores confirmados ({teamPlayers(state, team).length}):</strong></p><ul>{team.memberIds.map(id => <li key={id}>{userName(state, id)}{id === team.creatorId ? ' · Representante' : ''}</li>)}</ul><p><strong>Reservas:</strong> {team.reserveIds.map(id => userName(state, id)).join(', ') || 'Nenhuma'}</p><div className="cards compact-metrics"><Metric label="Vitórias" value={team.wins} /><Metric label="Derrotas" value={team.losses} /><Metric label="Pontos" value={team.pointsFor} /></div></Modal>;
}
function EditTeamModal({ team, onClose }: { team: Team; onClose: () => void }) {
  const { actAsync } = useApp(); const [busy,setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); const data=new FormData(event.currentTarget); setBusy(true); try { if(await actAsync((draft,actor)=>updateTeam(draft,actor,team.id,field(data,'name'),field(data,'logoUrl')),'Equipe atualizada.')) onClose(); } finally { setBusy(false); } }
  return <Modal title={`Editar equipe: ${team.name}`} onClose={onClose}><form onSubmit={submit}><Field label="Nome da equipe" name="name" required maxLength={100} defaultValue={team.name}/><Field label="Link do brasão ou escudo (opcional)" name="logoUrl" type="url" placeholder="https://..." defaultValue={team.logoUrl??''}/><div className="modal-footer"><Button variant="secondary" onClick={onClose}>Cancelar</Button><Button type="submit" disabled={busy}>{busy?'Salvando…':'Salvar equipe'}</Button></div></form></Modal>;
}
export function TeamsPage() {
  const { state, user, actAsync } = useApp(), [search, setSearch] = useState(''), [dialog, setDialog] = useState<{ kind: 'new' | 'detail' | 'roster' | 'edit'; id?: string } | null>(null);
  const selected = state.teams.find(team => team.id === dialog?.id), teams = state.teams.filter(team => (user?.role !== 'teacher' || team.creatorId === user.id || team.teacherIds.includes(user.id)) && team.name.toLowerCase().includes(search.toLowerCase()));
  const canCreate = Boolean((user?.role === 'student' && !state.teams.some(team => team.creatorId === user.id)) || user?.role === 'teacher');
  return <><div className="section-title"><h2>Equipes</h2>{canCreate && <Button onClick={() => setDialog({ kind: 'new' })}>＋ Criar equipe do evento</Button>}</div><div className="searchbar"><input aria-label="Pesquisar equipe" placeholder="Pesquisar equipe..." value={search} onChange={event => setSearch(event.target.value)} /></div><div className="team-grid">{teams.map(team => <TeamCard key={team.id} team={team} onDetails={() => setDialog({ kind: 'detail', id: team.id })} onRoster={() => setDialog({ kind: 'roster', id: team.id })} onEdit={()=>setDialog({kind:'edit',id:team.id})} onJoin={() => { void actAsync((draft, actor) => joinTeam(draft, actor, team.id), 'Você entrou na equipe.'); }} onApprove={() => { void actAsync((draft, actor) => approveTeam(draft, actor, team.id), 'Equipe aprovada.'); }} onDelete={() => { if (confirm('Tem certeza que deseja excluir esta equipe?')) void actAsync((draft, actor) => deleteTeam(draft, actor, team.id), 'Equipe excluída.'); }} />)}</div>{!teams.length && <Empty>Nenhuma equipe encontrada.</Empty>}{dialog?.kind === 'new' && <NewTeamModal onClose={() => setDialog(null)} />}{selected && dialog?.kind === 'detail' && <TeamDetails team={selected} onClose={() => setDialog(null)} />}{selected && dialog?.kind === 'roster' && <RosterModal key={selected.id} team={selected} onClose={() => setDialog(null)} />}{selected && dialog?.kind === 'edit' && <EditTeamModal team={selected} onClose={() => setDialog(null)} />}</>;
}
