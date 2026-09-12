// BroFocus Backend - Data Store
// Backed by Prisma + Supabase Postgres. Kept at this file path/name so existing
// route imports (`from '../store/inMemory'`) don't need to change.
//
// IMPORTANT: every method here is now async. Every call site must be updated
// to `await store.method(...)` and its enclosing route handler marked `async`.
// Field names deliberately match the old in-memory interfaces (snake_case for
// pre-existing fields) so property access elsewhere doesn't need to change.

import { prisma } from '../lib/prisma';
import { hashToken } from '../lib/crypto';
import type {
  User as PrismaUser,
  Task as PrismaTask,
  Notification as PrismaNotification,
  FocusSession as PrismaFocusSession,
  TimeBlock as PrismaTimeBlock,
  Integration as PrismaIntegration,
  TaskStatus,
  TaskPriority,
  NotificationType,
  TimeBlockType,
  IntegrationProvider,
} from '@prisma/client';

// ─── Types (re-exported so route files keep working unchanged) ─────────────

export type { TaskStatus, TaskPriority, NotificationType, TimeBlockType, IntegrationProvider };
export type User = PrismaUser;
export type Task = PrismaTask;
export type Notification = PrismaNotification;
export type FocusSession = PrismaFocusSession;
export type TimeBlock = PrismaTimeBlock;
export type IntegrationStatus = PrismaIntegration;

const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

class PrismaStore {
  // ─── Users ────────────────────────────────────────────────────────────
  getUser(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  getUserByGoogleId(googleId: string) {
    return prisma.user.findUnique({ where: { googleId } });
  }

  getUserByEmail(email: string) {
    return prisma.user.findUnique({ where: { email } });
  }

  updateUser(id: string, data: Partial<User>) {
    return prisma.user.update({ where: { id }, data });
  }

  // Find an existing user by googleId (or by matching email, to link accounts),
  // otherwise create a brand new user from the verified Google profile.
  // New users are unwhitelisted by default UNLESS their email is listed in
  // the ADMIN_EMAILS env var (comma-separated) - that's how you bootstrap
  // your own access on a fresh invite-only deployment.
  async findOrCreateGoogleUser(profile: {
    googleId: string;
    email: string;
    name: string;
    picture?: string;
  }): Promise<User> {
    const existingByGoogle = await this.getUserByGoogleId(profile.googleId);
    if (existingByGoogle) return existingByGoogle;

    const existingByEmail = await this.getUserByEmail(profile.email);
    if (existingByEmail) {
      return prisma.user.update({
        where: { id: existingByEmail.id },
        data: {
          googleId: profile.googleId,
          authProvider: 'google',
          avatar: existingByEmail.avatar ?? profile.picture,
        },
      });
    }

    const adminEmails = (process.env.ADMIN_EMAILS || '')
      .split(',')
      .map(e => e.trim().toLowerCase())
      .filter(Boolean);
    const isAdmin = adminEmails.includes(profile.email.toLowerCase());

    return prisma.user.create({
      data: {
        email: profile.email,
        name: profile.name,
        avatar: profile.picture,
        googleId: profile.googleId,
        authProvider: 'google',
        whitelisted: isAdmin, // false unless listed in ADMIN_EMAILS
        productivity_points: 0,
        level: 1,
      },
    });
  }

  // ─── Refresh tokens ───────────────────────────────────────────────────
  // Raw token is only ever sent to the client / stored in the HTTPOnly
  // cookie. Only its SHA-256 hash is persisted here.

  async createRefreshToken(userId: string, rawToken: string) {
    return prisma.refreshToken.create({
      data: {
        user_id: userId,
        token_hash: hashToken(rawToken),
        expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });
  }

  async getValidRefreshToken(rawToken: string) {
    const token_hash = hashToken(rawToken);
    const record = await prisma.refreshToken.findUnique({
      where: { token_hash },
      include: { user: true },
    });
    if (!record || record.revoked || record.expires_at < new Date()) {
      return null;
    }
    return record;
  }

  async revokeRefreshToken(rawToken: string) {
    const token_hash = hashToken(rawToken);
    await prisma.refreshToken.updateMany({
      where: { token_hash },
      data: { revoked: true },
    });
  }

  async revokeAllUserRefreshTokens(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { user_id: userId },
      data: { revoked: true },
    });
  }

  // ─── Tasks ────────────────────────────────────────────────────────────
  getTasks(userId: string) {
    return prisma.task.findMany({ where: { user_id: userId }, orderBy: { created_at: 'desc' } });
  }

  getTask(id: string) {
    return prisma.task.findUnique({ where: { id } });
  }

  createTask(data: {
    title: string;
    description?: string;
    priority: TaskPriority;
    status: TaskStatus;
    due_date?: string;
    user_id: string;
  }) {
    return prisma.task.create({ data });
  }

  updateTask(id: string, data: Partial<Task>) {
    return prisma.task.update({ where: { id }, data });
  }

  async deleteTask(id: string) {
    await prisma.task.delete({ where: { id } });
  }

  // ─── Notifications ────────────────────────────────────────────────────
  getNotifications(userId: string) {
    return prisma.notification.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
    });
  }

  createNotification(data: {
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
  }) {
    return prisma.notification.create({ data });
  }

  // ─── Focus sessions ───────────────────────────────────────────────────
  getFocusSessions(userId: string) {
    return prisma.focusSession.findMany({ where: { user_id: userId }, orderBy: { date: 'asc' } });
  }

  createFocusSession(data: {
    user_id: string;
    date: string;
    focus_hours: number;
    tasks_completed: number;
    productivity_score: number;
  }) {
    return prisma.focusSession.create({ data });
  }

  // ─── Time blocks ──────────────────────────────────────────────────────
  getTimeBlocks(userId: string, date?: string) {
    return prisma.timeBlock.findMany({
      where: {
        user_id: userId,
        ...(date ? { start: { startsWith: date } } : {}),
      },
      orderBy: { start: 'asc' },
    });
  }

  createTimeBlock(data: {
    user_id: string;
    title: string;
    start: string;
    end: string;
    type: TimeBlockType;
    color?: string;
    task_id?: string;
  }) {
    return prisma.timeBlock.create({ data });
  }

  // ─── Integrations ─────────────────────────────────────────────────────
  getIntegrations(userId: string) {
    return prisma.integration.findMany({ where: { user_id: userId } });
  }

  getIntegration(userId: string, provider: IntegrationProvider) {
    return prisma.integration.findUnique({
      where: { user_id_provider: { user_id: userId, provider } },
    });
  }

  async updateIntegration(
    userId: string,
    provider: IntegrationProvider,
    data: Partial<Pick<IntegrationStatus, 'connected' | 'email' | 'connected_at' | 'encrypted_token'>>
  ) {
    return prisma.integration.upsert({
      where: { user_id_provider: { user_id: userId, provider } },
      update: data,
      create: { user_id: userId, provider, connected: false, ...data },
    });
  }

  // ─── Gamification ─────────────────────────────────────────────────────
  async awardXP(userId: string, points: number) {
    const user = await this.getUser(userId);
    if (!user) return undefined;
    const newPoints = user.productivity_points + points;
    const newLevel = Math.floor(newPoints / 500) + 1;
    return this.updateUser(userId, { productivity_points: newPoints, level: newLevel });
  }
}

export const store = new PrismaStore();