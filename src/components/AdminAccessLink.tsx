'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AdminAccessLink() {
  const pathname = usePathname();

  if (pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <Link
      href="/admin/login"
      className="fixed bottom-4 left-4 z-50 rounded-full border border-white/15 bg-[#17181b] px-4 py-2.5 text-xs font-medium text-[#d8d3cc] shadow-lg transition hover:border-[#d64a3d] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#d64a3d] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0b0d0f]"
    >
      Painel admin
    </Link>
  );
}
