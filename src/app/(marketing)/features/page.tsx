import type { Metadata } from 'next';
import { FeatureSpotlights } from '../_components/FeatureSpotlights';
import { FeatureGrid } from '../_components/FeatureGrid';
import { Workflow } from '../_components/Workflow';
import { CTABanner } from '../_components/CTABanner';
import { absoluteUrl } from '@/lib/marketing/site';

export const metadata: Metadata = {
  title: 'Features — PlumberOS',
  description:
    'AI receptionist, dispatch, estimates, invoices, customer portal, reports, and the full PlumberOS feature inventory.',
  alternates: { canonical: '/features' },
  openGraph: {
    title: 'Features — PlumberOS',
    description:
      'AI receptionist, dispatch, estimates, invoices, customer portal, reports, and the full PlumberOS feature inventory.',
    url: '/features',
    type: 'website',
    images: [absoluteUrl('/opengraph-image')],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Features — PlumberOS',
    description:
      'AI receptionist, dispatch, estimates, invoices, customer portal, and reports.',
    images: [absoluteUrl('/twitter-image')],
  },
};

export default function FeaturesPage() {
  return (
    <>
      <FeatureSpotlights />
      <FeatureGrid />
      <Workflow />
      <CTABanner />
    </>
  );
}
