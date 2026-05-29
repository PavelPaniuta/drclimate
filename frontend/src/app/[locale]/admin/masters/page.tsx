'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { getToken } from '@/lib/auth';
import { useRequireAuth } from '@/hooks/useAuthRedirect';
import { api } from '@/lib/api';
import { City } from '@/lib/cities';
import { AdminMastersPanel } from '@/components/admin/AdminMastersPanel';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { useAdminChatUnread } from '@/contexts/AdminChatUnreadContext';

export default function AdminMastersPage() {
  const t = useTranslations('admin');
  const [cities, setCities] = useState<City[]>([]);
  const { refresh } = useAdminChatUnread();
  const authorized = useRequireAuth('ADMIN');

  useEffect(() => {
    if (!authorized) return;
    const token = getToken();
    if (!token) return;
    api<City[]>('/cities/manage', {}, token).then(setCities);
  }, [authorized]);

  return (
    <AdminPageShell title={t('masters')} subtitle={t('mastersHint')} showUnreadBanner={false}>
      <AdminMastersPanel cities={cities} onUnreadChange={() => void refresh()} />
    </AdminPageShell>
  );
}
