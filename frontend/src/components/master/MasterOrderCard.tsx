'use client';

import { useLocale, useTranslations } from 'next-intl';
import clsx from 'clsx';
import { Order } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { CityLabel } from '@/components/CitySelect';
import { canMasterSeeClientContacts } from '@/lib/order-privacy';

interface Props {
  order: Order;
  onOpen: () => void;
  onAccept?: () => void;
  unreadCount?: number;
  isNewOrder?: boolean;
}

function formatDateTime(iso: string | undefined, locale: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleString(locale, {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MasterOrderCard({ order, onOpen, onAccept, unreadCount = 0, isNewOrder = false }: Props) {
  const t = useTranslations('master');
  const ts = useTranslations('serviceType');
  const tc = useTranslations('common');
  const locale = useLocale();
  const when = formatDateTime(order.scheduledAt || order.preferredTime, locale);
  const profit = order.settlement?.netProfit;

  return (
    <div
      className={clsx(
        'card cursor-pointer border-l-4 transition hover:shadow-md',
        isNewOrder && 'animate-pulse border-l-amber-500 bg-amber-50/80 ring-2 ring-amber-300',
        !isNewOrder && unreadCount > 0 && 'border-l-red-500 ring-2 ring-red-100',
        !isNewOrder && unreadCount === 0 && 'border-l-brand-500',
      )}
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      role="button"
      tabIndex={0}
    >
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <p className="font-semibold text-slate-900">{ts(order.serviceType as 'AC_REPAIR')}</p>
            {isNewOrder && (
              <span className="rounded-full bg-amber-500 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                {t('newOrderBadge')}
              </span>
            )}
          </div>
          {when && <p className="text-sm text-brand-700">📅 {when}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {unreadCount > 0 && (
            <span
              className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white"
              title={t('newMessage')}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
          <StatusBadge status={order.status} />
        </div>
      </div>

      <p className={clsx('text-sm line-clamp-2', isNewOrder ? 'font-medium text-slate-800' : 'text-slate-600')}>
        {order.description}
      </p>
      <p className="mt-1 text-sm text-slate-500">
        📍 {order.address}, <CityLabel slug={order.city} />
      </p>
      {profit != null && order.status === 'COMPLETED' && (
        <p className="mt-1 text-sm font-medium text-green-700">💰 {profit} ₴</p>
      )}
      {canMasterSeeClientContacts(order) && order.client && (
        <p className="mt-1 text-sm text-slate-500">
          👤 {order.client.name || order.client.email}
        </p>
      )}

      <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onOpen} className="btn-secondary text-sm">
          {t('openOrder')}
        </button>
        {onAccept && (
          <button type="button" onClick={onAccept} className="btn-primary text-sm">
            {tc('accept')}
          </button>
        )}
      </div>
    </div>
  );
}
