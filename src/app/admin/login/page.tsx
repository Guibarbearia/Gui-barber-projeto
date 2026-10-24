'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSupabaseBrowserClient } from '@/lib/supabase-browser';

export default function AdminLoginPage() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setBusy(true);

    try {
      const { data, error: authError } = await getSupabaseBrowserClient().auth.signInWithPassword({
        email: identifier.trim().toLowerCase(),
        password,
      });

      if (authError || !data.session) {
        setError(authError?.message || 'Não foi possível iniciar uma sessão segura.');
        setBusy(false);
        return;
      }

      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          identifier,
          accessToken: data.session.access_token,
        }),
      });

      const payload = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok || !payload.ok) {
        setError(payload.message || 'Credenciais inválidas ou configuração ainda pendente.');
        await getSupabaseBrowserClient().auth.signOut();
        setBusy(false);
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch {
      setError('Não foi possível entrar no painel agora. Tente novamente.');
      setBusy(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#111214] p-4 text-white">
      <div className="w-full max-w-md rounded-[30px] border border-white/10 bg-[#17181b] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.28em] text-[#ffb0a5]">Área restrita</p>
            <h1 className="mt-3 text-3xl font-black">Admin</h1>
          </div>
          <Link href="/" className="text-sm text-zinc-300 transition hover:text-white">Home</Link>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <label className="block">
            <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-zinc-400">E-mail administrativo</span>
            <input
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#101011] px-4 py-3 text-white outline-none focus:border-[#c6372d]"
              type="email"
              placeholder="seu@email.com"
              autoComplete="username"
              required
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-[10px] uppercase tracking-[0.22em] text-zinc-400">Senha</span>
            <input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-[#101011] px-4 py-3 text-white outline-none focus:border-[#c6372d]"
              type="password"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </label>

          {error ? <p className="text-sm text-[#ffb0a5]">{error}</p> : null}

          <button
            type="submit"
            disabled={busy}
            className="primary-button inline-flex w-full items-center justify-center rounded-full px-5 py-3.5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-70"
          >
            {busy ? 'Entrando...' : 'Entrar no painel'}
          </button>
        </form>
      </div>
    </main>
  );
}
