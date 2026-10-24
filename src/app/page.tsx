import Link from 'next/link';
import { services, testimonials, barberLocation, barberStats, barberSettings } from '@/data/barber';

const heroStats = [
  { value: `${barberStats.experienceYears} anos`, label: 'de experiência' },
  { value: `${barberStats.cutsCompleted.toLocaleString('pt-BR')}+`, label: 'cortes realizados' },
  { value: '4.9', label: 'nota média' },
];

const portfolioItems = [
  {
    title: 'Vídeos',
    tag: 'Reels',
    description: 'Cortes em movimento, barbas e acabamento em destaque.',
    accent: 'bg-[linear-gradient(135deg,#1a2127,#d64a3d)]',
  },
  {
    title: 'Cortes',
    tag: 'Resultado',
    description: 'Finais impecáveis com visual limpo e masculino.',
    accent: 'bg-[linear-gradient(135deg,#d64a3d,#2a3139)]',
  },
  {
    title: 'Barba',
    tag: 'Detalhe',
    description: 'Modelagens precisas para valorizar o rosto.',
    accent: 'bg-[linear-gradient(135deg,#424851,#111315)]',
  },
  {
    title: 'Ambiente',
    tag: 'Espaço',
    description: 'A atmosfera premium da barbearia em destaque.',
    accent: 'bg-[linear-gradient(135deg,#111315,#d64a3d)]',
  },
];

