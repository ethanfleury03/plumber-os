'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';

type Result = {
  type: 'customer' | 'job' | 'invoice' | 'estimate' | 'lead';
  id: string;
  title: string;
  subtitle: string;
  href: string;
};

export function CommandPalette() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Result[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30);
    else {
      setQuery('');
      setResults([]);
      setActive(0);
    }
  }, [open]);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`, {
        signal: ctrl.signal,
        cache: 'no-store',
      });
      const json = await res.json();
      if (!ctrl.signal.aborted) setResults(json.results || []);
    } catch {
      /* ignore abort */
    } finally {
      if (!ctrl.signal.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 120);
    return () => clearTimeout(t);
  }, [query, search]);

  function go(r: Result) {
    setOpen(false);
    router.push(r.href);
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      const r = results[active];
      if (r) go(r);
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-start justify-center pt-28"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl bg-white rounded-lg shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b px-4 py-3">
          {loading ? (
            <Loader2 className="size-4 text-muted-foreground animate-spin" />
          ) : (
            <Search className="size-4 text-muted-foreground" />
          )}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setActive(0);
            }}
            onKeyDown={onInputKey}
            placeholder="Search customers, jobs, invoices, estimates, leads…"
            className="flex-1 outline-none text-sm bg-transparent"
          />
          <kbd className="text-xs text-muted-foreground border rounded px-1.5 py-0.5">Esc</kbd>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {results.length === 0 && query.trim().length >= 2 && !loading && (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">No results</div>
          )}
          {results.map((r, i) => (
            <button
              key={`${r.type}-${r.id}`}
              onMouseEnter={() => setActive(i)}
              onClick={() => go(r)}
              className={`w-full text-left flex items-center justify-between px-4 py-2.5 border-b last:border-b-0 ${
                i === active ? 'bg-blue-50' : 'bg-white'
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{r.title}</div>
                <div className="text-xs text-muted-foreground truncate">{r.subtitle}</div>
              </div>
              <span className="text-[11px] uppercase tracking-wide text-muted-foreground ml-4">
                {r.type}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
