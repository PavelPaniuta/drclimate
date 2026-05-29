'use client';

import { useTranslations } from 'next-intl';
import clsx from 'clsx';
import { MasterWorkboard } from '@/lib/master-types';

type Props = {
  board: MasterWorkboard;
};

export function MasterQuickStats({ board }: Props) {
  const t = useTranslations('master');
  const capacityPct = Math.min(100, (board.stats.today / board.stats.todayLimit) * 100);

  return (
    <div className="mb-4 flex flex-wrap gap-2 text-sm">
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 font-medium text-amber-900">
        🔔 {t('statIncoming', { count: board.stats.incoming })}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-100 px-3 py-1 font-medium text-indigo-900">
        🔧 {t('statActive', { count: board.stats.active })}
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-700">
        📅 {board.stats.today}/{board.stats.todayLimit}
        <span
          className={clsx('h-1.5 w-8 overflow-hidden rounded-full bg-slate-200')}
          title={t('slotsLeft', { count: board.stats.todayRemaining })}
        >
          <span
            className={clsx('block h-full rounded-full', capacityPct >= 100 ? 'bg-amber-500' : 'bg-brand-500')}
            style={{ width: `${capacityPct}%` }}
          />
        </span>
      </span>
      <span className="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1 font-medium text-green-800">
        💰 {board.stats.todayEarnings} ₴
      </span>
    </div>
  );
}
