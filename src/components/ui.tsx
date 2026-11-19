import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type CSSProperties, type InputHTMLAttributes, type ReactNode } from 'react';
import type { User } from '../types/models';
import { safePhoto } from '../utils/format';
import { useApp } from '../contexts/AppContext';

export function Button({ variant = 'primary', className = '', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'success' }) {
  return <button type={type} className={`btn btn-${variant} ${className}`} {...props} />;
}
export function Card({ children, className = '', style }: { children: ReactNode; className?: string; style?: CSSProperties }) { return <section className={`card ${className}`} style={style}>{children}</section>; }
export function Logo() { return <div className="logo"><div className="logo-mark">S</div><span>SENAI Sports</span></div>; }
export function Avatar({ user }: { user: User }) {
  const photo = safePhoto(user.photo);
  return <div className="avatar">{photo ? <img src={photo} alt={`Foto de ${user.name}`} /> : user.name.split(' ').map(part => part[0]).join('').slice(0, 2).toUpperCase()}</div>;
}
export function Metric({ label, value, sub = 'total' }: { label: string; value: number; sub?: string }) {
  return <Card><div className="metric">{value}</div><div className="metric-label">{label} • {sub}</div></Card>;
}
export function Status({ children, color = 'blue' }: { children: ReactNode; color?: 'blue' | 'green' | 'red' | 'yellow' }) { return <span className={`status ${color}`}>{children}</span>; }
export function Empty({ children }: { children: ReactNode }) { return <div className="empty-state">{children}</div>; }
export function Field({ label, full = false, id, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; full?: boolean }) {
  const generatedId = useId(), inputId = id ?? generatedId;
  return <div className={`form-field ${full ? 'full' : ''}`}><label htmlFor={inputId}>{label}</label><input id={inputId} {...props} /></div>;
}
export function SelectField({ label, name, children, defaultValue = '', required = false }: { label: string; name: string; children: ReactNode; defaultValue?: string; required?: boolean }) {
  const id = useId();
  return <div className="form-field"><label htmlFor={id}>{label}</label><select id={id} name={name} defaultValue={defaultValue} required={required}>{children}</select></div>;
}
export function PasswordField({ label = 'Senha', name = 'password', onValue, showRequirements = false }: { label?: string; name?: string; onValue?: (value: string) => void; showRequirements?: boolean }) {
  const id = useId(), [visible, setVisible] = useState(false), [value, setValue] = useState('');
  const rules = [{ label: 'Pelo menos 8 caracteres', ok: value.length >= 8 }, { label: 'Uma letra maiúscula', ok: /[A-Z]/.test(value) }, { label: 'Uma letra minúscula', ok: /[a-z]/.test(value) }, { label: 'Um número', ok: /\d/.test(value) }, { label: 'Um caractere especial', ok: /[^A-Za-z0-9]/.test(value) }];
  const score = rules.filter(rule => rule.ok).length, level = score === 5 ? 3 : score >= 3 ? 2 : score ? 1 : 0;
  const strength = level === 3 ? 'Forte' : level === 2 ? 'Média' : 'Fraca';
  return <div className="form-field"><label htmlFor={id}>{label}</label><div className="password-input"><input id={id} name={name} type={visible ? 'text' : 'password'} autoComplete={name === 'confirm' ? 'new-password' : showRequirements ? 'new-password' : 'current-password'} required onChange={event => { setValue(event.target.value); onValue?.(event.target.value); }} /></div>{showRequirements && <div className="password-guidance" aria-live="polite"><div className="password-strength"><span>Força da senha</span><strong data-level={level}>{value ? strength : 'Digite uma senha'}</strong></div><div className="password-meter" data-level={level} aria-label={`Força da senha: ${value ? strength : 'não informada'}`}><span /><span /><span /></div><ul className="password-rules">{rules.map(rule => <li key={rule.label} className={rule.ok ? 'met' : ''}><span aria-hidden="true">{rule.ok ? '✓' : '○'}</span>{rule.label}</li>)}</ul></div>}<button type="button" className="link-btn password-visibility" aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`} onClick={() => setVisible(!visible)}>{visible ? 'Ocultar' : 'Mostrar'}</button></div>;
}
export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null), titleId = useId();
  useEffect(() => { const node = dialog.current; node?.showModal(); return () => node?.close(); }, []);
  return <dialog ref={dialog} className="modal" aria-labelledby={titleId} onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) { const bounds = event.currentTarget.getBoundingClientRect(); if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) onClose(); } }}><div className="section-title"><h2 id={titleId}>{title}</h2><Button variant="secondary" aria-label="Fechar janela" onClick={onClose}>×</Button></div>{children}</dialog>;
}
export function Toast() {
  const { message, dismiss } = useApp();
  useEffect(() => { if (!message) return; const timer = setTimeout(dismiss, 6000); return () => clearTimeout(timer); }, [message, dismiss]);
  return message ? <div className="toast-wrap"><div className={`toast ${message.error ? 'error' : 'success'}`} role={message.error ? 'alert' : 'status'}>{message.text}<button className="link-btn toast-close" aria-label="Fechar mensagem" onClick={dismiss}>×</button></div></div> : null;
}
