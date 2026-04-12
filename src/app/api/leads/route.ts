import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

// GET - Fetch leads
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const plumber_id = searchParams.get('plumber_id');
  const source = searchParams.get('source');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search');

  const offset = (page - 1) * limit;

  try {
    // Build query
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
      WHERE 1=1
    `;
    
    let countQuery = sql`SELECT COUNT(*) as total FROM leads l WHERE 1=1`;
    
    // Add filters
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
      query = sql`${query} AND (c.name ILIKE ${'%' + search + '%'} OR c.phone ILIKE ${'%' + search + '%'} OR l.location ILIKE ${'%' + search + '%'} OR l.issue ILIKE ${'%' + search + '%'})`;
      countQuery = sql`${countQuery} AND (c.name ILIKE ${'%' + search + '%'} OR c.phone ILIKE ${'%' + search + '%'} OR l.location ILIKE ${'%' + search + '%'} OR l.issue ILIKE ${'%' + search + '%'})`;
    }

    // Get total count
    const countResult = await countQuery;
    const total = countResult[0]?.total || 0;

    // Add ordering and pagination
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

// POST - Create lead
export async function POST(request: Request) {
  const body = await request.json();
  
  try {
    // Get or create default company
    let companyId = body.company_id;
    if (!companyId) {
      const companies = await sql`SELECT id FROM companies LIMIT 1`;
      if (companies.length > 0) {
        companyId = companies[0].id;
      } else {
        const newCompany = await sql`
          INSERT INTO companies (name, email)
          VALUES ('Demo Company', 'demo@plumberos.com')
          RETURNING id
        `;
        companyId = newCompany[0].id;
      }
    }
    
    // If customer_name or customer_phone provided, get or create customer
    let customerId = body.customer_id;
    if (!customerId && (body.customer_name || body.customer_phone)) {
      // Check if customer with same phone exists
      if (body.customer_phone) {
        const existingCustomer = await sql`
          SELECT id FROM customers WHERE phone = ${body.customer_phone} LIMIT 1
        `;
        if (existingCustomer.length > 0) {
          customerId = existingCustomer[0].id;
        }
      }
      
      // Create new customer if not found
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

// PUT - Update lead
export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  try {
    // Handle status update (most common)
    if (updates.status !== undefined) {
      const result = await sql`
        UPDATE leads SET status = ${updates.status}, updated_at = NOW() 
        WHERE id = ${id} RETURNING *
      `;
      return NextResponse.json({ lead: result[0] });
    }
    
    // Handle location update
    if (updates.location !== undefined) {
      const result = await sql`
        UPDATE leads SET location = ${updates.location}, updated_at = NOW() 
        WHERE id = ${id} RETURNING *
      `;
      return NextResponse.json({ lead: result[0] });
    }
    
    // Handle issue update
    if (updates.issue !== undefined) {
      const result = await sql`
        UPDATE leads SET issue = ${updates.issue}, updated_at = NOW() 
        WHERE id = ${id} RETURNING *
      `;
      return NextResponse.json({ lead: result[0] });
    }

    // Default response if no recognized fields
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Error updating lead:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// DELETE - Delete lead
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  try {
    await sql`DELETE FROM leads WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting lead:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
