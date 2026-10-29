import { useState } from 'react';
import type { Route } from '../types/models';
import { useApp } from '../contexts/AppContext';
import { Button, Card } from '../components/ui';
import { teamName, todayISO } from '../utils/format';
import { GameDetails } from './GamesPage';

export function CalendarPage({ navigate }: { navigate: (route: Route) => void }) {
  const { state, user } = useApp(), [month, setMonth] = useState(new Date()), [detail, setDetail] = useState<string | null>(null);
  const year = month.getFullYear(), index = month.getMonth(), offset = new Date(year, index, 1).getDay(), count = new Date(year, index + 1, 0).getDate();
  const game = state.games.find(item => item.id === detail);
  return <Card><div className="calendar-toolbar"><div className="calendar-nav"><Button variant="secondary" aria-label="Mês anterior" onClick={() => setMonth(new Date(year, index - 1, 1))}>←</Button><div className="calendar-title">{new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' }).format(month)}</div><Button variant="secondary" aria-label="Próximo mês" onClick={() => setMonth(new Date(year, index + 1, 1))}>→</Button></div>{user?.role === 'teacher' && <Button onClick={() => navigate('createGame')}>＋ Criar jogo</Button>}</div><div className="calendar-scroll"><div className="calendar-grid">{['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(day => <div key={day} className="weekday">{day}</div>)}{Array.from({ length: offset }, (_, day) => <div className="day empty" key={`empty${day}`} />)}{Array.from({ length: count }, (_, day) => {
    const date = todayISO(new Date(year, index, day + 1));
    return <div className="day" key={date}><div className="day-number">{day + 1}</div>{state.games.filter(item => item.date === date).map(item => <button key={item.id} className={`event-chip ${item.status === 'cancelado' ? 'cancelled' : item.participantIds.includes(user?.id ?? '') ? 'registered' : ''}`} onClick={() => setDetail(item.id)}>{item.time} {teamName(state, item.team1)} × {teamName(state, item.team2)}</button>)}</div>;
  })}</div></div>{game && <GameDetails game={game} onClose={() => setDetail(null)} />}</Card>;
}
