import { NextResponse } from 'next/server';
import { z } from 'zod';
import { sendEstimate } from '@/lib/estimates/service';

const bodySchema = z.object({ recipientEmail: z.string().email().optional().nullable() });

type Ctx = { params: Promise<{ id: string }> };

export async function POST(request: Request, ctx: Ctx) {
  try {
    const { id } = await ctx.params;
    const json = await request.json().catch(() => ({}));
    const body = bodySchema.parse(json);
    const result = await sendEstimate(id, { recipientEmail: body.recipientEmail });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 400 });
  }
}
