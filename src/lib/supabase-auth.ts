type SupabaseAuthUser = {
  email?: string | null;
  phone?: string | null;
};

export async function getSupabaseAuthUser(accessToken: string): Promise<SupabaseAuthUser | null> {
  const url = process.env.SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();

  if (!url || !anonKey) {
    throw new Error('Configure SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY no ambiente.');
  }

  const response = await fetch(`${url.replace(/\/+$/, '')}/auth/v1/user`, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });

  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error('Não foi possível validar a sessão no Supabase Auth.');

  return response.json() as Promise<SupabaseAuthUser>;
}
