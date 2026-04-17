import { getEstimateDashboardStats } from '@/lib/estimates/service';
import { NextResponse } from 'next/server';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

export async function GET() {
  try {
    const stats = await getEstimateDashboardStats();
    return NextResponse.json(stats);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
