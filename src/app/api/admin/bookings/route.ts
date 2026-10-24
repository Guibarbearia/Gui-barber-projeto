import { NextResponse } from 'next/server';
import { readAdminSession } from '@/lib/admin-auth';
import {
  BOOKINGS_MIGRATION_MESSAGE,
  isBookingsMigrationMissing,
  supabaseBookingQueueRequest,
  supabaseBookingsRequest,
} from '@/lib/supabase-rest';

export type SupabaseBooking = {
  id: string;
  customer_name: string;
  phone: string;
  service: string;
  price: number;
  booking_date: string;
  booking_time: string;
  service_duration_minutes: number;
  notes: string;
  professional: string;
  status: 'pendente' | 'confirmado' | 'concluido' | 'cancelado' | 'no-show';
  payment_method: 'pix' | 'cartao' | 'dinheiro' | 'outros';
  created_at: string;
  cancellation_reason?: string | null;
  cancellation_note?: string | null;
};

export async function GET() {
  if (!(await readAdminSession())) {
    return NextResponse.json({ message: 'Acesso não autorizado.' }, { status: 401 });
  }

  try {
    const [bookings, queue] = await Promise.all([
      supabaseBookingsRequest<SupabaseBooking[]>('?select=*&order=booking_date.asc,booking_time.asc'),
      supabaseBookingQueueRequest<{ id: string }[]>('?select=id'),
    ]);
    return NextResponse.json({
      queueBookingIds: queue.map(({ id }) => id),
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
        paymentMethod: booking.payment_method,
        createdAt: booking.created_at,
      })),
    });
  } catch (error) {
    if (isBookingsMigrationMissing(error)) {
      return NextResponse.json({ message: BOOKINGS_MIGRATION_MESSAGE }, { status: 503 });
    }

    return NextResponse.json(
      { message: 'Não foi possível carregar os agendamentos do Supabase.' },
      { status: 503 },
    );
  }
}
