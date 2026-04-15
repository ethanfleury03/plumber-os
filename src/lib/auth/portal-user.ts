import { auth, currentUser } from '@clerk/nextjs/server';
import { sql } from '@/lib/db';
import type { SessionUser } from '@/lib/auth/types';

/**
 * Portal user for API routes and `/api/auth/me` — Clerk session plus optional
 * `portal_users` row matched by email for company/role.
 */
export async function getPortalUser(): Promise<SessionUser | null> {
  const { userId } = await auth();
  if (!userId) return null;

  const user = await currentUser();
  if (!user) return null;

  const email =
    user.primaryEmailAddress?.emailAddress || user.emailAddresses[0]?.emailAddress || null;
  if (!email) return null;

  const meta = user.publicMetadata as Record<string, unknown> | undefined;
  const roleMeta = meta?.role as SessionUser['role'] | undefined;
  const companyMeta = meta?.companyId as string | undefined;

  let companyId = companyMeta?.trim() || '';
  let role: SessionUser['role'] = roleMeta || 'admin';
  let portalRowId: string | null = null;

  const rows = await sql`
    SELECT id, company_id, role FROM portal_users WHERE lower(email) = ${email.toLowerCase()} LIMIT 1
  `;
  const row = rows[0] as { id?: string; company_id?: string; role?: string } | undefined;
  if (row) {
    portalRowId = String(row.id);
    if (row.company_id) companyId = String(row.company_id);
    if (row.role) role = row.role as SessionUser['role'];
  }

  if (!companyId) {
    const c = await sql`SELECT id FROM companies ORDER BY datetime(created_at) LIMIT 1`;
    companyId = String((c[0] as { id?: string } | undefined)?.id || '');
  }

  const name =
    [user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
    user.username ||
    email;
  const parts = name.split(/\s+/).filter(Boolean);
  const initials =
    parts
      .map((w) => w[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase() || email.slice(0, 2).toUpperCase();

  return {
    id: portalRowId || userId,
    email,
    name,
    role,
    companyId,
    avatarInitials: initials,
  };
}
