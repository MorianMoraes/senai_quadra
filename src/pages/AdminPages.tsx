import { useApp } from '../contexts/AppContext';
import { Card, Empty, Status } from '../components/ui';
import { audit, requireActor } from '../services/auth';
import { roleLabel, userName } from '../utils/format';

export function UsersPage() {
  const { state, user, act } = useApp();
  if (user?.role !== 'director') return <Empty>Acesso negado.</Empty>;
  function toggle(id: string) {
    act((draft, actor) => {
      if (requireActor(draft, actor).role !== 'director') throw new Error('Acesso negado.');
      const target = draft.users.find(item => item.id === id);
      if (!target || target.role === 'director') throw new Error('Conta indisponível para esta ação.');
      target.suspended = !target.suspended; audit(draft, actor, `${target.suspended ? 'suspendeu' : 'reativou'} ${target.name}`);
    }, 'Situação da conta atualizada.');
  }
  return <Card><div className="section-title"><h2>Gestão de usuários</h2><Status>Diretor</Status></div><div className="table-wrap"><table><thead><tr><th>Nome</th><th>Perfil</th><th>Turma</th><th>Matrícula</th><th>Status</th><th>Ação</th></tr></thead><tbody>{state.users.map(account => <tr key={account.id}><td>{account.name}<br /><small className="muted">{account.email}</small></td><td>{roleLabel(account.role)}</td><td>{account.turma}</td><td>{account.matricula}</td><td><Status color={account.suspended ? 'red' : 'green'}>{account.suspended ? 'Suspenso' : 'Ativo'}</Status></td><td>{account.role !== 'director' ? <button className="link-btn" onClick={() => toggle(account.id)}>{account.suspended ? 'Reativar' : 'Suspender'}</button> : '—'}</td></tr>)}</tbody></table></div></Card>;
}
export function LogsPage() {
  const { state, user } = useApp(); if (user?.role !== 'director') return <Empty>Acesso negado.</Empty>;
  return <Card><h3>Logs do sistema</h3><div className="table-wrap"><table><thead><tr><th>Data/hora</th><th>Usuário</th><th>Ação</th></tr></thead><tbody>{state.logs.map(log => <tr key={log.id}><td>{new Date(log.createdAt).toLocaleString('pt-BR')}</td><td>{userName(state, log.actorId)}</td><td>{log.action}</td></tr>)}</tbody></table></div></Card>;
}
