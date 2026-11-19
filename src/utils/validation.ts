export function inappropriateName(value: string): boolean {
  const words = value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/4/g, 'a').replace(/3/g, 'e').replace(/[1!]/g, 'i').replace(/0/g, 'o')
    .replace(/[5$]/g, 's').replace(/7/g, 't').split(/[^a-z]+/).filter(Boolean);
  const compact = words.join('');
  const banned = ['porra', 'caralho', 'merda', 'puta', 'puto', 'viado', 'buceta', 'nazista', 'racista', 'bosta', 'foda', 'fodase', 'arrombado', 'vagabundo', 'vagabunda', 'retardado', 'retardada'];
  return banned.some(word => compact.includes(word)) || words.some(word => ['cu', 'pnc'].includes(word));
}
export function passwordScore(password: string) {
  const rules = [password.length >= 8, /[A-Z]/.test(password), /[a-z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)];
  const count = rules.filter(Boolean).length;
  return { valid: count === 5, level: count <= 2 ? 1 : count < 5 ? 2 : 3 };
}
export function requireName(value: string): string {
  const name = value.trim();
  if (!name || inappropriateName(name)) throw new Error('Informe um nome válido, sem conteúdo inadequado.');
  return name;
}
export const field = (data: FormData, name: string): string => String(data.get(name) ?? '').trim();
