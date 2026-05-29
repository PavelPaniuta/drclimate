'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { getSocket } from '@/lib/socket';

export type OrderUnreadMap = Record<string, number>;

export function useClientOrderChatUnread(enabled = true) {
  const [total, setTotal] = useState(0);
  const [byOrder, setByOrder] = useState<OrderUnreadMap>({});

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const token = getToken();
    if (!token) return;
    try {
      const data = await api<{ total: number; byOrder: OrderUnreadMap }>(
        '/orders/chat/unread',
        {},
        token,
      );
      setTotal(data.total ?? 0);
      setByOrder(data.byOrder ?? {});
    } catch {
      setTotal(0);
      setByOrder({});
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void refresh();
    const token = getToken();
    if (!token) return;

    const socket = getSocket(token);
    const onUnread = () => void refresh();

    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };

    socket.on('order_chat_unread', onUnread);
    window.addEventListener('focus', onUnread);
    document.addEventListener('visibilitychange', onVisible);

    const interval = setInterval(() => void refresh(), 8000);

    return () => {
      socket.off('order_chat_unread', onUnread);
      window.removeEventListener('focus', onUnread);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, [enabled, refresh]);

  return { total, byOrder, refresh };
}
