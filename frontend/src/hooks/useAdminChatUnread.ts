'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { getSocket } from '@/lib/socket';

export function useAdminChatUnread() {
  const [total, setTotal] = useState(0);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const data = await api<{ total: number }>('/admin/chat/unread', {}, token);
      setTotal(data.total);
    } catch {
      setTotal(0);
    }
  }, []);

  useEffect(() => {
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
  }, [refresh]);

  return { total, refresh };
}
