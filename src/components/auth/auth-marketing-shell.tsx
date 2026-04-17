'use client';

import type { ReactNode } from 'react';
import { Wrench } from 'lucide-react';

export function AuthMarketingShell({
  subtitle,
  children,
}: {
  subtitle: string;
  children: ReactNode;
}) {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #1e1b4b 100%)',
      }}
    >
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div
          className="absolute -top-40 -left-40 w-96 h-96 rounded-full opacity-20"
          style={{
            background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute -bottom-40 -right-40 w-96 h-96 rounded-full opacity-15"
          style={{
            background: 'radial-gradient(circle, #8b5cf6 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative w-full max-w-md flex flex-col items-center gap-6">
        <div className="flex flex-col items-center">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
              boxShadow: '0 0 40px rgba(59,130,246,0.4)',
            }}
          >
            <Wrench className="w-7 h-7 text-white" strokeWidth={2} />
          </div>
          <h1
            className="text-3xl font-bold text-center"
            style={{
              background: 'linear-gradient(90deg, #fff 0%, #cbd5e1 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            PlumberOS
          </h1>
          <p className="text-slate-400 text-sm mt-1 text-center">{subtitle}</p>
        </div>
        {children}
      </div>
    </div>
  );
}
