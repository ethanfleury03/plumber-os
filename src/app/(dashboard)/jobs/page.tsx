'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Search, Bell, Plus, MoreHorizontal, Calendar, Clock, MapPin, X, FileSpreadsheet } from 'lucide-react';

interface Job {
  id: string;
  company_id: string;
  lead_id?: string;
  customer_id?: string;
  plumber_id?: string;
  status: string;
  type: string;
  description?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  started_at?: string;
  completed_at?: string;
  estimated_price?: number;
  final_price?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  customer_name?: string;
  customer_phone?: string;
  customer_address?: string;
  plumber_name?: string;
  lead_issue?: string;
  source_estimate_id?: string | null;
}

interface JobStats {
  total: number;
  scheduled: number;
  in_progress: number;
  completed: number;
}



const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-700',
  in_progress: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

const statusLabels: Record<string, string> = {
  scheduled: 'Scheduled',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
};

const jobTypes = ['Drain Cleaning', 'Water Heater', 'Leak Repair', 'Pipe Installation', 'Toilet Repair', 'Faucet Repair', 'Sewer Line', 'Other'];

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [stats, setStats] = useState<JobStats>({ total: 0, scheduled: 0, in_progress: 0, completed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // New job form
  const [newJob, setNewJob] = useState({
    type: '',
    description: '',
    scheduled_date: '',
    scheduled_time: '',
    estimated_price: 0,
    notes: '',
  });

  // Fetch jobs from API
  const fetchJobs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      
      const res = await fetch(`/api/jobs?${params}`);
      const data = await res.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setJobs(data.jobs || []);
        // Calculate stats
        const jobsData = data.jobs || [];
        setStats({
          total: data.total || jobsData.length,
          scheduled: jobsData.filter((j: Job) => j.status === 'scheduled').length,
          in_progress: jobsData.filter((j: Job) => j.status === 'in_progress').length,
          completed: jobsData.filter((j: Job) => j.status === 'completed').length,
        });
      }
    } catch (err) {
      setError('Failed to fetch jobs');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [statusFilter]);

  // Filter jobs locally (for search)
  const filteredJobs = jobs.filter(job => {
    const searchLower = search.toLowerCase();
    return (
      job.customer_name?.toLowerCase().includes(searchLower) ||
      job.type?.toLowerCase().includes(searchLower) ||
      job.description?.toLowerCase().includes(searchLower) ||
      job.plumber_name?.toLowerCase().includes(searchLower)
    );
  });

  // Handle create job
  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newJob),
      });
      
      const data = await res.json();
      
      if (data.error) {
        alert(data.error);
      } else {
        setShowAddModal(false);
        setNewJob({
          type: '',
          description: '',
          scheduled_date: '',
          scheduled_time: '',
          estimated_price: 0,
          notes: '',
        });
        fetchJobs();
      }
    } catch (err) {
      alert('Failed to create job');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle status change
  const handleStatusChange = async (jobId: string, newStatus: string) => {
    try {
      const res = await fetch('/api/jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: jobId, status: newStatus }),
      });
      
      const data = await res.json();
      if (!data.error) {
        fetchJobs();
      }
    } catch (err) {
      console.error('Failed to update job');
    }
  };

  // Handle delete
  const handleDelete = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;
    
    try {
      const res = await fetch(`/api/jobs?id=${jobId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!data.error) {
        fetchJobs();
      }
    } catch (err) {
      console.error('Failed to delete job');
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Format price
  const formatPrice = (price: number) => {
    if (!price) return '-';
    return `$${price.toLocaleString()}`;
  };

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-gray-50">
      <main className="flex-1 min-h-0 overflow-auto">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Jobs</h1>
            <p className="text-gray-500 text-sm">Manage and track your jobs</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search jobs..."
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
              <p className="text-gray-500 text-sm mb-1">Total Jobs</p>
              <p className="text-3xl font-bold text-gray-900">{loading ? '...' : stats.total}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-sm mb-1">Scheduled</p>
              <p className="text-3xl font-bold text-blue-600">{loading ? '...' : stats.scheduled}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-sm mb-1">In Progress</p>
              <p className="text-3xl font-bold text-yellow-600">{loading ? '...' : stats.in_progress}</p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm">
              <p className="text-gray-500 text-sm mb-1">Completed</p>
              <p className="text-3xl font-bold text-green-600">{loading ? '...' : stats.completed}</p>
            </div>
          </div>

          {/* Filters & Add Button */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <select 
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="scheduled">Scheduled</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            
            <button 
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition"
            >
              <Plus className="w-5 h-5" /> New Job
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          {/* Jobs Table */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Customer</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Service Type</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Scheduled</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Plumber</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Price</th>
                  <th className="text-left px-6 py-4 text-sm font-medium text-gray-500">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      Loading jobs...
                    </td>
                  </tr>
                ) : filteredJobs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                      No jobs found. {search && 'Try a different search.'}
                    </td>
                  </tr>
                ) : (
                  filteredJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900">{job.customer_name || '-'}</p>
                          <p className="text-xs text-gray-500">{job.customer_address || '-'}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{job.type || '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="w-4 h-4" />
                          {formatDate(job.scheduled_date || '')}
                          {job.scheduled_time && (
                            <>
                              <Clock className="w-4 h-4 ml-2" />
                              {job.scheduled_time}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{job.plumber_name || 'Unassigned'}</td>
                      <td className="px-6 py-4 text-gray-900 font-medium">{formatPrice(job.estimated_price || 0)}</td>
                      <td className="px-6 py-4">
                        <select
                          value={job.status}
                          onChange={(e) => handleStatusChange(job.id, e.target.value)}
                          className="px-3 py-1 rounded-full text-xs font-medium cursor-pointer"
                          style={{ 
                            backgroundColor: job.status === 'scheduled' ? '#dbeafe' : job.status === 'in_progress' ? '#fef3c7' : job.status === 'completed' ? '#dcfce7' : '#f3f4f6',
                            color: job.status === 'scheduled' ? '#1d4ed8' : job.status === 'in_progress' ? '#b45309' : job.status === 'completed' ? '#15803d' : '#6b7280'
                          }}
                        >
                          <option value="scheduled">Scheduled</option>
                          <option value="in_progress">In Progress</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/estimates/new?job_id=${encodeURIComponent(job.id)}`}
                            className="p-2 hover:bg-blue-50 rounded-lg text-gray-400 hover:text-blue-600"
                            title="New estimate from job"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                          </Link>
                          {job.source_estimate_id ? (
                            <Link
                              href={`/estimates/${job.source_estimate_id}`}
                              className="text-xs text-blue-600 font-medium hover:underline px-1"
                            >
                              Estimate
                            </Link>
                          ) : null}
                          <button 
                            onClick={() => handleDelete(job.id)}
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

      {/* Add Job Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Add New Job</h2>
              <button 
                onClick={() => setShowAddModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            
            <form onSubmit={handleCreateJob} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Type *</label>
                <select
                  required
                  value={newJob.type}
                  onChange={(e) => setNewJob({ ...newJob, type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select service...</option>
                  {jobTypes.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newJob.description}
                  onChange={(e) => setNewJob({ ...newJob, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Describe the job..."
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Date</label>
                  <input
                    type="date"
                    value={newJob.scheduled_date}
                    onChange={(e) => setNewJob({ ...newJob, scheduled_date: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Scheduled Time</label>
                  <input
                    type="time"
                    value={newJob.scheduled_time}
                    onChange={(e) => setNewJob({ ...newJob, scheduled_time: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Price ($)</label>
                <input
                  type="number"
                  value={newJob.estimated_price}
                  onChange={(e) => setNewJob({ ...newJob, estimated_price: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  value={newJob.notes}
                  onChange={(e) => setNewJob({ ...newJob, notes: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                  placeholder="Additional notes..."
                />
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
                  {submitting ? 'Creating...' : 'Create Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}