import { type FormEvent } from 'react';
import { useApp } from '../contexts/AppContext';
import { Button, Field, Logo, PasswordField } from '../components/ui';
import { field } from '../utils/validation';

export function AuthPage({ onBack }: { onBack: () => void }) {
  const { login } = useApp();
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    login(field(data, 'email'), String(data.get('password') ?? ''));
  }
  return <div className="auth-shell">
    <section className="auth-brand"><Logo /><div><h1>SENAI<br />Quadra</h1><p>Acompanhe os jogos. Participe com acesso autorizado.</p></div><div className="auth-court" /></section>
    <section className="auth-card-wrap"><div className="auth-card"><Logo /><h2>Entrar</h2><p className="helper">Acesso para representantes vinculados a uma equipe, professores e administradores autorizados. Não há cadastro público.</p>
      <form onSubmit={submit}><Field name="email" label="E-mail" type="email" required autoComplete="username" placeholder="seuemail@exemplo.com" /><PasswordField /><Button type="submit" className="btn-block">Entrar</Button></form>
      <div className="auth-links"><button className="link-btn" onClick={onBack}>Voltar para consulta pública</button></div>
    </div></section>
  </div>;
}


