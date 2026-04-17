'use client';

import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

type Overview = {
  days: number;
  invoices: { count: number; total_cents: number; paid_cents: number; pending_cents: number };
  payments: { count: number; paid_cents: number; refunded_cents: number; fee_cents: number };
  jobs: { count: number; completed: number; in_progress: number; cancelled: number };
  leads: { count: number; new_count: number; converted: number };
};

function fmtMoney(cents: number) {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function ReportsPage() {
  const [days, setDays] = useState(30);
  const [data, setData] = useState<Overview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/overview?days=${days}`, { cache: 'no-store' });
      const json = await res.json();
      if (res.ok) setData(json as Overview);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Reports</h1>
          <p className="text-sm text-muted-foreground">Activity snapshot for the last {days} days.</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded-md border px-2 py-1 text-sm"
        >
          <option value={7}>7 days</option>
          <option value={30}>30 days</option>
          <option value={90}>90 days</option>
          <option value={365}>12 months</option>
        </select>
      </header>

      {loading || !data ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card
            title="Invoices"
            stats={[
              { label: 'Created', value: String(data.invoices.count) },
              { label: 'Billed', value: fmtMoney(data.invoices.total_cents) },
              { label: 'Paid', value: fmtMoney(data.invoices.paid_cents) },
              { label: 'Pending', value: fmtMoney(data.invoices.pending_cents) },
            ]}
          />
          <Card
            title="Payments"
            stats={[
              { label: 'Charges', value: String(data.payments.count) },
              { label: 'Net collected', value: fmtMoney(data.payments.paid_cents - data.payments.refunded_cents) },
              { label: 'Refunded', value: fmtMoney(data.payments.refunded_cents) },
              { label: 'Platform fees', value: fmtMoney(data.payments.fee_cents) },
            ]}
          />
          <Card
            title="Jobs"
            stats={[
              { label: 'Total', value: String(data.jobs.count) },
              { label: 'Completed', value: String(data.jobs.completed) },
              { label: 'In progress', value: String(data.jobs.in_progress) },
              { label: 'Cancelled', value: String(data.jobs.cancelled) },
            ]}
          />
          <Card
            title="Leads"
            stats={[
              { label: 'Total', value: String(data.leads.count) },
              { label: 'New', value: String(data.leads.new_count) },
              { label: 'Converted', value: String(data.leads.converted) },
              {
                label: 'Win rate',
                value:
                  data.leads.count > 0
                    ? `${Math.round((data.leads.converted / data.leads.count) * 100)}%`
                    : '—',
              },
            ]}
          />
        </div>
      )}
    </div>
  );
}

function Card({
  title,
  stats,
}: {
  title: string;
  stats: { label: string; value: string }[];
}) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="text-sm font-medium text-muted-foreground mb-3">{title}</h3>
      <dl className="space-y-1">
        {stats.map((s) => (
          <div key={s.label} className="flex items-center justify-between text-sm">
            <dt className="text-gray-600">{s.label}</dt>
            <dd className="font-semibold">{s.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
