'use client';

import { useTranslations } from 'next-intl';
import { isOrderStatus, OrderStatusValue } from '@/lib/order-status';

const statusColors: Record<OrderStatusValue, string> = {
  CREATED: 'bg-slate-100 text-slate-700',
  PENDING: 'bg-amber-100 text-amber-800',
  ACCEPTED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-indigo-100 text-indigo-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export function StatusBadge({ status }: { status: string }) {
  const t = useTranslations('orderStatus');
  const key = isOrderStatus(status) ? status : 'CREATED';
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColors[key]}`}
    >
      {isOrderStatus(status) ? t(status) : status}
    </span>
  );
}
