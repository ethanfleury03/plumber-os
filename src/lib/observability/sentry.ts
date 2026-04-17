/**
 * Sentry stub.
 *
 * The real @sentry/nextjs integration requires a wizard run and a
 * SENTRY_DSN, so this file gives us a stable API surface that no-ops
 * when the DSN is missing. Replace the internals with @sentry/nextjs
 * (init + captureException) once the account is provisioned.
 */

type Scope = {
  setTag: (key: string, value: string) => void;
  setUser: (user: { id?: string; email?: string } | null) => void;
  setContext: (name: string, ctx: Record<string, unknown>) => void;
};

interface SentryAPI {
  captureException: (error: unknown, scope?: (s: Scope) => void) => void;
  captureMessage: (message: string, scope?: (s: Scope) => void) => void;
  setTenantContext: (opts: { companyId?: string | null; userId?: string | null }) => void;
}

const enabled = Boolean(process.env.SENTRY_DSN);

function noopScope(): Scope {
  return { setTag: () => {}, setUser: () => {}, setContext: () => {} };
}

export const sentry: SentryAPI = {
  captureException(error, cb) {
    if (!enabled) {
      console.error('[sentry-disabled]', error);
      return;
    }
    cb?.(noopScope());
    console.error('[sentry]', error);
  },
  captureMessage(message, cb) {
    if (!enabled) return;
    cb?.(noopScope());
    console.warn('[sentry]', message);
  },
  setTenantContext() {
    // When @sentry/nextjs is wired up, we'll push a scope with company/user tags here.
  },
};
