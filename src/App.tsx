import { useState } from 'react';
import type { Route } from './types/models';
import { useApp } from './contexts/AppContext';
import { useTheme } from './hooks/useTheme';
import { AppLayout, navItems } from './layouts/AppLayout';
import { Button, Card, Logo, Toast } from './components/ui';
import { PwaInstallButton } from './components/PwaInstallButton';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { CalendarPage } from './pages/CalendarPage';
import { CreateGamePage } from './pages/GamesPage';
import { TeamsPage } from './pages/TeamsPage';
import { TournamentsPage } from './pages/TournamentsPage';
import { HistoryPage } from './pages/HistoryPage';
import { ProfilePage } from './pages/ProfilePage';
import { LogsPage, UsersPage } from './pages/AdminPages';
import { ManagementPage } from './pages/ManagementPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { GameList } from './components/GameCard';
import { todayISO, startTime } from './utils/format';
import { supabaseConfigurationError } from './lib/supabaseConfig';

function SignedInApp({ toggleTheme }: { toggleTheme: () => void }) {
  const { user, logout } = useApp(), [route, setRoute] = useState<Route>('dashboard');
  if (!user) return null;
  if (user.suspended) return <main className="auth-card-wrap suspended-page"><div className="auth-card"><Logo /><h2>Conta suspensa</h2><p className="muted">Olá, {user.name}. Sua conta está suspensa e as funções esportivas estão bloqueadas.</p><Button variant="secondary" onClick={logout}>Sair</Button></div></main>;
  const active = navItems(user.role).includes(route) ? route : 'dashboard';
  const pages = {
    dashboard: <DashboardPage navigate={setRoute} />, calendar: <CalendarPage navigate={setRoute} />,
    createGame: <CreateGamePage navigate={setRoute} />,
    management: <ManagementPage />, teams: <TeamsPage />, tournaments: <TournamentsPage />, history: <HistoryPage />,
    profile: <ProfilePage />, users: <UsersPage />, logs: <LogsPage />, howItWorks: <HowItWorksPage navigate={setRoute} />,
  } satisfies Record<Route, React.ReactNode>;
  return <AppLayout route={active} navigate={setRoute} toggleTheme={toggleTheme} onLogin={() => {}}>{pages[active]}</AppLayout>;
}
function PublicHome({ navigate, onLogin }: { navigate: (route: Route) => void; onLogin: () => void }) {
  const { state } = useApp();
  const upcoming = [...state.games].filter(game => game.date >= todayISO() && game.status !== 'cancelado').sort((a, b) => startTime(a.date, a.time) - startTime(b.date, b.time));
  return <div className="dashboard-page"><section className="hero dashboard-hero"><div><p className="eyebrow">ACESSO PÚBLICO</p><h2>Acompanhe os campeonatos sem criar uma conta.</h2><p>Consulte próximos jogos, horários, equipes e informações gerais dos campeonatos.</p></div><div className="dashboard-hero-actions"><Button variant="secondary" onClick={() => navigate('calendar')}>Abrir calendário</Button><Button onClick={onLogin}>Entrar como autorizado</Button></div></section><div className="cards dashboard-metrics"><Card><strong>{state.games.length}</strong><p>Partidas na agenda</p></Card><Card><strong>{state.teams.length}</strong><p>Equipes participantes</p></Card><Card><strong>{state.tournaments.length}</strong><p>Campeonatos</p></Card><Card><strong>Aberto</strong><p>Consulta sem login</p></Card></div><Card className="dashboard-upcoming"><div className="section-title"><div><p className="eyebrow">AGENDA</p><h2>Próximos jogos</h2></div><button className="link-btn" onClick={() => navigate('calendar')}>Ver calendário →</button></div><GameList games={upcoming.slice(0, 6)} /></Card></div>;
}
function PublicApp({ toggleTheme }: { toggleTheme: () => void }) {
  const [route, setRoute] = useState<Route>('dashboard'), [login, setLogin] = useState(false);
  const navigate = (next: Route) => {
    if (next === 'history') { setRoute('dashboard'); setLogin(true); return; }
    setRoute(['dashboard', 'calendar', 'teams', 'tournaments', 'howItWorks'].includes(next) ? next : 'dashboard');
  };
  if (login) return <AuthPage onBack={() => setLogin(false)} />;
  const pages: Partial<Record<Route, React.ReactNode>> = { dashboard: <PublicHome navigate={navigate} onLogin={() => setLogin(true)} />, calendar: <CalendarPage navigate={navigate} />, teams: <TeamsPage />, tournaments: <TournamentsPage />, history: <HistoryPage onLogin={() => setLogin(true)} />, howItWorks: <HowItWorksPage navigate={navigate} onLogin={() => setLogin(true)} /> };
  return <AppLayout route={route} navigate={navigate} toggleTheme={toggleTheme} onLogin={() => setLogin(true)}>{pages[route]}</AppLayout>;
}
export default function App() {
  const { user } = useApp(), { toggleTheme } = useTheme();
  return <>{supabaseConfigurationError && <aside className="supabase-config-alert" role="status"><strong>Supabase não configurado.</strong> A demonstração local continua disponível; autenticação e dados remotos exigem as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY nos Secrets do GitHub Actions.</aside>}{user ? <SignedInApp key={user.id} toggleTheme={toggleTheme} /> : <PublicApp toggleTheme={toggleTheme} />}<PwaInstallButton /><Toast /></>;
}
