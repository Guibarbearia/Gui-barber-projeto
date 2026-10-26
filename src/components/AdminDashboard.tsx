'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { services as baseServices } from '@/data/barber';
import { addBookingDays, getSaoPauloDate } from '@/lib/booking-time';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

type BookingStatus = 'pendente' | 'confirmado' | 'concluido' | 'cancelado' | 'no-show';
type PaymentMethod = 'pix' | 'cartao' | 'dinheiro' | 'outros';
type AdminTab = 'overview' | 'bookings' | 'customers' | 'services' | 'finance' | 'reports' | 'settings';

type ServiceItem = {
  id: string;
  name: string;
  price: number;
  duration: number;
  description: string;
  active: boolean;
};

type BookingRecord = {
  id: string;
  customerName: string;
  phone: string;
  service: string;
  price: number;
  date: string;
  time: string;
  serviceDurationMinutes: number;
  notes: string;
  professional: string;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  createdAt: string;
};

type ShopSettings = {
  shopName: string;
  phone: string;
  whatsapp: string;
  address: string;
  mapUrl: string;
  cancellationPolicy: string;
  cancellationFee: number;
  openingHours: string;
};

const SERVICES_KEY = 'black-blade-services';
const SETTINGS_KEY = 'black-blade-settings';
const staffMembers = ['Matheus', 'Rafael', 'Leonardo'];

const defaultServices: ServiceItem[] = baseServices.map((service) => ({
  ...service,
  active: true,
}));

const defaultSettings: ShopSettings = {
  shopName: 'GUI BARBER',
  phone: '(51) 99999-9999',
  whatsapp: '(51) 99999-9999',
  address: 'Rua da Barba, 245 - Centro, Porto Alegre / RS',
  mapUrl: 'https://maps.google.com/?q=Rua+da+Barba+245+Porto+Alegre',
  cancellationPolicy: 'Cancelamento com até 24h de antecedência.',
  cancellationFee: 15,
  openingHours: 'Segunda a sábado | 09:00 às 19:00',
};

const navItems: { value: AdminTab; label: string; icon: string }[] = [
  { value: 'overview', label: 'Visão geral', icon: '◫' },
  { value: 'bookings', label: 'Agendamentos', icon: '◌' },
  { value: 'customers', label: 'Clientes', icon: '◍' },
  { value: 'services', label: 'Serviços', icon: '◈' },
  { value: 'finance', label: 'Financeiro', icon: '◎' },
  { value: 'reports', label: 'Relatórios', icon: '▣' },
  { value: 'settings', label: 'Configurações', icon: '⚙' },
];

function loadServices(): ServiceItem[] {
  if (typeof window === 'undefined') return defaultServices;
  try {
    const raw = localStorage.getItem(SERVICES_KEY);
    return raw ? (JSON.parse(raw) as ServiceItem[]) : defaultServices;
  } catch {
    return defaultServices;
  }
}

function loadSettings(): ShopSettings {
  if (typeof window === 'undefined') return defaultSettings;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings;

    const savedSettings = JSON.parse(raw) as Partial<ShopSettings>;
    return {
      ...defaultSettings,
      ...savedSettings,
      shopName: savedSettings.shopName === 'Black & Blade' ? 'GUI BARBER' : savedSettings.shopName || 'GUI BARBER',
    };
  } catch {
    return defaultSettings;
  }
}

