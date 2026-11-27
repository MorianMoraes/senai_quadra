import { useApp } from '../contexts/AppContext';
import { Button, Card, Empty, Status } from '../components/ui';
import { audit, requireActor } from '../services/auth';
import { roleLabel, userName } from '../utils/format';

export function UsersPage() {
  const { state, user, actAsync, migrateLocalData, remote, reviewTeacherRequest } = useApp();
  if (user?.role !== 'sesi' && user?.role !== 'director') return <Empty>Acesso negado.</Empty>;
  const requests = state.accountRequests;
  function toggle(id: string) {
    void actAsync((draft, actor) => {
      if (!['sesi', 'director'].includes(requireActor(draft, actor).role)) throw new Error('Acesso negado.');
      const target = draft.users.find(item => item.id === id);
      if (!target || target.role === 'director') throw new Error('Conta indisponível para esta ação.');
      target.suspended = !target.suspended; audit(draft, actor, `${target.suspended ? 'suspendeu' : 'reativou'} ${target.name || target.email}`);
    }, 'Situação da conta atualizada.');
  }
  return <div className="admin-users-page">{user.role === 'director' && <Card><div className="section-title"><div><p className="eyebrow">ACESSO DE REPRESENTANTE</p><h2>Solicitações de Cadastro</h2></div><Status>{requests.filter(item => item.status === 'pending').length} pendentes</Status></div>{requests.length ? <div className="table-wrap mobile-cards"><table><thead><tr><th>Responsável</th><th>Equipe / empresa</th><th>E-mail</th><th>Data</th><th>Status</th><th>Ação</th></tr></thead><tbody>{requests.map(request => <tr key={request.id}><td data-label="Responsável">{request.name}</td><td data-label="Equipe / empresa">{request.teamName}</td><td data-label="E-mail">{request.email}</td><td data-label="Data">{new Date(request.createdAt).toLocaleDateString('pt-BR')}</td><td data-label="Status"><Status color={request.status === 'approved' ? 'green' : request.status === 'rejected' ? 'red' : 'yellow'}>{request.status === 'approved' ? 'Aprovada' : request.status === 'rejected' ? 'Recusada' : 'Pendente'}</Status></td><td data-label="Ação">{request.status === 'pending' ? <div className="inline-actions"><Button onClick={() => void reviewTeacherRequest(request.userId, true)}>Aprovar</Button><Button variant="danger" onClick={() => void reviewTeacherRequest(request.userId, false)}>Recusar</Button></div> : request.reviewedAt ? <small className="muted">Analisada em {new Date(request.reviewedAt).toLocaleDateString('pt-BR')}</small> : '—'}</td></tr>)}</tbody></table></div> : <Empty>Nenhuma solicitação de cadastro foi recebida.</Empty>}</Card>}
    <Card><div className="section-title"><h2>Gestão de usuários</h2><Status>{user.role === 'sesi' ? 'SESI' : 'Diretor'}</Status></div>{remote && user.role === 'sesi' && <p><Button variant="secondary" onClick={() => void migrateLocalData()}>Migrar dados locais preservados</Button></p>}<div className="table-wrap mobile-cards"><table><thead><tr><th>Nome</th><th>Perfil</th><th>Turma</th><th>Matrícula</th><th>Status</th><th>Ação</th></tr></thead><tbody>{state.users.map(account => <tr key={account.id}><td data-label="Nome e e-mail">{account.name || 'Sem nome'}<br /><small className="muted">{account.email || 'Privado'}</small></td><td data-label="Perfil">{roleLabel(account.role)}</td><td data-label="Turma">{account.turma || '—'}</td><td data-label="Matrícula">{account.matricula || '—'}</td><td data-label="Status"><Status color={account.suspended || account.approvalStatus === 'rejected' ? 'red' : account.approvalStatus === 'pending' ? 'yellow' : 'green'}>{account.suspended ? 'Suspenso' : account.approvalStatus === 'pending' ? 'Aguardando aprovação' : account.approvalStatus === 'rejected' ? 'Solicitação recusada' : 'Ativo'}</Status></td><td data-label="Ação">{account.role !== 'director' ? <button className="link-btn" onClick={() => toggle(account.id)}>{account.suspended ? 'Reativar' : 'Suspender'}</button> : '—'}</td></tr>)}</tbody></table></div></Card>
  </div>;
}
export function LogsPage() {
  const { state, user } = useApp(); if (user?.role !== 'sesi') return <Empty>Acesso negado.</Empty>;
  return <Card><h3>Logs do sistema</h3><div className="table-wrap mobile-cards"><table><thead><tr><th>Data/hora</th><th>Usuário</th><th>Ação</th></tr></thead><tbody>{state.logs.map(log => <tr key={log.id}><td data-label="Data e hora">{new Date(log.createdAt).toLocaleString('pt-BR')}</td><td data-label="Usuário">{userName(state, log.actorId)}</td><td data-label="Ação">{log.action}</td></tr>)}</tbody></table></div></Card>;
}
