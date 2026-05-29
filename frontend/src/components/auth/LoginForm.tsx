'use client';

import { useState } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { saveAuth, dashboardPath } from '@/lib/auth';
import { AuthResponse } from '@/lib/types';

type LoginFormProps = {
  compact?: boolean;
  onSwitchToRegister?: () => void;
};

export function LoginForm({ compact, onSwitchToRegister }: LoginFormProps) {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const locale = useLocale();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const data = await api<AuthResponse>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      saveAuth(data.accessToken, data.user);
      router.push(dashboardPath(data.user.role, locale));
    } catch {
      setError(t('loginError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
      <div>
        <label className="mb-1 block text-sm font-medium">{t('email')}</label>
        <input
          className="input"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium">{t('password')}</label>
        <input
          className="input"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <button type="submit" className="btn-primary w-full" disabled={loading}>
        {loading ? tc('loading') : tc('login')}
      </button>
      {onSwitchToRegister && (
        <p className="text-center text-sm text-slate-600">
          {t('noAccount')}{' '}
          <button type="button" onClick={onSwitchToRegister} className="font-medium text-brand-600 hover:underline">
            {tc('register')}
          </button>
        </p>
      )}
      {!compact && !onSwitchToRegister && null}
    </form>
  );
}
