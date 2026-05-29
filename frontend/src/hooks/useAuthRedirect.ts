'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLocale } from 'next-intl';
import { authHomePath, dashboardPath, getStoredUser, getToken } from '@/lib/auth';
import { Role } from '@/lib/types';

/** Logged-in users leave the public home / login / register pages. */
export function useRedirectIfAuthenticated() {
  const router = useRouter();
  const locale = useLocale();

  useEffect(() => {
    const user = getStoredUser();
    if (user) {
      router.replace(dashboardPath(user.role, locale));
    }
  }, [router, locale]);
}

/** Guests are sent to the home auth screen; wrong role too. */
export function useRequireAuth(role?: Role): boolean {
  const router = useRouter();
  const locale = useLocale();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const user = getStoredUser();
    const token = getToken();
    if (!user || !token || (role && user.role !== role)) {
      setAuthorized(false);
      router.replace(authHomePath(locale));
      return;
    }
    setAuthorized(true);
  }, [router, locale, role]);

  return authorized;
}
