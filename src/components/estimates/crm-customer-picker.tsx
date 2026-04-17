'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search, User, X } from 'lucide-react';

export type CrmCustomer = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
};

type Props = {
  /** Selected CRM customer id, or null if none */
  value: string | null;
  onChange: (id: string | null, customer?: CrmCustomer) => void;
  disabled?: boolean;
  /** Optional id to resolve display name when value is preset (e.g. from URL) */
  initialLabel?: string;
};

export function CrmCustomerPicker({ value, onChange, disabled, initialLabel }: Props) {
  const [q, setQ] = useState('');
  const [results, setResults] = useState<CrmCustomer[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [label, setLabel] = useState(initialLabel || '');

  useEffect(() => {
    setLabel(initialLabel || '');
  }, [initialLabel]);

  useEffect(() => {
    if (!value) {
      if (!initialLabel) setLabel('');
      return;
    }
    if (initialLabel) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/customers/${value}`);
        const data = await res.json();
        if (cancelled || !data.customer) return;
        setLabel(String(data.customer.name || ''));
      } catch {
        /* ignore */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, initialLabel]);

  const search = useCallback(async (term: string) => {
    if (!term.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(term)}&limit=15`);
      const data = await res.json();
      setResults(
        (data.customers || []).map((c: Record<string, unknown>) => ({
          id: String(c.id),
          name: String(c.name),
          email: c.email as string | null,
          phone: c.phone as string | null,
          address: c.address as string | null,
        })),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => search(q), 200);
    return () => clearTimeout(t);
  }, [q, open, search]);

  return (
    <div className="relative">
      <label className="block text-xs font-medium text-gray-600 mb-1">CRM customer</label>
      {value ? (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 px-3 py-2 mb-2 bg-slate-50">
          <span className="flex items-center gap-2 text-sm text-gray-900 min-w-0">
            <User className="w-4 h-4 flex-shrink-0 text-gray-500" aria-hidden />
            <span className="font-medium truncate">{label || 'Selected customer'}</span>
          </span>
          {!disabled ? (
            <button
              type="button"
              onClick={() => {
                onChange(null);
                setLabel('');
                setQ('');
                setResults([]);
              }}
              className="flex-shrink-0 p-1 rounded text-gray-500 hover:text-red-600 hover:bg-red-50"
              aria-label="Clear customer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      ) : null}

      {!disabled ? (
        <>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <input
              value={q}
              onChange={(e) => {
                setOpen(true);
                setQ(e.target.value);
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => {
                setTimeout(() => setOpen(false), 200);
              }}
              placeholder={value ? 'Search to change customer…' : 'Search customers (name, phone, email)…'}
              className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-900"
            />
            {open && (q.trim() || results.length > 0) ? (
              <div className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                {loading ? <div className="p-3 text-sm text-gray-500">Searching…</div> : null}
                {!loading && q.trim() && results.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">No customers match.</div>
                ) : null}
                {results.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 border-b border-gray-50 last:border-0"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      onChange(c.id, c);
                      setLabel(c.name);
                      setQ('');
                      setResults([]);
                      setOpen(false);
                    }}
                  >
                    <span className="font-medium text-gray-900">{c.name}</span>
                    <span className="text-gray-500 text-xs block truncate">
                      {[c.phone, c.email].filter(Boolean).join(' · ')}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <p className="text-xs text-gray-500 mt-1">Only customers in your CRM appear here.</p>
        </>
      ) : null}
    </div>
  );
}
