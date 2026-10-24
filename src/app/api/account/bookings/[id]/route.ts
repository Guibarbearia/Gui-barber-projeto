import { NextResponse } from 'next/server';
import { getSaoPauloDate } from '@/lib/booking-time';
import { timeSlots } from '@/data/barber';
import { getAuthenticatedCustomerPhone } from '@/lib/customer-auth';
import {
  BOOKINGS_MIGRATION_MESSAGE,
  isBookingsMigrationMissing,
  supabaseBookingsRequest,
  SupabaseRequestError,
} from '@/lib/supabase-rest';

type CustomerBooking = {
  id: string;
  phone: string;
  booking_date: string;
  booking_time: string;
  service_duration_minutes: number;
  status: string;
};

type AccountUpdate = {
  date?: unknown;
  time?: unknown;
  status?: unknown;
  cancellationReason?: unknown;
  cancellationNote?: unknown;
};

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  let phone: string | null;

  try {
    phone = await getAuthenticatedCustomerPhone(request);
  } catch {
    return NextResponse.json({ message: 'O login por SMS ainda não está configurado.' }, { status: 503 });
  }

  if (!phone) {
    return NextResponse.json({ message: 'Sua sessão expirou. Entre novamente.' }, { status: 401 });
  }

  const { id } = await context.params;
  let body: AccountUpdate;

  try {
    body = await request.json() as AccountUpdate;
  } catch {
    return NextResponse.json({ message: 'A solicitação é inválida.' }, { status: 400 });
  }

  const lookup = new URLSearchParams({
    select: 'id,phone,booking_date,booking_time,status,service_duration_minutes',
    id: `eq.${id}`,
    phone: `eq.${phone}`,
  });

  try {
    const [booking] = await supabaseBookingsRequest<CustomerBooking[]>(`?${lookup.toString()}`);
    if (!booking) {
      return NextResponse.json({ message: 'Agendamento não encontrado.' }, { status: 404 });
    }

    const update: Record<string, string> = {};
    if (body.status === 'cancelado') {
      const appointmentAt = new Date(`${booking.booking_date}T${booking.booking_time.slice(0, 5)}:00-03:00`);
      const leadHours = (appointmentAt.getTime() - Date.now()) / (1000 * 60 * 60);

      if (!['pendente', 'confirmado'].includes(booking.status) || leadHours < 1) {
        return NextResponse.json({ message: 'Este agendamento não pode mais ser cancelado pelo site.' }, { status: 400 });
      }

      update.status = 'cancelado';
      if (typeof body.cancellationReason === 'string') update.cancellation_reason = body.cancellationReason.slice(0, 100);
      if (typeof body.cancellationNote === 'string') update.cancellation_note = body.cancellationNote.slice(0, 1000);
    } else if (
      typeof body.date === 'string' &&
      /^\d{4}-\d{2}-\d{2}$/.test(body.date) &&
      body.date > getSaoPauloDate() &&
      typeof body.time === 'string' &&
      timeSlots.includes(body.time) &&
      ['pendente', 'confirmado'].includes(booking.status)
    ) {
      update.booking_date = body.date;
      update.booking_time = body.time;
      update.status = 'confirmado';
    }

    if (!Object.keys(update).length) {
      return NextResponse.json({ message: 'Escolha uma data e um horário válidos.' }, { status: 400 });
    }

    const updateQuery = new URLSearchParams({ id: `eq.${id}`, phone: `eq.${phone}` });
    const updated = await supabaseBookingsRequest<unknown[]>(
      `?${updateQuery.toString()}`,
      { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(update) },
    );

    if (!updated.length) {
      return NextResponse.json({ message: 'O agendamento não pôde ser atualizado. Atualize sua conta e tente novamente.' }, { status: 409 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (isBookingsMigrationMissing(error)) {
      return NextResponse.json({ message: BOOKINGS_MIGRATION_MESSAGE }, { status: 503 });
    }

    if (error instanceof SupabaseRequestError && ['23505', '23P01'].includes(error.code ?? '')) {
      return NextResponse.json({ message: 'Esse horário já foi reservado. Escolha outro.' }, { status: 409 });
    }

    return NextResponse.json({ message: 'Não foi possível atualizar o agendamento.' }, { status: 503 });
  }
}
