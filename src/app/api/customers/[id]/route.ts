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

    return NextResponse.json({
      customer: customerRows[0],
      jobs,
      invoices,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
