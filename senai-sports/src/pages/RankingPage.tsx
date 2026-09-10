import { useApp } from '../contexts/AppContext';
import { Card } from '../components/ui';

export function RankingPage() {
  const { state } = useApp();
  const players = state.stats.map(stats => ({ ...stats, user: state.users.find(user => user.id === stats.userId) })).filter(item => item.user?.role === 'student').sort((a, b) => b.points - a.points);
  const teams = [...state.teams].sort((a, b) => b.wins - a.wins || b.pointsFor - a.pointsFor);
  return <div className="grid-equal"><Card><h3>Ranking de alunos</h3><div className="table-wrap"><table><thead><tr><th>#</th><th>Aluno</th><th>Pontos</th><th>Aces</th><th>Bloqueios</th><th>V/D</th></tr></thead><tbody>{players.map((item, index) => <tr key={item.userId}><td><strong>{index + 1}</strong></td><td>{item.user?.name}<br /><small className="muted">{item.user?.turma}</small></td><td>{item.points}</td><td>{item.aces}</td><td>{item.blocks}</td><td>{item.wins}/{item.losses}</td></tr>)}</tbody></table></div></Card><Card><h3>Ranking de equipes</h3><div className="table-wrap"><table><thead><tr><th>#</th><th>Equipe</th><th>V</th><th>D</th><th>PF</th><th>PS</th></tr></thead><tbody>{teams.map((team, index) => <tr key={team.id}><td><strong>{index + 1}</strong></td><td>{team.name}</td><td>{team.wins}</td><td>{team.losses}</td><td>{team.pointsFor}</td><td>{team.pointsAgainst}</td></tr>)}</tbody></table></div></Card></div>;
}
