'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AdminDashboard } from '@/components/AdminDashboard';

export function AdminGuard() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    let active = true;

    void fetch('/api/admin/session', { cache: 'no-store' })
      .then(async (response) => {
        const payload = (await response.json()) as { ok?: boolean };
        if (!active) return;

        if (!response.ok || !payload.ok) {
          router.replace('/admin/login');
          return;
        }

        setAuthorized(true);
        setReady(true);
      })
      .catch(() => {
        if (!active) return;
        router.replace('/admin/login');
      });

    return () => {
      active = false;
    };
  }, [router]);

  if (!ready) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm uppercase tracking-[0.2em] text-zinc-400">
        Verificando acesso...
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return <AdminDashboard />;
}
