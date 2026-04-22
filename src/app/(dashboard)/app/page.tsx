'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Briefcase, ClipboardList, DollarSign, Headphones, TrendingUp, Users } from 'lucide-react';
import {
  ActionCard,
  AppPageHeader,
  ConsolePanel,
  DataTable,
  KpiStrip,
  SearchField,
  StatCard,
  StatusBadge,
  opsButtonClass,
} from '@/components/ops/ui';
import { formatCurrency, formatDateLabel, isSameLocalDay } from '@/lib/ops';

interface Lead {
  id: string;
  issue: string;
  status: string;
  created_at: string;
  location?: string;
  customer_name?: string;
  customer_phone?: string;
}

interface Job {
  id: string;
  status: string;
  type?: string;
  scheduled_date?: string | null;
  scheduled_at?: string | null;
}

interface Invoice {
  id: string;
  status: string;
  total?: number | null;
  amount?: number | null;
  due_date?: string | null;
}

const leadStatusTone: Record<string, 'brand' | 'success' | 'warning' | 'neutral'> = {
  new: 'brand',
  qualified: 'success',
  booked: 'success',
  quoted: 'warning',
  lost: 'neutral',
};

export default function Dashboard() {
  const searchParams = useSearchParams();
  const showWelcome = searchParams.get('welcome') === '1';
  const [leads, setLeads] = useState<Lead[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        const [leadsRes, jobsRes, invoicesRes] = await Promise.all([
          fetch('/api/leads?limit=8'),
          fetch('/api/jobs?limit=200'),
          fetch('/api/invoices?limit=200'),
        ]);

        const [leadsData, jobsData, invoicesData] = await Promise.all([
          leadsRes.json(),
          jobsRes.json(),
          invoicesRes.json(),
        ]);

        if (leadsData.error || jobsData.error || invoicesData.error) {
          setError(leadsData.error || jobsData.error || invoicesData.error);
          return;
        }

        setLeads(leadsData.leads || []);
        setJobs(jobsData.jobs || []);
        setInvoices(invoicesData.invoices || []);
      } catch {
        setError('Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const filteredLeads = useMemo(() => {
    const query = search.toLowerCase().trim();
    if (!query) return leads;
    return leads.filter((lead) =>
      [lead.customer_name, lead.customer_phone, lead.issue, lead.location]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query)),
    );
  }, [leads, search]);

  const stats = useMemo(() => {
    const activeJobs = jobs.filter((job) => ['scheduled', 'in_progress'].includes(job.status)).length;
    const inProgressJobs = jobs.filter((job) => job.status === 'in_progress').length;
    const pendingInvoices = invoices.filter((invoice) => invoice.status === 'pending');
    const pendingAmount = pendingInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.total ?? invoice.amount ?? 0),
      0,
    );
    const paidInvoices = invoices.filter((invoice) => invoice.status === 'paid');
    const revenue = paidInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.total ?? invoice.amount ?? 0),
      0,
    );
    const jobsToday = jobs.filter((job) => {
      if (job.scheduled_at) return isSameLocalDay(job.scheduled_at);
      return job.scheduled_date === new Date().toISOString().slice(0, 10);
    }).length;
    const newLeads = leads.filter((lead) => lead.status === 'new').length;

    return {
      totalLeads: leads.length,
      newLeads,
      activeJobs,
      inProgressJobs,
      pendingInvoices: pendingInvoices.length,
      pendingAmount,
      revenue,
      paidCount: paidInvoices.length,
      jobsToday,
    };
  }, [invoices, jobs, leads]);

  const actionNeeded = [
    {
      title: `${stats.jobsToday} jobs scheduled today`,
      description: `${stats.inProgressJobs} already in progress.`,
      tone: 'brand' as const,
    },
    {
      title: `${stats.pendingInvoices} invoices awaiting payment`,
      description: `${formatCurrency(stats.pendingAmount)} outstanding.`,
      tone: 'warning' as const,
    },
    {
      title: `${stats.newLeads} fresh leads need review`,
      description: 'Close the loop before they cool off.',
      tone: 'success' as const,
    },
  ];

  return (
    <div className="flex min-h-0 flex-1 flex-col bg-[var(--ops-bg)]">
      <main className="min-h-0 flex-1 overflow-auto px-4 py-6 sm:px-6 xl:px-8">
        <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-6">
          <AppPageHeader
            eyebrow="Today / Overview"
            title="Good morning, Akshay"
            description="A denser, calmer briefing view for leads, work already on the board, and money that still needs attention."
            actions={
              <>
                <SearchField
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search recent leads…"
                  className="min-w-[min(360px,100%)]"
                />
                <Link href="/crm" className={opsButtonClass('secondary')}>
                  <Users className="h-4 w-4" />
                  Review CRM
                </Link>
                <Link href="/jobs" className={opsButtonClass('primary')}>
                  <Briefcase className="h-4 w-4" />
                  Open jobs
                </Link>
              </>
            }
          >
            {showWelcome ? (
              <div className="rounded-[20px] border border-[var(--ops-success-soft-border)] bg-[var(--ops-success-soft)] px-4 py-3 text-sm text-[var(--ops-success-ink)]">
                Subscription activated. Your trial is live and billing is set up.
              </div>
            ) : null}
          </AppPageHeader>

          {error ? (
            <div className="rounded-[24px] border border-[var(--ops-danger-soft-border)] bg-[var(--ops-danger-soft)] px-4 py-3 text-sm text-[var(--ops-danger-ink)]">
              {error}
            </div>
          ) : null}

          <KpiStrip className="xl:grid-cols-5">
            <StatCard label="Total leads" value={loading ? '…' : stats.totalLeads} meta={`${stats.newLeads} new today`} tone="brand" icon={Users} />
            <StatCard label="Active jobs" value={loading ? '…' : stats.activeJobs} meta={`${stats.jobsToday} scheduled today`} tone="brand" icon={Briefcase} />
            <StatCard label="Pending invoices" value={loading ? '…' : stats.pendingInvoices} meta={formatCurrency(stats.pendingAmount)} tone="warning" icon={ClipboardList} />
            <StatCard label="Revenue" value={loading ? '…' : formatCurrency(stats.revenue)} meta={`${stats.paidCount} paid invoices`} tone="success" icon={DollarSign} />
            <StatCard label="Receptionist load" value={loading ? '…' : stats.newLeads + stats.jobsToday} meta="Combined new business and active field demand" tone="neutral" icon={Headphones} />
          </KpiStrip>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
            <div className="space-y-6">
              <ConsolePanel
                title="Today needs attention"
                description="A compact briefing strip that puts the most immediate operational pressure in one place."
              >
                <div className="grid gap-3 lg:grid-cols-3">
                  {actionNeeded.map((item) => (
                    <div key={item.title} className="rounded-[24px] border border-[var(--ops-border)] bg-white px-5 py-4">
                      <StatusBadge tone={item.tone}>{item.title}</StatusBadge>
                      <p className="mt-3 text-sm leading-6 text-[var(--ops-muted)]">{item.description}</p>
                    </div>
                  ))}
                </div>
              </ConsolePanel>

              <ConsolePanel
                title="Recent leads"
                description="The pipeline now reads like an operations list, not a decorative dashboard table."
                action={<Link href="/crm" className={opsButtonClass('ghost', 'sm')}>View full board</Link>}
              >
                <DataTable
                  columns={[
                    { key: 'name', label: 'Customer' },
                    { key: 'issue', label: 'Issue' },
                    { key: 'phone', label: 'Phone' },
                    { key: 'location', label: 'Location' },
                    { key: 'status', label: 'Status' },
                    { key: 'date', label: 'Received' },
                  ]}
                  footer={`Showing ${filteredLeads.slice(0, 6).length} of ${leads.length} recent leads`}
                  minWidthClassName="min-w-[920px]"
                  className="border-0 shadow-none"
                >
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-sm text-[var(--ops-muted)]">
                        Loading dashboard…
                      </td>
                    </tr>
                  ) : filteredLeads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-12 text-center text-sm text-[var(--ops-muted)]">
                        No leads match this search.
                      </td>
                    </tr>
                  ) : (
                    filteredLeads.slice(0, 6).map((lead) => (
                      <tr key={lead.id} className="transition-colors hover:bg-[var(--ops-surface-subtle)]">
                        <td className="px-5 py-4">
                          <div>
                            <p className="text-sm font-semibold text-[var(--ops-text)]">{lead.customer_name || 'Unknown customer'}</p>
                            <p className="mt-1 text-xs font-mono text-[var(--ops-muted)]">{lead.id}</p>
                          </div>
                        </td>
                        <td className="px-5 py-4 text-sm text-[var(--ops-text)]">{lead.issue}</td>
                        <td className="px-5 py-4 text-sm text-[var(--ops-muted)]">{lead.customer_phone || '—'}</td>
                        <td className="px-5 py-4 text-sm text-[var(--ops-muted)]">{lead.location || 'No address yet'}</td>
                        <td className="px-5 py-4">
                          <StatusBadge tone={leadStatusTone[lead.status] || 'neutral'}>{lead.status}</StatusBadge>
                        </td>
                        <td className="px-5 py-4 text-sm text-[var(--ops-muted)]">{formatDateLabel(lead.created_at)}</td>
                      </tr>
                    ))
                  )}
                </DataTable>
              </ConsolePanel>
            </div>

            <div className="space-y-6 xl:sticky xl:top-6">
              <ActionCard
                title="Quick actions"
                description="The dashboard keeps a short rail of high-frequency office moves instead of pushing them down into isolated pages."
                action={
                  <div className="grid gap-2">
                    <Link href="/crm" className={opsButtonClass('primary')}>
                      <Users className="h-4 w-4" />
                      New lead
                    </Link>
                    <Link href="/jobs" className={opsButtonClass('secondary')}>
                      <Briefcase className="h-4 w-4" />
                      Quick add job
                    </Link>
                    <Link href="/invoices" className={opsButtonClass('secondary')}>
                      <ClipboardList className="h-4 w-4" />
                      View invoices
                    </Link>
                    <Link href="/receptionist" className={opsButtonClass('ghost')}>
                      <Headphones className="h-4 w-4" />
                      Open receptionist desk
                    </Link>
                  </div>
                }
              />

              <ConsolePanel title="Cash and workload signal" description="A compact rail for revenue, collections, and activity pacing.">
                <div className="space-y-3">
                  <div className="rounded-[24px] border border-[var(--ops-border)] bg-white px-5 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ops-muted)]">Revenue collected</p>
                    <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--ops-text)]">{formatCurrency(stats.revenue)}</p>
                    <p className="mt-2 text-sm text-[var(--ops-muted)]">{stats.paidCount} invoices paid</p>
                  </div>
                  <div className="rounded-[24px] border border-[var(--ops-border)] bg-white px-5 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--ops-muted)]">Collections risk</p>
                    <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-[var(--ops-text)]">{formatCurrency(stats.pendingAmount)}</p>
                    <p className="mt-2 text-sm text-[var(--ops-muted)]">{stats.pendingInvoices} invoices still open</p>
                  </div>
                  <div className="rounded-[24px] border border-[var(--ops-border)] bg-white px-5 py-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[var(--ops-brand)]" />
                      <p className="text-sm font-semibold text-[var(--ops-text)]">Today is pacing normally</p>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-[var(--ops-muted)]">
                      New lead volume and field demand are both active, but there is no obvious dispatch bottleneck yet.
                    </p>
                  </div>
                </div>
              </ConsolePanel>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
