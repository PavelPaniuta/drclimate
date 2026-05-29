'use client';

import clsx from 'clsx';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import {
  MaterialLine,
  OrderSettlement,
  SettlementFormData,
  calculateSettlementPreview,
  emptyMaterialLine,
  emptySettlementForm,
} from '@/lib/settlement';

interface Props {
  form?: SettlementFormData;
  onChange?: (form: SettlementFormData) => void;
  readOnly?: OrderSettlement;
}

function money(value: number) {
  return `${value.toLocaleString('uk-UA', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ₴`;
}

export function OrderSettlementPanel({ form = emptySettlementForm(), onChange = () => {}, readOnly }: Props) {
  const t = useTranslations('master');

  const preview = useMemo(() => {
    if (readOnly) {
      return {
        clientPaid: readOnly.clientPaid,
        transportCost: readOnly.transportCost,
        otherCosts: readOnly.otherCosts,
        materialsCost: readOnly.materialsCost,
        totalExpenses: readOnly.totalExpenses,
        netProfit: readOnly.netProfit,
      };
    }
    return calculateSettlementPreview(form);
  }, [form, readOnly]);

  function updateMaterial(index: number, patch: Partial<MaterialLine>) {
    const materials = form.materials.map((m, i) => (i === index ? { ...m, ...patch } : m));
    onChange({ ...form, materials });
  }

  if (readOnly) {
    return (
      <div className="space-y-4 rounded-xl border border-green-200 bg-green-50/50 p-4">
        <h3 className="text-sm font-semibold text-slate-800">{t('settlementTitle')}</h3>

        {readOnly.expenseItems.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium uppercase text-slate-500">{t('materialsUsed')}</p>
            <ul className="space-y-1 text-sm">
              {readOnly.expenseItems.map((item) => (
                <li key={item.id} className="flex justify-between gap-2 text-slate-700">
                  <span>{item.name} × {item.quantity}</span>
                  <span className="font-medium">{money(item.totalPrice)}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between sm:block">
            <dt className="text-slate-500">{t('clientPaid')}</dt>
            <dd className="font-semibold text-slate-900">{money(readOnly.clientPaid)}</dd>
          </div>
          <div className="flex justify-between sm:block">
            <dt className="text-slate-500">{t('materialsCost')}</dt>
            <dd className="font-medium text-red-700">−{money(readOnly.materialsCost)}</dd>
          </div>
          <div className="flex justify-between sm:block">
            <dt className="text-slate-500">{t('transportCost')}</dt>
            <dd className="font-medium text-red-700">−{money(readOnly.transportCost)}</dd>
          </div>
          <div className="flex justify-between sm:block">
            <dt className="text-slate-500">{t('otherCosts')}</dt>
            <dd className="font-medium text-red-700">−{money(readOnly.otherCosts)}</dd>
          </div>
        </dl>

        <div className="border-t border-green-200 pt-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">{t('totalExpenses')}</span>
            <span className="font-semibold text-red-700">−{money(readOnly.totalExpenses)}</span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-semibold text-slate-800">{t('netProfit')}</span>
            <span className={clsx('text-lg font-bold', readOnly.netProfit >= 0 ? 'text-green-700' : 'text-red-700')}>
              {money(readOnly.netProfit)}
            </span>
          </div>
        </div>

        {readOnly.notes && (
          <p className="text-sm text-slate-600"><span className="font-medium">{t('settlementNotes')}:</span> {readOnly.notes}</p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div>
        <h3 className="text-sm font-semibold text-slate-800">{t('settlementTitle')}</h3>
        <p className="mt-1 text-xs text-slate-500">{t('settlementHint')}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">{t('clientPaid')}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input text-sm"
            value={form.clientPaid}
            onChange={(e) => onChange({ ...form, clientPaid: e.target.value })}
            placeholder="0"
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">{t('transportCost')}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input text-sm"
            value={form.transportCost}
            onChange={(e) => onChange({ ...form, transportCost: e.target.value })}
          />
        </label>
        <label className="block">
          <span className="mb-1 block text-xs font-medium text-slate-600">{t('otherCosts')}</span>
          <input
            type="number"
            min="0"
            step="0.01"
            className="input text-sm"
            value={form.otherCosts}
            onChange={(e) => onChange({ ...form, otherCosts: e.target.value })}
          />
        </label>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <p className="text-xs font-medium uppercase text-slate-500">{t('materialsUsed')}</p>
          <button
            type="button"
            className="text-xs font-medium text-brand-700 hover:underline"
            onClick={() => onChange({ ...form, materials: [...form.materials, emptyMaterialLine()] })}
          >
            + {t('addMaterial')}
          </button>
        </div>
        <div className="space-y-2">
          {form.materials.map((line, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_80px_100px_32px]">
              <input
                className="input text-sm"
                placeholder={t('materialName')}
                value={line.name}
                onChange={(e) => updateMaterial(index, { name: e.target.value })}
              />
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="input text-sm"
                placeholder={t('quantity')}
                value={line.quantity}
                onChange={(e) => updateMaterial(index, { quantity: e.target.value })}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                className="input text-sm"
                placeholder={t('unitPrice')}
                value={line.unitPrice}
                onChange={(e) => updateMaterial(index, { unitPrice: e.target.value })}
              />
              <button
                type="button"
                disabled={form.materials.length <= 1}
                onClick={() => onChange({ ...form, materials: form.materials.filter((_, i) => i !== index) })}
                className="rounded-lg border border-slate-200 text-slate-400 hover:bg-white disabled:opacity-30"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>

      <label className="block">
        <span className="mb-1 block text-xs font-medium text-slate-600">{t('settlementNotes')}</span>
        <textarea
          className="input min-h-[60px] text-sm"
          value={form.notes}
          onChange={(e) => onChange({ ...form, notes: e.target.value })}
          placeholder={t('settlementNotesPlaceholder')}
        />
      </label>

      <div className="rounded-lg border border-slate-200 bg-white p-3">
        <div className="flex justify-between text-sm text-slate-600">
          <span>{t('materialsCost')}</span>
          <span className="font-medium text-red-700">−{money(preview.materialsCost)}</span>
        </div>
        <div className="mt-1 flex justify-between text-sm text-slate-600">
          <span>{t('totalExpenses')}</span>
          <span className="font-medium text-red-700">−{money(preview.totalExpenses)}</span>
        </div>
        <div className="mt-2 flex justify-between border-t border-slate-100 pt-2">
          <span className="font-semibold text-slate-800">{t('netProfit')}</span>
          <span className={clsx('text-lg font-bold', preview.netProfit >= 0 ? 'text-green-700' : 'text-red-700')}>
            {money(preview.netProfit)}
          </span>
        </div>
      </div>
    </div>
  );
}
