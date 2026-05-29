'use client';

import { useTranslations } from 'next-intl';
import { ContactPerson, formatTelegramDisplay, telegramLink } from '@/lib/contacts';

type Props = {
  person: ContactPerson;
  title?: string;
  showEmail?: boolean;
};

export function ContactInfoCard({ person, title, showEmail = true }: Props) {
  const t = useTranslations('contacts');
  const tg = telegramLink(person.telegram);
  const tgLabel = formatTelegramDisplay(person.telegram);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      {title && <h4 className="mb-3 text-sm font-semibold text-slate-800">{title}</h4>}
      <dl className="space-y-2 text-sm">
        {person.name && (
          <div>
            <dt className="text-xs font-medium uppercase text-slate-400">{t('name')}</dt>
            <dd className="font-medium text-slate-900">{person.name}</dd>
          </div>
        )}
        {showEmail && person.email && (
          <div>
            <dt className="text-xs font-medium uppercase text-slate-400">{t('email')}</dt>
            <dd>
              <a href={`mailto:${person.email}`} className="text-brand-600 hover:underline">
                {person.email}
              </a>
            </dd>
          </div>
        )}
        {person.phone && (
          <div>
            <dt className="text-xs font-medium uppercase text-slate-400">{t('phone')}</dt>
            <dd>
              <a href={`tel:${person.phone.replace(/\s/g, '')}`} className="text-brand-600 hover:underline">
                {person.phone}
              </a>
            </dd>
          </div>
        )}
        {person.address && (
          <div>
            <dt className="text-xs font-medium uppercase text-slate-400">{t('address')}</dt>
            <dd className="text-slate-800">{person.address}</dd>
          </div>
        )}
        {tgLabel && (
          <div>
            <dt className="text-xs font-medium uppercase text-slate-400">{t('telegram')}</dt>
            <dd>
              <a href={tg!} target="_blank" rel="noopener noreferrer" className="text-brand-600 hover:underline">
                {tgLabel}
              </a>
            </dd>
          </div>
        )}
        {person.city && (
          <div>
            <dt className="text-xs font-medium uppercase text-slate-400">{t('city')}</dt>
            <dd>{person.city}</dd>
          </div>
        )}
      </dl>
    </div>
  );
}
