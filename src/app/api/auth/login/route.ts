import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { sql } from '@/lib/db';
import { verifyPassword } from '@/lib/auth/password';
import { createSession, SESSION_COOKIE } from '@/lib/auth/session';

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());

    const rows = await sql`
      SELECT id, hashed_pw, role, is_active, name, company_id
      FROM portal_users
      WHERE email = ${body.email.toLowerCase().trim()}
      LIMIT 1
    `;
    const user = rows[0] as Record<string, unknown> | undefined;

    if (!user || !Number(user.is_active)) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const ok = await verifyPassword(body.password, String(user.hashed_pw));
    if (!ok) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    const token = await createSession(String(user.id));

    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request.' }, { status: 400 });
    }
    console.error('[auth/login]', e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
