'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import clsx from 'clsx';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { City, findCityBySlug, getCityName } from '@/lib/cities';
import { AdminUserListItem } from '@/lib/admin-users';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { AdminUserEditor } from '@/components/admin/AdminUserEditor';
import { useRequireAuth } from '@/hooks/useAuthRedirect';
import { Role } from '@/lib/types';

type RoleFilter = 'ALL' | Role;

export default function AdminUsersPage() {
  const t = useTranslations('admin');
  const locale = useLocale();
  const authorized = useRequireAuth('ADMIN');

  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const [u, c] = await Promise.all([
      api<AdminUserListItem[]>('/admin/users', {}, token),
      api<City[]>('/cities'),
    ]);
    setUsers(u.filter((x) => x.role !== 'ADMIN'));
    setCities(c);
  }, []);

  useEffect(() => {
    if (!authorized) return;
    void loadUsers();
  }, [authorized, loadUsers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (!q) return true;
      return (
        u.email.toLowerCase().includes(q) ||
        (u.name?.toLowerCase().includes(q) ?? false) ||
        (u.phone?.includes(q) ?? false)
      );
    });
  }, [users, roleFilter, search]);

  const roleTabs: { id: RoleFilter; label: string }[] = [
    { id: 'ALL', label: t('filterAll') },
    { id: 'CLIENT', label: t('filterClients') },
    { id: 'MASTER', label: t('filterMasters') },
  ];

  return (
    <AdminPageShell title={t('usersTitle')} subtitle={t('usersSubtitle')} showUnreadBanner={false}>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <div className="mb-3 flex flex-wrap gap-2">
            {roleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setRoleFilter(tab.id)}
                className={clsx(
                  'rounded-full px-3 py-1.5 text-sm font-medium transition',
                  roleFilter === tab.id
                    ? 'bg-brand-600 text-white'
                    : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <input
            className="input mb-3 text-sm"
            placeholder={t('searchUsers')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <ul className="max-h-[70vh] space-y-1 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1">
            {filtered.length === 0 && (
              <li className="px-3 py-6 text-center text-sm text-slate-400">{t('noUsers')}</li>
            )}
            {filtered.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(u.id)}
                  className={clsx(
                    'w-full rounded-lg px-3 py-2.5 text-left text-sm transition',
                    selectedId === u.id ? 'bg-brand-50 ring-1 ring-brand-200' : 'hover:bg-slate-50',
                    u.isBanned && 'opacity-60',
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-slate-900">{u.name || u.email}</span>
                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-slate-600">
                      {u.role}
                    </span>
                  </div>
                  <p className="truncate text-xs text-slate-500">{u.email}</p>
                  {u.phone && <p className="text-xs text-slate-500">{u.phone}</p>}
                  <p className="text-xs text-slate-400">
                    {getCityName(
                      findCityBySlug(
                        cities,
                        u.role === 'MASTER' ? u.masterProfile?.serviceArea ?? undefined : u.city ?? undefined,
                      ),
                      u.role === 'MASTER' ? u.masterProfile?.serviceArea ?? undefined : u.city ?? undefined,
                      locale,
                    )}
                    {u.isBanned && ` · ${t('bannedLabel')}`}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div className="lg:col-span-3">
          <AdminUserEditor userId={selectedId} cities={cities} onSaved={() => void loadUsers()} />
        </div>
      </div>
    </AdminPageShell>
  );
}
