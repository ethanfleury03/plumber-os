import Image from 'next/image';
import { Star, Quote } from 'lucide-react';
import { getLandingImage } from './landing-images';

const QUOTES = [
  {
    body: "The AI receptionist is the closest thing I've seen to a dispatcher who never sleeps. We booked 23 jobs last Saturday without anyone answering the phone. That weekend alone paid for the year.",
    author: 'Diana R.',
    role: 'Owner',
    company: 'Cedar Plumbing · 7 techs',
  },
  {
    body: "I used to run the truck all day and build invoices until midnight. Now the invoice goes out before I pull out of the driveway and I'm paid before dinner.",
    author: 'Marcus T.',
    role: 'Lead tech',
    company: 'Harbor Drain',
  },
  {
    body: "We had three tools doing dispatch, invoicing, and phones — all fighting each other. PlumberOS gave us one clean system and our dispatcher got her weekends back.",
    author: 'Priya S.',
    role: 'Operations manager',
    company: 'BlueStream Plumbing · 18 techs',
  },
];

const STATS = [
  { label: 'Calls answered', value: '24/7', sub: 'AI receptionist uptime' },
  { label: 'Invoice paid time', value: '19m', sub: 'median after send' },
  { label: 'Payout window', value: '2 days', sub: 'via Stripe Connect' },
  { label: 'Setup', value: '<20m', sub: 'new shop to first job' },
];

export function Testimonials() {
  const team = getLandingImage('team');
  return (
    <section id="customers" className="py-24 bg-[var(--brand-cream)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-12 gap-10 items-end mb-14">
          <div className="lg:col-span-7">
            <span className="eyebrow">Customers</span>
            <h2 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight">
              Shops on PlumberOS close faster, stay booked, and sleep more.
            </h2>
            <p className="mt-3 text-xs text-[var(--brand-slate-muted)] max-w-xl">
              Quotes and stats below are composite marketing examples for illustration, not verified customer
              metrics.
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="stat-bar">
              {STATS.map((s) => (
                <div key={s.label} className="stat-item">
                  <span className="stat-value">{s.value}</span>
                  <span className="stat-label">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl overflow-hidden relative mb-10">
          <Image
            src={team.src}
            alt={team.alt}
            width={team.width}
            height={team.height}
            className="w-full h-[360px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--brand-navy-900)]/80 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <span className="text-xs uppercase tracking-[0.2em] text-[var(--brand-orange-500)] font-bold">
              Real techs. Real shops.
            </span>
            <p className="mt-2 text-2xl md:text-3xl font-bold max-w-2xl">
              &ldquo;We stopped losing jobs to whoever picked up the phone fastest.&rdquo;
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-5">
          {QUOTES.map((q) => (
            <figure key={q.author} className="brand-card p-7 relative">
              <Quote className="h-7 w-7 text-[var(--brand-orange-500)] opacity-70" />
              <blockquote className="mt-4 text-[var(--brand-ink)] leading-relaxed">
                &ldquo;{q.body}&rdquo;
              </blockquote>
              <figcaption className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <div className="font-bold text-[var(--brand-ink)]">{q.author}</div>
                  <div className="text-xs text-[var(--brand-slate-muted)]">
                    {q.role} · {q.company}
                  </div>
                </div>
                <div className="flex gap-0.5 text-[var(--brand-orange-500)]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
