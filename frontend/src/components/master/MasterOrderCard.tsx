'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Order } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';

interface Props {
  order: Order;
  onOpen: () => void;
  onAccept?: () => void;
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

export function MasterOrderCard({ order, onOpen, onAccept }: Props) {
  const t = useTranslations('master');
  const ts = useTranslations('serviceType');
  const tc = useTranslations('common');
  const locale = useLocale();
  const when = formatDateTime(order.scheduledAt || order.preferredTime, locale);
  const profit = order.settlement?.netProfit;

  return (
    <div
      className="card cursor-pointer border-l-4 border-l-brand-500 transition hover:shadow-md"
      onClick={onOpen}
      onKeyDown={(e) => e.key === 'Enter' && onOpen()}
      role="button"
      tabIndex={0}
    >
      <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-slate-900">{ts(order.serviceType as 'AC_REPAIR')}</p>
          {when && <p className="text-sm text-brand-700">📅 {when}</p>}
        </div>
        <StatusBadge status={order.status} />
      </div>

      <p className="text-sm text-slate-600 line-clamp-2">{order.description}</p>
      <p className="mt-1 text-sm text-slate-500">📍 {order.address}, {order.city}</p>
      {profit != null && order.status === 'COMPLETED' && (
        <p className="mt-1 text-sm font-medium text-green-700">💰 {profit} ₴</p>
      )}
      {order.client && (
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
