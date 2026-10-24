import { NextResponse } from 'next/server';
import { getAuthenticatedCustomerPhone } from '@/lib/customer-auth';
import {
  BOOKINGS_MIGRATION_MESSAGE,
  isBookingsMigrationMissing,
  supabaseBookingsRequest,
} from '@/lib/supabase-rest';
import type { SupabaseBooking } from '@/app/api/admin/bookings/route';

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
    return NextResponse.json({ message: 'Entre com o código enviado ao seu WhatsApp.' }, { status: 401 });
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
    });
  } catch {
    return NextResponse.json({ message: 'Não foi possível carregar seus agendamentos.' }, { status: 503 });
  }
}
