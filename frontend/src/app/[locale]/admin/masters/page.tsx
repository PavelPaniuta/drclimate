'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { getToken, getStoredUser } from '@/lib/auth';
import { api } from '@/lib/api';
import { City } from '@/lib/cities';
import { AdminMastersPanel } from '@/components/admin/AdminMastersPanel';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { useAdminChatUnread } from '@/contexts/AdminChatUnreadContext';

export default function AdminMastersPage() {
  const t = useTranslations('admin');
  const router = useRouter();
  const [cities, setCities] = useState<City[]>([]);
  const { refresh } = useAdminChatUnread();

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
    <AdminPageShell title={t('masters')} subtitle={t('mastersHint')} showUnreadBanner={false}>
      <AdminMastersPanel cities={cities} onUnreadChange={() => void refresh()} />
    </AdminPageShell>
  );
}
