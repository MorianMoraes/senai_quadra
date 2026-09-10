const APP_KEY = 'senaiSportsDemoV1';
const SESSION_KEY = 'senaiSportsSessionV1';
const THEME_KEY = 'senaiSportsThemeV1';

const todayISO = () => new Date().toISOString().slice(0,10);
const addDays = (days) => { const d = new Date(); d.setDate(d.getDate()+days); return d.toISOString().slice(0,10); };
const uid = (p='id') => `${p}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
const escapeHTML = (s='') => String(s).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));

const seed = {
  users: [
    {id:'u1', role:'diretor', name:'Diretor SENAI', email:'diretor@senai.local', password:'Senai@123', turma:'Direção', idade:38, matricula:'DIR001', photo:'', suspended:false},
    {id:'u2', role:'professor', name:'Prof. Rafael', email:'professor@senai.local', password:'Professor@123', turma:'Educação Física', idade:31, matricula:'PROF001', photo:'', suspended:false},
    {id:'u3', role:'professor', name:'Prof. Camila', email:'camila@senai.local', password:'Camila@123', turma:'Educação Física', idade:29, matricula:'PROF002', photo:'', suspended:false},
    {id:'u4', role:'aluno', name:'João Silva', email:'aluno@senai.local', password:'Aluno@123', turma:'2º A', idade:16, matricula:'ALU001', photo:'', suspended:false},
    {id:'u5', role:'aluno', name:'Maria Costa', email:'maria@senai.local', password:'Maria@123', turma:'2º A', idade:16, matricula:'ALU002', photo:'', suspended:false},
    {id:'u6', role:'aluno', name:'Lucas Souza', email:'lucas@senai.local', password:'Lucas@123', turma:'2º B', idade:17, matricula:'ALU003', photo:'', suspended:false},
    {id:'u7', role:'aluno', name:'Ana Lima', email:'ana@senai.local', password:'Ana@1234', turma:'2º B', idade:16, matricula:'ALU004', photo:'', suspended:false},
    {id:'u8', role:'aluno', name:'Pedro Alves', email:'pedro@senai.local', password:'Pedro@123', turma:'3º A', idade:17, matricula:'ALU005', photo:'', suspended:false}
  ],
  teams: [
    {id:'t1', name:'Fênix Azul', status:'ativa', creatorId:'u4', teacherIds:['u2'], memberIds:['u4','u5','u6','u2'], reserveIds:['u7'], wins:4, losses:1, pointsFor:310, pointsAgainst:242},
    {id:'t2', name:'Impacto', status:'ativa', creatorId:'u5', teacherIds:['u3'], memberIds:['u5','u7','u8','u3'], reserveIds:[], wins:2, losses:2, pointsFor:250, pointsAgainst:248},
    {id:'t3', name:'Titãs', status:'ativa', creatorId:'u6', teacherIds:['u2'], memberIds:['u6','u8','u2'], reserveIds:['u4'], wins:3, losses:2, pointsFor:285, pointsAgainst:270}
  ],
  games: [
    {id:'g1', date:addDays(1), time:'14:00', duration:90, court:'Quadra SENAI', team1:'t1', team2:'t2', limit:18, description:'Jogo amistoso', notes:'Chegar 10 minutos antes.', status:'inscricoes', participantIds:['u4','u5','u6','u7'], sets:[], createdBy:'u2'},
    {id:'g2', date:addDays(3), time:'15:30', duration:90, court:'Quadra SENAI', team1:'t2', team2:'t3', limit:18, description:'Rodada interna', notes:'', status:'agendado', participantIds:['u5','u7','u8'], sets:[], createdBy:'u3'},
    {id:'g3', date:addDays(-4), time:'16:00', duration:90, court:'Quadra SENAI', team1:'t1', team2:'t3', limit:18, description:'Treino oficial', notes:'', status:'finalizado', participantIds:['u4','u5','u6','u8'], sets:[{a:25,b:19},{a:22,b:25},{a:15,b:12}], createdBy:'u2'}
  ],
  tournaments: [],
  invites: [
    {id:'i1', teamId:'t3', userId:'u5', status:'pendente', createdAt:new Date().toISOString()}
  ],
  notifications: [
    {id:'n1', userId:'u4', text:'Novo jogo disponível amanhã às 14:00.', read:false, createdAt:new Date().toISOString()},
    {id:'n2', userId:'u5', text:'A equipe Titãs convidou você para participar.', read:false, createdAt:new Date().toISOString()}
  ],
  stats: [
    {userId:'u4', points:62, serves:31, aces:12, blocks:8, attacks:38, errors:7, wins:5, losses:2},
    {userId:'u5', points:55, serves:27, aces:9, blocks:6, attacks:34, errors:8, wins:4, losses:3},
    {userId:'u6', points:48, serves:29, aces:7, blocks:11, attacks:26, errors:6, wins:4, losses:2},
    {userId:'u7', points:41, serves:24, aces:8, blocks:4, attacks:25, errors:5, wins:3, losses:3},
    {userId:'u8', points:37, serves:20, aces:5, blocks:7, attacks:22, errors:9, wins:2, losses:4}
  ],
  logs: [
    {id:'l1', actorId:'u2', action:'criou o jogo Fênix Azul x Impacto', createdAt:new Date().toISOString()},
    {id:'l2', actorId:'u3', action:'atualizou uma equipe', createdAt:new Date(Date.now()-3600000).toISOString()}
  ]
};

let state = loadState();
let session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
let route = 'dashboard';
let calendarDate = new Date();
let sidebarOpen = false;

function loadState(){
  const raw = localStorage.getItem(APP_KEY);
  if(!raw){ localStorage.setItem(APP_KEY, JSON.stringify(seed)); return structuredClone(seed); }
  try { return JSON.parse(raw); } catch { return structuredClone(seed); }
}
function saveState(){ localStorage.setItem(APP_KEY, JSON.stringify(state)); }
function currentUser(){ return state.users.find(u => u.id === session?.userId) || null; }
function userName(id){ return state.users.find(u => u.id===id)?.name || 'Usuário'; }
function teamName(id){ return state.teams.find(t => t.id===id)?.name || 'Equipe aberta'; }
function fmtDate(date){ return new Intl.DateTimeFormat('pt-BR',{day:'2-digit',month:'2-digit',year:'numeric'}).format(new Date(`${date}T12:00:00`)); }
function fmtDateTime(date,time){ return new Date(`${date}T${time}:00`); }
function isPrivileged(){ return ['professor','diretor'].includes(currentUser()?.role); }
function canCreateTournament(){ const u=currentUser(); return u?.role==='professor' && !u.suspended; }
function teamPlayers(t){ return t.memberIds.filter(id=>state.users.some(u=>u.id===id && u.role==='aluno')); }
function rosterError(t){
  if(!t || t.status!=='ativa') return 'A equipe precisa estar ativa.';
  if(t.memberIds.length!==6 || new Set(t.memberIds).size!==6) return 'Complete o time com exatamente 6 jogadores diferentes.';
  if(!t.memberIds.includes(t.creatorId)) return 'O líder deve fazer parte dos 6 jogadores.';
  if(t.memberIds.some(id=>!state.users.some(u=>u.id===id && u.role==='aluno' && !u.suspended))) return 'Os 6 jogadores devem ser alunos com contas ativas.';
  return '';
}
function registrationError(tournament,team){
  const u=currentUser();
  if(!u || u.suspended || u.role!=='aluno' || !team || team.creatorId!==u.id) return 'Somente o líder que criou o time pode inscrevê-lo.';
  if(!tournament || tournament.status!=='inscricoes' || tournament.date<todayISO()) return 'As inscrições deste campeonato estão encerradas.';
  if(tournament.teamIds.includes(team.id)) return 'Este time já está inscrito.';
  const error=rosterError(team); if(error) return error;
  const occupied=(tournament.registrations||[]).flatMap(r=>r.memberIds);
  if(team.memberIds.some(id=>occupied.includes(id))) return 'Um jogador já está inscrito por outro time neste campeonato.';
  return '';
}
function registerTeam(tournamentId,teamId){
  const tournament=state.tournaments.find(t=>t.id===tournamentId), team=state.teams.find(t=>t.id===teamId);
  const error=registrationError(tournament,team); if(error){toast(error,'error');return false;}
  tournament.teamIds.push(team.id);
  (tournament.registrations??=[]).push({teamId:team.id,leaderId:currentUser().id,memberIds:[...team.memberIds],createdAt:new Date().toISOString()});
  log(`inscreveu a equipe ${team.name} no campeonato ${tournament.name}`); saveState(); return true;
}
function roleLabel(role){ return ({aluno:'Aluno',professor:'Professor',diretor:'Diretor'})[role] || role; }
function notify(userId,text){ state.notifications.unshift({id:uid('n'),userId,text,read:false,createdAt:new Date().toISOString()}); }
function log(action){ const u=currentUser(); if(!u) return; state.logs.unshift({id:uid('l'),actorId:u.id,action,createdAt:new Date().toISOString()}); }
function toast(msg,type='success'){
  let wrap=document.querySelector('.toast-wrap');
  if(!wrap){ wrap=document.createElement('div'); wrap.className='toast-wrap'; document.body.appendChild(wrap); }
  const el=document.createElement('div'); el.className=`toast ${type}`; el.textContent=msg; wrap.appendChild(el); setTimeout(()=>el.remove(),3200);
}
function normalizeOffensive(s){ return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/4/g,'a').replace(/3/g,'e').replace(/1/g,'i').replace(/0/g,'o').replace(/5/g,'s').replace(/7/g,'t').replace(/[^a-z]/g,''); }
function inappropriateName(s){ const n=normalizeOffensive(s); const blocked=['porra','caralho','merda','puta','puto','viado','buceta','pinto','sexo','nazista','racista']; return blocked.some(w=>n.includes(w)); }
function passwordScore(p){
  const rules=[p.length>=8,/[A-Z]/.test(p),/[a-z]/.test(p),/\d/.test(p),/[^A-Za-z0-9]/.test(p)];
  const met=rules.filter(Boolean).length;
  return {valid:met===5, level:met<=2?1:met<5?2:3, rules};
}

function app(){
  document.documentElement.dataset.theme = localStorage.getItem(THEME_KEY) || 'light';
  const root=document.getElementById('app');
  const u=currentUser();
  if(!u){ root.innerHTML=authView(); bindAuth(); return; }
  if(u.suspended){ root.innerHTML=suspendedView(u); document.getElementById('logoutSuspended').onclick=logout; return; }
  root.innerHTML=shellView(u);
  bindShell();
}

function authView(){
  return `<div class="auth-shell">
    <section class="auth-brand">
      <div class="logo"><div class="logo-mark">SS</div><span>SENAI Sports</span></div>
      <div><h1>Vôlei.<br>Agenda.<br>Equipe.</h1><p>Organize jogos, monte times, acompanhe campeonatos e veja o desempenho dos alunos em um só lugar.</p></div>
      <div class="auth-court"></div>
    </section>
    <section class="auth-card-wrap"><div class="auth-card" id="authCard">${loginForm()}</div></section>
  </div>`;
}

function loginForm(){ return `<div class="logo"><div class="logo-mark">SS</div><span>SENAI Sports</span></div>
  <h2>Entrar</h2><div class="helper">Acesse sua conta para continuar.</div>
  <form id="loginForm">
    <div class="form-field"><label>E-mail</label><input id="loginEmail" type="email" required placeholder="seuemail@exemplo.com"></div>
    <div class="form-field"><label>Senha</label><input id="loginPassword" type="password" required placeholder="Sua senha"></div>
    <button class="btn btn-primary btn-block" type="submit">Entrar</button>
  </form>
  <div style="display:flex;justify-content:space-between;margin-top:14px;gap:12px;flex-wrap:wrap"><button class="link-btn" id="forgotBtn">Esqueci minha senha</button><button class="link-btn" id="registerBtn">Criar conta</button></div>
  <div class="notice" style="margin-top:18px"><strong>Contas de teste</strong><br>Aluno: aluno@senai.local / Aluno@123<br>Professor: professor@senai.local / Professor@123<br>Diretor: diretor@senai.local / Senai@123</div>`; }

function registerForm(){ return `<div class="logo"><div class="logo-mark">SS</div><span>SENAI Sports</span></div>
  <h2>Criar conta</h2><div class="helper">Cadastro livre de aluno ou professor.</div>
  <form id="registerForm"><div class="form-grid">
    <div class="form-field full"><label>Nome completo</label><input id="regName" required></div>
    <div class="form-field"><label>E-mail</label><input id="regEmail" type="email" required></div>
    <div class="form-field"><label>Perfil</label><select id="regRole"><option value="aluno">Aluno</option><option value="professor">Professor</option></select></div>
    <div class="form-field"><label>Turma</label><input id="regTurma" required placeholder="Ex.: 2º A"></div>
    <div class="form-field"><label>Idade</label><input id="regIdade" type="number" min="1" max="100" required></div>
    <div class="form-field"><label>Matrícula</label><input id="regMatricula" required></div>
    <div class="form-field"><label>Foto (URL opcional)</label><input id="regPhoto" placeholder="https://..."></div>
    <div class="form-field full"><label>Senha</label><input id="regPassword" type="password" required><div class="password-meter" id="meter" data-level="1"><span></span><span></span><span></span></div><div class="password-rules" id="rules">Mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial.</div></div>
    <div class="form-field full"><label>Confirmar senha</label><input id="regConfirm" type="password" required></div>
  </div><button class="btn btn-primary btn-block" type="submit">Cadastrar</button></form>
  <div style="margin-top:14px"><button class="link-btn" id="backLogin">Voltar para login</button></div>`; }

function forgotForm(){ return `<div class="logo"><div class="logo-mark">SS</div><span>SENAI Sports</span></div><h2>Redefinir senha</h2><div class="helper">Nesta demonstração, simulamos o envio do e-mail.</div><form id="forgotForm"><div class="form-field"><label>E-mail</label><input id="forgotEmail" type="email" required></div><button class="btn btn-primary btn-block">Enviar redefinição</button></form><div style="margin-top:14px"><button class="link-btn" id="backLogin">Voltar para login</button></div>`; }

function suspendedView(u){ return `<div class="auth-card-wrap" style="min-height:100vh"><div class="auth-card"><div class="logo"><div class="logo-mark">SS</div><span>SENAI Sports</span></div><h2>Conta suspensa</h2><p class="muted">Olá, ${escapeHTML(u.name)}. Sua conta está suspensa e as funções esportivas estão bloqueadas.</p><button id="logoutSuspended" class="btn btn-secondary">Sair</button></div></div>`; }

function bindAuth(){
  const card=document.getElementById('authCard');
  const bindLogin=()=>{
    document.getElementById('registerBtn')?.addEventListener('click',()=>{card.innerHTML=registerForm(); bindRegister();});
    document.getElementById('forgotBtn')?.addEventListener('click',()=>{card.innerHTML=forgotForm(); bindForgot();});
    document.getElementById('loginForm')?.addEventListener('submit',e=>{
      e.preventDefault(); const email=loginEmail.value.trim().toLowerCase(); const pass=loginPassword.value;
      const attempts=JSON.parse(localStorage.getItem('senaiSportsAttempts')||'{}'); const a=attempts[email]||{count:0,until:0};
      if(Date.now()<a.until){ toast('Muitas tentativas. Tente novamente mais tarde.','error'); return; }
      const u=state.users.find(x=>x.email.toLowerCase()===email && x.password===pass);
      if(!u){ a.count++; if(a.count>=5){a.count=0;a.until=Date.now()+15*60*1000;} attempts[email]=a; localStorage.setItem('senaiSportsAttempts',JSON.stringify(attempts)); toast('E-mail ou senha inválidos.','error'); return; }
      attempts[email]={count:0,until:0}; localStorage.setItem('senaiSportsAttempts',JSON.stringify(attempts));
      session={userId:u.id}; localStorage.setItem(SESSION_KEY,JSON.stringify(session)); route='dashboard'; app();
    });
  };
  const bindRegister=()=>{
    document.getElementById('backLogin').onclick=()=>{card.innerHTML=loginForm(); bindLogin();};
    const p=document.getElementById('regPassword'); p.addEventListener('input',()=>{ const s=passwordScore(p.value); meter.dataset.level=s.level; rules.textContent = s.valid ? 'Senha forte e válida.' : 'Mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial.'; });
    document.getElementById('registerForm').addEventListener('submit',e=>{
      e.preventDefault(); const name=regName.value.trim(); const email=regEmail.value.trim().toLowerCase(); const pass=regPassword.value;
      if(inappropriateName(name)){toast('Nome bloqueado pelo filtro de conteúdo.','error');return;}
      if(state.users.some(u=>u.email.toLowerCase()===email)){toast('Este e-mail já está cadastrado.','error');return;}
      if(!passwordScore(pass).valid){toast('A senha ainda não atende a todos os requisitos.','error');return;}
      if(pass!==regConfirm.value){toast('As senhas não coincidem.','error');return;}
      const u={id:uid('u'),role:regRole.value,name,email,password:pass,turma:regTurma.value.trim(),idade:Number(regIdade.value),matricula:regMatricula.value.trim(),photo:regPhoto.value.trim(),suspended:false};
      state.users.push(u); state.stats.push({userId:u.id,points:0,serves:0,aces:0,blocks:0,attacks:0,errors:0,wins:0,losses:0}); saveState(); session={userId:u.id}; localStorage.setItem(SESSION_KEY,JSON.stringify(session)); app(); toast('Conta criada com sucesso.');
    });
  };
  const bindForgot=()=>{ document.getElementById('backLogin').onclick=()=>{card.innerHTML=loginForm(); bindLogin();}; document.getElementById('forgotForm').onsubmit=e=>{e.preventDefault();toast('Link de redefinição simulado como enviado para o e-mail informado.'); card.innerHTML=loginForm(); bindLogin();}; };
  bindLogin();
}

function navItems(role){
  const common=[['dashboard','Dashboard','⌂'],['calendar','Calendário','◫'],['games','Jogos','🏐'],['teams','Equipes','👥'],['tournaments','Campeonatos','🏆'],['ranking','Ranking','📊'],['notifications','Notificações','🔔'],['history','Histórico','↺'],['profile','Perfil','◎']];
  if(role==='professor') common.splice(2,0,['createGame','Criar jogo','＋']);
  if(role==='diretor') return [['dashboard','Dashboard','⌂'],['calendar','Calendário','◫'],['createGame','Criar jogo','＋'],['games','Jogos','🏐'],['teams','Equipes','👥'],['tournaments','Campeonatos','🏆'],['users','Usuários','👤'],['ranking','Ranking','📊'],['logs','Logs','☷'],['notifications','Notificações','🔔'],['profile','Perfil','◎']];
  return common;
}

function shellView(u){
  const unread=state.notifications.filter(n=>n.userId===u.id&&!n.read).length;
  return `<div class="app-shell">
    <aside class="sidebar ${sidebarOpen?'open':''}" id="sidebar">
      <div class="logo"><div class="logo-mark">SS</div><span>SENAI Sports</span></div>
      <nav class="nav">${navItems(u.role).map(([r,l,i])=>`<button data-route="${r}" class="${route===r?'active':''}"><span>${i}</span>${l}</button>`).join('')}</nav>
      <div class="sidebar-bottom">
        <button class="btn btn-secondary" id="themeBtn">Alternar tema</button>
        <div class="user-mini"><div class="avatar">${avatarHTML(u)}</div><div><strong>${escapeHTML(u.name)}</strong><small>${roleLabel(u.role)}</small></div></div>
        <button class="btn btn-danger" id="logoutBtn">Sair</button>
      </div>
    </aside>
    <main class="main"><header class="topbar"><div style="display:flex;align-items:center;gap:10px"><button class="icon-btn mobile-menu" id="menuBtn">☰</button><h1>${pageTitle(route)}</h1></div><div class="top-actions"><button class="icon-btn" id="notifBtn">🔔${unread?`<span class="badge-count">${unread}</span>`:''}</button></div></header><section class="content">${routeView(u)}</section></main>
  </div><div class="toast-wrap"></div>`;
}
function avatarHTML(u){ return u.photo ? `<img src="${escapeHTML(u.photo)}" alt="Foto de ${escapeHTML(u.name)}">` : escapeHTML(u.name.split(' ').map(x=>x[0]).join('').slice(0,2).toUpperCase()); }
function pageTitle(r){return ({dashboard:'Dashboard',calendar:'Calendário',createGame:'Criar jogo',games:'Jogos',teams:'Equipes',tournaments:'Campeonatos',ranking:'Ranking',notifications:'Notificações',history:'Histórico',profile:'Perfil',users:'Usuários',logs:'Logs'})[r]||'SENAI Sports';}

function bindShell(){
  document.querySelectorAll('[data-route]').forEach(b=>b.onclick=()=>{route=b.dataset.route;sidebarOpen=false;app();});
  document.getElementById('logoutBtn').onclick=logout;
  document.getElementById('themeBtn').onclick=()=>{ const cur=document.documentElement.dataset.theme; localStorage.setItem(THEME_KEY,cur==='dark'?'light':'dark'); app(); };
  document.getElementById('notifBtn').onclick=()=>{route='notifications';app();};
  document.getElementById('menuBtn')?.addEventListener('click',()=>{sidebarOpen=!sidebarOpen; document.getElementById('sidebar').classList.toggle('open',sidebarOpen);});
  bindRoute();
}
function logout(){ localStorage.removeItem(SESSION_KEY); session=null; route='dashboard'; app(); }

function routeView(u){
  switch(route){
    case 'dashboard': return dashboardView(u);
    case 'calendar': return calendarView(u);
    case 'createGame': return isPrivileged()?createGameView():noAccess();
    case 'games': return gamesView(u);
    case 'teams': return teamsView(u);
    case 'tournaments': return tournamentsView(u);
    case 'ranking': return rankingView();
    case 'notifications': return notificationsView(u);
    case 'history': return historyView();
    case 'profile': return profileView(u);
    case 'users': return u.role==='diretor'?usersView():noAccess();
    case 'logs': return u.role==='diretor'?logsView():noAccess();
    default: return dashboardView(u);
  }
}
function noAccess(){ return `<div class="card"><h3>Acesso negado</h3><p class="muted">Seu perfil não possui permissão para acessar esta área.</p></div>`; }

function dashboardView(u){
  const upcoming=state.games.filter(g=>g.date>=todayISO()&&g.status!=='cancelado').sort((a,b)=>fmtDateTime(a.date,a.time)-fmtDateTime(b.date,b.time));
  const stats=state.stats.find(s=>s.userId===u.id)||{points:0,wins:0,losses:0};
  const myTeams=state.teams.filter(t=>t.memberIds.includes(u.id)||t.teacherIds.includes(u.id));
  if(u.role==='diretor') return `<div class="hero"><div><h2>Visão geral da escola</h2><p>Acompanhe usuários, partidas, equipes e campeonatos.</p></div><div><div class="big-number">${state.games.length}</div><small>jogos cadastrados</small></div></div>
  <div class="cards">${metric('Alunos',state.users.filter(x=>x.role==='aluno').length,'cadastrados')}${metric('Professores',state.users.filter(x=>x.role==='professor').length,'ativos')}${metric('Equipes',state.teams.length,'registradas')}${metric('Campeonatos',state.tournaments.length,'criados')}</div>
  <div class="grid-2"><div class="card"><div class="section-title"><h2>Próximos jogos</h2><button class="link-btn" data-go="games">Ver todos</button></div>${gameList(upcoming.slice(0,5),u)}</div><div class="card"><h3>Atividade recente</h3>${state.logs.slice(0,5).map(l=>`<div class="list-item"><div><strong>${escapeHTML(userName(l.actorId))}</strong><small>${escapeHTML(l.action)}</small></div><small>${new Date(l.createdAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</small></div>`).join('')}</div></div>`;
  if(u.role==='professor') return `<div class="hero"><div><h2>Olá, ${escapeHTML(u.name.split(' ')[0])}</h2><p>Organize partidas, equipes e campeonatos.</p></div><button class="btn btn-secondary" data-go="createGame">＋ Criar jogo</button></div>
  <div class="cards">${metric('Próximos jogos',upcoming.length,'na agenda')}${metric('Equipes',myTeams.length,'sob sua gestão')}${metric('Alunos',state.users.filter(x=>x.role==='aluno').length,'cadastrados')}${metric('Campeonatos',state.tournaments.length,'no sistema')}</div>
  <div class="grid-2"><div class="card"><div class="section-title"><h2>Próximos jogos</h2><button class="link-btn" data-go="games">Gerenciar</button></div>${gameList(upcoming.slice(0,5),u)}</div><div class="card"><h3>Equipes</h3>${teamMini(myTeams)}</div></div>`;
  const next=upcoming.find(g=>g.participantIds.includes(u.id))||upcoming[0];
  return `<div class="hero"><div><h2>Olá, ${escapeHTML(u.name.split(' ')[0])} 👋</h2><p>Bem-vindo ao SENAI Sports.</p></div>${next?`<div><small>Próximo jogo</small><div style="font-size:20px;font-weight:900">${fmtDate(next.date)} • ${next.time}</div></div>`:''}</div>
  <div class="cards">${metric('Pontos',stats.points,'acumulados')}${metric('Vitórias',stats.wins,'individuais')}${metric('Derrotas',stats.losses,'individuais')}${metric('Equipes',myTeams.length,'participando')}</div>
  <div class="grid-2"><div class="card"><div class="section-title"><h2>Próximos jogos</h2><button class="link-btn" data-go="games">Ver todos</button></div>${gameList(upcoming.slice(0,4),u)}</div><div class="card"><h3>Minha equipe</h3>${teamMini(myTeams.slice(0,2))}</div></div>`;
}
function metric(label,value,sub){return `<div class="card"><div class="metric">${value}</div><div class="metric-label">${escapeHTML(label)} • ${escapeHTML(sub)}</div></div>`;}
function teamMini(teams){return teams.length?teams.map(t=>`<div class="list-item"><div><strong>${escapeHTML(t.name)}</strong><small>${t.memberIds.length}/6 ativos • ${t.wins}V ${t.losses}D</small></div><span class="status ${t.status==='ativa'?'green':'yellow'}">${escapeHTML(t.status)}</span></div>`).join(''):`<div class="empty-state">Nenhuma equipe encontrada.</div>`;}
function gameList(games,u){return games.length?games.map(g=>`<div class="list-item"><div><strong>${escapeHTML(teamName(g.team1))} × ${escapeHTML(teamName(g.team2))}</strong><small>${fmtDate(g.date)} • ${g.time} • ${escapeHTML(g.court)}</small></div><span class="status ${g.status==='finalizado'?'green':g.status==='cancelado'?'red':'blue'}">${escapeHTML(g.status)}</span></div>`).join(''):`<div class="empty-state">Nenhum jogo encontrado.</div>`;}

function calendarView(u){
  const y=calendarDate.getFullYear(), m=calendarDate.getMonth(); const first=new Date(y,m,1); const days=new Date(y,m+1,0).getDate(); const offset=first.getDay();
  const cells=[]; for(let i=0;i<offset;i++) cells.push(`<div class="day empty"></div>`);
  for(let d=1;d<=days;d++){
    const date=`${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; const ev=state.games.filter(g=>g.date===date);
    cells.push(`<div class="day"><div class="day-number">${d}</div>${ev.map(g=>`<button class="event-chip ${g.status==='cancelado'?'cancelled':g.participantIds.includes(u.id)?'registered':''}" data-game="${g.id}">${g.time} ${escapeHTML(teamName(g.team1))} x ${escapeHTML(teamName(g.team2))}</button>`).join('')}</div>`);
  }
  return `<div class="card"><div class="calendar-toolbar"><div class="calendar-nav"><button class="btn btn-secondary" id="prevMonth">←</button><div class="calendar-title">${new Intl.DateTimeFormat('pt-BR',{month:'long',year:'numeric'}).format(calendarDate)}</div><button class="btn btn-secondary" id="nextMonth">→</button></div>${isPrivileged()?`<button class="btn btn-primary" data-go="createGame">＋ Criar jogo</button>`:''}</div><div class="calendar-scroll"><div class="calendar-grid">${['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'].map(x=>`<div class="weekday">${x}</div>`).join('')}${cells.join('')}</div></div></div>`;
}

