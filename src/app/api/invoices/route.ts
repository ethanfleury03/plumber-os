import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

const toMoney = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const todayIsoDate = () => new Date().toISOString().split('T')[0];

async function getNextInvoiceNumber() {
  const { count, error } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true });

  if (error) {
    throw new Error(error.message);
  }

  const next = (count || 0) + 1;
  return `INV-${String(next).padStart(4, '0')}`;
}

// GET - Fetch invoices
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const customer_id = searchParams.get('customer_id');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '10');

  let query = supabase
    .from('invoices')
    .select('*, customers(name, email, phone)', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1);

  if (status && status !== 'all') {
    query = query.eq('status', status);
  }
  if (customer_id && customer_id !== 'all') {
    query = query.eq('customer_id', customer_id);
  }

  const { data, error, count } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invoices: data, total: count });
}

// POST - Create invoice
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
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('id, company_id, customer_id, type, description, estimated_price, final_price')
        .eq('id', jobId)
        .single();

      if (jobError) {
        return NextResponse.json({ error: jobError.message }, { status: 400 });
      }

      companyId = companyId || job.company_id;
      customerId = customerId || job.customer_id;
      serviceType = serviceType || job.type;
      notes = notes || job.description || null;
      amount = amount || toMoney(job.final_price, toMoney(job.estimated_price));
    }

    if (body.lead_id) {
      const { data: lead, error: leadError } = await supabase
        .from('leads')
        .select('id, company_id, customer_id, issue, description')
        .eq('id', body.lead_id)
        .single();

      if (leadError) {
        return NextResponse.json({ error: leadError.message }, { status: 400 });
      }

      companyId = companyId || lead.company_id;
      customerId = customerId || lead.customer_id;
      serviceType = serviceType || lead.issue;
      notes = notes || lead.description || null;
    }

    if (!companyId) {
      const { data: company, error: companyError } = await supabase
        .from('companies')
        .select('id')
        .order('created_at', { ascending: true })
        .limit(1)
        .single();

      if (companyError) {
        return NextResponse.json({ error: companyError.message }, { status: 400 });
      }

      companyId = company.id;
    }

    if (!customerId && body.customer_name && companyId) {
      let existingCustomer = null;

      if (body.customer_phone) {
        const lookup = await supabase
          .from('customers')
          .select('id')
          .eq('company_id', companyId)
          .eq('phone', body.customer_phone)
          .limit(1)
          .maybeSingle();

        if (lookup.error) {
          return NextResponse.json({ error: lookup.error.message }, { status: 500 });
        }

        existingCustomer = lookup.data;
      }

      if (existingCustomer) {
        customerId = existingCustomer.id;
      } else {
        const createdCustomer = await supabase
          .from('customers')
          .insert([
            {
              company_id: companyId,
              name: body.customer_name,
              phone: body.customer_phone || 'Unknown',
              email: body.customer_email || null,
              address: body.customer_address || null,
            },
          ])
          .select('id')
          .single();

        if (createdCustomer.error) {
          return NextResponse.json({ error: createdCustomer.error.message }, { status: 500 });
        }

        customerId = createdCustomer.data.id;
      }
    }

    const tax = toMoney(body.tax);
    const total = toMoney(body.total, amount + tax);
    const issueDate = body.issue_date || body.date || todayIsoDate();
    const dueDate = body.due_date || null;
    const paidDate = body.status === 'paid' ? body.paid_date || todayIsoDate() : null;

    const invoice = {
      company_id: companyId,
      customer_id: customerId,
      job_id: jobId,
      invoice_number: await getNextInvoiceNumber(),
      service_type: serviceType,
      status: body.status || 'pending',
      amount,
      tax,
      total,
      issue_date: issueDate,
      due_date: dueDate,
      paid_date: paidDate,
      notes,
    };

    const { data, error } = await supabase
      .from('invoices')
      .insert([invoice])
      .select('*, customers(name, email, phone)')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invoice: data });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// PUT - Update invoice (mark as paid, etc.)
export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...updates } = body;

  const payload = {
    ...updates,
    paid_date:
      updates.status === 'paid'
        ? updates.paid_date || todayIsoDate()
        : updates.status && updates.status !== 'paid'
          ? null
          : updates.paid_date,
  };

  const { data, error } = await supabase
    .from('invoices')
    .update(payload)
    .eq('id', id)
    .select('*, customers(name, email, phone)')
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invoice: data });
}

// DELETE - Delete invoice
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  const { error } = await supabase
    .from('invoices')
    .delete()
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
