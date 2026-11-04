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
    <section className="auth-brand"><Logo /><div><h1>SENAI<br />Sports</h1></div><div className="auth-court" /></section>
    <section className="auth-card-wrap"><div className="auth-card"><Logo /><h2>{creating ? 'Criar conta de jogador' : 'Entrar'}</h2><p className="helper">{creating ? 'O cadastro cria uma conta de jogador. Acesso de representante é concedido por um administrador.' : 'Acesso para jogadores e representantes autorizados.'}</p>
      <form onSubmit={submit}>{creating && <><Field name="name" label="Nome completo" autoComplete="name" required maxLength={120} /><Field name="turma" label="Turma" required maxLength={80} /></>}<Field name="email" label="E-mail" type="email" required autoComplete="username" placeholder="seuemail@exemplo.com" /><PasswordField />{creating && <PasswordField name="confirm" label="Confirmar senha" />}<Button type="submit" className="btn-block" disabled={busy}>{busy ? 'Aguarde…' : creating ? 'Criar conta' : 'Entrar'}</Button></form>
      <div className="auth-links"><button className="link-btn" onClick={() => setCreating(value => !value)}>{creating ? 'Já tenho uma conta' : 'Criar conta de jogador'}</button><button className="link-btn" onClick={onBack}>Voltar para consulta pública</button></div>
    </div></section>
  </div>;
}
