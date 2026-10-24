do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'gui_barber_bookings'
      and column_name = 'service_duration_minutes'
  ) then
    alter table public.gui_barber_bookings
      add column service_duration_minutes integer not null default 30;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'gui_barber_bookings_duration_valid'
      and conrelid = 'public.gui_barber_bookings'::regclass
  ) then
    alter table public.gui_barber_bookings
      add constraint gui_barber_bookings_duration_valid
      check (service_duration_minutes between 1 and 480);
  end if;
end
$$;

update public.gui_barber_bookings
set service_duration_minutes = case service
  when 'Corte Clássico' then 30
  when 'Corte + Barba' then 45
  when 'Corte + Sobrancelha' then 35
  when 'Combo Premium' then 60
  else service_duration_minutes
end
where service in ('Corte Clássico', 'Corte + Barba', 'Corte + Sobrancelha', 'Combo Premium');

create or replace function public.gui_barber_booking_start_minute(
  booking_date date,
  booking_time text
)
returns bigint
language sql
immutable
strict
parallel safe
as $$
  select
    (booking_date - date '2000-01-01')::bigint * 1440
    + split_part(booking_time, ':', 1)::bigint * 60
    + split_part(booking_time, ':', 2)::bigint
$$;

revoke all on function public.gui_barber_booking_start_minute(date, text)
  from public, anon, authenticated;
grant execute on function public.gui_barber_booking_start_minute(date, text)
  to service_role;

do $$
begin
  if exists (
    select 1
    from public.gui_barber_bookings first_booking
    join public.gui_barber_bookings second_booking
      on first_booking.id < second_booking.id
    where first_booking.status in ('pendente', 'confirmado')
      and second_booking.status in ('pendente', 'confirmado')
      and int8range(
        public.gui_barber_booking_start_minute(first_booking.booking_date, first_booking.booking_time),
        public.gui_barber_booking_start_minute(first_booking.booking_date, first_booking.booking_time)
          + first_booking.service_duration_minutes,
        '[)'
      ) && int8range(
        public.gui_barber_booking_start_minute(second_booking.booking_date, second_booking.booking_time),
        public.gui_barber_booking_start_minute(second_booking.booking_date, second_booking.booking_time)
          + second_booking.service_duration_minutes,
        '[)'
      )
  ) then
    raise exception 'There are overlapping active bookings. Resolve existing conflicts before applying the booking interval constraint.';
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'gui_barber_bookings_active_interval_excl'
      and conrelid = 'public.gui_barber_bookings'::regclass
  ) then
    alter table public.gui_barber_bookings
      add constraint gui_barber_bookings_active_interval_excl
      exclude using gist (
        int8range(
          public.gui_barber_booking_start_minute(booking_date, booking_time),
          public.gui_barber_booking_start_minute(booking_date, booking_time)
            + service_duration_minutes,
          '[)'
        ) with &&
      )
      where (status in ('pendente', 'confirmado'));
  end if;
end
$$;

create or replace view public.gui_barber_admin_booking_queue
with (security_invoker = true)
as
select id
from public.gui_barber_bookings
where status <> 'concluido'
   or booking_date + booking_time::time
      + make_interval(mins => service_duration_minutes)
      + interval '24 hours'
      > timezone('America/Sao_Paulo', now());

revoke all on public.gui_barber_admin_booking_queue from public, anon, authenticated;
grant select on public.gui_barber_admin_booking_queue to service_role;
