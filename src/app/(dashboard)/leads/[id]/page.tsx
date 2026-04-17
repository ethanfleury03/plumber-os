'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';

type Row = Record<string, unknown>;

function money(cents: unknown) {
  const n = typeof cents === 'number' ? cents : Number(cents) || 0;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n / 100);
}

export default function LeadDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [lead, setLead] = useState<Row | null>(null);
  const [estimates, setEstimates] = useState<Row[]>([]);
  const [jobs, setJobs] = useState<Row[]>([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/leads/${id}`);
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || 'Failed');
        if (!cancelled) {
          setLead(j.lead as Row);
          setEstimates((j.estimates as Row[]) || []);
          setJobs((j.jobs as Row[]) || []);
        }
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col min-h-0 bg-gray-50">
        <div className="p-8 text-center text-gray-500">Loading…</div>
      </div>
    );
  }
  if (!lead) {
    return (
      <div className="flex flex-1 flex-col min-h-0 bg-gray-50">
        <div className="p-8 text-center text-red-600">{err || 'Not found'}</div>
        <Link href="/leads" className="text-center text-blue-600 text-sm hover:underline">
          Back to leads
        </Link>
      </div>
    );
  }

  const cid = lead.customer_id as string | undefined;

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-gray-50">
      <main className="flex-1 min-h-0 overflow-auto p-8 max-w-4xl mx-auto space-y-6 w-full">
        <Link href="/leads" className="inline-flex items-center gap-2 text-sm text-blue-600 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          Leads
        </Link>
        <header className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm space-y-2">
          <h1 className="text-2xl font-semibold text-gray-900">{String(lead.issue || 'Lead')}</h1>
          <p className="text-sm text-gray-600 capitalize">
            {String(lead.status)} · source {String(lead.source)}
          </p>
          {lead.customer_name ? (
            <p className="text-sm text-gray-800">
              {String(lead.customer_name)}
              {cid ? (
                <>
                  {' '}
                  ·{' '}
                  <Link href={`/customers/${cid}`} className="text-blue-600 hover:underline">
                    Customer profile
                  </Link>
                </>
              ) : null}
            </p>
          ) : null}
          {lead.location ? <p className="text-sm text-gray-600">{String(lead.location)}</p> : null}
          {lead.description ? (
            <p className="text-sm text-gray-700 whitespace-pre-wrap mt-2">{String(lead.description)}</p>
          ) : null}
          <div className="pt-2">
            <Link
              href={`/estimates/new?lead_id=${encodeURIComponent(id)}`}
              className="text-sm font-medium text-teal-700 hover:underline"
            >
              New estimate for this lead
            </Link>
          </div>
        </header>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">Estimates</h2>
          {estimates.length === 0 ? (
            <p className="text-sm text-gray-600">No estimates yet.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {estimates.map((e) => (
                <li key={e.id as string}>
                  <Link href={`/estimates/${e.id}`} className="text-blue-600 hover:underline font-medium">
                    {String(e.estimate_number)}
                  </Link>
                  <span className="text-gray-600"> — {String(e.title)}</span>
                  <span className="text-gray-500 capitalize"> · {String(e.status)}</span>
                  <span className="text-gray-800 font-mono"> · {money(e.total_amount_cents)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-3">Jobs</h2>
          {jobs.length === 0 ? (
            <p className="text-sm text-gray-600">No jobs from this lead.</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {jobs.map((j) => (
                <li key={j.id as string}>
                  <Link href={`/jobs/${j.id}`} className="text-blue-600 hover:underline font-medium">
                    {String(j.type || 'Job')}
                  </Link>
                  <span className="text-gray-500 capitalize"> · {String(j.status)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