function createGameView(){
  return `<div class="card"><div class="section-title"><h2>Novo jogo</h2><span class="status blue">Somente professor/diretor</span></div><form id="gameForm"><div class="form-grid">
  <div class="form-field"><label>Data</label><input id="gDate" type="date" required></div><div class="form-field"><label>Horário</label><input id="gTime" type="time" required></div>
  <div class="form-field"><label>Local / quadra</label><input id="gCourt" value="Quadra SENAI" required></div><div class="form-field"><label>Duração (min)</label><input id="gDuration" type="number" min="30" value="90" required></div>
  <div class="form-field"><label>Equipe 1</label>${teamSelect('gTeam1')}</div><div class="form-field"><label>Equipe 2</label>${teamSelect('gTeam2')}</div>
  <div class="form-field"><label>Limite de jogadores</label><input id="gLimit" type="number" min="1" value="18" required></div><div class="form-field"><label>Status</label><select id="gStatus"><option value="inscricoes">Inscrições abertas</option><option value="agendado">Agendado</option></select></div>
  <div class="form-field full"><label>Descrição</label><input id="gDesc" placeholder="Ex.: Jogo amistoso"></div><div class="form-field full"><label>Observações</label><textarea id="gNotes"></textarea></div>
  </div><button class="btn btn-primary" type="submit">Salvar jogo</button></form></div>`;
}
function teamSelect(id){return `<select id="${id}"><option value="">Equipe aberta</option>${state.teams.filter(t=>t.status==='ativa').map(t=>`<option value="${t.id}">${escapeHTML(t.name)}</option>`).join('')}</select>`;}

