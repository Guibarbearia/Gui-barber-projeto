const BOOKINGS_TABLE = 'gui_barber_bookings';
export const BOOKINGS_MIGRATION_MESSAGE =
  'O banco ainda precisa receber a migração de duração e conflitos de horários do GUI BARBER.';

export class SupabaseRequestError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
  }
}

export function isBookingsMigrationMissing(error: unknown) {
  return error instanceof SupabaseRequestError
    && ['PGRST204', 'PGRST205', '42703', '42P01'].includes(error.code ?? '');
}

function getSupabaseConfig() {
  const url = process.env.SUPABASE_URL?.trim();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!url || !serviceKey) {
    throw new Error('Configure SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no ambiente do servidor.');
  }

  return { url: url.replace(/\/+$/, ''), serviceKey };
}

export async function supabaseBookingsRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  return supabaseRequest<T>(BOOKINGS_TABLE, path, init);
}

export async function supabaseBookingQueueRequest<T>(path: string): Promise<T> {
  return supabaseRequest<T>('gui_barber_admin_booking_queue', path);
}

async function supabaseRequest<T>(
  resource: string,
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const { url, serviceKey } = getSupabaseConfig();
  const response = await fetch(`${url}/rest/v1/${resource}${path}`, {
    ...init,
    cache: 'no-store',
    headers: {
      apikey: serviceKey,
      Authorization: `Bearer ${serviceKey}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  });

  if (!response.ok) {
    const details = await response.json().catch(() => ({})) as { code?: string; message?: string };
    throw new SupabaseRequestError(
      details.message || 'O Supabase recusou a operação de agendamento.',
      response.status,
      details.code,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

export function supabaseIsConfigured() {
  return Boolean(process.env.SUPABASE_URL?.trim() && process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
}
