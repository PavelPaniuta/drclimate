'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import clsx from 'clsx';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { MasterChatMessage } from '@/lib/types';
import { getSocket } from '@/lib/socket';
import { appendChatMessage, parseMasterChatPayload } from '@/lib/chat-messages';

type Props = {
  open: boolean;
  onClose: () => void;
  onUnreadChange?: () => void;
};

export function MasterAdminChat({ open, onClose, onUnreadChange }: Props) {
  const t = useTranslations('master');
  const tc = useTranslations('common');
  const [messages, setMessages] = useState<MasterChatMessage[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);

  const loadMessages = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    setLoading(true);
    try {
      const data = await api<MasterChatMessage[]>('/masters/admin-chat', {}, token);
      setMessages(data);
      onUnreadChange?.();
    } finally {
      setLoading(false);
    }
  }, [onUnreadChange]);

  useEffect(() => {
    if (!open) return;
    void loadMessages();

    const token = getToken();
    if (!token) return;

    const socket = getSocket(token);
    const onChat = (payload: MasterChatMessage | { message?: MasterChatMessage }) => {
      const msg = parseMasterChatPayload(payload);
      if (msg) {
        setMessages((prev) => appendChatMessage(prev, msg));
        if (msg.sender.role === 'ADMIN') onUnreadChange?.();
      }
    };
    socket.on('master_chat_message', onChat);
    return () => {
      socket.off('master_chat_message', onChat);
    };
  }, [open, loadMessages, onUnreadChange]);

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
    setMessages((prev) => appendChatMessage(prev, msg));
    setContent('');
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label={tc('cancel')}
        onClick={onClose}
      />
      <div className="relative flex max-h-[85vh] w-full max-w-lg flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <h3 className="font-semibold text-brand-800">{t('adminChat')}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            ✕
          </button>
        </div>
        <div className="flex-1 space-y-2 overflow-y-auto p-4">
          {loading && <p className="text-sm text-slate-500">{tc('loading')}</p>}
          {!loading && messages.length === 0 && <p className="text-sm text-slate-400">—</p>}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={clsx(
                'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                msg.sender.role === 'MASTER' ? 'ml-auto bg-brand-100 text-brand-900' : 'bg-slate-100 text-slate-800',
              )}
            >
              <span className="block text-xs font-medium opacity-70">
                {msg.sender.role === 'ADMIN' ? t('adminLabel') : t('youLabel')}
              </span>
              {msg.content}
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage} className="flex gap-2 border-t border-slate-100 p-4">
          <input
            className="input flex-1"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={t('adminChatPlaceholder')}
            autoFocus
          />
          <button type="submit" className="btn-primary shrink-0">
            {tc('send')}
          </button>
        </form>
      </div>
    </div>
  );
}
