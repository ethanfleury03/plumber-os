'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Loader2, Plus, Search, Settings } from 'lucide-react';

type EstimateRow = Record<string, unknown>;

type Stats = {
  total: number;
  draft: number;
  sent: number;
  viewed: number;
  approved: number;
  rejected: number;
  expired: number;
  converted: number;
  totalValueCents: number;
  approvalRate: number;
};

const statusTabs = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Draft' },
  { id: 'sent', label: 'Sent' },
  { id: 'viewed', label: 'Viewed' },
  { id: 'approved', label: 'Approved' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'expired', label: 'Expired' },
  { id: 'converted', label: 'Converted' },
];

function formatMoney(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-800',
    sent: 'bg-blue-100 text-blue-800',
    viewed: 'bg-indigo-100 text-indigo-800',
    approved: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-amber-100 text-amber-900',
    converted: 'bg-violet-100 text-violet-800',
    archived: 'bg-gray-100 text-gray-600',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}

export default function EstimatesListPage() {
  const [estimates, setEstimates] = useState<EstimateRow[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');

  const load = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (status !== 'all') params.set('status', status);
      if (search.trim()) params.set('search', search.trim());
      const [listRes, statsRes] = await Promise.all([
        fetch(`/api/estimates?${params}`),
        fetch('/api/estimates/stats'),
      ]);
      const listData = await listRes.json();
      const statsData = await statsRes.json();
      if (listData.error) setError(listData.error);
      else {
        setEstimates(listData.estimates || []);
        setTotal(listData.total ?? 0);
        setError('');
      }
      if (!statsData.error) setStats(statsData);
    } catch {
      setError('Failed to load estimates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [status]);

  const onSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    load();
  };

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-gradient-to-br from-slate-50 via-gray-100 to-slate-100">
      <main className="flex-1 overflow-auto p-6">
        <header className="header mb-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Estimates</h1>
            <p className="text-gray-500 text-sm mt-0.5">Quotes and proposals for customers</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/estimates/settings"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-50"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <Link
              href="/estimates/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold shadow hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
              New estimate
            </Link>
          </div>
        </header>

        {stats ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase">Total</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase">Pipeline value</p>
              <p className="text-xl font-bold text-gray-900">{formatMoney(stats.totalValueCents)}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase">Approved</p>
              <p className="text-2xl font-bold text-emerald-700">{stats.approved + stats.converted}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase">Converted</p>
              <p className="text-2xl font-bold text-violet-700">{stats.converted}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase">Approval rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {(stats.approvalRate * 100).toFixed(0)}%
              </p>
            </div>
            <div className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
              <p className="text-xs font-medium text-gray-500 uppercase">Draft</p>
              <p className="text-2xl font-bold text-slate-700">{stats.draft}</p>
            </div>
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 mb-4">
          {statusTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setStatus(t.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                status === t.id ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <form onSubmit={onSearchSubmit} className="flex gap-2 mb-4 max-w-xl">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search number, customer, title…"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-gray-900 text-white text-sm font-semibold hover:bg-gray-800"
          >
            Search
          </button>
        </form>

        {error ? (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl mb-4 text-sm">{error}</div>
        ) : null}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Number</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Customer</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Title</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-500">Total</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Sent</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Expires</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {estimates.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                        No estimates yet. Create one to send a professional quote.
                      </td>
                    </tr>
                  ) : (
                    estimates.map((e) => (
                      <tr key={String(e.id)} className="hover:bg-gray-50/80">
                        <td className="px-4 py-3 font-mono text-gray-800">{String(e.estimate_number)}</td>
                        <td className="px-4 py-3 text-gray-900 font-medium">{String(e.customer_name_snapshot || '—')}</td>
                        <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{String(e.title)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">
                          {formatMoney(Number(e.total_amount_cents || 0))}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-semibold ${statusClass(String(e.status))}`}>
                            {String(e.status)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {e.sent_at ? new Date(String(e.sent_at)).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {e.expiration_date
                            ? new Date(String(e.expiration_date)).toLocaleDateString()
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <Link
                              href={`/estimates/${e.id}`}
                              className="text-blue-600 font-semibold hover:underline"
                            >
                              Open
                            </Link>
                            <button
                              type="button"
                              onClick={async (ev) => {
                                ev.preventDefault();
                                if (!confirm(`Archive estimate ${e.estimate_number}?`)) return;
                                try {
                                  const res = await fetch(`/api/estimates/${e.id}`, { method: 'DELETE' });
                                  const data = await res.json();
                                  if (!res.ok) throw new Error(data.error || 'Failed');
                                  load();
                                } catch (err) {
                                  alert(err instanceof Error ? err.message : 'Archive failed');
                                }
                              }}
                              className="text-xs font-semibold text-red-600 hover:underline"
                            >
                              Archive
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
          {!loading && estimates.length > 0 ? (
            <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-500">
              Showing {estimates.length} of {total}
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}
