'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { getToken } from '@/lib/auth';
import { Order, OrderAuditEntry } from '@/lib/types';
import { StatusBadge } from '@/components/StatusBadge';

const STATUSES = ['PENDING', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;

type Props = {
  order: Order;
  onClose: () => void;
  onSaved: () => void;
};

export function AdminOrderEditModal({ order, onClose, onSaved }: Props) {
  const t = useTranslations('admin');
  const tc = useTranslations('client');
  const [address, setAddress] = useState(order.address);
  const [price, setPrice] = useState(order.price != null ? String(order.price) : '');
  const [status, setStatus] = useState(order.status);
  const [audit, setAudit] = useState<OrderAuditEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api<OrderAuditEntry[]>(`/admin/orders/${order.id}/audit`, {}, token).then(setAudit);
  }, [order.id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const token = getToken();
    if (!token) return;
    setSaving(true);
    setError('');
    try {
      const body: { address?: string; status?: string; price?: number } = {
        address,
        status,
      };
      if (price.trim()) body.price = Number(price);
      await api(`/admin/orders/${order.id}`, { method: 'PATCH', body: JSON.stringify(body) }, token);
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div className="card max-h-[90vh] w-full max-w-lg overflow-y-auto">
        <div className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold">{t('editOrder')}</h3>
            <StatusBadge status={order.status} />
          </div>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        {error && <p className="mb-3 rounded-lg bg-red-50 p-2 text-sm text-red-700">{error}</p>}

        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">{tc('address')}</label>
            <input className="input" value={address} onChange={(e) => setAddress(e.target.value)} required />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{t('price')}</label>
            <input
              className="input"
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={t('priceOptional')}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">{tc('status')}</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="btn-primary flex-1" disabled={saving}>
              {saving ? '...' : t('saveOrder')}
            </button>
            <button type="button" className="btn-secondary" onClick={onClose}>
              {t('cancelEdit')}
            </button>
          </div>
        </form>

        <div className="mt-6 border-t border-slate-100 pt-4">
          <h4 className="mb-2 text-sm font-semibold text-slate-700">{t('auditLog')}</h4>
          <div className="max-h-40 space-y-2 overflow-y-auto text-xs text-slate-600">
            {audit.length === 0 && <p>—</p>}
            {audit.map((entry) => (
              <div key={entry.id} className="rounded bg-slate-50 p-2">
                <span className="font-medium">{entry.action}</span>
                {' · '}
                {entry.user.name || entry.user.email}
                <br />
                <span className="text-slate-400">{new Date(entry.createdAt).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
