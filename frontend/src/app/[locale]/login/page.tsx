'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const locale = useLocale();

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:py-12">
      <div className="card">
        <h1 className="mb-6 text-xl font-bold sm:text-2xl">{t('loginTitle')}</h1>
        <LoginForm />
        <p className="mt-4 text-center text-sm text-slate-600">
          {t('noAccount')}{' '}
          <Link href={`/${locale}/register`} className="text-brand-600 hover:underline">
            {tc('register')}
          </Link>
        </p>
      </div>
    </div>
  );
}
