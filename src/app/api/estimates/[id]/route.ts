import {
  archiveEstimate,
  getEstimateAdminDetail,
  patchEstimate,
} from '@/lib/estimates/service';
import { patchEstimateBodySchema } from '@/lib/estimates/validation';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const detail = await getEstimateAdminDetail(id);
    if (!detail) {
      return NextResponse.json({ error: 'Estimate not found' }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const json = await request.json();
    const body = patchEstimateBodySchema.parse(json);
    const estimate = await patchEstimate(id, body);
    return NextResponse.json({ estimate });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    await archiveEstimate(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
