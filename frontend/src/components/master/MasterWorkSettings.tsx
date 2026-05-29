'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { MasterProfileExtended } from '@/lib/master-types';
import { CitySelect } from '@/components/CitySelect';

interface Props {
  profile: MasterProfileExtended;
  onSaved: () => void;
}

export function MasterWorkSettings({ profile, onSaved }: Props) {
  const t = useTranslations('master');
  const ta = useTranslations('auth');
  const tc = useTranslations('common');
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    maxJobsPerDay: profile.maxJobsPerDay,
    workDayStart: profile.workDayStart,
    workDayEnd: profile.workDayEnd,
    serviceArea: profile.serviceArea,
  });
  const [saving, setSaving] = useState(false);

  async function save() {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    try {
      await Promise.all([
        api('/masters/work-settings', { method: 'PATCH', body: JSON.stringify({
          maxJobsPerDay: form.maxJobsPerDay,
          workDayStart: form.workDayStart,
          workDayEnd: form.workDayEnd,
        }) }, token),
        api('/masters/profile', { method: 'PATCH', body: JSON.stringify({ serviceArea: form.serviceArea }) }, token),
      ]);
      onSaved();
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="card">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-left"
      >
        <div>
          <h3 className="font-semibold">{t('workSettings')}</h3>
          <p className="text-sm text-slate-500">
            {t('jobsPerDay', { count: profile.maxJobsPerDay })} · {profile.workDayStart}:00–{profile.workDayEnd}:00
          </p>
        </div>
        <span className="text-brand-600">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-4 grid gap-4 border-t border-slate-100 pt-4 md:grid-cols-2">
          <CitySelect
            label={ta('city')}
            value={form.serviceArea}
            onChange={(serviceArea) => setForm({ ...form, serviceArea })}
            required
          />
          <div>
            <label className="mb-1 block text-sm font-medium">{t('maxJobsPerDay')}</label>
            <input
              type="number"
              min={1}
              max={10}
              className="input"
              value={form.maxJobsPerDay}
              onChange={(e) => setForm({ ...form, maxJobsPerDay: Number(e.target.value) })}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('workDayStart')}</label>
            <select className="input" value={form.workDayStart} onChange={(e) => setForm({ ...form, workDayStart: Number(e.target.value) })}>
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('workDayEnd')}</label>
            <select className="input" value={form.workDayEnd} onChange={(e) => setForm({ ...form, workDayEnd: Number(e.target.value) })}>
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h + 1} value={h + 1}>{String(h + 1).padStart(2, '0')}:00</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <button type="button" onClick={save} className="btn-primary" disabled={saving}>
              {saving ? tc('loading') : tc('save')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
