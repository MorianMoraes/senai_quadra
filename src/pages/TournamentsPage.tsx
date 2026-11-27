import { useState, type FormEvent } from 'react';
import { useApp } from '../contexts/AppContext';
import { Button, Card, Empty, Field, Modal } from '../components/ui';
import { TournamentCard } from '../components/TournamentCard';
import { createTournament } from '../services/tournaments';
import { todayISO } from '../utils/format';
import { field } from '../utils/validation';
import { availableSports } from '../components/SportIcon';
import { uid } from '../utils/format';
import { userName } from '../utils/format';
import type { Route } from '../types/models';

function TournamentNotesPanel() {
  const { state, user, actAsync } = useApp();
  const [drafts, setDrafts] = useState<Record<string, string>>({}), [editingNote, setEditingNote] = useState('');
  if (user?.role !== 'teacher') return null;
  const myTeams = state.teams.filter(team => team.creatorId === user.id || team.teacherIds.includes(user.id));
  const joined = state.tournaments.flatMap(tournament => tournament.teamIds.flatMap(teamId => {
    const team = myTeams.find(item => item.id === teamId);
    return team ? [{ tournament, team }] : [];
  }));
  if (!joined.length) return null;
  return <section className="team-notes"><h3>Observações do Campeonato</h3><p className="muted">Suas anotações ficam privadas para a equipe responsável e a administração.</p>{joined.map(({ tournament, team }) => {
    const notes = state.tournamentNotes.filter(note => note.tournamentId === tournament.id && note.teamId === team.id).sort((a,b)=>b.createdAt.localeCompare(a.createdAt));
    const key = `${tournament.id}:${team.id}`;
    return <Card key={key}><strong>{tournament.name} · {team.name}</strong>{notes.map(note=><div className="team-note-item" key={note.id}><p>{note.text}</p><small>{userName(state,note.authorId)} · {new Date(note.createdAt).toLocaleString('pt-BR')}</small>{note.authorId===user.id&&<Button variant="secondary" onClick={()=>{setEditingNote(note.id);setDrafts(current=>({...current,[key]:note.text}))}}>Editar</Button>}</div>)}<form onSubmit={event=>{event.preventDefault();const text=(drafts[key]??'').trim();if(!text)return;void actAsync(draft=>{const existing=draft.tournamentNotes.find(note=>note.id===editingNote);if(existing){existing.text=text;existing.updatedAt=new Date().toISOString()}else draft.tournamentNotes.push({id:uid('note'),tournamentId:tournament.id,teamId:team.id,authorId:user.id,text,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()})},'Observação salva.').then(ok=>{if(ok){setEditingNote('');setDrafts(current=>({...current,[key]:''}))}})}}><label htmlFor={`note-${key}`}>{editingNote?'Editar observação':'Nova observação'}</label><textarea id={`note-${key}`} value={drafts[key]??''} maxLength={5000} onChange={event=>setDrafts(current=>({...current,[key]:event.target.value}))}/><Button type="submit" disabled={!drafts[key]?.trim()}>Salvar observação</Button></form></Card>;
  })}</section>;
}

export function TournamentsPage({ navigate }: { navigate: (route: Route, tournamentId?: string) => void }) {
  const { state, user, actAsync } = useApp();
  const [creating, setCreating] = useState(false), [busy, setBusy] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget), limit = field(data, 'teamLimit'); setBusy(true);
    try {
      const ok = await actAsync((draft, actor) => createTournament(draft, actor, { name: field(data, 'name'), sport: field(data, 'sport') as never, gender: field(data, 'gender') as 'Masculino' | 'Feminino' | 'Misto', tieBreak: field(data,'tieBreak') as 'saldo'|'gols', teamLimit: limit ? Number(limit) : null, startDate: field(data, 'startDate'), endDate: field(data, 'endDate'), banner: field(data, 'banner') }), 'Campeonato criado.');
      if (ok) setCreating(false);
    } finally { setBusy(false); }
  }
  return <><div className="section-title"><h2>Campeonatos</h2>{(user?.role === 'director' || user?.role === 'sesi') && <Button onClick={() => setCreating(true)}>＋ Criar campeonato</Button>}</div><div className="notice">Acompanhe inscrições, equipes e vagas disponíveis por campeonato.</div><TournamentNotesPanel/>{state.tournaments.length ? state.tournaments.map(tournament => <TournamentCard key={tournament.id} tournament={tournament} onCreateGame={id=>navigate('createGame',id)} />) : <Card><Empty>Nenhum campeonato criado ainda.</Empty></Card>}{creating && <Modal title="Criar campeonato" onClose={() => setCreating(false)}><form onSubmit={submit}><Field label="Nome" name="name" maxLength={100} required placeholder="Ex.: Campeonato SENAI"/><div className="form-field"><label htmlFor="tournament-sport">Modalidade</label><select id="tournament-sport" name="sport" defaultValue="volei" required>{(['quadra','verao','mesa'] as const).map(group=><optgroup key={group} label={group==='verao'?'Jogos de Verão':group==='mesa'?'Jogos de Mesa':'Quadra'}>{availableSports.filter(s=>s.category===group).map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</optgroup>)}</select></div><div className="form-field"><label htmlFor="gender">Naipe</label><select id="gender" name="gender"><option>Masculino</option><option>Feminino</option><option>Misto</option></select></div><div className="form-field"><label htmlFor="tieBreak">Desempate da classificação</label><select id="tieBreak" name="tieBreak" defaultValue="saldo"><option value="saldo">Saldo de gols, depois gols pró</option><option value="gols">Gols pró, depois saldo</option></select></div><Field label="Limite de equipes (opcional)" name="teamLimit" type="number" min="1" placeholder="Sem limite"/><Field label="Data de início" name="startDate" type="date" min={todayISO()} required/><Field label="Data de encerramento" name="endDate" type="date" min={todayISO()}/><Field label="Imagem do campeonato (URL)" name="banner" type="url" placeholder="https://..."/><div className="modal-footer"><Button variant="secondary" onClick={() => setCreating(false)}>Cancelar</Button><Button type="submit" disabled={busy}>{busy?'Criando…':'Criar campeonato'}</Button></div></form></Modal>}</>;
}
