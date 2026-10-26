'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { barberSettings, services, timeSlots } from '@/data/barber';
import {
  bookingIntervalsOverlap,
  getSaoPauloDateRange,
  getSaoPauloAppointmentTimestamp,
  isSaoPauloAppointmentInFuture,
  type BookingInterval,
} from '@/lib/booking-time';
import { normalizeBrazilianPhone } from '@/lib/phone';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

type BookingStatus = 'pendente' | 'confirmado' | 'concluido' | 'cancelado' | 'no-show';

type BookingRecord = {
  id: string;
  customerName?: string;
  phone?: string;
  service: string;
  price: number;
  date: string;
  time: string;
  serviceDurationMinutes?: number;
  notes?: string;
  professional?: string;
  status: BookingStatus;
  createdAt?: string;
  cancellationReason?: string;
  cancellationNote?: string;
};

const MIN_CANCEL_LEAD_HOURS = barberSettings.cancellationMinimumHours ?? 1;

const normalizePhone = (value: string) => {
  return normalizeBrazilianPhone(value);
};

const formatDate = (dateString: string) =>
  new Date(`${dateString}T12:00:00Z`).toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const formatTime = (time: string) => time;

const getBookingDateTime = (booking: BookingRecord) =>
  getSaoPauloAppointmentTimestamp(booking.date, booking.time);

const getServiceByName = (name: string) => services.find((service) => service.name === name) ?? null;

