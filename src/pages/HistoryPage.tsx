import { useApp } from '../contexts/AppContext';
import { Card, Empty } from '../components/ui';
import { fmtDate, startTime, teamName, userName } from '../utils/format';
import { SportLabel } from '../components/SportIcon';
import { sports } from '../components/SportIcon';

export function HistoryPage() {
  const { state } = useApp();
  const teams = [...state.teams].sort((a, b) => b.wins - a.wins || (b.draws ?? 0) - (a.draws ?? 0) || b.pointsFor - a.pointsFor);
  const games = state.games.filter(game => game.status === 'finalizado').sort((a, b) => startTime(b.date, b.time) - startTime(a.date, a.time));
  return <div className="performance-page">
    <section aria-labelledby="history-ranking-title">
      <div className="section-title"><div><p className="eyebrow">CLASSIFICAÇÃO</p><h2 id="history-ranking-title">Ranking de equipes</h2></div></div>
      <Card>{teams.length ? <div className="table-wrap mobile-cards"><table><thead><tr><th>Posição</th><th>Equipe</th><th>Vitórias</th><th>Derrotas</th><th>Empates</th><th>Pontuação</th></tr></thead><tbody>{teams.map((team, index) => <tr key={team.id}><td data-label="Posição"><strong>{index + 1}</strong></td><td data-label="Equipe">{team.name}</td><td data-label="Vitórias">{team.wins}</td><td data-label="Derrotas">{team.losses}</td><td data-label="Empates">{team.draws ?? 0}</td><td data-label="Pontuação">{team.pointsFor}</td></tr>)}</tbody></table></div> : <Empty>Nenhuma equipe no ranking.</Empty>}</Card>
    </section>
    <section className="performance-history" aria-labelledby="history-games-title">
      <div className="section-title"><div><p className="eyebrow">RESULTADOS PÚBLICOS</p><h2 id="history-games-title">Histórico de partidas</h2></div></div>
      {games.length ? <div className="history-results">{games.map(game => {
        const teamA = state.teams.find(team => team.id === game.team1), teamB = state.teams.find(team => team.id === game.team2);
        const teamGame = Boolean(game.team1 || game.team2);
        const winsA = game.sets.filter(set => set.a > set.b).length, winsB = game.sets.filter(set => set.b > set.a).length;
        const scoreA = game.sets.reduce((sum, set) => sum + set.a, 0), scoreB = game.sets.reduce((sum, set) => sum + set.b, 0);
        const resultA = teamGame ? winsA : scoreA, resultB = teamGame ? winsB : scoreB;
        const winner = resultA === resultB ? 'Empate' : teamGame ? teamName(state, resultA > resultB ? game.team1 : game.team2) : resultA > resultB ? 'Participante 1' : 'Participante 2';
        const assigned = new Set([...(teamA?.memberIds ?? []), ...(teamB?.memberIds ?? [])]);
        const playersA = game.participantIds.filter(id => teamA?.memberIds.includes(id));
        const playersB = game.participantIds.filter(id => teamB?.memberIds.includes(id));
        const unassigned = game.participantIds.filter(id => !assigned.has(id));
        return <Card className="history-result" key={game.id}><div className="section-title"><div><SportLabel sport={game.sport} /><h3>{teamGame ? `${teamName(state, game.team1)} × ${teamName(state, game.team2)}` : sports.find(item => item.id === game.sport)?.name ?? 'Atividade'}</h3></div><strong className="history-winner">{winner === 'Empate' ? winner : `Vencedor: ${winner}`}</strong></div><p className="muted">{fmtDate(game.date)} · {game.time} · {game.unit ? `${game.unit} · ` : ''}{game.court}</p><p><strong>Resultado:</strong> {game.sets.map(set => `${set.a} × ${set.b}`).join(' · ') || 'Resultado registrado'}</p>{teamGame ? <div className="grid-equal"><p><strong>{teamName(state, game.team1)} — participantes:</strong><br />{playersA.length ? playersA.map(id => userName(state, id)).join(', ') : 'Não informados'}</p><p><strong>{teamName(state, game.team2)} — participantes:</strong><br />{playersB.length ? playersB.map(id => userName(state, id)).join(', ') : 'Não informados'}</p>{unassigned.length > 0 && <p><strong>Outros participantes:</strong> {unassigned.map(id => userName(state, id)).join(', ')}</p>}</div> : <p><strong>Participantes:</strong> {game.participantIds.map(id => userName(state, id)).join(', ') || 'Não informados'}</p>}</Card>;
      })}</div> : <Card><Empty>Nenhuma partida finalizada.</Empty></Card>}
    </section>
  </div>;
}
