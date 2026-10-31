import type { Route } from '../types/models';
import { Button, Card } from '../components/ui';

type GuideIcon = 'calendar' | 'team' | 'trophy' | 'ranking' | 'profile' | 'shield';

const iconPaths: Record<GuideIcon, string> = {
  calendar: 'M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v14H4V6a1 1 0 0 1 1-1Zm3 8h2m3 0h2m-7 4h2m3 0h2',
  team: 'M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2m6.5-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm8.5 1a4 4 0 0 1 3 3.9V21m-3-18a4 4 0 0 1 0 7.8',
  trophy: 'M8 21h8m-4-4v4m-5-17h10v5a5 5 0 0 1-10 0V4Zm0 2H4v2a4 4 0 0 0 4 4m8-6h4v2a4 4 0 0 1-4 4',
  ranking: 'M4 19V9m8 10V5m8 14v-7M2 19h20M2 5l5 4 5-5 4 3 6-5',
  profile: 'M20 21a8 8 0 0 0-16 0m8-10a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
  shield: 'M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Zm-3-11 2 2 4-4',
};

const features: { icon: GuideIcon; title: string; description: string; route: Route; action: string }[] = [
  { icon: 'calendar', title: 'Agenda e jogos', description: 'Consulte partidas e campeonatos no calendÃ¡rio mensal ou em lista. Veja detalhes e, como aluno, entre em jogos futuros com inscriÃ§Ãµes abertas.', route: 'calendar', action: 'Abrir calendÃ¡rio' },
  { icon: 'team', title: 'Equipes e elencos', description: 'Crie uma equipe, indique o professor responsÃ¡vel e organize seis titulares e atÃ© quatro reservas. Equipes criadas por alunos aguardam aprovaÃ§Ã£o do professor.', route: 'teams', action: 'Ver equipes' },
  { icon: 'trophy', title: 'Campeonatos', description: 'Professores cadastram campeonatos. O lÃ­der inscreve a equipe com seis jogadores ativos; depois da inscriÃ§Ã£o, o elenco fica fechado.', route: 'tournaments', action: 'Ver campeonatos' },
  { icon: 'ranking', title: 'Resultados e histÃ³rico', description: 'Professores registram os placares por set. O histÃ³rico reÃºne partidas finalizadas ou canceladas, e os rankings mostram os nÃºmeros de alunos e equipes.', route: 'history', action: 'Ver histÃ³rico e ranking' },
  { icon: 'profile', title: 'Perfil e estatÃ­sticas', description: 'Atualize seu nome, turma e foto. Consulte seus pontos, aces e bloqueios na Ã¡rea de perfil dentro de Gerenciamento.', route: 'teams', action: 'Ver equipes' },
  { icon: 'shield', title: 'Acessos por perfil', description: 'Alunos participam de jogos e equipes; professores organizam jogos e campeonatos; diretores administram contas e consultam os registros de atividade.', route: 'dashboard', action: 'Ir para o inÃ­cio' },
];

const steps = [
  { number: '01', title: 'Acesse sua conta', description: 'Qualquer pessoa pode consultar jogos e campeonatos sem entrar. Líderes de equipe e administradores usam contas autorizadas, sem cadastro público.' },
  { number: '02', title: 'Confira o painel', description: 'No InÃ­cio, veja os prÃ³ximos jogos, indicadores e atalhos. As informaÃ§Ãµes variam conforme seu perfil e as atividades cadastradas.' },
  { number: '03', title: 'Use a agenda e o gerenciamento', description: 'Abra o CalendÃ¡rio para consultar datas e partidas. Em Gerenciamento, cuide do perfil, monte equipes ou acompanhe as inscriÃ§Ãµes em campeonatos.' },
  { number: '04', title: 'Acompanhe os resultados', description: 'Consulte o HistÃ³rico para ver placares registrados, partidas anteriores e os rankings individuais e de equipes.' },
];

function GuideIconView({ icon }: { icon: GuideIcon }) {
  return <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={iconPaths[icon]} /></svg>;
}

