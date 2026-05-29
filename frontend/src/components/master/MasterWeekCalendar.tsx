'use client';

import { useLocale, useTranslations } from 'next-intl';
import { WeekDay } from '@/lib/master-types';
import clsx from 'clsx';

interface Props {
  days: WeekDay[];
  selectedDate: string | null;
  onSelectDate: (iso: string) => void;
}

export function MasterWeekCalendar({ days, selectedDate, onSelectDate }: Props) {
  const t = useTranslations('master');
  const locale = useLocale();

  const weekday = (iso: string) =>
    new Date(iso).toLocaleDateString(locale, { weekday: 'short' });

  const dayNum = (iso: string) => new Date(iso).getDate();

  return (
    <div className="card">
      <h3 className="mb-3 text-sm font-semibold text-slate-700">{t('weekCalendar')}</h3>
      <div className="grid grid-cols-7 gap-1 sm:gap-2">
        {days.map((day) => {
          const full = day.count >= day.limit;
          const selected = selectedDate === day.date.slice(0, 10);
          return (
            <button
              key={day.date}
              type="button"
              onClick={() => onSelectDate(day.date.slice(0, 10))}
              className={clsx(
                'flex flex-col items-center rounded-xl border p-2 transition sm:p-3',
                day.isToday && 'border-brand-500 bg-brand-50',
                selected && !day.isToday && 'border-brand-400 bg-brand-50/50',
                !day.isToday && !selected && 'border-slate-200 hover:border-brand-200',
                full && 'ring-1 ring-amber-300',
              )}
            >
              <span className="text-[10px] uppercase text-slate-500 sm:text-xs">{weekday(day.date)}</span>
              <span className="text-lg font-bold">{dayNum(day.date)}</span>
              <span
                className={clsx(
                  'mt-1 text-[10px] font-medium sm:text-xs',
                  full ? 'text-amber-700' : 'text-slate-500',
                )}
              >
                {day.count}/{day.limit}
              </span>
              <div className="mt-1 flex gap-0.5">
                {Array.from({ length: Math.min(day.count, 5) }).map((_, i) => (
                  <span key={i} className="h-1.5 w-1.5 rounded-full bg-brand-500" />
                ))}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
