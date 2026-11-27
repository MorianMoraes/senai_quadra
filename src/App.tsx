import { useEffect, useState } from 'react';
import type { Route } from './types/models';
import { useApp } from './contexts/AppContext';
import { useTheme } from './hooks/useTheme';
import { AppLayout, navItems } from './layouts/AppLayout';
import { Button, Card, Logo, Toast } from './components/ui';
import { PwaInstallButton } from './components/PwaInstallButton';
import { AuthPage } from './pages/AuthPage';
import { DashboardPage } from './pages/DashboardPage';
import { CalendarPage } from './pages/CalendarPage';
import { CreateGamePage, GameDetails, GamesPage } from './pages/GamesPage';
import { TeamsPage } from './pages/TeamsPage';
import { TournamentsPage } from './pages/TournamentsPage';
import { HistoryPage } from './pages/HistoryPage';
import { PlayersPage } from './pages/PlayersPage';
import { ProfilePage } from './pages/ProfilePage';
import { LogsPage, UsersPage } from './pages/AdminPages';
import { ManagementPage } from './pages/ManagementPage';
import { HowItWorksPage } from './pages/HowItWorksPage';
import { GameList } from './components/GameCard';
import { todayISO, startTime } from './utils/format';
import { supabaseConfigurationError } from './lib/supabaseConfig';
import { StatisticsPage } from './pages/StatisticsPage';
import { DocumentsPage } from './pages/DocumentsPage';

