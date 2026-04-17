import { createEstimate, listEstimates } from '@/lib/estimates/service';
import { createEstimateBodySchema } from '@/lib/estimates/validation';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') || 'all';
  const search = searchParams.get('search') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const limit = parseInt(searchParams.get('limit') || '50', 10);

  try {
    const { estimates, total, page: p, limit: l } = await listEstimates({
      status,
      search,
      page,
      limit,
    });
    return NextResponse.json({ estimates, total, page: p, limit: l });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const body = createEstimateBodySchema.parse(json);
    const estimate = await createEstimate(body);
    return NextResponse.json({ estimate });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}
