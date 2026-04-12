'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Bell, MoreHorizontal, Calendar, User, FileText } from 'lucide-react';

interface Invoice {
  id: string;
  invoice_number: string;
  customers?: { name?: string; email?: string; phone?: string } | null;
  service_type?: string | null;
  issue_date: string;
  amount: number;
  tax?: number | null;
  total?: number | null;
  status: 'pending' | 'paid' | 'overdue' | 'cancelled';
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  paid: 'bg-green-100 text-green-700',
  overdue: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-700',
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled',
};

const navItems = [
  { icon: '📊', label: 'Dashboard', href: '/' },
  { icon: '🎯', label: 'CRM', href: '/crm' },
  { icon: '💼', label: 'Jobs', href: '/jobs' },
  { icon: '👥', label: 'Customers', href: '/customers' },
  { icon: '📄', label: 'Invoices', href: '/invoices' },
  { icon: '📅', label: 'Calendar', href: '/calendar' },
  { icon: '📍', label: 'Map', href: '/map' },
  { icon: '👨🔧', label: 'Team', href: '/team' },
  { icon: '📞', label: 'Calls', href: '/calls' },
  { icon: '⚙️', label: 'Settings', href: '/settings' },
];

export default function InvoicesPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const pathname = usePathname();

  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'pending', label: 'Pending' },
    { id: 'paid', label: 'Paid' },
    { id: 'overdue', label: 'Overdue' },
  ];

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/invoices?limit=200');
        const data = await res.json();

        if (data.error) {
          setError(data.error);
          return;
        }

        setInvoices(data.invoices || []);
      } catch {
        setError('Failed to fetch invoices');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, []);

  const filteredInvoices = invoices.filter(inv => {
    const matchesTab = activeTab === 'all' || inv.status === activeTab;
    const customerName = inv.customers?.name || '';
    const matchesSearch = customerName.toLowerCase().includes(search.toLowerCase()) ||
                         inv.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
                         (inv.service_type || '').toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const stats = useMemo(() => {
    const sumByStatus = (status: Invoice['status']) =>
      invoices
        .filter((invoice) => invoice.status === status)
        .reduce((sum, invoice) => sum + Number(invoice.total ?? invoice.amount ?? 0), 0);

    const countByStatus = (status: Invoice['status']) =>
      invoices.filter((invoice) => invoice.status === status).length;

    return {
      total: invoices.length,
      pending: { count: countByStatus('pending'), amount: sumByStatus('pending') },
      paid: { count: countByStatus('paid'), amount: sumByStatus('paid') },
      overdue: { count: countByStatus('overdue'), amount: sumByStatus('overdue') },
    };
  }, [invoices]);

  const formatCurrency = (value: number) => `$${value.toLocaleString()}`;
  const formatDate = (value: string) =>
    new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="sidebar w-56 text-white flex flex-col flex-shrink-0">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
              <span className="text-lg font-bold">P</span>
            </div>
            <span className="text-lg font-semibold">PlumberOS</span>
          </div>
        </div>
        
        <nav className="flex-1 px-4">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                pathname === item.href
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <span>{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
        
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-sm">AK</span>
            </div>
            <div>
              <p className="font-medium text-sm">Akshay K.</p>
              <p className="text-xs text-gray-400">Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Invoices</h1>
            <p className="text-gray-500 text-sm">Manage and track your invoices</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search invoices..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm w-64 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <button className="p-2 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        <div className="p-8">
          {/* Stats Bar */}
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-sm">Total Invoices</p>
              <p className="text-2xl font-bold text-gray-900">{loading ? '...' : stats.total}</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-sm">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{loading ? '...' : formatCurrency(stats.pending.amount)}</p>
              <p className="text-xs text-gray-500">{loading ? '...' : stats.pending.count} invoices</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-sm">Paid</p>
              <p className="text-2xl font-bold text-green-600">{loading ? '...' : formatCurrency(stats.paid.amount)}</p>
              <p className="text-xs text-gray-500">{loading ? '...' : stats.paid.count} invoices</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-sm">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{loading ? '...' : formatCurrency(stats.overdue.amount)}</p>
              <p className="text-xs text-gray-500">{loading ? '...' : stats.overdue.count} invoices</p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Tabs */}
          <div className="bg-white rounded-xl p-1 border border-gray-200 mb-6 inline-flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Invoices List */}
          <div className="space-y-4">
            {loading && (
              <div className="bg-white rounded-xl p-8 border border-gray-100 shadow-sm text-center text-gray-500">
                Loading invoices...
              </div>
            )}

            {filteredInvoices.map((inv) => (
              <div key={inv.id} className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between">
                  {/* Invoice # */}
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{inv.invoice_number}</h3>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <User className="w-3 h-3" />
                        {inv.customers?.name || 'Unknown customer'}
                      </div>
                    </div>
                  </div>

                  {/* Service Type */}
                  <div className="text-center px-4">
                    <p className="text-sm text-gray-500">Service</p>
                    <p className="font-medium text-gray-900">{inv.service_type || 'General Service'}</p>
                  </div>

                  {/* Date */}
                  <div className="text-center px-4">
                    <p className="text-sm text-gray-500">Date</p>
                    <div className="flex items-center gap-1 justify-center">
                      <Calendar className="w-3 h-3 text-gray-400" />
                      <p className="font-medium text-gray-900">{formatDate(inv.issue_date)}</p>
                    </div>
                  </div>

                  {/* Status */}
                  <div className="px-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[inv.status]}`}>
                      {statusLabels[inv.status]}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="text-center px-4">
                    <p className="text-sm text-gray-500">Amount</p>
                    <p className="text-xl font-bold text-gray-900">{formatCurrency(Number(inv.total ?? inv.amount ?? 0))}</p>
                  </div>

                  {/* Actions */}
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {!loading && filteredInvoices.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No invoices found</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
