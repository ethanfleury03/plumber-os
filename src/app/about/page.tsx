import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'About — PlumberOS',
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-white text-[var(--brand-ink)]">
      <header className="border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link href="/" className="text-sm font-semibold text-[var(--brand-orange-600)] hover:underline">
            ← PlumberOS home
          </Link>
        </div>
      </header>
      <div className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-6">About PlumberOS</h1>
        <p className="text-slate-600 leading-relaxed mb-4">
          PlumberOS is built for plumbing operators who want one system for reception, dispatch, estimates, invoices,
          and payments — instead of a patchwork of apps and spreadsheets.
        </p>
        <p className="text-slate-600 leading-relaxed">
          Replace this stub with your founding story, team, office locations, and press links when you are ready to
          publish a fuller company page.
        </p>
      </div>
    </div>
  );
}
