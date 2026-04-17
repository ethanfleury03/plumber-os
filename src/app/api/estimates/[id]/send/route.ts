import { sendEstimate } from '@/lib/estimates/service';
import { sendEstimateBodySchema } from '@/lib/estimates/validation';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const json = await request.json().catch(() => ({}));
    const body = sendEstimateBodySchema.parse(json);
    const result = await sendEstimate(id, {
      recipient_email: body.recipient_email,
      delivery_type: body.delivery_type,
    });
    return NextResponse.json(result);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}
