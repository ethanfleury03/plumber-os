import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const getErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : 'Unknown error';

export async function GET() {
  try {
    const db = getDb();
    const dataDir = path.join(process.cwd(), 'data');
    const schema = fs.readFileSync(path.join(dataDir, 'schema.sqlite.sql'), 'utf8');
    const seed = fs.readFileSync(path.join(dataDir, 'seed.sqlite.sql'), 'utf8');
    db.exec(schema);
    db.exec(seed);

    return NextResponse.json({
      success: true,
      message: 'SQLite schema and seed applied (idempotent).',
    });
  } catch (error: unknown) {
    console.error('Setup error:', error);
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
