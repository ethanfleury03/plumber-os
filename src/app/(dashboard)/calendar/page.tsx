'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, Bell, ChevronLeft, ChevronRight, Clock, MapPin, User, X } from 'lucide-react';

interface Job {
  id: string;
  type: string;
  customer_name?: string;
  customer_address?: string;
  plumber_name?: string;
  scheduled_date?: string;
  scheduled_time?: string;
  status: string;
  description?: string;
}



const formatDate = (date: Date) => date.toISOString().split('T')[0];

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [jobs, setJobs] = useState<Job[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/jobs?limit=200');
        const data = await res.json();

        if (data.error) {
          setError(data.error);
          return;
        }

        setJobs(data.jobs || []);
      } catch {
        setError('Failed to fetch jobs');
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  const daysOfWeek = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());

    return Array.from({ length: 7 }, (_, index) => {
      const day = new Date(start);
      day.setDate(start.getDate() + index);
      return day;
    });
  }, [currentDate]);

  const today = formatDate(new Date());
  const monthYear = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const filteredJobs = jobs.filter((job) => {
    const searchLower = search.toLowerCase();
    return (
      job.type.toLowerCase().includes(searchLower) ||
      (job.customer_name || '').toLowerCase().includes(searchLower) ||
      (job.customer_address || '').toLowerCase().includes(searchLower) ||
      (job.plumber_name || '').toLowerCase().includes(searchLower)
    );
  });

  const getJobsForDay = (date: Date) =>
    filteredJobs.filter((job) => job.scheduled_date === formatDate(date));

  const navigatePrev = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const navigateNext = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(newDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-gray-50">
      <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between flex-shrink-0">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Calendar</h1>
            <p className="text-gray-500 text-sm">Schedule and manage appointments</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm w-48 text-gray-900"
              />
            </div>
            <button className="p-1.5 hover:bg-gray-100 rounded-lg relative">
              <Bell className="w-4 h-4 text-gray-600" />
              <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            </button>
          </div>
        </header>

        <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={navigatePrev} className="p-1.5 hover:bg-gray-100 rounded">
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h2 className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">{monthYear}</h2>
            <button onClick={navigateNext} className="p-1.5 hover:bg-gray-100 rounded">
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
          <button onClick={() => setCurrentDate(new Date())} className="text-sm text-blue-600 hover:text-blue-700 font-medium">
            Today
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4">
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="grid grid-cols-7 gap-2 min-h-[500px]">
            {daysOfWeek.map((day, index) => {
              const isToday = formatDate(day) === today;
              return (
                <div key={index} className={`text-center py-2 font-medium text-sm ${isToday ? 'bg-blue-500 text-white rounded-t-lg' : 'text-gray-600'}`}>
                  {day.toLocaleDateString('en-US', { weekday: 'short' })}
                  <div className={`text-lg font-bold ${isToday ? 'text-white' : ''}`}>{day.getDate()}</div>
                </div>
              );
            })}

            {daysOfWeek.map((day, index) => {
              const dayJobs = getJobsForDay(day);
              const isToday = formatDate(day) === today;
              return (
                <div
                  key={index}
                  className={`min-h-[200px] p-2 rounded-lg border ${isToday ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}
                >
                  {loading ? (
                    <div className="text-center text-gray-400 text-xs py-4">Loading...</div>
                  ) : (
                    dayJobs.map((job) => (
                      <div
                        key={job.id}
                        onClick={() => setSelectedJob(job)}
                        className={`p-2 mb-2 rounded text-xs cursor-pointer hover:shadow-md transition-shadow ${
                          job.status === 'in_progress'
                            ? 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                            : job.status === 'completed'
                              ? 'bg-green-100 text-green-800 border border-green-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        <div className="font-semibold truncate">{job.scheduled_time || 'Any time'}</div>
                        <div className="font-medium truncate">{job.type}</div>
                        <div className="truncate opacity-75">{job.customer_name || 'Unassigned customer'}</div>
                      </div>
                    ))
                  )}
                  {!loading && dayJobs.length === 0 && <div className="text-center text-gray-400 text-xs py-4">No jobs</div>}
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {selectedJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedJob(null)}>
          <div className="bg-white rounded-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Job Details</h3>
              <button onClick={() => setSelectedJob(null)} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <h4 className="text-lg font-bold text-gray-900">{selectedJob.type}</h4>
                <p className="text-blue-600 font-medium">{selectedJob.customer_name || 'Unassigned customer'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{selectedJob.scheduled_time || 'Any time'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-700">{selectedJob.customer_address || 'No address'}</span>
                </div>
                {selectedJob.plumber_name && (
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700">{selectedJob.plumber_name}</span>
                  </div>
                )}
              </div>
              {selectedJob.description && (
                <div className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{selectedJob.description}</div>
              )}
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                selectedJob.status === 'scheduled'
                  ? 'bg-blue-100 text-blue-700'
                  : selectedJob.status === 'in_progress'
                    ? 'bg-yellow-100 text-yellow-700'
                    : selectedJob.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
              }`}>
                {selectedJob.status.charAt(0).toUpperCase() + selectedJob.status.slice(1).replace('_', ' ')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
