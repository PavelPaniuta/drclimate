'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';
import { api } from '@/lib/api';
import { getToken, getStoredUser } from '@/lib/auth';
import { Order } from '@/lib/types';
import { City, findCityBySlug, getCityName } from '@/lib/cities';
import { StatusBadge } from '@/components/StatusBadge';
import { AdminOrderEditModal } from '@/components/admin/AdminOrderEditModal';
import { AdminPageShell } from '@/components/admin/AdminPageShell';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  name?: string;
  phone?: string;
  city?: string;
  isBanned: boolean;
}

const STATUS_ORDER = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default function AdminDashboard() {
  const t = useTranslations('admin');
  const ts = useTranslations('serviceType');
  const ta = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [allCities, setAllCities] = useState<City[]>([]);
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  useEffect(() => {
    const user = getStoredUser();
    const token = getToken();
    if (!user || user.role !== 'ADMIN' || !token) {
      router.push('/uk/login');
      return;
    }
    loadData(token);
  }, [router]);

  async function loadData(token: string) {
    const [u, o, c, cAll] = await Promise.all([
      api<AdminUser[]>('/admin/users', {}, token),
      api<Order[]>('/admin/orders', {}, token),
      api<City[]>('/cities'),
      api<City[]>('/cities/manage', {}, token),
    ]);
    setUsers(u);
    setOrders(o);
    setCities(c);
    setAllCities(cAll);
  }

  async function toggleBan(userId: string, isBanned: boolean) {
    const token = getToken();
    if (!token) return;
    await api(`/admin/users/${userId}/ban`, { method: 'PATCH', body: JSON.stringify({ isBanned: !isBanned }) }, token);
    loadData(token);
  }

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (cityFilter !== 'all' && o.city !== cityFilter) return false;
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      return true;
    });
  }, [orders, cityFilter, statusFilter]);

  const ordersByCity = useMemo(() => {
    const groups: Record<string, Order[]> = {};
    for (const o of filteredOrders) {
      if (!groups[o.city]) groups[o.city] = [];
      groups[o.city].push(o);
    }
    for (const key of Object.keys(groups)) {
      groups[key].sort((a, b) => STATUS_ORDER.indexOf(a.status) - STATUS_ORDER.indexOf(b.status));
    }
    return groups;
  }, [filteredOrders]);

  const cityKeys = useMemo(() => {
    return Object.keys(ordersByCity).sort((a, b) => {
      const ca = findCityBySlug(cities, a);
      const cb = findCityBySlug(cities, b);
      return (ca?.sortOrder ?? 99) - (cb?.sortOrder ?? 99);
    });
  }, [ordersByCity, cities]);

  const stats = useMemo(
    () => ({
      pending: orders.filter((o) => o.status === 'PENDING').length,
      active: orders.filter((o) => ['ACCEPTED', 'IN_PROGRESS'].includes(o.status)).length,
      completed: orders.filter((o) => o.status === 'COMPLETED').length,
    }),
    [orders],
  );

  return (
    <AdminPageShell title={t('title')}>
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        <div className="card border-l-4 border-l-amber-400">
          <p className="text-xs uppercase text-slate-500">{t('statPending')}</p>
          <p className="text-2xl font-bold text-amber-700">{stats.pending}</p>
        </div>
        <div className="card border-l-4 border-l-indigo-400">
          <p className="text-xs uppercase text-slate-500">{t('statActive')}</p>
          <p className="text-2xl font-bold text-indigo-700">{stats.active}</p>
        </div>
        <div className="card border-l-4 border-l-green-400">
          <p className="text-xs uppercase text-slate-500">{t('statCompleted')}</p>
          <p className="text-2xl font-bold text-green-700">{stats.completed}</p>
        </div>
      </div>

      <section className="mb-12">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">{t('orders')}</h2>
          <div className="flex flex-wrap gap-2">
            <select className="input w-auto text-sm" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
              <option value="all">{t('allCities')}</option>
              {allCities.filter((c) => c.isActive).map((c) => (
                <option key={c.slug} value={c.slug}>
                  {getCityName(c, c.slug, locale)}
                </option>
              ))}
            </select>
            <select className="input w-auto text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">{t('allStatuses')}</option>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {cityKeys.length === 0 && <p className="text-slate-500">—</p>}

        <div className="space-y-6">
          {cityKeys.map((citySlug) => {
            const cityOrders = ordersByCity[citySlug];
            const city = findCityBySlug(cities, citySlug);
            return (
              <div key={citySlug} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <div className="flex items-center justify-between bg-slate-50 px-4 py-3">
                  <h3 className="font-semibold text-brand-800">📍 {getCityName(city, citySlug, locale)}</h3>
                  <span className="rounded-full bg-white px-3 py-0.5 text-sm text-slate-600 shadow-sm">
                    {cityOrders.length} {t('ordersCount')}
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {cityOrders.map((order) => (
                    <div
                      key={order.id}
                      className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 hover:bg-slate-50/50"
                    >
                      <div
                        className="min-w-0 flex-1 cursor-pointer"
                        onClick={() => setEditingOrder(order)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && setEditingOrder(order)}
                      >
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="font-medium">{ts(order.serviceType as 'AC_REPAIR')}</span>
                          <StatusBadge status={order.status} />
                        </div>
                        <p className="line-clamp-1 text-sm text-slate-600">{order.description}</p>
                        <p className="text-xs text-slate-500">
                          {order.client?.name || order.client?.email} · {order.address}
                          {order.price != null ? ` · ${order.price} ₴` : ''}
                          {order.master
                            ? ` · ${t('assignedMaster')}: ${order.master.name}`
                            : ` · ${t('waitingMaster')}`}
                        </p>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary shrink-0 text-xs"
                        onClick={() => setEditingOrder(order)}
                      >
                        {t('editOrder')}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-lg font-semibold">{t('users')}</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="p-3">Email</th>
                <th className="p-3">{ta('name')}</th>
                <th className="p-3">Role</th>
                <th className="p-3">{ta('city')}</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b last:border-0">
                  <td className="p-3">{u.email}</td>
                  <td className="p-3">{u.name || '—'}</td>
                  <td className="p-3">{u.role}</td>
                  <td className="p-3">{getCityName(findCityBySlug(cities, u.city), u.city, locale)}</td>
                  <td className="p-3">
                    {u.role !== 'ADMIN' && (
                      <button
                        onClick={() => toggleBan(u.id, u.isBanned)}
                        className={clsx('text-sm', u.isBanned ? 'text-green-600' : 'text-red-600')}
                      >
                        {u.isBanned ? t('unban') : t('ban')}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {editingOrder && (
        <AdminOrderEditModal
          order={editingOrder}
          onClose={() => setEditingOrder(null)}
          onSaved={() => {
            const token = getToken();
            if (token) void loadData(token);
          }}
        />
      )}
    </AdminPageShell>
  );
}