function SignedInApp({ toggleTheme }: { toggleTheme: () => void }) {
  const { user, logout } = useApp(), [route, setRoute] = useState<Route>(() => user?.role === 'student' ? 'games' : 'dashboard'), [selectedTournamentId,setSelectedTournamentId] = useState('');
  if (!user) return null;
  if (user.suspended) return <main className="auth-card-wrap suspended-page"><div className="auth-card"><Logo /><h2>Conta suspensa</h2><p className="muted">Olá, {user.name || 'usuário'}. Sua conta está suspensa e as funções esportivas estão bloqueadas.</p><Button variant="secondary" onClick={logout}>Sair</Button></div></main>;
  const navigate = (next: Route, tournamentId?: string) => { if(next==='createGame'&&tournamentId)setSelectedTournamentId(tournamentId); setRoute(next); };
  const allowed = navItems(user.role);
  const active = allowed.includes(route) || (route === 'createGame' && user.role === 'director') ? route : (allowed[0] ?? 'games');
  const pages = {
    dashboard: <DashboardPage navigate={setRoute} />, games: <GamesPage navigate={setRoute} />, calendar: <CalendarPage navigate={setRoute} />,
    createGame: <CreateGamePage navigate={setRoute} initialTournamentId={selectedTournamentId} />,
    management: <ManagementPage navigate={navigate} />, teams: <TeamsPage />, players: <PlayersPage />, tournaments: <TournamentsPage navigate={navigate} />, history: <HistoryPage />,
    profile: <ProfilePage />, users: <UsersPage />, logs: <LogsPage />, howItWorks: <HowItWorksPage navigate={setRoute} />, statistics: <StatisticsPage />, documents: <DocumentsPage />,
  } satisfies Record<Route, React.ReactNode>;
  return <AppLayout route={active} navigate={setRoute} toggleTheme={toggleTheme} onLogin={() => {}}>{pages[active]}</AppLayout>;
}
function PublicHome({ navigate }: { navigate: (route: Route) => void }) {
  const { state } = useApp();
  const [detailId, setDetailId] = useState<string | null>(null), [championIndex, setChampionIndex] = useState(0), [photoIndex, setPhotoIndex] = useState(0);
  const photoCount = 7;
  const photoUrl = `${import.meta.env.BASE_URL}assets/champions/galeria-${String(photoIndex + 1).padStart(2, '0')}.jpeg`;
  const champions = state.tournaments.filter(item => item.status === 'finalizado').sort((a,b) => b.date.localeCompare(a.date));
  useEffect(() => { if (champions.length < 2) return; const timer = window.setInterval(() => setChampionIndex(index => (index + 1) % champions.length), 5000); return () => window.clearInterval(timer); }, [champions.length]);
  useEffect(() => { const timer = window.setInterval(() => setPhotoIndex(index => (index + 1) % photoCount), 5000); return () => window.clearInterval(timer); }, []);
  const upcoming = [...state.games].filter(game => game.date >= todayISO() && game.status !== 'cancelado' && game.status !== 'finalizado').sort((a,b) => startTime(a.date,a.time)-startTime(b.date,b.time));
  const detailGame = state.games.find(game => game.id === detailId), champion = champions[championIndex];
  const winnerId = champion?.rounds.at(-1)?.[0]?.winner, winner = state.teams.find(team => team.id === winnerId);
  return <div className="dashboard-page">
    <section className="champion-hero" aria-label="Homenagem aos campeões"><img key={photoUrl} src={photoUrl} alt=""/><div className="champion-overlay"><span className="eyebrow">JOGOS DO SESI + SAÚDE · GALERIA DOS CAMPEÕES</span><strong>{winner?.name ?? (champion ? 'Campeões da última edição' : 'Homenagem aos campeões')}</strong><small>{champion?.name ?? 'Celebramos as equipes e pessoas que fazem parte dos Jogos.'}</small><div className="champion-hero-controls"><button type="button" aria-label="Foto anterior" onClick={() => setPhotoIndex(index => (index + photoCount - 1) % photoCount)}>‹</button><div className="champion-dots" role="group" aria-label="Escolher foto">{Array.from({length:photoCount},(_,index)=><button type="button" key={index} aria-label={`Mostrar foto ${index+1}`} aria-current={index===photoIndex?'true':undefined} onClick={() => setPhotoIndex(index)} />)}</div><button type="button" aria-label="Próxima foto" onClick={() => setPhotoIndex(index => (index + 1) % photoCount)}>›</button><button type="button" className="btn btn-secondary" onClick={() => navigate('history')}>Ver galeria</button></div></div></section>
    <div className="home-shortcuts"><Button variant="secondary" onClick={() => navigate('calendar')}>Calendário</Button><Button onClick={() => navigate('tournaments')}>Inscreva-se aqui</Button><Button variant="success" onClick={() => navigate('games')}>Modalidades</Button></div>
    <Card className="dashboard-upcoming"><div className="section-title"><div><p className="eyebrow">AGENDA</p><h2>Próximos jogos</h2></div><button className="link-btn" onClick={() => navigate('calendar')}>Ver calendário ?</button></div><GameList games={upcoming.slice(0,6)} onDetails={game => setDetailId(game.id)}/></Card>
    {detailGame && <GameDetails game={detailGame} onClose={() => setDetailId(null)}/>}
  </div>;
}function PublicApp({ toggleTheme }: { toggleTheme: () => void }) {
  const [route, setRoute] = useState<Route>('dashboard'), [login, setLogin] = useState(false);
  const navigate = (next: Route) => {
    setRoute(['dashboard', 'games', 'calendar', 'teams', 'players', 'tournaments', 'history', 'howItWorks', 'statistics', 'documents'].includes(next) ? next : 'dashboard');
  };
  if (login) return <AuthPage onBack={() => setLogin(false)} />;
  const pages: Partial<Record<Route, React.ReactNode>> = { dashboard: <PublicHome navigate={navigate} />, games: <GamesPage navigate={navigate} />, calendar: <CalendarPage navigate={navigate} />, teams: <TeamsPage />, players: <PlayersPage />, tournaments: <TournamentsPage navigate={navigate} />, history: <HistoryPage />, statistics: <StatisticsPage />, documents: <DocumentsPage />, howItWorks: <HowItWorksPage navigate={navigate} onLogin={() => setLogin(true)} /> };
  return <AppLayout route={route} navigate={navigate} toggleTheme={toggleTheme} onLogin={() => setLogin(true)}>{pages[route]}</AppLayout>;
}
export default function App() {
  const { user } = useApp(), { toggleTheme } = useTheme();
  const [emailConfirmed, setEmailConfirmed] = useState(() => new URLSearchParams(window.location.search).get('email-confirmed') === '1');
  const [confirmationLogin, setConfirmationLogin] = useState(false);
  useEffect(() => { if (user && confirmationLogin) setConfirmationLogin(false); }, [user, confirmationLogin]);
  if (emailConfirmed) return <main className="email-confirmation-page"><section className="email-confirmation-card"><Logo /><div className="confirmation-mark">✓</div><p className="eyebrow">CADASTRO JOGOS DO SESI + SAÚDE</p><h1>E-mail confirmado</h1><p>Seu endereço foi validado. A solicitação de acesso de representante seguirá para análise do diretor.</p><Button onClick={() => { const url = new URL(window.location.href); url.searchParams.delete('email-confirmed'); window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`); setEmailConfirmed(false); setConfirmationLogin(!user); }}>{user ? 'Continuar para o sistema' : 'Ir para entrar'}</Button></section></main>;
  if (confirmationLogin) return <><AuthPage onBack={() => setConfirmationLogin(false)} /><Toast /></>;
  return <>{supabaseConfigurationError && <aside className="supabase-config-alert" role="status"><strong>Supabase não configurado.</strong> A demonstração local continua disponível; autenticação e dados remotos exigem as variáveis VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY nos Secrets do GitHub Actions.</aside>}{user ? <SignedInApp key={user.id} toggleTheme={toggleTheme} /> : <PublicApp toggleTheme={toggleTheme} />}<PwaInstallButton /><Toast /></>;
}
