'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import clsx from 'clsx';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { getCityName, findCityBySlug, City } from '@/lib/cities';
import { MasterChatMessage, MasterListItem } from '@/lib/types';
import { getSocket } from '@/lib/socket';
import { appendChatMessage, parseMasterChatPayload } from '@/lib/chat-messages';

type Props = {
  cities: City[];
  onUnreadChange?: () => void;
};

export function AdminMastersPanel({ cities, onUnreadChange }: Props) {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const locale = useLocale();
  const [masters, setMasters] = useState<MasterListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MasterChatMessage[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [newIncomingIds, setNewIncomingIds] = useState<Set<string>>(new Set());

  const loadMasters = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const data = await api<MasterListItem[]>('/admin/masters', {}, token);
    setMasters(data);
    onUnreadChange?.();
    setLoading(false);
  }, [onUnreadChange]);

  const loadChat = useCallback(
    async (masterId: string) => {
      const token = getToken();
      if (!token) return;
      const data = await api<MasterChatMessage[]>(`/admin/masters/${masterId}/chat`, {}, token);
      setMessages(data);
      setNewIncomingIds(new Set());
      await loadMasters();
    },
    [loadMasters],
  );

  useEffect(() => {
    void loadMasters();
    const token = getToken();
    if (!token) return;

    const socket = getSocket(token);
    const onChat = (payload: { masterId?: string; message?: MasterChatMessage } | MasterChatMessage) => {
      const eventMasterId = 'masterId' in payload && payload.masterId ? payload.masterId : selectedId;
      const message = parseMasterChatPayload(payload);
      if (!message) {
        void loadMasters();
        return;
      }
      if (message.sender.role === 'MASTER') {
        if (eventMasterId === selectedId) {
          setMessages((prev) => appendChatMessage(prev, message));
          setNewIncomingIds((prev) => new Set(prev).add(message.id));
        }
        void loadMasters();
      }
    };
    const onUnread = () => void loadMasters();
    socket.on('master_chat_message', onChat);
    socket.on('chat_unread', onUnread);
    return () => {
      socket.off('master_chat_message', onChat);
      socket.off('chat_unread', onUnread);
    };
  }, [loadMasters, selectedId]);

  useEffect(() => {
    if (selectedId) void loadChat(selectedId);
    else {
      setMessages([]);
      setNewIncomingIds(new Set());
    }
  }, [selectedId, loadChat]);

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedId || !content.trim()) return;
    const token = getToken();
    if (!token) return;
    const msg = await api<MasterChatMessage>(
      `/admin/masters/${selectedId}/chat`,
      { method: 'POST', body: JSON.stringify({ content }) },
      token,
    );
    setMessages((prev) => appendChatMessage(prev, msg));
    setContent('');
  }

  const selected = masters.find((m) => m.id === selectedId);

  if (loading) return <p className="text-sm text-slate-500">{tc('loading')}</p>;

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card max-h-[520px] overflow-y-auto p-0">
        <div className="border-b border-slate-100 px-4 py-3">
          <h2 className="font-semibold">{t('masters')}</h2>
        </div>
        <ul className="divide-y divide-slate-100">
          {masters.map((m) => {
            const last = m.masterChatThread?.messages[0];
            const unread = m.unreadCount ?? 0;
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(m.id)}
                  className={clsx(
                    'flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-slate-50',
                    selectedId === m.id && 'bg-brand-50',
                    unread > 0 && selectedId !== m.id && 'bg-red-50/60',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className={clsx('font-medium', unread > 0 && 'text-brand-800')}>{m.name || m.email}</span>
                    <div className="flex items-center gap-2">
                      {unread > 0 && (
                        <span className="flex h-5 min-w-5 animate-pulse items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
                          {unread > 99 ? '99+' : unread}
                        </span>
                      )}
                      <span
                        className={clsx(
                          'rounded-full px-2 py-0.5 text-xs',
                          m.masterProfile?.isOnline ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600',
                        )}
                      >
                        {m.masterProfile?.isOnline ? tc('online') : tc('offline')}
                      </span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500">
                    {getCityName(findCityBySlug(cities, m.masterProfile?.serviceArea), m.masterProfile?.serviceArea, locale)}
                  </span>
                  {last && (
                    <span className={clsx('truncate text-xs', unread > 0 ? 'font-semibold text-red-600' : 'text-slate-400')}>
                      {unread > 0 ? `${t('newMessage')}: ` : ''}
                      {last.content}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="card flex min-h-[360px] flex-col">
        {!selected ? (
          <p className="m-auto text-sm text-slate-400">{t('selectMasterChat')}</p>
        ) : (
          <>
            <div className="border-b border-slate-100 pb-3">
              <h3 className="font-semibold">{selected.name || selected.email}</h3>
              <p className="text-xs text-slate-500">{selected.phone || selected.email}</p>
            </div>
            <div className="my-3 flex-1 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-3">
              {messages.length === 0 && <p className="text-sm text-slate-400">—</p>}
              {messages.map((msg) => {
                const isNew = newIncomingIds.has(msg.id);
                const fromMaster = msg.sender.role === 'MASTER';
                return (
                  <div
                    key={msg.id}
                    className={clsx(
                      'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                      fromMaster ? 'bg-white text-slate-800' : 'ml-auto bg-brand-100 text-brand-900',
                      isNew && fromMaster && 'ring-2 ring-red-400 ring-offset-1',
                    )}
                  >
                    <div className="mb-0.5 flex items-center gap-2">
                      <span className="text-xs font-medium opacity-70">{msg.sender.name || msg.sender.role}</span>
                      {isNew && fromMaster && (
                        <span className="rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold uppercase text-white">
                          {t('newMessage')}
                        </span>
                      )}
                    </div>
                    {msg.content}
                  </div>
                );
              })}
            </div>
            <form onSubmit={sendMessage} className="flex gap-2">
              <input
                className="input flex-1"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t('chatPlaceholder')}
              />
              <button type="submit" className="btn-primary">
                {tc('send')}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
