'use client';

import { Suspense, useState } from 'react';
import { useTranslations } from 'next-intl';
import clsx from 'clsx';
import { LoginForm } from './LoginForm';
import { RegisterFormFields } from './RegisterFormFields';

type AuthTab = 'login' | 'register';

export function HomeAuth() {
  const t = useTranslations('home');
  const tc = useTranslations('common');
  const [tab, setTab] = useState<AuthTab>('login');

  return (
    <div className="flex min-h-[calc(100vh-65px)] flex-col items-center justify-center px-4 py-8 sm:py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-brand-700 sm:text-4xl">{tc('appName')}</h1>
        <p className="mt-2 text-sm text-slate-500 sm:text-base">{t('subtitle')}</p>
      </div>

      <div className="w-full max-w-md">
        <div className="card p-0 overflow-hidden">
          <div className="grid grid-cols-2 border-b border-slate-200">
            <button
              type="button"
              onClick={() => setTab('login')}
              className={clsx(
                'py-3 text-sm font-medium transition',
                tab === 'login' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50',
              )}
            >
              {tc('login')}
            </button>
            <button
              type="button"
              onClick={() => setTab('register')}
              className={clsx(
                'py-3 text-sm font-medium transition',
                tab === 'register' ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50',
              )}
            >
              {tc('register')}
            </button>
          </div>
          <div className="p-5 sm:p-6">
            {tab === 'login' ? (
              <LoginForm onSwitchToRegister={() => setTab('register')} />
            ) : (
              <Suspense fallback={<p className="text-center text-sm text-slate-500">{tc('loading')}</p>}>
                <RegisterFormFields onSwitchToLogin={() => setTab('login')} />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
