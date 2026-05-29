'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api, ApiError } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { ContactInfoCard } from '@/components/ContactInfoCard';
import { ContactPerson } from '@/lib/contacts';

type MeUser = ContactPerson & { email: string; role?: string };

export function ClientProfileSection() {
  const t = useTranslations('client');
  const tc = useTranslations('contacts');
  const ta = useTranslations('auth');
  const tcommon = useTranslations('common');
  const [user, setUser] = useState<MeUser | null>(null);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', telegram: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    const token = getToken();
    if (!token) return;
    const me = await api<MeUser>('/users/me', {}, token);
    setUser(me);
    setForm({
      name: me.name || '',
      phone: me.phone || '',
      address: me.address || '',
      telegram: me.telegram || '',
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const updated = await api<MeUser>(
        '/users/me',
        { method: 'PATCH', body: JSON.stringify(form) },
        token,
      );
      setUser(updated);
      setEditing(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : tcommon('error'));
    } finally {
      setSaving(false);
    }
  }

  if (!user) return null;

  return (
    <section className="mb-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold">{t('myProfile')}</h2>
          <p className="text-sm text-slate-500">{t('profileHint')}</p>
        </div>
        {!editing && (
          <button type="button" onClick={() => setEditing(true)} className="btn-secondary text-sm">
            {t('editProfile')}
          </button>
        )}
      </div>

      {saved && (
        <p className="mb-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{t('profileSaved')}</p>
      )}
      {error && <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {editing ? (
        <form onSubmit={handleSave} className="card space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{ta('name')}</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{ta('email')}</label>
            <input className="input bg-slate-50" value={user.email} disabled />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{ta('phone')}</label>
            <input className="input" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{tc('address')}</label>
            <input
              className="input"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder={t('addressPlaceholder')}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{tc('telegram')}</label>
            <input
              className="input"
              value={form.telegram}
              onChange={(e) => setForm({ ...form, telegram: e.target.value })}
              placeholder="@username"
            />
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary text-sm" disabled={saving}>
              {saving ? tcommon('loading') : tcommon('save')}
            </button>
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={() => {
                setEditing(false);
                setForm({
                  name: user.name || '',
                  phone: user.phone || '',
                  address: user.address || '',
                  telegram: user.telegram || '',
                });
              }}
            >
              {tcommon('cancel')}
            </button>
          </div>
        </form>
      ) : (
        <ContactInfoCard person={user} />
      )}
    </section>
  );
}
