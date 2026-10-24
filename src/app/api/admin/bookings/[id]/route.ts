import { NextResponse } from 'next/server';
import { readAdminSession } from '@/lib/admin-auth';
import { services } from '@/data/barber';
import {
  BOOKINGS_MIGRATION_MESSAGE,
  isBookingsMigrationMissing,
  supabaseBookingsRequest,
  SupabaseRequestError,
} from '@/lib/supabase-rest';

type BookingUpdate = {
  customerName?: unknown;
  phone?: unknown;
  service?: unknown;
  date?: unknown;
  time?: unknown;
  status?: unknown;
  professional?: unknown;
};

const statuses = new Set(['pendente', 'confirmado', 'concluido', 'cancelado', 'no-show']);

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await readAdminSession())) {
    return NextResponse.json({ message: 'Acesso não autorizado.' }, { status: 401 });
  }

  const { id } = await context.params;
  let body: BookingUpdate;

  try {
    body = await request.json() as BookingUpdate;
  } catch {
    return NextResponse.json({ message: 'Os dados do agendamento são inválidos.' }, { status: 400 });
  }

  const update: Record<string, string> = {};
  if (typeof body.customerName === 'string' && body.customerName.trim().length >= 2) update.customer_name = body.customerName.trim();
  if (typeof body.phone === 'string' && body.phone.trim()) update.phone = body.phone.trim();
  if (typeof body.service === 'string' && body.service.trim()) {
    const serviceName = body.service.trim();
    const service = services.find((item) => item.name === serviceName);
    update.service = serviceName;
    if (service) update.service_duration_minutes = String(service.duration);
  }
  if (typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date)) update.booking_date = body.date;
  if (typeof body.time === 'string' && /^\d{2}:\d{2}$/.test(body.time)) update.booking_time = body.time;
  if (typeof body.professional === 'string' && body.professional.trim()) update.professional = body.professional.trim();
  if (typeof body.status === 'string' && statuses.has(body.status)) update.status = body.status;

  if (!Object.keys(update).length) {
    return NextResponse.json({ message: 'Nenhuma alteração válida foi enviada.' }, { status: 400 });
  }

  const query = new URLSearchParams({ id: `eq.${id}` });

  try {
    const updated = await supabaseBookingsRequest<unknown[]>(
      `?${query.toString()}`,
      { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(update) },
    );

    if (updated.length === 0) {
      return NextResponse.json({ message: 'Agendamento não encontrado.' }, { status: 404 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isBookingsMigrationMissing(error)) {
      return NextResponse.json({ message: BOOKINGS_MIGRATION_MESSAGE }, { status: 503 });
    }

    if (error instanceof SupabaseRequestError && ['23505', '23P01'].includes(error.code ?? '')) {
      return NextResponse.json({ message: 'Esse horário já está ocupado.' }, { status: 409 });
    }

    return NextResponse.json({ message: 'Não foi possível atualizar o agendamento.' }, { status: 503 });
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  if (!(await readAdminSession())) {
    return NextResponse.json({ message: 'Acesso não autorizado.' }, { status: 401 });
  }

  const { id } = await context.params;
  const query = new URLSearchParams({ id: `eq.${id}` });

  try {
    const deleted = await supabaseBookingsRequest<unknown[]>(
      `?${query.toString()}`,
      { method: 'DELETE', headers: { Prefer: 'return=representation' } },
    );
    return deleted.length
      ? NextResponse.json({ ok: true })
      : NextResponse.json({ message: 'Agendamento não encontrado.' }, { status: 404 });
  } catch (error) {
    if (isBookingsMigrationMissing(error)) {
      return NextResponse.json({ message: BOOKINGS_MIGRATION_MESSAGE }, { status: 503 });
    }

    return NextResponse.json({ message: 'Não foi possível excluir o agendamento.' }, { status: 503 });
  }
}
