import { useState, type ReactNode } from 'react';
import { useApp } from '../contexts/AppContext';
import type { Route, UserRole } from '../types/models';
import { roleLabel } from '../utils/format';
import { Avatar, Button, Logo } from '../components/ui';

export const titles: Record<Route, string> = { dashboard: 'Início', calendar: 'Calendário', createGame: 'Criar jogo', management: 'Gerenciamento', teams: 'Equipes', tournaments: 'Campeonatos', history: 'Histórico', howItWorks: 'Como funciona?', profile: 'Perfil', users: 'Usuários', logs: 'Logs' };
const icons: Record<Route, string> = { dashboard: 'M3 10.8 12 3l9 7.8M5.5 9.2V21h13V9.2', calendar: 'M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Zm3 8h2m3 0h2', createGame: 'M12 5v14m-7-7h14', management: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Zm0-5v2m0 14v2m9-9h-2M5 12H3', teams: 'M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m6.5-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', tournaments: 'm12 3 2.8 5.7 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.6l6.2-.9L12 3Z', history: 'M3 12a9 9 0 1 0 2.6-6.4L3 8m0-5v5h5m4-1v5l3 2', howItWorks: 'M12 16v-4m0-4h.01M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z', users: 'M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m6.5-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', logs: 'M8 6h13M8 12h13M8 18h13', profile: 'M20 21a8 8 0 0 0-16 0m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z' };
export function navItems(role: UserRole | null): Route[] {
  if (!role) return ['dashboard', 'calendar', 'teams', 'tournaments', 'howItWorks'];
  const items: Route[] = ['dashboard', 'calendar'];
  if (role === 'teacher' || role === 'director') items.push('createGame');
  items.push('management', 'history', 'howItWorks');
  if (role === 'director') items.push('users', 'logs');
  return items;
}
function NavIcon({ route }: { route: Route }) { return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={icons[route]} /></svg>; }
export function AppLayout({ route, navigate, toggleTheme, onLogin, children }: { route: Route; navigate: (route: Route) => void; toggleTheme: () => void; onLogin: () => void; children: ReactNode }) {
  const { user, logout } = useApp();
  const [open, setOpen] = useState(false), [collapsed, setCollapsed] = useState(false);
  const items = navItems(user?.role ?? null);
  return <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
    {open && <button className="sidebar-overlay" aria-label="Fechar menu" onClick={() => setOpen(false)} />}
    <aside className={`sidebar ${open ? 'open' : ''}`} id="sidebar">
      <div className="sidebar-brand"><Logo /><button className="collapse-btn" aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'} aria-pressed={collapsed} onClick={() => setCollapsed(value => !value)}><svg aria-hidden="true" viewBox="0 0 24 24"><path d={collapsed ? 'm9 18 6-6-6-6' : 'm15 18-6-6 6-6'} /></svg></button></div>
      <div className="nav-caption">{user ? 'ESPAÇO DE TRABALHO' : 'ACOMPANHE LIVREMENTE'}</div>
      <nav className="nav" aria-label="Menu principal">{items.map(item => <button key={item} data-route={item} title={collapsed ? titles[item] : undefined} aria-current={route === item ? 'page' : undefined} className={route === item ? 'active' : ''} onClick={() => { navigate(item); setOpen(false); }}><span className="nav-icon"><NavIcon route={item} /></span><span className="nav-label">{titles[item]}</span></button>)}</nav>
      <div className="sidebar-bottom"><div className="sidebar-utility"><span className="nav-label">Aparência</span><Button variant="secondary" aria-label="Alternar tema" onClick={toggleTheme}>Alternar tema</Button></div>
        {user ? <div className="user-mini"><Avatar user={user} /><div className="user-copy"><strong>{user.name}</strong><small>{roleLabel(user.role)}</small></div><button className="logout-icon" aria-label="Sair" title="Sair" onClick={logout}>Sair</button></div> : <div className="public-access"><span>Visitante · somente consulta</span><Button onClick={onLogin}>Entrar</Button></div>}
      </div>
    </aside>
    <main className="main"><header className="topbar"><div className="topbar-title"><button className="icon-btn mobile-menu" aria-label="Abrir menu" aria-expanded={open} aria-controls="sidebar" onClick={() => setOpen(!open)}>☰</button><div><span className="topbar-kicker">SENAI QUADRA</span><h1>{titles[route]}</h1></div></div><div className="topbar-status">{user ? <><span className="live-dot" /> Ambiente esportivo</> : <><span>Consulta pública</span><Button onClick={onLogin}>Entrar</Button></>}</div></header><div className="content">{children}</div></main>
  </div>;
}
