import { NextResponse } from 'next/server';
import { markEstimateViewedByToken } from '@/lib/estimates/service';
import { buildEstimatePresentation } from '@/lib/estimates/service';

type Ctx = { params: Promise<{ token: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  try {
    const { token } = await ctx.params;
    const row = await markEstimateViewedByToken(token);
    if (!row) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const presentation = await buildEstimatePresentation(row.id as string, { internal: false });
    return NextResponse.json({ ok: true, presentation });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 400 });
  }
}
