'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { getSocket } from '@/lib/socket';

type AdminChatUnreadContextValue = {
  total: number;
  refresh: () => Promise<void>;
};

const AdminChatUnreadContext = createContext<AdminChatUnreadContextValue | null>(null);

export function AdminChatUnreadProvider({ children }: { children: ReactNode }) {
  const [total, setTotal] = useState(0);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const data = await api<{ total: number }>('/admin/chat/unread', {}, token);
      setTotal(data.total ?? 0);
    } catch {
      setTotal(0);
    }
  }, []);

  useEffect(() => {
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
  }, [refresh]);

  const value = useMemo(() => ({ total, refresh }), [total, refresh]);

  return <AdminChatUnreadContext.Provider value={value}>{children}</AdminChatUnreadContext.Provider>;
}

export function useAdminChatUnread() {
  const ctx = useContext(AdminChatUnreadContext);
  if (!ctx) {
    throw new Error('useAdminChatUnread must be used within AdminChatUnreadProvider');
  }
  return ctx;
}
