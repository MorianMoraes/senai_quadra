import { describe, expect, it } from 'vitest';
import { authenticate } from './auth';
import { seed } from '../demo/seed';

describe('representative account approval', () => {
  it('blocks a pending account from signing in', () => {
    const state = structuredClone(seed);
    state.users.push({ id: 'pending', role: 'student', name: 'Novo representante', email: 'pending@example.test', password: 'Password@123', turma: 'Equipe', idade: 0, matricula: '', photo: '', suspended: false, approvalStatus: 'pending' });
    expect(() => authenticate(state, 'pending@example.test', 'Password@123')).toThrow(/aguarda aprovação/);
  });

  it('blocks a rejected request and allows an approved teacher', () => {
    const state = structuredClone(seed);
    state.users.push({ id: 'rejected', role: 'student', name: 'Conta recusada', email: 'rejected@example.test', password: 'Password@123', turma: 'Equipe', idade: 0, matricula: '', photo: '', suspended: false, approvalStatus: 'rejected' });
    expect(() => authenticate(state, 'rejected@example.test', 'Password@123')).toThrow(/foi recusada/);
    expect(authenticate(state, 'professor@senai.local', 'Professor@123').role).toBe('teacher');
  });
});
