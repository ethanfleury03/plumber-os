'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  AlertTriangle,
  Bot,
  ChevronRight,
  Loader2,
  PhoneCall,
  Play,
  RefreshCw,
  Settings,
  SkipForward,
} from 'lucide-react';

interface ScenarioRow {
  id: string;
  name: string;
  description: string | null;
  expected_outcome: string | null;
}

interface DashboardCall {
  id: string;
  provider?: string | null;
  provider_status?: string | null;
  caller_name: string | null;
  from_phone: string | null;
  lead_issue: string | null;
  urgency: string | null;
  disposition: string | null;
  status: string;
  started_at: string;
  ai_summary: string | null;
  extracted_json: string | null;
  recommended_next_step: string | null;
  receptionist_meta_json?: string | null;
}

interface IntegrationSummary {
  providerType: string;
  retellReady: boolean;
  twilioReady: boolean;
  toolSecretSet: boolean;
  appBaseUrl: string;
  voiceWebhookPath: string;
  retellWebhookPath: string;
}

interface Extracted {
  callerName?: string | null;
  phone?: string | null;
  address?: string | null;
  issueType?: string | null;
  issueDescription?: string | null;
  urgency?: string;
  preferredCallbackWindow?: string | null;
  preferredVisitWindow?: string | null;
  emergencyDetected?: boolean;
  summary?: string;
  nextStep?: string;
}

function parseExtracted(json: string | null | undefined): Extracted | null {
  if (!json) return null;
  try {
    return JSON.parse(json) as Extracted;
  } catch {
    return null;
  }
}

function dispositionBadge(d: string | null) {
  if (!d) return 'bg-gray-100 text-gray-700';
  if (d === 'emergency') return 'bg-red-100 text-red-800 border border-red-200';
  if (d === 'spam') return 'bg-slate-200 text-slate-700';
  if (d === 'follow_up_needed') return 'bg-amber-50 text-amber-900 border border-amber-200';
  if (d === 'callback_booked' || d === 'quote_visit_booked') return 'bg-emerald-100 text-emerald-800';
  return 'bg-blue-50 text-blue-800';
}

function metaChecklistIncomplete(json: string | null | undefined): boolean {
  if (!json?.trim()) return false;
  try {
    const o = JSON.parse(json) as { completeness?: { sufficient?: boolean } };
    return o.completeness?.sufficient === false;
  } catch {
    return false;
  }
}

function metaCallerBehavior(json: string | null | undefined): string | null {
  if (!json?.trim()) return null;
  try {
    const o = JSON.parse(json) as { callerBehavior?: string };
    return o.callerBehavior || null;
  } catch {
    return null;
  }
}

function metaOperationalPriority(json: string | null | undefined): string | null {
  if (!json?.trim()) return null;
  try {
    const o = JSON.parse(json) as { operationalPriority?: string };
    return o.operationalPriority || null;
  } catch {
    return null;
  }
}

function behaviorBadge(b: string | null): { className: string; label: string } | null {
  if (!b) return null;
  if (b === 'abusive_but_legitimate') return { className: 'bg-orange-100 text-orange-800', label: 'abusive' };
  if (b === 'emergency_legitimate') return { className: 'bg-red-50 text-red-700', label: 'emerg.' };
  if (b === 'spam_or_prank') return { className: 'bg-gray-200 text-gray-600', label: 'spam' };
  return null;
}

function urgentBadge(p: string | null): { className: string; label: string } | null {
  if (!p) return null;
  if (p.startsWith('emergency')) return { className: 'bg-red-100 text-red-800', label: 'urgent' };
  if (p === 'urgent_follow_up') return { className: 'bg-amber-100 text-amber-900', label: 'urgent' };
  return null;
}

