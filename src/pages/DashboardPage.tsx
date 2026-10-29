import type { Route, Team } from '../types/models';
import { useApp } from '../contexts/AppContext';
import { Button, Card, Empty, Metric, Status } from '../components/ui';
import { GameList } from '../components/GameCard';
import { fmtDate, startTime, todayISO, userName } from '../utils/format';
import { teamPlayers } from '../services/teams';

function TeamList({ teams }: { teams: Team[] }) {
  const { state } = useApp();
  return teams.length ? teams.slice(0, 5).map(team => <div className="list-item" key={team.id}><div><strong>{team.name}</strong><small>{teamPlayers(state, team).length}/6 jogadores · {team.wins}V {team.losses}D</small></div><Status color={team.status === 'ativa' ? 'green' : 'yellow'}>{team.status}</Status></div>) : <Empty>Nenhuma equipe encontrada.</Empty>;
}

export function DashboardPage({ navigate }: { navigate: (route: Route) => void }) {
  const { state, user } = useApp();
  if (!user) return null;
  const upcoming = state.games.filter(game => game.date >= todayISO() && game.status !== 'cancelado').sort((a, b) => startTime(a.date, a.time) - startTime(b.date, b.time));
  const mine = state.teams.filter(team => team.memberIds.includes(user.id) || team.teacherIds.includes(user.id));
  const stats = state.stats.find(item => item.userId === user.id);
  const next = upcoming.find(game => game.participantIds.includes(user.id)) ?? upcoming[0];
  const greeting = user.role === 'director' ? 'Visão geral da escola' : `Olá, ${user.name.split(' ')[0]}`;

  return <div className="dashboard-page">
    <section className="hero dashboard-hero"><div><p className="eyebrow">PAINEL DA QUADRA</p><h2>{greeting}</h2><p>{user.role === 'student' ? 'Confira seus resultados e o que vem pela frente.' : 'Acompanhe a atividade esportiva e organize a próxima rodada.'}</p></div><div className="dashboard-hero-actions">{user.role === 'teacher' && <Button onClick={() => navigate('createGame')}>＋ Criar jogo</Button>}<Button variant="secondary" onClick={() => navigate('calendar')}>Abrir calendário</Button></div>{next && <button className="next-game-peek" onClick={() => navigate('calendar')}><span>PRÓXIMO JOGO</span><strong>{fmtDate(next.date)} · {next.time}</strong><small>{next.court}</small></button>}</section>

    <div className="cards dashboard-metrics">{user.role === 'student' ? <><Metric label="Pontos" value={stats?.points ?? 0} sub="acumulados" /><Metric label="Vitórias" value={stats?.wins ?? 0} sub="individuais" /><Metric label="Derrotas" value={stats?.losses ?? 0} sub="individuais" /><Metric label="Equipes" value={mine.length} sub="participando" /></> : <><Metric label="Alunos" value={state.users.filter(item => item.role === 'student').length} sub="cadastrados" /><Metric label="Próximos jogos" value={upcoming.length} sub="na agenda" /><Metric label="Equipes" value={user.role === 'director' ? state.teams.length : mine.length} sub="registradas" /><Metric label="Campeonatos" value={state.tournaments.length} sub="em andamento" /></>}</div>

    <div className="dashboard-grid"><Card className="dashboard-upcoming"><div className="section-title"><div><p className="eyebrow">AGENDA</p><h2>Próximos jogos</h2></div><button className="link-btn" onClick={() => navigate('calendar')}>Ver agenda →</button></div><GameList games={upcoming.slice(0, 4)} /></Card><div className="dashboard-side"><Card><div className="section-title"><div><p className="eyebrow">ATALHOS</p><h3>Acesso rápido</h3></div></div><div className="dashboard-shortcuts"><button onClick={() => navigate('calendar')}><span className="shortcut-symbol">◷</span><span><strong>Calendário</strong><small>Jogos e campeonatos</small></span><span className="shortcut-arrow">→</span></button><button onClick={() => navigate('management')}><span className="shortcut-symbol">⚙</span><span><strong>Gerenciamento</strong><small>Perfil, equipes e torneios</small></span><span className="shortcut-arrow">→</span></button>{user.role === 'director' && <button onClick={() => navigate('users')}><span className="shortcut-symbol">♙</span><span><strong>Usuários</strong><small>Contas e permissões</small></span><span className="shortcut-arrow">→</span></button>}</div></Card><Card><div className="section-title"><div><p className="eyebrow">{user.role === 'director' ? 'SISTEMA' : 'TIME'}</p><h3>{user.role === 'director' ? 'Atividade recente' : 'Minhas equipes'}</h3></div></div>{user.role === 'director' ? state.logs.slice(0, 4).map(log => <div className="list-item" key={log.id}><div><strong>{userName(state, log.actorId)}</strong><small>{log.action}</small></div></div>) : <TeamList teams={mine} />}</Card></div></div>
  </div>;
}
