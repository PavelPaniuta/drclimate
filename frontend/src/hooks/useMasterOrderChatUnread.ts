'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getToken, getStoredUser } from '@/lib/auth';
import { getSocket } from '@/lib/socket';
import { Message } from '@/lib/types';
import type { OrderUnreadMap } from '@/hooks/useClientOrderChatUnread';

export function useMasterOrderChatUnread(enabled = true, openOrderId: string | null = null) {
  const [total, setTotal] = useState(0);
  const [byOrder, setByOrder] = useState<OrderUnreadMap>({});

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const token = getToken();
    if (!token) return;
    try {
      const data = await api<{ total: number; byOrder: OrderUnreadMap }>(
        '/masters/orders/chat/unread',
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

    const user = getStoredUser();
    const socket = getSocket(token);

    const onMessage = (msg: Message) => {
      if (!msg?.id) return;
      if (msg.sender?.id !== user?.id) {
        setTotal((n) => n + 1);
      }
      void refresh();
    };

    const onUnreadEvent = () => void refresh();

    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };

    socket.on('new_message', onMessage);
    socket.on('order_chat_unread', onUnreadEvent);
    window.addEventListener('focus', onUnreadEvent);
    document.addEventListener('visibilitychange', onVisible);

    const interval = setInterval(() => void refresh(), 8000);

    return () => {
      socket.off('new_message', onMessage);
      socket.off('order_chat_unread', onUnreadEvent);
      window.removeEventListener('focus', onUnreadEvent);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, [enabled, openOrderId, refresh]);

  return { total, byOrder, refresh };
}
