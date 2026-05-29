'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { ContactInfoCard } from '@/components/ContactInfoCard';
import { ContactPerson, masterAvatarUrl } from '@/lib/contacts';
import { mediaUrl } from '@/lib/media';

type Props = {
  master: ContactPerson;
  compact?: boolean;
};

export function MasterPublicCard({ master, compact }: Props) {
  const t = useTranslations('contacts');
  const avatar = masterAvatarUrl(master);
  const photos = master.masterProfile?.workPhotos ?? [];

  if (compact) {
    return (
      <div className="mt-3 flex gap-3 rounded-xl border border-brand-100 bg-brand-50/50 p-3">
        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-slate-200">
          {avatar ? (
            <Image src={avatar} alt="" fill className="object-cover" sizes="56px" unoptimized />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl text-slate-400">👤</span>
          )}
        </div>
        <div className="min-w-0 flex-1 text-sm">
          <p className="font-semibold text-slate-900">{master.name || t('masterFallback')}</p>
          {master.phone && <p className="text-slate-600">{master.phone}</p>}
          {master.masterProfile?.bio && (
            <p className="mt-1 line-clamp-2 text-xs text-slate-500">{master.masterProfile.bio}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative mx-auto h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-slate-200 shadow-inner sm:mx-0">
          {avatar ? (
            <Image src={avatar} alt="" fill className="object-cover" sizes="112px" unoptimized />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-4xl text-slate-400">👤</span>
          )}
        </div>
        <div className="flex-1">
          <h4 className="text-lg font-bold text-slate-900">{master.name || t('masterFallback')}</h4>
          {master.masterProfile?.bio && (
            <p className="mt-1 text-sm text-slate-600">{master.masterProfile.bio}</p>
          )}
        </div>
      </div>

      <ContactInfoCard person={master} title={t('masterContacts')} />

      {photos.length > 0 && (
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-700">{t('workPhotos')}</h4>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {photos.map((photo) => {
              const src = mediaUrl(photo.url);
              if (!src) return null;
              return (
                <div key={photo.id} className="overflow-hidden rounded-lg border border-slate-200 bg-white">
                  <div className="relative aspect-[4/3] bg-slate-100">
                    <Image src={src} alt={photo.caption || ''} fill className="object-cover" sizes="200px" unoptimized />
                  </div>
                  {photo.caption && (
                    <p className="px-2 py-1 text-xs text-slate-500">{photo.caption}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
