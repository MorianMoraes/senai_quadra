import type { Route, Team } from '../types/models';
import { useApp } from '../contexts/AppContext';
import { Button, Card, Empty, Metric, Status } from '../components/ui';
import { GameList } from '../components/GameCard';
import { fmtDate, startTime, todayISO, userName } from '../utils/format';
import { teamPlayers } from '../services/teams';

function TeamList({ teams }: { teams: Team[] }) {
  const { state } = useApp();
  return teams.length ? teams.map(team => <div className="list-item" key={team.id}><div><strong>{team.name}</strong><small>{teamPlayers(state, team).length}/6 jogadores • {team.wins}V {team.losses}D</small></div><Status color={team.status === 'ativa' ? 'green' : 'yellow'}>{team.status}</Status></div>) : <Empty>Nenhuma equipe encontrada.</Empty>;
}
export function DashboardPage({ navigate }: { navigate: (route: Route) => void }) {
  const { state, user } = useApp(); if (!user) return null;
  const upcoming = state.games.filter(game => game.date >= todayISO() && game.status !== 'cancelado').sort((a, b) => startTime(a.date, a.time) - startTime(b.date, b.time));
  const mine = state.teams.filter(team => team.memberIds.includes(user.id) || team.teacherIds.includes(user.id));
  const stats = state.stats.find(item => item.userId === user.id), next = upcoming.find(game => game.participantIds.includes(user.id)) ?? upcoming[0];
  return <><div className="hero"><div><h2>{user.role === 'director' ? 'Visão geral da escola' : `Olá, ${user.name.split(' ')[0]}`}</h2><p>{user.role === 'student' ? 'Bem-vindo ao SENAI Sports.' : 'Organize partidas, equipes e campeonatos.'}</p></div>{user.role === 'teacher' ? <Button variant="secondary" onClick={() => navigate('createGame')}>＋ Criar jogo</Button> : next && <div><small>Próximo jogo</small><p>{fmtDate(next.date)} • {next.time}</p></div>}</div>
    <div className="cards">{user.role === 'student' ? <><Metric label="Pontos" value={stats?.points ?? 0} sub="acumulados" /><Metric label="Vitórias" value={stats?.wins ?? 0} sub="individuais" /><Metric label="Derrotas" value={stats?.losses ?? 0} sub="individuais" /><Metric label="Equipes" value={mine.length} sub="participando" /></> : <><Metric label="Alunos" value={state.users.filter(item => item.role === 'student').length} sub="cadastrados" /><Metric label="Próximos jogos" value={upcoming.length} sub="na agenda" /><Metric label="Equipes" value={user.role === 'director' ? state.teams.length : mine.length} sub="registradas" /><Metric label="Campeonatos" value={state.tournaments.length} sub="criados" /></>}</div>
    <div className="grid-2"><Card><div className="section-title"><h2>Próximos jogos</h2><button className="link-btn" onClick={() => navigate('calendar')}>Ver calendário</button></div><GameList games={upcoming.slice(0, 5)} /></Card><Card><h3>{user.role === 'director' ? 'Atividade recente' : 'Minhas equipes'}</h3>{user.role === 'director' ? state.logs.slice(0, 5).map(log => <div className="list-item" key={log.id}><div><strong>{userName(state, log.actorId)}</strong><small>{log.action}</small></div></div>) : <TeamList teams={mine} />}</Card></div>
  </>;
}
