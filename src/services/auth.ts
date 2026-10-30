import type { DemoState, User } from '../types/models';
import { passwordScore, requireName } from '../utils/validation';
import { safePhoto, uid } from '../utils/format';

export interface Registration {
  name: string; email: string; password: string; confirm: string;
  turma: string; idade: number; matricula: string; photo: string;
}
export interface GoogleIdentity {
  id: string;
  email: string;
  name?: string;
  photo?: string;
}

export function registerGoogleStudent(state: DemoState, identity: GoogleIdentity): User {
  const email = identity.email.trim().toLowerCase();
  if (!identity.id || !email || !email.includes('@')) throw new Error('A conta Google não retornou um identificador e e-mail válidos.');

  const existingById = state.users.find(item => item.id === identity.id);
  const existingByEmail = state.users.find(item => item.email.toLowerCase() === email);
  if ((existingById && existingById.role !== 'student') || (existingByEmail && existingByEmail.role !== 'student')) {
    throw new Error('Este e-mail está associado a uma conta da equipe. Entre pelo acesso tradicional.');
  }
  if (existingById && existingByEmail && existingById.id !== existingByEmail.id) {
    throw new Error('Este e-mail já está vinculado a outro perfil local.');
  }

  const existing = existingById ?? existingByEmail;
  const profileName = identity.name?.trim() || email.split('@')[0] || 'Aluno SENAI';
  const user = existing ?? {
    id: identity.id,
    role: 'student' as const,
    name: requireName(profileName),
    email,
    password: '',
    turma: 'Não informada',
    idade: 0,
    matricula: `GOOGLE-${identity.id}`,
    photo: safePhoto(identity.photo ?? ''),
    suspended: false,
  };

  if (existing) {
    existing.email = email;
    if (!existing.photo && identity.photo) existing.photo = safePhoto(identity.photo);
  } else {
    state.users.push(user);
  }
  if (!state.stats.some(item => item.userId === user.id)) {
    state.stats.push({ userId: user.id, points: 0, serves: 0, aces: 0, blocks: 0, attacks: 0, errors: 0, wins: 0, losses: 0 });
  }
  return user;
}

export function authenticate(state: DemoState, email: string, password: string): User {
  const user = state.users.find(item => item.email.toLowerCase() === email.trim().toLowerCase() && item.password === password);
  if (!user) throw new Error('E-mail ou senha inválidos.');
  return user;
}
export function registerStudent(state: DemoState, input: Registration): User {
  const name = requireName(input.name), email = input.email.trim().toLowerCase();
  if (!email || !email.includes('@')) throw new Error('Informe um e-mail válido.');
  if (state.users.some(user => user.email.toLowerCase() === email)) throw new Error('Este e-mail já está cadastrado.');
  if (!passwordScore(input.password).valid) throw new Error('A senha ainda não atende a todos os requisitos.');
  if (input.password !== input.confirm) throw new Error('As senhas não coincidem.');
  if (!input.turma.trim() || !input.matricula.trim() || !Number.isInteger(input.idade) || input.idade < 1 || input.idade > 100) throw new Error('Preencha turma, idade e matrícula corretamente.');
  if (state.users.some(user => user.matricula.toLowerCase() === input.matricula.trim().toLowerCase())) throw new Error('Esta matrícula já está cadastrada.');
  // O cadastro público permanece exclusivo de alunos, independentemente dos campos enviados.
  const user: User = { id: uid('u'), role: 'student', name, email, password: input.password, turma: input.turma.trim(), idade: input.idade, matricula: input.matricula.trim(), photo: safePhoto(input.photo), suspended: false };
  state.users.push(user);
  state.stats.push({ userId: user.id, points: 0, serves: 0, aces: 0, blocks: 0, attacks: 0, errors: 0, wins: 0, losses: 0 });
  return user;
}
export function requireActor(state: DemoState, actorId: string): User {
  const user = state.users.find(item => item.id === actorId);
  if (!user || user.suspended) throw new Error('Sua conta não pode executar esta ação.');
  return user;
}
export function requireTeacher(state: DemoState, actorId: string): User {
  const user = requireActor(state, actorId);
  if (user.role !== 'teacher') throw new Error('Somente professores podem realizar esta ação.');
  return user;
}
export function audit(state: DemoState, actorId: string, action: string): void {
  state.logs.unshift({ id: uid('l'), actorId, action, createdAt: new Date().toISOString() });
}
