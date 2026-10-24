import type { Metadata } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import { FloatingWhatsApp } from '@/components/FloatingWhatsApp';
import { AdminAccessLink } from '@/components/AdminAccessLink';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-display',
});

export const metadata: Metadata = {
  title: 'GUI BARBER | Barbearia em Canoas - RS',
  description: 'Barbearia premium em Canoas - RS com cortes, barba e agendamento para homens que valorizam presença e estilo.',
  keywords: ['GUI BARBER', 'barbearia', 'Canoas', 'corte masculino', 'agendamento barbearia'],
  alternates: { canonical: 'https://guibarber.com.br' },
  openGraph: {
    title: 'GUI BARBER',
    description: 'Barbearia premium em Canoas - RS.',
    type: 'website',
    locale: 'pt_BR',
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${inter.variable} ${playfair.variable} h-full`}>
      <body className="min-h-full bg-[#0b0d0f] text-[#f5f1ea] antialiased">
        {children}
        <FloatingWhatsApp />
        <AdminAccessLink />
      </body>
    </html>
  );
}