function formatDate(dateString: string) {
  return new Date(`${dateString}T12:00:00Z`).toLocaleDateString('pt-BR', {
    timeZone: 'UTC',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function currency(value: number) {
  return `R$ ${value.toFixed(2)}`;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function statusClass(value: BookingStatus) {
  if (value === 'confirmado') return 'status-confirmado';
  if (value === 'concluido') return 'status-sucesso';
  if (value === 'pendente') return 'status-pendente';
  if (value === 'cancelado' || value === 'no-show') return 'status-cancelado';
  return 'status-pendente';
}

export function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [queueBookingIds, setQueueBookingIds] = useState<string[]>([]);
  const [bookingsError, setBookingsError] = useState('');
  const [servicesList, setServicesList] = useState<ServiceItem[]>(() => loadServices());
  const [settings, setSettings] = useState<ShopSettings>(() => loadSettings());
  const [todayKey] = useState(() => getSaoPauloDate());
  const [filter, setFilter] = useState<'todos' | 'hoje' | 'proximos'>('todos');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<BookingRecord | null>(null);
  const [serviceDraft, setServiceDraft] = useState<ServiceItem | null>(null);
  const [reportRange, setReportRange] = useState<'today' | 'week' | 'month' | 'quarter' | 'year'>('month');

  const refreshBookings = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/bookings', { cache: 'no-store' });
      const payload = await response.json() as { bookings?: BookingRecord[]; queueBookingIds?: string[]; message?: string };
      if (!response.ok || !payload.bookings || !payload.queueBookingIds) {
        throw new Error(payload.message || 'Não foi possível carregar os agendamentos.');
      }

      setBookings(payload.bookings);
      setQueueBookingIds(payload.queueBookingIds);
      setBookingsError('');
    } catch (error) {
      setBookings([]);
      setQueueBookingIds([]);
      setBookingsError(error instanceof Error ? error.message : 'Não foi possível carregar os agendamentos.');
    }
  }, []);

  useEffect(() => {
    const initialRefresh = window.setTimeout(() => void refreshBookings(), 0);
    const timer = window.setInterval(() => void refreshBookings(), 10000);
    const refreshOnFocus = () => void refreshBookings();
    window.addEventListener('focus', refreshOnFocus);

    return () => {
      window.clearTimeout(initialRefresh);
      window.clearInterval(timer);
      window.removeEventListener('focus', refreshOnFocus);
    };
  }, [refreshBookings]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem(SERVICES_KEY, JSON.stringify(servicesList));
  }, [servicesList]);

  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  const saveBookingChange = async (id: string, method: 'PATCH' | 'DELETE', body?: Partial<BookingRecord>) => {
    setBookingsError('');
    try {
      const response = await fetch(`/api/admin/bookings/${encodeURIComponent(id)}`, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const payload = await response.json().catch(() => ({})) as { message?: string };
      if (!response.ok) {
        throw new Error(payload.message || 'Não foi possível salvar a alteração.');
      }

      await refreshBookings();
      return true;
    } catch (error) {
      setBookingsError(error instanceof Error ? error.message : 'Não foi possível salvar a alteração.');
      return false;
    }
  };

  const handleLogout = async () => {
    const response = await fetch('/api/admin/logout', { method: 'POST' });
    if (!response.ok) {
      setBookingsError('Não foi possível encerrar a sessão administrativa.');
      return;
    }

    const { error } = await getSupabaseBrowserClient().auth.signOut();
    if (error) {
      setBookingsError('A sessão do painel foi encerrada, mas não foi possível encerrar a sessão do Supabase.');
      return;
    }

    router.replace('/admin/login');
    router.refresh();
  };

  const revenue = useMemo(
    () => bookings.reduce((total, booking) => total + booking.price, 0),
    [bookings],
  );

  const todayBookings = useMemo(
    () => bookings.filter((booking) => booking.date === todayKey).length,
    [bookings, todayKey],
  );

  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'pendente' || booking.status === 'confirmado').length,
    [bookings],
  );

  const cancelledBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'cancelado' || booking.status === 'no-show').length,
    [bookings],
  );

  const filteredBookings = useMemo(() => {
    const query = search.trim().toLowerCase();
    return bookings.filter((booking) => {
      if (!queueBookingIds.includes(booking.id)) return false;
      const matchText = !query || booking.customerName.toLowerCase().includes(query) || booking.phone.includes(query) || booking.service.toLowerCase().includes(query);
      if (!matchText) return false;
      if (filter === 'hoje') return booking.date === todayKey;
      if (filter === 'proximos') return booking.date >= todayKey;
      return true;
    });
  }, [bookings, filter, queueBookingIds, search, todayKey]);

  const customerSummary = useMemo(() => {
    const map = new Map<string, { name: string; phone: string; atendimentos: number; totalGasto: number; ultimoAtendimento: string }>();
    bookings.forEach((booking) => {
      const current = map.get(booking.phone) ?? {
        name: booking.customerName,
        phone: booking.phone,
        atendimentos: 0,
        totalGasto: 0,
        ultimoAtendimento: booking.date,
      };
      current.atendimentos += 1;
      current.totalGasto += booking.price;
      current.ultimoAtendimento = booking.date > current.ultimoAtendimento ? booking.date : current.ultimoAtendimento;
      map.set(booking.phone, current);
    });
    return [...map.values()].sort((a, b) => b.totalGasto - a.totalGasto);
  }, [bookings]);

  const serviceUsage = useMemo(() => {
    const counts = new Map<string, number>();
    bookings.forEach((booking) => {
      counts.set(booking.service, (counts.get(booking.service) ?? 0) + 1);
    });
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  }, [bookings]);

  const serviceMix = useMemo(() => {
    const total = bookings.length || 1;
    return serviceUsage.slice(0, 4).map(([label, count], index) => ({
      label,
      count,
      percent: Math.round((count / total) * 100),
      color: ['#b91c1c', '#dc2626', '#7f1d1d', '#f87171'][index % 4],
    }));
  }, [bookings.length, serviceUsage]);

  const chartPoints = useMemo(() => {
    const dayCount = { today: 1, week: 7, month: 30, quarter: 90, year: 365 }[reportRange];
    const today = new Date(`${todayKey}T00:00:00Z`);
    const pointCount = reportRange === 'today' ? 9 : reportRange === 'week' ? 7 : 8;
    const series = Array.from({ length: pointCount }, (_, idx) => {
      if (reportRange === 'today') {
        const hour = 9 + idx;
        const amount = bookings
          .filter((booking) => booking.date === todayKey && Number(booking.time.slice(0, 2)) === hour)
          .reduce((sum, booking) => sum + booking.price, 0);

        return { label: `${String(hour).padStart(2, '0')}h`, value: amount };
      }

      const startDate = new Date(today);
      startDate.setUTCDate(today.getUTCDate() - (dayCount - 1));
      if (reportRange === 'week') {
        const date = new Date(startDate);
        date.setUTCDate(startDate.getUTCDate() + idx);
        const key = date.toISOString().slice(0, 10);
        const amount = bookings
          .filter((booking) => booking.date === key)
          .reduce((sum, booking) => sum + booking.price, 0);

        return {
          label: date.toLocaleDateString('pt-BR', { timeZone: 'UTC', weekday: 'short' }),
          value: amount,
        };
      }

      const bucketStart = new Date(startDate);
      bucketStart.setUTCDate(startDate.getUTCDate() + Math.floor((idx * dayCount) / 8));
      const bucketEnd = new Date(startDate);
      bucketEnd.setUTCDate(startDate.getUTCDate() + Math.floor(((idx + 1) * dayCount) / 8));
      const startKey = bucketStart.toISOString().slice(0, 10);
      const endKey = bucketEnd.toISOString().slice(0, 10);
      const amount = bookings
        .filter((booking) => booking.date >= startKey && booking.date < endKey)
        .reduce((sum, booking) => sum + booking.price, 0);

      return {
        label: bucketStart.toLocaleDateString('pt-BR', { timeZone: 'UTC', day: '2-digit', month: 'short' }),
        value: amount,
      };
    });
    const max = Math.max(...series.map((item) => item.value), 1);
    return series.map((item) => ({
      ...item,
      height: clamp((item.value / max) * 100, 12, 100),
    }));
  }, [bookings, reportRange, todayKey]);

  const revenuePoints = chartPoints
    .map((point, idx) => `${24 + (idx * 266) / (chartPoints.length - 1)},${115 - point.height * 0.88}`)
    .join(' ');

  const financialSummary = useMemo(() => {
    const pix = bookings.filter((booking) => booking.paymentMethod === 'pix').reduce((sum, booking) => sum + booking.price, 0);
    const cartao = bookings.filter((booking) => booking.paymentMethod === 'cartao').reduce((sum, booking) => sum + booking.price, 0);
    const dinheiro = bookings.filter((booking) => booking.paymentMethod === 'dinheiro').reduce((sum, booking) => sum + booking.price, 0);
    const outros = bookings.filter((booking) => booking.paymentMethod === 'outros').reduce((sum, booking) => sum + booking.price, 0);
    return { pix, cartao, dinheiro, outros };
  }, [bookings]);

  const reportData = useMemo(() => {
    const rangeMap = {
      today: () => bookings.filter((booking) => booking.date === todayKey),
      week: () => bookings.filter((booking) => booking.date >= addBookingDays(todayKey, -7)),
      month: () => bookings.filter((booking) => booking.date >= addBookingDays(todayKey, -30)),
      quarter: () => bookings.filter((booking) => booking.date >= addBookingDays(todayKey, -90)),
      year: () => bookings.filter((booking) => booking.date >= addBookingDays(todayKey, -365)),
    };
    const current = rangeMap[reportRange]();
    const total = current.reduce((sum, booking) => sum + booking.price, 0);
    const avg = current.length ? total / current.length : 0;
    const clients = new Set(current.map((booking) => booking.phone)).size;
    return { total, avg, clients, count: current.length };
  }, [bookings, reportRange, todayKey]);

  const openEditor = (booking: BookingRecord) => {
    setEditingId(booking.id);
    setDraft({ ...booking });
  };

  const handleStatusChange = async (id: string) => {
    const booking = bookings.find((item) => item.id === id);
    if (!booking) return;
    const nextStatus: BookingStatus = booking.status === 'pendente'
      ? 'confirmado'
      : booking.status === 'confirmado'
        ? 'concluido'
        : booking.status === 'concluido'
          ? 'pendente'
          : 'confirmado';
    await saveBookingChange(id, 'PATCH', { status: nextStatus });
  };

  const handleDelete = async (id: string) => {
    await saveBookingChange(id, 'DELETE');
  };

  const saveDraft = async () => {
    if (!draft) return;
    const saved = await saveBookingChange(draft.id, 'PATCH', draft);
    if (saved) {
      setEditingId(null);
      setDraft(null);
    }
  };

  const handleDraftChange = <K extends keyof BookingRecord>(field: K, value: BookingRecord[K]) => {
    if (!draft) return;
    setDraft({ ...draft, [field]: value } as BookingRecord);
  };

  const handleAddService = () => {
    const newService: ServiceItem = {
      id: `${Date.now()}`,
      name: 'Novo serviço',
      price: 30,
      duration: 30,
      description: 'Descrição do serviço.',
      active: true,
    };
    setServicesList((current) => [newService, ...current]);
    setServiceDraft(newService);
  };

  const handleSaveService = () => {
    if (!serviceDraft) return;
    setServicesList((current) => current.map((item) => (item.id === serviceDraft.id ? serviceDraft : item)));
    setServiceDraft(null);
  };

  const handleServiceDelete = (id: string) => {
    setServicesList((current) => current.filter((item) => item.id !== id));
  };

  const handleServiceChange = <K extends keyof ServiceItem>(field: K, value: ServiceItem[K]) => {
    if (!serviceDraft) return;
    setServiceDraft({ ...serviceDraft, [field]: value });
  };

  const stats = [
    { label: 'Faturamento hoje', value: currency(bookings.filter((booking) => booking.date === todayKey).reduce((sum, booking) => sum + booking.price, 0)), change: '+12.4%', positive: true, icon: 'R$' },
    { label: 'Agendamentos hoje', value: `${todayBookings}`, change: '+8.1%', positive: true, icon: '•' },
    { label: 'Pendentes', value: `${pendingBookings}`, change: '+3.6%', positive: true, icon: '◎' },
    { label: 'Clientes hoje', value: `${new Set(bookings.filter((booking) => booking.date === todayKey).map((booking) => booking.phone)).size}`, change: '+5.3%', positive: true, icon: '★' },
    { label: 'Cancelamentos', value: `${cancelledBookings}`, change: '-2.1%', positive: false, icon: 'x' },
  ];

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div className="brand-block">
          <div className="brand-mark">GB</div>
          <div>
            <p className="eyebrow">Barbearia</p>
            <h2>{settings.shopName}</h2>
          </div>
        </div>

        <nav className="nav-list" aria-label="Menu administrativo">
          {navItems.map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setActiveTab(item.value)}
              className={`nav-item ${activeTab === item.value ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="mini-profile">
            <div className="avatar">A</div>
            <div>
              <strong>Admin</strong>
              <span>Online</span>
            </div>
          </div>
          <button type="button" className="nav-item danger" onClick={() => void handleLogout()}>
            <span className="nav-icon">↗</span>
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="topbar">
          <div>
            <p className="eyebrow">Painel administrativo</p>
            <h1>
              {activeTab === 'overview' && 'Visão geral'}
              {activeTab === 'bookings' && 'Agendamentos'}
              {activeTab === 'customers' && 'Clientes'}
              {activeTab === 'services' && 'Serviços'}
              {activeTab === 'finance' && 'Financeiro'}
              {activeTab === 'reports' && 'Relatórios'}
              {activeTab === 'settings' && 'Configurações'}
            </h1>
          </div>

          <div className="topbar-actions">
            <div className="notification-wrap">
              <button type="button" className="notification-button" aria-label="Notificações">
                🔔
                <span className="badge">3</span>
              </button>
            </div>
            <button type="button" className="user-pill">
              <span className="avatar small">A</span>
              <span>Admin</span>
            </button>
          </div>
        </header>

        {bookingsError ? (
          <p role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {bookingsError}
          </p>
        ) : null}

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <section className="hero-panel">
              <div>
                <p className="eyebrow soft">Bom dia, Admin</p>
                <h2>Veja o que está acontecendo na sua barbearia hoje.</h2>
              </div>
              <Link href="/agendar" className="primary-button">Novo agendamento</Link>
            </section>

            <section className="stats-grid">
              {stats.map((stat) => (
                <article key={stat.label} className="stat-card">
                  <div className="stat-header">
                    <span>{stat.icon}</span>
                    <span className={`chip ${stat.positive ? 'positive' : 'negative'}`}>{stat.change}</span>
                  </div>
                  <p>{stat.label}</p>
                  <strong>{stat.value}</strong>
                </article>
              ))}
            </section>

            <section className="grid-layout two-col">
              <article className="panel large-panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">Faturamento</p>
                    <h3>Receita por período</h3>
                  </div>
                  <select value={reportRange} onChange={(event) => setReportRange(event.target.value as typeof reportRange)} className="mini-select">
                    {([
                      ['today', 'Hoje'],
                      ['week', '7 dias'],
                      ['month', '30 dias'],
                      ['quarter', '90 dias'],
                      ['year', '1 ano'],
                    ] as const).map(([range, label]) => (
                      <option key={range} value={range}>{label}</option>
                    ))}
                  </select>
                </div>

                <div className="chart-wrap">
                  <svg viewBox="0 0 320 160" preserveAspectRatio="none" className="revenue-chart" role="img" aria-label="Gráfico de faturamento">
                    <defs>
                      <linearGradient id="chartFill" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#dc2626" stopOpacity="0.24" />
                        <stop offset="100%" stopColor="#dc2626" stopOpacity="0.01" />
                      </linearGradient>
                    </defs>
                    {[27, 55, 83, 111].map((y) => (
                      <line key={y} x1="24" y1={y} x2="290" y2={y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
                    ))}
                    <path d={`M 24 126 ${revenuePoints} L 290 126 Z`} fill="url(#chartFill)" />
                    <polyline fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" points={revenuePoints} />
                    {chartPoints.map((point, idx) => (
                      <g key={point.label}>
                        <circle cx={24 + (idx * 266) / (chartPoints.length - 1)} cy={115 - point.height * 0.88} r="3.5" fill="#171717" stroke="#f87171" strokeWidth="2" />
                        <text x={24 + (idx * 266) / (chartPoints.length - 1)} y="151" textAnchor="middle" fill="#a1a1aa" fontSize="9">{point.label.split(' ')[0]}</text>
                      </g>
                    ))}
                  </svg>
                </div>

                <div className="chart-legend">
                  <div><span className="dot primary" /> Faturamento</div>
                  <strong>{currency(reportData.total)}</strong>
                </div>
              </article>

              <article className="panel">
                <div className="panel-header compact">
                  <p className="eyebrow">Serviços</p>
                  <span className="muted-link">Resumo</span>
                </div>
                <div className="donut-wrap">
                  <div className="donut" style={{ background: `conic-gradient(#b91c1c 0 46%, #dc2626 46% 72%, #7f1d1d 72% 90%, #fecaca 90% 100%)` }}>
                    <div className="donut-inner">
                      <strong>{serviceMix[0]?.percent ?? 0}%</strong>
                    </div>
                  </div>
                  <div className="legend-list">
                    {serviceMix.map((item) => (
                      <div key={item.label} className="legend-item">
                        <span className="dot" style={{ background: item.color }} />
                        <span>{item.label}</span>
                        <strong>{item.percent}%</strong>
                      </div>
                    ))}
                  </div>
                </div>
              </article>
            </section>

            <section className="grid-layout two-col">
              <article className="panel">
                <div className="panel-header compact">
                  <p className="eyebrow">Agenda de hoje</p>
                  <button type="button" className="text-link">Ver todos</button>
                </div>

                <div className="agenda-list">
                  {bookings.filter((booking) => booking.date === todayKey).slice(0, 4).map((booking) => (
                    <button key={booking.id} type="button" className="agenda-item" onClick={() => openEditor(booking)}>
                      <div className="time-block">{booking.time}</div>
                      <div className="agenda-copy">
                        <strong>{booking.customerName}</strong>
                        <span>{booking.service}</span>
                        <small>{booking.professional}</small>
                      </div>
                      <div className="agenda-meta">
                        <span>{currency(booking.price)}</span>
                        <em className={statusClass(booking.status)}>{booking.status}</em>
                      </div>
                    </button>
                  ))}
                </div>
              </article>

              <article className="panel">
                <div className="panel-header compact">
                  <p className="eyebrow">Fila de espera</p>
                  <span className="muted-link">3 clientes</span>
                </div>
                <div className="stack-list">
                  {[
                    { name: 'João Silva', service: 'Corte + Barba', time: 'Hoje • 18:00' },
                    { name: 'Pedro Souza', service: 'Corte Clássico', time: 'Hoje • 18:30' },
                    { name: 'Lucas', service: 'Combo Premium', time: 'Amanhã • 14:00' },
                  ].map((wait) => (
                    <div key={wait.name} className="stack-row">
                      <div>
                        <strong>{wait.name}</strong>
                        <span>{wait.service}</span>
                      </div>
                      <div className="stack-meta">
                        <small>{wait.time}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </article>
            </section>
          </div>
        )}

        {activeTab === 'bookings' && (
          <div className="space-y-5">
            <section className="panel toolbar-panel">
              <div className="toolbar-row">
                <div className="segmented-control">
                  {(['todos', 'hoje', 'proximos'] as const).map((option) => (
                    <button key={option} type="button" className={filter === option ? 'active' : ''} onClick={() => setFilter(option)}>
                      {option === 'todos' ? 'Todos' : option === 'hoje' ? 'Hoje' : 'Próximos'}
                    </button>
                  ))}
                </div>
                <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar cliente ou serviço" className="search-input" />
              </div>
            </section>

            {editingId && draft && (
              <section className="panel form-panel">
                <div className="panel-header compact">
                  <p className="eyebrow">Editar agendamento</p>
                  <button type="button" className="text-link" onClick={() => { setEditingId(null); setDraft(null); }}>Fechar</button>
                </div>
                <div className="editor-grid">
                  <label><span>Cliente</span><input value={draft.customerName} onChange={(event) => handleDraftChange('customerName', event.target.value)} /></label>
                  <label><span>Telefone</span><input value={draft.phone} onChange={(event) => handleDraftChange('phone', event.target.value)} /></label>
                  <label><span>Serviço</span><input value={draft.service} onChange={(event) => handleDraftChange('service', event.target.value)} /></label>
                  <label><span>Data</span><input type="date" value={draft.date} onChange={(event) => handleDraftChange('date', event.target.value)} /></label>
                  <label><span>Horário</span><input value={draft.time} onChange={(event) => handleDraftChange('time', event.target.value)} /></label>
                  <label><span>Status</span>
                    <select value={draft.status} onChange={(event) => handleDraftChange('status', event.target.value as BookingStatus)}>
                      <option value="pendente">Pendente</option>
                      <option value="confirmado">Confirmado</option>
                      <option value="concluido">Concluído</option>
                      <option value="cancelado">Cancelado</option>
                      <option value="no-show">No-show</option>
                    </select>
                  </label>
                  <label className="span-2"><span>Profissional</span>
                    <select value={draft.professional} onChange={(event) => handleDraftChange('professional', event.target.value)}>
                      {staffMembers.map((member) => <option key={member} value={member}>{member}</option>)}
                    </select>
                  </label>
                </div>
                <div className="inline-actions">
                  <button type="button" className="ghost-button" onClick={() => { setEditingId(null); setDraft(null); }}>Cancelar</button>
                  <button type="button" className="primary-button" onClick={saveDraft}>Salvar</button>
                </div>
              </section>
            )}

            <section className="panel table-panel">
              <div className="panel-header compact">
                <p className="eyebrow">Fila operacional</p>
                <span className="muted-link">{filteredBookings.length} itens</span>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Cliente</th>
                      <th>Serviço</th>
                      <th>Profissional</th>
                      <th>Data</th>
                      <th>Valor</th>
                      <th>Status</th>
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>
                          <div className="client-cell">
                            <span className="avatar mini">{booking.customerName.charAt(0)}</span>
                            <div>
                              <strong>{booking.customerName}</strong>
                              <small>{booking.phone}</small>
                            </div>
                          </div>
                        </td>
                        <td>{booking.service}</td>
                        <td>{booking.professional}</td>
                        <td>{formatDate(booking.date)}</td>
                        <td>{currency(booking.price)}</td>
                        <td><span className={statusClass(booking.status)}>{booking.status}</span></td>
                        <td>
                          <div className="table-actions">
                            <button type="button" onClick={() => openEditor(booking)} className="tiny-button">Editar</button>
                            <button type="button" onClick={() => handleStatusChange(booking.id)} className="tiny-button">Status</button>
                            <button type="button" onClick={() => handleDelete(booking.id)} className="tiny-button danger">Excluir</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'customers' && (
          <section className="panel table-panel">
            <div className="panel-header compact">
              <p className="eyebrow">Clientes</p>
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Pesquisar cliente" className="search-input small" />
            </div>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th>Telefone</th>
                    <th>Último atendimento</th>
                    <th>Atendimentos</th>
                    <th>Total gasto</th>
                  </tr>
                </thead>
                <tbody>
                  {customerSummary.map((customer) => (
                    <tr key={customer.phone}>
                      <td>{customer.name}</td>
                      <td>{customer.phone}</td>
                      <td>{customer.ultimoAtendimento ? formatDate(customer.ultimoAtendimento) : '-'}</td>
                      <td>{customer.atendimentos}</td>
                      <td>{currency(customer.totalGasto)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'services' && (
          <div className="space-y-5">
            <section className="panel">
              <div className="panel-header compact">
                <p className="eyebrow">Serviços</p>
                <button type="button" className="primary-button" onClick={handleAddService}>Novo serviço</button>
              </div>
              <div className="services-grid">
                {servicesList.map((service) => (
                  <article key={service.id} className="service-card">
                    <div className="service-head">
                      <div>
                        <strong>{service.name}</strong>
                        <span>{service.duration} min</span>
                      </div>
                      <div className="service-actions">
                        <button type="button" className="tiny-button" onClick={() => setServiceDraft(service)}>Editar</button>
                        <button type="button" className="tiny-button danger" onClick={() => handleServiceDelete(service.id)}>Excluir</button>
                      </div>
                    </div>
                    <p>{service.description}</p>
                    <div className="service-foot">
                      <strong>{currency(service.price)}</strong>
                      <span className={service.active ? 'status-sucesso' : 'status-pendente'}>{service.active ? 'Ativo' : 'Inativo'}</span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            {serviceDraft && (
              <section className="panel form-panel">
                <div className="panel-header compact">
                  <p className="eyebrow">Editar serviço</p>
                  <button type="button" className="text-link" onClick={() => setServiceDraft(null)}>Fechar</button>
                </div>
                <div className="editor-grid">
                  <label><span>Nome</span><input value={serviceDraft.name} onChange={(event) => handleServiceChange('name', event.target.value)} /></label>
                  <label><span>Preço</span><input type="number" value={serviceDraft.price} onChange={(event) => handleServiceChange('price', Number(event.target.value))} /></label>
                  <label><span>Duração</span><input type="number" value={serviceDraft.duration} onChange={(event) => handleServiceChange('duration', Number(event.target.value))} /></label>
                  <label><span>Status</span>
                    <select value={String(serviceDraft.active)} onChange={(event) => handleServiceChange('active', event.target.value === 'true')}>
                      <option value="true">Ativo</option>
                      <option value="false">Inativo</option>
                    </select>
                  </label>
                  <label className="span-2"><span>Descrição</span><textarea value={serviceDraft.description} onChange={(event) => handleServiceChange('description', event.target.value)} /></label>
                </div>
                <div className="inline-actions">
                  <button type="button" className="ghost-button" onClick={() => setServiceDraft(null)}>Cancelar</button>
                  <button type="button" className="primary-button" onClick={handleSaveService}>Salvar</button>
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-5">
            <section className="stats-grid compact-grid">
              <article className="stat-card"><p>Receita total</p><strong>{currency(revenue)}</strong></article>
              <article className="stat-card"><p>PIX</p><strong>{currency(financialSummary.pix)}</strong></article>
              <article className="stat-card"><p>Cartão</p><strong>{currency(financialSummary.cartao)}</strong></article>
              <article className="stat-card"><p>Dinheiro</p><strong>{currency(financialSummary.dinheiro)}</strong></article>
            </section>
            <section className="panel table-panel">
              <div className="panel-header compact">
                <p className="eyebrow">Financeiro</p>
                <span className="muted-link">Total de {bookings.length} registros</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Cliente</th><th>Serviço</th><th>Forma</th><th>Data</th><th>Valor</th></tr>
                  </thead>
                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id}><td>{booking.customerName}</td><td>{booking.service}</td><td>{booking.paymentMethod}</td><td>{formatDate(booking.date)}</td><td>{currency(booking.price)}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-5">
            <section className="stats-grid compact-grid">
              <article className="stat-card"><p>Clientes atendidos</p><strong>{reportData.clients}</strong></article>
              <article className="stat-card"><p>Receita</p><strong>{currency(reportData.total)}</strong></article>
              <article className="stat-card"><p>Ticket médio</p><strong>{currency(reportData.avg)}</strong></article>
              <article className="stat-card"><p>Cancelamentos</p><strong>{cancelledBookings}</strong></article>
            </section>
            <section className="panel">
              <div className="panel-header compact">
                <p className="eyebrow">Serviços mais populares</p>
              </div>
              <div className="stack-list">
                {serviceUsage.map(([service, count]) => (
                  <div key={service} className="stack-row">
                    <strong>{service}</strong>
                    <span>{count} agendamentos</span>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === 'settings' && (
          <section className="panel form-panel">
            <div className="panel-header compact">
              <p className="eyebrow">Configurações da barbearia</p>
              <button type="button" className="primary-button" onClick={() => localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))}>Salvar</button>
            </div>
            <div className="editor-grid">
              <label><span>Nome</span><input value={settings.shopName} onChange={(event) => setSettings((current) => ({ ...current, shopName: event.target.value }))} /></label>
              <label><span>Telefone</span><input value={settings.phone} onChange={(event) => setSettings((current) => ({ ...current, phone: event.target.value }))} /></label>
              <label><span>WhatsApp</span><input value={settings.whatsapp} onChange={(event) => setSettings((current) => ({ ...current, whatsapp: event.target.value }))} /></label>
              <label><span>Horário</span><input value={settings.openingHours} onChange={(event) => setSettings((current) => ({ ...current, openingHours: event.target.value }))} /></label>
              <label className="span-2"><span>Endereço</span><input value={settings.address} onChange={(event) => setSettings((current) => ({ ...current, address: event.target.value }))} /></label>
              <label className="span-2"><span>Google Maps</span><input value={settings.mapUrl} onChange={(event) => setSettings((current) => ({ ...current, mapUrl: event.target.value }))} /></label>
              <label className="span-2"><span>Política de cancelamento</span><textarea value={settings.cancellationPolicy} onChange={(event) => setSettings((current) => ({ ...current, cancellationPolicy: event.target.value }))} /></label>
              <label><span>Taxa</span><input type="number" value={settings.cancellationFee} onChange={(event) => setSettings((current) => ({ ...current, cancellationFee: Number(event.target.value) }))} /></label>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
