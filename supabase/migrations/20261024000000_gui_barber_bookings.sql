  create table if not exists public.gui_barber_bookings (
    id uuid primary key default gen_random_uuid(),
    customer_name text not null check (char_length(customer_name) between 2 and 100),
    phone text not null check (char_length(phone) between 8 and 30),
    service text not null,
    price numeric(10, 2) not null check (price >= 0),
    booking_date date not null,
    booking_time text not null check (booking_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'),
    notes text not null default '',
    professional text not null,
    status text not null default 'confirmado'
      check (status in ('pendente', 'confirmado', 'concluido', 'cancelado', 'no-show')),
    payment_method text not null default 'outros'
      check (payment_method in ('pix', 'cartao', 'dinheiro', 'outros')),
    cancellation_reason text,
    cancellation_note text,
    created_at timestamptz not null default now()
  );

  alter table public.gui_barber_bookings
    add column if not exists cancellation_reason text,
    add column if not exists cancellation_note text;

  create unique index if not exists gui_barber_bookings_active_slot_unique
    on public.gui_barber_bookings (booking_date, booking_time)
    where status in ('pendente', 'confirmado');

  create index if not exists gui_barber_bookings_customer_phone_idx
    on public.gui_barber_bookings (phone);

  alter table public.gui_barber_bookings enable row level security;

  revoke all on table public.gui_barber_bookings from anon, authenticated;
  grant all on table public.gui_barber_bookings to service_role;
