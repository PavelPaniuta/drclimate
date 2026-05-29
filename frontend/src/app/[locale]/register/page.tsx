'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { authHomePath, dashboardPath, getStoredUser } from '@/lib/auth';

/** Legacy URL — always use the home auth screen. */
export default function RegisterPage() {
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    const user = getStoredUser();
    router.replace(user ? dashboardPath(user.role, locale) : authHomePath(locale));
  }, [router, locale]);

  return <div className="p-8 text-center text-slate-400">...</div>;
}
