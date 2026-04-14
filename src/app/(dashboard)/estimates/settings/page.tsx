'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowLeft } from 'lucide-react';

export default function EstimateSettingsPage() {
  const [s, setS] = useState<Record<string, unknown> | null>(null);
  const [err, setErr] = useState('');

  useEffect(() => {
    fetch('/api/estimates/settings')
      .then((r) => r.json())
      .then((j) => setS(j.settings))
      .catch((e) => setErr(String(e)));
  }, []);

  async function save(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const body = {
      estimate_prefix: String(fd.get('estimate_prefix') || 'EST'),
      company_name: String(fd.get('company_name') || ''),
      default_expiration_days: parseInt(String(fd.get('default_expiration_days') || '30'), 10),
      default_tax_rate_basis_points:
        fd.get('tax_bps') === '' ? null : parseInt(String(fd.get('tax_bps')), 10),
      default_terms_text: String(fd.get('default_terms_text') || ''),
      estimate_footer_text: String(fd.get('estimate_footer_text') || ''),
      allow_customer_reject: fd.get('allow_customer_reject') === 'on',
    };
    const res = await fetch('/api/estimates/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const j = await res.json();
    if (!res.ok) {
      setErr(j.error || 'Failed');
      return;
    }
    setS(j.settings);
    setErr('');
    alert('Saved');
  }

  if (!s) {
    return <div className="p-8 text-gray-500">{err || 'Loading…'}</div>;
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <Link href="/estimates" className="inline-flex items-center gap-2 text-sm text-teal-700 hover:underline">
        <ArrowLeft className="w-4 h-4" />
        Estimates
      </Link>
      <h1 className="text-2xl font-bold text-gray-900">Estimate defaults</h1>
      <form onSubmit={save} className="space-y-4 bg-white border rounded-xl p-6 shadow-sm">
        <div>
          <label className="text-sm font-medium text-gray-700">Company display name</label>
          <input name="company_name" defaultValue={String(s.company_name)} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Number prefix</label>
          <input name="estimate_prefix" defaultValue={String(s.estimate_prefix)} className="mt-1 w-full border rounded-lg px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Default expiration (days)</label>
          <input
            name="default_expiration_days"
            type="number"
            defaultValue={String(s.default_expiration_days)}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Default tax (basis points, e.g. 825 = 8.25%)</label>
          <input
            name="tax_bps"
            defaultValue={s.default_tax_rate_basis_points != null ? String(s.default_tax_rate_basis_points) : ''}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm"
            placeholder="leave blank for none"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Default terms</label>
          <textarea
            name="default_terms_text"
            defaultValue={String(s.default_terms_text || '')}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm min-h-[100px]"
          />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700">Footer on customer view</label>
          <textarea
            name="estimate_footer_text"
            defaultValue={String(s.estimate_footer_text || '')}
            className="mt-1 w-full border rounded-lg px-3 py-2 text-sm min-h-[60px]"
          />
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="allow_customer_reject" defaultChecked={Boolean(s.allow_customer_reject)} />
          Allow customer to reject from public link
        </label>
        {err ? <p className="text-sm text-red-600">{err}</p> : null}
        <button type="submit" className="px-4 py-2 rounded-lg bg-teal-700 text-white text-sm font-medium">
          Save
        </button>
      </form>
    </div>
  );
}
