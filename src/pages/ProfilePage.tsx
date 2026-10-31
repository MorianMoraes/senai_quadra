import type { FormEvent } from 'react';
import { useApp } from '../contexts/AppContext';
import { Avatar, Button, Card, Field, Metric } from '../components/ui';
import { field, requireName } from '../utils/validation';
import { roleLabel, safePhoto } from '../utils/format';
import { requireActor } from '../services/auth';

export function ProfilePage() {
  const { state, user, act } = useApp(); if (!user) return null;
  const stats = state.stats.find(item => item.userId === user.id);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    act((draft, actor) => { const profile = requireActor(draft, actor); profile.name = requireName(field(data, 'name')); profile.turma = field(data, 'turma'); profile.photo = safePhoto(field(data, 'photo')); }, 'Perfil atualizado.');
  }
  return <div className="profile-grid"><Card className="profile-card"><Avatar user={user} /><h2>{user.name}</h2><div className="muted">{roleLabel(user.role)} • {user.turma}</div></Card><Card><h3>Dados da conta</h3><form onSubmit={submit}><div className="form-grid"><Field full label="Nome completo" name="name" defaultValue={user.name} required /><Field label="E-mail" value={user.email} disabled /><Field label="Matrícula" value={user.matricula} disabled /><Field label="Turma" name="turma" defaultValue={user.turma} required /><Field label="Foto (URL)" name="photo" type="url" defaultValue={user.photo} /></div><Button type="submit">Salvar perfil</Button></form><hr className="section-divider" /><h3>Estatísticas</h3><div className="cards compact-metrics"><Metric label="Pontos" value={stats?.points ?? 0} /><Metric label="Aces" value={stats?.aces ?? 0} /><Metric label="Bloqueios" value={stats?.blocks ?? 0} /></div></Card></div>;
}
