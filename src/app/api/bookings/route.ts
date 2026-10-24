import { NextResponse } from 'next/server';
import { services, timeSlots } from '@/data/barber';
import { getSaoPauloDate } from '@/lib/booking-time';
import { normalizeBrazilianPhone } from '@/lib/phone';
import {
  BOOKINGS_MIGRATION_MESSAGE,
  isBookingsMigrationMissing,
  supabaseBookingsRequest,
  SupabaseRequestError,
} from '@/lib/supabase-rest';

type BookingInput = {
  customerName?: unknown;
  phone?: unknown;
  service?: unknown;
  date?: unknown;
  time?: unknown;
  notes?: unknown;
};

type CreatedBooking = {
  id: string;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(request: Request) {
  let body: BookingInput;

  try {
    body = await request.json() as BookingInput;
  } catch {
    return NextResponse.json({ message: 'Os dados do agendamento são inválidos.' }, { status: 400 });
  }

  const customerName = typeof body.customerName === 'string' ? body.customerName.trim() : '';
  const phone = typeof body.phone === 'string' ? body.phone.trim() : '';
  const normalizedPhone = normalizeBrazilianPhone(phone);
  const serviceName = typeof body.service === 'string' ? body.service : '';
  const date = typeof body.date === 'string' ? body.date : '';
  const time = typeof body.time === 'string' ? body.time : '';
  const notes = typeof body.notes === 'string' ? body.notes.trim() : '';
  const service = services.find((item) => item.name === serviceName);

  if (
    customerName.length < 2 ||
    customerName.length > 100 ||
    !normalizedPhone ||
    phone.length > 30 ||
    !service ||
    !DATE_PATTERN.test(date) ||
    !timeSlots.includes(time) ||
    notes.length > 1000
  ) {
    return NextResponse.json({ message: 'Confira os dados do agendamento e tente novamente.' }, { status: 400 });
  }

  if (date <= getSaoPauloDate()) {
    return NextResponse.json({ message: 'Escolha uma data futura.' }, { status: 400 });
  }

  try {
    const [booking] = await supabaseBookingsRequest<CreatedBooking[]>('', {
      method: 'POST',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        customer_name: customerName,
        phone: normalizedPhone,
        service: service.name,
        price: service.price,
        booking_date: date,
        booking_time: time,
        service_duration_minutes: service.duration,
        notes,
        professional: 'Guilherme',
        status: 'confirmado',
        payment_method: 'outros',
      }),
    });

    return NextResponse.json({ ok: true, id: booking.id }, { status: 201 });
  } catch (error) {
    if (isBookingsMigrationMissing(error)) {
      return NextResponse.json({ message: BOOKINGS_MIGRATION_MESSAGE }, { status: 503 });
    }

    if (error instanceof SupabaseRequestError && ['23505', '23P01'].includes(error.code ?? '')) {
      return NextResponse.json(
        { message: 'Esse horário acabou de ser reservado. Escolha outro horário disponível.' },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: 'Não foi possível concluir o agendamento. Tente novamente em instantes.' },
      { status: 503 },
    );
  }
}
