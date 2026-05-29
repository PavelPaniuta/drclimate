'use client';

import clsx from 'clsx';

type Props = {
  label: string;
  count?: number;
  onClick: () => void;
  active?: boolean;
  className?: string;
};

export function ChatLauncherButton({ label, count = 0, onClick, active, className }: Props) {
  const showBadge = count > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'relative inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-medium shadow-sm transition',
        active
          ? 'bg-brand-600 text-white ring-2 ring-brand-200'
          : 'border border-brand-200 bg-white text-brand-700 hover:bg-brand-50',
        showBadge && !active && 'border-red-300 bg-red-50 text-red-800 animate-pulse',
        className,
      )}
    >
      <span className="text-lg leading-none" aria-hidden>
        💬
      </span>
      <span>{label}</span>
      {showBadge && (
        <span
          className={clsx(
            'flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold',
            active ? 'bg-white text-brand-700' : 'bg-red-500 text-white',
          )}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}
