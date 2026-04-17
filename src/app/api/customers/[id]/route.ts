import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  try {
    const customerRows = await sql`SELECT * FROM customers WHERE id = ${id}`;
    if (customerRows.length === 0) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const jobs = await sql`
      SELECT * FROM jobs WHERE customer_id = ${id} ORDER BY created_at DESC
    `;
    const invoices = await sql`
      SELECT * FROM invoices WHERE customer_id = ${id} ORDER BY created_at DESC
    `;
    const estimates = await sql`
      SELECT id, estimate_number, status, title, total_amount_cents, created_at, sent_at
      FROM estimates
      WHERE customer_id = ${id} AND archived_at IS NULL
      ORDER BY created_at DESC
    `;

    return NextResponse.json({
      customer: customerRows[0],
      jobs,
      invoices,
      estimates,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