export function MyAccountClient() {
  const [phoneInput, setPhoneInput] = useState('');
  const [searchPhone, setSearchPhone] = useState('');
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [authenticatedPhone, setAuthenticatedPhone] = useState('');
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState('');
  const [accountError, setAccountError] = useState('');
  const [accountBusy, setAccountBusy] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'proximos' | 'historico' | 'dados'>('proximos');
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('Imprevisto');
  const [cancelNote, setCancelNote] = useState('');
  const [rescheduleId, setRescheduleId] = useState<string | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduleTime, setRescheduleTime] = useState('');
  const [rescheduleOccupiedSlots, setRescheduleOccupiedSlots] = useState<BookingInterval[]>([]);
  const [rescheduleAvailabilityLoaded, setRescheduleAvailabilityLoaded] = useState(false);
  const [rescheduleAvailabilityError, setRescheduleAvailabilityError] = useState('');
  const [nowMs, setNowMs] = useState<number>(0);
  const isCustomerVerified = Boolean(searchPhone && authenticatedPhone === searchPhone);

  const loadCustomerBookings = useCallback(async () => {
    try {
      const client = getSupabaseBrowserClient();
      const { data: sessionData, error: sessionError } = await client.auth.getSession();
      if (sessionError) throw sessionError;
      const session = sessionData.session;
      if (!session) return;
      const phone = normalizePhone(session.user.phone ?? '');
      if (!phone) throw new Error('A sessão não está vinculada a um telefone válido.');

      const response = await fetch('/api/account/bookings', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      });
      const payload = await response.json() as { bookings?: BookingRecord[]; message?: string };
      if (!response.ok || !payload.bookings) {
        throw new Error(payload.message || 'Não foi possível carregar seus agendamentos.');
      }

      setBookings(payload.bookings);
      setAuthenticatedPhone(phone);
      setPhoneInput(phone);
      setSearchPhone(phone);
      setAccountError('');
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'Não foi possível carregar seus agendamentos.');
    }
  }, []);

  const lookupCustomerBookings = useCallback(async (phone: string) => {
    const response = await fetch('/api/account/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone }),
      cache: 'no-store',
    });
    const payload = await response.json() as { bookings?: BookingRecord[]; message?: string };
    if (!response.ok || !payload.bookings) {
      throw new Error(payload.message || 'Não foi possível consultar seus agendamentos.');
    }

    setPhoneInput(phone);
    setSearchPhone(phone);
    setBookings(payload.bookings);
    setAuthenticatedPhone('');
    setSelectedTab('proximos');
    setAccountError('');
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => {
      void (async () => {
        try {
          const pendingPhone = window.sessionStorage.getItem('gui_barber_customer_phone');
          if (pendingPhone) {
            window.sessionStorage.removeItem('gui_barber_customer_phone');
            const normalizedPhone = normalizePhone(pendingPhone);
            if (!normalizedPhone) throw new Error('O telefone do agendamento é inválido.');

            setPhoneInput(normalizedPhone);
            setAuthBusy(true);
            try {
              await lookupCustomerBookings(normalizedPhone);
            } finally {
              setAuthBusy(false);
            }
            return;
          }

          const client = getSupabaseBrowserClient();
          const { data, error } = await client.auth.getSession();
          if (error) throw error;

          const phone = data.session?.user.phone;
          if (phone) {
            await loadCustomerBookings();
          }
        } catch (error) {
          setAuthError(error instanceof Error ? error.message : 'Não foi possível iniciar o acesso à conta.');
        }
      })();
    }, 0);

    return () => window.clearTimeout(initialLoad);
  }, [loadCustomerBookings, lookupCustomerBookings]);

  useEffect(() => {
    if (!rescheduleId || !rescheduleDate) return;
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setRescheduleAvailabilityLoaded(false);
      setRescheduleAvailabilityError('');
      void (async () => {
        try {
          const params = new URLSearchParams({ from: rescheduleDate, to: rescheduleDate });
          const response = await fetch(`/api/bookings/availability?${params.toString()}`, {
            cache: 'no-store',
            signal: controller.signal,
          });
          const payload = await response.json() as { occupied?: BookingInterval[]; message?: string };
          if (!response.ok || !payload.occupied) {
            throw new Error(payload.message || 'Não foi possível consultar esse dia.');
          }
          setRescheduleOccupiedSlots(payload.occupied);
          setRescheduleAvailabilityLoaded(true);
        } catch (error) {
          if (controller.signal.aborted) return;
          setRescheduleAvailabilityError(error instanceof Error ? error.message : 'Não foi possível consultar esse dia.');
          setRescheduleAvailabilityLoaded(false);
        }
      })();
    }, 0);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [rescheduleDate, rescheduleId]);

  useEffect(() => {
    const initialTime = window.setTimeout(() => setNowMs(Date.now()), 0);
    const timer = window.setInterval(() => setNowMs(Date.now()), 60000);
    return () => {
      window.clearTimeout(initialTime);
      window.clearInterval(timer);
    };
  }, []);

  const customerBookings = useMemo(() => {
    const normalized = normalizePhone(searchPhone);
    if (!normalized) return [];
    return bookings
      .filter((booking) => !booking.phone || normalizePhone(booking.phone) === normalized)
      .sort((a, b) => getBookingDateTime(a) - getBookingDateTime(b));
  }, [bookings, searchPhone]);

  const customerName = isCustomerVerified ? customerBookings[0]?.customerName ?? 'Cliente' : '';
  const currentTime = nowMs || 0;
  const upcoming = customerBookings.filter((booking) => booking.status !== 'cancelado' && getBookingDateTime(booking) >= currentTime);
  const history = customerBookings.filter((booking) => booking.status === 'cancelado' || getBookingDateTime(booking) < currentTime);
  const totalGastos = customerBookings.filter((booking) => booking.status !== 'cancelado').reduce((sum, booking) => sum + booking.price, 0);
  const lastBooking = customerBookings[customerBookings.length - 1];
  const reschedulingBooking = customerBookings.find((booking) => booking.id === rescheduleId);
  const rescheduleDuration = reschedulingBooking?.serviceDurationMinutes
    ?? getServiceByName(reschedulingBooking?.service ?? '')?.duration
    ?? 30;
  const currentDateTime = useMemo(() => new Date(nowMs), [nowMs]);
  const unavailableRescheduleTimes = useMemo(() => new Set(
    timeSlots.filter((time) =>
      rescheduleOccupiedSlots.some((booking) => bookingIntervalsOverlap(
        { date: rescheduleDate, time, durationMinutes: rescheduleDuration },
        booking,
      ))
      || !isSaoPauloAppointmentInFuture(rescheduleDate, time, currentDateTime),
    ),
  ), [currentDateTime, rescheduleDate, rescheduleDuration, rescheduleOccupiedSlots]);

  const handleLookup = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizePhone(phoneInput);
    if (!normalized) {
      setAuthError('Informe um telefone brasileiro válido com DDD.');
      return;
    }

    setAuthBusy(true);
    setAuthError('');
    try {
      await lookupCustomerBookings(normalized);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Não foi possível consultar seus agendamentos.');
    } finally {
      setAuthBusy(false);
    }
  };

  const requestCustomerVerification = async (phone: string) => {
    const normalized = normalizePhone(phone);
    if (!normalized || normalized !== searchPhone) {
      setAuthError('Consulte novamente usando o telefone deste agendamento.');
      return;
    }

    setAuthBusy(true);
    setAuthError('');
    try {
      const { error } = await getSupabaseBrowserClient().auth.signInWithOtp({
        phone: normalized,
        options: { shouldCreateUser: true },
      });
      if (error) throw error;
      setPhoneInput(normalized);
      setOtpSent(true);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Não foi possível enviar o código de verificação.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalized = normalizePhone(phoneInput);
    if (!normalized || normalized !== searchPhone) {
      setAuthError('O código deve ser confirmado para o telefone consultado.');
      return;
    }
    setAuthBusy(true);
    setAuthError('');

    try {
      const { data, error } = await getSupabaseBrowserClient().auth.verifyOtp({
        phone: normalized,
        token: otp.trim(),
        type: 'sms',
      });
      if (error) throw error;
      if (!data.session) throw new Error('O código foi aceito, mas a sessão não foi criada.');
      if (normalizePhone(data.session.user.phone ?? '') !== normalized) {
        throw new Error('A sessão autenticada não corresponde ao telefone consultado.');
      }

      setAuthenticatedPhone(normalized);
      await loadCustomerBookings();
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Código inválido ou expirado.');
    } finally {
      setAuthBusy(false);
    }
  };

  const handleSignOut = async () => {
    setAuthBusy(true);
    try {
      const { error } = await getSupabaseBrowserClient().auth.signOut();
      if (error) throw error;
      setAuthenticatedPhone('');
      setOtp('');
      setOtpSent(false);
      setAuthError('');
      setSelectedTab('proximos');
      if (searchPhone) await lookupCustomerBookings(searchPhone);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Não foi possível sair da conta.');
    } finally {
      setAuthBusy(false);
    }
  };

  const canCancel = (booking: BookingRecord) => {
    if (booking.status === 'cancelado') return false;
    const differenceHours = (getBookingDateTime(booking) - (nowMs || 0)) / (1000 * 60 * 60);
    return differenceHours >= MIN_CANCEL_LEAD_HOURS;
  };

  const applyCancel = async () => {
    if (!cancelId) return;
    setAccountBusy(true);
    setAccountError('');
    try {
      const { data, error } = await getSupabaseBrowserClient().auth.getSession();
      if (error) throw error;
      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error('Sua sessão expirou. Entre novamente.');

      const response = await fetch(`/api/account/bookings/${encodeURIComponent(cancelId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({
          status: 'cancelado',
          cancellationReason: cancelReason,
          cancellationNote: cancelNote,
        }),
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Não foi possível cancelar o agendamento.');

      await loadCustomerBookings();
      setCancelId(null);
      setCancelReason('Imprevisto');
      setCancelNote('');
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'Não foi possível cancelar o agendamento.');
    } finally {
      setAccountBusy(false);
    }
  };

  const applyReschedule = async () => {
    if (!rescheduleId || !rescheduleDate || !rescheduleTime) return;
    setAccountBusy(true);
    setAccountError('');
    try {
      const { data, error } = await getSupabaseBrowserClient().auth.getSession();
      if (error) throw error;
      const accessToken = data.session?.access_token;
      if (!accessToken) throw new Error('Sua sessão expirou. Entre novamente.');

      const response = await fetch(`/api/account/bookings/${encodeURIComponent(rescheduleId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ date: rescheduleDate, time: rescheduleTime }),
      });
      const payload = await response.json() as { message?: string };
      if (!response.ok) throw new Error(payload.message || 'Não foi possível remarcar o agendamento.');

      await loadCustomerBookings();
      setRescheduleId(null);
      setRescheduleDate('');
      setRescheduleTime('');
    } catch (error) {
      setAccountError(error instanceof Error ? error.message : 'Não foi possível remarcar o agendamento.');
    } finally {
      setAccountBusy(false);
    }
  };

  const renderBookingCard = (booking: BookingRecord, compact = false) => {
    const matchedService = getServiceByName(booking.service);
    const canBeCancelled = canCancel(booking);
    return (
      <article key={booking.id} className="rounded-[26px] border border-white/10 bg-[#111315] p-4 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[0.22em] text-[#d7a29d]">
              <span>{booking.service}</span>
            </div>
            <p className="text-2xl font-black text-white">{formatDate(booking.date)} • {formatTime(booking.time)}</p>
          </div>

          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#f5d3d1]">
            <span className="rounded-full border border-[#d64a3d]/30 bg-[#d64a3d]/10 px-2 py-1">
              {booking.status}
            </span>
          </div>
        </div>

        <div className={`mt-4 grid gap-3 ${isCustomerVerified ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
          <div className="rounded-2xl border border-white/10 bg-[#171b1d] p-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#d7a29d]">Valor</p>
            <p className="mt-2 text-lg font-bold text-white">R$ {booking.price.toFixed(2)}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-[#171b1d] p-3">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#d7a29d]">Horário</p>
            <p className="mt-2 text-lg font-bold text-white">{booking.time}</p>
          </div>
          {isCustomerVerified && booking.professional ? (
            <div className="rounded-2xl border border-white/10 bg-[#171b1d] p-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#d7a29d]">Profissional</p>
              <p className="mt-2 text-lg font-bold text-white">{booking.professional}</p>
            </div>
          ) : null}
        </div>

        {!compact && (
          <div className="mt-5 flex flex-wrap gap-3">
            {!isCustomerVerified ? (
              <button
                type="button"
                onClick={() => void requestCustomerVerification(searchPhone)}
                disabled={authBusy}
                className="rounded-full border border-[#d64a3d]/40 bg-[#d64a3d]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#f7b9b1] transition hover:bg-[#d64a3d]/15 disabled:opacity-60"
              >
                {authBusy ? 'Aguarde...' : 'Verificar para gerenciar'}
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setRescheduleId(booking.id);
                    setRescheduleDate('');
                    setRescheduleTime('');
                  }}
                  className="rounded-full border border-[#d64a3d]/40 bg-[#d64a3d]/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#f7b9b1] transition hover:bg-[#d64a3d]/15"
                >
                  Remarcar horário
                </button>
                {canBeCancelled ? (
                  <button
                    type="button"
                    onClick={() => setCancelId(booking.id)}
                    className="rounded-full border border-white/15 bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#f7b9b1] transition hover:border-[#f7b9b1]/60"
                  >
                    Cancelar horário
                  </button>
                ) : (
                  <button
                    type="button"
                    className="rounded-full border border-white/15 bg-transparent px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[#d8d3cc] opacity-75"
                    title="Cancelamentos fora do prazo não podem ser feitos no site"
                  >
                    Não permitido
                  </button>
                )}
              </>
            )}
          </div>
        )}

        {matchedService && (
          <p className="mt-3 text-sm text-[#d0c8c2]">
            {matchedService.description}
          </p>
        )}
      </article>
    );
  };

  if (!searchPhone) {
    return (
      <div className="mx-auto max-w-4xl rounded-[34px] border border-white/10 bg-[#101112]/90 p-6 shadow-[0_18px_80px_rgba(0,0,0,0.45)] md:p-10">
        <p className="text-[10px] uppercase tracking-[0.28em] text-[#d7a29d]">Minha conta</p>
        <h1 className="mt-4 text-4xl font-black text-white sm:text-5xl">Consulte e gerencie seus horários no Gui Barber.</h1>

        <form onSubmit={handleLookup} className="mt-8 space-y-4">
          <label className="block text-sm font-medium text-[#d8d3cc]" htmlFor="phone">
            Informe seu telefone para consultar seus serviços
          </label>
          <input
            id="phone"
            type="tel"
            value={phoneInput}
            onChange={(event) => setPhoneInput(event.target.value)}
            placeholder="(51) 99018-4228"
            autoComplete="tel"
            required
            className="w-full rounded-[20px] border border-white/10 bg-[#171b1d] px-4 py-3.5 text-base text-white outline-none transition focus:border-[#d64a3d]/60"
          />
          <button type="submit" disabled={authBusy} className="inline-flex items-center justify-center rounded-full bg-[#d64a3d] px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-[#e55c4a] disabled:opacity-60">
            {authBusy ? 'Consultando...' : 'Meus serviços'}
          </button>
        </form>
        {authError ? <p role="alert" className="mt-4 text-sm text-[#ffb0a5]">{authError}</p> : null}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl rounded-[34px] border border-white/10 bg-[#101112]/90 p-5 shadow-[0_18px_80px_rgba(0,0,0,0.45)] md:p-8">
      <div className="mb-6 flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#d7a29d]">Minha conta</p>
          <h1 className="mt-2 text-3xl font-black text-white md:text-4xl">
            {isCustomerVerified ? `Olá, ${customerName}!` : 'Meus serviços'}
          </h1>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link href="/agendar" className="inline-flex items-center justify-center rounded-full bg-[#d64a3d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e55c4a]">
            Agendar novo horário
          </Link>
          {isCustomerVerified ? (
            <button type="button" onClick={() => void handleSignOut()} disabled={authBusy || accountBusy} className="rounded-full border border-white/15 px-5 py-3 text-sm text-white disabled:opacity-60">
              Sair
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setSearchPhone('');
                setBookings([]);
                setPhoneInput('');
                setOtp('');
                setOtpSent(false);
                setAuthError('');
              }}
              className="rounded-full border border-white/15 px-5 py-3 text-sm text-white"
            >
              Consultar outro telefone
            </button>
          )}
        </div>
      </div>

      {accountError ? <p role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{accountError}</p> : null}
      {authError ? <p role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">{authError}</p> : null}

      {otpSent && !isCustomerVerified ? (
        <form onSubmit={handleVerifyOtp} className="mb-8 space-y-4 rounded-[24px] border border-white/10 bg-[#171b1d] p-5">
          <p className="text-sm text-[#d8d3cc]">
            Para cancelar ou remarcar, confirme que você controla este telefone. O código será enviado por SMS para {phoneInput}.
          </p>
          <label className="block text-sm font-medium text-[#d8d3cc]" htmlFor="otp">
            Código de verificação
          </label>
          <input
            id="otp"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            required
            className="w-full rounded-[20px] border border-white/10 bg-[#101011] px-4 py-3.5 text-base tracking-[0.3em] text-white outline-none transition focus:border-[#d64a3d]/60"
          />
          <div className="flex flex-wrap gap-3">
            <button type="submit" disabled={authBusy} className="inline-flex items-center justify-center rounded-full bg-[#d64a3d] px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-[#e55c4a] disabled:opacity-60">
              {authBusy ? 'Verificando...' : 'Confirmar código'}
            </button>
            <button type="button" onClick={() => { setOtpSent(false); setOtp(''); setAuthError(''); }} className="rounded-full border border-white/15 px-5 py-3 text-sm text-white">
              Cancelar verificação
            </button>
          </div>
        </form>
      ) : null}

      <div className={`mb-8 grid gap-4 ${isCustomerVerified ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        <div className="rounded-[24px] border border-white/10 bg-[#171b1d] p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#d7a29d]">Agendamentos</p>
          <p className="mt-3 text-3xl font-black text-white">{customerBookings.length}</p>
        </div>
        {isCustomerVerified ? (
          <div className="rounded-[24px] border border-white/10 bg-[#171b1d] p-4">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#d7a29d]">Gastos</p>
            <p className="mt-3 text-3xl font-black text-white">R$ {totalGastos.toFixed(2)}</p>
          </div>
        ) : null}
        <div className="rounded-[24px] border border-white/10 bg-[#171b1d] p-4">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#d7a29d]">Último atendimento</p>
          <p className="mt-3 text-lg font-black text-white">{lastBooking ? formatDate(lastBooking.date) : '—'}</p>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {[
          { key: 'proximos', label: 'Próximos' },
          { key: 'historico', label: 'Histórico' },
          ...(isCustomerVerified ? [{ key: 'dados' as const, label: 'Minha conta' }] : []),
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSelectedTab(tab.key as 'proximos' | 'historico' | 'dados')}
            className={`rounded-full border px-4 py-2 text-[10px] uppercase tracking-[0.24em] transition ${
              selectedTab === tab.key
                ? 'border-[#d64a3d] bg-[#d64a3d]/10 text-[#f7b9b1]'
                : 'border-white/10 bg-transparent text-[#d8d3cc] hover:border-white/20'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {selectedTab === 'proximos' && (
        <div className="space-y-4">
          {upcoming.length ? upcoming.map((booking) => renderBookingCard(booking)) : <p className="text-[#d8d3cc]">Nenhum agendamento futuro encontrado.</p>}
        </div>
      )}

      {selectedTab === 'historico' && (
        <div className="space-y-4">
          {history.length ? history.map((booking) => renderBookingCard(booking, true)) : <p className="text-[#d8d3cc]">Nenhum histórico disponível.</p>}
        </div>
      )}

      {selectedTab === 'dados' && isCustomerVerified && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-[24px] border border-white/10 bg-[#171b1d] p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#d7a29d]">Dados</p>
            <div className="mt-4 space-y-3 text-sm text-[#d0c8c2]">
              <p><strong className="text-white">Nome:</strong> {customerName}</p>
              <p><strong className="text-white">WhatsApp:</strong> {customerBookings[0]?.phone || phoneInput}</p>
              <p><strong className="text-white">Email:</strong> Não informado</p>
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[#171b1d] p-5">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#d7a29d]">Política</p>
            <p className="mt-4 text-sm text-[#d0c8c2] leading-7">
              Cancelamentos devem ser realizados com pelo menos {MIN_CANCEL_LEAD_HOURS} hora de antecedência. Fora do prazo, o atendimento pode ser bloqueado e a política da barbearia será aplicada.
            </p>
          </div>
        </div>
      )}

      {cancelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-[30px] border border-white/10 bg-[#101112] p-6">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#d7a29d]">Cancelar horário</p>
            <h3 className="mt-3 text-3xl font-black text-white">Cancelar este horário?</h3>
            <div className="mt-5 rounded-2xl border border-white/10 bg-[#171b1d] p-4 text-sm text-[#d0c8c2]">
              <p><strong className="text-white">Serviço:</strong> {bookings.find((booking) => booking.id === cancelId)?.service}</p>
              <p><strong className="text-white">Data:</strong> {bookings.find((booking) => booking.id === cancelId) && formatDate(bookings.find((booking) => booking.id === cancelId)!.date)}</p>
              <p><strong className="text-white">Horário:</strong> {bookings.find((booking) => booking.id === cancelId)?.time}</p>
            </div>

            <div className="mt-5 space-y-3">
              <label className="block text-sm font-medium text-[#d8d3cc]">Por que você deseja cancelar?</label>
              <select
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                className="w-full rounded-[18px] border border-white/10 bg-[#171b1d] px-3 py-2.5 text-white outline-none"
              >
                <option>Imprevisto</option>
                <option>Não poderei comparecer</option>
                <option>Preciso remarcar</option>
                <option>Outro</option>
              </select>
              <textarea
                value={cancelNote}
                onChange={(event) => setCancelNote(event.target.value)}
                placeholder="Observação opcional"
                className="h-24 w-full rounded-[18px] border border-white/10 bg-[#171b1d] px-3 py-2.5 text-white outline-none resize-none"
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setCancelId(null)} className="rounded-full border border-white/15 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30">
                Voltar
              </button>
              <button type="button" onClick={() => void applyCancel()} disabled={accountBusy} className="rounded-full bg-[#d64a3d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e55c4a] disabled:opacity-60">
                {accountBusy ? 'Salvando...' : 'Confirmar cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {rescheduleId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-lg rounded-[30px] border border-white/10 bg-[#101112] p-6">
            <p className="text-[10px] uppercase tracking-[0.24em] text-[#d7a29d]">Remarcar horário</p>
            <h3 className="mt-3 text-3xl font-black text-white">Escolha o novo horário</h3>

            <div className="mt-5 space-y-4">
              <label className="block text-sm font-medium text-[#d8d3cc]">Nova data</label>
              <select
                value={rescheduleDate}
                onChange={(event) => {
                  setRescheduleDate(event.target.value);
                  setRescheduleTime('');
                }}
                className="w-full rounded-[18px] border border-white/10 bg-[#171b1d] px-3 py-2.5 text-white outline-none"
              >
                <option value="">Selecione uma data</option>
                {getSaoPauloDateRange(14).map((value) => {
                  return (
                    <option key={value} value={value}>
                      {new Date(`${value}T12:00:00Z`).toLocaleDateString('pt-BR', {
                        timeZone: 'UTC',
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })}
                    </option>
                  );
                })}
              </select>

              {rescheduleAvailabilityError ? <p role="alert" className="text-sm text-[#ffb0a5]">{rescheduleAvailabilityError}</p> : null}
              {rescheduleDate && !rescheduleAvailabilityLoaded && !rescheduleAvailabilityError
                ? <p className="text-sm text-zinc-400">Consultando horários disponíveis...</p>
                : null}
              <label className="block text-sm font-medium text-[#d8d3cc]">Novo horário</label>
              <select
                value={rescheduleTime}
                onChange={(event) => setRescheduleTime(event.target.value)}
                className="w-full rounded-[18px] border border-white/10 bg-[#171b1d] px-3 py-2.5 text-white outline-none"
                disabled={!rescheduleAvailabilityLoaded || Boolean(rescheduleAvailabilityError)}
              >
                <option value="">Selecione um horário</option>
                {timeSlots.map((time) => {
                  const isOccupied = rescheduleOccupiedSlots.some((booking) => bookingIntervalsOverlap(
                    { date: rescheduleDate, time, durationMinutes: rescheduleDuration },
                    booking,
                  ));
                  const isPast = !isSaoPauloAppointmentInFuture(rescheduleDate, time, currentDateTime);
                  return (
                    <option key={time} value={time} disabled={unavailableRescheduleTimes.has(time)}>
                      {time}{isOccupied ? ' — Ocupado' : isPast ? ' — Encerrado' : ''}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button type="button" onClick={() => setRescheduleId(null)} className="rounded-full border border-white/15 bg-transparent px-5 py-3 text-sm font-semibold text-white transition hover:border-white/30">
                Voltar
              </button>
              <button type="button" onClick={() => void applyReschedule()} disabled={accountBusy} className="rounded-full bg-[#d64a3d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#e55c4a] disabled:opacity-60">
                {accountBusy ? 'Salvando...' : 'Confirmar remarcação'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
