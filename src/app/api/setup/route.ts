import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

export async function GET() {
  try {
    await sql`create extension if not exists "uuid-ossp"`;

    await sql`
      CREATE TABLE IF NOT EXISTS buckets (
        id uuid default uuid_generate_v4() primary key,
        title text not null,
        color text default '#6b7280',
        position integer not null,
        created_at timestamp with time zone default timezone('utc'::text, now()) not null,
        updated_at timestamp with time zone default timezone('utc'::text, now()) not null
      )
    `;

    await sql`ALTER TABLE buckets ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone default timezone('utc'::text, now()) not null`;
    await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_buckets_position_unique ON buckets(position)`;

    await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS scheduled_date date`;
    await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS scheduled_time time`;
    await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS estimated_price decimal(10,2)`;
    await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS final_price decimal(10,2)`;
    await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS notes text`;
    await sql`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone default timezone('utc'::text, now()) not null`;
    await sql`ALTER TABLE plumbers ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone default timezone('utc'::text, now()) not null`;

    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS service_type text`;
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS tax decimal(10,2) default 0`;
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS total decimal(10,2)`;
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS issue_date date`;
    await sql`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone default timezone('utc'::text, now()) not null`;

    await sql`
      CREATE TABLE IF NOT EXISTS call_logs (
        id uuid default uuid_generate_v4() primary key,
        company_id uuid references companies(id) on delete cascade not null,
        customer_id uuid references customers(id) on delete set null,
        lead_id uuid references leads(id) on delete set null,
        job_id uuid references jobs(id) on delete set null,
        customer_name text,
        phone_number text not null,
        duration_seconds integer default 0,
        status text default 'completed',
        transcript text,
        ai_summary text,
        outcome text,
        recording boolean default false,
        created_at timestamp with time zone default timezone('utc'::text, now()) not null,
        updated_at timestamp with time zone default timezone('utc'::text, now()) not null
      )
    `;
    await sql`CREATE INDEX IF NOT EXISTS idx_call_logs_company_id ON call_logs(company_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_call_logs_created_at ON call_logs(created_at)`;

    await sql`
      INSERT INTO buckets (title, color, position)
      VALUES
        ('New Leads', '#3b82f6', 1),
        ('Qualified', '#8b5cf6', 2),
        ('Quoted', '#eab308', 3),
        ('Booked', '#f97316', 4),
        ('In Progress', '#f59e0b', 5),
        ('Completed', '#22c55e', 6)
      ON CONFLICT (position) DO UPDATE
      SET
        title = EXCLUDED.title,
        color = EXCLUDED.color,
        updated_at = timezone('utc'::text, now())
    `;

    return NextResponse.json({
      success: true,
      message: 'Core schema repair completed for buckets, jobs, and invoices.',
    });
  } catch (error: unknown) {
    console.error('Error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}