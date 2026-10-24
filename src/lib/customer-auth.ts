import { normalizeBrazilianPhone } from '@/lib/phone';
import { getSupabaseAuthUser } from '@/lib/supabase-auth';

export async function getAuthenticatedCustomerPhone(request: Request) {
  const accessToken = request.headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1];
  if (!accessToken) return null;
  const user = await getSupabaseAuthUser(accessToken);
  return user?.phone ? normalizeBrazilianPhone(user.phone) || null : null;
}
