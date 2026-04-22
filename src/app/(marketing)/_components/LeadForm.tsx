'use client';

import { useEffect, useMemo, useState } from 'react';

export type LeadKind = 'demo' | 'contact' | 'waitlist' | 'general';
export type LeadField = 'name' | 'email' | 'company' | 'phone' | 'trade' | 'message';

const DEFAULT_FIELDS: Record<LeadKind, LeadField[]> = {
  demo: ['name', 'email', 'company', 'phone', 'message'],
  contact: ['name', 'email', 'company', 'phone', 'message'],
  waitlist: ['name', 'email', 'company', 'trade', 'message'],
  general: ['name', 'email', 'message'],
};

function randomToken(size = 24): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let out = '';
  const arr = new Uint8Array(size);
  crypto.getRandomValues(arr);
  for (const n of arr) out += chars[n % chars.length];
  return out;
}

export function LeadForm({
  kind,
  headline,
  submitLabel = 'Submit',
  defaultTrade,
  fields,
  className,
  onSuccess,
}: {
  kind: LeadKind;
  headline?: string;
  submitLabel?: string;
  defaultTrade?: string;
  fields?: LeadField[];
  className?: string;
  onSuccess?: () => void;
}) {
  const enabledFields = useMemo(() => fields ?? DEFAULT_FIELDS[kind], [fields, kind]);
  const [form, setForm] = useState({
    name: '',
    email: '',
    company: '',
    phone: '',
    trade: defaultTrade || '',
    message: '',
    website: '',
    utmSource: '',
    utmMedium: '',
    utmCampaign: '',
    referrer: '',
  });
  const [csrf, setCsrf] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const token = randomToken();
    setCsrf(token);
    document.cookie = `pos_csrf=${encodeURIComponent(token)}; Path=/; Max-Age=3600; SameSite=Lax`;
    const url = new URL(window.location.href);
    setForm((prev) => ({
      ...prev,
      utmSource: url.searchParams.get('utm_source') || '',
      utmMedium: url.searchParams.get('utm_medium') || '',
      utmCampaign: url.searchParams.get('utm_campaign') || '',
      referrer: document.referrer || '',
      trade: prev.trade || defaultTrade || '',
    }));
  }, [defaultTrade]);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        kind,
        name: form.name,
        email: form.email,
        company: form.company || undefined,
        phone: form.phone || undefined,
        trade: form.trade || undefined,
        message: form.message || undefined,
        website: form.website || undefined,
        utmSource: form.utmSource || undefined,
        utmMedium: form.utmMedium || undefined,
        utmCampaign: form.utmCampaign || undefined,
        referrer: form.referrer || undefined,
      };
      const res = await fetch('/api/marketing/leads', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-csrf-token': csrf,
        },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) {
        throw new Error(json?.error || 'Could not submit form.');
      }
      setSuccess(true);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit form.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className={`brand-card p-6 ${className || ''}`}>
        {headline ? <h3 className="text-xl font-bold text-[var(--brand-ink)]">{headline}</h3> : null}
        <p className="mt-2 text-sm text-[var(--brand-slate)]">
          Thanks — we received your request and will follow up shortly.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className={`brand-card p-6 space-y-4 ${className || ''}`} noValidate>
      {headline ? <h3 className="text-xl font-bold text-[var(--brand-ink)]">{headline}</h3> : null}

      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="hidden"
        value={form.website}
        onChange={(e) => update('website', e.target.value)}
      />

      {enabledFields.includes('name') ? (
        <label className="block">
          <span className="text-sm font-medium text-[var(--brand-ink)]">Name</span>
          <input
            required
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
          />
        </label>
      ) : null}

      {enabledFields.includes('email') ? (
        <label className="block">
          <span className="text-sm font-medium text-[var(--brand-ink)]">Email</span>
          <input
            required
            type="email"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.email}
            onChange={(e) => update('email', e.target.value)}
          />
        </label>
      ) : null}

      {enabledFields.includes('company') ? (
        <label className="block">
          <span className="text-sm font-medium text-[var(--brand-ink)]">Company</span>
          <input
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.company}
            onChange={(e) => update('company', e.target.value)}
          />
        </label>
      ) : null}

      {enabledFields.includes('phone') ? (
        <label className="block">
          <span className="text-sm font-medium text-[var(--brand-ink)]">Phone</span>
          <input
            type="tel"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.phone}
            onChange={(e) => update('phone', e.target.value)}
          />
        </label>
      ) : null}

      {enabledFields.includes('trade') ? (
        <label className="block">
          <span className="text-sm font-medium text-[var(--brand-ink)]">Trade</span>
          <input
            type="text"
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            value={form.trade}
            onChange={(e) => update('trade', e.target.value)}
          />
        </label>
      ) : null}

      {enabledFields.includes('message') ? (
        <label className="block">
          <span className="text-sm font-medium text-[var(--brand-ink)]">Message</span>
          <textarea
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-24"
            value={form.message}
            onChange={(e) => update('message', e.target.value)}
          />
        </label>
      ) : null}

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button type="submit" className="btn-primary w-full" disabled={submitting} aria-busy={submitting}>
        {submitting ? 'Sending…' : submitLabel}
      </button>
    </form>
  );
}
