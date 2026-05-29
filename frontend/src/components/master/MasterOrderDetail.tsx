'use client';

import { useEffect, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { api, ApiError } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { getSocket } from '@/lib/socket';
import { Order, OrderComment } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';
import { OrderChat } from '@/components/OrderChat';
import { OrderSettlementPanel } from '@/components/master/OrderSettlementPanel';
import { ContactInfoCard } from '@/components/ContactInfoCard';
import { SettlementFormData, buildCompletePayload, emptySettlementForm } from '@/lib/settlement';

interface Props {
  orderId: string | null;
  onClose: () => void;
  onUpdated: () => void;
  onAccept?: (id: string) => Promise<void>;
  onUnreadChange?: () => void;
}

function fmt(iso: string | undefined, locale: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function MasterOrderDetail({ orderId, onClose, onUpdated, onAccept, onUnreadChange }: Props) {
  const t = useTranslations('master');
  const ts = useTranslations('serviceType');
  const tc = useTranslations('common');
  const locale = useLocale();
  const [order, setOrder] = useState<Order | null>(null);
  const [comments, setComments] = useState<OrderComment[]>([]);
  const [notes, setNotes] = useState('');
  const [commentText, setCommentText] = useState('');
  const [scheduleAt, setScheduleAt] = useState('');
  const [settlementForm, setSettlementForm] = useState<SettlementFormData>(emptySettlementForm());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!orderId) return;
    const token = getToken();
    if (!token) return;

    async function load() {
      const o = await api<Order>(`/orders/${orderId}`, {}, token!);
      setOrder(o);
      setNotes(o.masterNotes || '');
      const when = o.scheduledAt || o.preferredTime;
      setScheduleAt(when ? when.slice(0, 16) : '');
      setComments(o.comments || []);
    }
    load();

    const socket = getSocket(token);
    socket.emit('join_order', { orderId });
    socket.on('order_update', (updated: Order) => {
      if (updated?.id === orderId) {
        setOrder(updated);
        setNotes(updated.masterNotes || '');
      }
    });
    socket.on('new_comment', (c: OrderComment) => {
      if (c) setComments((prev) => [...prev, c]);
    });

    return () => {
      socket.off('order_update');
      socket.off('new_comment');
    };
  }, [orderId]);

  if (!orderId) return null;

  async function runAction(fn: () => Promise<void>) {
    setError('');
    setSaving(true);
    try {
      await fn();
      onUpdated();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : tc('error'));
    } finally {
      setSaving(false);
    }
  }

  async function saveNotes() {
    const token = getToken();
    if (!token || !order) return;
    await runAction(async () => {
      const updated = await api<Order>(`/orders/${order.id}/master-notes`, {
        method: 'PATCH',
        body: JSON.stringify({ masterNotes: notes }),
      }, token);
      setOrder(updated);
    });
  }

  async function addComment(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token || !order || !commentText.trim()) return;
    await runAction(async () => {
      const c = await api<OrderComment>(`/orders/${order.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content: commentText.trim() }),
      }, token);
      setComments((prev) => [...prev, c]);
      setCommentText('');
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 sm:items-center sm:p-4">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col rounded-t-2xl bg-white shadow-xl sm:rounded-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <div>
            <h2 className="text-lg font-bold">{t('orderDetail')}</h2>
            {order && (
              <p className="text-sm text-slate-500">{ts(order.serviceType as 'AC_REPAIR')}</p>
            )}
          </div>
          <button type="button" onClick={onClose} className="rounded-lg px-3 py-1 text-slate-500 hover:bg-slate-100">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4">
          {!order ? (
            <p className="text-center text-slate-400">{tc('loading')}</p>
          ) : (
            <div className="space-y-5">
              {error && <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={order.status} />
                {order.settlement ? (
                  <span className="text-sm font-medium text-green-700">
                    {t('netProfit')}: {order.settlement.netProfit} ₴
                  </span>
                ) : order.price != null && (
                  <span className="text-sm font-medium text-green-700">{order.price} ₴</span>
                )}
              </div>

              <section className="grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">{t('scheduledTime')}</p>
                  <p className="text-sm">{fmt(order.scheduledAt || order.preferredTime, locale)}</p>
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-slate-400">{t('createdAt')}</p>
                  <p className="text-sm">{fmt(order.createdAt, locale)}</p>
                </div>
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium uppercase text-slate-400">{t('address')}</p>
                  <p className="text-sm">{order.address}, {order.city}</p>
                </div>
                {order.client && (
                  <div className="sm:col-span-2">
                    <ContactInfoCard person={order.client} title={t('client')} />
                  </div>
                )}
                <div className="sm:col-span-2">
                  <p className="text-xs font-medium uppercase text-slate-400">{t('description')}</p>
                  <p className="text-sm text-slate-700">{order.description}</p>
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-3 text-sm font-semibold">{t('actions')}</h3>
                <div className="flex flex-wrap gap-2">
                  {order.status === 'PENDING' && onAccept && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => runAction(() => onAccept(order.id))}
                      className="btn-primary text-sm"
                    >
                      {tc('accept')}
                    </button>
                  )}
                  {order.status === 'ACCEPTED' && (
                    <button
                      type="button"
                      disabled={saving}
                      onClick={() => runAction(async () => {
                        const token = getToken()!;
                        await api(`/orders/${order.id}/status`, {
                          method: 'PATCH',
                          body: JSON.stringify({ status: 'IN_PROGRESS' }),
                        }, token);
                      })}
                      className="btn-primary text-sm"
                    >
                      {t('startWork')}
                    </button>
                  )}
                  {order.status === 'IN_PROGRESS' && (
                    <>
                      <OrderSettlementPanel
                        form={settlementForm}
                        onChange={setSettlementForm}
                      />
                      <button
                        type="button"
                        disabled={saving || !settlementForm.clientPaid}
                        onClick={() => runAction(async () => {
                          const token = getToken()!;
                          const payload = buildCompletePayload(settlementForm);
                          const updated = await api<Order>(`/orders/${order.id}/complete`, {
                            method: 'POST',
                            body: JSON.stringify(payload),
                          }, token);
                          setOrder(updated);
                          setSettlementForm(emptySettlementForm());
                        })}
                        className="btn-primary text-sm"
                      >
                        {t('completeJob')}
                      </button>
                    </>
                  )}
                </div>

                {['ACCEPTED', 'IN_PROGRESS'].includes(order.status) && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <input
                      type="datetime-local"
                      className="input max-w-[220px] text-sm"
                      value={scheduleAt}
                      onChange={(e) => setScheduleAt(e.target.value)}
                    />
                    <button
                      type="button"
                      disabled={saving || !scheduleAt}
                      onClick={() => runAction(async () => {
                        const token = getToken()!;
                        const updated = await api<Order>(`/orders/${order.id}/schedule`, {
                          method: 'PATCH',
                          body: JSON.stringify({ scheduledAt: new Date(scheduleAt).toISOString() }),
                        }, token);
                        setOrder(updated);
                      })}
                      className="btn-secondary text-sm"
                    >
                      {t('reschedule')}
                    </button>
                  </div>
                )}
              </section>

              {order.settlement && (
                <OrderSettlementPanel readOnly={order.settlement} />
              )}

              {order.master && (
                <section>
                  <h3 className="mb-2 text-sm font-semibold">{t('masterNotes')}</h3>
                  <textarea
                    className="input min-h-[80px] text-sm"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={t('masterNotesPlaceholder')}
                  />
                  <button type="button" onClick={saveNotes} disabled={saving} className="btn-secondary mt-2 text-sm">
                    {t('saveNotes')}
                  </button>
                </section>
              )}

              {order.master && (
                <section>
                  <h3 className="mb-2 text-sm font-semibold">{t('workComments')}</h3>
                  <div className="mb-3 max-h-40 space-y-2 overflow-y-auto rounded-lg bg-slate-50 p-3">
                    {comments.length === 0 && <p className="text-sm text-slate-400">—</p>}
                    {comments.map((c) => (
                      <div key={c.id} className="text-sm">
                        <span className="font-medium text-brand-700">
                          {c.author.name || c.author.role}
                        </span>
                        <span className="ml-2 text-xs text-slate-400">
                          {new Date(c.createdAt).toLocaleString(locale)}
                        </span>
                        <p className="text-slate-700">{c.content}</p>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={addComment} className="flex gap-2">
                    <input
                      className="input flex-1 text-sm"
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      placeholder={t('commentPlaceholder')}
                    />
                    <button type="submit" disabled={saving} className="btn-primary text-sm">
                      {t('addComment')}
                    </button>
                  </form>
                </section>
              )}

              {order.master && order.status !== 'PENDING' && (
                <section>
                  <h3 className="mb-2 text-sm font-semibold">{t('clientChat')}</h3>
                  <OrderChat orderId={order.id} onUnreadChange={onUnreadChange} />
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
