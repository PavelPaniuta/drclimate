'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import clsx from 'clsx';
import { Order } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';

interface Props {
  orders: Order[];
  selectedDate: string | null;
  maxJobsPerDay: number;
  onSelectDate: (dateStr: string) => void;
  onOpenOrder?: (orderId: string) => void;
}

function orderWorkDate(order: Order): Date {
  if (order.scheduledAt) return new Date(order.scheduledAt);
  if (order.preferredTime) return new Date(order.preferredTime);
  return new Date(order.createdAt);
}

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

export function MasterMonthCalendar({ orders, selectedDate, maxJobsPerDay, onSelectDate, onOpenOrder }: Props) {
  const t = useTranslations('master');
  const ts = useTranslations('serviceType');
  const locale = useLocale();
  const [viewDate, setViewDate] = useState(() => {
    const d = selectedDate ? new Date(selectedDate) : new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const today = new Date();

  useEffect(() => {
    if (!selectedDate) return;
    const d = new Date(selectedDate + 'T12:00:00');
    setViewDate((prev) => {
      if (prev.getFullYear() !== d.getFullYear() || prev.getMonth() !== d.getMonth()) {
        return new Date(d.getFullYear(), d.getMonth(), 1);
      }
      return prev;
    });
  }, [selectedDate]);

  const activeOrders = useMemo(
    () => orders.filter((o) => o.status !== 'CANCELLED'),
    [orders],
  );

  const countByDay = useMemo(() => {
    const map = new Map<string, Order[]>();
    for (const o of activeOrders) {
      const key = toDateStr(orderWorkDate(o));
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(o);
    }
    return map;
  }, [activeOrders]);

  const grid = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();
    const first = new Date(year, month, 1);
    const startOffset = (first.getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: { date: Date; inMonth: boolean }[] = [];

    for (let i = startOffset - 1; i >= 0; i--) {
      cells.push({ date: new Date(year, month, -i), inMonth: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({ date: new Date(year, month, d), inMonth: true });
    }
    while (cells.length % 7 !== 0) {
      const last = cells[cells.length - 1].date;
      cells.push({ date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1), inMonth: false });
    }
    return cells;
  }, [viewDate]);

  const monthLabel = viewDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
  const weekdays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(2024, 0, 1 + i);
    return d.toLocaleDateString(locale, { weekday: 'short' });
  });

  function prevMonth() {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  }

  function nextMonth() {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  }

  const selectedDayOrders = selectedDate ? (countByDay.get(selectedDate) || []) : [];
  const selectedDayLabel = selectedDate
    ? new Date(selectedDate + 'T12:00:00').toLocaleDateString(locale, {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      })
    : '';

  function formatOrderTime(order: Order) {
    const iso = order.scheduledAt || order.preferredTime;
    if (!iso) return null;
    return new Date(iso).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }

  return (
    <div className="card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700">{t('monthCalendar')}</h3>
        <div className="flex items-center gap-2">
          <button type="button" onClick={prevMonth} className="rounded-lg border px-2 py-1 text-sm hover:bg-slate-50">←</button>
          <span className="min-w-[140px] text-center text-sm font-medium capitalize">{monthLabel}</span>
          <button type="button" onClick={nextMonth} className="rounded-lg border px-2 py-1 text-sm hover:bg-slate-50">→</button>
        </div>
      </div>

      <div className="mb-1 grid grid-cols-7 gap-1">
        {weekdays.map((w) => (
          <div key={w} className="py-1 text-center text-[10px] font-medium uppercase text-slate-400 sm:text-xs">{w}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {grid.map(({ date, inMonth }) => {
          const key = toDateStr(date);
          const dayOrders = countByDay.get(key) || [];
          const count = dayOrders.length;
          const full = count >= maxJobsPerDay;
          const isToday = isSameDay(date, today);
          const selected = selectedDate === key;

          return (
            <button
              key={key + inMonth}
              type="button"
              onClick={() => inMonth && onSelectDate(key)}
              disabled={!inMonth}
              className={clsx(
                'relative flex min-h-[52px] flex-col items-center rounded-lg border p-1 transition sm:min-h-[64px] sm:p-2',
                !inMonth && 'cursor-default opacity-30',
                inMonth && 'hover:border-brand-300',
                isToday && inMonth && 'border-brand-500 bg-brand-50',
                selected && inMonth && !isToday && 'border-brand-400 bg-brand-50/60',
                !isToday && !selected && inMonth && 'border-slate-200',
                full && inMonth && count > 0 && 'ring-1 ring-amber-300',
              )}
            >
              <span className={clsx('text-sm font-semibold', isToday && 'text-brand-700')}>{date.getDate()}</span>
              {count > 0 && inMonth && (
                <>
                  <span className={clsx('text-[10px] font-medium', full ? 'text-amber-700' : 'text-slate-500')}>
                    {count}/{maxJobsPerDay}
                  </span>
                  <div className="mt-0.5 flex flex-wrap justify-center gap-0.5">
                    {dayOrders.slice(0, 3).map((o) => (
                      <span
                        key={o.id}
                        className={clsx(
                          'h-1.5 w-1.5 rounded-full',
                          o.status === 'COMPLETED' ? 'bg-green-500' :
                          o.status === 'IN_PROGRESS' ? 'bg-indigo-500' :
                          o.status === 'ACCEPTED' ? 'bg-blue-500' : 'bg-brand-400',
                        )}
                      />
                    ))}
                  </div>
                </>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-3 text-[10px] text-slate-500 sm:text-xs">
        <span><span className="inline-block h-2 w-2 rounded-full bg-blue-500" /> {t('legendAccepted')}</span>
        <span><span className="inline-block h-2 w-2 rounded-full bg-indigo-500" /> {t('legendInProgress')}</span>
        <span><span className="inline-block h-2 w-2 rounded-full bg-green-500" /> {t('legendCompleted')}</span>
      </div>

      {selectedDate && (
        <div className="mt-4 border-t border-slate-100 pt-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <h4 className="text-sm font-semibold capitalize text-slate-800">{selectedDayLabel}</h4>
            <span className="text-xs text-slate-500">
              {selectedDayOrders.length}/{maxJobsPerDay} {t('dayOrdersCount')}
            </span>
          </div>

          {selectedDayOrders.length === 0 ? (
            <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-sm text-slate-400">{t('noOrdersOnDay')}</p>
          ) : (
            <ul className="space-y-2">
              {selectedDayOrders.map((order) => {
                const time = formatOrderTime(order);
                return (
                  <li key={order.id}>
                    <button
                      type="button"
                      onClick={() => onOpenOrder?.(order.id)}
                      className="flex w-full items-start gap-3 rounded-lg border border-slate-200 bg-white p-3 text-left transition hover:border-brand-300 hover:bg-brand-50/40"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-900">
                            {ts(order.serviceType as 'AC_REPAIR')}
                          </span>
                          {time && (
                            <span className="text-xs font-medium text-brand-700">🕐 {time}</span>
                          )}
                        </div>
                        <p className="mt-0.5 text-sm text-slate-600 line-clamp-1">{order.description}</p>
                        <p className="mt-0.5 text-xs text-slate-500">📍 {order.address}</p>
                      </div>
                      <StatusBadge status={order.status} />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
