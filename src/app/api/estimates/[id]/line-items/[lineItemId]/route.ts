import { deleteLineItem, updateLineItem } from '@/lib/estimates/service';
import { patchLineItemBodySchema } from '@/lib/estimates/validation';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; lineItemId: string }> },
) {
  const { id, lineItemId } = await params;
  try {
    const json = await request.json();
    const body = patchLineItemBodySchema.parse(json);
    await updateLineItem(id, lineItemId, body);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; lineItemId: string }> },
) {
  const { id, lineItemId } = await params;
  try {
    await deleteLineItem(id, lineItemId);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}
