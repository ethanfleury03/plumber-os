import Link from 'next/link';
import { Show } from '@clerk/nextjs';
import { ArrowRight, PhoneCall } from 'lucide-react';
import { getDemoOrSalesHref, getSalesMailto } from '@/lib/marketing/cta';

export function CTABanner() {
  const bookDemoHref = getDemoOrSalesHref();
  const bookDemoExternal = bookDemoHref.startsWith('http');

  return (
    <section className="relative py-24 overflow-hidden">
      <div className="absolute inset-0 brand-hero-bg" />
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(rgba(255,255,255,0.9) 1.2px, transparent 1.2px)',
          backgroundSize: '28px 28px',
        }}
      />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white">
        <span className="glow-pill glow-pill-dark">
          <PhoneCall className="h-3.5 w-3.5" />
          Let&apos;s run the numbers on your shop
        </span>
        <h2 className="mt-6 text-4xl sm:text-5xl font-extrabold tracking-tight leading-tight">
          Stop losing jobs to voicemail.
          <br />
          <span className="text-[var(--brand-orange-500)]">Start running the shop like it&apos;s 2026.</span>
        </h2>
        <p className="mt-6 text-lg text-white/75 max-w-2xl mx-auto">
          Spin up a free 14-day trial or book a 20-minute demo with a former dispatcher on our team. We&apos;ll
          import your customers and get you live on your next ringing phone.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Show when="signed-out">
            <Link href="/sign-up" className="btn-primary text-base">
              Start free trial
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href={bookDemoHref}
              className="btn-ghost text-base"
              {...(bookDemoExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            >
              Book a demo
            </a>
          </Show>
          <Show when="signed-in">
            <Link href="/app" className="btn-primary text-base">
              Open your dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href={getSalesMailto()} className="btn-ghost text-base">
              Talk to sales
            </a>
          </Show>
        </div>
        <p className="mt-4 text-xs text-white/50">
          No credit card required. Cancel anytime. We never sell your data.
        </p>
      </div>
    </section>
  );
}
