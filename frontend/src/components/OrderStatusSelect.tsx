'use client';

import { useTranslations } from 'next-intl';
import clsx from 'clsx';
import { OrderStatusValue } from '@/lib/order-status';

type Props = {
  value: string;
  onChange: (value: string) => void;
  statuses: readonly OrderStatusValue[];
  className?: string;
  id?: string;
};

export function OrderStatusSelect({ value, onChange, statuses, className, id }: Props) {
  const t = useTranslations('orderStatus');

  return (
    <select
      id={id}
      className={clsx('input', className)}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      {statuses.map((s) => (
        <option key={s} value={s}>
          {t(s)}
        </option>
      ))}
    </select>
  );
}
