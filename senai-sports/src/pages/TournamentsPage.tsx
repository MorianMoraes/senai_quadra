import { useState, type FormEvent } from 'react';
import { useApp } from '../contexts/AppContext';
import { Button, Card, Empty, Field, Modal } from '../components/ui';
import { TournamentCard } from '../components/TournamentCard';
import { createTournament } from '../services/tournaments';
import { todayISO } from '../utils/format';
import { field } from '../utils/validation';

export function TournamentsPage() {
  const { state, user, act } = useApp(), [creating, setCreating] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    if (act((draft, actor) => createTournament(draft, actor, field(data, 'name'), field(data, 'date')), 'Campeonato criado. Inscrições abertas para os times.')) setCreating(false);
  }
  return <><div className="section-title"><h2>Campeonatos</h2>{user?.role === 'teacher' && <Button onClick={() => setCreating(true)}>＋ Criar campeonato</Button>}</div><div className="notice">O professor cria o campeonato. O líder monta e inscreve o time fechado com exatamente 6 jogadores ativos.</div>{state.tournaments.length ? state.tournaments.map(tournament => <TournamentCard key={tournament.id} tournament={tournament} />) : <Card><Empty>Nenhum campeonato criado ainda.</Empty></Card>}{creating && <Modal title="Criar campeonato" onClose={() => setCreating(false)}><p className="notice">Após a criação, os líderes poderão inscrever seus times completos.</p><form onSubmit={submit}><Field label="Nome" name="name" maxLength={100} required placeholder="Ex.: Campeonato SENAI de Vôlei" /><Field label="Data do campeonato" name="date" type="date" min={todayISO()} required /><div className="modal-footer"><Button variant="secondary" onClick={() => setCreating(false)}>Cancelar</Button><Button type="submit">Criar e abrir inscrições</Button></div></form></Modal>}</>;
}
