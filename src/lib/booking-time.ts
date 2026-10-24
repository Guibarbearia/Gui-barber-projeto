export type BookingInterval = {
  date: string;
  time: string;
  durationMinutes: number;
};

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
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';

  return `${part('year')}-${part('month')}-${part('day')}`;
}
