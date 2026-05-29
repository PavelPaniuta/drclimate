'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import clsx from 'clsx';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { MasterChatMessage } from '@/lib/types';
import { getSocket } from '@/lib/socket';

export function MasterAdminChat() {
  const t = useTranslations('master');
  const tc = useTranslations('common');
  const [messages, setMessages] = useState<MasterChatMessage[]>([]);
  const [content, setContent] = useState('');
  const [open, setOpen] = useState(false);

  const loadMessages = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const data = await api<MasterChatMessage[]>('/masters/admin-chat', {}, token);
    setMessages(data);
  }, []);

  useEffect(() => {
    if (!open) return;
    void loadMessages();
    const token = getToken();
    if (!token) return;

    const socket = getSocket(token);
    const onChat = (payload: MasterChatMessage | { message?: MasterChatMessage }) => {
      const msg = 'message' in payload && payload.message ? payload.message : (payload as MasterChatMessage);
      if (msg?.id) {
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      }
    };
    socket.on('master_chat_message', onChat);
    return () => {
      socket.off('master_chat_message', onChat);
    };
  }, [open, loadMessages]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    const token = getToken();
    if (!token) return;
    const msg = await api<MasterChatMessage>(
      '/masters/admin-chat',
      { method: 'POST', body: JSON.stringify({ content }) },
      token,
    );
    setMessages((prev) => [...prev, msg]);
    setContent('');
  }

  return (
    <div className="card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between text-left font-semibold"
      >
        {t('adminChat')}
        <span className="text-sm text-brand-600">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="mt-4">
          <div className="mb-3 max-h-48 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-3">
            {messages.length === 0 && <p className="text-sm text-slate-400">—</p>}
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={clsx(
                  'rounded-lg px-3 py-2 text-sm',
                  msg.sender.role === 'MASTER' ? 'ml-4 bg-brand-50' : 'mr-4 bg-white',
                )}
              >
                <span className="text-xs font-medium text-slate-500">
                  {msg.sender.role === 'ADMIN' ? t('adminLabel') : t('youLabel')}
                </span>
                <p>{msg.content}</p>
              </div>
            ))}
          </div>
          <form onSubmit={sendMessage} className="flex gap-2">
            <input
              className="input flex-1"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('adminChatPlaceholder')}
            />
            <button type="submit" className="btn-primary text-sm">
              {tc('send')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
