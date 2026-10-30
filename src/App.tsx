import { useState } from 'react';
import type { Route } from './types/models';
import { useApp } from './contexts/AppContext';
import { useTheme } from './hooks/useTheme';
import { AppLayout, navItems } from './layouts/AppLayout';
import { Button, Logo, Toast } from './components/ui';
import { PwaInstallButton } from './components/PwaInstallButton';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { CalendarPage } from './pages/CalendarPage';
import { CreateGamePage } from './pages/GamesPage';
import { TeamsPage } from './pages/TeamsPage';
import { TournamentsPage } from './pages/TournamentsPage';
import { RankingPage } from './pages/RankingPage';
import { ProfilePage } from './pages/ProfilePage';
import { HistoryPage } from './pages/HistoryPage';
import { LogsPage, UsersPage } from './pages/AdminPages';
import { ManagementPage } from './pages/ManagementPage';

function SignedInApp({ toggleTheme }: { toggleTheme: () => void }) {
  const { user, logout } = useApp(), [route, setRoute] = useState<Route>('dashboard');
  if (!user) return null;
  if (user.suspended) return <main className="auth-card-wrap suspended-page"><div className="auth-card"><Logo /><h2>Conta suspensa</h2><p className="muted">Olá, {user.name}. Sua conta está suspensa e as funções esportivas estão bloqueadas.</p><Button variant="secondary" onClick={logout}>Sair</Button></div></main>;
  const active = navItems(user.role).includes(route) ? route : 'dashboard';
  const pages = {
    dashboard: <DashboardPage navigate={setRoute} />, calendar: <CalendarPage navigate={setRoute} />,
    createGame: <CreateGamePage navigate={setRoute} />,
    management: <ManagementPage />, teams: <TeamsPage />, tournaments: <TournamentsPage />, ranking: <RankingPage />,
    history: <HistoryPage />, profile: <ProfilePage />, users: <UsersPage />, logs: <LogsPage />,
  } satisfies Record<Route, React.ReactNode>;
  return <AppLayout route={active} navigate={setRoute} toggleTheme={toggleTheme}>{pages[active]}</AppLayout>;
}
export default function App() {
  const { user } = useApp(), { toggleTheme } = useTheme();
  return <>{user ? <SignedInApp key={user.id} toggleTheme={toggleTheme} /> : <AuthPage />}<PwaInstallButton /><Toast /></>;
}
