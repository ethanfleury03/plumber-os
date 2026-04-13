import { NextResponse } from 'next/server';
import { receptionistService } from '@/lib/receptionist/service';
import { listCallsQuerySchema } from '@/lib/receptionist/validation';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = listCallsQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
    }
    const { page, limit } = parsed.data;
    const { calls, total } = await receptionistService.listCalls(page, limit);
    return NextResponse.json({ calls, total, page, limit });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
