/**
 * Cookie-based session layer for the mock auth.
 *
 * Clerk migration path:
 *  - Replace `getSessionUser()` with a call to Clerk's `currentUser()` / `auth()`.
 *  - Remove `createSession`, `deleteSession`, the DB tables, and the cookie helpers.
 *  - The `SessionUser` type is preserved so callers don't change.
 */

import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db';
import type { SessionUser } from '@/lib/auth/types';
import { SESSION_COOKIE } from '@/lib/auth/constants';
export { SESSION_COOKIE } from '@/lib/auth/constants';
const SESSION_DURATION_DAYS = 30;

function nowPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/** Creates a session row + sets the cookie. Call from a Server Action or Route Handler. */
export async function createSession(userId: string): Promise<string> {
  const token = randomBytes(32).toString('hex');
  const expiresAt = nowPlus(SESSION_DURATION_DAYS);
  await sql`
    INSERT INTO user_sessions (user_id, token, expires_at)
    VALUES (${userId}, ${token}, ${expiresAt})
  `;
  return token;
}

/** Resolves the current session user from the request cookie. Returns null if unauthenticated. */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const rows = await sql`
    SELECT
      u.id, u.email, u.name, u.role, u.company_id, u.is_active,
      s.expires_at
    FROM user_sessions s
    JOIN portal_users u ON s.user_id = u.id
    WHERE s.token = ${token}
      AND s.expires_at > datetime('now')
    LIMIT 1
  `;
  const row = rows[0] as Record<string, unknown> | undefined;
  if (!row || !Number(row.is_active)) return null;

  const name = String(row.name || row.email || '');
  const initials = name
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase() || String(row.email).slice(0, 2).toUpperCase();

  return {
    id: String(row.id),
    email: String(row.email),
    name,
    role: (row.role as SessionUser['role']) || 'staff',
    companyId: String(row.company_id || ''),
    avatarInitials: initials,
  };
}

/** Deletes the session from DB and clears the cookie. */
export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await sql`DELETE FROM user_sessions WHERE token = ${token}`;
  }
}
