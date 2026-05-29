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
import { CitySelect } from '@/components/CitySelect';

interface AdminUser {
  id: string;
  email: string;
  role: string;
  name?: string;
  phone?: string;
  city?: string;
  isBanned: boolean;
  masterProfile?: { isOnline: boolean; serviceArea: string };
}

const SERVICE_TYPES = ['AC_INSTALLATION', 'AC_REPAIR', 'AC_MAINTENANCE'] as const;
const STATUS_ORDER = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];

export default function AdminDashboard() {
  const t = useTranslations('admin');
  const ts = useTranslations('serviceType');
  const ta = useTranslations('auth');
  const tc = useTranslations('client');
  const locale = useLocale();
  const router = useRouter();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [allCities, setAllCities] = useState<City[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [form, setForm] = useState({
    clientId: '',
    serviceType: 'AC_REPAIR',
    description: '',
    address: '',
    city: 'kyiv',
    preferredTime: '',
    price: '',
  });
  const [newCity, setNewCity] = useState({ slug: '', nameUk: '', nameRu: '', nameEn: '' });
  const [cityEdits, setCityEdits] = useState<Record<string, { nameUk: string; nameRu: string; nameEn: string }>>({});

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
    setCityEdits(
      Object.fromEntries(
        cAll.map((city) => [city.slug, { nameUk: city.nameUk, nameRu: city.nameRu, nameEn: city.nameEn }]),
      ),
    );
  }

  async function toggleBan(userId: string, isBanned: boolean) {
    const token = getToken();
    if (!token) return;
    await api(`/admin/users/${userId}/ban`, { method: 'PATCH', body: JSON.stringify({ isBanned: !isBanned }) }, token);
    loadData(token);
  }

  async function createOrder(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token || !form.clientId) return;
    setSubmitting(true);
    try {
      const { price, ...rest } = form;
      const payload = {
        ...rest,
        ...(price.trim() ? { price: Number(price) } : {}),
      };
      await api('/admin/orders', { method: 'POST', body: JSON.stringify(payload) }, token);
      setForm((f) => ({ ...f, description: '', address: '', preferredTime: '', price: '' }));
      loadData(token);
    } finally {
      setSubmitting(false);
    }
  }

  async function addCity(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setSubmitting(true);
    try {
      await api('/cities', { method: 'POST', body: JSON.stringify(newCity) }, token);
      setNewCity({ slug: '', nameUk: '', nameRu: '', nameEn: '' });
      loadData(token);
    } finally {
      setSubmitting(false);
    }
  }

  async function saveCity(slug: string) {
    const token = getToken();
    const edit = cityEdits[slug];
    if (!token || !edit) return;
    setSubmitting(true);
    try {
      await api(`/cities/${slug}`, { method: 'PATCH', body: JSON.stringify(edit) }, token);
      loadData(token);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleCityActive(slug: string, isActive: boolean) {
    const token = getToken();
    if (!token) return;
    setSubmitting(true);
    try {
      await api(`/cities/${slug}`, { method: 'PATCH', body: JSON.stringify({ isActive: !isActive }) }, token);
      loadData(token);
    } finally {
      setSubmitting(false);
    }
  }

  const clients = users.filter((u) => u.role === 'CLIENT' && !u.isBanned);

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

  const stats = useMemo(() => ({
    pending: orders.filter((o) => o.status === 'PENDING').length,
    active: orders.filter((o) => ['ACCEPTED', 'IN_PROGRESS'].includes(o.status)).length,
    completed: orders.filter((o) => o.status === 'COMPLETED').length,
  }), [orders]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <h1 className="mb-6 text-xl font-bold sm:mb-8 sm:text-2xl">{t('title')}</h1>

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

      <div className="mb-12 grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">{t('createOrder')}</h2>
          <p className="mb-4 text-sm text-slate-500">{t('createOrderHint')}</p>
          <form onSubmit={createOrder} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium">{t('selectClient')}</label>
              <select className="input" value={form.clientId} onChange={(e) => setForm({ ...form, clientId: e.target.value })} required>
                <option value="">{t('selectClient')}</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name || c.email}</option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">{tc('serviceType')}</label>
                <select className="input" value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value })}>
                  {SERVICE_TYPES.map((st) => <option key={st} value={st}>{ts(st)}</option>)}
                </select>
              </div>
              <CitySelect label={ta('city')} value={form.city} onChange={(city) => setForm({ ...form, city })} required />
            </div>
            <textarea className="input min-h-[80px]" placeholder={tc('description')} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required minLength={10} />
            <input className="input" placeholder={tc('address')} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
            <input className="input" type="datetime-local" value={form.preferredTime} onChange={(e) => setForm({ ...form, preferredTime: e.target.value })} />
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t('price')} <span className="font-normal text-slate-400">({t('priceOptional')})</span>
              </label>
              <input
                className="input"
                type="number"
                min={0}
                step="0.01"
                placeholder="0"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
              />
            </div>
            <button type="submit" className="btn-primary w-full sm:w-auto" disabled={submitting}>{t('submitOrder')}</button>
          </form>
        </div>

        <div className="card">
          <h2 className="mb-4 text-lg font-semibold">{t('addCity')}</h2>
          <p className="mb-4 text-sm text-slate-500">{t('addCityHint')}</p>
          <form onSubmit={addCity} className="space-y-3">
            <input className="input" placeholder="slug (kyiv)" value={newCity.slug} onChange={(e) => setNewCity({ ...newCity, slug: e.target.value.toLowerCase() })} required />
            <input className="input" placeholder="Українська" value={newCity.nameUk} onChange={(e) => setNewCity({ ...newCity, nameUk: e.target.value })} required />
            <input className="input" placeholder="Русский" value={newCity.nameRu} onChange={(e) => setNewCity({ ...newCity, nameRu: e.target.value })} required />
            <input className="input" placeholder="English" value={newCity.nameEn} onChange={(e) => setNewCity({ ...newCity, nameEn: e.target.value })} required />
            <button type="submit" className="btn-secondary" disabled={submitting}>{t('addCityBtn')}</button>
          </form>
          <div className="mt-6 max-h-[420px] space-y-3 overflow-y-auto">
            {allCities.map((c) => {
              const edit = cityEdits[c.slug];
              if (!edit) return null;
              return (
                <div
                  key={c.slug}
                  className={clsx(
                    'rounded-lg border p-3',
                    c.isActive ? 'border-slate-200 bg-slate-50' : 'border-slate-200 bg-slate-100 opacity-75',
                  )}
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-mono text-slate-500">{c.slug}</span>
                    <span className={clsx('text-xs', c.isActive ? 'text-green-600' : 'text-slate-500')}>
                      {c.isActive ? t('cityActive') : t('cityInactive')}
                    </span>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-3">
                    <input
                      className="input text-sm"
                      value={edit.nameUk}
                      onChange={(e) =>
                        setCityEdits((prev) => ({ ...prev, [c.slug]: { ...edit, nameUk: e.target.value } }))
                      }
                    />
                    <input
                      className="input text-sm"
                      value={edit.nameRu}
                      onChange={(e) =>
                        setCityEdits((prev) => ({ ...prev, [c.slug]: { ...edit, nameRu: e.target.value } }))
                      }
                    />
                    <input
                      className="input text-sm"
                      value={edit.nameEn}
                      onChange={(e) =>
                        setCityEdits((prev) => ({ ...prev, [c.slug]: { ...edit, nameEn: e.target.value } }))
                      }
                    />
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button type="button" className="btn-secondary text-xs" disabled={submitting} onClick={() => saveCity(c.slug)}>
                      {t('editCity')}
                    </button>
                    <button
                      type="button"
                      className={clsx('text-xs', c.isActive ? 'text-red-600' : 'text-green-600')}
                      disabled={submitting}
                      onClick={() => toggleCityActive(c.slug, c.isActive)}
                    >
                      {c.isActive ? t('deactivateCity') : t('activateCity')}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <section className="mb-12">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">{t('orders')}</h2>
          <div className="flex flex-wrap gap-2">
            <select className="input w-auto text-sm" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}>
              <option value="all">{t('allCities')}</option>
              {allCities.filter((c) => c.isActive).map((c) => (
                <option key={c.slug} value={c.slug}>{getCityName(c, c.slug, locale)}</option>
              ))}
            </select>
            <select className="input w-auto text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">{t('allStatuses')}</option>
              {STATUS_ORDER.map((s) => (
                <option key={s} value={s}>{s}</option>
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
                  <h3 className="font-semibold text-brand-800">
                    📍 {getCityName(city, citySlug, locale)}
                  </h3>
                  <span className="rounded-full bg-white px-3 py-0.5 text-sm text-slate-600 shadow-sm">
                    {cityOrders.length} {t('ordersCount')}
                  </span>
                </div>
                <div className="divide-y divide-slate-100">
                  {cityOrders.map((order) => (
                    <div key={order.id} className="flex flex-wrap items-start justify-between gap-3 px-4 py-3 hover:bg-slate-50/50">
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex flex-wrap items-center gap-2">
                          <span className="font-medium">{ts(order.serviceType as 'AC_REPAIR')}</span>
                          <StatusBadge status={order.status} />
                        </div>
                        <p className="text-sm text-slate-600 line-clamp-1">{order.description}</p>
                        <p className="text-xs text-slate-500">
                          {order.client?.name || order.client?.email} · {order.address}
                          {order.price != null ? ` · ${order.price} ₴` : ''}
                          {order.master ? ` · ${t('assignedMaster')}: ${order.master.name}` : ` · ${t('waitingMaster')}`}
                        </p>
                      </div>
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
                      <button onClick={() => toggleBan(u.id, u.isBanned)} className={clsx('text-sm', u.isBanned ? 'text-green-600' : 'text-red-600')}>
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
    </div>
  );
}
