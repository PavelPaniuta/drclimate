'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { useTranslations, useLocale } from 'next-intl';
import clsx from 'clsx';
import { api, ApiError } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { CitySelect } from '@/components/CitySelect';
import { City, findCityBySlug, getCityName } from '@/lib/cities';
import { mediaUrl } from '@/lib/media';
import { AdminUserDetail, AdminUserUpdatePayload } from '@/lib/admin-users';

const SERVICE_TYPES = ['AC_INSTALLATION', 'AC_REPAIR', 'AC_MAINTENANCE'] as const;

type Props = {
  userId: string | null;
  cities: City[];
  onSaved: () => void;
};

export function AdminUserEditor({ userId, cities, onSaved }: Props) {
  const t = useTranslations('admin');
  const tm = useTranslations('master');
  const ta = useTranslations('auth');
  const tc = useTranslations('contacts');
  const ts = useTranslations('serviceType');
  const tcommon = useTranslations('common');
  const locale = useLocale();

  const [user, setUser] = useState<AdminUserDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    email: '',
    name: '',
    phone: '',
    address: '',
    telegram: '',
    city: '',
    isBanned: false,
    serviceArea: '',
    bio: '',
    skills: [] as string[],
    isOnline: false,
    maxJobsPerDay: 3,
    workDayStart: 9,
    workDayEnd: 18,
  });

  useEffect(() => {
    if (!userId) {
      setUser(null);
      return;
    }
    const token = getToken();
    if (!token) return;

    setLoading(true);
    setError('');
    api<AdminUserDetail>(`/admin/users/${userId}`, {}, token)
      .then((u) => {
        setUser(u);
        const mp = u.masterProfile;
        setForm({
          email: u.email,
          name: u.name || '',
          phone: u.phone || '',
          address: u.address || '',
          telegram: u.telegram || '',
          city: u.city || u.masterProfile?.serviceArea || '',
          isBanned: u.isBanned,
          serviceArea: mp?.serviceArea || '',
          bio: mp?.bio || '',
          skills: mp?.skills || [],
          isOnline: mp?.isOnline ?? false,
          maxJobsPerDay: mp?.maxJobsPerDay ?? 3,
          workDayStart: mp?.workDayStart ?? 9,
          workDayEnd: mp?.workDayEnd ?? 18,
        });
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : tcommon('error')))
      .finally(() => setLoading(false));
  }, [userId, tcommon]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    const token = getToken();
    if (!token) return;

    setSaving(true);
    setError('');
    setSaved(false);

    const payload: AdminUserUpdatePayload = {
      email: form.email,
      name: form.name,
      phone: form.phone,
      address: form.address,
      telegram: form.telegram,
      city: form.city,
      isBanned: form.isBanned,
    };

    if (user?.role === 'MASTER') {
      payload.masterProfile = {
        serviceArea: form.serviceArea,
        bio: form.bio,
        skills: form.skills,
        isOnline: form.isOnline,
        maxJobsPerDay: form.maxJobsPerDay,
        workDayStart: form.workDayStart,
        workDayEnd: form.workDayEnd,
      };
      payload.city = form.serviceArea;
    }

    try {
      const updated = await api<AdminUserDetail>(
        `/admin/users/${userId}`,
        { method: 'PATCH', body: JSON.stringify(payload) },
        token,
      );
      setUser(updated);
      setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tcommon('error'));
    } finally {
      setSaving(false);
    }
  }

  function toggleSkill(skill: string) {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill) ? f.skills.filter((s) => s !== skill) : [...f.skills, skill],
    }));
  }

  if (!userId) {
    return (
      <div className="card flex min-h-[320px] items-center justify-center text-sm text-slate-400">
        {t('selectUserToEdit')}
      </div>
    );
  }

  if (loading) {
    return <div className="card p-8 text-center text-slate-500">{tcommon('loading')}</div>;
  }

  if (!user) {
    return <div className="card p-8 text-center text-red-600">{error || tcommon('error')}</div>;
  }

  const avatar = mediaUrl(user.masterProfile?.avatarUrl);

  return (
    <form onSubmit={handleSave} className="card space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-lg font-semibold">{user.name || user.email}</h2>
          <p className="text-sm text-slate-500">
            {user.role}
            {user._count && (
              <>
                {' · '}
                {user.role === 'CLIENT'
                  ? t('ordersAsClient', { count: user._count.clientOrders })
                  : t('ordersAsMaster', { count: user._count.masterOrders })}
              </>
            )}
          </p>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.isBanned}
            onChange={(e) => setForm({ ...form, isBanned: e.target.checked })}
            className="rounded border-slate-300"
          />
          <span className={form.isBanned ? 'font-medium text-red-600' : 'text-slate-600'}>
            {t('bannedLabel')}
          </span>
        </label>
      </div>

      {saved && (
        <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{t('userSaved')}</p>
      )}
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-800">{t('userContactsSection')}</h3>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">{ta('email')}</label>
            <input
              className="input text-sm"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{ta('name')}</label>
            <input className="input text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{ta('phone')}</label>
            <input className="input text-sm" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{tc('address')}</label>
            <input className="input text-sm" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{tc('telegram')}</label>
            <input className="input text-sm" value={form.telegram} onChange={(e) => setForm({ ...form, telegram: e.target.value })} />
          </div>
          {user.role === 'CLIENT' && (
            <CitySelect
              label={ta('city')}
              value={form.city}
              onChange={(city) => setForm({ ...form, city })}
            />
          )}
        </div>
      </section>

      {user.role === 'MASTER' && (
        <section className="border-t border-slate-100 pt-4">
          <h3 className="mb-3 text-sm font-semibold text-slate-800">{t('masterCabinetSection')}</h3>

          {avatar && (
            <div className="mb-4 flex items-center gap-3">
              <div className="relative h-16 w-16 overflow-hidden rounded-xl bg-slate-200">
                <Image src={avatar} alt="" fill className="object-cover" sizes="64px" unoptimized />
              </div>
              <p className="text-xs text-slate-500">{t('avatarReadOnlyHint')}</p>
            </div>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <CitySelect
              label={t('workCity')}
              value={form.serviceArea}
              onChange={(serviceArea) => setForm({ ...form, serviceArea })}
            />
            <label className="flex items-center gap-2 self-end text-sm">
              <input
                type="checkbox"
                checked={form.isOnline}
                onChange={(e) => setForm({ ...form, isOnline: e.target.checked })}
                className="rounded border-slate-300"
              />
              {form.isOnline ? tcommon('online') : tcommon('offline')}
            </label>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium">{tm('bio')}</label>
              <textarea
                className="input min-h-[72px] text-sm"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <p className="mb-2 text-sm font-medium">{t('skillsLabel')}</p>
              <div className="flex flex-wrap gap-2">
                {SERVICE_TYPES.map((skill) => (
                  <button
                    key={skill}
                    type="button"
                    onClick={() => toggleSkill(skill)}
                    className={clsx(
                      'rounded-full px-3 py-1 text-xs font-medium transition',
                      form.skills.includes(skill)
                        ? 'bg-brand-600 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                    )}
                  >
                    {ts(skill)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{tm('maxJobsPerDay')}</label>
              <input
                type="number"
                min={1}
                max={10}
                className="input text-sm"
                value={form.maxJobsPerDay}
                onChange={(e) => setForm({ ...form, maxJobsPerDay: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{tm('workDayStart')}</label>
              <select
                className="input text-sm"
                value={form.workDayStart}
                onChange={(e) => setForm({ ...form, workDayStart: Number(e.target.value) })}
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h} value={h}>{String(h).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">{tm('workDayEnd')}</label>
              <select
                className="input text-sm"
                value={form.workDayEnd}
                onChange={(e) => setForm({ ...form, workDayEnd: Number(e.target.value) })}
              >
                {Array.from({ length: 24 }, (_, h) => (
                  <option key={h + 1} value={h + 1}>{String(h + 1).padStart(2, '0')}:00</option>
                ))}
              </select>
            </div>
          </div>

          {user.masterProfile?.workPhotos && user.masterProfile.workPhotos.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-sm font-medium">{tc('workPhotos')}</p>
              <div className="grid grid-cols-3 gap-2">
                {user.masterProfile.workPhotos.map((photo) => {
                  const src = mediaUrl(photo.url);
                  if (!src) return null;
                  return (
                    <div key={photo.id} className="relative aspect-[4/3] overflow-hidden rounded-lg bg-slate-100">
                      <Image src={src} alt={photo.caption || ''} fill className="object-cover" sizes="120px" unoptimized />
                    </div>
                  );
                })}
              </div>
              <p className="mt-1 text-xs text-slate-500">{t('workPhotosReadOnlyHint')}</p>
            </div>
          )}
        </section>
      )}

      <div className="flex gap-2 border-t border-slate-100 pt-4">
        <button type="submit" className="btn-primary text-sm" disabled={saving}>
          {saving ? tcommon('loading') : tcommon('save')}
        </button>
      </div>
    </form>
  );
}
