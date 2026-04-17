'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Copy,
  ExternalLink,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import { CrmCustomerPicker } from '@/components/estimates/crm-customer-picker';
import { ESTIMATE_LINE_PRESETS } from '@/lib/estimates/templates';

type Detail = {
  estimate: Record<string, unknown>;
  lines: Record<string, unknown>[];
  activity: Record<string, unknown>[];
  deliveries: Record<string, unknown>[];
  presentation: {
    formatted: Record<string, string>;
  };
};

function formatMoney(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

function statusClass(status: string) {
  const map: Record<string, string> = {
    draft: 'bg-slate-100 text-slate-800',
    sent: 'bg-blue-100 text-blue-800',
    viewed: 'bg-indigo-100 text-indigo-800',
    approved: 'bg-emerald-100 text-emerald-800',
    rejected: 'bg-red-100 text-red-800',
    expired: 'bg-amber-100 text-amber-900',
    converted: 'bg-violet-100 text-violet-800',
  };
  return map[status] || 'bg-gray-100 text-gray-700';
}

type EditLineForm = {
  id: string;
  category: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unit_price_cents: number;
  option_group: string;
  is_taxable: boolean;
  is_optional: boolean;
  included_in_package: boolean;
};

export function EstimateDetailClient({ estimateId }: { estimateId: string }) {
  const router = useRouter();
  const [detail, setDetail] = useState<Detail | null>(null);
  const [plumbers, setPlumbers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');

  const [title, setTitle] = useState('');
  const [notesIn, setNotesIn] = useState('');
  const [notesOut, setNotesOut] = useState('');
  const [discount, setDiscount] = useState(0);
  const [taxBps, setTaxBps] = useState<number | ''>('');
  const [optionMode, setOptionMode] = useState<'single' | 'tiered'>('single');
  const [assignedId, setAssignedId] = useState('');

  const [newLine, setNewLine] = useState({
    category: '' as string,
    name: '',
    description: '',
    quantity: 1,
    unit: 'ea',
    unit_price_cents: 0,
    option_group: '',
    is_taxable: true,
    is_optional: false,
  });

  const [editLine, setEditLine] = useState<EditLineForm | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr('');
    try {
      const [dRes, pRes] = await Promise.all([
        fetch(`/api/estimates/${estimateId}`),
        fetch('/api/plumbers?limit=200'),
      ]);
      const d = await dRes.json();
      const p = await pRes.json();
      if (!dRes.ok) throw new Error(d.error || 'Failed to load');
      setDetail(d);
      const e = d.estimate as Record<string, unknown>;
      setTitle(String(e.title || ''));
      setNotesIn(String(e.notes_internal || ''));
      setNotesOut(String(e.notes_customer || ''));
      setDiscount(Number(e.discount_amount_cents || 0));
      setTaxBps(e.tax_rate_basis_points != null ? Number(e.tax_rate_basis_points) : '');
      setOptionMode((e.option_presentation_mode as 'single' | 'tiered') || 'single');
      setAssignedId(String(e.assigned_to_plumber_id || ''));
      if (p.plumbers) {
        setPlumbers(
          (p.plumbers as { id: string; name: string }[]).map((x) => ({ id: x.id, name: x.name })),
        );
      }
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [estimateId]);

  useEffect(() => {
    load();
  }, [load]);

  const est = detail?.estimate;
  const status = String(est?.status || '');
  const readOnly = ['approved', 'rejected', 'converted', 'expired', 'archived'].includes(status);

  const saveHeader = async () => {
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch(`/api/estimates/${estimateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          notes_internal: notesIn || null,
          notes_customer: notesOut || null,
          discount_amount_cents: discount,
          tax_rate_basis_points: taxBps === '' ? null : taxBps,
          option_presentation_mode: optionMode,
          assigned_to_plumber_id: assignedId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setMsg('Saved.');
      await load();
    } catch (e2) {
      setMsg(e2 instanceof Error ? e2.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const addLine = async () => {
    if (!newLine.name.trim()) return;
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch(`/api/estimates/${estimateId}/line-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newLine.category.trim() || null,
          name: newLine.name.trim(),
          description: newLine.description.trim() || null,
          quantity: newLine.quantity,
          unit: newLine.unit,
          unit_price_cents: Math.round(newLine.unit_price_cents),
          is_taxable: newLine.is_taxable,
          is_optional: newLine.is_optional,
          option_group: newLine.option_group.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      setNewLine((n) => ({
        ...n,
        category: '',
        name: '',
        description: '',
        unit_price_cents: 0,
      }));
      await load();
    } catch (e2) {
      setMsg(e2 instanceof Error ? e2.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const removeLine = async (lineId: string) => {
    if (!confirm('Remove this line?')) return;
    setBusy(true);
    try {
      await fetch(`/api/estimates/${estimateId}/line-items/${lineId}`, { method: 'DELETE' });
      await load();
    } finally {
      setBusy(false);
    }
  };

  const openLineEditor = (line: Record<string, unknown>) => {
    setEditLine({
      id: String(line.id),
      category: String(line.category || ''),
      name: String(line.name || ''),
      description: String(line.description || ''),
      quantity: Number(line.quantity) || 0,
      unit: String(line.unit || 'ea'),
      unit_price_cents: Number(line.unit_price_cents) || 0,
      option_group: String(line.option_group || ''),
      is_taxable: Boolean(line.is_taxable),
      is_optional: Boolean(line.is_optional),
      included_in_package: Boolean(line.included_in_package ?? 1),
    });
  };

  const saveEditedLine = async () => {
    if (!editLine) return;
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch(`/api/estimates/${estimateId}/line-items/${editLine.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: editLine.category.trim() || null,
          name: editLine.name.trim(),
          description: editLine.description.trim() || null,
          quantity: editLine.quantity,
          unit: editLine.unit.trim() || 'ea',
          unit_price_cents: Math.round(editLine.unit_price_cents),
          option_group: editLine.option_group.trim() || null,
          is_taxable: editLine.is_taxable,
          is_optional: editLine.is_optional,
          included_in_package: editLine.included_in_package,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Update failed');
      setEditLine(null);
      await load();
    } catch (e2) {
      setMsg(e2 instanceof Error ? e2.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const handleCrmCustomerChange = async (customerId: string | null) => {
    if (readOnly) return;
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch(`/api/estimates/${estimateId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not update customer');
      setMsg(customerId ? 'CRM customer attached to this quote.' : 'Customer link removed.');
      await load();
    } catch (e2) {
      setMsg(e2 instanceof Error ? e2.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const archiveEstimate = async () => {
    if (!confirm('Archive this estimate? It will leave the active list.')) return;
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch(`/api/estimates/${estimateId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Archive failed');
      router.push('/estimates');
    } catch (e2) {
      setMsg(e2 instanceof Error ? e2.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const sendEmail = async () => {
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch(`/api/estimates/${estimateId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivery_type: 'email' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Send failed');
      setMsg(`Sent. Link: ${data.publicUrl}`);
      await load();
    } catch (e2) {
      setMsg(e2 instanceof Error ? e2.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch(`/api/estimates/${estimateId}/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ delivery_type: 'manual_copy_link' }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      await navigator.clipboard.writeText(data.publicUrl);
      setMsg('Share link copied.');
      await load();
    } catch (e2) {
      setMsg(e2 instanceof Error ? e2.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const duplicate = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/estimates/${estimateId}/duplicate`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      window.location.href = `/estimates/${data.estimate.id}`;
    } catch (e2) {
      setMsg(e2 instanceof Error ? e2.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const convertJob = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/estimates/${estimateId}/convert-to-job`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      window.location.href = `/jobs`;
    } catch (e2) {
      setMsg(e2 instanceof Error ? e2.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const manualApprove = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/estimates/${estimateId}/approve-manually`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      await load();
    } catch (e2) {
      setMsg(e2 instanceof Error ? e2.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const manualReject = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/estimates/${estimateId}/reject-manually`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      await load();
    } catch (e2) {
      setMsg(e2 instanceof Error ? e2.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const publicUrl =
    typeof window !== 'undefined' && est?.customer_public_token
      ? `${window.location.origin}/estimate/${est.customer_public_token}`
      : '';

  if (loading && !detail) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (err || !detail || !est) {
    return (
      <div className="p-6">
        <p className="text-red-600">{err || 'Not found'}</p>
        <Link href="/estimates" className="text-blue-600 mt-4 inline-block">
          Back
        </Link>
      </div>
    );
  }

  const fmt = detail.presentation.formatted;

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-gradient-to-br from-slate-50 via-gray-100 to-slate-100">
      <main className="flex-1 overflow-auto p-6 max-w-6xl mx-auto w-full space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <Link href="/estimates" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-2">
              <ArrowLeft className="w-4 h-4" />
              Estimates
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold text-gray-900 font-mono">{String(est.estimate_number)}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${statusClass(status)}`}>
                {status}
              </span>
            </div>
            <p className="text-gray-500 text-sm mt-1">{String(est.title)}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => load()}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
            {status !== 'draft' && publicUrl ? (
              <>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700"
                >
                  <ExternalLink className="w-4 h-4" />
                  Customer view
                </a>
              </>
            ) : null}
            {!readOnly && (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={sendEmail}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold disabled:opacity-50"
                >
                  Send (email / mock)
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={copyLink}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-800 text-white text-sm font-semibold disabled:opacity-50"
                >
                  <Copy className="w-4 h-4" />
                  Copy link
                </button>
              </>
            )}
            <button
              type="button"
              disabled={busy}
              onClick={duplicate}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium"
            >
              Duplicate
            </button>
            {!readOnly && status !== 'converted' ? (
              <button
                type="button"
                disabled={busy}
                onClick={archiveEstimate}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-red-200 bg-white text-sm font-medium text-red-700 hover:bg-red-50"
              >
                Archive
              </button>
            ) : null}
            {status === 'approved' && (
              <button
                type="button"
                disabled={busy}
                onClick={convertJob}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold"
              >
                Convert to job
              </button>
            )}
          </div>
        </div>

        {msg ? (
          <div className="rounded-xl bg-blue-50 border border-blue-100 text-blue-900 text-sm px-4 py-3">{msg}</div>
        ) : null}

        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 space-y-4">
              <h2 className="font-semibold text-gray-900">Details</h2>
              <div className="grid sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <label className="block text-gray-500 text-xs mb-1">Customer</label>
                  <p className="font-medium text-gray-900">{String(est.customer_name_snapshot)}</p>
                  {est.customer_email_snapshot ? (
                    <p className="text-gray-600">{String(est.customer_email_snapshot)}</p>
                  ) : null}
                  {est.customer_phone_snapshot ? (
                    <p className="text-gray-600">{String(est.customer_phone_snapshot)}</p>
                  ) : null}
                </div>
                <div>
                  <label className="block text-gray-500 text-xs mb-1">Service address</label>
                  <p className="text-gray-800">{String(est.service_address_snapshot || '—')}</p>
                </div>
              </div>

              {!readOnly ? (
                <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-4">
                  <CrmCustomerPicker
                    value={est.customer_id ? String(est.customer_id) : null}
                    onChange={(id) => void handleCrmCustomerChange(id)}
                  />
                  <p className="text-xs text-gray-500 mt-2">
                    Attaching a CRM customer updates the name, contact info, and service address on this quote from
                    your customer record.
                  </p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-3 text-sm">
                {est.lead_id ? (
                  <Link href="/crm" className="text-blue-600 font-medium hover:underline">
                    CRM lead linked
                  </Link>
                ) : null}
                {est.customer_id ? (
                  <Link
                    href={`/customers`}
                    className="text-blue-600 font-medium hover:underline"
                    title="Open Customers in CRM"
                  >
                    Customers (CRM)
                  </Link>
                ) : null}
                {est.job_id ? (
                  <Link href="/jobs" className="text-blue-600 font-medium hover:underline">
                    Source job
                  </Link>
                ) : null}
                {est.receptionist_call_id ? (
                  <Link
                    href={`/receptionist/${est.receptionist_call_id}`}
                    className="text-blue-600 font-medium hover:underline"
                  >
                    Receptionist call
                  </Link>
                ) : null}
                {est.converted_to_job_id ? (
                  <Link href="/jobs" className="text-emerald-700 font-medium hover:underline">
                    Converted job
                  </Link>
                ) : null}
              </div>

              {!readOnly && (
                <>
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Title</label>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-900 text-sm"
                      />
                    </div>
                    <div className="grid sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Discount (¢)</label>
                        <input
                          type="number"
                          value={discount}
                          onChange={(e) => setDiscount(parseInt(e.target.value, 10) || 0)}
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-900 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Tax basis points</label>
                        <input
                          type="number"
                          placeholder="825 = 8.25%"
                          value={taxBps}
                          onChange={(e) =>
                            setTaxBps(e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0)
                          }
                          className="w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-900 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Assigned</label>
                      <select
                        value={assignedId}
                        onChange={(e) => setAssignedId(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-900 text-sm"
                      >
                        <option value="">—</option>
                        {plumbers.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-2">Options mode</label>
                      <div className="flex gap-4 text-sm">
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={optionMode === 'single'}
                            onChange={() => setOptionMode('single')}
                          />
                          Single
                        </label>
                        <label className="flex items-center gap-2">
                          <input
                            type="radio"
                            checked={optionMode === 'tiered'}
                            onChange={() => setOptionMode('tiered')}
                          />
                          Tiered
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Internal notes</label>
                      <textarea
                        value={notesIn}
                        onChange={(e) => setNotesIn(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-900 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Customer notes</label>
                      <textarea
                        value={notesOut}
                        onChange={(e) => setNotesOut(e.target.value)}
                        rows={2}
                        className="w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-900 text-sm"
                      />
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={saveHeader}
                      className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold disabled:opacity-50"
                    >
                      Save details
                    </button>
                  </div>
                </>
              )}

              {['sent', 'viewed', 'draft'].includes(status) && (
                <div className="border-t border-gray-100 pt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={manualApprove}
                    className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium"
                  >
                    Mark approved (office)
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={manualReject}
                    className="px-3 py-2 rounded-lg border border-red-200 text-red-700 text-sm font-medium"
                  >
                    Mark rejected (office)
                  </button>
                </div>
              )}
            </section>

            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-4">Line items</h2>
              {!readOnly && (
                <div className="mb-4 p-4 rounded-xl bg-gray-50 border border-gray-100 space-y-3">
                  <p className="text-xs font-medium text-gray-500 uppercase">Quick add preset</p>
                  <select
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900"
                    onChange={(e) => {
                      const idx = parseInt(e.target.value, 10);
                      e.target.value = '';
                      if (Number.isNaN(idx)) return;
                      const pr = ESTIMATE_LINE_PRESETS[idx];
                      setNewLine((n) => ({
                        ...n,
                        name: pr.name,
                        category: pr.category,
                        unit_price_cents: pr.unit_price_cents,
                        unit: pr.unit,
                        is_optional: Boolean((pr as { is_optional?: boolean }).is_optional),
                      }));
                    }}
                  >
                    <option value="">Choose template…</option>
                    {ESTIMATE_LINE_PRESETS.map((pr, i) => (
                      <option key={pr.name} value={i}>
                        {pr.name} — {formatMoney(pr.unit_price_cents)}
                      </option>
                    ))}
                  </select>
                  <div className="grid sm:grid-cols-2 gap-2">
                    <input
                      placeholder="Name"
                      value={newLine.name}
                      onChange={(e) => setNewLine((n) => ({ ...n, name: e.target.value }))}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    />
                    <input
                      placeholder="Option group (good / better / best)"
                      value={newLine.option_group}
                      onChange={(e) => setNewLine((n) => ({ ...n, option_group: e.target.value }))}
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={newLine.quantity}
                      onChange={(e) =>
                        setNewLine((n) => ({ ...n, quantity: parseFloat(e.target.value) || 0 }))
                      }
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    />
                    <input
                      type="number"
                      placeholder="Unit price (cents)"
                      value={newLine.unit_price_cents || ''}
                      onChange={(e) =>
                        setNewLine((n) => ({ ...n, unit_price_cents: parseInt(e.target.value, 10) || 0 }))
                      }
                      className="px-3 py-2 rounded-lg border border-gray-200 text-sm"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={newLine.is_taxable}
                      onChange={(e) => setNewLine((n) => ({ ...n, is_taxable: e.target.checked }))}
                    />
                    Taxable
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={newLine.is_optional}
                      onChange={(e) => setNewLine((n) => ({ ...n, is_optional: e.target.checked }))}
                    />
                    Optional line
                  </label>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={addLine}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold"
                  >
                    <Plus className="w-4 h-4" />
                    Add line
                  </button>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-gray-100">
                      <th className="pb-2 pr-2">Item</th>
                      <th className="pb-2 pr-2">Group</th>
                      <th className="pb-2 pr-2 text-right">Qty</th>
                      <th className="pb-2 pr-2 text-right">Price</th>
                      <th className="pb-2 text-right">Line total</th>
                      <th className="pb-2 w-20 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {detail.lines.map((line) => (
                      <tr key={String(line.id)}>
                        <td className="py-2 pr-2">
                          <div className="font-medium text-gray-900">{String(line.name)}</div>
                          {line.description ? (
                            <div className="text-xs text-gray-500">{String(line.description)}</div>
                          ) : null}
                        </td>
                        <td className="py-2 pr-2 text-gray-600">{String(line.option_group || '—')}</td>
                        <td className="py-2 pr-2 text-right">{String(line.quantity)}</td>
                        <td className="py-2 pr-2 text-right">{formatMoney(Number(line.unit_price_cents))}</td>
                        <td className="py-2 text-right font-medium">
                          {formatMoney(Number(line.total_price_cents))}
                        </td>
                        <td className="py-2 text-right">
                          {!readOnly ? (
                            <div className="inline-flex items-center gap-0.5">
                              <button
                                type="button"
                                onClick={() => openLineEditor(line)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 rounded-lg hover:bg-blue-50"
                                aria-label="Edit line"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeLine(String(line.id))}
                                className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                                aria-label="Remove line"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 sticky top-4">
              <h2 className="font-semibold text-gray-900 mb-4">Totals</h2>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Subtotal</dt>
                  <dd className="font-medium">${fmt.subtotal}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Discount</dt>
                  <dd className="font-medium">-${fmt.discount}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Tax</dt>
                  <dd className="font-medium">${fmt.tax}</dd>
                </div>
                <div className="flex justify-between text-base pt-2 border-t border-gray-100">
                  <dt className="font-semibold text-gray-900">Total</dt>
                  <dd className="font-bold text-gray-900">${fmt.total}</dd>
                </div>
              </dl>
            </section>

            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
              <h2 className="font-semibold text-gray-900 mb-3">Deliveries</h2>
              <ul className="text-sm space-y-2 text-gray-600">
                {detail.deliveries.length === 0 ? (
                  <li className="text-gray-400">No sends yet.</li>
                ) : (
                  detail.deliveries.map((d) => (
                    <li key={String(d.id)} className="border-b border-gray-50 pb-2">
                      <span className="font-medium text-gray-800">{String(d.delivery_type)}</span> ·{' '}
                      {String(d.status)} · {String(d.recipient)}
                      {d.public_link ? (
                        <div className="text-xs truncate text-blue-600">{String(d.public_link)}</div>
                      ) : null}
                    </li>
                  ))
                )}
              </ul>
            </section>

            <section className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 max-h-80 overflow-y-auto">
              <h2 className="font-semibold text-gray-900 mb-3">Activity</h2>
              <ul className="text-xs space-y-2 text-gray-600">
                {detail.activity.map((a) => (
                  <li key={String(a.id)}>
                    <span className="font-semibold text-gray-800">{String(a.event_type)}</span>{' '}
                    <span className="text-gray-400">{String(a.created_at)}</span>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        </div>

        {editLine ? (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-line-title"
          >
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 space-y-4">
              <h2 id="edit-line-title" className="text-lg font-semibold text-gray-900">
                Edit line item
              </h2>
              <div className="grid sm:grid-cols-2 gap-3 text-sm">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Name</label>
                  <input
                    value={editLine.name}
                    onChange={(e) => setEditLine((x) => (x ? { ...x, name: e.target.value } : x))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-900"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                  <textarea
                    value={editLine.description}
                    onChange={(e) => setEditLine((x) => (x ? { ...x, description: e.target.value } : x))}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Category</label>
                  <input
                    value={editLine.category}
                    onChange={(e) => setEditLine((x) => (x ? { ...x, category: e.target.value } : x))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Option group</label>
                  <input
                    value={editLine.option_group}
                    onChange={(e) => setEditLine((x) => (x ? { ...x, option_group: e.target.value } : x))}
                    placeholder="good / better / best"
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quantity</label>
                  <input
                    type="number"
                    step="any"
                    min={0.01}
                    value={editLine.quantity}
                    onChange={(e) =>
                      setEditLine((x) => (x ? { ...x, quantity: parseFloat(e.target.value) || 0 } : x))
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit</label>
                  <input
                    value={editLine.unit}
                    onChange={(e) => setEditLine((x) => (x ? { ...x, unit: e.target.value } : x))}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Unit price (¢)</label>
                  <input
                    type="number"
                    value={editLine.unit_price_cents}
                    onChange={(e) =>
                      setEditLine((x) =>
                        x ? { ...x, unit_price_cents: parseInt(e.target.value, 10) || 0 } : x,
                      )
                    }
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-gray-900"
                  />
                </div>
                <div className="flex flex-col gap-2 justify-center">
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={editLine.is_taxable}
                      onChange={(e) =>
                        setEditLine((x) => (x ? { ...x, is_taxable: e.target.checked } : x))
                      }
                    />
                    Taxable
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={editLine.is_optional}
                      onChange={(e) =>
                        setEditLine((x) => (x ? { ...x, is_optional: e.target.checked } : x))
                      }
                    />
                    Optional
                  </label>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={editLine.included_in_package}
                      onChange={(e) =>
                        setEditLine((x) => (x ? { ...x, included_in_package: e.target.checked } : x))
                      }
                    />
                    In package total
                  </label>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditLine(null)}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy || !editLine.name.trim()}
                  onClick={() => void saveEditedLine()}
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:opacity-50"
                >
                  Save line
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
