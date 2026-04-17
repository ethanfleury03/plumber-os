import { approvePublicEstimate } from '@/lib/estimates/service';
import { publicApproveBodySchema } from '@/lib/estimates/validation';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  try {
    const json = await request.json().catch(() => ({}));
    const body = publicApproveBodySchema.parse(json);
    const estimate = await approvePublicEstimate(token, body);
    return NextResponse.json({ estimate });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}
