'use client';

import { useTranslations } from 'next-intl';
import clsx from 'clsx';
import { MasterTab } from '@/lib/master-types';
import { Order } from '@/lib/types';
import { MasterOrderCard } from './MasterOrderCard';

export type MasterTabItem = {
  id: MasterTab;
  icon: string;
  title: string;
  description: string;
  count: number;
  newCount: number;
};

type Props = {
  tabs: MasterTabItem[];
  activeTab: MasterTab;
  onTabChange: (tab: MasterTab) => void;
  orders: Order[];
  selectedDate: string | null;
  isNewIncoming: (id: string) => boolean;
  orderChatByOrder: Record<string, number>;
  onOpenOrder: (id: string) => void;
  onAcceptOrder?: (id: string) => void;
};

export function MasterOrdersSection({
  tabs,
  activeTab,
  onTabChange,
  orders,
  selectedDate,
  isNewIncoming,
  orderChatByOrder,
  onOpenOrder,
  onAcceptOrder,
}: Props) {
  const t = useTranslations('master');
  const activeMeta = tabs.find((x) => x.id === activeTab);

  return (
    <section className="mb-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-slate-900 sm:text-xl">{t('ordersSectionTitle')}</h2>
        <p className="text-sm text-slate-500">{t('ordersSectionSubtitle')}</p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
        {tabs.map((item) => {
          const active = activeTab === item.id;
          const hasNew = item.newCount > 0;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onTabChange(item.id)}
              className={clsx(
                'relative flex min-h-[88px] flex-col items-start rounded-xl border-2 p-3 text-left transition shadow-sm',
                active && !hasNew && 'border-brand-500 bg-brand-50 ring-1 ring-brand-200',
                active && hasNew && 'border-amber-500 bg-amber-50 ring-1 ring-amber-200',
                !active && hasNew && 'animate-pulse border-amber-400 bg-amber-50/90 hover:bg-amber-100',
                !active && !hasNew && 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
              )}
            >
              <span className="mb-1 text-xl leading-none" aria-hidden>
                {item.icon}
              </span>
              <span className={clsx('text-sm font-bold leading-tight', active ? 'text-brand-900' : 'text-slate-800')}>
                {item.title}
              </span>
              <span className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-slate-500">{item.description}</span>
              {(hasNew || item.count > 0) && (
                <span
                  className={clsx(
                    'absolute right-2 top-2 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold',
                    hasNew ? 'bg-red-500 text-white' : 'bg-slate-200 text-slate-700',
                  )}
                >
                  {hasNew ? (item.newCount > 99 ? '99+' : item.newCount) : item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {activeMeta && (
        <div className="mb-3 rounded-lg bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
          <span className="font-medium text-slate-800">{activeMeta.title}</span>
          {' — '}
          {activeMeta.description}
          {activeTab === 'today' && selectedDate && (
            <span className="ml-1 text-brand-700">
              ({new Date(selectedDate + 'T12:00:00').toLocaleDateString()})
            </span>
          )}
        </div>
      )}

      <div className="space-y-3">
        {orders.length === 0 && (
          <div className="card py-14 text-center">
            <p className="text-4xl mb-2" aria-hidden>
              📭
            </p>
            <p className="font-medium text-slate-600">{t('noOrdersInTab')}</p>
            {activeTab === 'incoming' && (
              <p className="mt-1 text-sm text-slate-400">{t('incomingEmptyHint')}</p>
            )}
          </div>
        )}
        {orders.map((order) => (
          <MasterOrderCard
            key={order.id}
            order={order}
            isNewOrder={activeTab === 'incoming' && isNewIncoming(order.id)}
            unreadCount={orderChatByOrder[order.id] ?? 0}
            onOpen={() => onOpenOrder(order.id)}
            onAccept={activeTab === 'incoming' && onAcceptOrder ? () => onAcceptOrder(order.id) : undefined}
          />
        ))}
      </div>
    </section>
  );
}
