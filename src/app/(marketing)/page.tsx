import { Hero } from './_components/Hero';
import { ValueStrip } from './_components/ValueStrip';
import { FeatureSpotlights } from './_components/FeatureSpotlights';
import { FeatureGrid } from './_components/FeatureGrid';
import { Workflow } from './_components/Workflow';
import { Testimonials } from './_components/Testimonials';
import { Pricing } from './_components/Pricing';
import { FAQ } from './_components/FAQ';
import { CTABanner } from './_components/CTABanner';

export default function LandingPage() {
  return (
    <>
      <Hero />
      <ValueStrip />
      <FeatureSpotlights />
      <FeatureGrid />
      <Workflow />
      <Testimonials />
      <Pricing />
      <FAQ />
      <CTABanner />
    </>
  );
}
