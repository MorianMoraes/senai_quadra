import { useApp } from '../contexts/AppContext';
import { Button, Card, Empty } from '../components/ui';
import { GameList } from '../components/GameCard';
import { startTime } from '../utils/format';
import { canViewHistory } from '../services/auth';

export function HistoryPage({ onLogin }: { onLogin?: () => void } = {}) {
  const { state, user } = useApp();
  if (!canViewHistory(user)) return <Card className="history-access-card"><h2>Entre para consultar o histórico</h2><p className="muted">Os resultados detalhados e os rankings ficam disponíveis somente para usuários autenticados.</p>{onLogin && <Button onClick={onLogin}>Entrar</Button>}</Card>;
  const players = state.stats.map(stats => ({ ...stats, user: state.users.find(user => user.id === stats.userId) })).filter(item => item.user?.role === 'student').sort((a, b) => b.points - a.points);
  const teams = [...state.teams].sort((a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor);
  const games = state.games.filter(game => ['finalizado', 'cancelado'].includes(game.status)).sort((a, b) => startTime(b.date, b.time) - startTime(a.date, a.time));

  return <div className="performance-page">
    <section aria-labelledby="history-ranking-title">
      <div className="section-title"><div><p className="eyebrow">DESEMPENHO</p><h2 id="history-ranking-title">Ranking</h2></div></div>
      <div className="grid-equal">
        <Card><h3>Ranking de alunos</h3>{players.length ? <div className="table-wrap mobile-cards"><table><thead><tr><th>#</th><th>Aluno</th><th>Pontos</th><th>Aces</th><th>Bloqueios</th><th>V/D</th></tr></thead><tbody>{players.map((item, index) => <tr key={item.userId}><td data-label="#"><strong>{index + 1}</strong></td><td data-label="Aluno">{item.user?.name}<br /><small className="muted">{item.user?.turma}</small></td><td data-label="Pontos">{item.points}</td><td data-label="Aces">{item.aces}</td><td data-label="Bloqueios">{item.blocks}</td><td data-label="Vitórias / derrotas">{item.wins}/{item.losses}</td></tr>)}</tbody></table></div> : <Empty>Nenhum jogador no ranking.</Empty>}</Card>
        <Card><h3>Ranking de equipes</h3>{teams.length ? <div className="table-wrap mobile-cards"><table><thead><tr><th>#</th><th>Equipe</th><th>V</th><th>D</th><th>PF</th><th>PS</th></tr></thead><tbody>{teams.map((team, index) => <tr key={team.id}><td data-label="#"><strong>{index + 1}</strong></td><td data-label="Equipe">{team.name}</td><td data-label="Vitórias">{team.wins}</td><td data-label="Derrotas">{team.losses}</td><td data-label="Pontos feitos">{team.pointsFor}</td><td data-label="Pontos sofridos">{team.pointsAgainst}</td></tr>)}</tbody></table></div> : <Empty>Nenhuma equipe no ranking.</Empty>}</Card>
      </div>
    </section>
    <section className="performance-history" aria-labelledby="history-games-title">
      <div className="section-title"><div><p className="eyebrow">PARTIDAS</p><h2 id="history-games-title">Histórico de partidas</h2></div></div>
      <Card><GameList games={games} /></Card>
    </section>
  </div>;
}
