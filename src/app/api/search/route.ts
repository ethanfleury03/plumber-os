import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { isPortalResponse, requirePortalOrRespond } from '@/lib/auth/tenant';

export async function GET(request: Request) {
  const auth = await requirePortalOrRespond();
  if (isPortalResponse(auth)) return auth;

  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  if (q.length < 2) return NextResponse.json({ results: [] });
  const needle = `%${q}%`;

  const [customers, jobs, invoices, estimates, leads] = await Promise.all([
    sql`
      SELECT id, name, phone, email FROM customers
      WHERE company_id = ${auth.companyId}
        AND (name LIKE ${needle} OR phone LIKE ${needle} OR email LIKE ${needle})
      ORDER BY datetime(created_at) DESC
      LIMIT 8
    `,
    sql`
      SELECT id, description, status FROM jobs
      WHERE company_id = ${auth.companyId}
        AND (description LIKE ${needle} OR service_type LIKE ${needle})
      ORDER BY datetime(created_at) DESC
      LIMIT 8
    `,
    sql`
      SELECT id, invoice_number, status, total_cents FROM invoices
      WHERE company_id = ${auth.companyId}
        AND (invoice_number LIKE ${needle} OR notes LIKE ${needle})
      ORDER BY datetime(created_at) DESC
      LIMIT 8
    `,
    sql`
      SELECT id, estimate_number, status FROM estimates
      WHERE company_id = ${auth.companyId}
        AND (estimate_number LIKE ${needle} OR summary LIKE ${needle})
      ORDER BY datetime(created_at) DESC
      LIMIT 8
    `,
    sql`
      SELECT id, customer_name, issue_type, phone FROM leads
      WHERE company_id = ${auth.companyId}
        AND (customer_name LIKE ${needle} OR phone LIKE ${needle} OR issue_type LIKE ${needle})
      ORDER BY datetime(created_at) DESC
      LIMIT 8
    `,
  ]);

  const results = [
    ...customers.map((r: Record<string, unknown>) => ({
      type: 'customer',
      id: String(r.id),
      title: String(r.name || ''),
      subtitle: [r.phone, r.email].filter(Boolean).join(' • '),
      href: `/customers/${r.id}`,
    })),
    ...jobs.map((r: Record<string, unknown>) => ({
      type: 'job',
      id: String(r.id),
      title: String(r.description || 'Job'),
      subtitle: String(r.status || ''),
      href: `/jobs/${r.id}`,
    })),
    ...invoices.map((r: Record<string, unknown>) => ({
      type: 'invoice',
      id: String(r.id),
      title: `Invoice ${r.invoice_number}`,
      subtitle: `${r.status} — $${((Number(r.total_cents) || 0) / 100).toFixed(2)}`,
      href: `/invoices/${r.id}`,
    })),
    ...estimates.map((r: Record<string, unknown>) => ({
      type: 'estimate',
      id: String(r.id),
      title: `Estimate ${r.estimate_number}`,
      subtitle: String(r.status || ''),
      href: `/estimates/${r.id}`,
    })),
    ...leads.map((r: Record<string, unknown>) => ({
      type: 'lead',
      id: String(r.id),
      title: String(r.customer_name || 'Lead'),
      subtitle: [r.issue_type, r.phone].filter(Boolean).join(' • '),
      href: `/leads/${r.id}`,
    })),
  ];

  return NextResponse.json({ results });
}
