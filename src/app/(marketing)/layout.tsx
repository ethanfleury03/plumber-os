import type { Metadata } from 'next';
import './marketing.css';
import { MarketingNav } from './_components/MarketingNav';
import { MarketingFooter } from './_components/MarketingFooter';

export const metadata: Metadata = {
  title: 'PlumberOS — The operating system for modern plumbing companies',
  description:
    'Capture every call with an AI receptionist, dispatch the right tech, send estimates, collect payment, and keep customers coming back. PlumberOS runs the back office so plumbers can run the job.',
};

export default function MarketingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="marketing-root min-h-screen flex flex-col">
      <MarketingNav />
      <main className="flex-1">{children}</main>
      <MarketingFooter />
    </div>
  );
}
