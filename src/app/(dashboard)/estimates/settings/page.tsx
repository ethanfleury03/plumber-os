'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';

export default function EstimateSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [ok, setOk] = useState('');
  const [form, setForm] = useState({
    company_name: '',
    estimate_prefix: '',
    default_expiration_days: 14,
    default_tax_rate_basis_points: '' as number | '',
    estimate_footer_text: '',
    default_terms_text: '',
    accent_color: '#2563eb',
    logo_url: '',
    customer_signature_required: true,
    allow_customer_reject: true,
  });

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/estimates/settings');
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        const s = data.settings || {};
        setForm({
          company_name: String(s.company_name || ''),
          estimate_prefix: String(s.estimate_prefix || 'EST'),
          default_expiration_days: Number(s.default_expiration_days || 14),
          default_tax_rate_basis_points:
            s.default_tax_rate_basis_points != null ? Number(s.default_tax_rate_basis_points) : '',
          estimate_footer_text: String(s.estimate_footer_text || ''),
          default_terms_text: String(s.default_terms_text || ''),
          accent_color: String(s.accent_color || '#2563eb'),
          logo_url: String(s.logo_url || ''),
          customer_signature_required: Boolean(s.customer_signature_required),
          allow_customer_reject: Boolean(s.allow_customer_reject),
        });
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr('');
    setOk('');
    try {
      const res = await fetch('/api/estimates/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: form.company_name,
          estimate_prefix: form.estimate_prefix,
          default_expiration_days: form.default_expiration_days,
          default_tax_rate_basis_points: form.default_tax_rate_basis_points === '' ? null : form.default_tax_rate_basis_points,
          estimate_footer_text: form.estimate_footer_text || null,
          default_terms_text: form.default_terms_text || null,
          accent_color: form.accent_color || null,
          logo_url: form.logo_url || null,
          customer_signature_required: form.customer_signature_required,
          allow_customer_reject: form.allow_customer_reject,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Save failed');
      setOk('Saved.');
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-gradient-to-br from-slate-50 via-gray-100 to-slate-100">
      <main className="flex-1 overflow-auto p-6 max-w-2xl mx-auto w-full">
        <Link href="/estimates" className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Estimates
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Estimate settings</h1>
        <p className="text-sm text-gray-500 mb-6">
          Branding, numbering prefix, defaults for new estimates, and customer approval behavior on the public page.
        </p>

        {err ? <div className="mb-4 text-sm text-red-600">{err}</div> : null}
        {ok ? <div className="mb-4 text-sm text-emerald-700">{ok}</div> : null}

        <form onSubmit={save} className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Company display name</label>
            <input
              value={form.company_name}
              onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm"
              required
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estimate number prefix</label>
              <input
                value={form.estimate_prefix}
                onChange={(e) => setForm((f) => ({ ...f, estimate_prefix: e.target.value }))}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm"
                placeholder="EST"
              />
              <p className="text-xs text-gray-500 mt-1">Numbers look like PREFIX-YEAR-#### (sequence).</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Default expiration (days)</label>
              <input
                type="number"
                min={1}
                max={365}
                value={form.default_expiration_days}
                onChange={(e) =>
                  setForm((f) => ({ ...f, default_expiration_days: parseInt(e.target.value, 10) || 14 }))
                }
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default tax (basis points)</label>
            <input
              type="number"
              placeholder="825 = 8.25%"
              value={form.default_tax_rate_basis_points}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  default_tax_rate_basis_points: e.target.value === '' ? '' : parseInt(e.target.value, 10) || 0,
                }))
              }
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Accent color (hex)</label>
            <input
              value={form.accent_color}
              onChange={(e) => setForm((f) => ({ ...f, accent_color: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Logo URL (optional)</label>
            <input
              value={form.logo_url}
              onChange={(e) => setForm((f) => ({ ...f, logo_url: e.target.value }))}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm"
              placeholder="https://…"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Footer on customer PDF/view</label>
            <textarea
              value={form.estimate_footer_text}
              onChange={(e) => setForm((f) => ({ ...f, estimate_footer_text: e.target.value }))}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Default terms text</label>
            <textarea
              value={form.default_terms_text}
              onChange={(e) => setForm((f) => ({ ...f, default_terms_text: e.target.value }))}
              rows={4}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={form.customer_signature_required}
              onChange={(e) => setForm((f) => ({ ...f, customer_signature_required: e.target.checked }))}
            />
            Require customer confirmation checkbox to approve online
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-800">
            <input
              type="checkbox"
              checked={form.allow_customer_reject}
              onChange={(e) => setForm((f) => ({ ...f, allow_customer_reject: e.target.checked }))}
            />
            Allow customer to reject from public link
          </label>
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save settings'}
          </button>
        </form>
      </main>
    </div>
  );
}
