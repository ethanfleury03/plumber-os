'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, XCircle, Printer } from 'lucide-react';

type Data = {
  estimate: Record<string, unknown>;
  lines: Record<string, unknown>[];
  branding: Record<string, unknown>;
};

function formatMoney(cents: number, currency = 'USD') {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100);
}

export function PublicEstimateView({ token, data }: { token: string; data: Data }) {
  const { estimate: e, lines, branding: b } = data;
  const status = String(e.status || '');
  const accent = String(b.accent_color || '#2563eb');
  const companyName = String(b.company_name || e.company_name_snapshot || 'Company');

  const tiered = e.option_presentation_mode === 'tiered';
  const groups = useMemo(() => {
    const set = new Set<string>();
    for (const line of lines) {
      const g = (line.option_group as string)?.trim() || 'Standard';
      set.add(g);
    }
    return [...set];
  }, [lines]);

  const [selectedTier, setSelectedTier] = useState(groups[0] || 'Standard');
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [done, setDone] = useState<'approved' | 'rejected' | null>(null);

  const visibleLines = tiered
    ? lines.filter((l) => {
        const g = (l.option_group as string)?.trim() || 'Standard';
        return g === selectedTier;
      })
    : lines;

  const canAct = status === 'sent' || status === 'viewed';
  const blocked = ['approved', 'rejected', 'expired', 'converted'].includes(status);
  const allowReject = Number(b.allow_customer_reject ?? 1) === 1;

  const approve = async () => {
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch(`/api/public/estimates/${token}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          confirmation_acknowledged: ack,
          customer_selected_option_group: tiered ? selectedTier : null,
        }),
      });
      const data2 = await res.json();
      if (!res.ok) throw new Error(data2.error || 'Could not approve');
      setDone('approved');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  const reject = async () => {
    setBusy(true);
    setMsg('');
    try {
      const res = await fetch(`/api/public/estimates/${token}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data2 = await res.json();
      if (!res.ok) throw new Error(data2.error || 'Could not reject');
      setDone('rejected');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="max-w-3xl mx-auto px-4 py-10 print:py-4 print:max-w-none">
        <div className="no-print flex justify-end gap-2 mb-4">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-800 text-sm font-medium shadow-sm"
          >
            <Printer className="w-4 h-4" />
            Print / Save PDF
          </button>
        </div>

        <article
          className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden print:shadow-none print:border-gray-300"
          style={{ borderTopColor: accent, borderTopWidth: '4px' }}
        >
          <header className="px-8 pt-8 pb-6 border-b border-slate-100">
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Estimate</p>
                <h1 className="text-2xl font-bold text-slate-900 mt-1">{companyName}</h1>
                <p className="text-slate-600 text-sm mt-2">{String(e.title || 'Service estimate')}</p>
              </div>
              <div className="text-right text-sm text-slate-600">
                <p className="font-mono font-semibold text-slate-900">{String(e.estimate_number)}</p>
                <p className="mt-2">
                  Prepared for{' '}
                  <span className="font-semibold text-slate-900">{String(e.customer_name_snapshot)}</span>
                </p>
                {e.service_address_snapshot ? (
                  <p className="mt-1 max-w-xs ml-auto">{String(e.service_address_snapshot)}</p>
                ) : null}
              </div>
            </div>

            {blocked || done ? (
              <div
                className={`mt-6 rounded-xl px-4 py-3 text-sm font-medium ${
                  done === 'approved' || status === 'approved' || status === 'converted'
                    ? 'bg-emerald-50 text-emerald-900 border border-emerald-100'
                    : done === 'rejected' || status === 'rejected'
                      ? 'bg-red-50 text-red-900 border border-red-100'
                      : status === 'expired'
                        ? 'bg-amber-50 text-amber-900 border border-amber-100'
                        : 'bg-slate-50 text-slate-800 border border-slate-100'
                }`}
              >
                {done === 'approved' || status === 'approved'
                  ? 'Thank you — this estimate is approved. Our office will follow up to schedule work.'
                  : null}
                {status === 'converted'
                  ? 'This estimate was approved and converted to a scheduled job.'
                  : null}
                {done === 'rejected' || status === 'rejected' ? 'This estimate was declined.' : null}
                {status === 'expired' ? 'This estimate has expired. Please contact us for an updated quote.' : null}
              </div>
            ) : null}
          </header>

          <div className="px-8 py-6 space-y-6">
            {tiered && groups.length > 1 ? (
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-2">Choose an option</p>
                <div className="flex flex-wrap gap-2">
                  {groups.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setSelectedTier(g)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                        selectedTier === g
                          ? 'text-white border-transparent'
                          : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                      }`}
                      style={selectedTier === g ? { backgroundColor: accent } : undefined}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Line items</h2>
              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 text-left">
                    <tr>
                      <th className="px-4 py-3 font-medium">Description</th>
                      <th className="px-4 py-3 font-medium text-right">Qty</th>
                      <th className="px-4 py-3 font-medium text-right">Price</th>
                      <th className="px-4 py-3 font-medium text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {visibleLines.map((line) => (
                      <tr key={String(line.id)}>
                        <td className="px-4 py-3 text-slate-900">
                          <div className="font-medium">{String(line.name)}</div>
                          {line.description ? (
                            <div className="text-slate-500 text-xs mt-0.5">{String(line.description)}</div>
                          ) : null}
                          {line.is_optional ? (
                            <span className="text-xs text-amber-700">Optional</span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">{String(line.quantity)}</td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {formatMoney(Number(line.unit_price_cents), String(e.currency || 'USD'))}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-900">
                          {formatMoney(Number(line.total_price_cents), String(e.currency || 'USD'))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="flex justify-end">
              <dl className="w-full max-w-xs space-y-2 text-sm">
                <div className="flex justify-between text-slate-600">
                  <dt>Subtotal</dt>
                  <dd>{formatMoney(Number(e.subtotal_amount_cents), String(e.currency || 'USD'))}</dd>
                </div>
                <div className="flex justify-between text-slate-600">
                  <dt>Discount</dt>
                  <dd>-{formatMoney(Number(e.discount_amount_cents), String(e.currency || 'USD'))}</dd>
                </div>
                <div className="flex justify-between text-slate-600">
                  <dt>Tax</dt>
                  <dd>{formatMoney(Number(e.tax_amount_cents), String(e.currency || 'USD'))}</dd>
                </div>
                <div className="flex justify-between text-lg font-bold text-slate-900 pt-2 border-t border-slate-100">
                  <dt>Total</dt>
                  <dd>{formatMoney(Number(e.total_amount_cents), String(e.currency || 'USD'))}</dd>
                </div>
              </dl>
            </div>

            {e.notes_customer ? (
              <div className="rounded-xl bg-slate-50 border border-slate-100 px-4 py-3 text-sm text-slate-700">
                <p className="font-semibold text-slate-800 mb-1">Notes</p>
                <p className="whitespace-pre-wrap">{String(e.notes_customer)}</p>
              </div>
            ) : null}

            {b.default_terms_text ? (
              <div className="text-xs text-slate-500 leading-relaxed whitespace-pre-wrap border-t border-slate-100 pt-4">
                {String(b.default_terms_text)}
              </div>
            ) : null}

            {b.estimate_footer_text ? (
              <p className="text-xs text-slate-500 text-center">{String(b.estimate_footer_text)}</p>
            ) : null}

            {e.expiration_date ? (
              <p className="text-xs text-slate-500 text-center">
                Valid through {new Date(String(e.expiration_date)).toLocaleDateString('en-US', { dateStyle: 'long' })}
              </p>
            ) : null}
          </div>

          {canAct && !done ? (
            <footer className="no-print px-8 py-6 bg-slate-50 border-t border-slate-100 space-y-4">
              {msg ? <p className="text-sm text-red-600">{msg}</p> : null}
              <label className="flex items-start gap-2 text-sm text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ack}
                  onChange={(e) => setAck(e.target.checked)}
                  className="mt-1"
                />
                <span>I have reviewed this estimate and authorize the work described at the total shown above.</span>
              </label>
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busy}
                  onClick={approve}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm disabled:opacity-50"
                  style={{ backgroundColor: accent }}
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Approve estimate
                </button>
                {allowReject ? (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={reject}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold text-sm"
                  >
                    <XCircle className="w-5 h-5" />
                    Decline
                  </button>
                ) : null}
              </div>
            </footer>
          ) : null}
        </article>
      </div>
    </div>
  );
}
