import { NextResponse } from 'next/server';
import { buildEstimatePresentation, expireEstimateIfNeeded, getEstimateByPublicToken } from '@/lib/estimates/service';

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  try {
    const { token } = await ctx.params;
    let row = await getEstimateByPublicToken(token);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const expired = await expireEstimateIfNeeded(row);
    if (expired) {
      row = (await getEstimateByPublicToken(token))!;
    }
    if ((row.status as string) === 'draft') {
      return NextResponse.json({ error: 'Not available' }, { status: 404 });
    }
    const id = row.id as string;
    const presentation = await buildEstimatePresentation(id, { internal: false });
    return NextResponse.json(presentation);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}
