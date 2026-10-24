import { NextResponse } from 'next/server';
import {
  ADMIN_COOKIE_NAME,
  getConfiguredAdminEmail,
  isAdminConfigured,
  normalizeAdminEmail,
  signAdminSession,
} from '@/lib/admin-auth';
import { getSupabaseAuthUser } from '@/lib/supabase-auth';

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, message: 'Informe um identificador e uma senha válidos.' }, { status: 400 });
  }

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ ok: false, message: 'Informe um identificador e uma senha válidos.' }, { status: 400 });
  }

  const credentials = body as { identifier?: unknown; accessToken?: unknown };
  const identifier = typeof credentials.identifier === 'string' ? credentials.identifier : '';
  const accessToken = typeof credentials.accessToken === 'string' ? credentials.accessToken : '';

  if (!isAdminConfigured()) {
    return NextResponse.json(
      {
        ok: false,
        message: 'A autenticação administrativa ainda não está configurada para o Supabase.',
      },
      { status: 503 },
    );
  }

  const normalizedEmail = normalizeAdminEmail(identifier);
  const configuredEmail = getConfiguredAdminEmail();

  if (
    !normalizedEmail ||
    normalizedEmail !== configuredEmail ||
    !accessToken
  ) {
    return NextResponse.json({ ok: false, message: 'Identificador ou senha inválidos.' }, { status: 401 });
  }

  let user;
  try {
    user = await getSupabaseAuthUser(accessToken);
  } catch {
    return NextResponse.json({ ok: false, message: 'Não foi possível validar o login no Supabase.' }, { status: 503 });
  }

  if (!user?.email || normalizeAdminEmail(user.email) !== configuredEmail) {
    return NextResponse.json({ ok: false, message: 'A conta autenticada não está autorizada para o painel.' }, { status: 403 });
  }

  const response = NextResponse.json({ ok: true, redirectTo: '/admin' });
  response.cookies.set({
    name: ADMIN_COOKIE_NAME,
    value: await signAdminSession(configuredEmail),
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  });

  return response;
}
