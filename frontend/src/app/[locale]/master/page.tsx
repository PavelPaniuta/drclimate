'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { api, ApiError } from '@/lib/api';
import { getToken, getStoredUser } from '@/lib/auth';
import { getSocket } from '@/lib/socket';
import { MasterWorkboard, MasterTab } from '@/lib/master-types';
import { Order } from '@/lib/types';
import { MasterMonthCalendar } from '@/components/master/MasterMonthCalendar';
import { MasterWorkSettings } from '@/components/master/MasterWorkSettings';
import { MasterOrderCard } from '@/components/master/MasterOrderCard';
import { MasterOrderDetail } from '@/components/master/MasterOrderDetail';
import { MasterAdminChat } from '@/components/master/MasterAdminChat';
import { ChatLauncherButton } from '@/components/chat/ChatLauncherButton';
import { PwaRegister } from '@/components/PwaRegister';
import { parseMasterChatPayload } from '@/lib/chat-messages';
import { MasterChatMessage } from '@/lib/types';
import { useMasterNotifications } from '@/hooks/useMasterNotifications';

function orderWorkDate(order: Order): Date {
  if (order.scheduledAt) return new Date(order.scheduledAt);
  if (order.preferredTime) return new Date(order.preferredTime);
  return new Date(order.createdAt);
}

function isSameDayStr(order: Order, dateStr: string): boolean {
  const d = orderWorkDate(order);
  const parts = dateStr.split('-').map(Number);
  return d.getFullYear() === parts[0] && d.getMonth() + 1 === parts[1] && d.getDate() === parts[2];
}

