'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { CitySelect } from '@/components/CitySelect';
import { AdminNav } from './AdminNav';

const SERVICE_TYPES = ['AC_INSTALLATION', 'AC_REPAIR', 'AC_MAINTENANCE'] as const;

interface ClientOption {
  id: string;
  name?: string;
  email: string;
  role: string;
  isBanned: boolean;
}

export function AdminCreateOrderForm() {
  const t = useTranslations('admin');
  const ts = useTranslations('serviceType');
  const ta = useTranslations('auth');
  const tc = useTranslations('client');
  const locale = useLocale();
  const router = useRouter();
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    clientId: '',
    serviceType: 'AC_REPAIR',
    description: '',
    address: '',
    city: 'kyiv',
    preferredTime: '',
    price: '',
  });

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api<ClientOption[]>('/admin/users', {}, token).then((users) => {
      setClients(users.filter((u) => u.role === 'CLIENT' && !u.isBanned));
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token || !form.clientId) return;
    setSubmitting(true);
    try {
      const { price, ...rest } = form;
      await api('/admin/orders', {
        method: 'POST',
        body: JSON.stringify({
          ...rest,
          ...(price.trim() ? { price: Number(price) } : {}),
        }),
      }, token);
      router.push(`/${locale}/admin`);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 sm:py-8">
      <h1 className="mb-2 text-xl font-bold sm:text-2xl">{t('createOrder')}</h1>
      <p className="mb-4 text-sm text-slate-500">{t('createOrderHint')}</p>
      <AdminNav />

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">{t('selectClient')}</label>
          <select
            className="input"
            value={form.clientId}
            onChange={(e) => setForm({ ...form, clientId: e.target.value })}
            required
          >
            <option value="">{t('selectClient')}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name || c.email}
              </option>
            ))}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">{tc('serviceType')}</label>
            <select
              className="input"
              value={form.serviceType}
              onChange={(e) => setForm({ ...form, serviceType: e.target.value })}
            >
              {SERVICE_TYPES.map((st) => (
                <option key={st} value={st}>
                  {ts(st)}
                </option>
              ))}
            </select>
          </div>
          <CitySelect label={ta('city')} value={form.city} onChange={(city) => setForm({ ...form, city })} required />
        </div>
        <textarea
          className="input min-h-[100px]"
          placeholder={tc('description')}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          required
          minLength={10}
        />
        <input
          className="input"
          placeholder={tc('address')}
          value={form.address}
          onChange={(e) => setForm({ ...form, address: e.target.value })}
          required
        />
        <input
          className="input"
          type="datetime-local"
          value={form.preferredTime}
          onChange={(e) => setForm({ ...form, preferredTime: e.target.value })}
        />
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t('price')} <span className="font-normal text-slate-400">({t('priceOptional')})</span>
          </label>
          <input
            className="input"
            type="number"
            min={0}
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-primary" disabled={submitting}>
            {t('submitOrder')}
          </button>
          <button type="button" className="btn-secondary" onClick={() => router.push(`/${locale}/admin`)}>
            {t('cancelEdit')}
          </button>
        </div>
      </form>
    </div>
  );
}
