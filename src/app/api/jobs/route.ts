import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

// GET - Fetch jobs
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const plumber_id = searchParams.get('plumber_id');
  const customer_id = searchParams.get('customer_id');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');
  const search = searchParams.get('search');

  const offset = (page - 1) * limit;

  try {
    let query = sql`
      SELECT 
        j.*,
        c.name as customer_name,
        c.phone as customer_phone,
        c.address as customer_address,
        p.name as plumber_name,
        l.issue as lead_issue
      FROM jobs j
      LEFT JOIN customers c ON j.customer_id = c.id
      LEFT JOIN plumbers p ON j.plumber_id = p.id
      LEFT JOIN leads l ON j.lead_id = l.id
      WHERE 1=1
    `;
    
    let countQuery = sql`SELECT COUNT(*) as total FROM jobs j WHERE 1=1`;
    
    if (status && status !== 'all') {
      query = sql`${query} AND j.status = ${status}`;
      countQuery = sql`${countQuery} AND j.status = ${status}`;
    }
    if (plumber_id && plumber_id !== 'all') {
      query = sql`${query} AND j.plumber_id = ${plumber_id}`;
      countQuery = sql`${countQuery} AND j.plumber_id = ${plumber_id}`;
    }
    if (customer_id && customer_id !== 'all') {
      query = sql`${query} AND j.customer_id = ${customer_id}`;
      countQuery = sql`${countQuery} AND j.customer_id = ${customer_id}`;
    }
    if (search) {
      query = sql`${query} AND (c.name ILIKE ${'%' + search + '%'} OR j.type ILIKE ${'%' + search + '%'} OR j.description ILIKE ${'%' + search + '%'})`;
      countQuery = sql`${countQuery} AND (c.name ILIKE ${'%' + search + '%'} OR j.type ILIKE ${'%' + search + '%'} OR j.description ILIKE ${'%' + search + '%'})`;
    }

    const countResult = await countQuery;
    const total = countResult[0]?.total || 0;

    query = sql`
      ${query} 
      ORDER BY j.created_at DESC 
      LIMIT ${limit} OFFSET ${offset}
    `;

    const jobs = await query;

    return NextResponse.json({ jobs, total });
  } catch (error: unknown) {
    console.error('Error fetching jobs:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// POST - Create job
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

    const result = await sql`
      INSERT INTO jobs (company_id, lead_id, customer_id, plumber_id, status, type, description, scheduled_date, scheduled_time, estimated_price, notes)
      VALUES (
        ${companyId},
        ${body.lead_id || null},
        ${body.customer_id || null},
        ${body.plumber_id || null},
        ${body.status || 'scheduled'},
        ${body.type},
        ${body.description || null},
        ${body.scheduled_date || null},
        ${body.scheduled_time || null},
        ${body.estimated_price || null},
        ${body.notes || null}
      )
      RETURNING *
    `;

    return NextResponse.json({ job: result[0] });
  } catch (error: unknown) {
    console.error('Error creating job:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// PUT - Update job
export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  try {
    const result = await sql`
      UPDATE jobs 
      SET status = ${updates.status}, 
          plumber_id = ${updates.plumber_id || null},
          description = ${updates.description || null},
          scheduled_date = ${updates.scheduled_date || null},
          scheduled_time = ${updates.scheduled_time || null},
          estimated_price = ${updates.estimated_price || null},
          final_price = ${updates.final_price || null},
          notes = ${updates.notes || null},
          started_at = ${updates.status === 'in_progress' ? new Date() : null},
          completed_at = ${updates.status === 'completed' ? new Date() : null},
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ job: result[0] });
  } catch (error: unknown) {
    console.error('Error updating job:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// DELETE - Delete job
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  try {
    await sql`DELETE FROM jobs WHERE id = ${id}`;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting job:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}