/**
 * Seeds the initial admin account if it doesn't exist.
 * Called once at DB init time — safe to run repeatedly.
 *
 * Credentials: ethan.fleuryy@gmail.com / password  (will be Clerk later)
 */

import type Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';

export function seedAdminUser(db: Database.Database) {
  const existing = db
    .prepare(`SELECT id FROM portal_users WHERE email = ? COLLATE NOCASE LIMIT 1`)
    .get('ethan.fleuryy@gmail.com') as { id: string } | undefined;

  if (existing) return;

  const company = db.prepare(`SELECT id FROM companies ORDER BY created_at ASC LIMIT 1`).get() as
    | { id: string }
    | undefined;

  // Use a sync bcrypt hash so it works in the synchronous DB init path
  const hashed = bcrypt.hashSync('password', 12);
  const id = randomUUID();

  db.prepare(
    `INSERT INTO portal_users (id, company_id, email, name, hashed_pw, role, is_active)
     VALUES (?, ?, ?, ?, ?, ?, 1)`,
  ).run(id, company?.id ?? null, 'ethan.fleuryy@gmail.com', 'Ethan Fleury', hashed, 'admin');

  console.log('[auth] Seeded admin user: ethan.fleuryy@gmail.com');
}
