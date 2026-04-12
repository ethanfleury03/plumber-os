import { sql } from '@/lib/db';
import { NextResponse } from 'next/server';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

// GET - Fetch buckets
export async function GET() {
  try {
    const query = sql`
      SELECT * FROM buckets ORDER BY position ASC
    `;
    const buckets = await query;
    return NextResponse.json({ buckets });
  } catch (error: unknown) {
    console.error('Error fetching buckets:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// POST - Create bucket
export async function POST(request: Request) {
  const body = await request.json();
  
  try {
    // Get max position
    const maxPos = await sql`SELECT COALESCE(MAX(position), 0) as max FROM buckets`;
    const newPosition = Number(maxPos[0]?.max ?? 0) + 1;

    const result = await sql`
      INSERT INTO buckets (title, color, position)
      VALUES (${body.title}, ${body.color || '#6b7280'}, ${newPosition})
      RETURNING *
    `;

    return NextResponse.json({ bucket: result[0] });
  } catch (error: unknown) {
    console.error('Error creating bucket:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// PUT - Update bucket
export async function PUT(request: Request) {
  const body = await request.json();
  const { id, ...updates } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  try {
    const result = await sql`
      UPDATE buckets 
      SET title = COALESCE(${updates.title ?? null}, title),
          color = COALESCE(${updates.color ?? null}, color),
          position = COALESCE(${updates.position ?? null}, position),
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;

    return NextResponse.json({ bucket: result[0] });
  } catch (error: unknown) {
    console.error('Error updating bucket:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

// DELETE - Delete bucket
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID required' }, { status: 400 });
  }

  try {
    await sql`DELETE FROM buckets WHERE id = ${id}`;
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error deleting bucket:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}