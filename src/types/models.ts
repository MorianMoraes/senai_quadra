import { z } from 'zod';

export type UserRole = 'student' | 'teacher' | 'director';
export const roleSchema = z.enum(['student', 'teacher', 'director']);
export const userSchema = z.object({
  id: z.string(), role: roleSchema, name: z.string(), email: z.string(),
  password: z.string(), turma: z.string(), idade: z.number(), matricula: z.string(),
  photo: z.string().default(''), suspended: z.boolean().default(false),
});
export const teamSchema = z.object({
  id: z.string(), name: z.string(), status: z.string(), creatorId: z.string(),
  teacherIds: z.array(z.string()), memberIds: z.array(z.string()), reserveIds: z.array(z.string()),
  wins: z.number(), losses: z.number(), pointsFor: z.number(), pointsAgainst: z.number(),
});
export const setSchema = z.object({ a: z.number(), b: z.number() });
export const gameSchema = z.object({
  id: z.string(), date: z.string(), time: z.string(), duration: z.number(), court: z.string(),
  team1: z.string(), team2: z.string(), limit: z.number(), description: z.string(), notes: z.string(),
  status: z.enum(['inscricoes', 'agendado', 'finalizado', 'cancelado']),
  participantIds: z.array(z.string()), sets: z.array(setSchema), createdBy: z.string(),
});
export const matchSchema = z.object({
  a: z.string(), b: z.string(), scoreA: z.number().nullable(), scoreB: z.number().nullable(), winner: z.string(),
});
export const tournamentSchema = z.object({
  id: z.string(), name: z.string(), date: z.string(), createdBy: z.string().default(''),
  teamIds: z.array(z.string()), status: z.string(), rounds: z.array(z.array(matchSchema)).default([]),
  registrations: z.array(z.object({
    teamId: z.string(), leaderId: z.string(), memberIds: z.array(z.string()), createdAt: z.string(),
  })).default([]),
});
export const statsSchema = z.object({
  userId: z.string(), points: z.number(), serves: z.number(), aces: z.number(), blocks: z.number(),
  attacks: z.number(), errors: z.number(), wins: z.number(), losses: z.number(),
});
export const stateSchema = z.object({
  users: z.array(userSchema), teams: z.array(teamSchema), games: z.array(gameSchema),
  tournaments: z.array(tournamentSchema), stats: z.array(statsSchema),
  logs: z.array(z.object({ id: z.string(), actorId: z.string(), action: z.string(), createdAt: z.string() })),
});
export type User = z.infer<typeof userSchema>;
export type Team = z.infer<typeof teamSchema>;
export type Game = z.infer<typeof gameSchema>;
export type MatchSet = z.infer<typeof setSchema>;
export type Tournament = z.infer<typeof tournamentSchema>;
export type DemoState = z.infer<typeof stateSchema>;
export type Route = 'dashboard' | 'calendar' | 'createGame' | 'management' | 'teams' | 'tournaments' | 'ranking' | 'history' | 'profile' | 'users' | 'logs';
export type Theme = 'light' | 'dark';
