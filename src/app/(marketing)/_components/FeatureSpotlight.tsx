import Image from 'next/image';
import type { ReactNode } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { LandingImage } from './landing-images';

export interface FeatureSpotlightProps {
  id: string;
  eyebrow: string;
  title: ReactNode;
  body: string;
  bullets: string[];
  image: LandingImage;
  reverse?: boolean;
  mockup?: ReactNode;
  variant?: 'light' | 'dark';
}

export function FeatureSpotlight({
  id,
  eyebrow,
  title,
  body,
  bullets,
  image,
  reverse = false,
  mockup,
  variant = 'light',
}: FeatureSpotlightProps) {
  const dark = variant === 'dark';
  return (
    <section
      id={id}
      className={`py-24 ${dark ? 'bg-[var(--brand-navy-900)] text-white' : 'bg-white'}`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`grid lg:grid-cols-12 gap-12 items-center ${reverse ? 'lg:[&>div:first-child]:order-2' : ''}`}>
          <div className="lg:col-span-5">
            <span className={`eyebrow ${dark ? 'eyebrow-on-dark' : ''}`}>{eyebrow}</span>
            <h2
              className={`mt-4 text-3xl sm:text-4xl lg:text-[2.6rem] font-extrabold tracking-tight leading-[1.1] ${
                dark ? 'text-white' : ''
              }`}
            >
              {title}
            </h2>
            <p className={`mt-5 text-lg leading-relaxed ${dark ? 'text-white/75' : 'text-[var(--brand-slate)]'}`}>
              {body}
            </p>
            <ul className="mt-8 space-y-3">
              {bullets.map((b) => (
                <li key={b} className={`flex items-start gap-3 ${dark ? 'text-white/80' : 'text-[var(--brand-ink)]'}`}>
                  <CheckCircle2
                    className={`mt-0.5 h-5 w-5 flex-shrink-0 ${dark ? 'text-[var(--brand-orange-500)]' : 'text-[var(--brand-orange-600)]'}`}
                  />
                  <span className="leading-snug">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-7 relative">
            <div className="relative">
              <Image
                src={image.src}
                alt={image.alt}
                width={image.width}
                height={image.height}
                className="w-full h-auto rounded-2xl object-cover shadow-[0_40px_80px_-30px_rgba(11,20,34,0.45)]"
              />
              {mockup}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
