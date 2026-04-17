import { PublicEstimateView } from '@/components/estimates/public-estimate-view';
import { getCustomerEstimatePageData } from '@/lib/estimates/service';
import { notFound } from 'next/navigation';

export default async function PublicEstimatePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const data = await getCustomerEstimatePageData(token);
  if (!data) notFound();
  return <PublicEstimateView token={token} data={data} />;
}
