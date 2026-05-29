'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { getSocket } from '@/lib/socket';
import { Message } from '@/lib/types';

export function OrderChat({ orderId }: { orderId: string }) {
  const t = useTranslations('client');
  const tc = useTranslations('common');
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    api<Message[]>(`/orders/${orderId}/messages`, {}, token)
      .then(setMessages)
      .finally(() => setLoading(false));

    const socket = getSocket(token);
    socket.emit('join_order', { orderId });
    socket.on('new_message', (msg: Message) => {
      if (msg) setMessages((prev) => [...prev, msg]);
    });

    return () => {
      socket.off('new_message');
    };
  }, [orderId]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token || !content.trim()) return;

    const msg = await api<Message>(
      `/orders/${orderId}/messages`,
      { method: 'POST', body: JSON.stringify({ content }) },
      token,
    );
    setMessages((prev) => [...prev, msg]);
    setContent('');
  }

  if (loading) return <p className="text-sm text-slate-500">{t('chat')}...</p>;

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <h4 className="mb-2 font-medium">{t('chat')}</h4>
      <div className="mb-3 max-h-48 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-3">
        {messages.length === 0 && <p className="text-sm text-slate-400">—</p>}
        {messages.map((m) => (
          <div key={m.id} className="text-sm">
            <span className="font-medium text-brand-700">{m.sender.name || m.sender.role}: </span>
            {m.content}
          </div>
        ))}
      </div>
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          className="input flex-1"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t('messagePlaceholder')}
        />
        <button type="submit" className="btn-primary">
          {tc('send')}
        </button>
      </form>
    </div>
  );
}