function gamesView(u){
  const games=[...state.games].sort((a,b)=>fmtDateTime(b.date,b.time)-fmtDateTime(a.date,a.time));
  return `<div class="section-title"><h2>Jogos</h2>${isPrivileged()?`<button class="btn btn-primary" data-go="createGame">＋ Criar jogo</button>`:''}</div><div class="card table-wrap"><table><thead><tr><th>Data</th><th>Partida</th><th>Horário</th><th>Participantes</th><th>Status</th><th>Ações</th></tr></thead><tbody>${games.map(g=>`<tr><td>${fmtDate(g.date)}</td><td><strong>${escapeHTML(teamName(g.team1))} × ${escapeHTML(teamName(g.team2))}</strong></td><td>${g.time}</td><td>${g.participantIds.length}/${g.limit}</td><td><span class="status ${g.status==='finalizado'?'green':g.status==='cancelado'?'red':'blue'}">${escapeHTML(g.status)}</span></td><td>${gameActions(g,u)}</td></tr>`).join('')}</tbody></table></div>`;
}
function gameActions(g,u){
  const joined=g.participantIds.includes(u.id); const mins=(fmtDateTime(g.date,g.time)-new Date())/60000; const canCancel=mins>15;
  let html=`<button class="link-btn" data-game="${g.id}">Detalhes</button>`;
  if(u.role==='aluno' && ['inscricoes','agendado'].includes(g.status)) html += joined ? (canCancel?` &nbsp; <button class="link-btn" data-leave="${g.id}">Sair</button>`:'') : `<br><button class="link-btn" data-join="${g.id}">Entrar</button>`;
  if(isPrivileged() && g.status!=='cancelado') html += `<br><button class="link-btn" data-score="${g.id}">Placar</button> &nbsp; <button class="link-btn" data-cancel="${g.id}">Cancelar</button>`;
  return html;
}

