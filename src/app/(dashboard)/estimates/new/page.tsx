'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { ArrowLeft } from 'lucide-react';

function NewEstimateForm() {
  const router = useRouter();
  const sp = useSearchParams();
  const [title, setTitle] = useState('Plumbing estimate');
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState('');

  const leadId = sp.get('lead_id');
  const customerId = sp.get('customer_id');
  const jobId = sp.get('job_id');
  const callId = sp.get('receptionist_call_id');

  async function submit() {
    setErr('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          lead_id: leadId || null,
          customer_id: customerId || null,
          job_id: jobId || null,
          receptionist_call_id: callId || null,
          source_type: leadId ? 'lead' : customerId ? 'customer' : jobId ? 'job' : callId ? 'receptionist_call' : 'manual',
          source_id: leadId || customerId || jobId || callId || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');
      router.push(`/estimates/${(data.estimate as { id: string }).id}`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="p-6 max-w-xl mx-auto space-y-6">
      <Link href="/estimates" className="inline-flex items-center gap-2 text-sm text-teal-700 hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Back to estimates
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-gray-900">New estimate</h1>
        <p className="text-sm text-gray-600 mt-1">
          {leadId && `Linked to lead ${leadId}. `}
          {customerId && `Linked to customer ${customerId}. `}
          {jobId && `Linked to job ${jobId}. `}
          {callId && `Linked to receptionist call ${callId}. `}
          {!leadId && !customerId && !jobId && !callId && 'Blank estimate — add context on the next screen.'}
        </p>
      </div>
      <div className="space-y-3">
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      {err ? <p className="text-sm text-red-600">{err}</p> : null}
      <button
        type="button"
        disabled={submitting}
        onClick={submit}
        className="px-4 py-2 rounded-lg bg-teal-700 text-white text-sm font-medium disabled:opacity-50"
      >
        {submitting ? 'Creating…' : 'Create & edit'}
      </button>
    </div>
  );
}

export default function NewEstimatePage() {
  return (
    <Suspense
      fallback={
        <div className="p-6 max-w-xl mx-auto text-sm text-gray-600">Loading…</div>
      }
    >
      <NewEstimateForm />
    </Suspense>
  );
}
