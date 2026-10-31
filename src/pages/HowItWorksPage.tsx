import type { Route } from '../types/models';
import { useApp } from '../contexts/AppContext';
import { Button, Card } from '../components/ui';

type AudienceIcon = 'calendar' | 'team' | 'admin';

const iconPaths: Record<AudienceIcon, string> = {
  calendar: 'M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Zm3 8h2m3 0h2m-7 4h2m3 0h2',
  team: 'M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m6.5-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8.5 1a4 4 0 0 1 3 3.9V21m-3-18a4 4 0 0 1 0 7.8',
  admin: 'M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Zm-3-11 2 2 4-4',
};

function AudienceIconView({ icon }: { icon: AudienceIcon }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={iconPaths[icon]} /></svg>;
}

export function HowItWorksPage({ navigate, onLogin }: { navigate: (route: Route) => void; onLogin?: () => void }) {
  const { user, state } = useApp();
  const isRepresentative = Boolean(user && state.teams.some(team => team.creatorId === user.id));
  const openHistory = () => user ? navigate('history') : onLogin?.();

  return <div className="guide-page">
    <section className="guide-hero" aria-labelledby="guide-title">
      <div className="guide-hero-copy">
        <p className="eyebrow">SENAI QUADRA · GUIA DE ACESSO</p>
        <h2 id="guide-title">Acompanhe os jogos. Cada pessoa encontra o acesso certo.</h2>
        <p>Consulte a agenda pública sem criar uma conta. As ferramentas de equipe e administração ficam disponíveis após entrar com uma conta autorizada.</p>
        <div className="guide-hero-actions"><Button variant="secondary" onClick={() => navigate('calendar')}>Ver calendário</Button>{!user && onLogin && <Button onClick={onLogin}>Entrar</Button>}</div>
      </div>
      <div className="guide-hero-panel" aria-label="Recursos públicos da plataforma">
        <div className="guide-hero-panel-top"><span className="guide-dot" /><span className="guide-dot" /><span className="guide-dot" /></div>
        <div className="guide-hero-panel-title">Informações disponíveis</div>
        <div className="guide-hero-row"><span className="guide-hero-icon"><AudienceIconView icon="calendar" /></span><span><strong>Calendário e próximos jogos</strong><small>Consulta pública, sem cadastro</small></span><span className="guide-row-check" aria-hidden="true">✓</span></div>
        <div className="guide-hero-row"><span className="guide-hero-icon"><AudienceIconView icon="team" /></span><span><strong>Equipes e campeonatos</strong><small>Informações gerais abertas</small></span><span className="guide-row-check" aria-hidden="true">✓</span></div>
        <div className="guide-hero-row"><span className="guide-hero-icon"><AudienceIconView icon="admin" /></span><span><strong>Histórico detalhado</strong><small>Disponível após o login</small></span><span className="guide-lock" aria-hidden="true">•</span></div>
      </div>
    </section>

    <section className="guide-section" aria-labelledby="guide-audience-title">
      <div className="guide-section-heading"><div><p className="eyebrow">TRÊS FORMAS DE USAR</p><h2 id="guide-audience-title">Quem acessa a SENAI Quadra?</h2></div><p className="muted">Ações e informações dependem do tipo de acesso.</p></div>
      <div className="guide-audience-grid">
        <Card className="guide-audience-card">
          <span className="guide-icon"><AudienceIconView icon="calendar" /></span><p className="eyebrow">SEM CONTA</p><h3>Visitante</h3>
          <p>Abra o calendário para consultar as datas, veja os próximos jogos e confira as informações gerais das equipes e dos campeonatos. Não é necessário entrar para acompanhar a agenda.</p>
          <ul><li>Consulta pública do calendário e dos jogos futuros.</li><li>Histórico detalhado e rankings não aparecem para visitantes.</li></ul>
          <Button variant="secondary" onClick={() => navigate('calendar')}>Consultar calendário</Button>
        </Card>
        <Card className="guide-audience-card">
          <span className="guide-icon"><AudienceIconView icon="team" /></span><p className="eyebrow">CONTA AUTORIZADA</p><h3>Representante de equipe</h3>
          <p>Entre com uma conta autorizada vinculada à equipe. O representante que criou o time pode consultar e organizar o elenco próprio e acompanhar as inscrições disponíveis.</p>
          <ul><li>As ações são limitadas à equipe vinculada no aplicativo.</li><li>Inscrições dependem do campeonato e dos requisitos do elenco.</li></ul>
          {isRepresentative ? <Button onClick={() => navigate('management')}>Abrir gerenciamento</Button> : onLogin ? <Button onClick={onLogin}>Entrar</Button> : <span className="guide-access-hint">Acesso de representante não identificado nesta conta.</span>}
        </Card>
        <Card className="guide-audience-card">
          <span className="guide-icon"><AudienceIconView icon="admin" /></span><p className="eyebrow">CONTA ADMINISTRATIVA</p><h3>Administrador</h3>
          <p>O perfil administrativo pode revisar usuários, aprovar equipes e consultar os registros de atividade. Professores também têm tarefas próprias de organização de jogos e campeonatos.</p>
          <ul><li>O administrador pode gerenciar o status das contas e das equipes.</li><li>A criação de logins de representantes ainda não está conectada a um serviço de autenticação.</li></ul>
          {user?.role === 'director' ? <Button onClick={() => navigate('users')}>Gerenciar usuários</Button> : onLogin ? <Button variant="secondary" onClick={onLogin}>Acesso administrativo</Button> : <span className="guide-access-hint">Área exclusiva de administradores.</span>}
        </Card>
      </div>
    </section>

    <section className="guide-history" aria-labelledby="guide-history-title">
      <div><p className="eyebrow">RESULTADOS ANTERIORES</p><h2 id="guide-history-title">O histórico exige login</h2><p>Partidas anteriores, placares detalhados e rankings ficam disponíveis depois que uma conta autorizada entra na plataforma.</p></div>
      <Button onClick={openHistory}>{user ? 'Abrir histórico' : 'Entrar para ver o histórico'}</Button>
    </section>

    <aside className="guide-version-note"><strong>Sobre esta versão:</strong> a aplicação atual é uma demonstração local que armazena dados e sessão no navegador. O acesso ao histórico está limitado pela interface; para proteger os dados no servidor, criar representantes e armazenar senhas com segurança, ainda é necessário integrar autenticação e políticas de acesso no backend.</aside>
  </div>;
}
