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
      setCount(data.count);
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
    const onUpdate = () => void refresh();
    socket.on('master_chat_message', onUpdate);
    socket.on('chat_unread', onUpdate);

    const interval = setInterval(() => void refresh(), 12000);
    return () => {
      socket.off('master_chat_message', onUpdate);
      socket.off('chat_unread', onUpdate);
      clearInterval(interval);
    };
  }, [enabled, refresh]);

  return { count, refresh };
}
