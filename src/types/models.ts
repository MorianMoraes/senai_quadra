import { z } from 'zod';

export type UserRole = 'student' | 'teacher' | 'director' | 'sesi';
export const roleSchema = z.enum(['student', 'teacher', 'director', 'sesi']);
export const userSchema = z.object({
  id: z.string(), role: roleSchema, name: z.string(), email: z.string(),
  password: z.string(), turma: z.string(), idade: z.number(), matricula: z.string(),
  photo: z.string().default(''), suspended: z.boolean().default(false), approvalStatus: z.enum(['approved','pending','rejected']).optional(),
});
export const accountRequestSchema = z.object({ id: z.string(), userId: z.string(), name: z.string(), teamName: z.string(), email: z.string(), status: z.enum(['pending','approved','rejected']), createdAt: z.string(), reviewedAt: z.string().default(''), reviewedBy: z.string().default('') });
export const sportSchema = z.enum(['futebol', 'futebol-society', 'volei', 'futsal', 'handebol', 'queimada', 'basquete', 'xadrez', 'dama', 'ludo', 'pingue-pongue', 'tenis-de-mesa', 'outra-quadra', 'outro-tabuleiro', 'padel', 'volei-de-praia', 'beach-tennis', 'futevolei', 'futebol-de-areia', 'domino', 'general', 'truco', 'canastra']);
export const teamSchema = z.object({
  id: z.string(), name: z.string(), logoUrl: z.string().optional(), sport: sportSchema.default('volei'), status: z.string(), creatorId: z.string(),
  teacherIds: z.array(z.string()), memberIds: z.array(z.string()), reserveIds: z.array(z.string()),
  wins: z.number(), losses: z.number(), draws: z.number().optional(), pointsFor: z.number(), pointsAgainst: z.number(),
});
export const setSchema = z.object({ a: z.number(), b: z.number() });
export const gameSchema = z.object({
  id: z.string(), tournamentId: z.string().default(''), sport: sportSchema.default('volei'), date: z.string(), time: z.string(), duration: z.number().default(0), unit: z.string().optional(), court: z.string(), calendar: z.string().optional(),
  reportUrl: z.string().default(''), reportName: z.string().default(''),
  team1: z.string(), team2: z.string(), limit: z.number(), description: z.string(), notes: z.string(),
  status: z.enum(['inscricoes', 'agendado', 'finalizado', 'cancelado']),
  participantIds: z.array(z.string()), sets: z.array(setSchema), createdBy: z.string(),
});
export const matchSchema = z.object({
  a: z.string(), b: z.string(), scoreA: z.number().nullable(), scoreB: z.number().nullable(), winner: z.string(),
});
export const tournamentSchema = z.object({
  id: z.string(), name: z.string(), date: z.string(), createdBy: z.string().default(''), sport: sportSchema.default('volei'), gender: z.enum(['Masculino', 'Feminino', 'Misto']).default('Misto'), tieBreak: z.enum(['saldo','gols']).default('saldo'), teamLimit: z.number().nullable().default(null), startDate: z.string().default(''), endDate: z.string().default(''), banner: z.string().default(''), pdfUrl: z.string().default(''), pdfName: z.string().default(''), regulationUrl: z.string().default(''), regulationName: z.string().default(''), edition: z.string().default(''),
  teamIds: z.array(z.string()), status: z.string(), rounds: z.array(z.array(matchSchema)).default([]),
  registrations: z.array(z.object({
    teamId: z.string(), leaderId: z.string(), memberIds: z.array(z.string()), createdAt: z.string(),
  })).default([]),
});
export const standingSchema = z.object({ id: z.string(), tournamentId: z.string(), teamId: z.string(), points: z.number().default(0), played: z.number().default(0), wins: z.number().default(0), goalsFor: z.number().default(0), goalsAgainst: z.number().default(0), cards: z.number().default(0) });
export const cardRecordSchema = z.object({ id: z.string(), tournamentId: z.string(), teamId: z.string(), playerId: z.string(), playerName: z.string().default(''), type: z.enum(['Amarelo', 'Vermelho']), date: z.string() });
export const scorerSchema = z.object({ id: z.string(), tournamentId: z.string(), teamId: z.string(), playerId: z.string(), playerName: z.string().default(''), goals: z.number().default(0) });
export const tournamentNoteSchema = z.object({ id: z.string(), tournamentId: z.string(), teamId: z.string(), authorId: z.string(), text: z.string(), createdAt: z.string(), updatedAt: z.string() });
export const playerRecordSchema = z.object({ id: z.string(), teamId: z.string(), fullName: z.string(), birthDate: z.string(), cpf: z.string(), enrollment: z.string(), createdBy: z.string() });
export const statsSchema = z.object({
  userId: z.string(), points: z.number(), serves: z.number(), aces: z.number(), blocks: z.number(),
  attacks: z.number(), errors: z.number(), wins: z.number(), losses: z.number(),
});
export const stateSchema = z.object({
  users: z.array(userSchema), teams: z.array(teamSchema), games: z.array(gameSchema),
  tournaments: z.array(tournamentSchema), stats: z.array(statsSchema),
  standings: z.array(standingSchema).default([]), cards: z.array(cardRecordSchema).default([]), scorers: z.array(scorerSchema).default([]), tournamentNotes: z.array(tournamentNoteSchema).default([]),
  players: z.array(playerRecordSchema).default([]),
  logs: z.array(z.object({ id: z.string(), actorId: z.string(), action: z.string(), createdAt: z.string() })),
  accountRequests: z.array(accountRequestSchema).default([]),
});
export type User = z.infer<typeof userSchema>;
export type AccountRequest = z.infer<typeof accountRequestSchema>;
export type Team = z.infer<typeof teamSchema>;
export type Game = z.infer<typeof gameSchema>;
export type MatchSet = z.infer<typeof setSchema>;
export type Sport = z.infer<typeof sportSchema>;
export type Tournament = z.infer<typeof tournamentSchema>;
export type Standing = z.infer<typeof standingSchema>;
export type CardRecord = z.infer<typeof cardRecordSchema>;
export type Scorer = z.infer<typeof scorerSchema>;
export type PlayerRecord = z.infer<typeof playerRecordSchema>;
export type DemoState = z.infer<typeof stateSchema>;
export type Route = 'dashboard' | 'games' | 'calendar' | 'createGame' | 'management' | 'teams' | 'players' | 'tournaments' | 'history' | 'howItWorks' | 'profile' | 'users' | 'logs' | 'statistics' | 'documents';
export type Theme = 'light' | 'dark';