function teamsView(u){
  return `<div class="section-title"><h2>Times</h2><button class="btn btn-primary" id="newTeamBtn">＋ Criar equipe</button></div><div class="searchbar"><input id="teamSearch" placeholder="Pesquisar equipe..."></div><div class="team-grid" id="teamGrid">${teamCards(state.teams,u)}</div>`;
}
function teamCards(teams,u){ return teams.map(t=>{const pct=Math.min(100,(t.memberIds.length/6)*100);return `<article class="team-card"><div class="team-head"><div><h3>${escapeHTML(t.name)}</h3><div class="muted">${escapeHTML(t.teacherIds.map(userName).join(', '))}</div></div><span class="status ${t.status==='ativa'?'green':'yellow'}">${escapeHTML(t.status)}</span></div><div class="progress"><span style="width:${pct}%"></span></div><div><strong>${t.memberIds.length}/6 ativos</strong> • ${t.reserveIds.length} reserva(s)</div><div class="muted" style="margin:8px 0 14px">${t.wins} vitórias • ${t.losses} derrotas • ${t.pointsFor} pontos feitos</div><div class="btn-row"><button class="btn btn-secondary" data-teamdetail="${t.id}">Ver equipe</button>${isPrivileged()?`<button class="btn btn-danger" data-delteam="${t.id}">Excluir</button>`:''}</div></article>`;}).join(''); }

