import { NextResponse } from 'next/server';
import { approveEstimateByToken, buildEstimatePresentation } from '@/lib/estimates/service';

type Ctx = { params: Promise<{ token: string }> };

export async function POST(_request: Request, ctx: Ctx) {
  try {
    const { token } = await ctx.params;
    const row = await approveEstimateByToken(token);
    const presentation = await buildEstimatePresentation(row!.id as string, { internal: false });
    return NextResponse.json({ ok: true, presentation });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 400 });
  }
}
