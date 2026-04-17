import { EstimateDetailClient } from '@/components/estimates/estimate-detail-client';

export default async function EstimateDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EstimateDetailClient estimateId={id} />;
}
