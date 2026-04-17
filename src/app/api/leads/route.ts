import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';
import { requirePortalUser } from '@/lib/auth/tenant';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

export async function GET(request: Request) {
  const portal = await requirePortalUser().catch(() => null);
  if (!portal) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const plumber_id = searchParams.get('plumber_id');
  const source = searchParams.get('source');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search');

  const offset = (page - 1) * limit;

  try {
    let query = sql`
      SELECT 
        l.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.email as customer_email,
        c.address as customer_address,
        p.name as plumber_name
      FROM leads l
      LEFT JOIN customers c ON l.customer_id = c.id
      LEFT JOIN plumbers p ON l.plumber_id = p.id
      WHERE l.company_id = ${portal.companyId}
    `;

    let countQuery = sql`
      SELECT COUNT(*) as total FROM leads l WHERE l.company_id = ${portal.companyId}
    `;

    if (status && status !== 'all') {
      query = sql`${query} AND l.status = ${status}`;
      countQuery = sql`${countQuery} AND l.status = ${status}`;
    }
    if (plumber_id && plumber_id !== 'all') {
      query = sql`${query} AND l.plumber_id = ${plumber_id}`;
      countQuery = sql`${countQuery} AND l.plumber_id = ${plumber_id}`;
    }
    if (source && source !== 'all') {
      query = sql`${query} AND l.source = ${source}`;
      countQuery = sql`${countQuery} AND l.source = ${source}`;
    }
    if (search) {
      query = sql`${query} AND (c.name LIKE ${'%' + search + '%'} OR c.phone LIKE ${'%' + search + '%'} OR l.location LIKE ${'%' + search + '%'} OR l.issue LIKE ${'%' + search + '%'})`;
      countQuery = sql`${countQuery} AND (c.name LIKE ${'%' + search + '%'} OR c.phone LIKE ${'%' + search + '%'} OR l.location LIKE ${'%' + search + '%'} OR l.issue LIKE ${'%' + search + '%'})`;
    }

    const countResult = await countQuery;
    const total = countResult[0]?.total || 0;

    query = sql`
      ${query} 
      ORDER BY l.created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `;

    const leads = await query;

    return NextResponse.json({ leads, total });
  } catch (error: unknown) {
    console.error('Error fetching leads:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const portal = await requirePortalUser().catch(() => null);
  if (!portal) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();

  try {
    const companyId = portal.companyId;

    let customerId = body.customer_id;
    if (customerId) {
      const exists = await sql`
        SELECT 1 FROM customers WHERE id = ${customerId} AND company_id = ${companyId} LIMIT 1
      `;
      if (exists.length === 0) {
        return NextResponse.json({ error: 'Customer not found' }, { status: 400 });
      }
    }

    if (!customerId && (body.customer_name || body.customer_phone)) {
      if (body.customer_phone) {
        const existingCustomer = await sql`
          SELECT id FROM customers
          WHERE phone = ${body.customer_phone} AND company_id = ${companyId}
          LIMIT 1
        `;
        if (existingCustomer.length > 0) {
          customerId = existingCustomer[0].id;
        }
      }

      if (!customerId) {
        const newCustomer = await sql`
          INSERT INTO customers (company_id, name, phone, email, address)
          VALUES (
            ${companyId},
            ${body.customer_name || 'Unknown'},
            ${body.customer_phone || ''},
            ${body.customer_email || null},
            ${body.customer_address || null}
          )
          RETURNING id
        `;
        customerId = newCustomer[0].id;
      }
    }

    if (body.plumber_id) {
      const exists = await sql`
        SELECT 1 FROM plumbers WHERE id = ${body.plumber_id} AND company_id = ${companyId} LIMIT 1
      `;
      if (exists.length === 0) {
        return NextResponse.json({ error: 'Plumber not found' }, { status: 400 });
      }
    }

    const result = await sql`
      INSERT INTO leads (company_id, customer_id, plumber_id, source, status, priority, issue, description, location)
      VALUES (
        ${companyId},
        ${customerId || null},
        ${body.plumber_id || null},
        ${body.source || 'website'},
        ${body.status || 'new'},
        ${body.priority || 3},
        ${body.issue},
        ${body.description || null},
        ${body.location || null}
      )
      RETURNING *
    `;

    return NextResponse.json({ lead: result[0] });
  } catch (error: unknown) {
    console.error('Error creating lead:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  const portal = await requirePortalUser().catch(() => null);
  if (!portal) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  try {
    const existing = await sql`
      SELECT company_id FROM leads WHERE id = ${id} LIMIT 1
    `;
    if (existing.length === 0 || String((existing[0] as Record<string, unknown>).company_id) !== portal.companyId) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (updates.status !== undefined) {
      const result = await sql`
        UPDATE leads SET status = ${updates.status}, updated_at = datetime('now') 
        WHERE id = ${id} AND company_id = ${portal.companyId} RETURNING *
      `;
      return NextResponse.json({ lead: result[0] });
    }

    if (updates.location !== undefined) {
      const result = await sql`
        UPDATE leads SET location = ${updates.location}, updated_at = datetime('now') 
        WHERE id = ${id} AND company_id = ${portal.companyId} RETURNING *
      `;
      return NextResponse.json({ lead: result[0] });
    }

    if (updates.issue !== undefined) {
      const result = await sql`
        UPDATE leads SET issue = ${updates.issue}, updated_at = datetime('now') 
        WHERE id = ${id} AND company_id = ${portal.companyId} RETURNING *
      `;
      return NextResponse.json({ lead: result[0] });
    }

    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const portal = await requirePortalUser().catch(() => null);
  if (!portal) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  try {
    await sql`DELETE FROM leads WHERE id = ${id} AND company_id = ${portal.companyId}`;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
