import Link from 'next/link';
import { services } from '@/data/barber';

export default function ServicosPage() {
  return (
    <main className="min-h-screen bg-[#0b0d0f] px-4 py-8 text-[#f4efe8] sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#d8d3cc] transition hover:text-[#f7b9b1]">
            ← Voltar para a home
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d64a3d]/30 bg-[#d64a3d]/10 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-[#f7b9b1]">
            Serviços
          </div>
        </div>

        <div className="mb-10 text-center">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#d7a29d]">GUI BARBER</p>
          <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] text-white sm:text-5xl">Serviços pensados para o seu estilo</h1>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => (
            <article key={service.id} className="rounded-[28px] border border-white/10 bg-[#111315] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.18)]">
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-[#d64a3d]/30 bg-[#d64a3d]/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[#f7b9b1]">Popular</span>
                <span className="text-sm text-[#b7b1ab]">{service.duration} min</span>
              </div>

              <h2 className="mt-6 text-2xl font-bold text-white">{service.name}</h2>
              <p className="mt-3 text-sm leading-6 text-[#cfc7c1]">{service.description}</p>

              <div className="mt-8 border-t border-white/10 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-2xl font-black text-[#f7b9b1]">R$ {service.price.toFixed(2)}</p>
                  <Link href="/agendar" className="inline-flex items-center justify-center rounded-full border border-[#d64a3d]/40 bg-[#d64a3d]/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[#f7b9b1]">
                    Agendar
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>

        <section className="mt-12 rounded-[30px] border border-white/10 bg-[#111315] p-8 text-center shadow-[0_18px_55px_rgba(0,0,0,0.18)]">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#d7a29d]">Experiência completa</p>
          <h2 className="mt-4 text-3xl font-black text-white sm:text-4xl">Seu horário pensado para uma rotina impecável.</h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#d0c8c2]">
            Cada visita é feita para manter seu visual alinhado com a sua rotina, com atenção ao detalhe e cuidado no acabamento final.
          </p>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/agendar" className="inline-flex items-center justify-center rounded-full bg-[#d64a3d] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(214,74,61,0.35)]">
              Reservar horário
            </Link>
            <Link href="/sobre" className="inline-flex items-center justify-center rounded-full border border-white/15 bg-transparent px-7 py-3.5 text-sm font-semibold text-white transition hover:border-[#f7b9b1]/60 hover:text-[#f7b9b1]">
              Conhecer a barbearia
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
