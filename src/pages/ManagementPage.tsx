import { useState } from 'react';
import { Card } from '../components/ui';
import { ProfilePage } from './ProfilePage';
import { TeamsPage } from './TeamsPage';
import { TournamentsPage } from './TournamentsPage';

type Section = 'profile' | 'teams' | 'tournaments';
const sections: { id: Section; label: string; hint: string }[] = [
  { id: 'profile', label: 'Perfil', hint: 'Seus dados e preferências' },
  { id: 'teams', label: 'Equipes', hint: 'Elencos e integrantes' },
  { id: 'tournaments', label: 'Campeonatos', hint: 'Inscrições e torneios' },
];

export function ManagementPage() {
  const [section, setSection] = useState<Section>('profile');
  return <div className="management-layout"><Card className="management-nav"><p className="eyebrow">Organização</p><h2>Gerenciamento</h2><nav aria-label="Seções de gerenciamento">{sections.map(item => <button key={item.id} className={section === item.id ? 'selected' : ''} aria-current={section === item.id ? 'page' : undefined} onClick={() => setSection(item.id)}><strong>{item.label}</strong><small>{item.hint}</small></button>)}</nav></Card><div className="management-content" key={section}>{section === 'profile' ? <ProfilePage /> : section === 'teams' ? <TeamsPage /> : <TournamentsPage />}</div></div>;
}
