export type BookingInterval = {
  date: string;
  time: string;
  durationMinutes: number;
};

const SAO_PAULO_TIME_ZONE = 'America/Sao_Paulo';

function appointmentMinute(date: string, time: string) {
  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.slice(0, 5).split(':').map(Number);
  return Date.UTC(year, month - 1, day, hour, minute) / 60_000;
}

export function bookingIntervalsOverlap(
  first: BookingInterval,
  second: BookingInterval,
) {
  const firstStart = appointmentMinute(first.date, first.time);
  const secondStart = appointmentMinute(second.date, second.time);

  return (
    firstStart < secondStart + second.durationMinutes &&
    secondStart < firstStart + first.durationMinutes
  );
}

export function getSaoPauloDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: SAO_PAULO_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';

  return `${part('year')}-${part('month')}-${part('day')}`;
}

export function getSaoPauloDateRange(length: number, now = new Date()) {
  return Array.from({ length: Math.max(0, Math.floor(length)) }, (_, index) =>
    addBookingDays(getSaoPauloDate(now), index),
  );
}

export function getSaoPauloDateOffset(offset: number, now = new Date()) {
  return addBookingDays(getSaoPauloDate(now), offset);
}

export function addBookingDays(date: string, offset: number) {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day + Math.trunc(offset)))
    .toISOString()
    .slice(0, 10);
}

export function isValidBookingDate(date: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;

  const [year, month, day] = date.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  return parsed.toISOString().slice(0, 10) === date;
}

export function isSaoPauloAppointmentInFuture(
  date: string,
  time: string,
  now = new Date(),
) {
  if (!isValidBookingDate(date) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return false;
  }

  const today = getSaoPauloDate(now);
  if (date !== today) return date > today;

  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SAO_PAULO_TIME_ZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((item) => item.type === type)?.value);
  const currentMinute = part('hour') * 60 + part('minute');
  const [hour, minute] = time.split(':').map(Number);

  return hour * 60 + minute > currentMinute;
}

export function getSaoPauloAppointmentTimestamp(date: string, time: string) {
  if (!isValidBookingDate(date) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) {
    return Number.NaN;
  }

  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute] = time.split(':').map(Number);
  const targetAsUtc = Date.UTC(year, month - 1, day, hour, minute);
  let timestamp = targetAsUtc;
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: SAO_PAULO_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });

  for (let attempt = 0; attempt < 2; attempt += 1) {
    const parts = formatter.formatToParts(new Date(timestamp));
    const part = (type: Intl.DateTimeFormatPartTypes) =>
      Number(parts.find((item) => item.type === type)?.value);
    const localAsUtc = Date.UTC(
      part('year'),
      part('month') - 1,
      part('day'),
      part('hour'),
      part('minute'),
    );
    const difference = targetAsUtc - localAsUtc;
    timestamp += difference;
    if (difference === 0) break;
  }

  return timestamp;
}
