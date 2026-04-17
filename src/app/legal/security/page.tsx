export default function SecurityPage() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight mb-6">Security</h1>
      <p className="text-slate-600 leading-relaxed mb-4">
        High-level summary: PlumberOS uses industry-standard authentication (Clerk), encrypted transport (HTTPS),
        tenant-scoped data access in the application layer, and optional Postgres row-level security for
        multi-tenant isolation. Secrets belong in environment variables, not in the repository.
      </p>
      <p className="text-slate-600 leading-relaxed">
        Expand this page with your SOC 2 roadmap, penetration test summaries, subprocessors list, and a security@
        contact when you publish a formal trust center.
      </p>
    </>
  );
}
