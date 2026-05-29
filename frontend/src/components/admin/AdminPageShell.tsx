'use client';

import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { AdminNav } from './AdminNav';
import { AdminChatHeaderButton } from './AdminChatHeaderButton';
import { useAdminChatUnread } from '@/contexts/AdminChatUnreadContext';

type Props = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: '2xl' | '4xl' | '6xl';
  showUnreadBanner?: boolean;
};

export function AdminPageShell({
  title,
  subtitle,
  children,
  maxWidth = '6xl',
  showUnreadBanner = true,
}: Props) {
  const t = useTranslations('admin');
  const locale = useLocale();
  const { total } = useAdminChatUnread();
  const widthClass =
    maxWidth === '2xl' ? 'max-w-2xl' : maxWidth === '4xl' ? 'max-w-4xl' : 'max-w-6xl';

  return (
    <div className={`mx-auto ${widthClass} px-4 py-6 sm:py-8`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
        </div>
        <AdminChatHeaderButton />
      </div>

      {showUnreadBanner && total > 0 && (
        <Link
          href={`/${locale}/admin/masters`}
          className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 transition hover:bg-red-100"
        >
          <span>{t('chatUnreadBanner', { count: total })}</span>
          <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
            {total > 99 ? '99+' : total}
          </span>
        </Link>
      )}

      <AdminNav />
      {children}
    </div>
  );
}