export default function ReceptionistDashboardPage() {
  const [stats, setStats] = useState({
    totalCalls: 0,
    activeCalls: 0,
    callbackBookings: 0,
    quoteVisitBookings: 0,
    emergenciesFlagged: 0,
    followUpNeeded: 0,
    spamCalls: 0,
    incompleteChecklist: 0,
    urgentActionNeeded: 0,
    abusiveButLegitimate: 0,
  });
  const [recentCalls, setRecentCalls] = useState<DashboardCall[]>([]);
  const [integration, setIntegration] = useState<IntegrationSummary | null>(null);
  const [scenarios, setScenarios] = useState<ScenarioRow[]>([]);
  const [scenarioId, setScenarioId] = useState('');
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [activeDetail, setActiveDetail] = useState<{
    transcript_text: string | null;
    status: string;
    extracted_json: string | null;
    recommended_next_step: string | null;
    disposition: string | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [streaming, setStreaming] = useState(false);
  const streamRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activeCallIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeCallIdRef.current = activeCallId;
  }, [activeCallId]);

  const loadDashboard = useCallback(async () => {
    const res = await fetch('/api/receptionist/dashboard');
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    setStats(data.stats);
    setRecentCalls(data.recentCalls || []);
    setIntegration(data.integration ?? null);
  }, []);

  const loadScenarios = useCallback(async () => {
    const res = await fetch('/api/receptionist/scenarios');
    const data = await res.json();
    if (data.error) throw new Error(data.error);
    const list = data.scenarios || [];
    setScenarios(list);
    setScenarioId((prev) => prev || list[0]?.id || '');
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await Promise.all([loadDashboard(), loadScenarios()]);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadDashboard, loadScenarios]);

  useEffect(() => {
    const id = setInterval(() => {
      void loadDashboard();
    }, 5000);
    return () => clearInterval(id);
  }, [loadDashboard]);

  const refreshActiveDetail = useCallback(async (callId: string) => {
    const res = await fetch(`/api/receptionist/calls/${callId}`);
    const data = await res.json();
    if (data.error) return;
    setActiveDetail({
      transcript_text: data.call?.transcript_text ?? null,
      status: data.call?.status ?? '',
      extracted_json: data.call?.extracted_json ?? null,
      recommended_next_step: data.call?.recommended_next_step ?? null,
      disposition: data.call?.disposition ?? null,
    });
  }, []);

  useEffect(() => {
    if (!activeCallId) {
      setActiveDetail(null);
      return;
    }
    void refreshActiveDetail(activeCallId);
  }, [activeCallId, refreshActiveDetail]);

  const stopStream = useCallback(() => {
    if (streamRef.current) {
      clearInterval(streamRef.current);
      streamRef.current = null;
    }
    setStreaming(false);
  }, []);

  useEffect(() => () => stopStream(), []);

  const startMock = async () => {
    if (!scenarioId) return;
    setError('');
    setBusy(true);
    stopStream();
    try {
      const res = await fetch('/api/receptionist/mock/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setActiveCallId(data.call.id);
      await refreshActiveDetail(data.call.id);
      await loadDashboard();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Start failed');
    } finally {
      setBusy(false);
    }
  };

  const advanceOnce = async () => {
    if (!activeCallId) return;
    setBusy(true);
    try {
      const res = await fetch('/api/receptionist/mock/advance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId: activeCallId }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await refreshActiveDetail(activeCallId);
      if (data.done && data.autoCompleted) {
        setActiveCallId(null);
        stopStream();
      }
      await loadDashboard();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Advance failed');
    } finally {
      setBusy(false);
    }
  };

  const endMock = async () => {
    if (!activeCallId) return;
    setBusy(true);
    stopStream();
    try {
      const res = await fetch('/api/receptionist/mock/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callId: activeCallId, fastForwardRemaining: true }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setActiveCallId(null);
      await loadDashboard();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'End failed');
    } finally {
      setBusy(false);
    }
  };

  const playScenario = () => {
    const id = activeCallIdRef.current;
    if (!id || streaming) return;
    setStreaming(true);
    streamRef.current = setInterval(() => {
      void (async () => {
        const callId = activeCallIdRef.current;
        if (!callId) {
          stopStream();
          return;
        }
        const res = await fetch('/api/receptionist/mock/advance', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ callId }),
        });
        const data = await res.json();
        if (data.error) {
          stopStream();
          return;
        }
        await refreshActiveDetail(callId);
        if (data.done) {
          stopStream();
          if (data.autoCompleted) setActiveCallId(null);
          await loadDashboard();
        }
      })();
    }, 900);
  };

  const reprocessLatest = async () => {
    const latest = recentCalls[0];
    if (!latest?.id) {
      setError('No calls to reprocess yet.');
      return;
    }
    setBusy(true);
    try {
      const res = await fetch(`/api/receptionist/calls/${latest.id}/reprocess`, { method: 'POST' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      await loadDashboard();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reprocess failed');
    } finally {
      setBusy(false);
    }
  };

  const extracted = parseExtracted(activeDetail?.extracted_json ?? null);

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-gradient-to-br from-slate-50 via-gray-100 to-slate-100">
      <main className="flex-1 flex flex-col min-w-0 min-h-0 overflow-auto">
        <header className="header px-6 py-4 flex flex-wrap items-center justify-between gap-4 flex-shrink-0">
          <div>
            <h1 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
              <Bot className="w-7 h-7 text-indigo-600" aria-hidden />
              AI Receptionist
            </h1>
            <p className="text-gray-500 text-sm">
              Mock calls, transcripts, and CRM handoff — no telephony required for demos.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/receptionist/settings"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <Settings className="w-4 h-4" aria-hidden />
              Settings
            </Link>
          </div>
        </header>

        <div className="p-6 md:p-8 overflow-auto space-y-8">
          {error ? (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm border border-red-100">{error}</div>
          ) : null}

          {integration ? (
            <div className="rounded-2xl border border-gray-200 bg-white/90 px-4 py-3 text-sm text-gray-700 flex flex-wrap gap-x-6 gap-y-2 items-center">
              <span className="font-medium text-gray-900">Live integration</span>
              <span>
                Retell:{' '}
                <span className={integration.retellReady ? 'text-emerald-600 font-medium' : 'text-amber-600'}>
                  {integration.retellReady ? 'ready' : 'not configured'}
                </span>
              </span>
              <span>
                Twilio auth:{' '}
                <span className={integration.twilioReady ? 'text-emerald-600 font-medium' : 'text-amber-600'}>
                  {integration.twilioReady ? 'present' : 'missing'}
                </span>
              </span>
              <span>
                Tool secret:{' '}
                <span className={integration.toolSecretSet ? 'text-emerald-600 font-medium' : 'text-amber-600'}>
                  {integration.toolSecretSet ? 'set' : 'missing'}
                </span>
              </span>
              <span className="text-gray-500 text-xs font-mono truncate max-w-[280px]" title={integration.appBaseUrl}>
                Base: {integration.appBaseUrl}
              </span>
            </div>
          ) : null}

          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-3">
            {[
              { label: 'Total calls', value: stats.totalCalls },
              { label: 'Active / mock', value: stats.activeCalls },
              { label: 'Callbacks', value: stats.callbackBookings },
              { label: 'Quote visits', value: stats.quoteVisitBookings },
              { label: 'Emergencies', value: stats.emergenciesFlagged, warn: true },
              { label: 'Urgent action', value: stats.urgentActionNeeded, warn: true },
              { label: 'Follow-up', value: stats.followUpNeeded, note: true },
              { label: 'Spam', value: stats.spamCalls },
              { label: 'Abusive legit', value: stats.abusiveButLegitimate, note: true },
              { label: 'Data gaps', value: stats.incompleteChecklist, note: true },
            ].map((s) => (
              <div
                key={s.label}
                className={`rounded-2xl p-4 border shadow-sm ${
                  s.warn ? 'bg-red-50/80 border-red-100' : s.note ? 'bg-amber-50/50 border-amber-100' : 'bg-white/80 border-white/30'
                }`}
              >
                <p className="text-gray-500 text-[10px] font-medium uppercase tracking-wide leading-tight">{s.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-1 flex items-center gap-2">
                  {loading ? '…' : s.value}
                  {s.warn && Number(s.value) > 0 ? (
                    <AlertTriangle className="w-5 h-5 text-red-600" aria-hidden />
                  ) : null}
                </p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1 space-y-4">
              <div className="bg-white/90 backdrop-blur rounded-2xl border border-gray-200/80 shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <PhoneCall className="w-5 h-5 text-indigo-600" aria-hidden />
                  Mock call
                </h2>
                <label className="block text-sm font-medium text-gray-700 mb-2">Scenario</label>
                <select
                  value={scenarioId}
                  onChange={(e) => setScenarioId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 mb-4"
                >
                  {scenarios.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    disabled={busy || !scenarioId}
                    onClick={() => void startMock()}
                    className="w-full py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    Start sample call
                  </button>
                  <button
                    type="button"
                    disabled={busy || !activeCallId}
                    onClick={() => void advanceOnce()}
                    className="w-full py-2.5 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    <SkipForward className="w-4 h-4" />
                    Next line
                  </button>
                  <button
                    type="button"
                    disabled={!activeCallId || streaming}
                    onClick={playScenario}
                    className="w-full py-2.5 rounded-lg bg-white border border-gray-300 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4" />
                    Play scenario
                  </button>
                  <button
                    type="button"
                    disabled={busy || !activeCallId}
                    onClick={() => void endMock()}
                    className="w-full py-2.5 rounded-lg bg-amber-600 text-white text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
                  >
                    End &amp; save now
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void reprocessLatest()}
                    className="w-full py-2.5 rounded-lg text-sm font-medium text-indigo-700 hover:bg-indigo-50 disabled:opacity-50 inline-flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reprocess latest call
                  </button>
                </div>
                {activeCallId ? (
                  <p className="text-xs text-gray-500 mt-4">
                    Active call ID: <code className="bg-gray-100 px-1 rounded">{activeCallId}</code>
                  </p>
                ) : null}
              </div>

              {activeDetail ? (
                <div className="bg-white/90 rounded-2xl border border-gray-200/80 shadow-sm p-6">
                  <h3 className="text-sm font-semibold text-gray-900 mb-2">Live status</h3>
                  <span className="inline-block px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-800 mb-4">
                    {activeDetail.status}
                  </span>
                  {extracted ? (
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className="text-gray-500">Name:</span>{' '}
                        <span className="text-gray-900">{extracted.callerName || '—'}</span>
                      </p>
                      <p>
                        <span className="text-gray-500">Phone:</span>{' '}
                        <span className="text-gray-900">{extracted.phone || '—'}</span>
                      </p>
                      <p>
                        <span className="text-gray-500">Address:</span>{' '}
                        <span className="text-gray-900">{extracted.address || '—'}</span>
                      </p>
                      <p>
                        <span className="text-gray-500">Issue:</span>{' '}
                        <span className="text-gray-900">{extracted.issueDescription || extracted.issueType || '—'}</span>
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500">Extracted fields appear after the call completes.</p>
                  )}
                  {activeDetail.recommended_next_step ? (
                    <p className="text-sm text-gray-700 mt-4 pt-4 border-t border-gray-100">
                      <span className="font-medium text-gray-900">Next step:</span> {activeDetail.recommended_next_step}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="xl:col-span-2 bg-white/90 backdrop-blur rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden flex flex-col min-h-[320px]">
              <div className="p-6 border-b border-gray-100">
                <h2 className="text-lg font-semibold text-gray-900">Transcript</h2>
                <p className="text-sm text-gray-500">Streams one speaker line at a time in mock mode.</p>
              </div>
              <div className="p-6 flex-1 overflow-auto max-h-[480px]">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans leading-relaxed">
                  {activeDetail?.transcript_text || 'Start a sample call to see the transcript here.'}
                </pre>
              </div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur rounded-2xl border border-gray-200/80 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Recent receptionist calls</h2>
              <Link href="/calls" className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                Open call log
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Provider</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Caller</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Issue</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Urgency</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Disposition</th>
                    <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">When</th>
                    <th className="text-right px-6 py-3 text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        Loading…
                      </td>
                    </tr>
                  ) : recentCalls.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                        No receptionist calls yet. Run a mock scenario above.
                      </td>
                    </tr>
                  ) : (
                    recentCalls.map((c) => {
                      const ex = parseExtracted(c.extracted_json);
                      const issue = ex?.issueDescription || ex?.issueType || c.lead_issue || c.ai_summary || '—';
                      const prov = c.provider || 'mock';
                      return (
                        <tr
                          key={c.id}
                          className={c.disposition === 'emergency' ? 'bg-red-50/60' : 'hover:bg-gray-50/80'}
                        >
                          <td className="px-6 py-3 text-sm">
                            <span
                              className={`inline-flex px-2 py-0.5 rounded text-xs font-medium ${
                                prov === 'mock' ? 'bg-slate-100 text-slate-700' : 'bg-violet-100 text-violet-800'
                              }`}
                            >
                              {prov}
                            </span>
                            {c.provider_status ? (
                              <span className="block text-[10px] text-gray-400 mt-0.5 truncate max-w-[88px]">
                                {c.provider_status}
                              </span>
                            ) : null}
                          </td>
                          <td className="px-6 py-3 text-sm font-medium text-gray-900">
                            {c.caller_name || ex?.callerName || '—'}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600">{c.from_phone || ex?.phone || '—'}</td>
                          <td className="px-6 py-3 text-sm text-gray-600 max-w-[200px] truncate" title={issue}>
                            {issue}
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-600">{c.urgency || ex?.urgency || '—'}</td>
                          <td className="px-6 py-3">
                            <div className="flex flex-wrap items-center gap-1">
                              <span
                                className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${dispositionBadge(c.disposition)}`}
                              >
                                {c.disposition || '—'}
                              </span>
                              {metaChecklistIncomplete(c.receptionist_meta_json ?? null) ? (
                                <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-900">
                                  gaps
                                </span>
                              ) : null}
                              {(() => {
                                const bb = behaviorBadge(metaCallerBehavior(c.receptionist_meta_json ?? null));
                                return bb ? (
                                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${bb.className}`}>
                                    {bb.label}
                                  </span>
                                ) : null;
                              })()}
                              {(() => {
                                const ub = urgentBadge(metaOperationalPriority(c.receptionist_meta_json ?? null));
                                return ub && c.disposition !== 'emergency' ? (
                                  <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-medium ${ub.className}`}>
                                    {ub.label}
                                  </span>
                                ) : null;
                              })()}
                            </div>
                          </td>
                          <td className="px-6 py-3 text-sm text-gray-500">
                            {new Date(c.started_at).toLocaleString()}
                          </td>
                          <td className="px-6 py-3 text-right">
                            <Link
                              href={`/receptionist/${c.id}`}
                              className="inline-flex items-center gap-1 text-sm font-medium text-indigo-600 hover:text-indigo-700"
                            >
                              View
                              <ChevronRight className="w-4 h-4" aria-hidden />
                            </Link>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
