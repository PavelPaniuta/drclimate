'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import clsx from 'clsx';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { City } from '@/lib/cities';
import { AdminPageShell } from './AdminPageShell';

export function AdminCitiesManager() {
  const t = useTranslations('admin');
  const [allCities, setAllCities] = useState<City[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [newCity, setNewCity] = useState({ slug: '', nameUk: '', nameRu: '', nameEn: '' });
  const [cityEdits, setCityEdits] = useState<Record<string, { nameUk: string; nameRu: string; nameEn: string }>>({});

  async function loadCities() {
    const token = getToken();
    if (!token) return;
    const data = await api<City[]>('/cities/manage', {}, token);
    setAllCities(data);
    setCityEdits(
      Object.fromEntries(data.map((city) => [city.slug, { nameUk: city.nameUk, nameRu: city.nameRu, nameEn: city.nameEn }])),
    );
  }

  useEffect(() => {
    void loadCities();
  }, []);

  async function addCity(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setSubmitting(true);
    try {
      await api('/cities', { method: 'POST', body: JSON.stringify(newCity) }, token);
      setNewCity({ slug: '', nameUk: '', nameRu: '', nameEn: '' });
      await loadCities();
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
      await loadCities();
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
      await loadCities();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AdminPageShell title={t('addCity')} subtitle={t('addCityHint')} maxWidth="4xl">
      <div className="card mb-6">
        <h2 className="mb-4 text-lg font-semibold">{t('addCityBtn')}</h2>
        <form onSubmit={addCity} className="grid gap-3 sm:grid-cols-2">
          <input
            className="input sm:col-span-2"
            placeholder="slug (kyiv)"
            value={newCity.slug}
            onChange={(e) => setNewCity({ ...newCity, slug: e.target.value.toLowerCase() })}
            required
          />
          <input
            className="input"
            placeholder="Українська"
            value={newCity.nameUk}
            onChange={(e) => setNewCity({ ...newCity, nameUk: e.target.value })}
            required
          />
          <input
            className="input"
            placeholder="Русский"
            value={newCity.nameRu}
            onChange={(e) => setNewCity({ ...newCity, nameRu: e.target.value })}
            required
          />
          <input
            className="input sm:col-span-2"
            placeholder="English"
            value={newCity.nameEn}
            onChange={(e) => setNewCity({ ...newCity, nameEn: e.target.value })}
            required
          />
          <button type="submit" className="btn-primary sm:col-span-2" disabled={submitting}>
            {t('addCityBtn')}
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {allCities.map((c) => {
          const edit = cityEdits[c.slug];
          if (!edit) return null;
          return (
            <div
              key={c.slug}
              className={clsx('card', !c.isActive && 'opacity-75')}
            >
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-sm text-slate-500">{c.slug}</span>
                <span className={clsx('text-xs', c.isActive ? 'text-green-600' : 'text-slate-500')}>
                  {c.isActive ? t('cityActive') : t('cityInactive')}
                </span>
              </div>
              <div className="grid gap-2 sm:grid-cols-3">
                <input
                  className="input text-sm"
                  value={edit.nameUk}
                  onChange={(e) => setCityEdits((prev) => ({ ...prev, [c.slug]: { ...edit, nameUk: e.target.value } }))}
                />
                <input
                  className="input text-sm"
                  value={edit.nameRu}
                  onChange={(e) => setCityEdits((prev) => ({ ...prev, [c.slug]: { ...edit, nameRu: e.target.value } }))}
                />
                <input
                  className="input text-sm"
                  value={edit.nameEn}
                  onChange={(e) => setCityEdits((prev) => ({ ...prev, [c.slug]: { ...edit, nameEn: e.target.value } }))}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className="btn-secondary text-sm" disabled={submitting} onClick={() => saveCity(c.slug)}>
                  {t('editCity')}
                </button>
                <button
                  type="button"
                  className={clsx('text-sm', c.isActive ? 'text-red-600' : 'text-green-600')}
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
    </AdminPageShell>
  );
}