const footerLinks = [
  { label: 'Início', href: '#top' },
  { label: 'Serviços', href: '/servicos' },
  { label: 'Equipe', href: '#sobre' },
  { label: 'Galeria', href: '#galeria' },
  { label: 'Contato', href: '#contato' },
  { label: 'Agendar horário', href: '/agendar' },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0b0d0f] text-[#f4efe8]">
      <header className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-20 items-center justify-between gap-3 border-b border-white/10">
          <Link href="/" className="shrink-0 text-base font-bold tracking-[0.12em] text-white sm:text-lg" aria-label="GUI BARBER home">
            GUI BARBER
          </Link>

          <nav className="hidden items-center gap-6 text-sm text-[#d8d3cc] md:flex">
            <Link href="/servicos" className="transition hover:text-[#f7b9b1]">Serviços</Link>
            <Link href="/sobre" className="transition hover:text-[#f7b9b1]">Sobre</Link>
            <Link href="#galeria" className="transition hover:text-[#f7b9b1]">Galeria</Link>
            <Link href="#contato" className="transition hover:text-[#f7b9b1]">Contato</Link>
          </nav>

          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <Link href="/minha-conta" className="inline-flex items-center justify-center rounded-full border border-white/15 px-3 py-2 text-xs font-medium text-[#f4efe8] transition hover:border-white/40 sm:px-4">
              Minha conta
            </Link>
            <Link href="/agendar" className="inline-flex items-center justify-center rounded-full bg-[#d64a3d] px-4 py-2.5 text-xs font-semibold text-white transition duration-200 hover:bg-[#e55c4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7b9b1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d0f] sm:px-5 sm:text-sm">
              Agendar horário
            </Link>
          </div>
        </div>
      </header>

      <section id="top" className="mx-auto max-w-6xl px-4 pb-16 pt-14 sm:px-6 lg:px-8 lg:pb-24 lg:pt-24">
        <div className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.24em] text-[#d7a29d]">
            Barbearia em Canoas • {barberSettings.professionalName}
          </p>
          <h1 className="mt-5 max-w-3xl text-4xl font-bold leading-[1.08] tracking-[-0.045em] text-white sm:text-6xl lg:text-7xl">
            Sua presença começa com um corte impecável.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-[#d9d2c9] sm:text-lg sm:leading-8">
            Precisão, tradição e estilo moderno em uma experiência de barbearia feita para você.
          </p>

          <div className="mt-8">
            <Link href="/agendar" className="inline-flex items-center justify-center rounded-full bg-[#d64a3d] px-7 py-3.5 text-sm font-semibold text-white transition duration-200 hover:bg-[#e55c4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7b9b1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d0f]">
              Agendar horário
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-5 border-t border-white/10 pt-6">
            {heroStats.map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl font-bold text-white sm:text-3xl">{stat.value}</p>
                <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-[#b2a9a1]">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#f2ebe3]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-5 px-4 py-6 text-center text-[10px] uppercase tracking-[0.22em] text-[#5d524f] sm:gap-10 sm:text-xs">
          <span>Estilo masculino</span>
          <span>Barba com precisão</span>
          <span>Acabamento refinado</span>
          <span>Experiência premium</span>
        </div>
      </section>

      <section id="servicos" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#d7a29d]">Serviços</p>
            <h3 className="mt-3 text-3xl text-white sm:text-4xl">A base do visual que comunica presença</h3>
          </div>
          <Link href="/agendar" className="hidden text-sm font-medium text-[#f3d1ca] hover:text-white md:inline-flex">
            Agendar agora →
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          {services.map((service) => (
            <article key={service.id} className="rounded-[28px] border border-white/10 bg-[#111315] p-6 shadow-[0_20px_40px_rgba(0,0,0,0.18)] transition duration-200 hover:-translate-y-1 hover:border-[#d64a3d]/60">
              <div className="flex items-center justify-between">
                <span className="rounded-full border border-[#d64a3d]/30 bg-[#d64a3d]/10 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[#f7b9b1]">
                  Popular
                </span>
                <span className="text-sm text-[#b7b1ab]">{service.duration} min</span>
              </div>

              <h4 className="mt-6 text-2xl font-bold text-white">{service.name}</h4>
              <p className="mt-3 text-sm leading-6 text-[#cfc7c1]">{service.description}</p>

              <div className="mt-8 border-t border-white/10 pt-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-2xl font-black text-[#f7b9b1]">R$ {service.price.toFixed(2)}</p>
                  <Link href="/agendar" className="inline-flex items-center justify-center rounded-full border border-[#d64a3d]/40 bg-[#d64a3d]/10 px-3 py-2 text-[10px] uppercase tracking-[0.2em] text-[#f7b9b1] transition duration-200 hover:bg-[#d64a3d]/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7b9b1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111315] active:scale-[0.98]">
                    Agendar
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="sobre" className="bg-[#111315] py-20 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div className="rounded-[30px] border border-white/10 bg-[#171b1d] p-8">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#f7b9b1]">Sobre o ambiente</p>
            <h3 className="mt-4 text-3xl sm:text-4xl">Precisão, presença e cuidado em cada detalhe.</h3>
            <div className="mt-5 h-px w-20 bg-[#d64a3d]" />
            <p className="mt-6 text-base leading-7 text-[#d0c8c2]">
              O GUI BARBER nasceu para oferecer cortes, barbas e acabamento premium com uma rotina eficiente, atendimento cuidadoso e visual alinhado ao seu estilo pessoal.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-[26px] border border-white/10 bg-[#1c2023] p-6">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#f7b9b1]">Experiência</p>
              <p className="mt-5 text-4xl font-black text-white">2 anos</p>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-[#1c2023] p-6">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#f7b9b1]">Atendimento</p>
              <p className="mt-5 text-4xl font-black text-white">Foco</p>
            </div>
            <div className="rounded-[26px] border border-white/10 bg-[#1c2023] p-6 sm:col-span-2">
              <p className="text-[10px] uppercase tracking-[0.24em] text-[#f7b9b1]">Filosofia</p>
              <p className="mt-5 text-lg leading-7 text-[#d0c8c2]">
                Estilo com intenção, ambiente com respeito e resultado que se percebe na primeira impressão.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="galeria" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mb-10 flex flex-col items-center gap-3 text-center">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#d7a29d]">Nosso trabalho</p>
          <h3 className="text-3xl text-white sm:text-4xl">Conheça nosso trabalho</h3>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <article className="group overflow-hidden rounded-[30px] border border-white/10 bg-[#111315] transition duration-200 hover:-translate-y-1 hover:border-[#d64a3d]/60">
            <div className="relative h-[360px] bg-[linear-gradient(135deg,#1f2428,#d64a3d)] p-6 sm:p-8">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.26),_transparent_40%)]" />
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.28em] text-[#f7b9b1]">
                  <span>Vídeos</span>
                  <span className="rounded-full border border-white/15 bg-white/5 px-3 py-1.5">Reel</span>
                </div>
                <div>
                  <p className="text-3xl font-black text-white sm:text-4xl">Cortes em movimento</p>
                  <p className="mt-3 max-w-md text-sm leading-6 text-[#f2e7df]">
                    A estrutura está pronta para receber vídeos de cortes, barba e acabamento em alta qualidade.
                  </p>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center pb-8">
                <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/60 bg-black/25 text-2xl text-white shadow-[0_12px_25px_rgba(0,0,0,0.28)] transition duration-200 group-hover:scale-105">
                  ▶
                </div>
              </div>
            </div>
          </article>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
            {portfolioItems.slice(1).map((item) => (
              <article key={item.title} className="group overflow-hidden rounded-[28px] border border-white/10 bg-[#111315] transition duration-200 hover:-translate-y-1 hover:border-[#d64a3d]/60">
                <div className={`relative h-40 ${item.accent} p-5`}>
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.24),_transparent_42%)]" />
                  <div className="relative flex h-full flex-col justify-between">
                    <div className="flex items-center justify-between text-[10px] uppercase tracking-[0.2em] text-[#f7b9b1]">
                      <span>{item.tag}</span>
                      <span className="rounded-full border border-white/15 bg-black/10 px-2 py-1">{item.title}</span>
                    </div>
                    <p className="max-w-[14rem] text-xl font-semibold text-white">{item.title}</p>
                  </div>
                </div>
                <div className="p-4">
                  <p className="text-sm leading-6 text-[#d0c8c2]">{item.description}</p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-[30px] border border-white/10 bg-[#111315] p-6 md:p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#d7a29d]">Instagram</p>
              <h3 className="mt-3 text-3xl text-white">Mais do Gui Barber</h3>
            </div>
            <a
              href={barberSettings.instagramUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-full bg-[#d64a3d] px-5 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-[#e55c4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7b9b1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111315] active:scale-[0.98]"
            >
              Ver Instagram
            </a>
          </div>
          <div className="mt-6 rounded-[26px] border border-white/10 bg-[#171b1d] p-5 md:p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-[10px] uppercase tracking-[0.24em] text-[#d7a29d]">Perfil oficial</p>
                <p className="mt-2 text-2xl font-black text-white">{barberSettings.instagramHandle}</p>
              </div>
              <p className="max-w-xl text-base leading-7 text-[#d0c8c2]">
                Confira nossos cortes, trabalhos e novidades no Instagram.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="depoimentos" className="bg-[#f1f0ed] py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 text-center">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#6e6a68]">Avaliações</p>
            <h3 className="mt-3 text-3xl text-[#111315] sm:text-4xl">O que nossos clientes dizem</h3>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {testimonials.map((person) => (
              <article key={person.name} className="rounded-[28px] border border-[#111315]/10 bg-white p-6 shadow-[0_16px_28px_rgba(17,19,21,0.04)] transition duration-200 hover:-translate-y-1 hover:border-[#d64a3d]/35">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#1a2127] text-sm font-bold text-white">
                      {person.name.charAt(0)}
                    </div>
                    <p className="text-lg font-semibold text-[#111315]">{person.name}</p>
                  </div>
                  {person.demo ? (
                    <span className="rounded-full border border-[#d64a3d]/30 bg-[#d64a3d]/10 px-2 py-1 text-[9px] font-medium uppercase tracking-[0.18em] text-[#d64a3d]">
                      Demo
                    </span>
                  ) : null}
                </div>
                <div className="mb-4 text-[#d64a3d]" aria-label={`Avaliação ${person.rating} de 5`}>
                  {'★'.repeat(person.rating)}
                </div>
                <p className="text-base leading-7 text-[#4f4a47]">“{person.text}”</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="contato" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[30px] border border-white/10 bg-[#111315] p-8">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#d7a29d]">Contato</p>
            <h3 className="mt-4 text-3xl text-white">Fale com o GUI BARBER</h3>
            <div className="mt-8 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-[#171b1d] p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#d7a29d]">WhatsApp</p>
                <p className="mt-2 text-lg font-semibold text-white">{barberSettings.phoneDisplay}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#171b1d] p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#d7a29d]">Instagram</p>
                <p className="mt-2 text-lg font-semibold text-white">{barberSettings.instagramHandle}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-[#171b1d] p-4">
                <p className="text-[10px] uppercase tracking-[0.2em] text-[#d7a29d]">Endereço</p>
                <p className="mt-2 text-lg font-semibold text-white">{barberLocation.street}</p>
                <p className="mt-1 text-[#d0c8c2]">{barberLocation.city}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[#171b1d] p-8">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#d7a29d]">Atendimento</p>
            <h3 className="mt-4 text-3xl text-white">Pronto para agendar?</h3>
            <div className="mt-8 flex flex-col gap-3">
              <a href={barberSettings.whatsappUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full bg-[#d64a3d] px-5 py-3.5 text-sm font-semibold text-white transition duration-200 hover:bg-[#e55c4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7b9b1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#171b1d] active:scale-[0.98]">
                Falar no WhatsApp
              </a>
              <a href={barberSettings.instagramUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full border border-white/15 bg-transparent px-5 py-3.5 text-sm font-semibold text-white transition duration-200 hover:border-[#f7b9b1]/60 hover:text-[#f7b9b1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7b9b1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#171b1d] active:scale-[0.98]">
                Ver Instagram
              </a>
              <a href={barberLocation.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full border border-white/15 bg-transparent px-5 py-3.5 text-sm font-semibold text-white transition duration-200 hover:border-[#f7b9b1]/60 hover:text-[#f7b9b1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7b9b1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#171b1d] active:scale-[0.98]">
                Como chegar
              </a>
            </div>
          </div>
        </div>
      </section>

      <section id="localizacao" className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[30px] border border-white/10 bg-[#111315] p-8">
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#d7a29d]">Local</p>
            <h3 className="mt-4 text-3xl text-white">GUI BARBER</h3>
            <p className="mt-5 text-base leading-7 text-[#cfc7c1]">
              {barberLocation.street}<br />
              {barberLocation.city}
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <a href={barberLocation.mapsUrl} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-full bg-[#d64a3d] px-5 py-3.5 text-sm font-semibold text-white shadow-[0_18px_28px_rgba(214,74,61,0.35)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#e55c4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7b9b1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111315] active:scale-[0.98]">
                Ver rota
              </a>
              <Link href="/agendar" className="inline-flex items-center justify-center rounded-full border border-white/15 bg-transparent px-5 py-3.5 text-sm font-semibold text-white transition duration-200 hover:border-[#f7b9b1]/60 hover:text-[#f7b9b1] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f7b9b1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#111315] active:scale-[0.98]">
                Agendar atendimento
              </Link>
            </div>
          </div>

          <div className="rounded-[30px] border border-white/10 bg-[#171b1d] p-4">
            <iframe
              title="Mapa da GUI BARBER"
              src="https://www.google.com/maps?q=Tv.%20Est%C3%A1cio%20de%20S%C3%A1,%2043,%20Canoas%20-%20RS&z=15&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="h-[340px] w-full rounded-[24px] border-0"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="rounded-[32px] border border-[#111214]/10 bg-[#f7f1ea] p-8 text-center shadow-[0_18px_55px_rgba(17,17,17,0.06)] md:p-12">
          <p className="text-[10px] uppercase tracking-[0.28em] text-[#8a2018]">Seu próximo corte</p>
          <h3 className="mx-auto mt-5 max-w-2xl text-4xl font-black text-[#111214] sm:text-5xl">
            Seu próximo corte começa aqui.
          </h3>
          <div className="mt-8 flex flex-col justify-center gap-4 sm:flex-row">
            <Link href="/agendar" className="inline-flex items-center justify-center rounded-full bg-[#d64a3d] px-7 py-3.5 text-sm font-semibold text-white shadow-[0_18px_30px_rgba(214,74,61,0.35)] transition duration-200 hover:-translate-y-0.5 hover:bg-[#e55c4a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d64a3d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f1ea] active:scale-[0.98]">
              Agendar meu corte
            </Link>
            <Link href="/servicos" className="inline-flex items-center justify-center rounded-full border border-[#111214]/15 bg-transparent px-7 py-3.5 text-sm font-semibold text-[#111214] transition duration-200 hover:border-[#d64a3d]/40 hover:text-[#d64a3d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d64a3d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#f7f1ea] active:scale-[0.98]">
              Ver serviços
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t border-[#111214]/10 bg-[#f1e7de]">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div>
              <p className="text-[10px] uppercase tracking-[0.28em] text-[#8a2018]">GUI BARBER</p>
              <h4 className="mt-3 text-2xl font-black text-[#111214]">Barbeiro</h4>
              <p className="mt-3 text-sm text-[#4b4b4b]">{barberSettings.address}</p>
              <p className="text-sm text-[#4b4b4b]">{barberSettings.city}</p>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a2018]">Links</p>
              <div className="mt-3 flex flex-col gap-2 text-sm text-[#4b4b4b]">
                {footerLinks.map((item) => (
                  <Link key={item.label} href={item.href} className="transition hover:text-[#8a2018]">
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a2018]">Contato</p>
              <div className="mt-3 space-y-2 text-sm text-[#4b4b4b]">
                <a href={barberSettings.whatsappUrl} target="_blank" rel="noreferrer" className="block transition hover:text-[#8a2018]">
                  WhatsApp • {barberSettings.phoneDisplay}
                </a>
                <a href={barberSettings.instagramUrl} target="_blank" rel="noreferrer" className="block transition hover:text-[#8a2018]">
                  Instagram • {barberSettings.instagramHandle}
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[#111214]/10 pt-5 text-sm text-[#4b4b4b] md:flex-row">
            <p>© 2025 GUI BARBER • {barberSettings.city}</p>
            <div className="flex items-center gap-4">
              <a href={barberSettings.whatsappUrl} target="_blank" rel="noreferrer" className="text-[10px] uppercase tracking-[0.2em] text-[#8a2018] transition hover:text-[#c6372d]">
                WhatsApp
              </a>
              <a href={barberSettings.instagramUrl} target="_blank" rel="noreferrer" className="text-[10px] uppercase tracking-[0.2em] text-[#8a2018] transition hover:text-[#c6372d]">
                Instagram
              </a>
              <Link href="/admin/login" className="text-[10px] uppercase tracking-[0.2em] text-[#6b625d] transition hover:text-[#8a2018]">
                Acesso administrativo
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
