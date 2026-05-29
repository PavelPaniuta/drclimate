'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from 'next/navigation';
import clsx from 'clsx';
import { useAdminChatUnread } from '@/contexts/AdminChatUnreadContext';

export function AdminChatHeaderButton() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const pathname = usePathname();
  const { total } = useAdminChatUnread();
  const href = `/${locale}/admin/masters`;
  const active = pathname.startsWith(href);

  return (
    <Link
      href={href}
      className={clsx(
        'relative inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold shadow-md transition',
        active
          ? 'bg-brand-600 text-white ring-2 ring-brand-200'
          : 'border-2 border-brand-300 bg-white text-brand-800 hover:bg-brand-50',
        total > 0 && !active && 'animate-pulse border-red-400 bg-red-50 text-red-800',
      )}
      aria-label={t('openMastersChat')}
    >
      <span className="text-lg leading-none" aria-hidden>
        💬
      </span>
      <span>{t('openMastersChat')}</span>
      {total > 0 && (
        <span
          className={clsx(
            'flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold',
            active ? 'bg-white text-red-600' : 'bg-red-500 text-white',
          )}
        >
          {total > 99 ? '99+' : total}
        </span>
      )}
    </Link>
  );
}
