import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const ADMIN_COOKIE_NAME = 'gui_barber_admin_session';
const SESSION_TTL_MS = 1000 * 60 * 60 * 8;
const MAX_CLOCK_SKEW_MS = 1000 * 60;

function encodeBase64Url(bytes: Uint8Array) {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }

  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');
}

function decodeBase64Url(value: string) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function signHmacSha256(secret: string, message: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function normalizeAdminEmail(input: string) {
  const email = input.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function getEnv(name: string) {
  return process.env[name]?.trim() ?? '';
}

export function getConfiguredAdminEmail() {
  return normalizeAdminEmail(getEnv('ADMIN_EMAIL'));
}

export function isAdminConfigured() {
  return Boolean(
    getConfiguredAdminEmail() &&
      getEnv('ADMIN_SESSION_SECRET').length >= 32 &&
      getEnv('SUPABASE_URL') &&
      getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  );
}

export async function safeEqual(left: string, right: string) {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);

  if (leftBytes.length !== rightBytes.length) {
    return false;
  }

  let result = 0;
  for (let index = 0; index < leftBytes.length; index += 1) {
    result |= leftBytes[index] ^ rightBytes[index];
  }

  return result === 0;
}

export async function signAdminSession(email: string) {
  const secret = getEnv('ADMIN_SESSION_SECRET');
  const normalizedEmail = normalizeAdminEmail(email);

  if (!secret || secret.length < 32 || !normalizedEmail || normalizedEmail !== getConfiguredAdminEmail()) {
    throw new Error('Admin session cannot be issued without valid server configuration.');
  }

  const payload = encodeBase64Url(
    new TextEncoder().encode(JSON.stringify({ email: normalizedEmail, issuedAt: Date.now() })),
  );
  const signature = await signHmacSha256(secret, payload);

  return `${payload}.${signature}`;
}

export async function verifyAdminSession(token?: string) {
  const secret = getEnv('ADMIN_SESSION_SECRET');
  const configuredEmail = getConfiguredAdminEmail();

  if (!token || !secret || secret.length < 32 || !configuredEmail) {
    return null;
  }

  const [payload, signature] = token.split('.');

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = await signHmacSha256(secret, payload);

  if (!(await safeEqual(signature, expectedSignature))) {
    return null;
  }

  try {
    const bytes = decodeBase64Url(payload);
    const session = JSON.parse(new TextDecoder().decode(bytes)) as {
      email: string;
      issuedAt: number;
    };

    const now = Date.now();
    const email = normalizeAdminEmail(session.email);

    if (
      !email ||
      email !== configuredEmail ||
      !Number.isFinite(session.issuedAt) ||
      session.issuedAt > now + MAX_CLOCK_SKEW_MS ||
      now - session.issuedAt > SESSION_TTL_MS
    ) {
      return null;
    }

    return { email, issuedAt: session.issuedAt };
  } catch {
    return null;
  }
}

export async function readAdminSession() {
  const sessionCookies = await cookies();
  const token = sessionCookies.get(ADMIN_COOKIE_NAME)?.value;

  return verifyAdminSession(token);
}

export async function requireAdminSession() {
  const session = await readAdminSession();

  if (!session) {
    redirect('/admin/login');
  }

  return session;
}
