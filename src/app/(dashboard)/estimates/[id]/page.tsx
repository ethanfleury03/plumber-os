'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import {
  ArrowLeft,
  Copy,
  RefreshCw,
  Send,
  Briefcase,
  Printer,
  Plus,
  Trash2,
} from 'lucide-react';

type Presentation = {
  estimate: Record<string, unknown>;
  lineItems: Record<string, unknown>[];
  branding: Record<string, unknown>;
  publicUrl: string;
};

function money(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100);
}

export default function EstimateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData] = useState<Presentation | null>(null);
  const [activity, setActivity] = useState<Record<string, unknown>[]>([]);
  const [deliveries, setDeliveries] = useState<Record<string, unknown>[]>([]);
  const [presets, setPresets] = useState<{ name: string; unit_price_cents: number; unit: string; category?: string; option_group?: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [newLine, setNewLine] = useState({ name: '', unit_price_cents: 0, quantity: 1, option_group: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [main, act, del, pr] = await Promise.all([
        fetch(`/api/estimates/${id}`),
        fetch(`/api/estimates/${id}/activity`),
        fetch(`/api/estimates/${id}/deliveries`),
        fetch('/api/estimates/presets'),
      ]);
      const j = await main.json();
      if (!main.ok) throw new Error(j.error || 'Failed');
      setData(j as Presentation);
      const aj = await act.json();
      setActivity(aj.activity || []);
      const dj = await del.json();
      setDeliveries(dj.deliveries || []);
      const pj = await pr.json();
      setPresets(pj.presets || []);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Error');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  async function patchEstimate(patch: Record<string, unknown>) {
    const res = await fetch(`/api/estimates/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || 'Failed');
    setData((prev) =>
      prev
        ? {
            ...prev,
            estimate: j.estimate,
            lineItems: prev.lineItems,
            branding: prev.branding,
            publicUrl: prev.publicUrl,
          }
        : null,
    );
  }

  async function addLine() {
    if (!newLine.name.trim()) return;
    const res = await fetch(`/api/estimates/${id}/line-items`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newLine.name,
        quantity: newLine.quantity,
        unit: 'ea',
        unit_price_cents: Math.round(newLine.unit_price_cents),
        option_group: newLine.option_group || null,
      }),
    });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || 'Failed');
    setNewLine({ name: '', unit_price_cents: 0, quantity: 1, option_group: '' });
    await load();
  }

  async function removeLine(lineId: string) {
    if (!confirm('Remove this line?')) return;
    const res = await fetch(`/api/estimates/${id}/line-items/${lineId}`, { method: 'DELETE' });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || 'Failed');
    await load();
  }

  async function send() {
    const res = await fetch(`/api/estimates/${id}/send`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || 'Failed');
    alert(`Send complete. Customer link:\n${j.publicUrl}`);
    await load();
  }

  async function duplicate() {
    const res = await fetch(`/api/estimates/${id}/duplicate`, { method: 'POST' });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || 'Failed');
    router.push(`/estimates/${(j.estimate as { id: string }).id}`);
  }

  async function convertJob() {
    const res = await fetch(`/api/estimates/${id}/convert-to-job`, { method: 'POST' });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || 'Failed');
    alert(`Job created: ${(j.job as { id: string }).id}`);
    await load();
  }

  if (loading && !data) {
    return <div className="p-8 text-center text-gray-500">Loading…</div>;
  }
  if (!data) {
    return (
      <div className="p-8 text-center">
        <p className="text-red-600">{err || 'Not found'}</p>
        <Link href="/estimates" className="text-teal-700 text-sm mt-2 inline-block">
          Back
        </Link>
      </div>
    );
  }

  const e = data.estimate;
  const status = String(e.status);

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6 print:max-w-none">
      <div className="flex flex-wrap items-center justify-between gap-3 no-print">
        <Link href="/estimates" className="inline-flex items-center gap-2 text-sm text-teal-700 hover:underline">
          <ArrowLeft className="w-4 h-4" />
          All estimates
        </Link>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm"
            onClick={() => window.open(`/estimate/${e.customer_public_token}`, '_blank')}
          >
            Preview public
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm"
            onClick={() => window.print()}
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm"
            onClick={async () => {
              await navigator.clipboard.writeText(data.publicUrl);
              alert('Link copied');
            }}
          >
            <Copy className="w-4 h-4" />
            Copy link
          </button>
          <button
            type="button"
            onClick={() => load()}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm p-6 space-y-4 print:shadow-none print:border-gray-300">
        <div className="flex flex-wrap justify-between gap-3">
          <div>
            <p className="text-xs font-mono text-gray-500">{String(e.estimate_number)}</p>
            <input
              className="text-2xl font-bold text-gray-900 border-b border-transparent hover:border-gray-200 focus:border-teal-600 outline-none bg-transparent w-full max-w-xl"
              defaultValue={String(e.title)}
              key={e.updated_at as string}
              onBlur={async (ev) => {
                try {
                  await patchEstimate({ title: ev.target.value });
                  await load();
                } catch (x) {
                  alert(x instanceof Error ? x.message : 'Error');
                }
              }}
            />
            <p className="text-sm text-gray-600 mt-1">
              {String(e.customer_name_snapshot)} · {e.customer_phone_snapshot ? String(e.customer_phone_snapshot) : '—'}
            </p>
          </div>
          <div className="text-right">
            <span className="inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 capitalize">{status}</span>
            <p className="text-sm text-gray-500 mt-2">Expires {e.expiration_date ? String(e.expiration_date) : '—'}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4 no-print">
          <div>
            <label className="text-xs font-medium text-gray-500">Customer notes (on PDF)</label>
            <textarea
              className="w-full mt-1 border rounded-lg p-2 text-sm min-h-[72px]"
              defaultValue={(e.notes_customer as string) || ''}
              key={`nc-${e.updated_at}`}
              onBlur={async (ev) => {
                try {
                  await patchEstimate({ notes_customer: ev.target.value || null });
                } catch (x) {
                  alert(x instanceof Error ? x.message : 'Error');
                }
              }}
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500">Internal notes</label>
            <textarea
              className="w-full mt-1 border rounded-lg p-2 text-sm min-h-[72px] bg-amber-50/50"
              defaultValue={(e.notes_internal as string) || ''}
              key={`ni-${e.updated_at}`}
              onBlur={async (ev) => {
                try {
                  await patchEstimate({ notes_internal: ev.target.value || null });
                } catch (x) {
                  alert(x instanceof Error ? x.message : 'Error');
                }
              }}
            />
          </div>
        </div>

        <div className="border-t pt-4 space-y-3">
          <div className="flex justify-between items-center no-print">
            <h2 className="font-semibold text-gray-900">Line items</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b">
                  <th className="py-2 pr-2">Option group</th>
                  <th className="py-2 pr-2">Item</th>
                  <th className="py-2 pr-2">Qty</th>
                  <th className="py-2 pr-2">Unit $</th>
                  <th className="py-2 pr-2">Line total</th>
                  <th className="py-2 no-print" />
                </tr>
              </thead>
              <tbody>
                {data.lineItems.map((li) => (
                  <tr key={li.id as string} className="border-b border-gray-100">
                    <td className="py-2 pr-2 text-gray-600">{(li.option_group as string) || '—'}</td>
                    <td className="py-2 pr-2 font-medium">{String(li.name)}</td>
                    <td className="py-2 pr-2">{Number(li.quantity)}</td>
                    <td className="py-2 pr-2">{money(Number(li.unit_price_cents))}</td>
                    <td className="py-2 pr-2">{money(Number(li.total_price_cents))}</td>
                    <td className="py-2 no-print">
                      {status !== 'approved' && status !== 'converted' ? (
                        <button type="button" className="text-red-600" onClick={() => removeLine(li.id as string)}>
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {status !== 'approved' && status !== 'converted' ? (
            <div className="no-print space-y-2 rounded-xl bg-gray-50 p-4">
              <p className="text-xs font-medium text-gray-600">Quick add</p>
              <div className="flex flex-wrap gap-2">
                {presets.slice(0, 8).map((p) => (
                  <button
                    key={p.name}
                    type="button"
                    className="px-2 py-1 rounded-lg bg-white border text-xs"
                    onClick={async () => {
                      await fetch(`/api/estimates/${id}/line-items`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          name: p.name,
                          quantity: 1,
                          unit: p.unit,
                          unit_price_cents: p.unit_price_cents,
                          category: p.category,
                          option_group: p.option_group,
                        }),
                      });
                      await load();
                    }}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 items-end">
                <input
                  className="border rounded px-2 py-1 text-sm flex-1 min-w-[120px]"
                  placeholder="Custom line name"
                  value={newLine.name}
                  onChange={(ev) => setNewLine((s) => ({ ...s, name: ev.target.value }))}
                />
                <input
                  type="number"
                  className="border rounded px-2 py-1 text-sm w-24"
                  placeholder="$"
                  value={newLine.unit_price_cents / 100}
                  onChange={(ev) =>
                    setNewLine((s) => ({ ...s, unit_price_cents: Math.round(Number(ev.target.value) * 100) }))
                  }
                />
                <input
                  className="border rounded px-2 py-1 text-sm w-28"
                  placeholder="Group"
                  value={newLine.option_group}
                  onChange={(ev) => setNewLine((s) => ({ ...s, option_group: ev.target.value }))}
                />
                <button
                  type="button"
                  onClick={() => addLine().catch((x) => alert(x instanceof Error ? x.message : 'Error'))}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-teal-700 text-white text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add
                </button>
              </div>
            </div>
          ) : null}
        </div>

        <div className="border-t pt-4 grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Totals</h3>
            <dl className="text-sm space-y-1">
              <div className="flex justify-between">
                <dt className="text-gray-500">Subtotal</dt>
                <dd>{money(Number(e.subtotal_amount_cents))}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Discount</dt>
                <dd>-{money(Number(e.discount_amount_cents))}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-gray-500">Tax</dt>
                <dd>{money(Number(e.tax_amount_cents))}</dd>
              </div>
              <div className="flex justify-between font-semibold text-base pt-2 border-t">
                <dt>Total</dt>
                <dd>{money(Number(e.total_amount_cents))}</dd>
              </div>
            </dl>
            <div className="mt-3 no-print flex flex-wrap gap-2 items-center">
              <label className="text-xs text-gray-500">Discount (cents)</label>
              <input
                type="number"
                className="border rounded px-2 py-1 text-sm w-28"
                defaultValue={Number(e.discount_amount_cents)}
                key={`disc-${e.updated_at}`}
                onBlur={async (ev) => {
                  try {
                    await patchEstimate({ discount_amount_cents: Math.max(0, parseInt(ev.target.value, 10) || 0) });
                    await load();
                  } catch (x) {
                    alert(x instanceof Error ? x.message : 'Error');
                  }
                }}
              />
              <label className="text-xs text-gray-500 ml-2">Tax bps</label>
              <input
                type="number"
                className="border rounded px-2 py-1 text-sm w-24"
                defaultValue={e.tax_rate_basis_points != null ? Number(e.tax_rate_basis_points) : ''}
                key={`tax-${e.updated_at}`}
                onBlur={async (ev) => {
                  try {
                    const v = ev.target.value.trim();
                    await patchEstimate({ tax_rate_basis_points: v === '' ? null : Math.max(0, parseInt(v, 10) || 0) });
                    await load();
                  } catch (x) {
                    alert(x instanceof Error ? x.message : 'Error');
                  }
                }}
              />
            </div>
          </div>
          <div className="no-print space-y-2">
            <h3 className="font-semibold text-gray-900">Actions</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={status === 'converted'}
                onClick={() => send().catch((x) => alert(x instanceof Error ? x.message : 'Error'))}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-teal-700 text-white text-sm disabled:opacity-40"
              >
                <Send className="w-4 h-4" />
                Send / log delivery
              </button>
              <button
                type="button"
                onClick={() => duplicate().catch((x) => alert(x instanceof Error ? x.message : 'Error'))}
                className="px-3 py-2 rounded-lg border text-sm"
              >
                Duplicate
              </button>
              <button
                type="button"
                disabled={status !== 'approved'}
                onClick={() => convertJob().catch((x) => alert(x instanceof Error ? x.message : 'Error'))}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border text-sm disabled:opacity-40"
              >
                <Briefcase className="w-4 h-4" />
                Convert to job
              </button>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <button
                type="button"
                className="px-3 py-1.5 rounded border text-xs"
                onClick={() =>
                  fetch(`/api/estimates/${id}/approve-manually`, { method: 'POST' }).then(load).catch((x) => alert(String(x)))
                }
              >
                Mark approved (office)
              </button>
              <button
                type="button"
                className="px-3 py-1.5 rounded border text-xs"
                onClick={() =>
                  fetch(`/api/estimates/${id}/reject-manually`, { method: 'POST' }).then(load).catch((x) => alert(String(x)))
                }
              >
                Mark rejected (office)
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 no-print">
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Activity</h3>
          <ul className="text-sm space-y-2 border rounded-lg p-3 bg-gray-50 max-h-64 overflow-y-auto">
            {activity.map((a) => (
              <li key={a.id as string} className="text-gray-700">
                <span className="font-medium">{String(a.event_type)}</span>
                <span className="text-gray-400 text-xs ml-2">{String(a.created_at)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-semibold text-gray-900 mb-2">Deliveries</h3>
          <ul className="text-sm space-y-2 border rounded-lg p-3 bg-gray-50 max-h-64 overflow-y-auto">
            {deliveries.length === 0 ? <li className="text-gray-500">None yet</li> : null}
            {deliveries.map((d) => (
              <li key={d.id as string} className="text-gray-700">
                {String(d.delivery_type)} · {String(d.status)} · {String(d.created_at)}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="text-xs text-gray-500 no-print">
        {e.lead_id ? (
          <Link className="text-teal-700 hover:underline mr-3" href={`/crm`}>
            Related lead
          </Link>
        ) : null}
        {e.customer_id ? (
          <Link className="text-teal-700 hover:underline mr-3" href={`/customers`}>
            Customers
          </Link>
        ) : null}
        {e.receptionist_call_id ? (
          <Link className="text-teal-700 hover:underline" href={`/receptionist/${e.receptionist_call_id}`}>
            Receptionist call
          </Link>
        ) : null}
      </div>
    </div>
  );
}
