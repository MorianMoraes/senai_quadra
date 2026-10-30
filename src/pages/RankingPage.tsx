import { useApp } from '../contexts/AppContext';
import { Card, Empty } from '../components/ui';
import { GameList } from '../components/GameCard';
import { startTime } from '../utils/format';

export function RankingPage() {
  const { state } = useApp();
  const players = state.stats.map(stats => ({ ...stats, user: state.users.find(user => user.id === stats.userId) })).filter(item => item.user?.role === 'student').sort((a, b) => b.points - a.points);
  const teams = [...state.teams].sort((a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor);
  const history = state.games.filter(game => ['finalizado', 'cancelado'].includes(game.status)).sort((a, b) => startTime(b.date, b.time) - startTime(a.date, a.time));

  return <div className="performance-page">
    <section aria-labelledby="performance-ranking-title">
      <div className="section-title"><div><p className="eyebrow">DESEMPENHO</p><h2 id="performance-ranking-title">Classificação</h2></div></div>
      <div className="grid-equal">
        <Card><h3>Ranking de alunos</h3>{players.length ? <div className="table-wrap"><table><thead><tr><th>#</th><th>Aluno</th><th>Pontos</th><th>Aces</th><th>Bloqueios</th><th>V/D</th></tr></thead><tbody>{players.map((item, index) => <tr key={item.userId}><td><strong>{index + 1}</strong></td><td>{item.user?.name}<br /><small className="muted">{item.user?.turma}</small></td><td>{item.points}</td><td>{item.aces}</td><td>{item.blocks}</td><td>{item.wins}/{item.losses}</td></tr>)}</tbody></table></div> : <Empty>Nenhum jogador no ranking.</Empty>}</Card>
        <Card><h3>Ranking de equipes</h3>{teams.length ? <div className="table-wrap"><table><thead><tr><th>#</th><th>Equipe</th><th>V</th><th>D</th><th>PF</th><th>PS</th></tr></thead><tbody>{teams.map((team, index) => <tr key={team.id}><td><strong>{index + 1}</strong></td><td>{team.name}</td><td>{team.wins}</td><td>{team.losses}</td><td>{team.pointsFor}</td><td>{team.pointsAgainst}</td></tr>)}</tbody></table></div> : <Empty>Nenhuma equipe no ranking.</Empty>}</Card>
      </div>
    </section>
    <section className="performance-history" aria-labelledby="performance-history-title">
      <div className="section-title"><div><p className="eyebrow">PARTIDAS</p><h2 id="performance-history-title">Histórico de partidas</h2></div></div>
      <Card><GameList games={history} /></Card>
    </section>
  </div>;
}
