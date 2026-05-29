'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import clsx from 'clsx';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { getSocket } from '@/lib/socket';
import { Message } from '@/lib/types';
import { appendOrderMessage } from '@/lib/order-chat-messages';
import { isOwnChatMessage } from '@/lib/chat-own-message';

type Props = {
  orderId: string;
  onUnreadChange?: () => void;
};

export function OrderChat({ orderId, onUnreadChange }: Props) {
  const t = useTranslations('client');
  const tc = useTranslations('common');
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [newIncomingIds, setNewIncomingIds] = useState<Set<string>>(new Set());
  const onUnreadRef = useRef(onUnreadChange);
  onUnreadRef.current = onUnreadChange;

  const loadMessages = useCallback(async (showSpinner = false) => {
    const token = getToken();
    if (!token) return;
    if (showSpinner) setLoading(true);
    try {
      const data = await api<Message[]>(`/orders/${orderId}/messages`, {}, token);
      setMessages(data);
      setNewIncomingIds(new Set());
      onUnreadRef.current?.();
    } finally {
      if (showSpinner) setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    void loadMessages(true);
  }, [orderId, loadMessages]);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    const socket = getSocket(token);
    socket.emit('join_order', { orderId });

    const onMessage = (msg: Message) => {
      if (!msg?.id) return;
      setMessages((prev) => appendOrderMessage(prev, msg));
      if (!isOwnChatMessage(msg.sender?.id)) {
        setNewIncomingIds((prev) => new Set(prev).add(msg.id));
        onUnreadRef.current?.();
      }
    };

    socket.on('new_message', onMessage);
    return () => {
      socket.off('new_message', onMessage);
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
    setMessages((prev) => appendOrderMessage(prev, msg));
    setContent('');
    onUnreadRef.current?.();
  }

  if (loading) return <p className="text-sm text-slate-500">{t('chat')}...</p>;

  return (
    <div className="mt-4 border-t border-slate-100 pt-4">
      <h4 className="mb-2 font-medium">{t('chat')}</h4>
      <div className="mb-3 max-h-48 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-3">
        {messages.length === 0 && <p className="text-sm text-slate-400">—</p>}
        {messages.map((m) => {
          const isOwn = isOwnChatMessage(m.sender.id);
          const isNew = newIncomingIds.has(m.id);
          return (
            <div
              key={m.id}
              className={clsx(
                'rounded-lg px-2 py-1.5 text-sm',
                isOwn ? 'ml-4 bg-brand-50 text-brand-900' : 'mr-4 bg-white text-slate-800',
                isNew && !isOwn && 'ring-2 ring-red-400 ring-offset-1',
              )}
            >
              <div className="mb-0.5 flex items-center gap-2">
                <span className="text-xs font-medium text-slate-500">
                  {m.sender.name || m.sender.role}
                </span>
                {isNew && !isOwn && (
                  <span className="rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                    {t('newMessage')}
                  </span>
                )}
              </div>
              {m.content}
            </div>
          );
        })}
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
