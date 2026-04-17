import { getEstimateSettings, patchEstimateSettings } from '@/lib/estimates/service';
import { estimateSettingsPatchSchema } from '@/lib/estimates/validation';
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

export async function GET() {
  try {
    const settings = await getEstimateSettings();
    return NextResponse.json({ settings });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const json = await request.json();
    const patch = estimateSettingsPatchSchema.parse(json);
    const settings = await patchEstimateSettings(patch as Record<string, unknown>);
    return NextResponse.json({ settings });
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return NextResponse.json({ error: 'Validation failed', issues: error.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 400 });
  }
}
