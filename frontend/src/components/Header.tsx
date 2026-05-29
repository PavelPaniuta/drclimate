'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { clearAuth, getStoredUser, dashboardPath } from '@/lib/auth';
import { User } from '@/lib/types';

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
  }, [pathname]);

  function handleLogout() {
    clearAuth();
    setUser(null);
    window.location.href = `/${locale}`;
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href={`/${locale}`} className="text-xl font-bold text-brand-700">
          {t('common.appName')}
        </Link>
        <nav className="flex items-center gap-4">
          <LanguageSwitcher />
          {user ? (
            <>
              <Link href={dashboardPath(user.role, locale)} className="text-sm text-slate-600 hover:text-brand-600">
                {user.role === 'MASTER'
                  ? t('nav.masterDashboard')
                  : user.role === 'ADMIN'
                    ? t('nav.adminDashboard')
                    : t('nav.clientDashboard')}
              </Link>
              <button onClick={handleLogout} className="text-sm text-slate-600 hover:text-red-600">
                {t('common.logout')}
              </button>
            </>
          ) : (
            <>
              <Link href={`/${locale}/login`} className="text-sm text-slate-600 hover:text-brand-600">
                {t('common.login')}
              </Link>
              <Link href={`/${locale}/register`} className="btn-primary text-sm">
                {t('common.register')}
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
