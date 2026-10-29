import { useApp } from '../contexts/AppContext';
import { Card } from '../components/ui';
import { GameList } from '../components/GameCard';

export function HistoryPage() {
  const { state } = useApp();
  return <Card><h2>Histórico de partidas</h2><GameList games={state.games.filter(game => ['finalizado', 'cancelado'].includes(game.status))} /></Card>;
}
