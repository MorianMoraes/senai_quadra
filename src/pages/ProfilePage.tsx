import { useState, type FormEvent } from 'react';
import { useApp } from '../contexts/AppContext';
import { Avatar, Button, Card, Field, Metric } from '../components/ui';
import { field, requireName } from '../utils/validation';
import { roleLabel, safePhoto } from '../utils/format';
import { requireActor } from '../services/auth';

export function ProfilePage() {
  const { state, user, actAsync } = useApp();
  const [busy, setBusy] = useState(false);
  if (!user) return null;
  const stats = state.stats.find(item => item.userId === user.id);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      await actAsync((draft, actor) => {
        const profile = requireActor(draft, actor);
        const turma = field(data, 'turma');
        const rawPhoto = field(data, 'photo');
        const photo = rawPhoto ? safePhoto(rawPhoto) : '';
        if (!turma) throw new Error('Informe sua turma.');
        if (rawPhoto && !photo) throw new Error('Informe uma URL de foto válida iniciada por http:// ou https://.');
        profile.name = requireName(field(data, 'name'));
        profile.turma = turma;
        profile.photo = photo;
      }, 'Perfil atualizado.');
    } finally { setBusy(false); }
  }
  return <div className="profile-grid"><Card className="profile-card"><Avatar user={user} /><h2>{user.name || 'Usuário'}</h2><div className="muted">{roleLabel(user.role)} • {user.turma || 'Sem turma'}</div></Card><Card><h3>Dados da conta</h3><form key={`${user.id}-${user.name}-${user.turma}-${user.photo}`} onSubmit={submit}><div className="form-grid"><Field full label="Nome completo" name="name" defaultValue={user.name} required maxLength={120} /><Field label="E-mail" value={user.email} disabled /><Field label="Matrícula" value={user.matricula} disabled /><Field label="Turma" name="turma" defaultValue={user.turma} required maxLength={80} /><Field label="Foto (URL)" name="photo" type="url" defaultValue={user.photo} placeholder="https://..." /></div><Button type="submit" disabled={busy}>{busy ? 'Salvando…' : 'Salvar perfil'}</Button></form><hr className="section-divider" /><h3>Estatísticas</h3><div className="cards compact-metrics"><Metric label="Pontos" value={stats?.points ?? 0} /><Metric label="Aces" value={stats?.aces ?? 0} /><Metric label="Bloqueios" value={stats?.blocks ?? 0} /></div></Card></div>;
}
