'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { api, ApiError } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { mediaUrl, uploadWithAuth } from '@/lib/media';

type MasterProfileApi = {
  id: string;
  avatarUrl?: string | null;
  bio?: string | null;
  user: {
    id: string;
    name?: string | null;
    email: string;
    phone?: string | null;
    address?: string | null;
    telegram?: string | null;
    city?: string | null;
  };
  workPhotos: { id: string; url: string; caption?: string | null }[];
};

type Props = {
  onSaved?: () => void;
};

export function MasterProfileEditor({ onSaved }: Props) {
  const t = useTranslations('master');
  const tc = useTranslations('contacts');
  const ta = useTranslations('auth');
  const tcommon = useTranslations('common');
  const [profile, setProfile] = useState<MasterProfileApi | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', address: '', telegram: '', bio: '' });
  const [photoCaption, setPhotoCaption] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const p = await api<MasterProfileApi>('/masters/profile', {}, token);
    setProfile(p);
    setForm({
      name: p.user.name || '',
      phone: p.user.phone || '',
      address: p.user.address || '',
      telegram: p.user.telegram || '',
      bio: p.bio || '',
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function saveContacts(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setError('');
    try {
      await api('/masters/profile', {
        method: 'PATCH',
        body: JSON.stringify(form),
      }, token);
      await load();
      onSaved?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tcommon('error'));
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatar(file: File) {
    const token = getToken();
    if (!token) return;
    setUploading(true);
    setError('');
    try {
      const updated = await uploadWithAuth<MasterProfileApi>('/masters/profile/avatar', file, token);
      setProfile(updated);
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : tcommon('error'));
    } finally {
      setUploading(false);
    }
  }

  async function handleWorkPhoto(file: File) {
    const token = getToken();
    if (!token) return;
    setUploading(true);
    setError('');
    try {
      const updated = await uploadWithAuth<MasterProfileApi>(
        '/masters/profile/work-photos',
        file,
        token,
        photoCaption ? { caption: photoCaption } : undefined,
      );
      setProfile(updated);
      setPhotoCaption('');
      if (photoInputRef.current) photoInputRef.current.value = '';
      onSaved?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : tcommon('error'));
    } finally {
      setUploading(false);
    }
  }

  async function removePhoto(photoId: string) {
    const token = getToken();
    if (!token) return;
    setUploading(true);
    try {
      const updated = await api<MasterProfileApi>(
        `/masters/profile/work-photos/${photoId}`,
        { method: 'DELETE' },
        token,
      );
      setProfile(updated);
      onSaved?.();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tcommon('error'));
    } finally {
      setUploading(false);
    }
  }

  if (!profile) return null;

  const avatar = mediaUrl(profile.avatarUrl);

  return (
    <div className="card space-y-5">
      <div>
        <h3 className="font-semibold text-slate-900">{t('profileSection')}</h3>
        <p className="mt-1 text-sm text-slate-500">{t('profileSectionHint')}</p>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-slate-200">
          {avatar ? (
            <Image src={avatar} alt="" fill className="object-cover" sizes="96px" unoptimized />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-3xl text-slate-400">👤</span>
          )}
        </div>
        <div>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleAvatar(f);
            }}
          />
          <button
            type="button"
            disabled={uploading}
            onClick={() => avatarInputRef.current?.click()}
            className="btn-secondary text-sm"
          >
            {uploading ? tcommon('loading') : t('uploadAvatar')}
          </button>
          <p className="mt-1 text-xs text-slate-500">{t('avatarHint')}</p>
        </div>
      </div>

      <form onSubmit={saveContacts} className="space-y-3 border-t border-slate-100 pt-4">
        <div>
          <label className="mb-1 block text-sm font-medium">{ta('name')}</label>
          <input className="input text-sm" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{ta('email')}</label>
          <input className="input bg-slate-50 text-sm" value={profile.user.email} disabled />
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
          <input className="input text-sm" value={form.telegram} onChange={(e) => setForm({ ...form, telegram: e.target.value })} placeholder="@username" />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">{t('bio')}</label>
          <textarea
            className="input min-h-[72px] text-sm"
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            placeholder={t('bioPlaceholder')}
          />
        </div>
        <button type="submit" className="btn-primary text-sm" disabled={saving}>
          {saving ? tcommon('loading') : tcommon('save')}
        </button>
      </form>

      <div className="border-t border-slate-100 pt-4">
        <h4 className="mb-2 text-sm font-semibold">{tc('workPhotos')}</h4>
        <p className="mb-3 text-xs text-slate-500">{t('workPhotosHint')}</p>

        {profile.workPhotos.length > 0 && (
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {profile.workPhotos.map((photo) => {
              const src = mediaUrl(photo.url);
              if (!src) return null;
              return (
                <div key={photo.id} className="group relative overflow-hidden rounded-lg border border-slate-200">
                  <div className="relative aspect-[4/3] bg-slate-100">
                    <Image src={src} alt={photo.caption || ''} fill className="object-cover" sizes="160px" unoptimized />
                  </div>
                  {photo.caption && <p className="px-2 py-1 text-xs text-slate-600">{photo.caption}</p>}
                  <button
                    type="button"
                    disabled={uploading}
                    onClick={() => void removePhoto(photo.id)}
                    className="absolute right-1 top-1 rounded bg-black/60 px-2 py-0.5 text-xs text-white opacity-0 transition group-hover:opacity-100"
                  >
                    ✕
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <input
            className="input flex-1 text-sm"
            value={photoCaption}
            onChange={(e) => setPhotoCaption(e.target.value)}
            placeholder={t('workPhotoCaption')}
          />
          <input
            ref={photoInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleWorkPhoto(f);
            }}
          />
          <button
            type="button"
            disabled={uploading || profile.workPhotos.length >= 12}
            onClick={() => photoInputRef.current?.click()}
            className="btn-secondary shrink-0 text-sm"
          >
            {t('addWorkPhoto')}
          </button>
        </div>
      </div>
    </div>
  );
}
