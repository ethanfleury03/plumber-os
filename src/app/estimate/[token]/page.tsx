'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type Presentation = {
  estimate: Record<string, unknown>;
  lineItems: Record<string, unknown>[];
  branding: Record<string, unknown>;
  publicUrl: string;
};

function money(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default function PublicEstimatePage() {
  const { token } = useParams<{ token: string }>();
  const [data, setData] = useState<Presentation | null>(null);
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/public/estimate/${token}`);
        const j = await res.json();
        if (!res.ok) throw new Error(j.error || 'Not found');
        if (!cancelled) setData(j as Presentation);
        await fetch(`/api/public/estimate/${token}/view`, { method: 'POST' });
      } catch (e) {
        if (!cancelled) setErr(e instanceof Error ? e.message : 'Error');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function approve() {
    setMsg('');
    try {
      const res = await fetch(`/api/public/estimate/${token}/approve`, { method: 'POST' });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      setData(j.presentation as Presentation);
      setMsg('Thank you — your approval has been recorded.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    }
  }

  async function reject() {
    setMsg('');
    const reason = window.prompt('Optional reason for declining:') || '';
    try {
      const res = await fetch(`/api/public/estimate/${token}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || 'Failed');
      setData(j.presentation as Presentation);
      setMsg('Thanks — we have recorded your response.');
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    }
  }

  if (err && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <p className="text-red-600">{err}</p>
      </div>
    );
  }
  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-gray-500">
        Loading estimate…
      </div>
    );
  }

  const e = data.estimate;
  const accent = String(data.branding.accentColor || '#0f766e');
  const status = String(e.status);
  const canAct = status === 'sent' || status === 'viewed';
  const done = status === 'approved' || status === 'rejected' || status === 'converted' || status === 'expired';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 print:bg-white">
      <div className="max-w-3xl mx-auto px-4 py-10 print:py-4">
        <header
          className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 mb-6 print:shadow-none"
          style={{ borderTop: `4px solid ${accent}` }}
        >
          <p className="text-xs uppercase tracking-widest text-slate-500">Estimate</p>
          <h1 className="text-2xl font-bold mt-1">{String(data.branding.companyName)}</h1>
          <p className="text-sm text-slate-600 mt-2 font-mono">{String(e.estimate_number)}</p>
          <div className="mt-4 flex flex-wrap gap-3 text-sm">
            <span className="inline-flex px-3 py-1 rounded-full bg-slate-100 font-medium capitalize">{status}</span>
            {e.expiration_date ? (
              <span className="text-slate-600">Valid through {String(e.expiration_date)}</span>
            ) : null}
          </div>
        </header>

        {msg ? (
          <div className="mb-4 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm px-4 py-3 no-print">
            {msg}
          </div>
        ) : null}

        <section className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 mb-6 print:shadow-none">
          <h2 className="text-lg font-semibold">{String(e.title)}</h2>
          <p className="text-sm text-slate-600 mt-1">Prepared for {String(e.customer_name_snapshot)}</p>
          {e.service_address_snapshot ? (
            <p className="text-sm text-slate-600 mt-2">Service location: {String(e.service_address_snapshot)}</p>
          ) : null}
          {e.description ? <p className="text-sm mt-4 text-slate-700 whitespace-pre-wrap">{String(e.description)}</p> : null}
        </section>

        <section className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden mb-6 print:shadow-none">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-600 text-left">
              <tr>
                <th className="px-4 py-3">Scope</th>
                <th className="px-4 py-3 w-20">Qty</th>
                <th className="px-4 py-3 w-28 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.lineItems.map((li) => (
                <tr key={li.id as string} className="border-t border-slate-100">
                  <td className="px-4 py-3">
                    {(li.option_group as string) ? (
                      <span className="text-xs font-semibold text-teal-800 block mb-0.5">{String(li.option_group)}</span>
                    ) : null}
                    <span className="font-medium text-slate-900">{String(li.name)}</span>
                    {li.description ? <p className="text-slate-600 text-xs mt-1">{String(li.description)}</p> : null}
                  </td>
                  <td className="px-4 py-3">{Number(li.quantity)}</td>
                  <td className="px-4 py-3 text-right font-medium">{money(Number(li.total_price_cents))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-4 border-t border-slate-100 bg-slate-50/80 text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-600">Subtotal</span>
              <span>{money(Number(e.subtotal_amount_cents))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Discount</span>
              <span>-{money(Number(e.discount_amount_cents))}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Tax</span>
              <span>{money(Number(e.tax_amount_cents))}</span>
            </div>
            <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-200">
              <span>Total</span>
              <span>{money(Number(e.total_amount_cents))}</span>
            </div>
          </div>
        </section>

        {e.notes_customer ? (
          <section className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 mb-6 text-sm print:shadow-none">
            <h3 className="font-semibold mb-2">Notes</h3>
            <p className="text-slate-700 whitespace-pre-wrap">{String(e.notes_customer)}</p>
          </section>
        ) : null}

        {data.branding.terms ? (
          <section className="rounded-2xl bg-white shadow-sm border border-slate-200 p-6 mb-6 text-sm text-slate-600 print:shadow-none">
            <h3 className="font-semibold text-slate-900 mb-2">Terms</h3>
            <p className="whitespace-pre-wrap">{String(data.branding.terms)}</p>
          </section>
        ) : null}

        {data.branding.footer ? (
          <p className="text-center text-xs text-slate-500 mb-8">{String(data.branding.footer)}</p>
        ) : null}

        <div className="no-print flex flex-wrap gap-3 justify-center">
          {canAct ? (
            <>
              <button
                type="button"
                onClick={approve}
                className="px-6 py-3 rounded-xl text-white font-semibold shadow"
                style={{ backgroundColor: accent }}
              >
                Approve estimate
              </button>
              <button type="button" onClick={reject} className="px-6 py-3 rounded-xl border border-slate-300 font-semibold">
                Decline
              </button>
            </>
          ) : null}
          {done ? (
            <p className="text-sm text-slate-600">
              {status === 'approved' && 'This estimate has been approved.'}
              {status === 'rejected' && 'This estimate was declined.'}
              {status === 'converted' && 'This estimate has been scheduled as work.'}
              {status === 'expired' && 'This estimate is no longer valid.'}
            </p>
          ) : null}
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl border border-slate-300 text-sm font-medium"
          >
            Print / Save as PDF
          </button>
        </div>
      </div>
    </div>
  );
}
