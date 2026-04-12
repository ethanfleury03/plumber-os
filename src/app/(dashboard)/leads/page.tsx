'use client';

import { useState, useEffect } from 'react';
import { Search, Bell, Plus, MoreHorizontal, MapPin, Phone, Calendar, X } from 'lucide-react';
import { getStatusStyle, leadStatusLabels, sourceLabels } from '@/lib/statusColors';

interface Lead {
  id: string;
  company_id: string;
  customer_id?: string;
  plumber_id?: string;
  source: string;
  status: string;
  priority: number;
  issue: string;
  description?: string;
  location?: string;
  ai_qualification?: unknown;
  ai_score?: number;
  created_at: string;
  updated_at: string;
  // Joined fields (flat from API)
  customer_name?: string;
  customer_phone?: string;
  customer_email?: string;
  customer_address?: string;
  plumber_name?: string;
}

interface LeadStats {
  total: number;
  new: number;
  working: number;
  converted: number;
}



const statusColors: Record<string, string> = {
  new: 'bg-blue-100 text-blue-700',
  qualified: 'bg-purple-100 text-purple-700',
  quoted: 'bg-yellow-100 text-yellow-700',
  booked: 'bg-orange-100 text-orange-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  lost: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  new: 'New',
  qualified: 'Qualified',
  quoted: 'Quoted',
  booked: 'Booked',
  in_progress: 'In Progress',
  completed: 'Completed',
  lost: 'Lost',
};

const sources = ['website', 'phone', 'thumbtack', 'angi', 'google', 'referral'];
const serviceTypes = ['Drain Cleaning', 'Water Heater', 'Leak Repair', 'Pipe Installation', 'Toilet Repair', 'Faucet Repair', 'Sewer Line', 'Other'];

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats>({ total: 0, new: 0, working: 0, converted: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  
  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // New lead form
  const [newLead, setNewLead] = useState({
    issue: '',
    description: '',
    location: '',
    source: 'website',
    priority: 3,
  });

  // Fetch leads from API
  const fetchLeads = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (sourceFilter !== 'all') params.set('source', sourceFilter);
      
      const res = await fetch(`/api/leads?${params}`);
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setLeads(data.leads || []);
        // Calculate stats
        const leadsData = data.leads || [];
        setStats({
          total: data.total || leadsData.length,
          new: leadsData.filter((l: Lead) => l.status === 'new').length,
          working: leadsData.filter((l: Lead) => l.status === 'in_progress').length,
          converted: leadsData.filter((l: Lead) => l.status === 'completed').length,
        });
      }
    } catch (err) {
      setError('Failed to fetch leads');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, sourceFilter]);

  // Filter leads locally (for search)
  const filteredLeads = leads.filter(lead => {
    const searchLower = search.toLowerCase();
    return (
      lead.customer_name?.toLowerCase().includes(searchLower) ||
      lead.customer_phone?.includes(search) ||
      lead.location?.toLowerCase().includes(searchLower) ||
      lead.issue?.toLowerCase().includes(searchLower)
    );
  });

  // Handle create lead
  const handleCreateLead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLead),
      });
      
      const data = await res.json();
      
      if (data.error) {
        alert(data.error);
      } else {
        setShowAddModal(false);
        setNewLead({
          issue: '',
          description: '',
          location: '',
          source: 'website',
          priority: 3,
        });
        fetchLeads();
      }
    } catch (err) {
      alert('Failed to create lead');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (leadId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: leadId, status: newStatus }),
      });
      
      const data = await res.json();
      if (!data.error) {
        fetchLeads();
      }
    } catch (err) {
      console.error('Failed to update lead');
    }
  };

  // Handle delete
  const handleDelete = async (leadId: string) => {
    if (!confirm('Are you sure you want to delete this lead?')) return;
    
    try {
      const res = await fetch(`/api/leads?id=${leadId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.error) {
        fetchLeads();
      }
    } catch (err) {
      console.error('Failed to delete lead');
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-gray-50">
      <main className="flex-1 min-h-0 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Leads</h1>
            <p className="text-gray-500 text-sm">Manage and track your leads</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search leads..."
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
          {/* Stats Cards */}
          <div className="grid grid-cols-4 gap-6 mb-6">
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-sm mb-1">Total Leads</p>
              <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.total}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-sm mb-1">New</p>
              <p className="text-3xl font-bold text-blue-600">{loading ? '...' : stats.new}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-sm mb-1">In Progress</p>
              <p className="text-3xl font-bold text-yellow-600">{loading ? '...' : stats.working}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-sm mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-600">{loading ? '...' : stats.converted}</p>
            </div>
          </div>

          {/* Filters & Add Button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <select 
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Sources</option>
                {sources.map(source => (
                  <option key={source} value={source}>{source.charAt(0).toUpperCase() + source.slice(1)}</option>
                ))}
              </select>
              
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="new">New</option>
                <option value="qualified">Qualified</option>
                <option value="quoted">Quoted</option>
                <option value="booked">Booked</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="lost">Lost</option>
              </select>
            </div>
            
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition"
            >
              <Plus className="w-5 h-5" /> New Lead
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Leads Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Name</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Service Type</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Phone</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Location</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Date</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Loading leads...
                    </td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No leads found. {search && 'Try a different search.'}
                    </td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{lead.customer_name || '-'}</p>
                          <p className="text-xs text-gray-500 capitalize">{lead.source}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{lead.issue || '-'}</td>
                      <td className="px-6 py-4">
                        <a href={`tel:${lead.customer_phone}`} className="text-blue-600 hover:underline">
                          {lead.customer_phone || '-'}
                        </a>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{lead.location || '-'}</td>
                      <td className="px-6 py-4">
                        <select
                          value={lead.status}
                          onChange={(e) => handleStatusChange(lead.id, e.target.value)}
                          className="px-3 py-1 rounded-full text-xs font-medium cursor-pointer"
                          style={{ 
                            backgroundColor: lead.status === 'new' ? '#dbeafe' : lead.status === 'in_progress' ? '#fef3c7' : lead.status === 'completed' ? '#dcfce7' : '#f3f4f6',
                            color: lead.status === 'new' ? '#1d4ed8' : lead.status === 'in_progress' ? '#b45309' : lead.status === 'completed' ? '#15803d' : '#6b7280'
                          }}
                        >
                          <option value="new">New</option>
                          <option value="qualified">Qualified</option>
                          <option value="quoted">Quoted</option>
                          <option value="booked">Booked</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="lost">Lost</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-gray-500 text-sm">
                        {formatDate(lead.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => handleDelete(lead.id)}
                            className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Add Lead Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Add New Lead</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleCreateLead} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Issue/Service Needed *</label>
                <input
                  type="text"
                  required
                  value={newLead.issue}
                  onChange={(e) => setNewLead({ ...newLead, issue: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Drain Cleaning, Water Heater, etc."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newLead.description}
                  onChange={(e) => setNewLead({ ...newLead, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe the issue..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <input
                    type="text"
                    required
                    value={newLead.location}
                    onChange={(e) => setNewLead({ ...newLead, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brooklyn, NY"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <select
                    value={newLead.source}
                    onChange={(e) => setNewLead({ ...newLead, source: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {sources.map(source => (
                      <option key={source} value={source}>{source.charAt(0).toUpperCase() + source.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}