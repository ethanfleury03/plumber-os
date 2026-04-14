import { NextResponse } from 'next/server';
import { ESTIMATE_LINE_ITEM_PRESETS } from '@/lib/estimates/templates';

export async function GET() {
  return NextResponse.json({ presets: ESTIMATE_LINE_ITEM_PRESETS });
}
