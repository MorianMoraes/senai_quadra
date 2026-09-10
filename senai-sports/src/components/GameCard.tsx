import type { Game } from '../types/models';
import { useApp } from '../contexts/AppContext';
import { fmtDate, teamName } from '../utils/format';
import { Empty, Status } from './ui';

export function GameList({ games, onDetails }: { games: Game[]; onDetails?: (game: Game) => void }) {
  const { state } = useApp();
  if (!games.length) return <Empty>Nenhum jogo encontrado.</Empty>;
  return <div className="list">{games.map(game => <div className="list-item" key={game.id}><div><strong>{teamName(state, game.team1)} × {teamName(state, game.team2)}</strong><small>{fmtDate(game.date)} • {game.time} • {game.court}</small>{onDetails && <><br /><button className="link-btn" onClick={() => onDetails(game)}>Detalhes</button></>}</div><Status color={game.status === 'finalizado' ? 'green' : game.status === 'cancelado' ? 'red' : 'blue'}>{game.status}</Status></div>)}</div>;
}
