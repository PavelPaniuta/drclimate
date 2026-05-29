'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken, getStoredUser } from '@/lib/auth';
import { getSocket } from '@/lib/socket';
import { Order } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { OrderChat } from '@/components/OrderChat';

export default function ClientDashboard() {
  const t = useTranslations('client');
  const ts = useTranslations('serviceType');
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getStoredUser();
    const token = getToken();
    if (!user || user.role !== 'CLIENT' || !token) {
      router.push('/uk/login');
      return;
    }

    api<Order[]>('/orders/my', {}, token)
      .then(setOrders)
      .finally(() => setLoading(false));

    const socket = getSocket(token);
    socket.on('order_update', (order: Order) => {
      setOrders((prev) => {
        const idx = prev.findIndex((o) => o.id === order.id);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = order;
          return next;
        }
        return [order, ...prev];
      });
    });
    socket.on('order_accepted', (order: Order) => {
      setOrders((prev) => prev.map((o) => (o.id === order.id ? order : o)));
    });

    return () => {
      socket.off('order_update');
      socket.off('order_accepted');
    };
  }, [router]);

  if (loading) return <div className="p-8 text-center">...</div>;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="mb-2 text-2xl font-bold">{t('title')}</h1>
      <p className="mb-8 text-slate-500">{t('viewOnlyHint')}</p>

      <h2 className="mb-4 text-lg font-semibold">{t('myRequests')}</h2>
      <div className="space-y-4">
        {orders.length === 0 && <p className="text-slate-500">{t('noOrders')}</p>}
        {orders.map((order) => (
          <div key={order.id} className="card">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium">{ts(order.serviceType as 'AC_REPAIR')}</span>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-sm text-slate-600">{order.description}</p>
            <p className="mt-1 text-sm text-slate-500">{order.address}, {order.city}</p>
            <p className="mt-2 text-sm">
              {t('assignedMaster')}: {order.master?.name || t('noMaster')}
            </p>
            {order.master && <OrderChat orderId={order.id} />}
          </div>
        ))}
      </div>
    </div>
  );
}
