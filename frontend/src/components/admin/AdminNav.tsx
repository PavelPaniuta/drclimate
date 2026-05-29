'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import clsx from 'clsx';
import { useAdminChatUnread } from '@/contexts/AdminChatUnreadContext';

export function AdminNav() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const pathname = usePathname();
  const { total: chatUnread } = useAdminChatUnread();

  const links = [
    { href: `/${locale}/admin`, label: t('navOverview'), exact: true },
    { href: `/${locale}/admin/orders/create`, label: t('navCreateOrder') },
    { href: `/${locale}/admin/users`, label: t('navUsers') },
    { href: `/${locale}/admin/cities`, label: t('navCities') },
    { href: `/${locale}/admin/masters`, label: t('navMasters'), badge: chatUnread },
  ];

  return (
    <nav className="mb-6 flex flex-wrap gap-2">
      {links.map((link) => {
        const active = link.exact ? pathname === link.href : pathname.startsWith(link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            className={clsx(
              'relative inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition',
              active
                ? 'bg-brand-600 text-white shadow-sm'
                : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50',
            )}
          >
            {link.label}
            {link.badge != null && link.badge > 0 && (
              <span
                className={clsx(
                  'flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-bold',
                  active ? 'bg-white text-brand-700' : 'bg-red-500 text-white',
                )}
              >
                {link.badge > 99 ? '99+' : link.badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
