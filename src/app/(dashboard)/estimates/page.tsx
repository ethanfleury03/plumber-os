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
      { label: 'Total', value: String(stats.total ?? 0) },
      { label: 'Draft', value: String(stats.draft ?? 0) },
      { label: 'Sent', value: String(stats.sent ?? 0) },
      { label: 'Approved', value: String(stats.approved ?? 0) },
      {
        label: 'Pipeline value',
        value: money(Number(stats.total_value_cents || 0)),
      },
      {
        label: 'Approval rate',
        value:
          stats.approval_rate == null ? '—' : `${Math.round(Number(stats.approval_rate) * 100)}%`,
      },
    ];
  }, [stats]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-teal-700" />
            Estimates
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Build quotes, share with homeowners, track approvals, convert to jobs.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/estimates/settings"
            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50"
          >
            Defaults
          </Link>
          <Link
            href="/estimates/new"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-teal-700 text-white text-sm font-medium hover:bg-teal-800"
          >
            <Plus className="w-4 h-4" />
            New estimate
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{s.label}</p>
            <p className="text-lg font-semibold text-gray-900 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row gap-3 md:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full pl-10 pr-3 py-2 rounded-lg border border-gray-300 text-sm"
            placeholder="Search number, title, customer…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap gap-1">
          {statusTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setStatus(t.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border ${
                status === t.id
                  ? 'bg-teal-700 text-white border-teal-700'
                  : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Number</th>
                <th className="px-4 py-3 font-medium">Title</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Expires</th>
                <th className="px-4 py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    Loading…
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                    No estimates yet. Create one to get started.
                  </td>
                </tr>
              ) : (
                rows.map((e) => (
                  <tr key={e.id as string} className="border-t border-gray-100 hover:bg-gray-50/80">
                    <td className="px-4 py-3 font-mono text-xs">{String(e.estimate_number)}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{String(e.title)}</td>
                    <td className="px-4 py-3 text-gray-700">{String(e.customer_name_snapshot)}</td>
                    <td className="px-4 py-3">{money(Number(e.total_amount_cents) || 0)}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                        {String(e.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {e.expiration_date ? String(e.expiration_date) : '—'}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/estimates/${e.id as string}`}
                        className="text-teal-700 font-medium hover:underline"
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
        <div className="px-4 py-2 border-t border-gray-100 text-xs text-gray-500">
          Showing {rows.length} of {total}
        </div>
      </div>
    </div>
  );
}
