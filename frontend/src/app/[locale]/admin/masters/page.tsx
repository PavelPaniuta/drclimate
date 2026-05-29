'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getToken, getStoredUser } from '@/lib/auth';
import { api } from '@/lib/api';
import { City } from '@/lib/cities';
import { AdminMastersPanel } from '@/components/admin/AdminMastersPanel';
import { AdminNav } from '@/components/admin/AdminNav';
import { useAdminChatUnread } from '@/hooks/useAdminChatUnread';

export default function AdminMastersPage() {
  const t = useTranslations('admin');
  const router = useRouter();
  const [cities, setCities] = useState<City[]>([]);
  const { total, refresh } = useAdminChatUnread();

  useEffect(() => {
    const user = getStoredUser();
    const token = getToken();
    if (!user || user.role !== 'ADMIN' || !token) {
      router.push('/uk/login');
      return;
    }
    api<City[]>('/cities/manage', {}, token).then(setCities);
  }, [router]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <h1 className="mb-2 text-xl font-bold sm:text-2xl">{t('masters')}</h1>
      <p className="mb-4 text-sm text-slate-500">{t('mastersHint')}</p>
      <AdminNav />
      <AdminMastersPanel cities={cities} onUnreadChange={() => void refresh()} />
    </div>
  );
}
