import { Suspense } from 'react';
import { SignUpClient } from '../sign-up-client';

function SignUpFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400">Loading…</div>
  );
}

export default function SignUpPage() {
  return (
    <Suspense fallback={<SignUpFallback />}>
      <SignUpClient />
    </Suspense>
  );
}
