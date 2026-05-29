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
};

export function AdminMastersPanel({ cities }: Props) {
  const t = useTranslations('admin');
  const tc = useTranslations('common');
  const locale = useLocale();
  const [masters, setMasters] = useState<MasterListItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MasterChatMessage[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  const loadMasters = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const data = await api<MasterListItem[]>('/admin/masters', {}, token);
    setMasters(data);
    setLoading(false);
  }, []);

  const loadChat = useCallback(async (masterId: string) => {
    const token = getToken();
    if (!token) return;
    const data = await api<MasterChatMessage[]>(`/admin/masters/${masterId}/chat`, {}, token);
    setMessages(data);
  }, []);

  useEffect(() => {
    void loadMasters();
    const token = getToken();
    if (!token) return;

    const socket = getSocket(token);
    const onChat = (payload: { masterId?: string; message?: MasterChatMessage } | MasterChatMessage) => {
      const masterId = 'masterId' in payload && payload.masterId ? payload.masterId : selectedId;
      const message = parseMasterChatPayload(payload);
      if (masterId === selectedId && message) {
        setMessages((prev) => appendChatMessage(prev, message));
      }
      void loadMasters();
    };
    socket.on('master_chat_message', onChat);
    return () => {
      socket.off('master_chat_message', onChat);
    };
  }, [loadMasters, selectedId]);

  useEffect(() => {
    if (selectedId) void loadChat(selectedId);
    else setMessages([]);
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
          <p className="text-xs text-slate-500">{t('mastersHint')}</p>
        </div>
        <ul className="divide-y divide-slate-100">
          {masters.map((m) => {
            const last = m.masterChatThread?.messages[0];
            return (
              <li key={m.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(m.id)}
                  className={clsx(
                    'flex w-full flex-col gap-1 px-4 py-3 text-left transition hover:bg-slate-50',
                    selectedId === m.id && 'bg-brand-50',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{m.name || m.email}</span>
                    <span
                      className={clsx(
                        'rounded-full px-2 py-0.5 text-xs',
                        m.masterProfile?.isOnline ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-600',
                      )}
                    >
                      {m.masterProfile?.isOnline ? tc('online') : tc('offline')}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500">
                    {getCityName(findCityBySlug(cities, m.masterProfile?.serviceArea), m.masterProfile?.serviceArea, locale)}
                    {m._count?.masterOrders ? ` · ${m._count.masterOrders} ${t('activeJobs')}` : ''}
                  </span>
                  {last && (
                    <span className="truncate text-xs text-slate-400">{last.content}</span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="card flex min-h-[320px] flex-col">
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
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={clsx(
                    'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                    msg.sender.role === 'ADMIN' ? 'ml-auto bg-brand-100 text-brand-900' : 'bg-white text-slate-800',
                  )}
                >
                  <span className="block text-xs font-medium opacity-70">
                    {msg.sender.name || msg.sender.role}
                  </span>
                  {msg.content}
                </div>
              ))}
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
