'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

export default function LandingPage() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <div>
      <section className="bg-gradient-to-br from-brand-700 to-brand-900 px-4 py-20 text-white">
        <div className="mx-auto max-w-4xl text-center">
          <p className="mb-2 text-brand-100">{t('common.tagline')}</p>
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">{t('landing.heroTitle')}</h1>
          <p className="mb-8 text-lg text-brand-100">{t('landing.heroSubtitle')}</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href={`/${locale}/register?role=CLIENT`} className="rounded-lg bg-white px-6 py-3 font-semibold text-brand-700 hover:bg-brand-50">
              {t('landing.ctaClient')}
            </Link>
            <Link href={`/${locale}/register?role=MASTER`} className="rounded-lg border-2 border-white px-6 py-3 font-semibold hover:bg-white/10">
              {t('landing.ctaMaster')}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="mb-10 text-center text-2xl font-bold">{t('landing.featuresTitle')}</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {[
            { title: t('landing.feature1Title'), desc: t('landing.feature1Desc') },
            { title: t('landing.feature2Title'), desc: t('landing.feature2Desc') },
            { title: t('landing.feature3Title'), desc: t('landing.feature3Desc') },
          ].map((f) => (
            <div key={f.title} className="card">
              <h3 className="mb-2 font-semibold text-brand-700">{f.title}</h3>
              <p className="text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-8 text-center text-2xl font-bold">{t('landing.servicesTitle')}</h2>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="card text-center">{t('landing.serviceAcInstall')}</div>
            <div className="card text-center">{t('landing.serviceAcRepair')}</div>
            <div className="card text-center">{t('landing.serviceAcMaint')}</div>
          </div>
          <p className="mt-8 text-center text-slate-500">
            {t('landing.futureTitle')}: {t('landing.futureElectric')}, {t('landing.futurePlumber')}, {t('landing.futureClean')}
          </p>
        </div>
      </section>
    </div>
  );
}
