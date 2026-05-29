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
import { MasterProfileEditor } from '@/components/master/MasterProfileEditor';
import { MasterOrderDetail } from '@/components/master/MasterOrderDetail';
import { MasterAdminChat } from '@/components/master/MasterAdminChat';
import { MasterOrdersSection, MasterTabItem } from '@/components/master/MasterOrdersSection';
import { MasterQuickStats } from '@/components/master/MasterQuickStats';
import { ChatLauncherButton } from '@/components/chat/ChatLauncherButton';
import { PwaRegister } from '@/components/PwaRegister';
import { useMasterNotifications } from '@/hooks/useMasterNotifications';
import { useMasterChatUnread } from '@/hooks/useMasterChatUnread';
import { useMasterOrderChatUnread } from '@/hooks/useMasterOrderChatUnread';
import { useMasterIncomingNew } from '@/hooks/useMasterIncomingNew';

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
  const [tab, setTab] = useState<MasterTab>('incoming');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [openOrderId, setOpenOrderId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [showExtra, setShowExtra] = useState(false);
  const { count: chatUnread, refresh: refreshChatUnread } = useMasterChatUnread(true);
  const {
    total: orderChatUnread,
    byOrder: orderChatByOrder,
    refresh: refreshOrderChatUnread,
  } = useMasterOrderChatUnread(true);

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

  useMasterNotifications({ enabled: true });

  const incomingList = board?.orders.incoming ?? [];
  const {
    newCount: newIncomingCount,
    sortedIncoming,
    isNew: isNewIncoming,
    markSeen: markIncomingSeen,
  } = useMasterIncomingNew(incomingList, loadData);

  useEffect(() => {
    const user = getStoredUser();
    const token = getToken();
    if (!user || user.role !== 'MASTER' || !token) {
      router.push('/uk/login');
      return;
    }

    loadData();

    const socket = getSocket(token);
    socket.on('order_update', loadData);
    socket.on('order_accepted', loadData);

    return () => {
      socket.off('order_update');
      socket.off('order_accepted');
    };
  }, [router, loadData]);

  useEffect(() => {
    if (newIncomingCount > 0) {
      setTab('incoming');
    }
  }, [newIncomingCount]);

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
      markIncomingSeen(id);
      await api(`/orders/${id}/accept`, { method: 'POST' }, token);
      setTab('active');
      setOpenOrderId(id);
      await loadData();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : tc('error'));
      throw e;
    }
  }

  const orderTabs: MasterTabItem[] = useMemo(() => {
    if (!board) return [];
    const todayDateOrders = selectedDate
      ? ordersOnDate(board.orders.all, selectedDate).length
      : board.orders.today.length;
    return [
      {
        id: 'incoming',
        icon: '🔔',
        title: t('tabIncomingTitle'),
        description: t('tabIncomingDesc'),
        count: board.orders.incoming.length,
        newCount: newIncomingCount,
      },
      {
        id: 'active',
        icon: '🔧',
        title: t('tabActiveTitle'),
        description: t('tabActiveDesc'),
        count: board.orders.active.length,
        newCount: 0,
      },
      {
        id: 'today',
        icon: '📅',
        title: t('tabTodayTitle'),
        description: t('tabTodayDesc'),
        count: todayDateOrders,
        newCount: 0,
      },
      {
        id: 'completed',
        icon: '✅',
        title: t('tabCompletedTitle'),
        description: t('tabCompletedDesc'),
        count: board.orders.completed.length,
        newCount: 0,
      },
      {
        id: 'all',
        icon: '📋',
        title: t('tabAllTitle'),
        description: t('tabAllDesc'),
        count: board.orders.all.length,
        newCount: 0,
      },
    ];
  }, [board, selectedDate, t, newIncomingCount]);

  const displayedOrders: Order[] = useMemo(() => {
    if (!board) return [];
    if (tab === 'today' && selectedDate) {
      return ordersOnDate(board.orders.all, selectedDate);
    }
    switch (tab) {
      case 'incoming':
        return sortedIncoming;
      case 'active':
        return board.orders.active;
      case 'completed':
        return board.orders.completed;
      case 'all':
        return board.orders.all;
      default:
        return board.orders.today;
    }
  }, [board, tab, selectedDate, sortedIncoming]);

  if (!board) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-slate-500">
        {error ? (
          <>
            <p className="text-red-600">{error}</p>
            <button type="button" onClick={loadData} className="btn-primary text-sm">
              {t('retry')}
            </button>
          </>
        ) : (
          tc('loading')
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-4 sm:py-6">
      <PwaRegister />

      {/* Шапка */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">{t('title')}</h1>
          <p className="text-sm text-slate-500">{t('workboardSubtitleShort')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ChatLauncherButton
            label={t('clientChats')}
            count={orderChatUnread}
            onClick={() => {
              const first = Object.entries(orderChatByOrder).find(([, n]) => n > 0);
              if (first) setOpenOrderId(first[0]);
            }}
          />
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
              'rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition',
              board.profile.isOnline ? 'bg-green-500 text-white' : 'bg-slate-300 text-slate-700',
            )}
          >
            {board.profile.isOnline ? '🟢 ' : '⚫ '}
            {board.profile.isOnline ? tc('online') : tc('offline')}
          </button>
        </div>
      </div>

      <MasterQuickStats board={board} />

      {newIncomingCount > 0 && tab !== 'incoming' && (
        <button
          type="button"
          onClick={() => setTab('incoming')}
          className="mb-4 flex w-full items-center justify-between gap-3 rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-left text-sm font-semibold text-amber-900"
        >
          <span>🔔 {t('newOrdersBanner', { count: newIncomingCount })}</span>
          <span className="flex h-8 min-w-8 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
            {newIncomingCount}
          </span>
        </button>
      )}

      {orderChatUnread > 0 && (
        <button
          type="button"
          onClick={() => {
            const first = Object.entries(orderChatByOrder).find(([, n]) => n > 0);
            if (first) setOpenOrderId(first[0]);
          }}
          className="mb-4 flex w-full items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-left text-sm font-medium text-red-800"
        >
          <span>{t('orderChatUnreadBanner', { count: orderChatUnread })}</span>
          <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {orderChatUnread}
          </span>
        </button>
      )}

      {chatUnread > 0 && !chatOpen && (
        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="mb-4 flex w-full items-center justify-between gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left text-sm font-medium text-amber-900"
        >
          <span>{t('chatUnreadBanner', { count: chatUnread })}</span>
          <span className="flex h-7 min-w-7 items-center justify-center rounded-full bg-amber-500 text-xs font-bold text-white">
            {chatUnread}
          </span>
        </button>
      )}

      <MasterAdminChat
        open={chatOpen}
        onClose={() => {
          setChatOpen(false);
          void refreshChatUnread();
        }}
        onUnreadChange={refreshChatUnread}
      />

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Головне: заявки одразу під шапкою */}
      <MasterOrdersSection
        tabs={orderTabs}
        activeTab={tab}
        onTabChange={setTab}
        orders={displayedOrders}
        selectedDate={selectedDate}
        isNewIncoming={isNewIncoming}
        orderChatByOrder={orderChatByOrder}
        onOpenOrder={(id) => {
          if (tab === 'incoming') markIncomingSeen(id);
          setOpenOrderId(id);
        }}
        onAcceptOrder={(id) => acceptOrder(id).catch(() => {})}
      />

      {/* Календар і налаштування — згорнуто, щоб не заважали */}
      <div className="border-t border-slate-200 pt-4">
        <button
          type="button"
          onClick={() => setShowExtra((v) => !v)}
          className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm font-medium text-slate-700 hover:bg-slate-100"
        >
          <span>📆 {t('extraSectionTitle')}</span>
          <span className="text-slate-400">{showExtra ? '▲' : '▼'}</span>
        </button>

        {showExtra && (
          <div className="mt-4 space-y-4">
            <MasterProfileEditor onSaved={loadData} />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <MasterMonthCalendar
                orders={board.orders.all}
                selectedDate={selectedDate}
                maxJobsPerDay={board.profile.maxJobsPerDay}
                onSelectDate={(d) => {
                  setSelectedDate(d);
                  setTab('today');
                  setShowExtra(false);
                }}
                onOpenOrder={setOpenOrderId}
              />
            </div>
            <MasterWorkSettings profile={board.profile} onSaved={loadData} />
          </div>
          </div>
        )}
      </div>

      <MasterOrderDetail
        orderId={openOrderId}
        onClose={() => {
          setOpenOrderId(null);
          void refreshOrderChatUnread();
        }}
        onUpdated={loadData}
        onAccept={acceptOrder}
        onUnreadChange={refreshOrderChatUnread}
      />
    </div>
  );
}