function tournamentsView(u){
  const eligible=eligibleTournamentDates();
  return `<div class="section-title"><h2>Campeonatos</h2>${isPrivileged()&&eligible.length?`<button class="btn btn-primary" id="newTournamentBtn">＋ Criar campeonato</button>`:''}</div>${eligible.length&&isPrivileged()?`<div class="notice">Existem ${eligible.length} dia(s) com 3 ou mais equipes envolvidas em jogos. A opção de campeonato está disponível.</div>`:''}${state.tournaments.length?state.tournaments.map(t=>tournamentCard(t)).join(''):`<div class="card"><div class="empty-state">Nenhum campeonato criado ainda.</div></div>`}`;
}
function eligibleTournamentDates(){
  const by={}; state.games.filter(g=>g.status!=='cancelado').forEach(g=>{by[g.date]??=new Set(); if(g.team1)by[g.date].add(g.team1); if(g.team2)by[g.date].add(g.team2);}); return Object.entries(by).filter(([,s])=>s.size>=3).map(([d,s])=>({date:d,teams:[...s]}));
}
function tournamentCard(t){
  return `<div class="card" style="margin-bottom:16px"><div class="section-title"><div><h2>${escapeHTML(t.name)}</h2><div class="muted">${fmtDate(t.date)} • Mata-mata • ${t.teamIds.length} equipes</div></div><span class="status blue">${escapeHTML(t.status)}</span></div><div class="bracket">${t.rounds.map((round,i)=>`<div class="round"><h4>${i===t.rounds.length-1?'Final':`Rodada ${i+1}`}</h4>${round.map(m=>`<div class="match"><div class="match-row ${m.winner===m.a?'winner':''}"><span>${escapeHTML(teamName(m.a))}</span><strong>${m.scoreA??'-'}</strong></div><div class="match-row ${m.winner===m.b?'winner':''}"><span>${escapeHTML(teamName(m.b))}</span><strong>${m.scoreB??'-'}</strong></div></div>`).join('')}</div>`).join('')}</div></div>`;
}

