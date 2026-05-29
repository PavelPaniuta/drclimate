'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { RegisterFormFields } from '@/components/auth/RegisterFormFields';

export default function RegisterForm() {
  const t = useTranslations('auth');
  const tc = useTranslations('common');
  const locale = useLocale();

  return (
    <div className="mx-auto max-w-md px-4 py-8 sm:py-12">
      <div className="card">
        <h1 className="mb-6 text-xl font-bold sm:text-2xl">{t('registerTitle')}</h1>
        <Suspense fallback={<p className="text-center text-sm text-slate-500">{tc('loading')}</p>}>
          <RegisterFormFields />
        </Suspense>
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
