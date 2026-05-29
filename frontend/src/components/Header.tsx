'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { LanguageSwitcher } from './LanguageSwitcher';
import { clearAuth, getStoredUser, dashboardPath } from '@/lib/auth';
import { User } from '@/lib/types';

function isHomePath(pathname: string, locale: string) {
  return pathname === `/${locale}` || pathname === `/${locale}/`;
}

export function Header() {
  const t = useTranslations();
  const locale = useLocale();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);
  const onHome = isHomePath(pathname, locale);

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
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 sm:py-4">
        <Link href={`/${locale}`} className="text-lg font-bold text-brand-700 sm:text-xl">
          {t('common.appName')}
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-2 sm:gap-4">
          <LanguageSwitcher />
          {user ? (
            <>
              <Link
                href={dashboardPath(user.role, locale)}
                className="text-xs text-slate-600 hover:text-brand-600 sm:text-sm"
              >
                {user.role === 'MASTER'
                  ? t('nav.masterDashboard')
                  : user.role === 'ADMIN'
                    ? t('nav.adminDashboard')
                    : t('nav.clientDashboard')}
              </Link>
              <button
                onClick={handleLogout}
                className="text-xs text-slate-600 hover:text-red-600 sm:text-sm"
              >
                {t('common.logout')}
              </button>
            </>
          ) : (
            !onHome && (
              <>
                <Link
                  href={`/${locale}/login`}
                  className="text-xs text-slate-600 hover:text-brand-600 sm:text-sm"
                >
                  {t('common.login')}
                </Link>
                <Link href={`/${locale}/register`} className="btn-primary text-xs sm:text-sm">
                  {t('common.register')}
                </Link>
              </>
            )
          )}
        </nav>
      </div>
    </header>
  );
}
