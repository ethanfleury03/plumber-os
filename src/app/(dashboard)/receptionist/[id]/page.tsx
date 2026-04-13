'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Bot,
  Briefcase,
  Calendar,
  Loader2,
  Phone,
  RefreshCw,
  UserPlus,
} from 'lucide-react';

interface Segment {
  id: string;
  seq: number;
  speaker: string;
  text: string;
  created_at: string;
}

interface EventRow {
  id: string;
  event_type: string;
  payload_json: string | null;
  source?: string | null;
  created_at: string;
}

interface ToolInvocationRow {
  id: string;
  tool_name: string;
  request_json: string | null;
  response_json: string | null;
  status: string;
  created_at: string;
}

interface BookingRow {
  id: string;
  booking_type: string;
  status: string;
  notes: string | null;
  scheduled_start: string | null;
  job_id: string | null;
}

export default function ReceptionistCallDetailPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : '';

  const [detail, setDetail] = useState<{
    call: Record<string, unknown>;
    segments: Segment[];
    events: EventRow[];
    bookings: BookingRow[];
    toolInvocations: ToolInvocationRow[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    const res = await fetch(`/api/receptionist/calls/${id}`);
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    setDetail({
      call: data.call,
      segments: data.segments || [],
      events: data.events || [],
      bookings: data.bookings || [],
      toolInvocations: data.toolInvocations || [],
    });
  }, [id]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await load();
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const runAction = async (path: string, method = 'POST') => {
    setBusy(true);
    setActionMsg('');
    try {
      const res = await fetch(path, { method });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setActionMsg('Saved.');
      await load();
    } catch (e) {
      setActionMsg(e instanceof Error ? e.message : 'Action failed');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" aria-hidden />
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center bg-gray-50 gap-4">
        <p className="text-red-600">{error || 'Not found'}</p>
        <Link href="/receptionist" className="text-indigo-600 font-medium">
          Back to receptionist
        </Link>
      </div>
    );
  }

  const { call, segments, events, bookings, toolInvocations } = detail;
  const isRetell = call.provider === 'retell';
  let extracted: Record<string, unknown> | null = null;
  try {
    extracted = call.extracted_json ? (JSON.parse(call.extracted_json as string) as Record<string, unknown>) : null;
  } catch {
    extracted = null;
  }

  const disposition = call.disposition as string | null;
  const isEmergency = disposition === 'emergency';

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-gradient-to-br from-slate-50 via-gray-100 to-slate-100">
      <main className="flex-1 overflow-auto">
        <header className="header px-6 py-4 border-b border-gray-200/80 bg-white/70 backdrop-blur">
          <Link
            href="/receptionist"
            className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-3"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden />
            Receptionist
          </Link>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
                <Bot className="w-7 h-7 text-indigo-600" aria-hidden />
                Call detail
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {(call.caller_name as string) || 'Unknown'} · {(call.from_phone as string) || '—'} ·{' '}
                <span className="font-mono text-xs">{id}</span>
              </p>
              {call.recording_url ? (
                <p className="text-sm mt-2">
                  <a
                    href={String(call.recording_url)}
                    className="text-indigo-600 font-medium hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open recording
                  </a>
                </p>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-800">
                {String(call.provider || 'mock')}
              </span>
              {call.provider_call_id ? (
                <span className="px-3 py-1 rounded-full text-xs font-mono bg-gray-100 text-gray-700 max-w-[220px] truncate" title={String(call.provider_call_id)}>
                  Retell: {String(call.provider_call_id)}
                </span>
              ) : null}
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  call.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
                }`}
              >
                {String(call.status)}
              </span>
              {disposition ? (
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isEmergency ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {disposition}
                </span>
              ) : null}
            </div>
          </div>
        </header>

        <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto">
          {isEmergency ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 flex items-start gap-3 text-red-900">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" aria-hidden />
              <div>
                <p className="font-semibold">Emergency flagged</p>
                <p className="text-sm text-red-800">Prioritize on-call dispatch and confirm safety (gas/water).</p>
              </div>
            </div>
          ) : null}

          {actionMsg ? (
            <div
              className={`text-sm px-4 py-2 rounded-lg ${actionMsg === 'Saved.' ? 'bg-emerald-50 text-emerald-800' : 'bg-red-50 text-red-700'}`}
            >
              {actionMsg}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => void runAction(`/api/receptionist/calls/${id}/lead`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
            >
              <UserPlus className="w-4 h-4" aria-hidden />
              Create / link lead
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void runAction(`/api/receptionist/calls/${id}/book-callback`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
            >
              <Phone className="w-4 h-4" aria-hidden />
              Book callback
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void runAction(`/api/receptionist/calls/${id}/book-quote`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
            >
              <Calendar className="w-4 h-4" aria-hidden />
              Book quote visit
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void runAction(`/api/receptionist/calls/${id}/emergency`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
            >
              <AlertTriangle className="w-4 h-4" aria-hidden />
              Mark emergency
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void runAction(`/api/receptionist/calls/${id}/spam`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700 text-white text-sm font-medium hover:bg-slate-800 disabled:opacity-50"
            >
              <Ban className="w-4 h-4" aria-hidden />
              Mark spam
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => void runAction(`/api/receptionist/calls/${id}/reprocess`)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50"
            >
              <RefreshCw className="w-4 h-4" aria-hidden />
              Reprocess
            </button>
            {isRetell && call.provider_call_id ? (
              <button
                type="button"
                disabled={busy}
                onClick={() => void runAction(`/api/receptionist/providers/retell/sync/${id}`)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-violet-700 hover:bg-violet-50 disabled:opacity-50"
              >
                <RefreshCw className="w-4 h-4" aria-hidden />
                Sync from Retell
              </button>
            ) : null}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white/90 rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Summary</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {(call.ai_summary as string) || '—'}
              </p>
              <p className="text-sm text-gray-600 mt-4">
                <span className="font-medium text-gray-900">Recommended next step:</span>{' '}
                {(call.recommended_next_step as string) || '—'}
              </p>
            </div>

            <div className="bg-white/90 rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Extracted details</h2>
              {extracted ? (
                <dl className="space-y-2 text-sm">
                  {Object.entries(extracted).map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <dt className="text-gray-500 w-40 flex-shrink-0">{k}</dt>
                      <dd className="text-gray-900 break-words">{typeof v === 'object' ? JSON.stringify(v) : String(v)}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="text-sm text-gray-500">No extracted data yet.</p>
              )}
            </div>
          </div>

          <div className="bg-white/90 rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Transcript</h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {segments.length === 0 && !(call.transcript_text as string)?.trim() ? (
                <p className="text-sm text-gray-500">No transcript yet.</p>
              ) : null}
              {segments.length === 0 && (call.transcript_text as string)?.trim() ? (
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
                  {String(call.transcript_text)}
                </pre>
              ) : null}
              {segments.length > 0 ? (
                segments.map((s) => (
                  <div
                    key={s.id}
                    className={`rounded-lg px-3 py-2 text-sm ${
                      s.speaker === 'assistant' ? 'bg-indigo-50 text-indigo-900' : 'bg-gray-50 text-gray-900'
                    }`}
                  >
                    <span className="text-xs font-semibold uppercase text-gray-500">{s.speaker}</span>
                    <p className="mt-1">{s.text}</p>
                  </div>
                ))
              ) : null}
            </div>
          </div>

          {toolInvocations.length > 0 ? (
            <div className="bg-white/90 rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Tool invocations (Retell)</h2>
              <ul className="space-y-3 text-sm">
                {toolInvocations.map((t) => (
                  <li key={t.id} className="border-b border-gray-100 pb-3">
                    <span className="font-medium text-gray-900">{t.tool_name}</span>
                    <span className="text-gray-400 text-xs ml-2">{t.status}</span>
                    <span className="text-gray-400 text-xs ml-2">{new Date(t.created_at).toLocaleString()}</span>
                    {t.request_json ? (
                      <pre className="text-xs text-gray-500 mt-1 overflow-x-auto max-h-24">{t.request_json}</pre>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="bg-white/90 rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Briefcase className="w-5 h-5" aria-hidden />
              Bookings &amp; links
            </h2>
            {call.lead_id ? (
              <p className="text-sm mb-2">
                <span className="text-gray-500">Lead:</span>{' '}
                <Link href="/crm" className="text-indigo-600 font-medium">
                  {String(call.lead_id)}
                </Link>{' '}
                <span className="text-gray-400">(open CRM board)</span>
              </p>
            ) : (
              <p className="text-sm text-gray-500 mb-2">No lead linked.</p>
            )}
            {call.job_id ? (
              <p className="text-sm mb-2">
                <span className="text-gray-500">Job:</span>{' '}
                <Link href="/jobs" className="text-indigo-600 font-medium">
                  {String(call.job_id)}
                </Link>
              </p>
            ) : null}
            {bookings.length === 0 ? (
              <p className="text-sm text-gray-500">No receptionist bookings.</p>
            ) : (
              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {bookings.map((b) => (
                  <li key={b.id}>
                    {b.booking_type} — {b.status}
                    {b.scheduled_start ? ` · ${b.scheduled_start}` : ''}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-white/90 rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Event timeline</h2>
            <ul className="space-y-2 text-sm">
              {events.length === 0 ? (
                <li className="text-gray-500">No events.</li>
              ) : (
                events.map((ev) => (
                  <li key={ev.id} className="border-b border-gray-100 pb-2">
                    <span className="font-medium text-gray-900">{ev.event_type}</span>
                    {ev.source ? (
                      <span className="text-gray-500 text-xs ml-2">({ev.source})</span>
                    ) : null}
                    <span className="text-gray-400 text-xs ml-2">{new Date(ev.created_at).toLocaleString()}</span>
                    {ev.payload_json ? (
                      <pre className="text-xs text-gray-500 mt-1 overflow-x-auto">{ev.payload_json}</pre>
                    ) : null}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
