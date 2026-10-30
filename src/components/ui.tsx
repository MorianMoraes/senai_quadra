import { useEffect, useId, useRef, useState, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react';
import type { User } from '../types/models';
import { safePhoto } from '../utils/format';
import { useApp } from '../contexts/AppContext';

export function Button({ variant = 'primary', className = '', type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'success' }) {
  return <button type={type} className={`btn btn-${variant} ${className}`} {...props} />;
}
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) { return <section className={`card ${className}`}>{children}</section>; }
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
export function PasswordField({ label = 'Senha', name = 'password', onValue }: { label?: string; name?: string; onValue?: (value: string) => void }) {
  const id = useId(), [visible, setVisible] = useState(false);
  return <div className="form-field"><label htmlFor={id}>{label}</label><div className="password-input"><input id={id} name={name} type={visible ? 'text' : 'password'} autoComplete={name === 'confirm' ? 'new-password' : 'current-password'} required onChange={event => onValue?.(event.target.value)} /><button type="button" className="link-btn" aria-label={`${visible ? 'Ocultar' : 'Mostrar'} ${label.toLowerCase()}`} onClick={() => setVisible(!visible)}>{visible ? 'Ocultar' : 'Mostrar'}</button></div></div>;
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
