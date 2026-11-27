import type { Sport } from '../types/models';

const tableSports = new Set<Sport>(['xadrez', 'dama', 'ludo', 'pingue-pongue', 'tenis-de-mesa', 'domino', 'general', 'truco', 'canastra', 'outro-tabuleiro']);
export function sportCategory(sport: Sport): 'quadra' | 'mesa' | 'verao' {
  if (['volei-de-praia', 'beach-tennis', 'futevolei', 'futebol-de-areia'].includes(sport)) return 'verao';
  return tableSports.has(sport) ? 'mesa' : 'quadra';
}
