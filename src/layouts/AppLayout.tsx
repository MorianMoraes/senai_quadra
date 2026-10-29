import { useState, type ReactNode } from 'react';
import { useApp } from '../contexts/AppContext';
import type { Route, UserRole } from '../types/models';
import { roleLabel } from '../utils/format';
import { Avatar, Button, Logo } from '../components/ui';

export const titles: Record<Route, string> = { dashboard: 'Início', calendar: 'Calendário', createGame: 'Criar jogo', management: 'Gerenciamento', teams: 'Equipes', tournaments: 'Campeonatos', ranking: 'Ranking', history: 'Histórico', profile: 'Perfil', users: 'Usuários', logs: 'Logs' };
const icons: Record<Route, string> = { dashboard: '⌂', calendar: '◷', createGame: '+', management: '⚙', teams: '♧', tournaments: '☆', ranking: '▥', history: '↶', profile: '◉', users: '♙', logs: '▤' };
export function navItems(role: UserRole): Route[] {
  const items: Route[] = ['dashboard', 'calendar', 'management', 'ranking', 'history'];
  if (role === 'teacher') items.splice(2, 0, 'createGame');
  if (role === 'director') items.push('users', 'logs');
  return items;
}
export function AppLayout({ route, navigate, toggleTheme, children }: { route: Route; navigate: (route: Route) => void; toggleTheme: () => void; children: ReactNode }) {
  const { user, logout } = useApp(), [open, setOpen] = useState(false);
  if (!user) return null;
  return <div className="app-shell">
    {open && <button className="sidebar-overlay" aria-label="Fechar menu" onClick={() => setOpen(false)} />}
    <aside className={`sidebar ${open ? 'open' : ''}`} id="sidebar"><Logo /><nav className="nav" aria-label="Menu principal">{navItems(user.role).map(item => <button key={item} data-route={item} aria-current={route === item ? 'page' : undefined} className={route === item ? 'active' : ''} onClick={() => { navigate(item); setOpen(false); }}><span aria-hidden="true">{icons[item]}</span>{titles[item]}</button>)}</nav><div className="sidebar-bottom"><Button variant="secondary" onClick={toggleTheme}>Alternar tema</Button><div className="user-mini"><Avatar user={user} /><div><strong>{user.name}</strong><small>{roleLabel(user.role)}</small></div></div><Button variant="danger" onClick={logout}>Sair</Button></div></aside>
    <main className="main"><header className="topbar"><div className="topbar-title"><button className="icon-btn mobile-menu" aria-label="Abrir menu" aria-expanded={open} aria-controls="sidebar" onClick={() => setOpen(!open)}>â˜°</button><h1>{titles[route]}</h1></div></header><div className="content">{children}</div></main>
  </div>;
}
