import { NextResponse } from 'next/server';
import { readAdminSession } from '@/lib/admin-auth';

export async function GET() {
  const session = await readAdminSession();

  return NextResponse.json({
    ok: Boolean(session),
    admin: session ? { email: session.email } : null,
  });
}
