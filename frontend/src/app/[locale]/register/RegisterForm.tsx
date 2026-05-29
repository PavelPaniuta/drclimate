'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { saveAuth, dashboardPath } from '@/lib/auth';
import { CitySelect } from '@/components/CitySelect';
import { AuthResponse, Role } from '@/lib/types';

export default function RegisterForm() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    phone: '',
    city: 'kyiv',
    role: 'CLIENT' as Role,
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const role = searchParams.get('role');
    if (role === 'MASTER' || role === 'CLIENT') {
      setForm((f) => ({ ...f, role }));
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api<AuthResponse>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      saveAuth(data.accessToken, data.user);
      router.push(dashboardPath(data.user.role, locale));
    } catch (err) {
      setError(err instanceof Error ? err.message : tc('error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <div className="card">
        <h1 className="mb-6 text-2xl font-bold">{t('registerTitle')}</h1>
        {error && <p className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{t('role')}</label>
            <select
              className="input"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value as Role })}
            >
              <option value="CLIENT">{t('roleClient')}</option>
              <option value="MASTER">{t('roleMaster')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('name')}</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('email')}</label>
            <input className="input" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('password')}</label>
            <input className="input" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required minLength={6} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('phone')}</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <CitySelect label={t('city')} value={form.city} onChange={(city) => setForm({ ...form, city })} required />
          <button type="submit" className="btn-primary w-full" disabled={loading}>
            {loading ? tc('loading') : tc('register')}
          </button>
        </form>
        <p className="mt-4 text-center text-sm text-slate-600">
          {t('hasAccount')}{' '}
          <Link href={`/${locale}/login`} className="text-brand-600 hover:underline">
            {tc('login')}
          </Link>
        </p>
      </div>
    </div>
  );
}