function rankingView(){
  const playerRows=state.stats.map(s=>({...s,user:state.users.find(u=>u.id===s.userId)})).filter(x=>x.user&&x.user.role==='aluno').sort((a,b)=>b.points-a.points);
  const teams=[...state.teams].sort((a,b)=>b.wins-a.wins||b.pointsFor-a.pointsFor);
  return `<div class="grid-equal"><div class="card"><h3>Ranking de alunos</h3><div class="table-wrap"><table><thead><tr><th>#</th><th>Aluno</th><th>Pontos</th><th>Aces</th><th>Bloqueios</th><th>V/D</th></tr></thead><tbody>${playerRows.map((x,i)=>`<tr><td><strong>${i+1}</strong></td><td>${escapeHTML(x.user.name)}<br><small class="muted">${escapeHTML(x.user.turma)}</small></td><td>${x.points}</td><td>${x.aces}</td><td>${x.blocks}</td><td>${x.wins}/${x.losses}</td></tr>`).join('')}</tbody></table></div></div><div class="card"><h3>Ranking de equipes</h3><div class="table-wrap"><table><thead><tr><th>#</th><th>Equipe</th><th>V</th><th>D</th><th>PF</th><th>PS</th></tr></thead><tbody>${teams.map((t,i)=>`<tr><td><strong>${i+1}</strong></td><td>${escapeHTML(t.name)}</td><td>${t.wins}</td><td>${t.losses}</td><td>${t.pointsFor}</td><td>${t.pointsAgainst}</td></tr>`).join('')}</tbody></table></div></div></div>`;
}

function notificationsView(u){ const ns=state.notifications.filter(n=>n.userId===u.id); return `<div class="section-title"><h2>Notificações</h2><button class="btn btn-secondary" id="markAll">Marcar todas como lidas</button></div><div class="card">${ns.length?ns.map(n=>`<div class="list-item"><div><strong>${n.read?'Notificação':'Nova notificação'}</strong><small>${escapeHTML(n.text)}</small></div><button class="link-btn" data-read="${n.id}">${n.read?'Lida':'Marcar como lida'}</button></div>`).join(''):`<div class="empty-state">Nenhuma notificação.</div>`}</div>`; }
function historyView(){ const done=state.games.filter(g=>['finalizado','cancelado'].includes(g.status)); return `<div class="card"><div class="section-title"><h2>Histórico de partidas</h2></div>${gameList(done,currentUser())}</div>`; }

function profileView(u){ const s=state.stats.find(x=>x.userId===u.id)||{}; return `<div class="profile-grid"><div class="card profile-card"><div class="avatar">${avatarHTML(u)}</div><h2>${escapeHTML(u.name)}</h2><div class="muted">${roleLabel(u.role)} • ${escapeHTML(u.turma)}</div></div><div class="card"><h3>Dados da conta</h3><form id="profileForm"><div class="form-grid"><div class="form-field full"><label>Nome completo</label><input id="pName" value="${escapeHTML(u.name)}"></div><div class="form-field"><label>E-mail</label><input value="${escapeHTML(u.email)}" disabled></div><div class="form-field"><label>Matrícula</label><input value="${escapeHTML(u.matricula)}" disabled></div><div class="form-field"><label>Turma</label><input id="pTurma" value="${escapeHTML(u.turma)}"></div><div class="form-field"><label>Foto (URL)</label><input id="pPhoto" value="${escapeHTML(u.photo||'')}"></div></div><button class="btn btn-primary">Salvar perfil</button></form><hr style="border:0;border-top:1px solid var(--border);margin:22px 0"><h3>Estatísticas</h3><div class="cards" style="grid-template-columns:repeat(3,1fr)">${metric('Pontos',s.points||0,'total')}${metric('Aces',s.aces||0,'total')}${metric('Bloqueios',s.blocks||0,'total')}</div></div></div>`; }

function usersView(){ return `<div class="card"><div class="section-title"><h2>Gestão de usuários</h2><span class="status blue">Diretor</span></div><div class="table-wrap"><table><thead><tr><th>Nome</th><th>Perfil</th><th>Turma</th><th>Matrícula</th><th>Status</th><th>Ação</th></tr></thead><tbody>${state.users.map(u=>`<tr><td>${escapeHTML(u.name)}<br><small class="muted">${escapeHTML(u.email)}</small></td><td>${roleLabel(u.role)}</td><td>${escapeHTML(u.turma)}</td><td>${escapeHTML(u.matricula)}</td><td><span class="status ${u.suspended?'red':'green'}">${u.suspended?'Suspenso':'Ativo'}</span></td><td>${u.role!=='diretor'?`<button class="link-btn" data-suspend="${u.id}">${u.suspended?'Reativar':'Suspender'}</button>`:'—'}</td></tr>`).join('')}</tbody></table></div></div>`; }
function logsView(){ return `<div class="card"><h3>Logs do sistema</h3><div class="table-wrap"><table><thead><tr><th>Data/hora</th><th>Usuário</th><th>Ação</th></tr></thead><tbody>${state.logs.map(l=>`<tr><td>${new Date(l.createdAt).toLocaleString('pt-BR')}</td><td>${escapeHTML(userName(l.actorId))}</td><td>${escapeHTML(l.action)}</td></tr>`).join('')}</tbody></table></div></div>`; }

