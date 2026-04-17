'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { SignIn } from '@clerk/nextjs';
import { Wrench } from 'lucide-react';

function ClerkLoginShell() {
  const sp = useSearchParams();
  const nextPath = sp.get('next') || '/';

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
          <p className="text-slate-400 text-sm mt-1 text-center">Sign in to continue</p>
        </div>

        <SignIn
          routing="path"
          path="/login"
          signUpUrl="/login"
          forceRedirectUrl={nextPath}
          signUpForceRedirectUrl={nextPath}
          appearance={{
            variables: {
              colorPrimary: '#3b82f6',
              colorBackground: 'rgba(15,23,42,0.95)',
              colorInputBackground: 'rgba(255,255,255,0.06)',
            },
            elements: {
              rootBox: 'w-full flex justify-center',
              card: 'bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl',
              headerTitle: 'text-white',
              headerSubtitle: 'text-slate-400',
              socialButtonsBlockButton: 'border-white/15 text-white',
              formButtonPrimary: 'bg-gradient-to-r from-blue-500 to-indigo-600',
              footerActionLink: 'text-blue-400',
            },
          }}
        />
      </div>
    </div>
  );
}

export function LoginClient() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400">Loading…</div>
      }
    >
      <ClerkLoginShell />
    </Suspense>
  );
}
