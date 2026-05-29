'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { getToken, getStoredUser } from '@/lib/auth';
import { getSocket } from '@/lib/socket';
import { Order } from '@/lib/types';
import { ClientOrderCard } from '@/components/client/ClientOrderCard';
import { ChatLauncherButton } from '@/components/chat/ChatLauncherButton';
import { useClientOrderChatUnread } from '@/hooks/useClientOrderChatUnread';

export default function ClientDashboard() {
  const t = useTranslations('client');
  const ts = useTranslations('serviceType');
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { total: chatUnread, byOrder, refresh: refreshChatUnread } = useClientOrderChatUnread(true);

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
      void refreshChatUnread();
    });
    socket.on('order_chat_unread', () => void refreshChatUnread());

    return () => {
      socket.off('order_update');
      socket.off('order_accepted');
      socket.off('order_chat_unread');
    };
  }, [router, refreshChatUnread]);

  if (loading) return <div className="p-8 text-center">...</div>;

  const firstUnreadOrderId = Object.entries(byOrder).find(([, n]) => n > 0)?.[0];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{t('title')}</h1>
          <p className="mt-1 text-slate-500">{t('viewOnlyHint')}</p>
        </div>
        {chatUnread > 0 && (
          <ChatLauncherButton
            label={t('orderChats')}
            count={chatUnread}
            onClick={() => {
              const el = document.getElementById(`order-${firstUnreadOrderId}`);
              el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }}
          />
        )}
      </div>

      {chatUnread > 0 && (
        <div className="mb-6 flex items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
          <span>{t('chatUnreadBanner', { count: chatUnread })}</span>
          <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full bg-red-500 px-2 text-xs font-bold text-white">
            {chatUnread > 99 ? '99+' : chatUnread}
          </span>
        </div>
      )}

      <h2 className="mb-4 text-lg font-semibold">{t('myRequests')}</h2>
      <div className="space-y-4">
        {orders.length === 0 && <p className="text-slate-500">{t('noOrders')}</p>}
        {orders.map((order) => (
          <div key={order.id} id={`order-${order.id}`}>
            <ClientOrderCard
              order={order}
              serviceTypeLabel={ts(order.serviceType as 'AC_REPAIR')}
              unreadCount={byOrder[order.id] ?? 0}
              onUnreadChange={refreshChatUnread}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
