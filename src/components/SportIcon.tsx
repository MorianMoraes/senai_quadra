import type { ReactNode } from 'react';
import type { Sport } from '../types/models';

export const sports: { id: Sport; name: string; category: 'quadra' | 'mesa'; icon: ReactNode }[] = [
  { id: 'futebol', name: 'Futebol', category: 'quadra', icon: <><circle cx="12" cy="12" r="9" /><path d="m12 7 3 2v4l-3 2-3-2V9l3-2ZM9 9 5 7m10 2 4-2m-10 8-2 4m8-4 2 4M12 7V3" /></> },
  { id: 'volei', name: 'Vôlei', category: 'quadra', icon: <><path d="M4 19h16M6 19V8m12 11V8M6 11h12M6 15h12" /><path d="M12 3c2 2 3 4 2 6-1 2-3 2-5 1-2-1-2-3-1-5 1-1 2-2 4-2Z" /></> },
  { id: 'futsal', name: 'Futsal', category: 'quadra', icon: <><circle cx="12" cy="12" r="9" /><path d="m12 7 3 2v4l-3 2-3-2V9l3-2ZM9 9 5 7m10 2 4-2m-10 8-2 4m8-4 2 4M12 7V3" /><path d="M3 12h2m14 0h2" /></> },
  { id: 'handebol', name: 'Handebol', category: 'quadra', icon: <><path d="M4 20V9h16v11M2 20h20M8 9V5h8v4" /><path d="m12 2 1.5 1 .2 1.8-1.7 1-1.7-1 .2-1.8L12 2Zm0 2.5v3m-1.5-2h3" /></> },
  { id: 'queimada', name: 'Queimada', category: 'quadra', icon: <><circle cx="12" cy="12" r="8.5" /><path d="M6 6c4 1 7 5 8 12M17 5c-1 4-4 7-9 8m13-2c-4 0-7 2-9 7" /></> },
  { id: 'basquete', name: 'Basquete', category: 'quadra', icon: <><circle cx="12" cy="12" r="9" /><path d="M3.5 9h17M3.5 15h17M12 3c-4 4-4 14 0 18m0-18c4 4 4 14 0 18" /></> },
  { id: 'xadrez', name: 'Xadrez', category: 'mesa', icon: <><path d="M8 20h8M9 17h6l-1-4 2-3-2-2V5l-2-2-2 2v3L8 10l2 3-1 4Z" /><path d="M5 21h14" /></> },
  { id: 'dama', name: 'Dama', category: 'mesa', icon: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M4 9h16M4 15h16M9 4v16m6-16v16" /><circle cx="6.5" cy="6.5" r="1.3" /><circle cx="17.5" cy="17.5" r="1.3" /></> },
  { id: 'ludo', name: 'Ludo', category: 'mesa', icon: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M12 4v6m0 4v6M4 12h6m4 0h6" /><circle cx="8" cy="8" r="1" /><circle cx="16" cy="8" r="1" /><circle cx="8" cy="16" r="1" /><circle cx="16" cy="16" r="1" /></> },
  { id: 'pingue-pongue', name: 'Pingue-pongue', category: 'mesa', icon: <><path d="M4 4v16m16-16v16M4 12h16" /><circle cx="9" cy="8" r="3" /><path d="m11 10 3 3" /><circle cx="17" cy="6" r="1" /></> },
  { id: 'outra-quadra', name: 'Outra modalidade', category: 'quadra', icon: <><circle cx="12" cy="12" r="9" /><path d="M7 7l10 10m0-10L7 17M3 12h4m10 0h4" /></> },
  { id: 'outro-tabuleiro', name: 'Outro jogo de mesa', category: 'mesa', icon: <><rect x="4" y="4" width="16" height="16" rx="2" /><path d="M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01M8 16h.01M12 16h.01M16 16h.01" /></> },
];

export function SportIcon({ sport, className = '' }: { sport: Sport; className?: string }) {
  const selected = sports.find(item => item.id === sport) ?? sports.find(item => item.id === 'outra-quadra')!;
  return <svg className={`sport-icon ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" role="img" aria-label={selected.name}>{selected.icon}</svg>;
}

export function SportLabel({ sport, className = '' }: { sport: Sport; className?: string }) {
  const selected = sports.find(item => item.id === sport) ?? sports.find(item => item.id === 'outra-quadra')!;
  return <span className={`sport-label ${className}`}><SportIcon sport={selected.id} /><span>{selected.name}</span></span>;
}

export function SportChoiceGroup({ name, category }: { name: string; category?: 'quadra' | 'mesa' }) {
  const choices = category ? sports.filter(item => item.category === category) : sports;
  return <fieldset className="sport-choices"><legend>Modalidade</legend><div className="sport-choice-grid">{choices.map((sport, index) => <label className="sport-choice" key={sport.id}><input type="radio" name={name} value={sport.id} defaultChecked={index === 0} required /><span className="sport-choice-copy"><SportIcon sport={sport.id} /><span>{sport.name}</span></span></label>)}</div></fieldset>;
}
