'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import clsx from 'clsx';
import { Order } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { OrderChat } from '@/components/OrderChat';

type Props = {
  order: Order;
  serviceTypeLabel: string;
  unreadCount?: number;
  onUnreadChange?: () => void;
};

export function ClientOrderCard({ order, serviceTypeLabel, unreadCount = 0, onUnreadChange }: Props) {
  const t = useTranslations('client');
  const [chatOpen, setChatOpen] = useState(false);

  return (
    <div
      className={clsx(
        'card',
        unreadCount > 0 && !chatOpen && 'ring-2 ring-red-200',
      )}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-medium">{serviceTypeLabel}</span>
        <StatusBadge status={order.status} />
      </div>
      <p className="text-sm text-slate-600">{order.description}</p>
      <p className="mt-1 text-sm text-slate-500">
        {order.address}, {order.city}
      </p>
      <p className="mt-2 text-sm">
        {t('assignedMaster')}: {order.master?.name || t('noMaster')}
      </p>

      {order.master && (
        <>
          <button
            type="button"
            onClick={() => setChatOpen((v) => !v)}
            className={clsx(
              'mt-4 inline-flex w-full items-center justify-between gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition',
              chatOpen
                ? 'border-brand-300 bg-brand-50 text-brand-800'
                : unreadCount > 0
                  ? 'border-red-300 bg-red-50 text-red-800 animate-pulse'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100',
            )}
          >
            <span className="inline-flex items-center gap-2">
              <span aria-hidden>💬</span>
              {t('chat')}
            </span>
            {unreadCount > 0 && !chatOpen && (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>
          {chatOpen && (
            <OrderChat orderId={order.id} onUnreadChange={onUnreadChange} />
          )}
        </>
      )}
    </div>
  );
}
