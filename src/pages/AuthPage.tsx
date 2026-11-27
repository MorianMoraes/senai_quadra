import { useState, type FormEvent } from 'react';
import { useApp } from '../contexts/AppContext';
import { Button, Field, Logo, PasswordField } from '../components/ui';
import { field } from '../utils/validation';

export function AuthPage({ onBack }: { onBack: () => void }) {
  const { login, signUp } = useApp();
  const [busy, setBusy] = useState(false), [creating, setCreating] = useState(false);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    setBusy(true);
    try {
      if (creating) {
        const created = await signUp(field(data, 'name'), field(data, 'email'), field(data, 'turma'), String(data.get('password') ?? ''), String(data.get('confirm') ?? ''));
        if (created) setCreating(false);
      } else await login(field(data, 'email'), String(data.get('password') ?? ''));
    } finally { setBusy(false); }
  }
  return <div className="auth-shell">
    <section className="auth-brand"><Logo /><div><h1>Jogos do<br />SESI + Saúde</h1></div><div className="auth-court" /></section>
    <section className="auth-card-wrap"><div className="auth-card"><Logo /><h2>{creating ? 'Solicitar acesso de representante' : 'Entrar'}</h2>
      <form key={creating ? 'signup' : 'login'} onSubmit={submit}>{creating && <><Field name="name" label="Nome completo do responsável" autoComplete="name" required maxLength={120} /><Field name="turma" label="Equipe / empresa" required maxLength={80} /></>}<Field name="email" label="E-mail" type="email" required autoComplete="username" placeholder="seuemail@exemplo.com" /><PasswordField showRequirements={creating} />{creating && <PasswordField name="confirm" label="Confirmar senha" />}<Button type="submit" className="btn-block" disabled={busy}>{busy ? 'Aguarde…' : creating ? 'Enviar solicitação' : 'Entrar'}</Button></form>
      {creating && <p className="helper signup-approval-note">Após enviar o pedido, aguarde a análise do diretor. Se o sistema solicitar, confirme também seu e-mail. O acesso de representante só será liberado após aprovação.</p>}
      <footer className="site-footer">Jogos do SESI + Saúde · © {new Date().getFullYear()} · Todos os direitos reservados</footer><div className="auth-links"><button className="link-btn" onClick={() => setCreating(value => !value)}>{creating ? 'Já tenho uma conta' : 'Solicitar acesso de representante'}</button><button className="link-btn" onClick={onBack}>Voltar para consulta pública</button></div>
    </div></section>
  </div>;
}
