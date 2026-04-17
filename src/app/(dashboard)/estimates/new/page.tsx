import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import { NewEstimateForm } from './new-estimate-form';

export default function NewEstimatePage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
        </div>
      }
    >
      <NewEstimateForm />
    </Suspense>
  );
}
