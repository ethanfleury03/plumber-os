'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Users, Calendar as CalendarIcon } from 'lucide-react';

type Job = {
  id: string;
  description: string;
  service_type: string | null;
  status: string;
  scheduled_at: string | null;
  plumber_id: string | null;
  customer_id: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_address: string | null;
  plumber_name: string | null;
};
type Plumber = { id: string; name: string; specialty: string | null; is_active: number };

export default function DispatchPage() {
  const [day, setDay] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [jobs, setJobs] = useState<Job[]>([]);
  const [plumbers, setPlumbers] = useState<Plumber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/dispatch?day=${day}`, { cache: 'no-store' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed');
      setJobs(json.jobs as Job[]);
      setPlumbers(json.plumbers as Plumber[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setLoading(false);
    }
  }, [day]);

  useEffect(() => {
    load();
  }, [load]);

  const unassigned = useMemo(() => jobs.filter((j) => !j.plumber_id), [jobs]);
  const byPlumber = useMemo(() => {
    const map: Record<string, Job[]> = {};
    for (const j of jobs) {
      if (!j.plumber_id) continue;
      (map[j.plumber_id] ||= []).push(j);
    }
    return map;
  }, [jobs]);

  async function assign(jobId: string, plumberId: string | null) {
    const res = await fetch('/api/dispatch', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId, plumberId }),
    });
    if (!res.ok) alert((await res.json()).error || 'Failed');
    load();
  }

  return (
    <div className="p-6">
      <header className="mb-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Dispatch</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Assign today&apos;s jobs to technicians.
          </p>
        </div>
        <label className="inline-flex items-center gap-2 text-sm">
          <CalendarIcon className="size-4" />
          <input
            type="date"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className="rounded-md border px-2 py-1"
          />
        </label>
      </header>

      {error && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading…
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          <section className="rounded-lg border bg-white">
            <div className="px-3 py-2 border-b font-medium flex items-center gap-2">
              <Users className="size-4" /> Unassigned ({unassigned.length})
            </div>
            <div className="divide-y">
              {unassigned.map((j) => (
                <JobCard key={j.id} job={j} plumbers={plumbers} onAssign={assign} />
              ))}
              {unassigned.length === 0 && (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  Nothing to assign
                </div>
              )}
            </div>
          </section>

          {plumbers.map((p) => (
            <section key={p.id} className="rounded-lg border bg-white">
              <div className="px-3 py-2 border-b font-medium">
                {p.name}{' '}
                <span className="text-xs font-normal text-muted-foreground">
                  {p.specialty || 'Technician'}
                </span>
              </div>
              <div className="divide-y">
                {(byPlumber[p.id] || []).map((j) => (
                  <JobCard key={j.id} job={j} plumbers={plumbers} onAssign={assign} />
                ))}
                {!byPlumber[p.id]?.length && (
                  <div className="p-6 text-center text-sm text-muted-foreground">
                    No jobs
                  </div>
                )}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function JobCard({
  job,
  plumbers,
  onAssign,
}: {
  job: Job;
  plumbers: Plumber[];
  onAssign: (jobId: string, plumberId: string | null) => void;
}) {
  return (
    <div className="p-3 text-sm space-y-1">
      <div className="font-medium truncate">{job.description}</div>
      <div className="text-xs text-muted-foreground">
        {job.service_type || 'Job'} • {job.status}
      </div>
      {job.customer_name && (
        <div className="text-xs truncate">
          {job.customer_name}
          {job.customer_phone ? ` • ${job.customer_phone}` : ''}
        </div>
      )}
      {job.scheduled_at && (
        <div className="text-xs text-muted-foreground">
          {new Date(job.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      )}
      <select
        value={job.plumber_id ?? ''}
        onChange={(e) => onAssign(job.id, e.target.value || null)}
        className="mt-1 w-full rounded-md border px-2 py-1 text-xs"
      >
        <option value="">Unassigned</option>
        {plumbers.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </div>
  );
}
