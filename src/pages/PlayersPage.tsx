import { useState, type FormEvent } from 'react';
import { useApp } from '../contexts/AppContext';
import { Button, Card, Empty, Field } from '../components/ui';
import { uid } from '../utils/format';
import type { PlayerRecord } from '../types/models';

export function PlayersPage() {
  const { state, user, actAsync } = useApp();
  const [teamId, setTeamId] = useState(''), [editing, setEditing] = useState<PlayerRecord | null>(null), [busy, setBusy] = useState(false);
  if (!user || (user.role !== 'teacher' && user.role !== 'sesi' && user.role !== 'director')) return <Empty>Esta área é exclusiva para equipes e administradores.</Empty>;
  const actor = user;
  const teams = state.teams.filter(team => actor.role !== 'teacher' || team.creatorId === actor.id || team.teacherIds.includes(actor.id));
  const selectedTeamId = teams.some(team => team.id === teamId) ? teamId : teams[0]?.id ?? '';
  const records = state.players.filter(player => player.teamId === selectedTeamId);
  const team = teams.find(item => item.id === selectedTeamId);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); if (!selectedTeamId) return;
    const form = event.currentTarget;
    const data = new FormData(event.currentTarget), fullName = String(data.get('fullName') ?? '').trim();
    const cpf = String(data.get('cpf') ?? '').replace(/\D/g, ''), enrollment = String(data.get('enrollment') ?? '').trim();
    const birthDate = String(data.get('birthDate') ?? '');
    if (cpf.length !== 11) { alert('Informe um CPF com 11 números.'); return; }
    setBusy(true);
    try {
      const ok = await actAsync(draft => {
        const duplicate = draft.players.some(player => player.id !== editing?.id && (player.cpf.replace(/\D/g, '') === cpf || Boolean(enrollment) && player.enrollment.toLowerCase() === enrollment.toLowerCase()));
        if (duplicate) throw new Error('Já existe um jogador com este CPF ou matrícula.');
        const record: PlayerRecord = { id: editing?.id ?? uid('player'), teamId: selectedTeamId, fullName, birthDate, cpf, enrollment, createdBy: editing?.createdBy ?? actor.id };
        if (editing) draft.players = draft.players.map(player => player.id === editing.id ? record : player);
        else draft.players.push(record);
      }, editing ? 'Jogador atualizado.' : 'Jogador cadastrado.');
      if (ok) { setEditing(null); form.reset(); }
    } finally { setBusy(false); }
  }
  return <div className="players-page"><div className="section-title"><div><h2>Jogadores</h2><p className="muted">Dados pessoais ficam visíveis apenas para a equipe responsável e a administração.</p></div></div>
    {!teams.length ? <Card><Empty>Você ainda não está vinculado a uma equipe. Acesse Minha Equipe para configurá-la.</Empty></Card> : <>
      {teams.length > 1 && <div className="form-field"><label htmlFor="player-team">Equipe</label><select id="player-team" name="team" value={selectedTeamId} onChange={event => { setTeamId(event.target.value); setEditing(null); }}>{teams.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>}
      <div className="players-layout"><Card><h3>{editing ? 'Editar jogador' : `Cadastrar jogador${team ? ` · ${team.name}` : ''}`}</h3><form className="player-form" onSubmit={submit}>
        <Field label="Nome completo" name="fullName" required maxLength={120} defaultValue={editing?.fullName ?? ''}/>
        <Field label="Data de nascimento" name="birthDate" type="date" required defaultValue={editing?.birthDate ?? ''}/>
        <Field label="CPF" name="cpf" inputMode="numeric" pattern="[0-9.\-]{11,14}" placeholder="Somente números" required defaultValue={editing?.cpf ?? ''}/>
        <Field label="Matrícula individual" name="enrollment" required maxLength={40} defaultValue={editing?.enrollment ?? ''}/>
        <div className="modal-footer"><Button type="button" variant="secondary" onClick={() => setEditing(null)}>Limpar</Button><Button type="submit" disabled={busy}>{busy ? 'Salvando…' : editing ? 'Salvar alterações' : 'Cadastrar jogador'}</Button></div>
      </form></Card><Card><h3>Elenco · {records.length}</h3>{records.length ? <div className="list">{records.map(player => <div className="list-item" key={player.id}><div><strong>{player.fullName}</strong><small>Nascimento: {player.birthDate} · Matrícula: {player.enrollment} · CPF: {player.cpf}</small></div>{(actor.role !== 'teacher' || player.createdBy === actor.id) && <div className="inline-actions"><Button variant="secondary" onClick={() => setEditing(player)}>Editar</Button><Button variant="danger" onClick={() => { if (confirm(`Remover ${player.fullName} da equipe?`)) void actAsync(draft => { draft.players = draft.players.filter(item => item.id !== player.id); }, 'Jogador removido.'); }}>Remover</Button></div>}</div>)}</div> : <Empty>Nenhum jogador cadastrado nesta equipe.</Empty>}</Card></div>
    </>}
  </div>;
}
