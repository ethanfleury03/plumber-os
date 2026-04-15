/** Auth types — swap-ready for Clerk later.
 *
 * When migrating to Clerk, replace `SessionUser` with a mapping from
 * Clerk's `getAuth()` / `currentUser()` return types to this shape.
 */

export type UserRole = 'admin' | 'staff' | 'viewer';

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  companyId: string;
  avatarInitials: string;
};

/** Returned by the /api/auth/me endpoint. */
export type MeResponse =
  | { authenticated: true; user: SessionUser }
  | { authenticated: false };
