import { useState } from 'react';
import { Card, Status } from '../components/ui';
import { ProfilePage } from './ProfilePage';
import { TeamsPage } from './TeamsPage';
import { TournamentsPage } from './TournamentsPage';
import { GamesPage } from './GamesPage';
import { PlayersPage } from './PlayersPage';
import type { Route } from '../types/models';

type Section = 'profile' | 'teams' | 'players' | 'tournaments' | 'scores';
const sections: { id: Section; label: string; hint: string }[] = [
  { id: 'profile', label: 'Perfil', hint: 'Seus dados e preferências' },
  { id: 'teams', label: 'Equipes', hint: 'Elencos e integrantes' },
  { id: 'players', label: 'Jogadores', hint: 'Cadastro e dados da equipe' },
  { id: 'tournaments', label: 'Campeonatos', hint: 'Inscrições e torneios' },
  { id: 'scores', label: 'Placar e pontuação', hint: 'Resultados e classificação' },
];

export function ManagementPage({ navigate }: { navigate: (route: Route, tournamentId?: string) => void }) {
  const [section, setSection] = useState<Section>('profile');
  return <div className="management-layout"><Card className="management-nav"><p className="eyebrow">Organização</p><h2>Gerenciamento</h2><nav aria-label="Seções de gerenciamento">{sections.map(item => <button key={item.id} className={section === item.id ? 'selected' : ''} aria-current={section === item.id ? 'page' : undefined} onClick={() => setSection(item.id)}><strong>{item.label}</strong><small>{item.hint}</small></button>)}</nav></Card><div className="management-content" key={section}>{section === 'profile' ? <ProfilePage /> : section === 'teams' ? <TeamsPage /> : section === 'players' ? <PlayersPage /> : section === 'tournaments' ? <TournamentsPage navigate={navigate} /> : <><Card><div className="section-title"><div><p className="eyebrow">RESULTADOS OFICIAIS</p><h2>Placar e pontuação</h2></div><Status>Equipe autorizada</Status></div><p className="muted">Registre ou corrija os resultados. A classificação das equipes é atualizada ao salvar.</p></Card><GamesPage navigate={navigate} /></>}</div></div>;
}
