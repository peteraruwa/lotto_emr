'use client';

import React, { useState } from 'react';
import { Plus, Trash2, FileText, CreditCard, Building2 } from 'lucide-react';
import type { BillingItem, PaymentMode, HmoVerification, FullBillingItem } from '../types';
import { HMO_PROVIDERS } from '../constants';
import { useUpdateBilling } from '../hooks/use-update-billing';

interface InvoiceBuilderProps {
  billing: FullBillingItem;
  onClose?: () => void;
}

const ITEM_TYPES = ['CONSULTATION', 'LAB', 'IMAGING', 'MEDICATION', 'PROCEDURE', 'FOLLOWUP', 'OTHER'] as const;

function generateInvoiceNumber(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const r = Math.floor(Math.random() * 9000) + 1000;
  return `INV-${y}${m}${d}-${r}`;
}

export function InvoiceBuilder({ billing, onClose }: InvoiceBuilderProps) {
  const { billingNote } = billing;
  const update = useUpdateBilling();

  const [items, setItems] = useState<BillingItem[]>(
    billingNote.items.length > 0
      ? billingNote.items
      : [{ id: crypto.randomUUID(), type: 'CONSULTATION', description: 'Consultation Fee', quantity: 1, unitCost: 5000, total: 5000 }]
  );
  const [paymentMode, setPaymentMode] = useState<PaymentMode>(billingNote.paymentMode);
  const [hmoProviderId, setHmoProviderId] = useState<string>(billingNote.hmoVerification?.providerId ?? '');
  const [hmoPolicyNo, setHmoPolicyNo] = useState<string>(billingNote.hmoVerification?.policyNumber ?? '');
  const [hmoEnrolleeId, setHmoEnrolleeId] = useState<string>(billingNote.hmoVerification?.enrolleeId ?? '');
  const [submitting, setSubmitting] = useState(false);

  const total = items.reduce((s, i) => s + i.total, 0);

  function addItem() {
    setItems(prev => [...prev, {
      id: crypto.randomUUID(),
      type: 'LAB',
      description: '',
      quantity: 1,
      unitCost: 0,
      total: 0,
    }]);
  }

  function removeItem(id: string) {
    setItems(prev => prev.filter(i => i.id !== id));
  }

  function updateItem(id: string, field: keyof BillingItem, value: unknown) {
    setItems(prev => prev.map(item => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      if (field === 'quantity' || field === 'unitCost') {
        updated.total = (field === 'quantity' ? (value as number) : item.quantity) * (field === 'unitCost' ? (value as number) : item.unitCost);
      }
      return updated;
    }));
  }

  async function handleGenerateInvoice() {
    setSubmitting(true);
    try {
      const invoiceNumber = billingNote.invoiceNumber ?? generateInvoiceNumber();
      const hmoVerification: HmoVerification | undefined = (paymentMode === 'hmo' || paymentMode === 'nhis') ? {
        providerId: hmoProviderId,
        providerName: HMO_PROVIDERS.find(p => p.id === hmoProviderId)?.name ?? hmoProviderId,
        policyNumber: hmoPolicyNo,
        enrolleeId: hmoEnrolleeId || undefined,
        approved: false,
        verifiedBy: 'manual',
      } : undefined;

      await update.mutateAsync({
        basketId: billing.basketId,
        patch: {
          billingStatus: 'invoiced',
          paymentMode,
          items,
          totalEstimate: total,
          invoiceNumber,
          invoiceDate: new Date().toISOString(),
          hmoVerification,
        },
        auditAction: 'invoice_generated',
        auditDetail: `Invoice ${invoiceNumber} generated. Total: ₦${total.toLocaleString()}`,
      });
      onClose?.();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Payment Mode */}
      <div>
        <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Payment Mode</p>
        <div className="grid grid-cols-4 gap-2">
          {(['cash', 'hmo', 'nhis', 'waiver'] as PaymentMode[]).map(mode => (
            <button
              key={mode}
              type="button"
              onClick={() => setPaymentMode(mode)}
              className={`rounded-lg border-2 p-2.5 text-center transition-colors ${
                paymentMode === mode
                  ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                  : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }`}
            >
              {mode === 'cash'   && <CreditCard className="h-4 w-4 mx-auto mb-1" />}
              {mode === 'hmo'    && <Building2 className="h-4 w-4 mx-auto mb-1" />}
              {mode === 'nhis'   && <Building2 className="h-4 w-4 mx-auto mb-1" />}
              {mode === 'waiver' && <FileText className="h-4 w-4 mx-auto mb-1" />}
              <span className="text-xs font-medium uppercase">{mode}</span>
            </button>
          ))}
        </div>
      </div>

      {/* HMO Details */}
      {(paymentMode === 'hmo' || paymentMode === 'nhis') && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-2">
          <p className="text-xs font-semibold text-blue-700">HMO / Insurance Details</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-gray-600">HMO Provider *</label>
              <select
                value={hmoProviderId}
                onChange={e => setHmoProviderId(e.target.value)}
                className="mt-1 w-full rounded border border-gray-200 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
              >
                <option value="">Select HMO...</option>
                {HMO_PROVIDERS.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-gray-600">Policy / Scheme Number *</label>
              <input
                type="text"
                value={hmoPolicyNo}
                onChange={e => setHmoPolicyNo(e.target.value)}
                placeholder="e.g. HMO-123456"
                className="mt-1 w-full rounded border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
            <div>
              <label className="text-xs text-gray-600">Enrollee ID (optional)</label>
              <input
                type="text"
                value={hmoEnrolleeId}
                onChange={e => setHmoEnrolleeId(e.target.value)}
                placeholder="Enrollee / Card number"
                className="mt-1 w-full rounded border border-gray-200 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          </div>
        </div>
      )}

      {/* Line Items */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold text-gray-500 uppercase">Line Items</p>
          <button
            type="button"
            onClick={addItem}
            className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
          >
            <Plus className="h-3.5 w-3.5" /> Add Item
          </button>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-xs">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 py-2 text-left text-gray-500 font-semibold">Type</th>
                <th className="px-2 py-2 text-left text-gray-500 font-semibold">Description</th>
                <th className="px-2 py-2 text-right text-gray-500 font-semibold w-16">Qty</th>
                <th className="px-2 py-2 text-right text-gray-500 font-semibold w-24">Unit (₦)</th>
                <th className="px-2 py-2 text-right text-gray-500 font-semibold w-24">Total (₦)</th>
                <th className="px-2 py-2 w-8"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-2 py-1.5">
                    <select
                      value={item.type}
                      onChange={e => updateItem(item.id, 'type', e.target.value)}
                      className="w-full rounded border border-gray-200 px-1 py-1 text-xs focus:outline-none"
                    >
                      {ITEM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="text"
                      value={item.description}
                      onChange={e => updateItem(item.id, 'description', e.target.value)}
                      placeholder="Service description..."
                      className="w-full rounded border border-gray-200 px-2 py-1 text-xs focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))}
                      className="w-full rounded border border-gray-200 px-1 py-1 text-xs text-right focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-1.5">
                    <input
                      type="number"
                      min="0"
                      value={item.unitCost}
                      onChange={e => updateItem(item.id, 'unitCost', Number(e.target.value))}
                      className="w-full rounded border border-gray-200 px-1 py-1 text-xs text-right focus:outline-none"
                    />
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono font-medium text-gray-700">
                    {item.total.toLocaleString()}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    {items.length > 1 && (
                      <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2">
              <tr>
                <td colSpan={4} className="px-3 py-2 text-right text-xs font-semibold text-gray-600">TOTAL:</td>
                <td className="px-2 py-2 text-right font-mono font-bold text-base text-gray-900">
                  ₦{total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-2 border-t">
        <button type="button" onClick={onClose} className="text-xs text-gray-500 hover:text-gray-700 font-medium">
          Cancel
        </button>
        <button
          type="button"
          onClick={handleGenerateInvoice}
          disabled={submitting || items.some(i => !i.description.trim()) || ((paymentMode === 'hmo' || paymentMode === 'nhis') && (!hmoProviderId || !hmoPolicyNo))}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <FileText className="h-4 w-4" />
          {submitting ? 'Generating...' : billingNote.invoiceNumber ? 'Update Invoice' : 'Generate Invoice'}
        </button>
      </div>
    </div>
  );
}
