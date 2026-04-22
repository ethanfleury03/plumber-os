import type { Metadata } from 'next';
import './marketing.css';
import { MarketingNav } from './_components/MarketingNav';
import { MarketingFooter } from './_components/MarketingFooter';
import { absoluteUrl, getSiteUrl } from '@/lib/marketing/site';

export const metadata: Metadata = {
  title: 'PlumberOS — The operating system for modern plumbing companies',
  description:
    'Capture every call with an AI receptionist, dispatch the right tech, send estimates, collect payment, and keep customers coming back. PlumberOS runs the back office so plumbers can run the job.',
  metadataBase: new URL(getSiteUrl()),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    url: '/',
    title: 'PlumberOS — The operating system for modern plumbing companies',
    description:
      'Capture every call with an AI receptionist, dispatch the right tech, send estimates, collect payment, and keep customers coming back.',
    siteName: 'PlumberOS',
    images: [
      {
        url: absoluteUrl('/opengraph-image'),
        width: 1200,
        height: 630,
        alt: 'PlumberOS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PlumberOS',
    description:
      'The operating system for modern plumbing companies.',
    images: [absoluteUrl('/twitter-image')],
  },
};

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const orgLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'PlumberOS',
    url: getSiteUrl(),
    logo: absoluteUrl('/icon.svg'),
  };
  const siteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'PlumberOS',
    url: getSiteUrl(),
  };

  return (
    <div className="marketing-root min-h-screen flex flex-col">
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgLd) }}
      />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: JSON.stringify(siteLd) }}
      />
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[130] focus:bg-white focus:text-[var(--brand-ink)] focus:px-3 focus:py-2 focus:rounded-md"
      >
        Skip to main content
      </a>
      <MarketingNav />
      <main id="main-content" className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
