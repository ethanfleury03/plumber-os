import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

const toMoney = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const todayIsoDate = () => new Date().toISOString().split('T')[0];

function mapInvoiceRow(row: Record<string, unknown>) {
  const cust_name = row.cust_name;
  const cust_email = row.cust_email;
  const cust_phone = row.cust_phone;
  const inv = { ...row };
  delete inv.cust_name;
  delete inv.cust_email;
  delete inv.cust_phone;
  const customerId = inv.customer_id;
  const customers =
    customerId &&
    (cust_name != null || cust_email != null || cust_phone != null)
      ? {
          name: cust_name as string | null | undefined,
          email: cust_email as string | null | undefined,
          phone: cust_phone as string | null | undefined,
        }
      : null;
  return { ...inv, customers };
}

async function getNextInvoiceNumber() {
  const rows = await sql`SELECT COUNT(*) as total FROM invoices`;
  const total = Number(rows[0]?.total || 0);
  const next = total + 1;
  return `INV-${String(next).padStart(4, '0')}`;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const customer_id = searchParams.get('customer_id');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const offset = (page - 1) * limit;

  try {
    let countQuery = sql`SELECT COUNT(*) as total FROM invoices i WHERE 1=1`;
    let dataQuery = sql`
      SELECT
        i.*,
        c.name AS cust_name,
        c.email AS cust_email,
        c.phone AS cust_phone
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE 1=1
    `;

    if (status && status !== 'all') {
      countQuery = sql`${countQuery} AND i.status = ${status}`;
      dataQuery = sql`${dataQuery} AND i.status = ${status}`;
    }
    if (customer_id && customer_id !== 'all') {
      countQuery = sql`${countQuery} AND i.customer_id = ${customer_id}`;
      dataQuery = sql`${dataQuery} AND i.customer_id = ${customer_id}`;
    }

    const countResult = await countQuery;
    const total = Number(countResult[0]?.total || 0);

    dataQuery = sql`
      ${dataQuery}
      ORDER BY i.created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `;

    const rows = await dataQuery;
    const invoices = rows.map(mapInvoiceRow);

    return NextResponse.json({ invoices, total });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const body = await request.json();

  try {
    let companyId = body.company_id || null;
    let customerId = body.customer_id || null;
    const jobId = body.job_id || null;
    let serviceType = body.service_type || null;
    let notes = body.notes || null;
    let amount = toMoney(body.amount);

    if (jobId) {
      const jobRows = await sql`
        SELECT id, company_id, customer_id, type, description, estimated_price, final_price
        FROM jobs WHERE id = ${jobId} LIMIT 1
      `;
      if (jobRows.length === 0) {
        return NextResponse.json({ error: 'Job not found' }, { status: 400 });
      }
      const job = jobRows[0];
      companyId = companyId || (job.company_id as string);
      customerId = customerId || (job.customer_id as string | null);
      serviceType = serviceType || (job.type as string);
      notes = notes || (job.description as string | null) || null;
      amount =
        amount ||
        toMoney(job.final_price, toMoney(job.estimated_price));
    }

    if (body.lead_id) {
      const leadRows = await sql`
        SELECT id, company_id, customer_id, issue, description
        FROM leads WHERE id = ${body.lead_id} LIMIT 1
      `;
      if (leadRows.length === 0) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 400 });
      }
      const lead = leadRows[0];
      companyId = companyId || (lead.company_id as string);
      customerId = customerId || (lead.customer_id as string | null);
      serviceType = serviceType || (lead.issue as string);
      notes = notes || (lead.description as string | null) || null;
    }

    if (!companyId) {
      const companies = await sql`SELECT id FROM companies ORDER BY created_at ASC LIMIT 1`;
      if (companies.length === 0) {
        return NextResponse.json({ error: 'No company found' }, { status: 400 });
      }
      companyId = companies[0].id as string;
    }

    if (!customerId && body.customer_name && companyId) {
      let existing: Record<string, unknown>[] = [];
      if (body.customer_phone) {
        existing = await sql`
          SELECT id FROM customers
          WHERE company_id = ${companyId} AND phone = ${body.customer_phone}
          LIMIT 1
        `;
      }

      if (existing.length > 0) {
        customerId = existing[0].id as string;
      } else {
        const created = await sql`
          INSERT INTO customers (company_id, name, phone, email, address)
          VALUES (
            ${companyId},
            ${body.customer_name},
            ${body.customer_phone || 'Unknown'},
            ${body.customer_email || null},
            ${body.customer_address || null}
          )
          RETURNING id
        `;
        customerId = created[0].id as string;
      }
    }

    const tax = toMoney(body.tax);
    const total = toMoney(body.total, amount + tax);
    const issueDate = body.issue_date || body.date || todayIsoDate();
    const dueDate = body.due_date || null;
    const paidDate = body.status === 'paid' ? body.paid_date || todayIsoDate() : null;

    const invoiceNumber = await getNextInvoiceNumber();

    await sql`
      INSERT INTO invoices (
        company_id, customer_id, job_id, invoice_number, service_type,
        status, amount, tax, total, issue_date, due_date, paid_date, notes
      )
      VALUES (
        ${companyId},
        ${customerId},
        ${jobId},
        ${invoiceNumber},
        ${serviceType},
        ${body.status || 'pending'},
        ${amount},
        ${tax},
        ${total},
        ${issueDate},
        ${dueDate},
        ${paidDate},
        ${notes}
      )
    `;

    const fullRows = await sql`
      SELECT
        i.*,
        c.name AS cust_name,
        c.email AS cust_email,
        c.phone AS cust_phone
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.invoice_number = ${invoiceNumber}
      LIMIT 1
    `;

    return NextResponse.json({ invoice: mapInvoiceRow(fullRows[0]) });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  try {
    const existing = await sql`SELECT * FROM invoices WHERE id = ${id} LIMIT 1`;
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
    }
    const cur = existing[0];

    let paidDate: string | null = (cur.paid_date as string | null) ?? null;
    if (updates.status === 'paid') {
      paidDate = (updates.paid_date as string) || todayIsoDate();
    } else if (updates.status != null && updates.status !== 'paid') {
      paidDate = null;
    } else if (updates.paid_date !== undefined) {
      paidDate = updates.paid_date as string | null;
    }

    await sql`
      UPDATE invoices SET
        company_id = ${updates.company_id ?? cur.company_id},
        customer_id = ${updates.customer_id ?? cur.customer_id},
        job_id = ${updates.job_id ?? cur.job_id},
        invoice_number = ${updates.invoice_number ?? cur.invoice_number},
        service_type = ${updates.service_type ?? cur.service_type},
        status = ${updates.status ?? cur.status},
        amount = ${updates.amount ?? cur.amount},
        tax = ${updates.tax ?? cur.tax},
        total = ${updates.total ?? cur.total},
        issue_date = ${updates.issue_date ?? cur.issue_date},
        due_date = ${updates.due_date ?? cur.due_date},
        paid_date = ${paidDate},
        notes = ${updates.notes ?? cur.notes},
        updated_at = datetime('now')
      WHERE id = ${id}
    `;

    const fullRows = await sql`
      SELECT
        i.*,
        c.name AS cust_name,
        c.email AS cust_email,
        c.phone AS cust_phone
      FROM invoices i
      LEFT JOIN customers c ON i.customer_id = c.id
      WHERE i.id = ${id}
      LIMIT 1
    `;

    return NextResponse.json({ invoice: mapInvoiceRow(fullRows[0]) });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
