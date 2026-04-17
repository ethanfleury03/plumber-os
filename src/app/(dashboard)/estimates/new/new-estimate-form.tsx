'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { CrmCustomerPicker } from '@/components/estimates/crm-customer-picker';

export function NewEstimateForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [title, setTitle] = useState('');
  const [notesCustomer, setNotesCustomer] = useState('');
  const [optionMode, setOptionMode] = useState<'single' | 'tiered'>('single');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [crmCustomerId, setCrmCustomerId] = useState<string | null>(() => sp.get('customer_id') ?? null);

  const body = {
    title: title.trim() || undefined,
    notes_customer: notesCustomer.trim() || null,
    option_presentation_mode: optionMode,
    lead_id: sp.get('lead_id') || undefined,
    customer_id: crmCustomerId || undefined,
    job_id: sp.get('job_id') || undefined,
    receptionist_call_id: sp.get('receptionist_call_id') || undefined,
  };

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      const res = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create');
      router.push(`/estimates/${data.estimate.id}`);
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-gradient-to-br from-slate-50 via-gray-100 to-slate-100">
      <main className="flex-1 overflow-auto p-6 max-w-xl mx-auto w-full">
        <Link
          href="/estimates"
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Estimates
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">New estimate</h1>
        <p className="text-sm text-gray-500 mb-6">
          Customer and address are filled from the linked lead, customer, job, or receptionist call when provided.
        </p>

        {(sp.get('lead_id') || sp.get('customer_id') || sp.get('job_id') || sp.get('receptionist_call_id')) && (
          <div className="mb-4 rounded-xl bg-blue-50 border border-blue-100 px-4 py-3 text-sm text-blue-900">
            Prefilled from:{' '}
            {sp.get('lead_id') && <span className="font-mono">lead {sp.get('lead_id')?.slice(0, 8)}…</span>}
            {sp.get('customer_id') && <span className="font-mono">customer {sp.get('customer_id')?.slice(0, 8)}…</span>}
            {sp.get('job_id') && <span className="font-mono">job {sp.get('job_id')?.slice(0, 8)}…</span>}
            {sp.get('receptionist_call_id') && (
              <span className="font-mono">call {sp.get('receptionist_call_id')?.slice(0, 8)}…</span>
            )}
          </div>
        )}

        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <CrmCustomerPicker value={crmCustomerId} onChange={(id) => setCrmCustomerId(id)} />
        </div>

        <form onSubmit={create} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          {err ? <div className="text-sm text-red-600">{err}</div> : null}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm"
              placeholder="e.g. Water heater replacement"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Customer-visible notes</label>
            <textarea
              value={notesCustomer}
              onChange={(e) => setNotesCustomer(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm"
              placeholder="Scope summary, warranty notes…"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Options layout</label>
            <div className="flex gap-4 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="opt"
                  checked={optionMode === 'single'}
                  onChange={() => setOptionMode('single')}
                />
                Single list
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="opt"
                  checked={optionMode === 'tiered'}
                  onChange={() => setOptionMode('tiered')}
                />
                Good / better / best (tiered)
              </label>
            </div>
          </div>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            Create &amp; edit line items
          </button>
        </form>
      </main>
    </div>
  );
}
