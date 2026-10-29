import { useState, type FormEvent } from 'react';
import { useApp } from '../contexts/AppContext';
import { Button, Field, Logo, PasswordField } from '../components/ui';
import { field, passwordScore } from '../utils/validation';

export function AuthPage() {
  const { login, register, notify } = useApp();
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login'), [password, setPassword] = useState('');
  const strength = passwordScore(password);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    if (mode === 'login') login(field(data, 'email'), String(data.get('password') ?? ''));
    else if (mode === 'register') register({ name: field(data, 'name'), email: field(data, 'email'), password: String(data.get('password') ?? ''), confirm: String(data.get('confirm') ?? ''), turma: field(data, 'turma'), idade: Number(field(data, 'idade')), matricula: field(data, 'matricula'), photo: field(data, 'photo') });
    else { notify('Esta demonstração não envia e-mails. A recuperação real será conectada ao Supabase na etapa de autenticação.'); setMode('login'); }
  }
  return <div className="auth-shell"><section className="auth-brand"><Logo /><div><h1>Vôlei.<br />Agenda.<br />Equipe.</h1><p>Organize jogos, monte times, acompanhe campeonatos e veja o desempenho dos alunos em um só lugar.</p></div><div className="auth-court" /></section><section className="auth-card-wrap"><div className="auth-card"><Logo /><h2>{mode === 'login' ? 'Entrar' : mode === 'register' ? 'Criar conta' : 'Redefinir senha'}</h2><p className="helper">{mode === 'register' ? 'Cadastro exclusivo para alunos.' : mode === 'forgot' ? 'Recuperação de senha simulada nesta demonstração.' : 'Acesse sua conta para continuar.'}</p>
    <form key={mode} onSubmit={submit}><div className={mode === 'register' ? 'form-grid' : ''}>
      {mode === 'register' && <Field name="name" label="Nome completo" required full autoComplete="name" />}
      <Field name="email" label="E-mail" type="email" required autoComplete="email" placeholder="seuemail@exemplo.com" />
      {mode === 'register' && <><Field label="Perfil" value="Aluno" readOnly /><Field name="turma" label="Turma" required placeholder="Ex.: 2º A" /><Field name="idade" label="Idade" type="number" min={1} max={100} required /><Field name="matricula" label="Matrícula" required /><Field name="photo" label="Foto (URL opcional)" type="url" placeholder="https://..." /></>}
      {mode !== 'forgot' && <div className={mode === 'register' ? 'form-field full' : ''}><PasswordField onValue={setPassword} />{mode === 'register' && <><div className="password-meter" data-level={strength.level}><span /><span /><span /></div><div className="password-rules" aria-live="polite">{strength.level === 1 ? 'Fraca' : strength.level === 2 ? 'Média' : 'Forte'} — mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número e 1 caractere especial.</div></>}</div>}
      {mode === 'register' && <div className="form-field full"><PasswordField name="confirm" label="Confirmar senha" /></div>}
    </div><Button type="submit" className="btn-block">{mode === 'login' ? 'Entrar' : mode === 'register' ? 'Cadastrar' : 'Simular redefinição'}</Button></form>
    <div className="auth-links">{mode === 'login' ? <><button className="link-btn" onClick={() => setMode('forgot')}>Esqueci minha senha</button><button className="link-btn" onClick={() => setMode('register')}>Criar conta</button></> : <button className="link-btn" onClick={() => setMode('login')}>Voltar para login</button>}</div>
  </div></section></div>;
}
