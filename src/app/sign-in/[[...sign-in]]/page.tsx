import { Suspense } from 'react';
import { SignInClient } from '../sign-in-client';

function SignInFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400">Loading…</div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInFallback />}>
      <SignInClient />
    </Suspense>
  );
}
