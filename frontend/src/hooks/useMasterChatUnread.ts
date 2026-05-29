'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { getSocket } from '@/lib/socket';

export function useMasterChatUnread(enabled = true) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!enabled) return;
    const token = getToken();
    if (!token) return;
    try {
      const data = await api<{ count: number }>('/masters/admin-chat/unread', {}, token);
      setCount(data.count ?? 0);
    } catch {
      setCount(0);
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

    socket.on('chat_unread', onUnread);
    window.addEventListener('focus', onUnread);
    document.addEventListener('visibilitychange', onVisible);

    const interval = setInterval(() => void refresh(), 8000);

    return () => {
      socket.off('chat_unread', onUnread);
      window.removeEventListener('focus', onUnread);
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, [enabled, refresh]);

  return { count, refresh };
}