function bindRoute(){
  document.querySelectorAll('[data-go]').forEach(b=>b.onclick=()=>{route=b.dataset.go;app();});
  if(route==='calendar'){
    document.getElementById('prevMonth').onclick=()=>{calendarDate=new Date(calendarDate.getFullYear(),calendarDate.getMonth()-1,1);app();};
    document.getElementById('nextMonth').onclick=()=>{calendarDate=new Date(calendarDate.getFullYear(),calendarDate.getMonth()+1,1);app();};
  }
  if(route==='createGame') bindCreateGame();
  if(route==='games') bindGames();
  if(route==='teams') bindTeams();
  if(route==='tournaments') bindTournaments();
  if(route==='notifications') bindNotifications();
  if(route==='profile') bindProfile();
  if(route==='users') bindUsers();
  document.querySelectorAll('[data-game]').forEach(b=>b.onclick=()=>openGameModal(b.dataset.game));
}

function bindCreateGame(){ document.getElementById('gameForm')?.addEventListener('submit',e=>{
  e.preventDefault(); const date=gDate.value,time=gTime.value,duration=Number(gDuration.value); const start=fmtDateTime(date,time),end=new Date(start.getTime()+duration*60000);
  const conflict=state.games.some(g=>{ if(g.status==='cancelado'||g.date!==date)return false; const s=fmtDateTime(g.date,g.time), e2=new Date(s.getTime()+g.duration*60000); return start<e2&&end>s; });
  if(conflict){toast('Já existe um jogo ocupando a quadra nesse horário.','error');return;}
  if(gTeam1.value && gTeam1.value===gTeam2.value){toast('Escolha equipes diferentes.','error');return;}
  const game={id:uid('g'),date,time,duration,court:gCourt.value.trim(),team1:gTeam1.value,team2:gTeam2.value,limit:Number(gLimit.value),description:gDesc.value.trim(),notes:gNotes.value.trim(),status:gStatus.value,participantIds:[],sets:[],createdBy:currentUser().id};
  state.games.push(game); state.users.filter(u=>u.role==='aluno').forEach(u=>notify(u.id,`Novo jogo em ${fmtDate(date)} às ${time}.`)); log(`criou um jogo em ${fmtDate(date)} às ${time}`); saveState(); route='games'; app(); toast('Jogo criado com sucesso.');
}); }

function bindGames(){
  document.querySelectorAll('[data-join]').forEach(b=>b.onclick=()=>{ const g=state.games.find(x=>x.id===b.dataset.join); const u=currentUser(); if(g.participantIds.length>=g.limit){toast('O jogo atingiu o limite de participantes.','error');return;} if(!g.participantIds.includes(u.id))g.participantIds.push(u.id); notify(u.id,`Inscrição confirmada para ${fmtDate(g.date)} às ${g.time}.`); saveState(); app();toast('Você entrou no jogo.'); });
  document.querySelectorAll('[data-leave]').forEach(b=>b.onclick=()=>{ const g=state.games.find(x=>x.id===b.dataset.leave); const mins=(fmtDateTime(g.date,g.time)-new Date())/60000; if(mins<=15){toast('Não é possível sair faltando 15 minutos ou menos.','error');return;} g.participantIds=g.participantIds.filter(id=>id!==currentUser().id); saveState();app();toast('Participação cancelada.'); });
  document.querySelectorAll('[data-cancel]').forEach(b=>b.onclick=()=>{ if(!confirm('Tem certeza que deseja cancelar este jogo?'))return; const g=state.games.find(x=>x.id===b.dataset.cancel); g.status='cancelado'; g.participantIds.forEach(id=>notify(id,`O jogo de ${fmtDate(g.date)} às ${g.time} foi cancelado.`)); log(`cancelou o jogo de ${fmtDate(g.date)} às ${g.time}`); saveState();app();toast('Jogo cancelado.'); });
  document.querySelectorAll('[data-score]').forEach(b=>b.onclick=()=>openScoreModal(b.dataset.score));
}

function bindTeams(){
  document.getElementById('teamSearch').oninput=e=>{ const q=e.target.value.toLowerCase(); document.getElementById('teamGrid').innerHTML=teamCards(state.teams.filter(t=>t.name.toLowerCase().includes(q)),currentUser()); bindTeams(); };
  document.getElementById('newTeamBtn').onclick=openNewTeamModal;
  document.querySelectorAll('[data-delteam]').forEach(b=>b.onclick=()=>{if(!confirm('Tem certeza que deseja excluir esta equipe?'))return; state.teams=state.teams.filter(t=>t.id!==b.dataset.delteam); log('excluiu uma equipe');saveState();app();toast('Equipe excluída.');});
  document.querySelectorAll('[data-teamdetail]').forEach(b=>b.onclick=()=>openTeamModal(b.dataset.teamdetail));
}

function bindTournaments(){ document.getElementById('newTournamentBtn')?.addEventListener('click',openTournamentModal); }
function bindNotifications(){ document.getElementById('markAll').onclick=()=>{state.notifications.filter(n=>n.userId===currentUser().id).forEach(n=>n.read=true);saveState();app();}; document.querySelectorAll('[data-read]').forEach(b=>b.onclick=()=>{state.notifications.find(n=>n.id===b.dataset.read).read=true;saveState();app();}); }
function bindProfile(){ document.getElementById('profileForm').onsubmit=e=>{e.preventDefault(); const u=currentUser(); if(inappropriateName(pName.value)){toast('Nome bloqueado pelo filtro de conteúdo.','error');return;}u.name=pName.value.trim();u.turma=pTurma.value.trim();u.photo=pPhoto.value.trim();saveState();app();toast('Perfil atualizado.');}; }
function bindUsers(){ document.querySelectorAll('[data-suspend]').forEach(b=>b.onclick=()=>{const u=state.users.find(x=>x.id===b.dataset.suspend);u.suspended=!u.suspended;log(`${u.suspended?'suspendeu':'reativou'} ${u.name}`);saveState();app();}); }

function openGameModal(id){ const g=state.games.find(x=>x.id===id); const participants=g.participantIds.map(userName); modal(`<h2>${escapeHTML(teamName(g.team1))} × ${escapeHTML(teamName(g.team2))}</h2><div class="grid-equal"><div><p><strong>Data:</strong> ${fmtDate(g.date)}</p><p><strong>Horário:</strong> ${g.time}</p><p><strong>Local:</strong> ${escapeHTML(g.court)}</p><p><strong>Status:</strong> ${escapeHTML(g.status)}</p></div><div><p><strong>Participantes (${participants.length}/${g.limit}):</strong></p><p class="muted">${participants.length?participants.map(escapeHTML).join(', '):'Nenhum inscrito ainda.'}</p></div></div><p><strong>Descrição:</strong> ${escapeHTML(g.description||'—')}</p><p><strong>Observações:</strong> ${escapeHTML(g.notes||'—')}</p>${g.sets.length?`<h3>Sets</h3>${g.sets.map((s,i)=>`<div class="list-item"><strong>Set ${i+1}</strong><span>${s.a} × ${s.b}</span></div>`).join('')}`:''}`); }

