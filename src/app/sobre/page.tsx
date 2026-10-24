import Link from 'next/link';

const features = [
  'Atendimento personalizado e discreto',
  'Ambiente premium com foco em detalhe',
  'Execução técnica com acabamento refinado',
  'Experiência para homens que valorizam presença',
];

export default function SobrePage() {
  return (
    <main className="min-h-screen bg-[#0b0d0f] px-4 py-8 text-[#f4efe8] sm:px-6 lg:px-8 lg:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#d8d3cc] transition hover:text-[#f7b9b1]">
            ← Voltar para a home
          </Link>
          <div className="inline-flex items-center gap-2 rounded-full border border-[#d64a3d]/30 bg-[#d64a3d]/10 px-4 py-2 text-[10px] uppercase tracking-[0.28em] text-[#f7b9b1]">
            Sobre a casa
          </div>
        </div>

        <section className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
          <div className="rounded-[30px] border border-white/10 bg-[#111315] p-8 md:p-10 shadow-[0_18px_55px_rgba(0,0,0,0.14)]">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#d7a29d]">Nossa essência</p>
            <h1 className="mt-4 text-4xl font-black tracking-[-0.06em] text-white sm:text-5xl">Precisão, presença e acabamento refinado.</h1>
            <p className="mt-5 text-base leading-7 text-[#d0c8c2]">
              O GUI BARBER foi criado para entregar cortes e tratamentos que elevam a presença do cliente. A missão é criar uma experiência direta, confortável e bem feita em cada visita, com foco em detalhes que fazem diferença.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/10 bg-[#171b1d] p-4">
                <p className="text-3xl font-black text-white">10+</p>
                <p className="mt-2 text-sm text-[#d0c8c2]">anos de experiência</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#171b1d] p-4">
                <p className="text-3xl font-black text-white">12k+</p>
                <p className="mt-2 text-sm text-[#d0c8c2]">cortes realizados</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="min-h-[220px] rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,_#d64a3d,_#1a2127)] p-6" />
            <div className="min-h-[220px] rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,_#1a2127,_#d64a3d)] p-6" />
            <div className="min-h-[220px] rounded-[28px] border border-white/10 bg-[linear-gradient(135deg,_#f2ebe3,_#c7d0d5)] p-6 sm:col-span-2" />
          </div>
        </section>

        <section className="mt-12 rounded-[30px] border border-white/10 bg-[#111315] p-8 text-white md:p-10">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#d7a29d]">O que nos diferencia</p>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {features.map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-base text-[#e8e0da]">
                {item}
              </div>
            ))}
          </div>
        </section>

        <div className="mt-12 flex justify-center">
          <Link href="/agendar" className="inline-flex items-center justify-center rounded-full bg-[#d64a3d] px-8 py-3.5 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(214,74,61,0.35)]">
            Agendar meu horário
          </Link>
        </div>
      </div>
    </main>
  );
}