function localDateStr(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function ordersOnDate(orders: Order[], dateStr: string): Order[] {
  return orders.filter((o) => o.status !== 'CANCELLED' && isSameDayStr(o, dateStr));
}

export default function MasterDashboard() {
  const t = useTranslations('master');
  const tc = useTranslations('common');
  const router = useRouter();
  const [board, setBoard] = useState<MasterWorkboard | null>(null);
  const [tab, setTab] = useState<MasterTab>('active');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [chatUnread, setChatUnread] = useState(0);

  const loadChatUnread = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      const data = await api<{ count: number }>('/masters/admin-chat/unread', {}, token);
      setChatUnread(data.count);
    } catch {
      // ignore
    }
  }, []);

  const loadData = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    try {
      setError('');
      const data = await api<MasterWorkboard>('/masters/workboard', {}, token);
      setBoard(data);
      if (!selectedDate) {
        setSelectedDate(localDateStr());
      }
    } catch (e) {
      setError(e instanceof ApiError ? e.message : tc('error'));
    }
  }, [selectedDate, tc]);

  useMasterNotifications({ enabled: true, onNewOrder: loadData });

  useEffect(() => {
    const user = getStoredUser();
    const token = getToken();
    if (!user || user.role !== 'MASTER' || !token) {
      router.push('/uk/login');
      return;
    }

    loadData();
    void loadChatUnread();

    const socket = getSocket(token);
    socket.on('order_update', loadData);
    socket.on('order_accepted', loadData);
    socket.on('master_chat_message', (payload: MasterChatMessage | { message?: MasterChatMessage }) => {
      const msg = parseMasterChatPayload(payload);
      if (msg?.sender.role === 'ADMIN' && !chatOpen) {
        void loadChatUnread();
      }
    });

    return () => {
      socket.off('order_update');
      socket.off('order_accepted');
      socket.off('master_chat_message');
    };
  }, [router, loadData, loadChatUnread, chatOpen]);

  async function toggleOnline() {
    const token = getToken();
    if (!token || !board) return;
    await api('/masters/availability', {
      method: 'PATCH',
      body: JSON.stringify({ isOnline: !board.profile.isOnline }),
    }, token);
    loadData();
  }

  async function acceptOrder(id: string) {
    const token = getToken();
    if (!token) return;
    setError('');
    try {
      await api(`/orders/${id}/accept`, { method: 'POST' }, token);
      setTab('active');
      setOpenOrderId(id);
      await loadData();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : tc('error'));
      throw e;
    }
  }

  const tabs: { id: MasterTab; label: string; count: number }[] = useMemo(() => {
    if (!board) return [];
    const todayDateOrders = selectedDate
      ? ordersOnDate(board.orders.all, selectedDate).length
      : board.orders.today.length;
    return [
      { id: 'active', label: t('tabActive'), count: board.orders.active.length },
      { id: 'today', label: t('tabToday'), count: todayDateOrders },
      { id: 'incoming', label: t('tabIncoming'), count: board.orders.incoming.length },
      { id: 'completed', label: t('tabCompleted'), count: board.orders.completed.length },
      { id: 'all', label: t('tabAll'), count: board.orders.all.length },
    ];
  }, [board, selectedDate, t]);

  const displayedOrders: Order[] = useMemo(() => {
    if (!board) return [];
    if (tab === 'today' && selectedDate) {
      return ordersOnDate(board.orders.all, selectedDate);
    }
    switch (tab) {
      case 'incoming':
        return board.orders.incoming;
      case 'active':
        return board.orders.active;
      case 'completed':
        return board.orders.completed;
      case 'all':
        return board.orders.all;
      default:
        return board.orders.today;
    }
  }, [board, tab, selectedDate]);

  if (!board) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-500">
        {error ? (
          <>
            <p className="text-red-600">{error}</p>
            <button type="button" onClick={loadData} className="btn-primary text-sm">{t('retry')}</button>
          </>
        ) : (
          tc('loading')
        )}
      </div>
    );
  }

  const capacityPct = Math.min(100, (board.stats.today / board.stats.todayLimit) * 100);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <PwaRegister />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{t('title')}</h1>
          <p className="hidden text-sm text-slate-500 sm:block">{t('workboardSubtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ChatLauncherButton
            label={t('adminChat')}
            count={chatUnread}
            active={chatOpen}
            onClick={() => setChatOpen(true)}
          />
          <button
            type="button"
            onClick={toggleOnline}
            className={clsx(
              'rounded-full px-4 py-2 text-sm font-medium transition',
              board.profile.isOnline ? 'bg-green-100 text-green-800' : 'bg-slate-200 text-slate-600',
            )}
          >
            {board.profile.isOnline ? '🟢 ' : '⚫ '}
            {board.profile.isOnline ? tc('online') : tc('offline')}
          </button>
        </div>
      </div>

      <MasterAdminChat
        open={chatOpen}
        onClose={() => setChatOpen(false)}
        onUnreadChange={loadChatUnread}
      />

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <p className="text-xs font-medium uppercase text-slate-500">{t('todayLoad')}</p>
          <p className="mt-1 text-2xl font-bold">
            {board.stats.today} <span className="text-base font-normal text-slate-400">/ {board.stats.todayLimit}</span>
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className={clsx('h-full rounded-full transition-all', capacityPct >= 100 ? 'bg-amber-500' : 'bg-brand-500')}
              style={{ width: `${capacityPct}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate-500">{t('slotsLeft', { count: board.stats.todayRemaining })}</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium uppercase text-slate-500">{t('tabActive')}</p>
          <p className="mt-1 text-2xl font-bold text-indigo-700">{board.stats.active}</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium uppercase text-slate-500">{t('tabCompleted')}</p>
          <p className="mt-1 text-2xl font-bold text-green-700">{board.stats.completed}</p>
        </div>
        <div className="card">
          <p className="text-xs font-medium uppercase text-slate-500">{t('todayEarnings')}</p>
          <p className="mt-1 text-2xl font-bold text-brand-700">{board.stats.todayEarnings} ₴</p>
          <p className="text-xs text-slate-500">{t('totalEarnings')}: {board.stats.totalEarnings} ₴</p>
        </div>
      </div>

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <MasterMonthCalendar
            orders={board.orders.all}
            selectedDate={selectedDate}
            maxJobsPerDay={board.profile.maxJobsPerDay}
            onSelectDate={(d) => {
              setSelectedDate(d);
              setTab('today');
            }}
            onOpenOrder={setOpenOrderId}
          />
        </div>
        <MasterWorkSettings profile={board.profile} onSaved={loadData} />
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-slate-200 pb-px">
        {tabs.map(({ id, label, count }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={clsx(
              'whitespace-nowrap rounded-t-lg px-4 py-2 text-sm font-medium transition',
              tab === id
                ? 'border border-b-0 border-slate-200 bg-white text-brand-700'
                : 'text-slate-500 hover:text-slate-800',
            )}
          >
            {label}
            {count > 0 && (
              <span className={clsx(
                'ml-2 rounded-full px-2 py-0.5 text-xs',
                tab === id ? 'bg-brand-100 text-brand-700' : 'bg-slate-100',
              )}>
                {count}
              </span>
            )}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {tab === 'today' && selectedDate && (
          <p className="text-sm text-slate-500">{t('dayOrdersHint')}</p>
        )}
        {tab === 'incoming' && <p className="text-sm text-slate-500">{t('incomingJobsHint')}</p>}
        {tab === 'active' && board.orders.active.length > 0 && (
          <p className="text-sm text-slate-500">{t('openOrderHint')}</p>
        )}
        {displayedOrders.length === 0 && (
          <div className="card py-12 text-center text-slate-400">{t('noOrdersInTab')}</div>
        )}
        {displayedOrders.map((order) => (
          <MasterOrderCard
            key={order.id}
            order={order}
            onOpen={() => setOpenOrderId(order.id)}
            onAccept={
              tab === 'incoming'
                ? () => acceptOrder(order.id).catch(() => {})
                : undefined
            }
          />
        ))}
      </div>

      <MasterOrderDetail
        orderId={openOrderId}
        onClose={() => setOpenOrderId(null)}
        onUpdated={loadData}
        onAccept={acceptOrder}
      />
    </div>
  );
}
