'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Menu, X, Wrench } from 'lucide-react';

const NAV_LINKS: { label: string; href: string }[] = [
  { label: 'Features', href: '#features' },
  { label: 'Workflow', href: '#workflow' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Customers', href: '#customers' },
  { label: 'FAQ', href: '#faq' },
];

export function MarketingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { isLoaded, isSignedIn } = useAuth();
  const showSignedIn = isLoaded && isSignedIn;
  const showSignedOut = isLoaded && !isSignedIn;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled ? 'brand-gradient-nav border-b border-white/10' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2.5 text-white">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--brand-orange-500)] to-[var(--brand-orange-600)] text-white shadow-[0_10px_30px_-10px_rgba(242,106,31,0.7)]">
              <Wrench className="h-5 w-5" />
            </span>
            <span className="text-lg font-bold tracking-tight">PlumberOS</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="text-sm font-medium text-white/70 hover:text-white transition-colors"
              >
                {l.label}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {showSignedOut && (
              <>
                <Link
                  href="/sign-in"
                  className="text-sm font-semibold text-white/80 hover:text-white px-3 py-2"
                >
                  Sign in
                </Link>
                <Link href="/sign-up" className="btn-primary text-sm">
                  Start free trial
                </Link>
              </>
            )}
            {showSignedIn && (
              <Link
                href="/app"
                className="btn-primary text-sm"
                aria-label="Open the PlumberOS app"
              >
                Open app
              </Link>
            )}
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="md:hidden p-2 text-white"
            aria-label="Toggle navigation"
          >
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 bg-[var(--brand-navy-900)]">
          <div className="px-6 py-4 space-y-3">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block text-base font-medium text-white/80"
              >
                {l.label}
              </a>
            ))}
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              {showSignedOut && (
                <>
                  <Link
                    href="/sign-in"
                    className="text-center text-sm font-semibold text-white/80 py-2"
                  >
                    Sign in
                  </Link>
                  <Link href="/sign-up" className="btn-primary text-sm">
                    Start free trial
                  </Link>
                </>
              )}
              {showSignedIn && (
                <Link href="/app" className="btn-primary text-sm">
                  Open app
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
