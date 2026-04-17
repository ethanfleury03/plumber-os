'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { ClipboardList, Plus, Search } from 'lucide-react';

const statusTabs = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'sent', label: 'Sent' },
  { id: 'viewed', label: 'Viewed' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'converted', label: 'Converted' },
];

function money(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default function EstimatesListPage() {
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [debounced, setDebounced] = useState('');
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const p = new URLSearchParams();
        if (status !== 'all') p.set('status', status);
        if (debounced) p.set('search', debounced);
        const [listRes, statsRes] = await Promise.all([
          fetch(`/api/estimates?${p}`),
          fetch('/api/estimates/stats'),
        ]);
        const listJson = await listRes.json();
        const statsJson = await statsRes.json();
        if (!cancelled) {
          setRows((listJson.estimates as Record<string, unknown>[]) || []);
          setTotal(Number(listJson.total) || 0);
          setStats(statsJson.stats || null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [status, debounced]);

  const statCards = useMemo(() => {
    if (!stats) return [];
    return [
      { label: 'Total', value: String(stats.total ?? 0), accent: 'text-gray-900' },
      { label: 'Draft', value: String(stats.draft ?? 0), accent: 'text-gray-900' },
      { label: 'Sent', value: String(stats.sent ?? 0), accent: 'text-blue-600' },
      { label: 'Approved', value: String(stats.approved ?? 0), accent: 'text-green-600' },
      {
        label: 'Pipeline value',
        value: money(Number(stats.total_value_cents || 0)),
        accent: 'text-gray-900',
      },
      {
        label: 'Approval rate',
        value:
          stats.approval_rate == null ? '—' : `${Math.round(Number(stats.approval_rate) * 100)}%`,
        accent: 'text-gray-900',
      },
    ];
  }, [stats]);

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-gray-50">
      <main className="flex-1 min-h-0 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 rounded-lg bg-blue-50 p-2">
                <ClipboardList className="h-6 w-6 text-blue-600" aria-hidden />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-gray-900">Estimates</h1>
                <p className="text-gray-500 text-sm mt-0.5">
                  Build quotes, share with homeowners, track approvals, convert to jobs.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  className="pl-10 pr-4 py-2 w-full sm:w-72 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Search number, title, customer…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  href="/estimates/settings"
                  className="inline-flex items-center justify-center px-4 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 transition"
                >
                  Defaults
                </Link>
                <Link
                  href="/estimates/new"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition"
                >
                  <Plus className="w-4 h-4" />
                  New estimate
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            {statCards.map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm"
              >
                <p className="text-gray-500 text-sm mb-1">{s.label}</p>
                <p className={`text-2xl font-bold tabular-nums ${s.accent}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {statusTabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setStatus(t.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                  status === t.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-4 font-medium text-gray-500">Number</th>
                    <th className="text-left px-6 py-4 font-medium text-gray-500">Title</th>
                    <th className="text-left px-6 py-4 font-medium text-gray-500">Customer</th>
                    <th className="text-left px-6 py-4 font-medium text-gray-500">Total</th>
                    <th className="text-left px-6 py-4 font-medium text-gray-500">Status</th>
                    <th className="text-left px-6 py-4 font-medium text-gray-500">Expires</th>
                    <th className="px-6 py-4" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        Loading…
                      </td>
                    </tr>
                  ) : rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                        No estimates yet. Create one to get started.
                      </td>
                    </tr>
                  ) : (
                    rows.map((e) => (
                      <tr key={e.id as string} className="hover:bg-gray-50/80 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-gray-800">
                          {String(e.estimate_number)}
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900">{String(e.title)}</td>
                        <td className="px-6 py-4 text-gray-700">{String(e.customer_name_snapshot)}</td>
                        <td className="px-6 py-4 text-gray-900 font-medium">
                          {money(Number(e.total_amount_cents) || 0)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                            {String(e.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-600">
                          {e.expiration_date ? String(e.expiration_date) : '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/estimates/${e.id as string}`}
                            className="text-blue-600 font-medium hover:text-blue-700 hover:underline"
                          >
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-500 bg-gray-50/50">
              Showing {rows.length} of {total}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
