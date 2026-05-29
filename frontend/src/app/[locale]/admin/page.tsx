'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import clsx from 'clsx';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { Order } from '@/lib/types';
import { City, findCityBySlug, getCityName } from '@/lib/cities';
import { StatusBadge } from '@/components/StatusBadge';
import { AdminOrderEditModal } from '@/components/admin/AdminOrderEditModal';
import { AdminPageShell } from '@/components/admin/AdminPageShell';
import { ORDER_STATUS_SORT_ORDER } from '@/lib/order-status';
import { useRequireAuth } from '@/hooks/useAuthRedirect';

export default function AdminDashboard() {
  const t = useTranslations('admin');
  const tStatus = useTranslations('orderStatus');
  const ts = useTranslations('serviceType');
  const locale = useLocale();
  const [orders, setOrders] = useState<Order[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [allCities, setAllCities] = useState<City[]>([]);
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const authorized = useRequireAuth('ADMIN');

  useEffect(() => {
    if (!authorized) return;
    const token = getToken();
    if (!token) return;
    loadData(token);
  }, [authorized]);

  async function loadData(token: string) {
    const [o, c, cAll] = await Promise.all([
      api<Order[]>('/admin/orders', {}, token),
      api<City[]>('/cities'),
      api<City[]>('/cities/manage', {}, token),
    ]);
    setOrders(o);
    setCities(c);
    setAllCities(cAll);
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
      groups[key].sort(
        (a, b) =>
          ORDER_STATUS_SORT_ORDER.indexOf(a.status as (typeof ORDER_STATUS_SORT_ORDER)[number]) -
          ORDER_STATUS_SORT_ORDER.indexOf(b.status as (typeof ORDER_STATUS_SORT_ORDER)[number]),
      );
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
              {ORDER_STATUS_SORT_ORDER.map((s) => (
                <option key={s} value={s}>
                  {tStatus(s)}
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

      <section className="card flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{t('users')}</h2>
          <p className="mt-1 text-sm text-slate-500">{t('usersOverviewHint')}</p>
        </div>
        <Link href={`/${locale}/admin/users`} className="btn-primary text-sm">
          {t('manageUsers')}
        </Link>
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