function openScoreModal(id){ const g=state.games.find(x=>x.id===id); modal(`<h2>Registrar placar</h2><p class="muted">${escapeHTML(teamName(g.team1))} × ${escapeHTML(teamName(g.team2))}</p><form id="scoreForm"><div class="form-grid">${[1,2,3].map(i=>`<div class="form-field"><label>Set ${i} — ${escapeHTML(teamName(g.team1))}</label><input id="a${i}" type="number" min="0" value="${g.sets[i-1]?.a??''}"></div><div class="form-field"><label>Set ${i} — ${escapeHTML(teamName(g.team2))}</label><input id="b${i}" type="number" min="0" value="${g.sets[i-1]?.b??''}"></div>`).join('')}</div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-close>Cancelar</button><button class="btn btn-primary">Salvar resultado</button></div></form>`); document.getElementById('scoreForm').onsubmit=e=>{e.preventDefault(); const sets=[]; for(let i=1;i<=3;i++){const a=document.getElementById(`a${i}`).value,b=document.getElementById(`b${i}`).value;if(a!==''&&b!=='')sets.push({a:Number(a),b:Number(b)});} if(!sets.length){toast('Informe pelo menos um set.','error');return;} g.sets=sets; g.status='finalizado'; const wa=sets.filter(s=>s.a>s.b).length, wb=sets.filter(s=>s.b>s.a).length; const ta=state.teams.find(t=>t.id===g.team1), tb=state.teams.find(t=>t.id===g.team2); if(ta&&tb&&wa!==wb){if(wa>wb){ta.wins++;tb.losses++;}else{tb.wins++;ta.losses++;}ta.pointsFor+=sets.reduce((n,s)=>n+s.a,0);ta.pointsAgainst+=sets.reduce((n,s)=>n+s.b,0);tb.pointsFor+=sets.reduce((n,s)=>n+s.b,0);tb.pointsAgainst+=sets.reduce((n,s)=>n+s.a,0);} log(`registrou o placar de ${teamName(g.team1)} x ${teamName(g.team2)}`); saveState();closeModal();app();toast('Placar salvo e estatísticas atualizadas.');}; }

function openNewTeamModal(){
  const u=currentUser(); if(u.role==='aluno' && state.teams.some(t=>t.creatorId===u.id)){toast('Cada aluno pode criar no máximo uma equipe.','error');return;}
  const teachers=state.users.filter(x=>x.role==='professor'); modal(`<h2>Criar equipe</h2><form id="teamForm"><div class="form-field"><label>Nome da equipe</label><input id="teamNameInput" required></div><div class="form-field"><label>Professor responsável</label><select id="teamTeacher" required><option value="">Selecione</option>${teachers.map(t=>`<option value="${t.id}">${escapeHTML(t.name)}</option>`).join('')}</select></div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-close>Cancelar</button><button class="btn btn-primary">Criar equipe</button></div></form>`); document.getElementById('teamForm').onsubmit=e=>{e.preventDefault(); const name=teamNameInput.value.trim(); if(inappropriateName(name)){toast('Nome de equipe bloqueado pelo filtro de conteúdo.','error');return;} const t={id:uid('t'),name,status:u.role==='aluno'?'aguardando aprovação':'ativa',creatorId:u.id,teacherIds:[teamTeacher.value],memberIds:[u.id],reserveIds:[],wins:0,losses:0,pointsFor:0,pointsAgainst:0}; state.teams.push(t); notify(teamTeacher.value,`Nova equipe ${name} criada e vinculada a você.`); log(`criou a equipe ${name}`); saveState();closeModal();app();toast(u.role==='aluno'?'Equipe criada e aguardando aprovação.':'Equipe criada.');};
}

function openTeamModal(id){ const t=state.teams.find(x=>x.id===id); const members=t.memberIds.map(userName), reserves=t.reserveIds.map(userName); modal(`<h2>${escapeHTML(t.name)}</h2><p><span class="status ${t.status==='ativa'?'green':'yellow'}">${escapeHTML(t.status)}</span></p><p><strong>Professor(es):</strong> ${t.teacherIds.map(userName).map(escapeHTML).join(', ')}</p><p><strong>Integrantes:</strong> ${members.map(escapeHTML).join(', ')||'Nenhum'}</p><p><strong>Reservas:</strong> ${reserves.map(escapeHTML).join(', ')||'Nenhum'}</p><div class="cards" style="grid-template-columns:repeat(3,1fr)">${metric('Vitórias',t.wins,'time')}${metric('Derrotas',t.losses,'time')}${metric('Pontos',t.pointsFor,'feitos')}</div>`); }

function openTournamentModal(){ const dates=eligibleTournamentDates(); modal(`<h2>Criar campeonato</h2><form id="tournamentForm"><div class="form-field"><label>Nome</label><input id="tourName" value="Campeonato SENAI Sports" required></div><div class="form-field"><label>Dia com 3+ equipes</label><select id="tourDate">${dates.map(x=>`<option value="${x.date}">${fmtDate(x.date)} — ${x.teams.length} equipes</option>`).join('')}</select></div><div class="modal-footer"><button type="button" class="btn btn-secondary" data-close>Cancelar</button><button class="btn btn-primary">Sortear e criar</button></div></form>`); document.getElementById('tournamentForm').onsubmit=e=>{e.preventDefault(); const d=dates.find(x=>x.date===tourDate.value); const shuffled=[...d.teams].sort(()=>Math.random()-.5); const rounds=[]; let current=[]; for(let i=0;i<shuffled.length;i+=2){current.push({a:shuffled[i],b:shuffled[i+1]||'',scoreA:null,scoreB:null,winner:shuffled[i+1]?'':shuffled[i]});} rounds.push(current); let count=current.length; while(count>1){count=Math.ceil(count/2); rounds.push(Array.from({length:count},()=>({a:'',b:'',scoreA:null,scoreB:null,winner:''})));} state.tournaments.push({id:uid('tr'),name:tourName.value.trim(),date:d.date,teamIds:d.teams,status:'aguardando início',rounds}); d.teams.forEach(tid=>{const t=state.teams.find(x=>x.id===tid); t.memberIds.forEach(uid=>notify(uid,`Campeonato criado para ${fmtDate(d.date)}.`));}); log(`criou o campeonato ${tourName.value.trim()}`);saveState();closeModal();app();toast('Campeonato criado com confrontos sorteados.');}; }

function modal(content){ const el=document.createElement('div'); el.className='modal-backdrop'; el.id='modalBackdrop'; el.innerHTML=`<div class="modal">${content}</div>`; document.body.appendChild(el); el.onclick=e=>{if(e.target===el)closeModal();}; el.querySelectorAll('[data-close]').forEach(b=>b.onclick=closeModal); }
function closeModal(){ document.getElementById('modalBackdrop')?.remove(); }

app();
