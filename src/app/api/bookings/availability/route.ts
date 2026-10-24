import { NextResponse } from 'next/server';
import {
  BOOKINGS_MIGRATION_MESSAGE,
  isBookingsMigrationMissing,
  supabaseBookingsRequest,
} from '@/lib/supabase-rest';

type OccupiedSlot = {
  booking_date: string;
  booking_time: string;
  service_duration_minutes: number;
};

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const from = searchParams.get('from') ?? '';
  const to = searchParams.get('to') ?? '';

  if (!DATE_PATTERN.test(from) || !DATE_PATTERN.test(to) || from > to) {
    return NextResponse.json({ message: 'Informe um intervalo de datas válido.' }, { status: 400 });
  }

  const query = new URLSearchParams({
    select: 'booking_date,booking_time,service_duration_minutes',
    and: `(booking_date.gte.${from},booking_date.lte.${to})`,
    status: 'in.(pendente,confirmado)',
    order: 'booking_date.asc,booking_time.asc',
  });

  try {
    const slots = await supabaseBookingsRequest<OccupiedSlot[]>(`?${query.toString()}`);
    return NextResponse.json({
      occupied: slots.map((slot) => ({
        date: slot.booking_date,
        time: slot.booking_time.slice(0, 5),
        durationMinutes: slot.service_duration_minutes,
      })),
    });
  } catch (error) {
    if (isBookingsMigrationMissing(error)) {
      return NextResponse.json({ message: BOOKINGS_MIGRATION_MESSAGE }, { status: 503 });
    }

    return NextResponse.json(
      { message: 'Não foi possível consultar os horários. Verifique a conexão do sistema.' },
      { status: 503 },
    );
  }
}
