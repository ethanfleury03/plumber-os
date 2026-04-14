import { NextResponse } from 'next/server';
import { createEstimateBodySchema } from '@/lib/estimates/validation';
import { createEstimate, getDefaultCompanyId, listEstimates } from '@/lib/estimates/service';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = (searchParams.get('company_id') || (await getDefaultCompanyId())) as string;
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const data = await listEstimates({ companyId, status, search, page, limit });
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = createEstimateBodySchema.parse(await request.json());
    const est = await createEstimate({
      company_id: body.company_id,
      title: body.title,
      description: body.description ?? null,
      customer_id: body.customer_id ?? null,
      lead_id: body.lead_id ?? null,
      job_id: body.job_id ?? null,
      receptionist_call_id: body.receptionist_call_id ?? null,
      source_type: body.source_type ?? null,
      source_id: body.source_id ?? null,
      assigned_to_plumber_id: body.assigned_to_plumber_id ?? null,
      notes_internal: body.notes_internal ?? null,
      notes_customer: body.notes_customer ?? null,
      expiration_date: body.expiration_date ?? null,
      discount_amount_cents: body.discount_amount_cents,
      tax_rate_basis_points: body.tax_rate_basis_points ?? null,
      deposit_amount_cents: body.deposit_amount_cents ?? null,
      selected_option_group: body.selected_option_group ?? null,
    });
    return NextResponse.json({ estimate: est });
  } catch (e) {
    console.error(e);
    const msg = e instanceof Error ? e.message : 'Error';
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
