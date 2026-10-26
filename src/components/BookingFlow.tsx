'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { services, timeSlots, barberLocation, professionalName } from '@/data/barber';
import {
  bookingIntervalsOverlap,
  getSaoPauloDateRange,
  isSaoPauloAppointmentInFuture,
  type BookingInterval,
} from '@/lib/booking-time';

type BookingStep = 'service' | 'date' | 'time' | 'details' | 'confirmation';
type OccupiedSlot = BookingInterval;

const formSteps: { key: BookingStep; label: string }[] = [
  { key: 'service', label: 'Serviço' },
  { key: 'date', label: 'Data' },
  { key: 'time', label: 'Horário' },
  { key: 'details', label: 'Dados' },
  { key: 'confirmation', label: 'Confirmação' },
];

const formatDate = (dateString: string) =>
  new Date(`${dateString}T12:00:00Z`).toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

const formatLabelDate = (dateString: string) =>
  new Date(`${dateString}T12:00:00Z`).toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });

export function BookingFlow() {
  const [currentStep, setCurrentStep] = useState<BookingStep>('service');
  const [selectedServiceId, setSelectedServiceId] = useState(services[1].id);
  const [bookingDates, setBookingDates] = useState<string[]>([]);
  const [now, setNow] = useState(() => new Date(0));
  const [selectedDateValue, setSelectedDate] = useState('');
  const [selectedSlot, setSelectedSlot] = useState(timeSlots[1]);
  const [form, setForm] = useState({ name: '', phone: '', notes: '' });
  const [submitted, setSubmitted] = useState(false);
  const [bookingNumber, setBookingNumber] = useState('');
  const [occupiedSlots, setOccupiedSlots] = useState<OccupiedSlot[]>([]);
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);
  const [availabilityError, setAvailabilityError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const selectedService = useMemo(
    () => services.find((service) => service.id === selectedServiceId) ?? services[0],
    [selectedServiceId],
  );
  const selectedDate = bookingDates.includes(selectedDateValue)
    ? selectedDateValue
    : bookingDates[0] ?? '';

  const currentIndex = formSteps.findIndex((step) => step.key === currentStep);
  const stepStatus = (stepKey: BookingStep) => currentStep === stepKey ? 'active' : currentIndex > formSteps.findIndex((step) => step.key === stepKey) ? 'done' : '';
  const bookedTimes = useMemo(() => new Set(
    timeSlots.filter((time) => occupiedSlots.some((booking) => bookingIntervalsOverlap(
      { date: selectedDate, time, durationMinutes: selectedService.duration },
      booking,
    ))),
  ), [occupiedSlots, selectedDate, selectedService.duration]);

  const refreshAvailability = useCallback(async () => {
    if (!bookingDates.length) return;

    try {
      const params = new URLSearchParams({
        from: bookingDates[0],
        to: bookingDates[bookingDates.length - 1],
      });
      const response = await fetch(`/api/bookings/availability?${params.toString()}`, { cache: 'no-store' });
      const payload = await response.json() as { occupied?: OccupiedSlot[]; message?: string };

      if (!response.ok || !payload.occupied) {
        throw new Error(payload.message || 'Não foi possível carregar os horários disponíveis.');
      }

      setOccupiedSlots(payload.occupied);
      setAvailabilityError('');
      setAvailabilityLoaded(true);
    } catch (error) {
      setAvailabilityError(error instanceof Error ? error.message : 'Não foi possível carregar os horários.');
      setAvailabilityLoaded(false);
    }
  }, [bookingDates]);

  useEffect(() => {
    const updateLocalDate = () => {
      const currentDate = new Date();
      const dates = getSaoPauloDateRange(7, currentDate);
      setNow(currentDate);
      setBookingDates((current) => current[0] === dates[0] ? current : dates);
    };

    updateLocalDate();
    const timer = window.setInterval(updateLocalDate, 60000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!bookingDates.length) return;

    const initialRefresh = window.setTimeout(() => void refreshAvailability(), 0);
    const timer = window.setInterval(() => void refreshAvailability(), 15000);
    const refreshOnFocus = () => void refreshAvailability();
    window.addEventListener('focus', refreshOnFocus);

    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [bookingDates.length, refreshAvailability]);

  const handleChange = (field: 'name' | 'phone' | 'notes', value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const goNext = () => {
    if (currentIndex < formSteps.length - 1) {
      setCurrentStep(formSteps[currentIndex + 1].key);
    }
  };

  const goBack = () => {
    if (currentIndex > 0) {
      setCurrentStep(formSteps[currentIndex - 1].key);
    }
  };

  const canAdvance = (() => {
    if (currentStep === 'service') return Boolean(selectedService);
    if (currentStep === 'date') return Boolean(selectedDate) && availabilityLoaded;
    if (currentStep === 'time') {
      return Boolean(selectedSlot)
        && availabilityLoaded
        && !bookedTimes.has(selectedSlot)
        && isSaoPauloAppointmentInFuture(selectedDate, selectedSlot, now);
    }
    if (currentStep === 'details') return form.name.trim().length > 1 && form.phone.trim().length > 4;
    return true;
  })();

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setBookingError('');

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.name,
          phone: form.phone,
          service: selectedService.name,
          date: selectedDate,
          time: selectedSlot,
          notes: form.notes,
        }),
      });
      const payload = await response.json() as { ok?: boolean; id?: string; message?: string };

      if (!response.ok || !payload.ok || !payload.id) {
        setBookingError(payload.message || 'Não foi possível concluir o agendamento.');
        if (response.status === 409) void refreshAvailability();
        return;
      }

      setBookingNumber(`#${payload.id.slice(-6).toUpperCase()}`);
      setSubmitted(true);
      setCurrentStep('confirmation');
      void refreshAvailability();
    } catch {
      setBookingError('Não foi possível conectar ao sistema de agendamento. Tente novamente.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="rounded-[32px] border border-white/10 bg-[#101112]/90 p-5 shadow-[0_18px_80px_rgba(0,0,0,0.45)] md:p-8">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#d64a3d]/30 bg-[#d64a3d]/10 px-4 py-2 text-[10px] font-medium uppercase tracking-[0.28em] text-[#f7b9b1]">
          Agendamento confirmado
        </div>

        <div className="mb-6 rounded-2xl border border-[#d64a3d]/20 bg-[#d64a3d]/5 p-4 text-sm text-[#f3d2ce]">
          <p className="text-2xl font-black text-white">Olá, {form.name || 'Cliente'}!</p>
          <p className="mt-2 text-zinc-200">Seu horário foi agendado com sucesso.</p>
        </div>

        <div className="mb-6 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#d8d3cc]">
          {['✓ Serviço escolhido', '✓ Horário reservado', '✓ Agendamento confirmado'].map((item) => (
            <span key={item} className="rounded-full border border-[#d64a3d]/30 bg-[#d64a3d]/10 px-3 py-2 text-[#f7b9b1]">
              {item}
            </span>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[28px] border border-white/10 bg-[#171b1d] p-5">
            <p className="text-[10px] uppercase tracking-[0.3em] text-[#d7a29d]">Resumo do agendamento</p>
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <span className="text-[#b8b1ab]">Serviço</span>
                <strong className="text-white">{selectedService.name}</strong>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <span className="text-[#b8b1ab]">Profissional</span>
                <strong className="text-white">{professionalName}</strong>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <span className="text-[#b8b1ab]">Data</span>
                <strong className="text-white">{formatDate(selectedDate)}</strong>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <span className="text-[#b8b1ab]">Horário</span>
                <strong className="text-white">{selectedSlot}</strong>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <span className="text-[#b8b1ab]">Valor</span>
                <strong className="text-[#f7b9b1]">R$ {selectedService.price.toFixed(2)}</strong>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                <span className="text-[#b8b1ab]">Status</span>
                <strong className="rounded-full border border-[#d64a3d]/30 bg-[#d64a3d]/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[#f7b9b1]">Confirmado</strong>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[#b8b1ab]">Número do agendamento</span>
                <strong className="text-white">{bookingNumber}</strong>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-[#171b1d] p-5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#d7a29d]">Local do atendimento</p>
              <div className="mt-4 rounded-2xl border border-white/10 bg-[#111315] p-4">
                <div className="mb-3 flex items-center justify-between">
                  <span className="text-xl font-black text-white">{barberLocation.label}</span>
                  <span className="rounded-full border border-[#d64a3d]/30 bg-[#d64a3d]/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[#f7b9b1]">Local</span>
                </div>
                <p className="text-[#d0c8c2]">{barberLocation.street}</p>
                <p className="mt-1 text-[#d0c8c2]">{barberLocation.city}</p>
                <a href={barberLocation.mapsUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center justify-center rounded-full bg-[#d64a3d] px-4 py-2.5 text-sm font-semibold text-white transition duration-200 hover:bg-[#e55c4a] focus:outline-none focus:ring-2 focus:ring-[#f7b9b1] focus:ring-offset-2 focus:ring-offset-[#171b1d] active:scale-[0.98]">
                  Ver rota
                </a>
              </div>
            </div>

            <div className="rounded-[28px] border border-white/10 bg-[#171b1d] p-5">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#d7a29d]">Ações</p>
              <div className="mt-4 flex flex-col gap-3">
                <Link
                  href="/minha-conta"
                  onClick={() => window.sessionStorage.setItem('gui_barber_customer_phone', form.phone)}
                  className="inline-flex items-center justify-center rounded-full border border-white/15 bg-transparent px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:border-[#f7b9b1]/60 hover:text-[#f7b9b1] focus:outline-none focus:ring-2 focus:ring-[#f7b9b1] focus:ring-offset-2 focus:ring-offset-[#171b1d] active:scale-[0.98]"
                >
                  Meus serviços
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-[24px] border border-white/10 bg-[#111315] p-4 text-sm text-[#d0c8c2]">
          <p>Chegue alguns minutos antes do horário.</p>
          <p className="mt-2">Cancelamentos devem ser realizados com pelo menos 1 hora de antecedência.</p>
        </div>

        <div className="mt-8 rounded-[26px] border border-[#d64a3d]/25 bg-[#d64a3d]/5 p-4 text-sm text-[#f3d2ce]">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#f7b9b1]">Gerencie seus horários</p>
          <p className="mt-3 text-lg font-semibold text-white">Gerencie seus horários em Minha conta.</p>
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link href="/" className="inline-flex items-center justify-center rounded-full border border-white/15 bg-transparent px-6 py-3 text-sm font-semibold text-white transition duration-200 hover:border-[#f7b9b1]/60 hover:text-[#f7b9b1] focus:outline-none focus:ring-2 focus:ring-[#f7b9b1] focus:ring-offset-2 focus:ring-offset-[#101112] active:scale-[0.98]">
            Voltar ao início
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-[32px] border border-white/10 bg-[#101112]/90 p-5 shadow-[0_18px_80px_rgba(0,0,0,0.45)] md:p-8">
      <div className="mb-8 flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.28em] text-zinc-400">
        {formSteps.map((step, index) => (
          <div key={step.key} className="flex items-center gap-3">
            <span className={`rounded-full border px-3 py-2 transition-all duration-300 ${stepStatus(step.key) === 'active' ? 'border-[#d64a3d] bg-[#d64a3d]/10 text-[#f7b9b1]' : stepStatus(step.key) === 'done' ? 'border-[#d64a3d]/40 bg-[#d64a3d]/10 text-[#f7b9b1]' : 'border-white/10 bg-transparent text-zinc-400'}`}>
              {index + 1}. {step.label}
            </span>
            {index < formSteps.length - 1 && <span className="text-zinc-500">→</span>}
          </div>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-6">
          {currentStep === 'service' && (
            <div className="space-y-4 transition-all duration-300 ease-out">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#d7a29d]">Escolha o serviço</p>
              <div className="grid gap-3">
                {services.map((service) => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => setSelectedServiceId(service.id)}
                    className={`rounded-2xl border p-4 text-left transition-all duration-200 ${
                      selectedService.id === service.id
                        ? 'border-[#d64a3d] bg-[#d64a3d]/10 shadow-[0_0_0_1px_rgba(214,74,61,0.25)]'
                        : 'border-white/10 bg-white/3 hover:border-white/20 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h3 className="text-lg font-semibold text-white">{service.name}</h3>
                        <p className="mt-1 text-sm text-zinc-300">{service.description}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-[#f7b9b1]">R$ {service.price.toFixed(2)}</p>
                        <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-400">{service.duration} min</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 'date' && (
            <div className="space-y-4 transition-all duration-300 ease-out">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#d7a29d]">Escolha a data</p>
              {availabilityError ? <p role="alert" className="text-sm text-[#ffb0a5]">{availabilityError}</p> : null}
              {!availabilityLoaded && !availabilityError ? <p className="text-sm text-zinc-400">Consultando horários disponíveis...</p> : null}
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {bookingDates.map((date) => {
                  const hasNoAvailableTime = availabilityLoaded && timeSlots.every((slot) =>
                    occupiedSlots.some((booking) => bookingIntervalsOverlap(
                      { date, time: slot, durationMinutes: selectedService.duration },
                      booking,
                    ))
                    || !isSaoPauloAppointmentInFuture(date, slot, now),
                  );
                  const isSelected = selectedDate === date;
                  return (
                    <button
                      key={date}
                      type="button"
                      onClick={() => setSelectedDate(date)}
                      aria-label={`${new Date(`${date}T12:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC', weekday: 'long', day: '2-digit', month: 'long' })}${hasNoAvailableTime ? ', sem horários disponíveis' : ''}`}
                      className={`rounded-2xl border p-3 text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-[#d64a3d] bg-[#d64a3d]/10 text-[#f7b9b1]'
                          : hasNoAvailableTime
                            ? 'border-white/5 bg-white/[0.02] text-zinc-500 hover:border-white/10'
                            : 'border-white/10 bg-white/3 text-zinc-200 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      <p className="text-[10px] uppercase tracking-[0.2em]">{new Date(`${date}T12:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC', weekday: 'short' })}</p>
                      <p className="mt-2 text-lg font-semibold">{new Date(`${date}T12:00:00Z`).toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: 'short' })}</p>
                      {hasNoAvailableTime ? <p className="mt-1 text-xs">Sem horários livres</p> : null}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === 'time' && (
            <div className="space-y-4 transition-all duration-300 ease-out">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#d7a29d]">Escolha o horário</p>
              {availabilityError ? <p role="alert" className="text-sm text-[#ffb0a5]">{availabilityError}</p> : null}
              {!availabilityLoaded && !availabilityError ? <p className="text-sm text-zinc-400">Atualizando horários...</p> : null}
              <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {timeSlots.map((slot) => {
                  const isInFuture = isSaoPauloAppointmentInFuture(selectedDate, slot, now);
                  const isDisabled = !availabilityLoaded
                    || Boolean(availabilityError)
                    || bookedTimes.has(slot)
                    || !isInFuture;
                  const isSelected = selectedSlot === slot;
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled={isDisabled}
                      onClick={() => setSelectedSlot(slot)}
                      className={`rounded-full border px-4 py-3 text-sm transition-all duration-200 ${
                        isDisabled
                          ? 'cursor-not-allowed border-white/5 bg-white/[0.02] text-zinc-600'
                          : isSelected
                            ? 'border-[#d64a3d] bg-[#d64a3d] text-white shadow-[0_12px_20px_rgba(214,74,61,0.25)]'
                            : 'border-white/10 bg-white/3 text-zinc-200 hover:border-white/20 hover:bg-white/5'
                      }`}
                    >
                      {slot}{bookedTimes.has(slot) ? ' • Ocupado' : !isInFuture ? ' • Encerrado' : ''}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {currentStep === 'details' && (
            <div className="space-y-4 transition-all duration-300 ease-out">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#d7a29d]">Seus dados</p>
              <div className="space-y-4">
                <label className="block">
                  <span className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-zinc-400">Seu nome</span>
                  <input
                    value={form.name}
                    onChange={(event) => handleChange('name', event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#101011] px-4 py-3 text-white outline-none transition duration-200 focus:border-[#d64a3d] focus:ring-2 focus:ring-[#d64a3d]/40"
                    placeholder="Ex: João da Silva"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-zinc-400">WhatsApp</span>
                  <input
                    value={form.phone}
                    onChange={(event) => handleChange('phone', event.target.value)}
                    className="w-full rounded-2xl border border-white/10 bg-[#101011] px-4 py-3 text-white outline-none transition duration-200 focus:border-[#d64a3d] focus:ring-2 focus:ring-[#d64a3d]/40"
                    placeholder="(51) 99999-9999"
                    required
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-[10px] uppercase tracking-[0.25em] text-zinc-400">Observações</span>
                  <textarea
                    value={form.notes}
                    onChange={(event) => handleChange('notes', event.target.value)}
                    className="min-h-24 w-full rounded-2xl border border-white/10 bg-[#101011] px-4 py-3 text-white outline-none transition duration-200 focus:border-[#d64a3d] focus:ring-2 focus:ring-[#d64a3d]/40"
                    placeholder="Gostaria de algo específico?"
                  />
                </label>
              </div>
            </div>
          )}

          {currentStep === 'confirmation' && (
            <div className="space-y-4 transition-all duration-300 ease-out">
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#d7a29d]">Confirmação</p>
              <div className="rounded-[28px] border border-white/10 bg-[#111315] p-5">
                <p className="text-2xl font-black text-white">Confirmar agendamento</p>
                <div className="mt-5 space-y-3 text-sm text-[#d0c8c2]">
                  <div className="flex items-center justify-between gap-3">
                    <span>Serviço</span>
                    <strong className="text-white">{selectedService.name}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Data</span>
                    <strong className="text-white">{formatDate(selectedDate)}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Horário</span>
                    <strong className="text-white">{selectedSlot}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Profissional</span>
                    <strong className="text-white">{professionalName}</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-3">
            <button
              type="button"
              onClick={goBack}
              disabled={currentIndex === 0}
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-transparent px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:border-[#f7b9b1]/60 hover:text-[#f7b9b1] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-white/15 disabled:hover:text-white"
            >
              Voltar
            </button>
            {currentStep !== 'confirmation' ? (
              <button
                type="button"
                onClick={goNext}
                disabled={!canAdvance}
                className="inline-flex items-center justify-center rounded-full bg-[#d64a3d] px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-[#e55c4a] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#d64a3d]"
              >
                Continuar
              </button>
            ) : (
              <button type="submit" disabled={submitting} className="inline-flex items-center justify-center rounded-full bg-[#d64a3d] px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-[#e55c4a] disabled:cursor-wait disabled:opacity-60">
                {submitting ? 'Reservando...' : 'Confirmar agendamento'}
              </button>
            )}
          </div>
          {bookingError ? <p role="alert" className="pt-3 text-sm text-[#ffb0a5]">{bookingError}</p> : null}
        </div>

        <aside className="rounded-[28px] border border-white/10 bg-[#171b1d] p-5">
          <p className="text-[10px] uppercase tracking-[0.3em] text-[#d7a29d]">Resumo</p>

          <div className="mt-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-zinc-400">Serviço</p>
                <p className="mt-1 text-lg font-semibold text-white">{selectedService.name}</p>
              </div>
              <p className="text-lg font-semibold text-[#f7b9b1]">R$ {selectedService.price.toFixed(2)}</p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#111315] p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-zinc-400">Data</span>
                <span className="text-sm text-white">{selectedDate ? formatLabelDate(selectedDate) : '—'}</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-zinc-400">Horário</span>
                <span className="text-sm text-white">{selectedSlot}</span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-zinc-400">Profissional</span>
                <span className="text-sm text-white">{professionalName}</span>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="rounded-2xl border border-white/10 bg-[#111315] p-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-400">Nome</p>
              <p className="mt-2 text-base font-semibold text-white">{form.name || 'Ainda não informado'}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-[#111315] p-4">
              <p className="text-[10px] uppercase tracking-[0.25em] text-zinc-400">WhatsApp</p>
              <p className="mt-2 text-base font-semibold text-white">{form.phone || 'Ainda não informado'}</p>
            </div>
          </div>
        </aside>
      </div>
    </form>
  );
}
