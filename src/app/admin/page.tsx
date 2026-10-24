import { redirect } from 'next/navigation';
import { AdminGuard } from '@/components/AdminGuard';
import { readAdminSession } from '@/lib/admin-auth';

export const instant = false;

export default async function AdminPage() {
  const session = await readAdminSession();

  if (!session) {
    redirect('/admin/login');
  }

  return (
    <main className="mx-auto max-w-7xl px-5 py-8 sm:px-8 lg:px-10 lg:py-12">
      <AdminGuard />
    </main>
  );
}
