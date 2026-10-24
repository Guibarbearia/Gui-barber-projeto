export type BarberService = {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
};

export const barberSettings = {
  name: 'GUI BARBER',
  profession: 'Barbeiro',
  professionalName: 'Guilherme',
  category: 'Barbearia',
  phoneDisplay: '+55 51 99018-4228',
  whatsappNumber: '5551990184228',
  whatsappMessage: 'Olá! Vim pelo site do Gui Barber e gostaria de saber mais sobre os horários.',
  whatsappUrl: 'https://wa.me/5551990184228?text=Ol%C3%A1!%20Vim%20pelo%20site%20do%20Gui%20Barber%20e%20gostaria%20de%20saber%20mais%20sobre%20os%20hor%C3%A1rios.',
  instagramHandle: '@guimarquesbarber',
  instagramUrl: 'https://www.instagram.com/guimarquesbarber/',
  address: 'Tv. Estácio de Sá, 43',
  city: 'Canoas - RS',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Tv.+Est%C3%A1cio+de+S%C3%A1,+43,+Canoas+-+RS',
  mapsQuery: 'Tv. Estácio de Sá, 43, Canoas - RS',
  cancellationMinimumHours: 1,
};

export const brandName = barberSettings.name;
export const professionalName = barberSettings.professionalName;
export const barberStats = {
  experienceYears: 2,
  cutsCompleted: 4500,
};

export const barberLocation = {
  label: barberSettings.name,
  street: barberSettings.address,
  city: barberSettings.city,
  mapsUrl: barberSettings.mapsUrl,
};

export const services: BarberService[] = [
  {
    id: 'corte-classico',
    name: 'Corte Clássico',
    price: 30,
    duration: 30,
    description: 'Corte preciso, acabamento limpo e visual clássico com personalidade marcante.',
  },
  {
    id: 'corte-barba',
    name: 'Corte + Barba',
    price: 35,
    duration: 45,
    description: 'Combinação perfeita de corte e barba com modelagem impecável para um visual completo.',
  },
  {
    id: 'corte-sobrancelha',
    name: 'Corte + Sobrancelha',
    price: 35,
    duration: 35,
    description: 'Refinamento completo com contorno e acabamento que valorizam sua presença.',
  },
  {
    id: 'combo-premium',
    name: 'Combo Premium',
    price: 50,
    duration: 60,
    description: 'Corte, barba e acabamento premium para quem quer presença e acabamento impecável.',
  },
];

export const timeSlots = [
  '09:00',
  '09:30',
  '10:00',
  '10:30',
  '11:00',
  '11:30',
  '12:00',
  '12:30',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '15:30',
  '16:00',
  '16:30',
  '17:00',
];

export const gallery = [
  { title: 'Vídeos', tag: 'Cortes' },
  { title: 'Cortes', tag: 'Estilo' },
  { title: 'Barba', tag: 'Detalhe' },
  { title: 'Ambiente', tag: 'Atendimento' },
];

export const demoReviews = [
  {
    name: 'Lucas P.',
    rating: 5,
    comment: 'Ambiente muito limpo, atendimento impecável e corte com acabamento muito profissional.',
    demo: true,
  },
  {
    name: 'Rafael T.',
    rating: 5,
    comment: 'Corte com atenção aos detalhes e barba bem modelada. Sem dúvida vale a pena.',
    demo: true,
  },
  {
    name: 'Pedro H.',
    rating: 5,
    comment: 'Muito bom o cuidado, a estrutura do espaço e a experiência geral de atendimento.',
    demo: true,
  },
];

export const testimonials = demoReviews.map((item) => ({
  name: item.name,
  text: item.comment,
  rating: item.rating,
  demo: item.demo,
}));
