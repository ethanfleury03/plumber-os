'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell, Plus, TrendingUp } from 'lucide-react';

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
}

interface Invoice {
  id: string;
  status: string;
  total?: number | null;
  amount?: number | null;
}

const navItems = [
  { icon: '📊', label: 'Dashboard', href: '/' },
  { icon: '🎯', label: 'CRM', href: '/crm' },
  { icon: '💼', label: 'Jobs', href: '/jobs' },
  { icon: '👥', label: 'Customers', href: '/customers' },
  { icon: '📄', label: 'Invoices', href: '/invoices' },
  { icon: '📅', label: 'Calendar', href: '/calendar' },
  { icon: '📍', label: 'Map', href: '/map' },
  { icon: '👨‍🔧', label: 'Team', href: '/team' },
  { icon: '📞', label: 'Calls', href: '/calls' },
  { icon: '⚙️', label: 'Settings', href: '/settings' },
];

const leadStatusLabels: Record<string, string> = {
  new: 'New',
  qualified: 'Qualified',
  quoted: 'Quoted',
  booked: 'Booked',
  in_progress: 'In Progress',
  completed: 'Completed',
  lost: 'Lost',
};

const formatCurrency = (value: number) => `$${value.toLocaleString()}`;

export default function Dashboard() {
  const pathname = usePathname();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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

  const stats = useMemo(() => {
    const activeJobs = jobs.filter((job) => ['scheduled', 'in_progress'].includes(job.status)).length;
    const inProgressJobs = jobs.filter((job) => job.status === 'in_progress').length;
    const pendingInvoices = invoices.filter((invoice) => invoice.status === 'pending');
    const pendingAmount = pendingInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.total ?? invoice.amount ?? 0),
      0
    );
    const paidInvoices = invoices.filter((invoice) => invoice.status === 'paid');
    const revenue = paidInvoices.reduce(
      (sum, invoice) => sum + Number(invoice.total ?? invoice.amount ?? 0),
      0
    );

    return [
      {
        label: 'Total Leads',
        value: String(leads.length),
        change: `${leads.filter((lead) => lead.status === 'new').length} new`,
        up: true,
      },
      {
        label: 'Active Jobs',
        value: String(activeJobs),
        change: `${inProgressJobs} in progress`,
        up: true,
      },
      {
        label: 'Pending Invoices',
        value: String(pendingInvoices.length),
        change: formatCurrency(pendingAmount),
        up: false,
      },
      {
        label: 'Revenue',
        value: formatCurrency(revenue),
        change: `${paidInvoices.length} paid`,
        up: true,
      },
    ];
  }, [invoices, jobs, leads]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-gray-100 to-slate-100">
      <aside className="sidebar w-56 text-white flex flex-col flex-shrink-0">
        <div className="p-5 relative z-10">
          <Link href="/" className="flex items-center gap-3">
            <div className="sidebar-logo w-10 h-10 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-lg font-bold">P</span>
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              PlumberOS
            </span>
          </Link>
        </div>

        <nav className="flex-1 px-3 relative z-10">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`sidebar-item w-full flex items-center gap-3 px-4 py-3 mb-1 text-sm ${
                pathname === item.href ? 'active text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-700/50 relative z-10">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-sm font-bold shadow-lg">
              AK
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Akshay K.</p>
              <p className="text-xs text-gray-400">Admin</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <header className="header px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Good morning, Akshay</h1>
            <p className="text-gray-500 text-sm">Here is what is happening with your business today.</p>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm w-64 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        <div className="p-8 overflow-auto">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-4 gap-6 mb-8">
            {stats.map((stat) => (
              <div key={stat.label} className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl shadow-black/5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-500 text-sm">{stat.label}</span>
                  {stat.up ? (
                    <span className="flex items-center text-emerald-500 text-sm font-medium bg-emerald-50 px-2 py-0.5 rounded-full">
                      <TrendingUp className="w-3 h-3 mr-1" />
                      {stat.change}
                    </span>
                  ) : (
                    <span className="text-gray-400 text-sm">{stat.change}</span>
                  )}
                </div>
                <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2 bg-white/80 backdrop-blur-md rounded-2xl border border-white/20 shadow-xl shadow-black/5 overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">Recent Leads</h2>
                <Link href="/crm" className="text-blue-500 text-sm font-medium hover:text-blue-600">
                  View All
                </Link>
              </div>
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Name</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Service</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Phone</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Location</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Status</th>
                    <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        Loading dashboard...
                      </td>
                    </tr>
                  ) : leads.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                        No leads yet.
                      </td>
                    </tr>
                  ) : (
                    leads.slice(0, 6).map((lead) => (
                      <tr key={lead.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 font-medium text-gray-900">{lead.customer_name || 'Unknown'}</td>
                        <td className="px-6 py-4 text-gray-600">{lead.issue}</td>
                        <td className="px-6 py-4 text-gray-500">{lead.customer_phone || '-'}</td>
                        <td className="px-6 py-4 text-gray-500">{lead.location || '-'}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            lead.status === 'new'
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                              : lead.status === 'in_progress'
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
                                : 'bg-gradient-to-r from-emerald-500 to-green-600 text-white'
                          }`}>
                            {leadStatusLabels[lead.status] || lead.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500 text-sm">
                          {new Date(lead.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="bg-white/80 backdrop-blur-md rounded-2xl p-6 border border-white/20 shadow-xl shadow-black/5">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
              <div className="space-y-3">
                <Link href="/crm" className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 px-4 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg shadow-blue-500/25">
                  <Plus className="w-5 h-5" /> New Lead
                </Link>
                <Link href="/jobs" className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-50 transition">
                  <Plus className="w-5 h-5" /> Quick Add Job
                </Link>
                <Link href="/invoices" className="w-full flex items-center justify-center gap-2 bg-white border border-gray-200 text-gray-700 py-3 px-4 rounded-xl font-medium hover:bg-gray-50 transition">
                  <Plus className="w-5 h-5" /> View Invoices
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
