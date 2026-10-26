import { NextResponse } from 'next/server';
import { getAuthenticatedCustomerPhone } from '@/lib/customer-auth';
import {
  BOOKINGS_MIGRATION_MESSAGE,
  isBookingsMigrationMissing,
  supabaseBookingsRequest,
} from '@/lib/supabase-rest';
import type { SupabaseBooking } from '@/app/api/admin/bookings/route';
import { normalizeBrazilianPhone } from '@/lib/phone';

const privateResponseHeaders = { 'Cache-Control': 'private, no-store, max-age=0' };

export async function GET(request: Request) {
  let phone: string | null;

  try {
    phone = await getAuthenticatedCustomerPhone(request);
  } catch (error) {
    if (isBookingsMigrationMissing(error)) {
      return NextResponse.json({ message: BOOKINGS_MIGRATION_MESSAGE }, { status: 503 });
    }

    return NextResponse.json({ message: 'O login por SMS ainda não está configurado.' }, { status: 503 });
  }

  if (!phone) {
    return NextResponse.json(
      { message: 'Confirme o telefone para gerenciar seus agendamentos.' },
      { status: 401, headers: privateResponseHeaders },
    );
  }

  const query = new URLSearchParams({
    select: '*',
    phone: `eq.${phone}`,
    order: 'booking_date.asc,booking_time.asc',
  });

  try {
    const bookings = await supabaseBookingsRequest<SupabaseBooking[]>(`?${query.toString()}`);
    return NextResponse.json({
      bookings: bookings.map((booking) => ({
        id: booking.id,
        customerName: booking.customer_name,
        phone: booking.phone,
        service: booking.service,
        price: Number(booking.price),
        date: booking.booking_date,
        time: booking.booking_time.slice(0, 5),
        serviceDurationMinutes: booking.service_duration_minutes,
        notes: booking.notes,
        professional: booking.professional,
        status: booking.status,
        createdAt: booking.created_at,
        cancellationReason: booking.cancellation_reason,
        cancellationNote: booking.cancellation_note,
      })),
    }, { headers: privateResponseHeaders });
  } catch (error) {
    const message = isBookingsMigrationMissing(error)
      ? BOOKINGS_MIGRATION_MESSAGE
      : 'Não foi possível carregar seus agendamentos.';
    return NextResponse.json({ message }, { status: 503, headers: privateResponseHeaders });
  }
}

type PublicBooking = Pick<
  SupabaseBooking,
  'id' | 'service' | 'price' | 'booking_date' | 'booking_time' | 'status'
>;

export async function POST(request: Request) {
  let body: { phone?: unknown };
  try {
    body = await request.json() as { phone?: unknown };
  } catch {
    return NextResponse.json(
      { message: 'Informe um telefone brasileiro válido com DDD.' },
      { status: 400, headers: privateResponseHeaders },
    );
  }

  const phone = typeof body.phone === 'string' ? normalizeBrazilianPhone(body.phone) : '';
  if (!phone) {
    return NextResponse.json(
      { message: 'Informe um telefone brasileiro válido com DDD.' },
      { status: 400, headers: privateResponseHeaders },
    );
  }

  const query = new URLSearchParams({
    select: 'id,service,price,booking_date,booking_time,status',
    phone: `eq.${phone}`,
    order: 'booking_date.asc,booking_time.asc',
  });

  try {
    const bookings = await supabaseBookingsRequest<PublicBooking[]>(`?${query.toString()}`);
    return NextResponse.json({
      bookings: bookings.map((booking) => ({
        id: booking.id,
        service: booking.service,
        price: Number(booking.price),
        date: booking.booking_date,
        time: booking.booking_time.slice(0, 5),
        status: booking.status,
      })),
    }, { headers: privateResponseHeaders });
  } catch (error) {
    const message = isBookingsMigrationMissing(error)
      ? BOOKINGS_MIGRATION_MESSAGE
      : 'Não foi possível consultar seus agendamentos.';
    return NextResponse.json({ message }, { status: 503, headers: privateResponseHeaders });
  }
}
