import Link from 'next/link';
import { Wrench, Twitter, Linkedin, Github } from 'lucide-react';

const PRODUCT_LINKS = [
  { label: 'AI Receptionist', href: '#spotlight-receptionist' },
  { label: 'Dispatch & Mobile', href: '#spotlight-dispatch' },
  { label: 'Estimates & Invoices', href: '#spotlight-payments' },
  { label: 'Customer Portal', href: '#spotlight-portal' },
  { label: 'Reports', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
];

const COMPANY_LINKS = [
  { label: 'About', href: '#' },
  { label: 'Customers', href: '#customers' },
  { label: 'Blog', href: '#' },
  { label: 'Careers', href: '#' },
  { label: 'Contact sales', href: 'mailto:sales@plumber.os' },
];

const LEGAL_LINKS = [
  { label: 'Terms of service', href: '#' },
  { label: 'Privacy policy', href: '#' },
  { label: 'DPA', href: '#' },
  { label: 'Security', href: '#' },
];

export function MarketingFooter() {
  return (
    <footer className="bg-[var(--brand-navy-900)] text-white/70">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2">
            <Link href="/" className="inline-flex items-center gap-2.5 text-white">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[var(--brand-orange-500)] to-[var(--brand-orange-600)] text-white shadow-[0_10px_30px_-10px_rgba(242,106,31,0.7)]">
                <Wrench className="h-5 w-5" />
              </span>
              <span className="text-lg font-bold tracking-tight">PlumberOS</span>
            </Link>
            <p className="mt-4 text-sm max-w-sm leading-relaxed">
              The operating system for modern plumbing companies. Capture every call, dispatch the right tech, and
              get paid faster.
            </p>
            <div className="mt-6 flex items-center gap-3">
              <a
                href="#"
                aria-label="Twitter"
                className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-white/10 hover:bg-white/5"
              >
                <Twitter className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="LinkedIn"
                className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-white/10 hover:bg-white/5"
              >
                <Linkedin className="h-4 w-4" />
              </a>
              <a
                href="#"
                aria-label="GitHub"
                className="h-9 w-9 inline-flex items-center justify-center rounded-md border border-white/10 hover:bg-white/5"
              >
                <Github className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              {COMPANY_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              {LEGAL_LINKS.map((l) => (
                <li key={l.label}>
                  <a href={l.href} className="hover:text-white transition-colors">
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/50">
            © {new Date().getFullYear()} PlumberOS, Inc. All rights reserved.
          </p>
          <p className="text-xs text-white/50">Made for plumbers, by builders who&apos;ve been on the truck.</p>
        </div>
      </div>
    </footer>
  );
}
