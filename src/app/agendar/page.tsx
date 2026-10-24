import Link from 'next/link';
import { BookingFlow } from '@/components/BookingFlow';

export default function AgendarPage() {
  return (
    <main className="min-h-screen bg-[#0b0d0f] px-4 py-8 text-[#f4efe8] sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#d8d3cc] transition hover:text-[#f7b9b1]">
            ← Voltar para a home
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d64a3d]/30 bg-[#d64a3d]/10 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-[#f7b9b1]">
            Agendamento online
          </div>
        </div>

        <div className="mb-10 text-center">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#d7a29d]">GUI BARBER</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] text-white sm:text-5xl">Agende seu horário</h1>
        </div>

        <BookingFlow />
      </div>
    </main>
  );
}
