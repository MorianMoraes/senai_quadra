import type { Sport } from '../types/models';

const tableSports = new Set<Sport>(['xadrez', 'dama', 'ludo', 'pingue-pongue', 'outro-tabuleiro']);
export function sportCategory(sport: Sport): 'quadra' | 'mesa' {
  return tableSports.has(sport) ? 'mesa' : 'quadra';
}