export function HowItWorksPage({ navigate }: { navigate: (route: Route) => void }) {
  return <div className="guide-page">
    <section className="guide-hero" aria-labelledby="guide-title">
      <div className="guide-hero-copy">
        <p className="eyebrow">GUIA DA PLATAFORMA</p>
        <h2 id="guide-title">O esporte da escola, organizado em um sÃ³ lugar.</h2>
        <p>O SENAI Sports reÃºne a agenda esportiva, as equipes, os campeonatos e o acompanhamento de resultados da comunidade escolar.</p>
        <a className="guide-jump" href="#guide-start">Ver como comeÃ§ar <span aria-hidden="true">â†“</span></a>
      </div>
      <div className="guide-hero-panel" aria-hidden="true">
        <div className="guide-hero-panel-top"><span className="guide-dot" /><span className="guide-dot" /><span className="guide-dot" /></div>
        <div className="guide-hero-panel-title">Temporada esportiva</div>
        <div className="guide-hero-row"><span className="guide-hero-icon"><GuideIconView icon="calendar" /></span><span><strong>Agenda</strong><small>Jogos e eventos</small></span><span className="guide-row-check">âœ“</span></div>
        <div className="guide-hero-row"><span className="guide-hero-icon"><GuideIconView icon="team" /></span><span><strong>Equipes</strong><small>Elencos organizados</small></span><span className="guide-row-check">âœ“</span></div>
        <div className="guide-hero-row"><span className="guide-hero-icon"><GuideIconView icon="trophy" /></span><span><strong>Campeonatos</strong><small>InscriÃ§Ãµes e resultados</small></span><span className="guide-row-check">âœ“</span></div>
      </div>
    </section>

    <section className="guide-intro-grid" aria-label="Sobre a plataforma">
      <Card className="guide-info-card"><span className="guide-icon"><GuideIconView icon="shield" /></span><p className="eyebrow">SOBRE O SITE</p><h3>O que Ã© o SENAI Sports?</h3><p>Ã‰ uma plataforma de organizaÃ§Ã£o esportiva escolar. Ela centraliza informaÃ§Ãµes de jogos, equipes, campeonatos e resultados para alunos, professores e diretores acompanharem as atividades da quadra.</p></Card>
      <Card className="guide-info-card"><span className="guide-icon"><GuideIconView icon="ranking" /></span><p className="eyebrow">PARA QUE SERVE?</p><h3>Mais clareza para participar e organizar</h3><p>O site ajuda a consultar a programaÃ§Ã£o, organizar participantes e elencos e acompanhar resultados sem depender de informaÃ§Ãµes espalhadas por diferentes canais.</p></Card>
    </section>

    <section className="guide-section" aria-labelledby="guide-features-title">
      <div className="guide-section-heading"><div><p className="eyebrow">RECURSOS</p><h2 id="guide-features-title">O que vocÃª pode fazer</h2></div><p className="muted">As aÃ§Ãµes disponÃ­veis dependem do perfil da sua conta.</p></div>
      <div className="guide-feature-grid">{features.map((feature, index) => <Card className="guide-feature-card" key={feature.title} style={{ animationDelay: `${index * 45}ms` }}>
        <span className="guide-icon"><GuideIconView icon={feature.icon} /></span><h3>{feature.title}</h3><p>{feature.description}</p><button className="link-btn guide-action" onClick={() => navigate(feature.route)}>{feature.action}<span aria-hidden="true">â†’</span></button>
      </Card>)}</div>
    </section>

    <section className="guide-section guide-start-section" id="guide-start" aria-labelledby="guide-start-title">
      <div className="guide-section-heading"><div><p className="eyebrow">PASSO A PASSO</p><h2 id="guide-start-title">Como comeÃ§ar</h2></div><Button variant="secondary" onClick={() => navigate('calendar')}>Explorar calendÃ¡rio</Button></div>
      <div className="guide-steps">{steps.map(step => <article className="guide-step" key={step.number}><span className="guide-step-number">{step.number}</span><div><h3>{step.title}</h3><p>{step.description}</p></div></article>)}</div>
    </section>

    <section className="guide-benefits" aria-labelledby="guide-benefits-title">
      <div><p className="eyebrow">BENEFÃCIOS</p><h2 id="guide-benefits-title">Uma rotina esportiva mais simples de acompanhar</h2><p className="muted">Agenda, organizaÃ§Ã£o e desempenho ficam acessÃ­veis no mesmo ambiente.</p></div>
      <ul><li><span>âœ“</span><div><strong>ProgramaÃ§Ã£o centralizada</strong><small>Consulte datas, horÃ¡rios, quadras e situaÃ§Ãµes das partidas.</small></div></li><li><span>âœ“</span><div><strong>Responsabilidades claras</strong><small>Cada perfil encontra as ferramentas correspondentes Ã s suas tarefas.</small></div></li><li><span>âœ“</span><div><strong>Acompanhamento contÃ­nuo</strong><small>Resultados e rankings ajudam a acompanhar a atividade esportiva ao longo do tempo.</small></div></li></ul>
    </section>

    <aside className="guide-version-note"><strong>Sobre esta versão:</strong> a consulta pública está aberta e não há cadastro na tela de login. Os dados e a autenticação desta demonstração ainda são locais ao navegador; permissões de produção exigem backend e políticas de banco.
    </aside>
  </div>;
}



