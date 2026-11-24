import { useState } from 'react';
import type { Route, Tournament } from '../types/models';
import { useApp } from '../contexts/AppContext';
import { Button, Card, Modal, Status } from '../components/ui';
import { teamName, todayISO } from '../utils/format';
import { SportIcon, sports } from '../components/SportIcon';
import { sportCategory } from '../utils/sports';
import { GameDetails, GamesPage } from './GamesPage';

type CalendarView = 'month' | 'agenda';

export function CalendarPage({ navigate }: { navigate: (route: Route) => void }) {
  const { state, user } = useApp();
  const [month, setMonth] = useState(() => new Date());
  const [view, setView] = useState<CalendarView>(() => window.matchMedia('(max-width: 700px)').matches ? 'agenda' : 'month');
  const [detail, setDetail] = useState<string | null>(null);
  const [category, setCategory] = useState('');
  const [calendarFilter, setCalendarFilter] = useState('');
  const [myAgenda, setMyAgenda] = useState(false);
  const [tournamentDetail, setTournamentDetail] = useState<Tournament | null>(null);
  const year = month.getFullYear(), index = month.getMonth();
  const offset = new Date(year, index, 1).getDay(), count = new Date(year, index + 1, 0).getDate();
  const game = state.games.find(item => item.id === detail);
  const tournamentTeams = tournamentDetail?.teamIds.map(id => teamName(state, id)) ?? [];
  const monthLabel = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(month);
  const calendarOptions = [...new Set(state.games.map(item => item.calendar || 'geral'))];

  return <>
    <div className="calendar-page-heading"><div><p className="eyebrow">AGENDA ESPORTIVA</p><h2>Uma visão clara de cada partida.</h2><p className="muted">Acompanhe horários, inscrições e campeonatos em um só lugar.</p></div>{(user?.role === 'teacher' || user?.role === 'director') && <Button onClick={() => navigate('createGame')}>＋ Criar jogo</Button>}</div>
    <div className="category-tabs" role="group" aria-label="Categoria do calendário">{[['','Todas'],['quadra','Jogos de quadra'],['mesa','Mesa e tabuleiro']].map(([value,label]) => <button type="button" key={value} aria-pressed={category===value} onClick={() => setCategory(value!)}>{label}</button>)}</div>
    <div className="calendar-personal-filters">{calendarOptions.length > 1 && <label className="form-field">Calendário<select aria-label="Filtrar calendário" value={calendarFilter} onChange={event => setCalendarFilter(event.target.value)}><option value="">Todos os calendários</option>{calendarOptions.map(value => <option key={value} value={value}>{value === 'geral' ? 'Agenda esportiva geral' : value}</option>)}</select></label>}{user?.role === 'student' && <button type="button" className="personal-agenda-toggle" aria-pressed={myAgenda} onClick={() => setMyAgenda(value => !value)}>{myAgenda ? 'Minha agenda ✓' : 'Ver minha agenda'}</button>}</div>
    <Card className="calendar-card">
      <div className="calendar-toolbar">
        <div className="calendar-nav"><Button variant="secondary" aria-label="Mês anterior" onClick={() => setMonth(new Date(year, index - 1, 1))}>←</Button><div className="calendar-title">{monthLabel}</div><Button variant="secondary" aria-label="Próximo mês" onClick={() => setMonth(new Date(year, index + 1, 1))}>→</Button></div>
        <div className="calendar-controls"><div className="calendar-view-switch" role="group" aria-label="Visualização do calendário"><button aria-pressed={view === 'month'} onClick={() => setView('month')}>Mês</button><button aria-pressed={view === 'agenda'} onClick={() => setView('agenda')}>Lista</button></div><Button variant="secondary" onClick={() => setMonth(new Date())}>Hoje</Button></div>
      </div>
      {view === 'month' ? <div className="calendar-scroll"><div className="calendar-grid">{['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day} className="weekday">{day}</div>)}{Array.from({ length: offset }, (_, day) => <div className="day empty" key={`empty-${day}`} />)}{Array.from({ length: count }, (_, day) => {
        const date = todayISO(new Date(year, index, day + 1));
        const dailyGames = state.games.filter(item => item.date === date && (!category || sportCategory(item.sport) === category) && (!calendarFilter || (item.calendar || 'geral') === calendarFilter) && (!myAgenda || Boolean(user && item.participantIds.includes(user.id))));
        const dailyTournaments = state.tournaments.filter(item => item.date === date && (!myAgenda || Boolean(user && item.registrations.some(registration => registration.memberIds.includes(user.id)))));
        return <div className={`day ${date === todayISO() ? 'today' : ''}`} key={date}><div className="day-number">{day + 1}</div>{dailyGames.map(item => {
          const sportLabel = sports.find(sport => sport.id === item.sport)?.name ?? 'Modalidade';
          const chipTitle = item.team1 || item.team2 ? `${teamName(state, item.team1)} × ${teamName(state, item.team2)}` : sportLabel;
          const ariaTitle = item.team1 || item.team2 ? `${teamName(state, item.team1)} contra ${teamName(state, item.team2)}` : sportLabel;
          return <button key={item.id} className={`event-chip status-${item.status} ${user && item.participantIds.includes(user.id) ? 'registered' : ''}`} onClick={() => setDetail(item.id)} aria-label={`${item.time}, ${sportLabel}, ${ariaTitle}, ${item.status}`}><SportIcon sport={item.sport} />{item.time} · {chipTitle}</button>;
        })}{dailyTournaments.map(item => <button key={item.id} className="event-chip tournament-event" onClick={() => setTournamentDetail(item)} aria-label={`Campeonato ${item.name}, ${item.status}`}>CAMPEONATO · {item.name}</button>)}</div>;
      })}</div></div> : <div className="calendar-agenda"><section className="agenda-games"><div className="section-title"><div><h3>Jogos</h3><p className="muted">Filtre partidas e veja inscrições e resultados.</p></div></div><GamesPage navigate={navigate} initialCategory={category} initialCalendar={calendarFilter} myOnly={myAgenda} embedded /></section><section className="agenda-tournaments"><div className="section-title"><div><h3>Campeonatos</h3><p className="muted">Datas e equipes inscritas.</p></div></div>{state.tournaments.length ? <div className="agenda-tournament-list">{[...state.tournaments].filter(item => !myAgenda || Boolean(user && item.registrations.some(registration => registration.memberIds.includes(user.id)))).sort((a, b) => a.date.localeCompare(b.date)).map(item => <button key={item.id} className="agenda-tournament" onClick={() => setTournamentDetail(item)}><span className="tournament-mark">T</span><span className="agenda-tournament-copy"><strong>{item.name}</strong><small>{new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(`${item.date}T12:00:00`))} · {item.teamIds.length} equipes</small></span><Status color={item.status === 'finalizado' ? 'green' : 'blue'}>{item.status}</Status></button>)}</div> : <div className="empty-state">Nenhum campeonato cadastrado.</div>}</section></div>}
    </Card>
    {view === 'month' && game && <GameDetails game={game} onClose={() => setDetail(null)} />}
    {tournamentDetail && <Modal title={tournamentDetail.name} onClose={() => setTournamentDetail(null)}><div className="tournament-detail"><p><strong>Data:</strong> {new Intl.DateTimeFormat('pt-BR', { dateStyle: 'long' }).format(new Date(`${tournamentDetail.date}T12:00:00`))}</p><p><strong>Status:</strong> {tournamentDetail.status}</p><p><strong>Equipes participantes:</strong></p>{tournamentTeams.length ? <ul>{tournamentTeams.map(team => <li key={team}>{team}</li>)}</ul> : <p className="muted">Nenhuma equipe inscrita ainda.</p>}</div></Modal>}
  </>;
}
