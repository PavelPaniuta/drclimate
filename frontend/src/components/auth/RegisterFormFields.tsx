'use client';

import { useState, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { saveAuth, dashboardPath } from '@/lib/auth';
import { CitySelect } from '@/components/CitySelect';
import { AuthResponse, Role } from '@/lib/types';

type RegisterFormFieldsProps = {
  onSwitchToLogin?: () => void;
};

export function RegisterFormFields({ onSwitchToLogin }: RegisterFormFieldsProps) {
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
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
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
        <input
          className="input"
          type="email"
          autoComplete="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t('password')}</label>
        <input
          className="input"
          type="password"
          autoComplete="new-password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          minLength={6}
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t('phone')}</label>
        <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
      </div>
      <CitySelect label={t('city')} value={form.city} onChange={(city) => setForm({ ...form, city })} required />
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? tc('loading') : tc('register')}
      </button>
      {onSwitchToLogin && (
        <p className="text-center text-sm text-slate-600">
          {t('hasAccount')}{' '}
          <button type="button" onClick={onSwitchToLogin} className="font-medium text-brand-600 hover:underline">
            {tc('login')}
          </button>
        </p>
      )}
    </form>
  );
}
